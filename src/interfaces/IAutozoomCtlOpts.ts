/**
 * Options used for autozoom controller class
 *
 * @interface DetectorOpts
 */
export default interface AutozoomCtlOpts {
  /**
   * Configure autozoom without doing auto
   * framing. With this option set to true,
   * you can still get detection and framing
   * events, however, auto framing of people is
   * not done on the camera any more.
   *
   * @type {Boolean}
   * @memberof DetectorOpts
   */
  shouldAutoFrame?: boolean;
}
