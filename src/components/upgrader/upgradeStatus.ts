export class UpgradeStatusStep {
  private _name: string;
  private _progress: number = 0;
  private _weight: number = 1;
  private _operation: string;

  constructor(name: string, weight?: number) {
    this._name = name;
    if (weight) this._weight = weight;
  }

  get name(): string {
    return this._name;
  }

  set operation(operation: string) {
    this._operation = operation;
  }

  get operation(): string {
    return this._operation;
  }

  get weight(): number {
    return this._weight;
  }

  get progress(): number {
    return this._progress;
  }

  set progress(progress: number) {
    this._progress = progress;
  }
}

export default class UpgradeStatus {
  private _statusString: string = 'Not Started';
  private _steps: Array<UpgradeStatusStep> = [];
  private _weights: number = 0;

  constructor(upgradeSteps: Array<UpgradeStatusStep>) {
    this._steps = upgradeSteps;
    this._steps.forEach((s) => {
      this._weights += s.weight;
    });
  }

  set statusString(statusString: string) {
    this._statusString = statusString;
  }

  getStatus() {
    let progress = 0;
    this._steps.forEach((s) => {
      progress += (s.weight / this._weights) * s.progress;
    });

    return {
      status: this._statusString,
      progress: Math.ceil(progress),
      steps: this._steps,
    };
  }
}