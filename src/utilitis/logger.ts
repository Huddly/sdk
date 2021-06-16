import fs from 'fs';
import ILogger from './../interfaces/ILogger';

/**
 * Huddly Logger class.
 *
 * Use HUDDLY_LOG_LEVEL env variable to configure the log level on the SDK. The following values apply
 * - DEBUG - log all gRPC messages
 * - INFO - log INFO and ERROR message
 * - ERROR - log only errors (default)
 * - NONE - won't log any
 *
 * Use HUDDLY_LOG_CHANNEL env variable to configure where the logs will be directed to. The following
 * values apply:
 * - CONSOLE - Write logs to system console
 * - FILE - Write logs to a dedicated file provided by HUDDLY_LOG_FILE
 *
 * USE HUDDLY_LOG_FILE env variable to specify the file where the logs will be directed to.
 *
 * @example
 * // Print all logs and redirect them to a file
 * export HUDDLY_LOG_LEVEL=DEBUG && HUDDLY_LOG_CHANNEL=FILE && HUDDLY_LOG_FILE=/users/johndoe/huddlysdk.log
 * node sdkexample.js
 *
 * // Print INFO && ERROR logs and redirect them to console out
 * export HUDDLY_LOG_LEVEL=INFO
 * node sdkexample.js
 *
 * // Disable all log output
 * export HUDDLY_LOG_LEVEL=NONE
 * node sdkexample.js
 */
export default class Logger {
  static customLogger: ILogger = undefined;

  static setLogger(logger: ILogger): void {
    Logger.customLogger = logger;
  }

  static warn(message: string, component: string = 'Generic Component'): void {
    if (['DEBUG'].indexOf(process.env.HUDDLY_LOG_LEVEL) > -1) {
      if (Logger.customLogger) {
        Logger.customLogger.warn(message);
        return;
      }

      this.redirectLogMsg(this.formatLogMsg('WARN', component, message));
    }
  }

  static info(message: string, component: string = 'Generic Component'): void {
    if (['INFO', 'DEBUG'].indexOf(process.env.HUDDLY_LOG_LEVEL) > -1) {
      if (Logger.customLogger) {
        Logger.customLogger.info(message);
        return;
      }

      this.redirectLogMsg(this.formatLogMsg('INFO', component, message));
    }
  }

  static debug(message: string, component: string = 'Generic Component'): void {
    if (['DEBUG'].indexOf(process.env.HUDDLY_LOG_LEVEL) > -1) {
      if (Logger.customLogger) {
        Logger.customLogger.debug(message);
        return;
      }

      this.redirectLogMsg(this.formatLogMsg('DEBUG', component, message));
    }
  }

  static error(message: string, stackTrace: any, component: string = 'Generic Component'): void {
    if (['NONE'].indexOf(process.env.HUDDLY_LOG_LEVEL) == -1) {
      if (Logger.customLogger) {
        Logger.customLogger.error(message, stackTrace);
        return;
      }

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
