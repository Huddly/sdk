import { DetectionConvertion } from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';

const _filterDetections = (objectFilter: Array<String>, detections: Array<any>): Array<any> =>
  objectFilter.length === 0
    ? detections
    : detections.filter(({ label }) => objectFilter.some((x) => x === label));

/**
 *
 * @ignore
 * @interface ImageSize
 */
interface ImageSize {
  width: number;
  height: number;
}

/**
 * Interface describing the detecton converter options available to the user.
 */
interface ConverterOpts {
  /**
   * Provide the image dimensions that the frame data will be calculated
   * relative to.
   */
  preview_image_size: ImageSize;
  /**
   * Provide one of the DetectionConvertion Enum which specifies
   * whether the detection coordinates are relative or absolute to
   * framing dimensions.
   */
  convertDetections?: DetectionConvertion;
  /**
   * Detection type filter. Can be for example, "head". "person"!
   */
  objectFilter?: Array<String>;

  /**
   * Provide frame object with x,y and width,height data that the detection
   * objects will be drawn relative to.
   */
  frame?: any;
}

/**
 * Helper class for converting detection data based on given conversion options
 *
 * @export
 * @class DetectionsConverter
 */
export default class DetectionsConverter {
  _detections: Array<any>;
  _framingBBox: { x: number; y: number; height: number; width: number };
  _detectionConvertion: DetectionConvertion;
  _preview_image_size: ImageSize;
  _objectFilter: Array<String> = ['head', 'person'];

  constructor(detections: Array<any>, converterOpts: ConverterOpts) {
    this._detections = detections;
    this._preview_image_size = converterOpts.preview_image_size;
    if (converterOpts.objectFilter) {
      this._objectFilter = converterOpts.objectFilter;
    }
    this._framingBBox = (converterOpts.frame && converterOpts.frame.bbox) || undefined;
    this._setDetectionConvertion(converterOpts.convertDetections);
  }

  _setDetectionConvertion(detectionConvertion: DetectionConvertion) {
    if (detectionConvertion === DetectionConvertion.FRAMING && this._framingBBox) {
      this._detectionConvertion = DetectionConvertion.FRAMING;
      return;
    }
    this._detectionConvertion = DetectionConvertion.RELATIVE;
  }

  convert(): Array<any> {
    const filteredDetections = _filterDetections(this._objectFilter, this._detections);

    if (this._detectionConvertion === DetectionConvertion.FRAMING) {
      // Convert coordinates absolute to the selected frame in the main stream
      const relativeSize = {
        height: this._preview_image_size.height / this._framingBBox.height,
        width: this._preview_image_size.width / this._framingBBox.width,
      };
      return filteredDetections.map(({ label, bbox }) => ({
        label: label,
        bbox: {
          x: (bbox.x - this._framingBBox.x) * relativeSize.width,
          y: (bbox.y - this._framingBBox.y) * relativeSize.height,
          width: bbox.width * relativeSize.width,
          height: bbox.height * relativeSize.height,
          frameWidth: this._framingBBox.width * relativeSize.width,
          frameHeight: this._framingBBox.height * relativeSize.height,
        },
      }));
    }
    // Convert coordinates to relative (normalized) form
    return filteredDetections.map(({ label, bbox }) => ({
      label: label,
      bbox: {
        x: bbox.x / this._preview_image_size.width,
        y: bbox.y / this._preview_image_size.height,
        width: bbox.width / this._preview_image_size.width,
        height: bbox.height / this._preview_image_size.height,
      },
    }));
  }
}
