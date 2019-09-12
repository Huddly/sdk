const CameraEvents = {
  ATTACH: 'ATTACH', // Huddly camera attach event
  DETACH: 'DETACH', // Huddly camera detach event
  HID_ATTACH: 'HID_ATTACH', // HuddlyGO HID attach event
  UPGRADE_PROGRESS: 'UPGRADE_PROGRESS', // Upgrade progress info event
  UPGRADE_COMPLETE: 'UPGRADE_COMPLETE', // Successful upgrade event
  UPGRADE_START: 'UPGRADE_START', // Huddly camera upgrade process start event
  UPGRADE_FAILED: 'UPGRADE_FAILED', // Failure upgrade event
  ERROR: 'ERROR', // Genetic SDK error event
  DETECTIONS: 'DETECTIONS', // People detection event
  RAW_DETECTIONS: 'RAW_DETECTIONS', // Raw camera detection event
  PREVIEW_FRAME: 'PREVIEW_FRAME', // Preview frame info event
  FRAMING: 'FRAMING', // Genius Framing info event
  TIMEOUT: 'TIMEOUT', // Generic SDK timeout event
};

export default CameraEvents;
