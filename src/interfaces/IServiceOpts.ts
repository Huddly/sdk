/**
 * Interface describing the options used when setting up a new huddly camera service instance
 */
export default interface IServiceOpts {
  /**
   * Grpc connection deadline used to specify the maximum allowed time for a grpc connection
   * to complete. Time unit is given in seconds.
   *
   * @type {number}
   * @memberof IServiceOpts
   */
  connectionDeadline?: number;

  /**
   * Grpc channel connection credentials. For secure connection make sure you pass in your credentials
   * for establishing the connection with the huddly service grpc server.
   *
   * @type {any}
   * @memberof IServiceOpts
   */
  credentials?: any;
}
