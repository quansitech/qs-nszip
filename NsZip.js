const storage = require('./Storage');
const { Writable, Transform } = require('stream');
const archiver = require('archiver');

class NsZip{

    constructor(nsType, options){
        
        this.client = storage.instance(nsType, options);

        this.archive =  archiver('zip', { zlib: { level: 9 } });

        this.files = [];
        this.events = {};
        this.eachZipUploadStream = null;
        this.abort = false;
        this.currentSize = 0;
        this.totalSize = 0;
    }

    async total(){
        let total = 0
        for(const file of this.files){
            let fileSize = await this.client.size(file)
            total += fileSize
        }
        return total;
    }

    attach(objects, zipObject){
        this.files = objects;
        this.zipObject = zipObject;
    }

    async run(){

        const uploadStream = this.makeUploadStream();
        
        this.archive.pipe(uploadStream);

        let err;
        [err, this.totalSize] = await this.errorCatch(this, this.total);
        
        if(err){
            return this.triggerError(err);
        }

        for(const file of this.files){
            const progressStream = this.makeTransform();

            await this.client.getStream(file, progressStream);
            this.archive.append(progressStream, { name: file.split('/').pop() });
        }
        this.archive.finalize();
    }

    makeUploadStream(){
        const that = this;

        const uploadStream = new Writable({

            async write(chunk, encoding, callback) {

                if(that.abort){
                    this.destroy();
                }
                
                let [err] = await that.errorCatch(that.client, that.client.append, that.zipObject, chunk);
                if(err){
                    this.destroy(err);
                }
                
                callback();
            }
        });

        uploadStream.on('error', async (err) => {
            this.clearUploaded();
            
            if(err){
                this.triggerError(err);
            }

            this.abort = true;
        });
        
        uploadStream.on('finish', async () => {
            let [err] = await this.errorCatch(this.client, this.client.appendFinish, this.zipObject);
            if(err){
                return this.triggerError(err);
            }

            this.finish();
        });

        return uploadStream;

    }

    makeTransform(){
        const that = this;
        const progressStream = new Transform({

            transform(chunk, encoding, callback) {
                if(that.abort){
                    this.destroy();
                }

                this.push(chunk);
                that.currentSize += chunk.length;
                if(typeof that.events['progress'] == 'function'){
                    that.events['progress'].call(that, (that.currentSize / that.totalSize * 100).toFixed(2));
                }
                callback();
            }
        });

        progressStream.on('error', async (err) => {
            if(err){
                this.triggerError(err);
            }

            this.archive.abort();
        });

        return progressStream;
    }

    eachZip(readable, fileName, zipObject){
        const that = this;
        this.zipObject = zipObject;

        if(this.eachZipUploadStream === null){
            this.eachZipUploadStream = this.makeEachZipUploadStream();

            this.archive.pipe(this.eachZipUploadStream);
        }

        this.archive.append(readable, { name: fileName });
    }

    makeEachZipUploadStream(){
        const that = this;
        const writeStream = new Writable({

            async write(chunk, encoding, callback) {
                if(that.abort){
                    this.destroy();
                }

                let [err] = await that.errorCatch(that.client, that.client.append, that.zipObject, chunk);
                if(err){
                    this.destroy(err);
                }
                
                callback();
            }
        });

        writeStream.on('error', async (err) => {
            this.clearUploaded();
            
            if(err){
                this.triggerError(err);
            }

            this.abort = true;
        });

        writeStream.on('finish', async () => {
            let [err] = await this.errorCatch(this.client, this.client.appendFinish, this.zipObject);
            if(err){
                return this.triggerError(err);
            }

            this.finish();
        });

        return writeStream;
    }


    eachZipFinish(){
        this.archive.finalize();
    }

    abortZip(){
        this.abort = true;
        if(typeof this.events['abort'] == 'function'){
            this.events['abort'].call(this);
        }
    }

    on(event, cb){
        this.events[event] = cb;
    }

    clearUploaded(){
        setTimeout(async () => {
            let [err] = await this.errorCatch(this.client, this.client.abort, this.zipObject);

            if(err){
                this.triggerError(err);
            }
        }, 1000);
    }

    async errorCatch(obj, fn, ...param){
        try{
            return [null, await fn.apply(obj, param)];
        }
        catch(e){
            return [e, null];
        }
    }

    triggerError(err){
        if(typeof this.events['error'] == 'function'){
            this.events['error'].call(this, err);
        }

        this.destroy();
    }

    finish(){
        if(typeof this.events['finish'] == 'function'){
            this.events['finish'].call(this);
        }

        this.destroy();
    }

    destroy(){
        this.client = null;

        this.archive =  null;

        this.files = [];
        this.events = {};
        this.eachZipUploadStream = null;
        this.abort = false;
        this.currentSize = 0;
        this.totalSize = 0;
    }
}

module.exports = NsZip;