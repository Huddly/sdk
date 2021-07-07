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
