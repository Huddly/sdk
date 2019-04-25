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
