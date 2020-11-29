
const COS = require('cos-nodejs-sdk-v5');

class TencentCos{

    constructor(option){
        this.client = new COS(option);
        
        this.bucket = option.Bucket;
        this.region = option.Region;
        this.miniChunkSize = 1024*1024;

        this.initMultipart();
    }

    async size(cosObject){        
        const data = await this.promiseWrap(this.client.headObject, {
            Bucket: this.bucket,
            Region: this.region,
            Key: cosObject
        });
        return parseInt(data.headers['content-length']);
    }

    async getStream(cosObject, outputStream){
        const resStream = this.client.getObjectStream({
            Bucket: this.bucket,
            Region: this.region,
            Key: cosObject
        });
        resStream.pipe(outputStream);
    }

    promiseWrap(fn, param){
        return new Promise((resolve, reject) => {
            fn.call(this.client, param, (err, data) => {
                if(err){
                    reject(err);
                }
                else{
                    resolve(data);
                }
            })
        });
    }

    async append(cosObject, chunk){
        if(!this.multipartUploadId){
            const data = await this.promiseWrap(this.client.multipartInit, {
                Bucket: this.bucket,
                Region: this.region,
                Key: cosObject
            });
            this.multipartUploadId = data.UploadId;
        }

        if(this.currentChunk === null){
            this.currentChunk = chunk;
        }
        else{
            this.currentChunk = Buffer.concat([this.currentChunk, chunk]);
        }

        if(this.currentChunk.length > this.miniChunkSize){
            
            await this.uploadMultipart(cosObject);
        }
        
    }

    async uploadMultipart(cosObject){
        const data = await this.promiseWrap(this.client.multipartUpload, {
            Bucket: this.bucket,
            Region: this.region,
            Key: cosObject,
            ContentLength: this.currentChunk.length.toString(),
            UploadId: this.multipartUploadId,
            PartNumber: this.multipartNumber.toString(),
            Body: this.currentChunk
        });

        if(data){
            this.multiparts.push({
                PartNumber: this.multipartNumber.toString(),
                ETag: data.ETag
            });

            this.multipartNumber++;

            this.currentChunk = null;
        }
    }

    async appendFinish(cosObject){
        if(this.currentChunk.length > 0){
            await this.uploadMultipart(cosObject);
        }

        const data = await this.promiseWrap(this.client.multipartComplete, {
            Bucket: this.bucket,
            Region: this.region,
            Key: cosObject,
            UploadId: this.multipartUploadId,
            Parts: this.multiparts
        });

        this.initMultipart();
        return data;
    }

    initMultipart(){
        this.multipartUploadId = null;
        this.multipartNumber = 1;
        this.multiparts = [];
        this.currentChunk = null;
    }
}

module.exports = TencentCos;