export enum DiagnosticsLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export abstract class DiagnosticsMessage {
  protected _type: string;
  protected _level: DiagnosticsLevel = DiagnosticsLevel.INFO;
  protected _message: string = '';
  protected _tip: string = 'No tip available';
  constructor(type: string) {
    this._type = type;
  }

  get message(): string {
    return this._message;
  }

  get type(): string {
    return this._type;
  }

  get level(): DiagnosticsLevel {
    return this._level;
  }

  get tip(): string {
    return this._tip;
  }

  get data(): any {
    return undefined;
  }
}

export class DiagnosticsMessageData extends DiagnosticsMessage {
  protected _data: any;
  constructor(type: string, message: string, data: any) {
    super(type);

    this._message = message;
    this._data = data;
  }

  get data(): any {
    return this._data;
  }
}

export class MinMaxDiagnosticsMessage extends DiagnosticsMessage {
  constructor(
    type: string,
    minTreshold: Number,
    maxTreshold: Number,
    min: Number,
    max: Number,
    curr: Number,
    minTip?: string,
    maxTip?: string
  ) {
    super(type);

    if (min <= minTreshold) {
      this._level = DiagnosticsLevel.ERROR;
      this._message = `${type} low.
        Measured ${min}. Current: ${curr}
        Minimum ${type} is ${minTreshold}`;
      this._tip = minTip;
    } else if (max >= maxTreshold) {
      this._level = DiagnosticsLevel.ERROR;
      this._message = `${type} high.
        Measured ${max}. Current: ${curr}
        Maximum ${type} is ${maxTreshold}`;
      this._tip = maxTip;
    } else {
      this._level = DiagnosticsLevel.INFO;
      this._message = `${type} Ok`;
    }
  }
}
