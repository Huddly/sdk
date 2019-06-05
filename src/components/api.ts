import ITransport from './../interfaces/iTransport';
import DefaultLogger from './../utilitis/logger';
import * as msgpack from 'msgpack-lite';
import Locksmith from './locksmith';
import InterpolationParams from './../interfaces/InterpolationParams';

export default class Api {
  transport: ITransport;
  logger: DefaultLogger;
  locksmith: Locksmith;
  setProdInfoMsgPackSupport: boolean = true;

  constructor(transport: ITransport, logger: DefaultLogger, locksmith: Locksmith) {
    this.transport = transport;
    this.transport.initEventLoop();
    this.logger = logger;
    this.locksmith = locksmith;
  }

  async sendAndReceiveMessagePack(
    message: any,
    commands: any,
    receiveTimeout: number = 3000
  ): Promise<any> {
    const buffer = Api.encode(message);
    const res: any = await this.locksmith.executeAsyncFunction(async () => {
      const reply = await this.sendAndReceive(buffer, commands, receiveTimeout);
      return reply;
    });
    return Api.decode(res.payload, 'messagepack');
  }

  async sendAndReceiveWithoutLock(cmd: string, options: any = {}) {
    const opts = {
      args: options.args || Buffer.alloc(0),
      timeout: options.timeout || 500,
      receiveEncoding: options.receiveEncoding || 'string',
    };
    const payload = opts.args.length === 0 ? opts.args : Api.encode(opts.args);
    const commands = {
      send: cmd,
      receive: `${cmd}_reply`,
    };

    const reply = await this.sendAndReceive(payload, commands, opts.timeout);
    const resp = Api.decode(reply.payload, opts.receiveEncoding);
    if (!resp.error || resp.error === 0) {
      return resp;
    }
    throw new Error(`Upgrade failed. Cmd: ${cmd}, Error: ${resp.error}, Msg: ${resp.string}`);
  }

  async sendAndReceive(payload: Buffer, commands: any, timeout: number = 500): Promise<any> {
    await this.transport.clear();
    const result = await this.withSubscribe(
      [commands.receive],
      () =>
        new Promise(async (resolve, reject) => {
          this.transport.setEventLoopReadSpeed(1);
          this.transport
            .receiveMessage(commands.receive, timeout)
            .then(reply => {
              this.transport.setEventLoopReadSpeed();
              resolve(reply);
            })
            .catch(e => {
              this.transport.setEventLoopReadSpeed();
              reject(e);
            });
          try {
            await this.transport.write(commands.send, payload);
          } catch (e) {
            reject(e);
          }
        })
    );
    return result;
  }

  async withSubscribe<T>(
    subscribeMessages: string[],
    fn: () => Promise<T>,
    shouldAwaitUnsubscribe: boolean = false
  ): Promise<T> {
    await this.transport.clear();
    // Don't do these subscribes in parallel (Promise.all), as order sometimes matter currently.
    // That's not good, but unfortunatly the way the situation is today.
    for (let i = 0; i < subscribeMessages.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await this.transport.subscribe(subscribeMessages[i]);
    }
    try {
      const result = await fn();
      return result;
    } finally {
      for (let i = 0; i < subscribeMessages.length; i += 1) {
        const unsubscribePromise = this.transport.unsubscribe(subscribeMessages[i]);
        if (shouldAwaitUnsubscribe) {
          await unsubscribePromise;
        }
        this.transport.removeAllListeners(subscribeMessages[i]);
      }
    }
  }

