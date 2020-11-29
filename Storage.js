module.exports = {
    instance: (storage, option) => {
        const NsStorage = require(`./Storage/${storage}`);

        return new NsStorage(option);
    }
};