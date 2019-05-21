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
   * Set to false in case you want to get detections without
   * enabling genius framing
   *
   * @type {Boolean}
   * @memberof DetectorOpts
   */
  shouldAutoFrame?: boolean;

  /**
   * Specify a list of labels for objects to detect, ie ['head', 'person']
   * Provide an empty list to retrieve all
   *
   * @type {Array<String>}
   * @memberof DetectorOpts
   */
  objectFilter?: Array<String>;
}

export { DetectionConvertion };
