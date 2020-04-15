export default interface ILogger {
  warn(message: string, component): void;

  info(message: string, component): void;

  debug(message: string, component): void;

  error(message: string, stackTrace: string): void;
}
