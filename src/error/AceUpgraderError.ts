/**
 * Error/Exception class used for reporting problems occurring during firmware upgrade of Huddly ACE/L1 devices.
 *
 * @export
 * @class AceUpgradeError
 * @extends {Error}
 */
export default class AceUpgradeError extends Error {
  code: Number;
  constructor(message, code) {
    super(message);
    this.code = code;
  }

  toString(): String {
    return `AceUpgradeError: ${super.toString()}`;
  }
}
