import IHuddlyService from './../../interfaces/IHuddlyService';
import IServiceOpts from './../../interfaces/IServiceOpts';
import { CameraInfo } from './../../interfaces/IWinServiceModels';
import Logger from './../../../src/utilitis/logger';

import * as winservice from '@huddly/huddlyproto/lib/proto/win_service_pb';
import { HuddlyCameraServiceClient } from '@huddly/huddlyproto/lib/proto/win_service_grpc_pb';
import * as grpc from '@grpc/grpc-js';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

/**
 * Local enum describing service camera actions used to simplify api calls
 * towards the service through GRPC
 */
export enum ServiceCameraActions {
  ACTIVE = 0,
  DEFAULT = 1,
}

/**
 * IHuddlyService class implementation for sdk consumers running on a Windows host machine. All the functionality of this
 * service is described in the proto file from @huddly/huddlyproto npm package with the name win_service.proto
 */
export default class WinIpCameraService implements IHuddlyService {
  /**
   * Service options for initializing and seting up the service communication
   * @type {IServiceOpts}
   * @memberof WinIpCameraService
   */

  options: IServiceOpts;
  /**
   * Service client derived from the proto file
   * @type {HuddlyCameraServiceClient}
   * @memberof WinIpCameraService
   */
  grpcClient: HuddlyCameraServiceClient;

  /**
   * @ignore
   * @type {number}
   * @memberof WinIpCameraService
   */
  private readonly GRPC_DEFAULT_CONNECT_TIMEOUT: number = 1; // Seconds

  /**
   * @ignore
   * @type {number}
   * @memberof WinIpCameraService
   */
  private readonly GRPC_PORT: number = 30051;

  /**
   * Creates a new instance of WinUpCameraService and initializes the necessary class attributes
   * @param  {IServiceOpts} opts? Service options for initializing and setting up the service communication
   */
  constructor(opts?: IServiceOpts) {
    this.options = opts;
  }

  /**
   * Connect to the service gprc server
   * @returns A promise that completes when the init is successful
   * or rejects if not.
   */
  init(): Promise<void> {
    Logger.debug('Initializing Windows Ip Camera Service!', WinIpCameraService.name);
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
          Logger.error(
            `Connection failed with GPRC server on ACE!`,
            error,
            WinIpCameraService.name
          );
          reject(error);
        } else {
          Logger.debug(`Connection established`, WinIpCameraService.name);
          resolve();
        }
      })
    );
  }

  /**
   * Helper function for properly formatting the mac address being sent over to the
   * service grpc server
   * @param {mac} Mac address in string fromat
   * @returns Mac address in a format that is satisfactory for the service when sending it
   * over gprc
   */
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

  /**
   * Helper function for calling a setter command on the service grpc server. Using the
   * parameter "action" to determine which specific setter to invoke.
   * @param  {ServiceCameraActions} action Determine which setter should be called on
   * the service gprc server
   * @param  {CameraInfo} camInfo The camera information required to send in as data
   * when calling the service gprc setter command
   * @returns A promse that resolves if the setter execution is successful or rejects
   * otherwise.
   */
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
          Logger.error(
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

  /**
   * Helper function for calling a getter command on the service grpc server. Using the
   * parameter "action" to determine which specific getter to invoke.
   * @param  {ServiceCameraActions} action Determine which getter should be called on
   * the service grpc seerver
   * @returns A promise that resolves if the getter execution is successful or rejects
   * otherwise.
   */
  serviceCameraGetter(action: ServiceCameraActions): Promise<CameraInfo> {
    const getterActionStr: string = Object.keys(ServiceCameraActions).find(
      key => ServiceCameraActions[key] === action
    );
    return new Promise((resolve, reject) => {
      const getterCallback = (err: grpc.ServiceError, cameraInfo: winservice.CameraInfo) => {
        if (err) {
          Logger.error(
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

  /**
   * Set default camera on the huddly windows service. Note: this action is boot persistent.
   * @param  {CameraInfo} camInfo The camera information required to send in as data
   * when setting the default camera on the service
   * @returns A promise that resolves if default camera is set successfully or rejects
   * otherwise.
   */
  setDefaultCamera(camInfo: CameraInfo): Promise<void> {
    return this.serviceCameraSetter(ServiceCameraActions.DEFAULT, camInfo);
  }

  /**
   * Get default camera from the huddly windows service.
   * @returns A promise which contains data of type `CamerInfo` detailing the information
   * about the current default camera on the huddly windows service.
   */
  getDefaultCamera(): Promise<CameraInfo> {
    return this.serviceCameraGetter(ServiceCameraActions.DEFAULT);
  }

  /**
   * Set active camear on the huddly windows service. Note: this action is not boot persistent.
   * @param  {CameraInfo} camInfo The camera information reqyuired to send in as data
   * when setting the activve camera on the service
   * @returns A promise that resolves if the active camera is set successfully or rejects
   * otherwise.
   */
  setActiveCamera(camInfo: CameraInfo): Promise<void> {
    return this.serviceCameraSetter(ServiceCameraActions.ACTIVE, camInfo);
  }

  /**
   * Get active camera from the huddly windows service.
   * @returns A promise which contains data of type `CameraInfo` detailing the information
   * about the current active camera on the huddly windows service.
   */
  getActiveCamera(): Promise<CameraInfo> {
    return this.serviceCameraGetter(ServiceCameraActions.ACTIVE);
  }

  /**
   * Set user pan tilt zoom control setting on the huddly windows service. This feature
   * makes sure you allow or block custom user ptz to the camera comming from third party
   * applications such as Windows Camera App, Zoom, Meet etc.
   * @param  {boolean} isAllowed A boolean parameter specifying whether the service should
   * allow or block incoming user ptz actions from third part apps.
   * @returns A promise that resolves if the setting was changed successfully or rejects
   * otherwise.
   */
  setUserPtz(isAllowed: boolean): Promise<void> {
    const allowed = new winservice.UserPtz();
    allowed.setEnabled(isAllowed);
    return new Promise((resolve, reject) => {
      this.grpcClient.setUserPTZ(allowed, (err: grpc.ServiceError) => {
        if (err) {
          Logger.error(
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

  /**
   * Check if the user ptz is allowed on the huddly windows service.
   * @returns A promise which after completion it contains information if
   * user ptz is allowed or not. Rejects if retreiving the setting fails.
   */
  isUserPtzAllowed(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getUserPTZ(
        new Empty(),
        (err: grpc.ServiceError, isAllowed: winservice.UserPtz) => {
          if (err) {
            Logger.error(
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
  /**
   * Update the user ptz setting on the huddly windows service to allow user ptz.
   * @returns Promise
   */
  allowUserPtz(): Promise<void> {
    return this.setUserPtz(true);
  }

  /**
   * Update the user ptz setting on the huddly windows service to block user ptz.
   * @returns Promise
   */
  blokUserPtz(): Promise<void> {
    return this.setUserPtz(false);
  }

  /**
   * Close grpc connection with the service gprc server.
   * @returns A promise that resolves if closing the connection is successful or rejects
   * otherwise.
   */
  close(): Promise<void> {
    if (this.grpcClient) {
      this.grpcClient.close();
      this.grpcClient = undefined;
    }
    return Promise.resolve();
  }
}
