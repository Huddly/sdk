/**
 * Options used for autozoom control class
 *
 * @interface AutozoomControlOpts
 */
export default interface AutozoomControlOpts {
  /**
   * Configure autozoom without doing auto
   * framing. With this option set to true,
   * you can still get detection and framing
   * events, however, auto framing of people is
   * not done on the camera any more.
   *
   * @type {Boolean}
   * @memberof AutozoomControlOpts
   */
  shouldAutoFrame?: boolean;
}
