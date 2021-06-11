import IHuddlyService from './../../interfaces/IHuddlyService';
import IServiceOpts from './../../interfaces/IServiceOpts';
import ILogger from './../../interfaces/iLogger';
import { CameraInfo } from './../../interfaces/IWinServiceModels';

import * as winservice from '@huddly/huddlyproto/lib/proto/win_service_pb';
import { HuddlyCameraServiceClient } from '@huddly/huddlyproto/lib/proto/win_service_grpc_pb';
import * as grpc from '@grpc/grpc-js';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

export enum ServiceCameraActions {
  ACTIVE = 0,
  DEFAULT = 1,
}

export default class WinIpCameraService implements IHuddlyService {
  options: IServiceOpts;
  grpcClient: HuddlyCameraServiceClient;
  logger: ILogger;

  private readonly GRPC_DEFAULT_CONNECT_TIMEOUT: number = 1; // Seconds
  private readonly GRPC_PORT: number = 30051;

  constructor(logger: ILogger, opts?: IServiceOpts) {
    this.options = opts;
    this.logger = logger;
  }

  init(): Promise<void> {
    this.logger.debug('Initializing Windows Ip Camera Service!', WinIpCameraService.name);
    const deadline = new Date();
    deadline.setSeconds(
      deadline.getSeconds() + (this.options.connectionDeadline || this.GRPC_DEFAULT_CONNECT_TIMEOUT)
    );
    this.grpcClient = new HuddlyCameraServiceClient(
      `localhost:${this.GRPC_PORT}`,
      this.options.credentials || grpc.credentials.createInsecure()
    );

    return new Promise<void>((resolve, reject) =>
      this.grpcClient.waitForReady(deadline, error => {
        if (error) {
          this.logger.error(
            `Connection failed with GPRC server on ACE!`,
            error,
            WinIpCameraService.name
          );
          reject(error);
        } else {
          this.logger.debug(`Connection established`, WinIpCameraService.name);
          resolve();
        }
      })
    );
  }

  formatMacAddress(mac: string): string {
    if (mac.indexOf(':') == -1 && mac.indexOf('-') == -1) {
      throw new Error(
        `Format Error! The folloing mac address is not valid: ${mac}. Use - or : as delimiters`
      );
    }
    if (mac.indexOf(':') > -1) {
      return mac.split(':').join('-');
    }
    return mac;
  }

  serviceCameraSetter(action: ServiceCameraActions, camInfo: CameraInfo): Promise<void> {
    const serviceCamInfo: winservice.CameraInfo = new winservice.CameraInfo();
    serviceCamInfo.setMac(this.formatMacAddress(camInfo.mac));
    serviceCamInfo.setName(camInfo.name);
    serviceCamInfo.setIp(camInfo.ip);
    const setterActionStr: string = Object.keys(ServiceCameraActions).find(
      key => ServiceCameraActions[key] === action
    );

    return new Promise((resolve, reject) => {
      const setterCallback = (err: grpc.ServiceError) => {
        if (err) {
          this.logger.error(
            `Unable to set ${setterActionStr} camera on service. Error: ${err.details}`,
            err.stack,
            WinIpCameraService.name
          );
          reject(err.details);
          return;
        }
        resolve();
      };

      switch (action) {
        case ServiceCameraActions.ACTIVE:
          this.grpcClient.setActiveCamera(serviceCamInfo, setterCallback);
          break;
        case ServiceCameraActions.DEFAULT:
          this.grpcClient.setDefaultCamera(serviceCamInfo, setterCallback);
          break;
        default:
          throw new Error(`Unknown service camera action: ${setterActionStr}`);
      }
    });
  }

  serviceCameraGetter(action: ServiceCameraActions): Promise<CameraInfo> {
    const getterActionStr: string = Object.keys(ServiceCameraActions).find(
      key => ServiceCameraActions[key] === action
    );
    return new Promise((resolve, reject) => {
      const getterCallback = (err: grpc.ServiceError, cameraInfo: winservice.CameraInfo) => {
        if (err) {
          this.logger.error(
            `Unable to get ${getterActionStr} camera from service. Error: ${err.details}`,
            err.stack,
            WinIpCameraService.name
          );
          reject(err.details);
          return;
        }
        resolve(cameraInfo.toObject());
      };

      switch (action) {
        case ServiceCameraActions.ACTIVE:
          this.grpcClient.getActiveCamera(new Empty(), getterCallback);
          break;
        case ServiceCameraActions.DEFAULT:
          this.grpcClient.getDefaultCamera(new Empty(), getterCallback);
          break;
        default:
          throw new Error(`Unknown service camera action: ${getterActionStr}`);
      }
    });
  }

  setDefaultCamera(camInfo: CameraInfo): Promise<void> {
    return this.serviceCameraSetter(ServiceCameraActions.DEFAULT, camInfo);
  }

  getDefaultCamera(): Promise<CameraInfo> {
    return this.serviceCameraGetter(ServiceCameraActions.DEFAULT);
  }

  setActiveCamera(camInfo: CameraInfo): Promise<void> {
    return this.serviceCameraSetter(ServiceCameraActions.ACTIVE, camInfo);
  }

  getActiveCamera(): Promise<CameraInfo> {
    return this.serviceCameraGetter(ServiceCameraActions.ACTIVE);
  }

  setUserPtz(isAllowed: boolean): Promise<void> {
    const allowed = new winservice.UserPtz();
    allowed.setEnabled(isAllowed);
    return new Promise((resolve, reject) => {
      this.grpcClient.setUserPTZ(allowed, (err: grpc.ServiceError) => {
        if (err) {
          this.logger.error(
            `Unable to set user ptz on service. Error: ${err.details}`,
            err.stack,
            WinIpCameraService.name
          );
          reject(err.details);
          return;
        }
        resolve();
      });
    });
  }

  isUserPtzAllowed(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getUserPTZ(
        new Empty(),
        (err: grpc.ServiceError, isAllowed: winservice.UserPtz) => {
          if (err) {
            this.logger.error(
              `Unable to get information whether user ptz is allowed or not on the service. Error: ${err.details}`,
              err.stack,
              WinIpCameraService.name
            );
            reject(err.details);
            return;
          }
          resolve(isAllowed.getEnabled());
        }
      );
    });
  }

  // Alias of #setUserPtz
  allowUserPtz(): Promise<void> {
    return this.setUserPtz(true);
  }

  // Alias of #setUserPtz
  blokUserPtz(): Promise<void> {
    return this.setUserPtz(false);
  }

  close(): Promise<void> {
    if (this.grpcClient) {
      this.grpcClient.close();
      this.grpcClient = undefined;
    }
    return Promise.resolve();
  }
}
