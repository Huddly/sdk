"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const msgpack = __importStar(require("msgpack-lite"));
class Api {
    constructor(transport, logger, locksmith) {
        this.setProdInfoMsgPackSupport = true;
        this.transport = transport;
        this.transport.initEventLoop();
        this.logger = logger;
        this.locksmith = locksmith;
    }
    sendAndReceiveMessagePack(message, commands, receiveTimeout = 3000) {
        return __awaiter(this, void 0, void 0, function* () {
            const buffer = Api.encode(message);
            const res = yield this.locksmith.executeAsyncFunction(() => __awaiter(this, void 0, void 0, function* () {
                const reply = yield this.sendAndReceive(buffer, commands, receiveTimeout);
                return reply;
            }));
            return Api.decode(res.payload, 'messagepack');
        });
    }
    sendAndReceiveWithoutLock(cmd, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const opts = {
                args: options.args || Buffer.alloc(0),
                timeout: options.timeout || 500,
                receiveEncoding: options.receiveEncoding || 'string',
            };
            const payload = opts.args.length === 0 ?
                opts.args : Api.encode(opts.args);
            const commands = {
                send: cmd,
                receive: `${cmd}_reply`,
            };
            const reply = yield this.sendAndReceive(payload, commands, opts.timeout);
            const resp = Api.decode(reply.payload, opts.receiveEncoding);
            if (!resp.error || resp.error === 0) {
                return resp;
            }
            throw new Error(`Upgrade failed. Cmd: ${cmd}, Error: ${resp.error}, Msg: ${resp.string}`);
        });
    }
    sendAndReceive(payload, commands, timeout = 500) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.transport.clear();
            const result = yield this.withSubscribe([commands.receive], () => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this.transport.setEventLoopReadSpeed(1);
                this.transport.receiveMessage(commands.receive, timeout)
                    .then((reply) => {
                    this.transport.setEventLoopReadSpeed();
                    resolve(reply);
                })
                    .catch((e) => {
                    this.transport.setEventLoopReadSpeed();
                    reject(e);
                });
                try {
                    yield this.transport.write(commands.send, payload);
                }
                catch (e) {
                    reject(e);
                }
            })));
            return result;
        });
    }
    withSubscribe(subscribeMessages, fn) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.transport.clear();
            for (let i = 0; i < subscribeMessages.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                yield this.transport.subscribe(subscribeMessages[i]);
            }
            try {
                const result = yield fn();
                return result;
            }
            finally {
                for (let i = 0; i < subscribeMessages.length; i += 1) {
                    // eslint-disable-next-line no-await-in-loop
                    this.transport.unsubscribe(subscribeMessages[i]);
                    this.transport.removeAllListeners(subscribeMessages[i]);
                }
            }
        });
    }
    fileTransfer(data, subscribedMessages) {
        return __awaiter(this, void 0, void 0, function* () {
            const clearListeners = () => {
                subscribedMessages.forEach((msg) => {
                    this.transport.removeAllListeners(msg);
                    this.transport.setEventLoopReadSpeed();
                });
            };
            return new Promise((resolve, reject) => {
                if (subscribedMessages.indexOf('async_file_transfer/data') >= 0) {
                    this.transport.on('async_file_transfer/data', (msgPacket) => __awaiter(this, void 0, void 0, function* () {
                        this.transport.setEventLoopReadSpeed(1);
                        yield this.transport.write('async_file_transfer/data_reply');
                        const bufferComposition = Buffer.concat([data, msgPacket.payload]);
                        data = bufferComposition;
                    }));
                }
                if (subscribedMessages.indexOf('async_file_transfer/receive') >= 0) {
                    this.transport.on('async_file_transfer/receive', (msgPacket) => __awaiter(this, void 0, void 0, function* () {
                        this.transport.setEventLoopReadSpeed(1);
                        if (msgPacket.payload.length !== 4) {
                            clearListeners();
                            reject('Data lenght is not 4, unable to proceed!');
                        }
                        else {
                            const length = Api.decode(msgPacket.payload, 'int');
                            const slice = data.slice(0, length);
                            yield this.transport.write('async_file_transfer/receive_reply', slice);
                            data = data.slice(length);
                        }
                    }));
                }
                if (subscribedMessages.indexOf('async_file_transfer/done') >= 0) {
                    this.transport.on('async_file_transfer/done', (buffer) => __awaiter(this, void 0, void 0, function* () {
                        clearListeners();
                        resolve(data);
                    }));
                }
                if (subscribedMessages.indexOf('async_file_transfer/timeout') >= 0) {
                    this.transport.on('async_file_transfer/timeout', (buffer) => __awaiter(this, void 0, void 0, function* () {
                        clearListeners();
                        reject('Error log transfer timed out');
                    }));
                }
            });
        });
    }
    asyncFileTransfer(command, data = Buffer.alloc(0), timeout = 5000) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.locksmith.executeAsyncFunction(() => __awaiter(this, void 0, void 0, function* () {
                const subscribeMsgs = ['async_file_transfer/data', 'async_file_transfer/receive', 'async_file_transfer/done', 'async_file_transfer/timeout'];
                const transferRes = yield this.withSubscribe(subscribeMsgs, () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                        this.fileTransfer(data, subscribeMsgs).then((result) => {
                            resolve(result);
                        }).catch((reason) => reject(reason));
                        const status = yield this.sendAndReceive((command.send_data ? command.send_data : Buffer.alloc(0)), command, timeout);
                        if (!status || !status['payload']) {
                            throw Error(`Failed to get status. Status: ${JSON.stringify(status)} ${command['send']}`);
                        }
                    }));
                }));
                return transferRes;
            }));
            return res;
        });
    }
    getProductInfoLegacy() {
        return __awaiter(this, void 0, void 0, function* () {
            const command = {
                send: 'prodinfo/get',
                receive: 'prodinfo/get_status',
            };
            const res = yield this.asyncFileTransfer(command);
            const prodInfo = Api.decode(res, 'messagepack');
            return prodInfo;
        });
    }
    getProductInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.setProdInfoMsgPackSupport) {
                return this.getProductInfoLegacy();
            }
            try {
                const info = yield this.sendAndReceiveMessagePack(Buffer.from(''), {
                    send: 'prodinfo/get_msgpack', receive: 'prodinfo/get_msgpack_reply'
                }, 1000);
                this.setProdInfoMsgPackSupport = true;
                if (!info) {
                    this.setProdInfoMsgPackSupport = false;
                    return this.getProductInfoLegacy();
                }
                return info;
            }
            catch (e) {
                this.setProdInfoMsgPackSupport = false;
                this.logger.warn('Prodinfo MessagePack not supported on this device. Using legacy procedure!');
                return this.getProductInfoLegacy();
            }
        });
    }
    setProductInfoLegacy(newProdInfoData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.locksmith.executeAsyncFunction(() => __awaiter(this, void 0, void 0, function* () {
                const asyncFileTransferMessages = ['async_file_transfer/data', 'async_file_transfer/receive', 'async_file_transfer/done', 'async_file_transfer/timeout'];
                const data = Api.encode(newProdInfoData);
                const length = Api.encode({ size: data.length });
                const command = {
                    send: 'prodinfo/set',
                    send_data: length,
                    receive: 'prodinfo/set_done',
                };
                yield this.transport.clear();
                try {
                    yield this.transport.subscribe(command.receive);
                    yield this.withSubscribe(asyncFileTransferMessages, () => __awaiter(this, void 0, void 0, function* () {
                        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                            this.fileTransfer(data, asyncFileTransferMessages);
                            const res = yield this.sendAndReceive(command.send_data ? command.send_data : Buffer.alloc(0), command);
                            if (res && res.payload) {
                                const errorCode = Api.decode(res.payload, 'messagepack');
                                if (errorCode === 0) {
                                    resolve(true);
                                }
                                else {
                                    reject(`Set Product Info command failed with error code ${errorCode}`);
                                }
                            }
                            else {
                                reject('No response received from camera during Set Product Info command');
                            }
                        }));
                    }));
                }
                finally {
                    yield this.transport.unsubscribe(command.receive);
                }
            }));
        });
    }
    setProductInfo(newProdInfoData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.setProdInfoMsgPackSupport) {
                return this.setProductInfoLegacy(newProdInfoData);
            }
            try {
                yield this.transport.clear();
                yield this.sendAndReceive(Api.encode(newProdInfoData), {
                    send: 'prodinfo/set_msgpack',
                    receive: 'prodinfo/set_msgpack_reply'
                }, 10000);
                return Promise.resolve();
            }
            catch (e) {
                this.setProdInfoMsgPackSupport = false;
                this.logger.warn('SetProdinfo MessagePack not supported on this device. Using legacy procedure!');
                return this.setProductInfoLegacy(newProdInfoData);
            }
        });
    }
    static encode(payload) {
        if (payload instanceof Buffer) {
            return payload;
        }
        return msgpack.encode(payload);
    }
    static decode(payload, type = 'string') {
        const assignedType = type === undefined ? 'string' : type;
        if (payload.length === 0)
            return undefined;
        if (payload instanceof Buffer) {
            switch (assignedType) {
                case 'string':
                    return payload.toString('utf8');
                case 'messagepack':
                    return msgpack.decode(payload);
                case 'int':
                    return payload.readUInt32LE(0);
                case 'double':
                    return payload.readDoubleLE(0);
                default:
                    throw new Error(`Cannot decode buffer for type: ${type}`);
            }
        }
        return payload;
    }
    getUptime() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.locksmith.executeAsyncFunction(() => __awaiter(this, void 0, void 0, function* () {
                yield this.transport.clear();
                const result = yield this.withSubscribe(['camctrl/uptime_reply'], () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                        this.transport.receiveMessage('camctrl/uptime_reply')
                            .then((reply) => {
                            const uptimeSeconds = Api.decode(reply.payload, 'double');
                            resolve(uptimeSeconds);
                        })
                            .catch((e) => reject(e));
                        this.transport.write('camctrl/uptime');
                    }));
                }));
                return result;
            }));
            return res;
        });
    }
    getCameraInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const prodInfo = yield this.getProductInfo();
            const uptime = yield this.getUptime();
            const info = {
                softwareVersion: prodInfo.app_version,
                uptime: Math.round(uptime * 100) / 100,
            };
            return info;
        });
    }
    getErrorLog() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.locksmith.executeAsyncFunction(() => __awaiter(this, void 0, void 0, function* () {
                yield this.transport.clear();
                const subscribeMsgs = ['async_file_transfer/data', 'async_file_transfer/done', 'async_file_transfer/timeout'];
                const result = yield this.withSubscribe(subscribeMsgs, () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((resolve, reject) => {
                        this.fileTransfer(Buffer.alloc(0), subscribeMsgs).then((result) => {
                            resolve(result.toString('ascii'));
                        }).catch((reason) => reject(reason));
                        this.transport.write('error_logger/read');
                    });
                }));
                return result;
            }));
            return res;
        });
    }
    eraseErrorLog() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('Start erasing log');
            yield this.locksmith.executeAsyncFunction(() => __awaiter(this, void 0, void 0, function* () {
                yield this.transport.clear();
                const timeoutMs = 60000;
                yield this.withSubscribe(['error_logger/erase_done'], () => __awaiter(this, void 0, void 0, function* () {
                    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                        this.transport.receiveMessage('error_logger/erase_done', timeoutMs)
                            .then((reply) => {
                            this.logger.info('Done erasing error log');
                            resolve();
                        })
                            .catch((e) => reject(e));
                        this.transport.write('error_logger/erase');
                    }));
                }));
            }));
        });
    }
}
exports.default = Api;
//# sourceMappingURL=api.js.map