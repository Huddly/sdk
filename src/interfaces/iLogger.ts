export default interface ILogger {
  warn(message: string, component: string): void;

  info(message: string, component: string): void;

  debug(message: string, component: string): void;

  error(message: string, stackTrace: any, component: string): void;
}
