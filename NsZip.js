const storage = require('./Storage');
const { Writable, Transform } = require('stream');
const archiver = require('archiver');

class NsZip{

    constructor(nsType, options){
        this.client = storage.instance(nsType, options);

        this.archive =  archiver('zip', { zlib: { level: 9 } });

        this.files = [];
        this.events = {};
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
        const that = this;

        const uploadStream = new Writable({

            async write(chunk, encoding, callback) {
                
                await that.client.append(that.zipObject, chunk)
                
                callback();
            }
        });
        
        uploadStream.on('finish', async () => {
            await this.client.appendFinish(this.zipObject);

            if(typeof this.events['finish'] == 'function'){
                this.events['finish'].call(this);
            }
        });

        this.archive.pipe(uploadStream);

        let currentSize = 0;
        const totalSize = await this.total();

        for(const file of this.files){
            const progressStream = new Transform({

                transform(chunk, encoding, callback) {
                    this.push(chunk);
                    currentSize += chunk.length;
                    if(typeof that.events['progress'] == 'function'){
                        that.events['progress'].call(that, (currentSize / totalSize * 100).toFixed(2));
                    }
                    callback();
                }
            });

            await this.client.getStream(file, progressStream);
            this.archive.append(progressStream, { name: file.split('/').pop() });
        }
        this.archive.finalize();
    }

    on(event, cb){
        this.events[event] = cb;
    }
}

module.exports = NsZip;





