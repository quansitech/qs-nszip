const OSS = require('ali-oss');

class AliOss{

    constructor(option){
        this.client = new OSS(option);
        this.chunkTotal = 0;
        this.miniChunkSize = 1024*1024;
        this.currentChunk = null;
    }

    async size(ossObject){
        const headRes = await this.client.head(ossObject);
        return parseInt(headRes.res.headers['content-length']);
   }

    async getStream(ossObject, outputStream){
        let objectRes = await this.client.getStream(ossObject);

        objectRes.stream.pipe(outputStream);
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