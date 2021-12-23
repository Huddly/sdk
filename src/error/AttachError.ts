/**
 * Error/Exception class used for reporting problems during device attach/discovery.
 *
 * @export
 * @class AttachError
 * @extends {Error}
 */
export default class AttachError extends Error {
  code: Number;
  constructor(message: string, code: Number) {
    super(message);
    this.code = code;
  }
}
