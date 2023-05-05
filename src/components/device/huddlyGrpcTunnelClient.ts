import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import * as grpc from '@grpc/grpc-js';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

import GrpcTunnelServiceError from '../../error/GrpcTunnelServiceError';
import Locksmith from '../locksmith';
import Api from '../api';

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

  prepareSerializedGRPCRequest(bytes: Uint8Array) {
    const d = new TextDecoder();
    return d.decode(bytes);
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
    return new GrpcTunnelServiceError(status_error_message, status_code);
  }

  async runNormalRPCCommand(
    cmdString: string,
    request: string,
    callback: Function,
    deserializer: Function
  ) {
    const reply = await this.normalRPC(cmdString, request);
    const error = this.getError(reply);
    callback(error, deserializer(reply.response));
  }

  waitForReady() {
    return;
  }
  close() {
    this.usbTransport.close();
  }
  getDeviceVersion(request, callback: Function) {
    this.runNormalRPCCommand(
      'GetDeviceVersion',
      '',
      callback,
      huddly.DeviceVersion.deserializeBinary
    );
  }

  getLogFiles() {
    throw new Error('Not Support');
    return {
      on: () => {},
    };
  }

  eraseLogFile(request: huddly.LogFile, callback: Function) {
    this.runNormalRPCCommand(
      'eraseLogFile',
      this.prepareSerializedGRPCRequest(request.serializeBinary()),
      callback,
      huddly.DeviceStatus.deserializeBinary
    );
  }

  reset() {
    throw new Error('Not Supported.');
  }

  getCnnFeatureStatus(request: huddly.CnnFeature, callback: Function) {
    this.runNormalRPCCommand(
      'GetCnnFeatureStatus',
      this.prepareSerializedGRPCRequest(request.serializeBinary()),
      callback,
      huddly.CNNStatus.deserializeBinary
    );
  }

  getTemperatures(request: Empty, callback: Function) {
    this.runNormalRPCCommand(
      'GetTemperatures',
      '',
      callback,
      huddly.Temperatures.deserializeBinary
    );
  }
  getBootSlot(request: Empty, callback: Function) {
    this.runNormalRPCCommand('GetBootSlot', '', callback, huddly.BootSlot.deserializeBinary);
  }
  getUptime(request: Empty, callback: Function) {
    this.runNormalRPCCommand('GetUptime', '', callback, huddly.Uptime.deserializeBinary);
  }

  getSaturation(request: Empty, callback: Function) {
    this.runNormalRPCCommand('GetSaturation', '', callback, huddly.Saturation.deserializeBinary);
  }

  setSaturation(request: huddly.Saturation, callback: Function) {
    this.runNormalRPCCommand(
      'SetSaturation',
      this.prepareSerializedGRPCRequest(request.serializeBinary()),
      callback,
      huddly.Saturation.deserializeBinary
    );
  }

  getBrightness(request: Empty, callback: Function) {
    this.runNormalRPCCommand('GetBrightness', '', callback, huddly.Brightness.deserializeBinary);
  }

  async setBrightness(request: huddly.Brightness, callback: Function) {
    this.runNormalRPCCommand(
      'SetBrightness',
      this.prepareSerializedGRPCRequest(request.serializeBinary()),
      callback,
      huddly.Brightness.deserializeBinary
    );
  }

  async getPTZ(request: Empty, callback: Function) {
    this.runNormalRPCCommand('GetPTZ', '', callback, huddly.PTZ.deserializeBinary);
  }

  async setPTZ(request: huddly.PTZ, callback: Function) {
    this.runNormalRPCCommand(
      'GetPTZ',
      this.prepareSerializedGRPCRequest(request.serializeBinary()),
      callback,
      huddly.DeviceStatus.deserializeBinary
    );
  }

  async getOptionCertificates(request: Empty, callback: Function) {
    this.runNormalRPCCommand(
      'GetOptionCertificates',
      '',
      callback,
      huddly.OptionCertificates.deserializeBinary
    );
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
