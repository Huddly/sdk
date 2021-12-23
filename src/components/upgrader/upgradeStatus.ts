/**
 * Helper class for describing upgrade steps. Each step is consisted of a descriptive name,
 * progress indication, a weight value and an string describing the operation of the step.
 *
 * @export
 * @class UpgradeStatusStep
 */
export class UpgradeStatusStep {
  /**
   * Name of the upgrade step. Something descriptive and easy to understand.
   *
   * @private
   * @type {string}
   * @memberof UpgradeStatusStep
   */
  private _name: string;
  /**
   * Number indicating the progress of the upgrade step so far.
   *
   * @private
   * @type {number}
   * @memberof UpgradeStatusStep
   */
  private _progress: number = 0;
  /**
   * Number indicating the weight of the upgrade step towards the whole upgrade process.
   *
   * @private
   * @type {number}
   * @memberof UpgradeStatusStep
   */
  private _weight: number = 1;
  /**
   * A descriptive string describing the operation of the step.
   *
   * @private
   * @type {string}
   * @memberof UpgradeStatusStep
   */
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

/**
 * Class representing the upgrade status during an upgrade process. An upgrade status is
 * consisted of steps and total upgrade weight.
 *
 * @export
 * @class UpgradeStatus
 */
export default class UpgradeStatus {
  /**
   * A string describing the upgrade status state.
   *
   * @private
   * @type {string}
   * @memberof UpgradeStatus
   */
  private _statusString: string = 'Not Started';
  /**
   * A list of upgrade steps that will be carried out during the upgrade process.
   *
   * @private
   * @type {Array<UpgradeStatusStep>}
   * @memberof UpgradeStatus
   */
  private _steps: Array<UpgradeStatusStep> = [];
  /**
   * A number representing the total weight of the upgrade process.
   *
   * @private
   * @type {number}
   * @memberof UpgradeStatus
   */
  private _weights: number = 0;

  constructor(upgradeSteps: Array<UpgradeStatusStep>) {
    this._steps = upgradeSteps;
    this._steps.forEach((s) => {
      this._weights += s.weight;
    });
  }

  /**
   * Setter class for updating the status string attribute of the class.
   *
   * @memberof UpgradeStatus
   */
  set statusString(statusString: string) {
    this._statusString = statusString;
  }

  /**
   * Calculates the status so far during the upgrade process.
   *
   * @return {*} An object representing the current upgrade state, the progress (in percentage) and the list of
   * steps involved in the upgrade process.
   * @memberof UpgradeStatus
   */
  getStatus() {
    let progress: number = 0;
    this._steps.forEach((s) => {
      progress += (s.weight / this._weights) * s.progress;
    });

    return {
      status: this._statusString,
      progress: Math.round(progress),
      steps: this._steps,
    };
  }
}
