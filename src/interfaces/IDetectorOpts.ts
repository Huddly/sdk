enum DetectionConvertion {
  RELATIVE = 'RELATIVE',
  FRAMING = 'FRAMING',
}
/**
 * Options used for detector
 *
 * @interface DetectorOpts
 */
export default interface DetectorOpts {
  /**
   * Changes coordinate system for detections bounding boxes
   * DETECTIONS topic.
   *
   * RELATIVE is between 0 1 (default)
   * FRAMING coordinates are absolute to the selected
   * frame in the main stream
   * @type {DetectionConvertion}
   * @memberof DetectorOpts
   */
  convertDetections?: DetectionConvertion;

  /**
   * Specify a list of labels for objects to detect, ie ['head', 'person']
   * Provide an empty list to retrieve all
   *
   * @type {Array<String>}
   * @memberof DetectorOpts
   */
  objectFilter?: Array<String>;

  /**
   * DOWS short for `D`etections `O`nly `W`hen `S`treaming.
   * When set to true, this option will configure the `Detector`
   * so that detection and framing events are emitted only when
   * camera is being streamed on host machine.
   * Currently you will need to enable Autozoom for this to work.
   *
   * @type {boolean}
   * @memberof DetectorOpts
   */
  DOWS?: boolean;
}

export { DetectionConvertion };
