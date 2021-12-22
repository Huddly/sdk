import IHuddlyService from '@huddly/sdk-interfaces/lib/interfaces/IHuddlyService';
import IServiceOpts from '@huddly/sdk-interfaces/lib/interfaces/IServiceOpts';
import {
  CameraInfo,
  CameraPairingState,
  FwUpdateSchedule,
  FwUpdateScheduleStatus,
  CameraInfoWrite,
} from '@huddly/sdk-interfaces/lib/interfaces/ICameraSwitchModels';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import * as switchservice from '@huddly/camera-switch-proto/lib/api/service_pb';
import { HuddlyCameraServiceClient } from '@huddly/camera-switch-proto/lib/api/service_grpc_pb';
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
 * @export
 *
 * IHuddlyService class implementation for sdk consumers running on a Windows host machine. The service can be used
 * to switch which huddly network camera is used to stream on the host machine. All the functionality of this
 * service is described in the proto file from @huddly/camera-switch npm package with the name service.proto
 *
 * @class CameraSwitchService
 * @implements {IHuddlyService}
 */
export default class CameraSwitchService implements IHuddlyService {
  /**
   * Service options for initializing and seting up the service communication
   * @type {IServiceOpts}
   * @memberof CameraSwitchService
   */

  options: IServiceOpts;
  /**
   * Service client derived from the proto file
   * @type {HuddlyCameraServiceClient}
   * @memberof CameraSwitchService
   */
  grpcClient: HuddlyCameraServiceClient;

  /**
   * @ignore
   * @type {number}
   * @memberof CameraSwitchService
   */
  private readonly GRPC_DEFAULT_CONNECT_TIMEOUT: number = 1; // Seconds

  /**
   * @ignore
   * @type {number}
   * @memberof CameraSwitchService
   */
  private readonly GRPC_PORT: number = 30051;

  /**
   * Creates a new instance of CameraSwitchService and initializes the necessary class attributes
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
    Logger.debug('Initializing Windows Ip Camera Service!', CameraSwitchService.name);
    const deadline = new Date();
    deadline.setSeconds(
      deadline.getSeconds() + (this.options.connectionDeadline || this.GRPC_DEFAULT_CONNECT_TIMEOUT)
    );
    this.grpcClient = new HuddlyCameraServiceClient(
      `localhost:${this.GRPC_PORT}`,
      this.options.credentials || grpc.credentials.createInsecure()
    );

    return new Promise<void>((resolve, reject) =>
      this.grpcClient.waitForReady(deadline, (error) => {
        if (error) {
          Logger.error(
            `Connection failed with GPRC server on ACE!`,
            error,
            CameraSwitchService.name
          );
          reject(error);
        } else {
          Logger.debug(`Connection established`, CameraSwitchService.name);
          resolve();
        }
      })
    );
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
    const serviceCamInfo: switchservice.CameraInfoWrite = new switchservice.CameraInfoWrite();
    serviceCamInfo.setName(camInfo.name);
    serviceCamInfo.setIp(camInfo.ip);
    const setterActionStr: string = Object.keys(ServiceCameraActions).find(
      (key) => ServiceCameraActions[key] === action
    );

    return new Promise((resolve, reject) => {
      const setterCallback = (err: grpc.ServiceError) => {
        if (err) {
          Logger.error(
            `Unable to set ${setterActionStr} camera on service. Error: ${err.details}`,
            err.stack,
            CameraSwitchService.name
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
      (key) => ServiceCameraActions[key] === action
    );
    return new Promise((resolve, reject) => {
      const getterCallback = (err: grpc.ServiceError, device: switchservice.CameraInfo) => {
        if (err) {
          Logger.error(
            `Unable to get ${getterActionStr} camera from service. Error: ${err.details}`,
            err.stack,
            CameraSwitchService.name
          );
          reject(err.details);
          return;
        }

        resolve({
          ip: device.getIp(),
          name: device.getName(),
          version: device.getVersion(),
          version_state: this.versionStateToString(device),
          pairing_state: this.pairingStateToStringArray(device.getPairingStatesList()),
        });
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
   * Set default camera on the huddly camera service. Note: this action is boot persistent.
   * @param  {CameraInfo} camInfo The camera information required to send in as data
   * when setting the default camera on the service
   * @returns A promise that resolves if default camera is set successfully or rejects
   * otherwise.
   */
  setDefaultCamera(camInfo: CameraInfoWrite): Promise<void> {
    return this.serviceCameraSetter(ServiceCameraActions.DEFAULT, camInfo);
  }

