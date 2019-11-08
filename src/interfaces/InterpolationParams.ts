/**
 * Options used for setting interpolation points on the camera!
 * Some of the functionalities on the camera that user the interpolation
 * parameters are zoom and exposure.
 * The parameters of this interface are equivalent to the bezier curve
 * parameters. See http://cubic-bezier.com for visualisation.
 *
 * @interface InterpolationParams
 * @ignore
 */
export default interface InterpolationParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