  async fileTransfer(
    data: Buffer,
    subscribedMessages: Array<string>,
    timeout: number = 60000
  ): Promise<any> {
    const clearListeners = () => {
      subscribedMessages.forEach(msg => {
        this.transport.removeAllListeners(msg);
        this.transport.setEventLoopReadSpeed();
        this.logger.debug('Clearing out all file transfer listeners', 'SDK API');
      });
    };

    return new Promise((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        clearListeners();
        this.logger.error(
          `Timing out since file transfer did not resolve after ${timeout} ms`,
          '',
          'SDK API'
        );
        reject(new Error('Timeout'));
      }, timeout);

      this.logger.debug('Setting up async_file_transfer/* listeners', 'SDK API');
      if (subscribedMessages.indexOf('async_file_transfer/data') >= 0) {
        this.transport.on('async_file_transfer/data', async msgPacket => {
          this.transport.setEventLoopReadSpeed(1);
          await this.transport.write('async_file_transfer/data_reply');
          const bufferComposition = Buffer.concat([data, msgPacket.payload]);
          data = bufferComposition;
        });
      }

      if (subscribedMessages.indexOf('async_file_transfer/receive') >= 0) {
        this.transport.on('async_file_transfer/receive', async msgPacket => {
          this.transport.setEventLoopReadSpeed(1);
          if (msgPacket.payload.length !== 4) {
            clearListeners();
            clearTimeout(timeoutTimer);
            reject(new Error('Data length is not 4, unable to proceed!'));
          } else {
            const length = Api.decode(msgPacket.payload, 'int');
            const slice = data.slice(0, length);
            await this.transport.write('async_file_transfer/receive_reply', slice);
            data = data.slice(length);
          }
        });
      }

      if (subscribedMessages.indexOf('async_file_transfer/done') >= 0) {
        this.transport.on('async_file_transfer/done', async buffer => {
          clearListeners();
          clearTimeout(timeoutTimer);
          resolve(data);
        });
      }

      if (subscribedMessages.indexOf('async_file_transfer/timeout') >= 0) {
        this.transport.on('async_file_transfer/timeout', async buffer => {
          clearListeners();
          clearTimeout(timeoutTimer);
          this.logger.debug(
            'Received a async_file_transfer/timeout message from camera. Timing out!',
            'SDK API'
          );
          reject(new Error('Timeout'));
        });
      }
    });
  }

  async asyncFileTransfer(
    command: any,
    data: Buffer = Buffer.alloc(0),
    timeout: number = 5000
  ): Promise<any> {
    const res = await this.locksmith.executeAsyncFunction(async () => {
      const subscribeMsgs = [
        'async_file_transfer/data',
        'async_file_transfer/receive',
        'async_file_transfer/done',
        'async_file_transfer/timeout',
      ];
      const transferRes = await this.withSubscribe(subscribeMsgs, async () => {
        return new Promise(async (resolve, reject) => {
          this.fileTransfer(data, subscribeMsgs)
            .then(result => {
              resolve(result);
            })
            .catch(reason => reject(reason));
          const status = await this.sendAndReceive(
            command.send_data ? command.send_data : Buffer.alloc(0),
            command,
            timeout
          );
          if (!status || !status['payload']) {
            throw Error(
              `Failed to get status. Status: ${JSON.stringify(status)} ${command['send']}`
            );
          }
        });
      });
      return transferRes;
    });
    return res;
  }

  async getProductInfoLegacy(): Promise<any> {
    const command = {
      send: 'prodinfo/get',
      receive: 'prodinfo/get_status',
    };
    const res = await this.asyncFileTransfer(command);
    const prodInfo = Api.decode(res, 'messagepack');
    return prodInfo;
  }

  async getProductInfo(): Promise<any> {
    if (!this.setProdInfoMsgPackSupport) {
      return this.getProductInfoLegacy();
    }

    try {
      const info = await this.sendAndReceiveMessagePack(
        Buffer.from(''),
        {
          send: 'prodinfo/get_msgpack',
          receive: 'prodinfo/get_msgpack_reply',
        },
        1000
      );
      this.setProdInfoMsgPackSupport = true;
      if (!info) {
        this.setProdInfoMsgPackSupport = false;
        return this.getProductInfoLegacy();
      }
      return info;
    } catch (e) {
      this.setProdInfoMsgPackSupport = false;
      this.logger.debug(
        'Prodinfo MessagePack not supported on this device. Using legacy procedure!',
        'SDK API'
      );
      return this.getProductInfoLegacy();
    }
  }

  async setProductInfoLegacy(newProdInfoData: any): Promise<void> {
    await this.locksmith.executeAsyncFunction(async () => {
      const asyncFileTransferMessages = [
        'async_file_transfer/data',
        'async_file_transfer/receive',
        'async_file_transfer/done',
        'async_file_transfer/timeout',
      ];
      const data = Api.encode(newProdInfoData);
      const length = Api.encode({ size: data.length });
      const command = {
        send: 'prodinfo/set',
        send_data: length,
        receive: 'prodinfo/set_done',
      };
      await this.transport.clear();
      try {
        await this.transport.subscribe(command.receive);
        await this.withSubscribe(
          asyncFileTransferMessages,
          async () =>
            new Promise(async (resolve, reject) => {
              this.fileTransfer(data, asyncFileTransferMessages);
              const res = await this.sendAndReceive(
                command.send_data ? command.send_data : Buffer.alloc(0),
                command
              );
              if (res && res.payload) {
                const errorCode = Api.decode(res.payload, 'messagepack');
                if (errorCode === 0) {
                  resolve(true);
                } else {
                  reject(`Set Product Info command failed with error code ${errorCode}`);
                }
              } else {
                reject('No response received from camera during Set Product Info command');
              }
            })
        );
      } finally {
        await this.transport.unsubscribe(command.receive);
      }
    });
  }

  async setProductInfo(newProdInfoData: any): Promise<void> {
    if (!this.setProdInfoMsgPackSupport) {
      return this.setProductInfoLegacy(newProdInfoData);
    }

    try {
      await this.transport.clear();
      await this.sendAndReceive(
        Api.encode(newProdInfoData),
        {
          send: 'prodinfo/set_msgpack',
          receive: 'prodinfo/set_msgpack_reply',
        },
        10000
      );
      return Promise.resolve();
    } catch (e) {
      this.setProdInfoMsgPackSupport = false;
      this.logger.debug(
        'SetProdinfo MessagePack not supported on this device. Using legacy procedure!',
        'SDK API'
      );
      return this.setProductInfoLegacy(newProdInfoData);
    }
  }

  static encode(payload: any): Buffer {
    if (payload instanceof Buffer) {
      return payload;
    }
    return msgpack.encode(payload);
  }

  static decode(payload: Buffer, type = 'string'): any {
    const assignedType = type === undefined ? 'string' : type;
    if (payload.length === 0) return undefined;
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

  async getUptime(): Promise<any> {
    const res = await this.locksmith.executeAsyncFunction(async () => {
      await this.transport.clear();
      const result = await this.withSubscribe(
        ['camctrl/uptime_reply'],
        async () =>
          new Promise(async (resolve, reject) => {
            this.transport
              .receiveMessage('camctrl/uptime_reply')
              .then(reply => {
                const uptimeSeconds = Api.decode(reply.payload, 'double');
                resolve(uptimeSeconds);
              })
              .catch(e => reject(e));
            this.transport.write('camctrl/uptime');
          })
      );
      return result;
    });
    return res;
  }

  async getCameraInfo(): Promise<any> {
    const prodInfo = await this.getProductInfo();
    const uptime = await this.getUptime();
    const info = {
      softwareVersion: prodInfo.app_version,
      uptime: Math.round(uptime * 100) / 100, // 2 floating point decimals
    };
    return info;
  }

  async getErrorLog(timeout: number): Promise<any> {
    this.logger.debug('Start retrieving the error log', 'SDK API');
    const res = await this.locksmith.executeAsyncFunction(async () => {
      this.logger.debug('Clearing transport pipes', 'SDK API');
      await this.transport.clear();
      const subscribeMsgs = [
        'async_file_transfer/data',
        'async_file_transfer/done',
        'async_file_transfer/timeout',
      ];

      const result = await this.withSubscribe(
        subscribeMsgs,
        async () => {
          return new Promise((resolve, reject) => {
            this.fileTransfer(Buffer.alloc(0), subscribeMsgs, timeout)
              .then(result => {
                resolve(result.toString('ascii'));
              })
              .catch(reason => reject(reason));
            this.logger.debug('Sending "error_logger/read" message', 'SDK API');
            this.transport.write('error_logger/read');
          });
        },
        true
      );
      return result;
    });
    return res;
  }

  async eraseErrorLog(timeout: number): Promise<void> {
    this.logger.debug('Start erasing the log', 'SDK API');
    await this.locksmith.executeAsyncFunction(async () => {
      await this.transport.clear();
      await this.withSubscribe(
        ['error_logger/erase_done'],
        async () =>
          new Promise(async (resolve, reject) => {
            this.transport
              .receiveMessage('error_logger/erase_done', timeout)
              .then(reply => {
                this.logger.debug('Done erasing error log', 'SDK API');
                resolve();
              })
              .catch(e => reject(e));
            this.transport.write('error_logger/erase');
          }),
        true
      );
    });
  }

  setInterpolationParameters(params: InterpolationParams): void {
    const paramsFloatArr: Float32Array = new Float32Array(4);
    paramsFloatArr[0] = params.x1;
    paramsFloatArr[1] = params.y1;
    paramsFloatArr[2] = params.x2;
    paramsFloatArr[3] = params.y2;
    const payloadBuffer = Buffer.from(paramsFloatArr.buffer);
    this.transport.write('interpolator/set_params', payloadBuffer);
  }

  async getInterpolationParameters(): Promise<InterpolationParams> {
    const res = await this.sendAndReceiveMessagePack('', {
      send: 'interpolator/get_params',
      receive: 'interpolator/get_params_reply',
    });
    return res;
  }

  /**
   * Convenience function that is used to fetch the status of
   * genius framing on the camera. Includes information such as
   * whether genius framing is running, the time passed since it
   * is enabled and so on.
   *
   * @returns {Promise<any>} Returns an object with the status properties
   * and values.
   * @memberof Api
   */
  async getAutozoomStatus(): Promise<any> {
    const msgpackReply = await this.sendAndReceive(Buffer.alloc(0), {
      send: 'autozoom/status',
      receive: 'autozoom/status_reply',
    });
    const azStatus = Api.decode(msgpackReply.payload, 'messagepack');
    return azStatus;
  }
}
