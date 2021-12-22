import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import IGrpcTransport from '@huddly/sdk-interfaces/lib/interfaces/IGrpcTransport';
export default class TypeHelper {
  static instanceOfUsbTransport(object: any): object is IUsbTransport {
    return (
      'read' in object && 'write' in object && 'subscribe' in object && 'unsubscribe' in object
    );
  }
  static instanceOfGrpcTransport(object: any): object is IGrpcTransport {
    return 'grpcConnectionDeadlineSeconds' in object && 'grpcClient' in object;
  }
}
