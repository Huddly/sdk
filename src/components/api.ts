import * as msgpack from 'msgpack-lite';
import http from 'http';

import Locksmith from './locksmith';

import InterpolationParams from '@huddly/sdk-interfaces/lib/interfaces/IInterpolationParams';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import IDeviceCommonApi from '@huddly/sdk-interfaces/lib/interfaces/IDeviceCommonApi';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

/**
 * Control class that implements common functionalities that apply to usb connected Huddly devices.
 *
 * @ignore
 * @class Api
 * @implements {IDeviceCommonApi}
 */
export default class Api implements IDeviceCommonApi {
  transport: IUsbTransport;
  locksmith: Locksmith;

  constructor(transport: IUsbTransport, locksmith: Locksmith) {
    this.transport = transport;
    this.transport.initEventLoop();
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

  async sendAndReceive(payload: Buffer, commands: any, timeout: number = 10000): Promise<any> {
    await this.transport.clear();
    const result = await this.withSubscribe(
      [commands.receive],
      () =>
        new Promise(async (resolve, reject) => {
          this.transport.setEventLoopReadSpeed(1);
          this.transport
            .receiveMessage(commands.receive, timeout)
            .then((reply) => {
              this.transport.setEventLoopReadSpeed();
              resolve(reply);
            })
            .catch((e) => {
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

  async getProductInfo(): Promise<any> {
    const prodInfo = await this.sendAndReceiveMessagePack(
      Buffer.from(''),
      {
        send: 'prodinfo/get_msgpack',
        receive: 'prodinfo/get_msgpack_reply',
      },
      1000
    );
    if (!prodInfo) {
      return Promise.reject('Product info data retreived is empty or undefined!');
    }
    return prodInfo;
  }

  async setProductInfo(newProdInfoData: any): Promise<void> {
    await this.transport.clear();
    await this.sendAndReceive(
      Api.encode(newProdInfoData),
      {
        send: 'prodinfo/set_msgpack',
        receive: 'prodinfo/set_msgpack_reply',
      },
      10000
    );
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
              .then((reply) => {
                const uptimeSeconds = Api.decode(reply.payload, 'double');
                resolve(uptimeSeconds);
              })
              .catch((e) => reject(e));
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

  async getErrorLog(timeout: number, retry: number = 1, allowLegacy: boolean = true): Promise<any> {
    try {
      const result = await this.sendAndReceiveMessagePack(
        Buffer.from(''),
        {
          send: 'error_logger/read_simple',
          receive: 'error_logger/read_simple_reply',
        },
        1000
      );
      if (result.error !== 0) {
        const msg = `Camera returned error on reading error log: ${result.error} ${result.string}`;
        Logger.warn(msg, 'SDK API');
        throw new Error(msg);
      }
      return result.log;
    } catch (e) {
      if (retry > 0) {
        Logger.debug('Retrying getErrorLog', 'SDK API');
        return this.getErrorLog(timeout, retry - 1, allowLegacy);
      } else {
        throw e;
      }
    }
  }

  async eraseErrorLog(timeout: number): Promise<void> {
    Logger.debug('Start erasing the log', 'SDK API');
    await this.locksmith.executeAsyncFunction(async () => {
      await this.transport.clear();
      await this.withSubscribe(
        ['error_logger/erase_done'],
        async () =>
          new Promise<void>(async (resolve, reject) => {
            this.transport
              .receiveMessage('error_logger/erase_done', timeout)
              .then((reply) => {
                Logger.debug('Done erasing error log', 'SDK API');
                resolve();
              })
              .catch((e) => reject(e));
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
  async getAutozoomStatus(timeout: number = 500): Promise<any> {
    const msgpackReply = await this.sendAndReceive(
      Buffer.alloc(0),
      {
        send: 'autozoom/status',
        receive: 'autozoom/status_reply',
      },
      timeout
    );
    const azStatus = Api.decode(msgpackReply.payload, 'messagepack');
    return azStatus;
  }

  async getLatestFirmwareUrl(
    device: string,
    releaseChannel: ReleaseChannel = ReleaseChannel.STABLE
  ): Promise<string> {
    const urlJsonKey = device === 'iq' ? 'url_hpk' : 'url';
    const url = `http://huddlyreleaseserver.azurewebsites.net/releases/${releaseChannel}/latest/${device}`;
    return new Promise((resolve, reject) =>
      http
        .get(url, (res) => {
          const { statusCode } = res;
          const contentType = res.headers['content-type'];

          let error;
          if (statusCode === 204) {
            error = new Error('There are no available firmware packages for this this channel');
          } else if (statusCode !== 200) {
            error = new Error(
              'Failed performing a request to Huddly release server!\n' +
                `Status Code: ${statusCode}`
            );
          } else if (!/^application\/json/.test(contentType)) {
            error = new Error(
              'Invalid content-type.\n' + `Expected application/json but received ${contentType}`
            );
          }

          if (error) {
            res.resume();
            reject(error);
            return;
          }

          res.setEncoding('utf8');
          let rawData = '';
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            const parsedData = JSON.parse(rawData);
            if (Object.keys(parsedData).indexOf(urlJsonKey) === -1) {
              reject(new Error(`JSON content does not contain '${urlJsonKey}' key!`));
            }
            resolve(parsedData[urlJsonKey]);
          });
        })
        .on('error', (e) => {
          reject(new Error(`Request error!\n ${e}`));
        })
    );
  }
}