  /**
   * Get default camera from the huddly camera service.
   * @returns A promise which contains data of type `CamerInfo` detailing the information
   * about the current default camera on the huddly camera service.
   */
  getDefaultCamera(): Promise<CameraInfo> {
    return this.serviceCameraGetter(ServiceCameraActions.DEFAULT);
  }

  /**
   * Set active camear on the huddly camera service. Note: this action is not boot persistent.
   * @param  {CameraInfo} camInfo The camera information reqyuired to send in as data
   * when setting the activve camera on the service
   * @returns A promise that resolves if the active camera is set successfully or rejects
   * otherwise.
   */
  setActiveCamera(camInfo: CameraInfoWrite): Promise<void> {
    return this.serviceCameraSetter(ServiceCameraActions.ACTIVE, camInfo);
  }

  /**
   * Get active camera from the huddly camera service.
   * @returns A promise which contains data of type `CameraInfo` detailing the information
   * about the current active camera on the huddly camera service.
   */
  getActiveCamera(): Promise<CameraInfo> {
    return this.serviceCameraGetter(ServiceCameraActions.ACTIVE);
  }

  /**
   * Set user pan tilt zoom control setting on the huddly camera service. This feature
   * makes sure you allow or block custom user ptz to the camera comming from third party
   * applications such as Windows Camera App, Zoom, Meet etc.
   * @param  {boolean} isAllowed A boolean parameter specifying whether the service should
   * allow or block incoming user ptz actions from third part apps.
   * @returns A promise that resolves if the setting was changed successfully or rejects
   * otherwise.
   */
  setUserPtz(isAllowed: boolean): Promise<void> {
    const allowed = new switchservice.UserPtz();
    allowed.setEnabled(isAllowed);
    return new Promise((resolve, reject) => {
      this.grpcClient.setUserPTZ(allowed, (err: grpc.ServiceError) => {
        if (err) {
          Logger.error(
            `Unable to set user ptz on service. Error: ${err.details}`,
            err.stack,
            CameraSwitchService.name
          );
          reject(err.details);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Check if the user ptz is allowed on the huddly camera service.
   * @returns A promise which after completion it contains information if
   * user ptz is allowed or not. Rejects if retreiving the setting fails.
   */
  isUserPtzAllowed(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getUserPTZ(
        new Empty(),
        (err: grpc.ServiceError, isAllowed: switchservice.UserPtz) => {
          if (err) {
            Logger.error(
              `Unable to get information whether user ptz is allowed or not on the service. Error: ${err.details}`,
              err.stack,
              CameraSwitchService.name
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
   * Update the user ptz setting on the huddly camera service to allow user ptz.
   * @returns Promise
   */
  allowUserPtz(): Promise<void> {
    return this.setUserPtz(true);
  }

  /**
   * Update the user ptz setting on the huddly camera service to block user ptz.
   * @returns Promise
   */
  blokUserPtz(): Promise<void> {
    return this.setUserPtz(false);
  }

  /**
   * @ignore
   * Helper function for converting CameraPairingState enum values into array of enum keys
   * @param pairingStateList List of proto CameraPairingState values
   * @returns A string array representing the keys for the different Pairing states of the camera
   */
  pairingStateToStringArray(
    pairingStateList: Array<
      switchservice.CameraPairingStateMap[keyof switchservice.CameraPairingStateMap]
    >
  ): Array<string> {
    const pairingStates: Array<string> = [];
    pairingStateList.forEach((state) => {
      // Check for unknown pairing states
      if (CameraPairingState[state] == undefined) {
        // Check for duplicates
        if (
          !pairingStates.includes(
            CameraPairingState[switchservice.CameraPairingState.UNKNOWNPAIRINGSTATE]
          )
        ) {
          pairingStates.push(CameraPairingState[CameraPairingState.UnknownPairingState]);
        }
      } else {
        // Check for duplicates
        if (!pairingStates.includes(CameraPairingState[state])) {
          pairingStates.push(CameraPairingState[state]);
        }
      }
    });
    return pairingStates;
  }

  /**
   * @ignore
   * Helper function for converting device VersionState into a string representation
   * @param device Service CameraInfo instance used to extract the version state object from
   * @returns A string representation of the device version state
   */
  versionStateToString(device: switchservice.CameraInfo): string {
    return Object.keys(switchservice.VersionState).find(
      (state) => switchservice.VersionState[state] == device.getVersionState()
    );
  }

  /**
   * @ignore
   * Helper function for converting list of `@huddly/camera-switch-proto/CameraInfo` into local `CameraInfo` list representation.
   * @param cameraList List instance of `@huddly/camera-switch-proto/CameraInfo` objects to be converted into local `CameraInfo` list representation
   * @returns A list of local `CameraInfo` objects converted from `@huddly/camera-switch-proto/CameraInfo`
   */
  protoCameraInfoListToLocalCameraInfoList(
    cameraList: Array<switchservice.CameraInfo>
  ): Array<CameraInfo> {
    const newConveredCameraList: Array<CameraInfo> = new Array<CameraInfo>();
    cameraList.forEach((device) => {
      newConveredCameraList.push({
        ip: device.getIp(),
        name: device.getName(),
        version: device.getVersion(),
        version_state: this.versionStateToString(device),
        pairing_state: this.pairingStateToStringArray(device.getPairingStatesList()),
      });
    });
    return newConveredCameraList;
  }

  /**
   * Get a list of all available cameras that have been discovered and are ready to be used on the huddly camera service.
   * @returns A list of all available cameras on the service.
   */
  getAvailableCameras(): Promise<Array<CameraInfo>> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getAvailableCameras(
        new Empty(),
        (err: grpc.ServiceError, availableCameras: switchservice.AvailableCameras) => {
          if (err) {
            Logger.error(
              `Unable to get available cameras from the service. Error: ${err.details}`,
              err.stack,
              CameraSwitchService.name
            );
            reject(err.details);
            return;
          }

          const resolveList: Array<CameraInfo> = this.protoCameraInfoListToLocalCameraInfoList(
            availableCameras.getCameraListList()
          );
          resolve(resolveList);
        }
      );
    });
  }

  /**
   * @ignore
   * Helper function for converting comma separated camera pairing state keys into proto compatible CameraPairingStateMap used
   * when sending grpc requests to the service grpc server.
   * @param states A comma separated string of CameraPairingState keys
   * @returns A list of CameraPairingState objects represented as `repeated CameraPairingState` type on the service proto messages
   */
  pairingStateKeysToValues(
    states: string
  ): Array<switchservice.CameraPairingStateMap[keyof switchservice.CameraPairingStateMap]> {
    const pairStateEnumValues: Array<
      switchservice.CameraPairingStateMap[keyof switchservice.CameraPairingStateMap]
    > = [];
    const allowedCameraPairingStates: string[] = Object.keys(CameraPairingState).filter(
      (x) => !(parseInt(x) >= 0)
    );
    states.split(',').forEach((state) => {
      if (allowedCameraPairingStates.includes(state)) {
        // Avoid adding duplicates
        if (!pairStateEnumValues.includes(CameraPairingState[state])) {
          pairStateEnumValues.push(CameraPairingState[state]);
        }
      } else {
        throw new Error(
          `Unknown CameraPairingState [${state}]! Allowed States: ${allowedCameraPairingStates}`
        );
      }
    });
    return pairStateEnumValues;
  }

  /**
   * Reconfigure firmware update scheduler on the huddly camera service.
   * @param newSchedule New firmware update schedule to be applied to the windows service
   * @returns An object representing the status of the grpc request which contains the message and a list of affected cameras
   */
  setFwUpdateSchedule(newSchedule: FwUpdateSchedule): Promise<FwUpdateScheduleStatus> {
    const request: switchservice.FwUpdateSchedule = new switchservice.FwUpdateSchedule();
    request.setDaysOfWeek(newSchedule.daysOfWeek);
    request.setHourOfDay(newSchedule.hour);
    request.setStartDelayMaxSeconds(newSchedule.maxStartDelay);
    request.setValidPairingStatesList(
      this.pairingStateKeysToValues(newSchedule.validPairingStates)
    );
    request.setDisabled(newSchedule.disabled == undefined ? false : newSchedule.disabled);

    return new Promise((resolve, reject) => {
      this.grpcClient.setFwUpdateSchedule(
        request,
        (err: grpc.ServiceError, status: switchservice.FwUpdateScheduleStatus) => {
          if (err) {
            Logger.error(
              `Unable to set new fw update schedule. Error: ${err.details}`,
              err.stack,
              CameraSwitchService.name
            );
            reject(err.details);
            return;
          }
          if (status.getCode() != switchservice.FwUpdateScheduleStatusCodes.SUCCESS) {
            Logger.error(
              `Server reported error when setting new fw update schedule`,
              undefined,
              CameraSwitchService.name
            );
            reject(status.getMessage());
            return;
          }

          const affectedCameras: Array<CameraInfo> = this.protoCameraInfoListToLocalCameraInfoList(
            status.getAffectedCamerasList()
          );
          resolve({
            message: status.getMessage(),
            affectedCameras,
          });
        }
      );
    });
  }

  /**
   * Retrieve the current configured fw update schedule from the huddly camera service.
   * @returns A FwUpdateSchedule object containing all the information about the current fw schedule on the service
   */
  getFwUpdateSchedule(): Promise<FwUpdateSchedule> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getFwUpdateSchedule(
        new Empty(),
        (err: grpc.ServiceError, schedule: switchservice.FwUpdateSchedule) => {
          if (err) {
            Logger.error(
              `Unable to retrieve fw update schedule. Error: ${err.details}`,
              err.stack,
              CameraSwitchService.name
            );
            reject(err.details);
            return;
          }
          resolve({
            daysOfWeek: schedule.getDaysOfWeek(),
            validPairingStates: this.pairingStateToStringArray(
              schedule.getValidPairingStatesList()
            ).join(','),
            disabled: schedule.getDisabled(),
            hour: schedule.getHourOfDay(),
            maxStartDelay: schedule.getStartDelayMaxSeconds(),
          });
        }
      );
    });
  }

  /**
   * Schedule an immediate firmware upgrade for the given camera on the huddly camera service. Given that the camera is available
   * on the service.
   * @param cameraToUpgrade Camera info representing the camera to be upgraded by the service.
   * @returns An object representing the status of the grpc request which contains the message and a list of affected cameras
   */
  scheduleFwUpdate(cameraToUpgrade: CameraInfoWrite): Promise<FwUpdateScheduleStatus> {
    const request: switchservice.CameraInfoWrite = new switchservice.CameraInfoWrite();
    request.setIp(cameraToUpgrade.ip);
    request.setName(cameraToUpgrade.name);
    return new Promise((resolve, reject) => {
      this.grpcClient.scheduleFwUpdate(
        request,
        (err: grpc.ServiceError, status: switchservice.FwUpdateScheduleStatus) => {
          if (err) {
            Logger.error(
              `Unable to schedule upgrade for camera (Ip: ${cameraToUpgrade.ip}, Name: ${cameraToUpgrade.name})`,
              err.stack,
              CameraSwitchService.name
            );
            reject(err.details);
            return;
          }
          if (status.getCode() != switchservice.FwUpdateScheduleStatusCodes.SUCCESS) {
            Logger.error(
              `Unable to schedule upgrade for camera (Ip: ${cameraToUpgrade.ip}, Name: ${cameraToUpgrade.name})`,
              undefined,
              CameraSwitchService.name
            );
            reject(status.getMessage());
            return;
          }

          const affectedCameras: Array<CameraInfo> = this.protoCameraInfoListToLocalCameraInfoList(
            status.getAffectedCamerasList()
          );
          resolve({
            message: status.getMessage(),
            affectedCameras,
          });
        }
      );
    });
  }

  /**
   * Schedule an immediate firmware upgrade on all the cameras available to the huddly camera service.
   * @returns An object representing the status of the grpc request which contains the message and a list of affected cameras
   */
  scheduleFwUpdateAll(): Promise<FwUpdateScheduleStatus> {
    return new Promise((resolve, reject) => {
      this.grpcClient.scheduleFwUpdateAll(
        new Empty(),
        (err: grpc.ServiceError, status: switchservice.FwUpdateScheduleStatus) => {
          if (err) {
            Logger.error(
              `Unable to schedule fw update on all connected cameras! Error: ${err.details}`,
              err.stack,
              CameraSwitchService.name
            );
            reject(err.details);
            return;
          }
          if (status.getCode() != switchservice.FwUpdateScheduleStatusCodes.SUCCESS) {
            Logger.error(
              'Unable to schedule fw update on all connected cameras!',
              undefined,
              CameraSwitchService.name
            );
            reject(status.getMessage());
            return;
          }

          const affectedCameras: Array<CameraInfo> = this.protoCameraInfoListToLocalCameraInfoList(
            status.getAffectedCamerasList()
          );
          resolve({
            message: status.getMessage(),
            affectedCameras,
          });
        }
      );
    });
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
