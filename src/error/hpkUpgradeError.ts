/**
 * Error/Exception class used for reporting problems occurring during firmware upgrade of Huddly IQ/ONE/Canvas devices.
 *
 * @export
 * @class HPKUpgradeError
 * @extends {Error}
 */
export default class HPKUpgradeError extends Error {
  code: Number;
  constructor(message, code) {
    super(message);
    this.code = code;
  }

  toString(): String {
    return `Upgrade HPK: ${super.toString()}`;
  }
}
