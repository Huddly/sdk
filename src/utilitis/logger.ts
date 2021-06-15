/**
 * Huddly Logger class. Use HUDDLY_LOG_LEVEL env variable
 * to configure the log level on the SDK.
 *
 * Use the following
 * values:
 * - DEBUG - log all gRPC messages
 * - INFO - log INFO and ERROR message
 * - ERROR - log only errors (default)
 * - NONE - won't log any
 */
export default class Logger {
  static warn(message: string, component: string = 'Generic Component'): void {
    if (['DEBUG'].indexOf(process.env.HUDDLY_LOG_LEVEL) > -1) {
      console.warn(this.formatLogMsg('WARN', component, message));
    }
  }

  static info(message: string, component: string = 'Generic Component'): void {
    if (['INFO'].indexOf(process.env.HUDDLY_LOG_LEVEL) > -1) {
      console.log(this.formatLogMsg('INFO', component, message));
    }
  }

  static debug(message: string, component: string = 'Generic Component'): void {
    if (['DEBUG'].indexOf(process.env.HUDDLY_LOG_LEVEL) > -1) {
      console.log(this.formatLogMsg('DEBUG', component, message));
    }
  }

  static error(message: string, stackTrace: any, component: string = 'Generic Component'): void {
    if (['NONE'].indexOf(process.env.HUDDLY_LOG_LEVEL) == -1) {
      this.redirectLogMsg(this.formatLogMsg('ERROR', component, message));
      this.redirectLogMsg(stackTrace);
    }
  }

  static redirectLogMsg(message: string): void {
    if (process.env.HUDDLY_LOG_CHANNEL === 'FILE') {
      const logFile: string = process.env.HUDDLY_LOG_FILE || 'huddlysdk.log';
      fs.appendFileSync(logFile, `${message}\n`);
    } else {
      console.log(message);
    }
  }

  private static formatDate(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  private static getTime(date: Date): string {
    return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
  }

  private static formatLogMsg(logLevel: string, component: string, message: string): string {
    const now = new Date();
    return `${this.formatDate(now)} | ${this.getTime(
      now
    )} | ${logLevel} | ${component} | ${message}`;
  }
}
