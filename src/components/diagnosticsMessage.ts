export enum DiagnosticsLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Provides diagnostic information from the camera.
 * @export
 * @class DiagnosticsMessage
 */
export default abstract class DiagnosticsMessage {
  protected _type: string;
  protected _level: DiagnosticsLevel = DiagnosticsLevel.INFO;
  protected _message: string = '';
  protected _tip: string = 'No tip available';
  constructor(type: string) {
    this._type = type;
  }
  /**
   * Human readable message in english if type is ok, or not
   * @type {string}
   * @memberof DiagnosticsMessage
   */
  get message(): string {
    return this._message;
  }

  /**
   * Type that indentifies what type of diagnostics message it is e.g USBMODE
   * @type {string}
   * @memberof DiagnosticsMessage
   */
  get type(): string {
    return this._type;
  }

  /**
   * What type of level is the message, INFO, WARN, ERROR
   * @type {DiagnosticsLevel}
   * @memberof DiagnosticsMessage
   */
  get level(): DiagnosticsLevel {
    return this._level;
  }

  /**
   * Human readable message how you can mitigate a problem
   * @type {string}
   * @memberof DiagnosticsMessage
   */
  get tip(): string {
    return this._tip;
  }

  /**
   * Data object can contain more detailed information about the diagnostics information
   * @type {any}
   * @memberof DiagnosticsMessage
   */
  get data(): any {
    return undefined;
  }
}
