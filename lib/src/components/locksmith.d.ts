import PQueue from 'p-queue';
export default class Locksmith {
    queue: PQueue;
    constructor();
    executeAsyncFunction(asyncFunction: any): Promise<any>;
}
