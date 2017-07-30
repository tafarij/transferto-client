module.exports = class TransfertoError extends Error {
    constructor(msg, code) {
        super(msg);
        this.name = this.constructor.name;
        this.code = code;
    }
};
