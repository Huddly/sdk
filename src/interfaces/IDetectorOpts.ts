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
   * This option sets up the `Detector` class to configure the
   * camera in such a way that you can get detection data without
   * the need of streaming the main stream using a third party streaming
   * application on the host machine.
   *
   * **NOTE** Always call `#destroy` method on `Detector` class when
   * tearing down the application. the `#destroy` function will make
   * sure that the camera stops the internal stream that emits detection
   * data to the host.
   *
   * @type {boolean}
   * @memberof DetectorOpts
   */
  configDetectionsOnSubstream?: boolean;
}

export { DetectionConvertion };
