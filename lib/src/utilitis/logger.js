"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    constructor(verbose) {
        this._verbose = verbose;
    }
    warn(message) {
        if (this.verbose)
            console.warn(message);
    }
    info(message) {
        if (this.verbose) {
            console.log(message);
        }
    }
    debug(message) {
        if (this.verbose) {
            console.log(message);
        }
    }
    error(string) {
        console.error(string);
    }
    get verbose() {
        return this._verbose;
    }
    set verbose(verbose) {
        this._verbose = verbose;
    }
}
exports.default = Logger;
//# sourceMappingURL=logger.js.map