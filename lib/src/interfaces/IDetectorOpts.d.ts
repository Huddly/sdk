declare enum DetectionConvertion {
    RELATIVE = "RELATIVE",
    FRAMING = "FRAMING"
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
    convertDetections: DetectionConvertion;
}
export { DetectionConvertion };
