import * as grpc from '@grpc/grpc-js';

export default class GrpcTunnelServiceError implements grpc.StatusObject, Error {
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
