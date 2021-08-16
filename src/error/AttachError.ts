export default class AttachError extends Error {
  code: Number;
  constructor(message: string, code: Number) {
    super(message);
    this.code = code;
  }
}
