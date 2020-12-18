const OSS = require('ali-oss');
const { default: fetch } = require('node-fetch');

class AliOss{

    constructor(option){
        this.client = new OSS(option);
        this.chunkTotal = 0;
        this.miniChunkSize = option.miniChunkSize ? option.miniChunkSize : 1024*1024;
        this.currentChunk = null;
    }

    async size(ossObject){
        const headRes = await this.client.head(ossObject);
        return parseInt(headRes.res.headers['content-length']);
    }

    async sizeByProcess(ossObject, process){
        const url = this.client.signatureUrl(ossObject, {
            expires: 3600,
            process
        });

        const res = await fetch(url);
        const buff = await res.buffer();
        return buff.length;
    }

    async getStream(ossObject, outPutStream){
        let objectRes = await this.client.getStream(ossObject);
        objectRes.stream.pipe(outPutStream);
    }

    async getStreamByProcess(ossObject, process, outPutStream){
        let objectRes = await this.client.getStream(ossObject, { process });

        objectRes.stream.pipe(outPutStream);
    }

    async append(ossObject, chunk){

        if(this.currentChunk === null){
            this.currentChunk = chunk;
        }
        else{
            this.currentChunk = Buffer.concat([this.currentChunk, chunk]);
        }

        if(this.currentChunk.length > this.miniChunkSize){
            await this.appendChunk(ossObject);
        }

    }

    async appendFinish(ossObject){
        if(this.currentChunk && this.currentChunk.length > 0){
            await this.appendChunk(ossObject);
        }
    }

    async appendChunk(ossObject){
        await this.client.append(ossObject, this.currentChunk, { position: this.chunkTotal.toString()})
        this.chunkTotal += this.currentChunk.length;

        this.currentChunk = null;
    }

    async abort(ossObject){
        const res = await this.client.delete(ossObject);
        return res;
    }
}

module.exports = AliOss