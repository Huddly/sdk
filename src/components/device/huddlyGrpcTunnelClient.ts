import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import * as grpc from '@grpc/grpc-js';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

import GrpcTunnelServiceError from '../../error/GrpcTunnelServiceError';
import Locksmith from '../locksmith';
import Api from '../api';
import ClientWritableStreamEmulator from '../../utilitis/clientWritableStreamEmulator';

enum GrpcTunnelType {
  Normal,
  StreamUnary,
  UnaryStream,
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

  getFullGrpcMethod(grpcMethod: string): string {
    return `/huddly.HuddlyService/${grpcMethod}`;
  }

  async streamUnary(
    grpcMethod: string,
    request: Uint8Array,
    timeout: number = 30000
  ): Promise<NormalRPCResponse> {
    const payload = {
      rpc_method_name: this.getFullGrpcMethod(grpcMethod),
      request,
    };
    const reply = await this.api.sendAndReceiveMessagePack(
      payload,
      {
        send: 'grpc/stream_unary',
        receive: 'grpc/stream_unary_reply',
      },
      timeout
    );
    return reply;
  }

  async unaryStream(
    grpcMethod: string,
    request: Uint8Array,
    timeout: number = 30000
  ): Promise<NormalRPCResponse> {
    const payload = {
      rpc_method_name: this.getFullGrpcMethod(grpcMethod),
      request,
    };
    const reply = await this.api.sendAndReceiveMessagePack(
      payload,
      {
        send: 'grpc/unary_stream',
        receive: 'grpc/unary_stream_reply',
      },
      timeout
    );
    return reply;
  }

  async normalRPC(
    grpcMethod: string,
    request: Uint8Array,
    timeout: number = 2000
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

  async runRPCCommand(
    cmdString: string,
    request: Uint8Array,
    callback: Function,
    deserializer: Function,
    grpcTunnelType: GrpcTunnelType = GrpcTunnelType.Normal
  ) {
    const grpcTunnelFn = {
      [GrpcTunnelType.Normal]: this.normalRPC.bind(this),
      [GrpcTunnelType.StreamUnary]: this.streamUnary.bind(this),
      [GrpcTunnelType.UnaryStream]: this.unaryStream.bind(this),
    }[grpcTunnelType];

    const reply = await grpcTunnelFn(cmdString, request);
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
    this.runRPCCommand(
      'GetDeviceVersion',
      request.serializeBinary(),
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
    this.runRPCCommand(
      'eraseLogFile',
      request.serializeBinary(),
      callback,
      huddly.DeviceStatus.deserializeBinary
    );
  }

  reset() {
    throw new Error('Not Supported.');
  }

  getCnnFeatureStatus(request: huddly.CnnFeature, callback: Function) {
    this.runRPCCommand(
      'GetCnnFeatureStatus',
      request.serializeBinary(),
      callback,
      huddly.CNNStatus.deserializeBinary
    );
  }

  getTemperatures(request: Empty, callback: Function) {
    this.runRPCCommand(
      'GetTemperatures',
      request.serializeBinary(),
      callback,
      huddly.Temperatures.deserializeBinary
    );
  }

  getBootSlot(request: Empty, callback: Function) {
    this.runRPCCommand(
      'GetBootSlot',
      request.serializeBinary(),
      callback,
      huddly.BootSlot.deserializeBinary
    );
  }

  getUptime(request: Empty, callback: Function) {
    this.runRPCCommand(
      'GetUptime',
      request.serializeBinary(),
      callback,
      huddly.Uptime.deserializeBinary
    );
  }

  getSaturation(request: Empty, callback: Function) {
    this.runRPCCommand(
      'GetSaturation',
      request.serializeBinary(),
      callback,
      huddly.Saturation.deserializeBinary
    );
  }

  setSaturation(request: huddly.Saturation, callback: Function) {
    this.runRPCCommand(
      'SetSaturation',
      request.serializeBinary(),
      callback,
      huddly.DeviceStatus.deserializeBinary
    );
  }

  getBrightness(request: Empty, callback: Function) {
    this.runRPCCommand(
      'GetBrightness',
      request.serializeBinary(),
      callback,
      huddly.Brightness.deserializeBinary
    );
  }

  setBrightness(request: huddly.Brightness, callback: Function) {
    this.runRPCCommand(
      'SetBrightness',
      request.serializeBinary(),
      callback,
      huddly.DeviceStatus.deserializeBinary
    );
  }

  getPTZ(request: Empty, callback: Function) {
    this.runRPCCommand('GetPTZ', request.serializeBinary(), callback, huddly.PTZ.deserializeBinary);
  }

  setPTZ(request: huddly.PTZ, callback: Function) {
    this.runRPCCommand(
      'SetPTZ',
      request.serializeBinary(),
      callback,
      huddly.DeviceStatus.deserializeBinary
    );
  }

  getOptionCertificates(request: Empty, callback: Function) {
    this.runRPCCommand(
      'GetOptionCertificates',
      request.serializeBinary(),
      callback,
      huddly.OptionCertificates.deserializeBinary
    );
  }

  addOptionCertificate(callback: Function) {
    const endFunction = (data) => {
      this.runRPCCommand(
        'GetOptionCertificates',
        data,
        callback,
        huddly.DeviceStatus.deserializeBinary,
        GrpcTunnelType.StreamUnary
      );
    };
    return new ClientWritableStreamEmulator(endFunction);
  }

  setCnnFeature(request: Empty, callback: Function) {
    this.runRPCCommand(
      'SetCnnFeature',
      request.serializeBinary(),
      callback,
      huddly.DeviceStatus.deserializeBinary
    );
  }

  getDetections(request: Empty, callback: Function) {
    this.runRPCCommand(
      'GetDetections',
      request.serializeBinary(),
      callback,
      huddly.Detections.deserializeBinary
    );
  }

  controlSetting(request: huddly.Setting, callback: Function) {
    this.runRPCCommand(
      'ControlSetting',
      request.serializeBinary(),
      callback,
      huddly.DeviceStatus.deserializeBinary
    );
  }

  upgradeDevice() {
    throw new Error();
    return {} as grpc.ClientWritableStream<huddly.Chunk>;
  }

  upgradeVerify() {
    throw new Error();
    return {} as grpc.ClientWritableStream<huddly.Chunk>;
  }

  verifyIntegrity() {
    throw new Error();
    return {} as grpc.ClientWritableStream<huddly.Chunk>;
  }

  upgradeImage() {
    throw new Error();
    return {} as grpc.ClientWritableStream<huddly.Chunk>;
  }
}

export default HuddlyGrpcTunnelClient;
