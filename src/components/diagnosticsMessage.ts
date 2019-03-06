export enum DiagnosticsLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export class DiagnosticsMessage {
  type: string;
  level: DiagnosticsLevel = DiagnosticsLevel.INFO;
  message: string = '';
  data: any;
  constructor(type: string) {
    this.type = type;
  }
}

export class MinMaxDiagnosticsMessage extends DiagnosticsMessage {
  constructor(type: string, minTreshold: Number, maxTreshold: Number,
      min: Number, max: Number, curr: Number) {
    super(type);

    if (min <= minTreshold) {
      this.level = DiagnosticsLevel.ERROR;
      this.message = `${type} low.
        Measured ${min}. Current: ${curr}
        Minimum ${type} is ${minTreshold}`;
    } else if (max >= maxTreshold) {
      this.level = DiagnosticsLevel.ERROR;
      this.message = `${type} high.
        Measured ${max}. Current: ${curr}
        Maximum ${type} is ${maxTreshold}`;
    } else {
      this.level = DiagnosticsLevel.INFO;
      this.message = `${type} Ok`;
    }
  }

}