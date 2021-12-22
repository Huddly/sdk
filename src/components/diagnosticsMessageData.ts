import DiagnosticsMessage, {
  DiagnosticsLevel,
} from '@huddly/sdk-interfaces/lib/abstract_classes/DiagnosticsMessage';

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
