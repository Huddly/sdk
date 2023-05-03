import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import * as grpc from '@grpc/grpc-js';

import Api from '../api';
import Locksmith from '../locksmith';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

class Decoder {
  static decode(bytes) {
    const d = new TextDecoder();
    return d.decode(bytes);
  }
}

class CustomServiceError implements grpc.StatusObject, Error {
  name: string;
  message: string;
  stack?: string;
  code: grpc.status | number;
  details: string = '';
  metadata: grpc.Metadata = new grpc.Metadata();

  constructor(message: string, code: number) {
    this.name = {
      1: 'CANCELLED',
      2: 'UNKNOWN',
      3: 'INVALID_ARGUMENT',
      4: 'DEADLINE_EXCEEDED',
      5: 'NOT_FOUND',
      6: 'ALREADY_EXISTS',
      7: 'PERMISSION_DENIED',
      8: 'RESOURCE_EXHAUSTED',
      9: 'FAILED_PRECONDITION',
      10: 'ABORTED',
      11: 'OUT_OF_RANGE',
      12: 'UNIMPLEMENTED',
      13: 'INTERNAL',
      14: 'UNAVAILABLE',
      15: 'DATA_LOSS',
      16: 'UNAUTHENTICATED',
      100: 'GRPC_STATUS_CALL_FAILED',
      101: 'GRPC_STATUS_NO_CAMERA',
    }[code];

    this.code = code;
    this.message = message;
  }
}

type NormalRPCResponse = {
  response: Buffer;
  status_code: number;
  status_error_message: string;
};

class HuddlyGrpcTunnelClient {
  usbTransport: IUsbTransport;
  api: Api;

  constructor(usbTransport: IUsbTransport, lockSmith: Locksmith) {
    this.usbTransport = usbTransport;
    this.api = new Api(usbTransport, lockSmith);
  }

  get empty() {
    return new Empty().toArray();
  }

  async normalRPC(
    grpcMethod: string,
    request: string,
    timeout: number = 5000
  ): Promise<NormalRPCResponse> {
    const fullGrpcMethod = `/huddly.HuddlyService/${grpcMethod}`;
    const payload = {
      rpc_method_name: fullGrpcMethod,
      request,
    };
    const reply = await this.api.sendAndReceiveMessagePack(
      payload,
      {
        send: 'grpc/normal_rpc',
        receive: 'grpc/normal_rpc_reply',
      },
      timeout
    );
    return reply;
  }

  getError({ status_code, status_error_message }: NormalRPCResponse) {
    if (status_code === 0) {
      return undefined;
    }
    return new CustomServiceError(status_error_message, status_code);
  }

  waitForReady() {
    return;
  }
  close() {
    this.usbTransport.close();
  }
  async getDeviceVersion(request, callback: Function) {
    const reply = await this.normalRPC('GetDeviceVersion', '');
    const error = this.getError(reply);
    callback(error, huddly.DeviceVersion.deserializeBinary(reply.response));
  }

  getLogFiles() {
    throw new Error('Not Support');
    return {
      on: () => {},
    };
  }

  async eraseLogFile(request: huddly.LogFile, callback: Function) {
    const reply = await this.normalRPC('EraseLogFile', JSON.stringify(request.toObject()));
    const error = this.getError(reply);
    callback(error, huddly.DeviceStatus.deserializeBinary(reply.response));
  }

  reset() {
    throw new Error('Not Supported.');
  }
  async getCnnFeatureStatus(request: huddly.CnnFeature, callback: Function) {
    const reply = await this.normalRPC(
      'GetCnnFeatureStatus',
      Decoder.decode(request.serializeBinary())
    );
    const error = this.getError(reply);
    callback(error, huddly.CNNStatus.deserializeBinary(reply.response));
  }

  async getTemperatures(request: Empty, callback: Function) {
    const reply = await this.normalRPC('GetTemperatures', '');
    const error = this.getError(reply);
    callback(error, huddly.Temperatures.deserializeBinary(reply.response));
  }
  async getBootSlot(request: Empty, callback: Function) {
    const reply = await this.normalRPC('GetBootSlot', '');
    const error = this.getError(reply);
    callback(error, huddly.BootSlot.deserializeBinary(reply.response));
  }
  async getUptime(request: Empty, callback: Function) {
    const reply = await this.normalRPC('GetUptime', '');
    const error = this.getError(reply);
    callback(error, huddly.Uptime.deserializeBinary(reply.response));
  }

  async getSaturation(request: Empty, callback: Function) {
    const reply = await this.normalRPC('GetSaturation', '');
    const error = this.getError(reply);
    callback(error, huddly.Saturation.deserializeBinary(reply.response));
  }

  async setSaturation(request: huddly.Saturation, callback: Function) {
    const reply = await this.normalRPC('SetSaturation', Decoder.decode(request.serializeBinary()));
    const error = this.getError(reply);
    callback(error, huddly.Saturation.deserializeBinary(reply.response));
  }

  async getBrightness(request: Empty, callback: Function) {
    const reply = await this.normalRPC('GetBrightness', '');
    const error = this.getError(reply);
    callback(error, huddly.Brightness.deserializeBinary(reply.response));
  }

  async setBrightness(request: huddly.Brightness, callback: Function) {
    const reply = await this.normalRPC('SetBrightness', Decoder.decode(request.serializeBinary()));
    const error = this.getError(reply);
    callback(error, huddly.Brightness.deserializeBinary(reply.response));
  }

  async getPTZ(request: Empty, callback: Function) {
    const reply = await this.normalRPC('GetPTZ', '');
    const error = this.getError(reply);
    callback(error, huddly.PTZ.deserializeBinary(reply.response));
  }
  async setPTZ(request: huddly.PTZ, callback: Function) {
    const reply = await this.normalRPC('SetPTZ', Decoder.decode(request.serializeBinary()));
    const error = this.getError(reply);
    callback(error, huddly.DeviceStatus.deserializeBinary(reply.response));
  }
  async getOptionCertificates(request: Empty, callback: Function) {
    const reply = await this.normalRPC('GetOptionCertificates', '');
    const error = this.getError(reply);
    callback(error, huddly.OptionCertificates.deserializeBinary(reply.response));
  }

  upgradeDevice() {
    throw new Error();
    return {} as grpc.ClientWritableStream<huddly.Chunk>;
  }
  upgradeVerify() {
    return {} as grpc.ClientWritableStream<huddly.Chunk>;
  }
}

export default HuddlyGrpcTunnelClient;
