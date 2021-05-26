import IUsbTransport from '../interfaces/IUsbTransport';

export default class TypeHelper {
  static instanceOfUsbTransport(object: any): object is IUsbTransport {
    return (
      'read' in object && 'write' in object && 'subscribe' in object && 'unsubscribe' in object
    );
  }
  static instanceOfGrpcTransport(object: any): object is IUsbTransport {
    return 'grpcConnectionDeadlineSeconds' in object && 'grpcClient' in object;
  }
}
