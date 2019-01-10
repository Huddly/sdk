export default class Logger {
    _verbose: boolean;
    constructor(verbose: boolean);
    warn(message: string): void;
    info(message: string): void;
    debug(message: string): void;
    error(string: any): void;
    verbose: boolean;
}
