export default class Logger {
  _verbose: boolean;

  constructor(verbose: boolean) {
    this._verbose = verbose;
  }

  warn(message: string, component: string = 'Generic Component'): void {
    if (this.verbose) {
      console.warn(this.formatLogMsg('WARN', component, message));
    }
  }

  info(message: string, component: string = 'Generic Component'): void {
    if (this.verbose) {
      console.log(this.formatLogMsg('INFO', component, message));
    }
  }

  debug(message: string, component: string = 'Generic Component'): void {
    if (this.verbose) {
      console.log(this.formatLogMsg('DEBUG', component, message));
    }
  }

  error(message: string, stackTrace: string, component: string = 'Generic Component'): void {
    if (this.verbose) {
      console.error(this.formatLogMsg('ERROR', component, message));
      console.error(stackTrace);
    }
  }

  get verbose(): boolean {
    return this._verbose;
  }

  set verbose(verbose: boolean) {
    this._verbose = verbose;
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  private getTime(date: Date): string {
    return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
  }

  private formatLogMsg(logLevel: string, component: string, message: string): string {
    const now = new Date();
    return `${this.formatDate(now)} | ${this.getTime(
      now
    )} | ${logLevel} | ${component} | ${message}`;
  }
}
