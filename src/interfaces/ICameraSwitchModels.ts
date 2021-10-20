/**
 * @ignore
 * SDK interface representing the CameraInfo message from @huddly/camera-switch-interface protofile
 */
export interface CameraInfo {
  name?: string;
  ip?: string;
  version?: string;
  version_state?: string;
  pairing_state?: Array<string>;
}

/**
 * @ignore
 * SDK interface representing the CameraInfoWrite message from @huddly/camera-switch-interface protofile
 */
export interface CameraInfoWrite {
  name: string;
  ip: string;
}

/**
 * @ignore
 * SDK interface representing the CameraPairingState message from @huddly/camera-switch-interface protofile
 */
export enum CameraPairingState {
  UnknownPairingState = 0,
  Default = 1,
  Active = 2,
  Paired = 3,
}

/**
 * @ignore
 * SDK interface representing the FwUpdateSchedule message from @huddly/camera-switch-interface protofile
 */
export interface FwUpdateSchedule {
  daysOfWeek: string;
  validPairingStates: string;
  hour?: number;
  maxStartDelay?: number;
  disabled?: boolean;
}

/**
 * SDK interface representing the FwUpdateScheduleStatus message from @huddly/camera-switch-interface protofile
 */
export interface FwUpdateScheduleStatus {
  message: string;
  affectedCameras: Array<CameraInfo>;
}
