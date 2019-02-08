/// <reference types="node" />
import ITransport from './../interfaces/iTransport';
import DefaultLogger from './../utilitis/logger';
import Locksmith from './locksmith';
export default class Api {
    transport: ITransport;
    logger: DefaultLogger;
    locksmith: Locksmith;
    setProdInfoMsgPackSupport: boolean;
    constructor(transport: ITransport, logger: DefaultLogger, locksmith: Locksmith);
    sendAndReceiveMessagePack(message: any, commands: any, receiveTimeout?: number): Promise<any>;
    sendAndReceiveWithoutLock(cmd: string, options?: any): Promise<any>;
    sendAndReceive(payload: Buffer, commands: any, timeout?: number): Promise<any>;
    withSubscribe(subscribeMessages: Array<string>, fn: any): Promise<any>;
    fileTransfer(data: Buffer, subscribedMessages: Array<string>): Promise<any>;
    asyncFileTransfer(command: any, data?: Buffer, timeout?: number): Promise<any>;
    getProductInfoLegacy(): Promise<any>;
    getProductInfo(): Promise<any>;
    setProductInfoLegacy(newProdInfoData: any): Promise<void>;
    setProductInfo(newProdInfoData: any): Promise<void>;
    static encode(payload: any): Buffer;
    static decode(payload: Buffer, type?: string): any;
    getUptime(): Promise<any>;
    getCameraInfo(): Promise<any>;
    getErrorLog(): Promise<any>;
    eraseErrorLog(): Promise<void>;
}
