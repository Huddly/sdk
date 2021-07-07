/**
 * Interface used to communicate with the physical device.
 *
 * @ignore
 * @interface ITransport
 */
export default interface ITransport {
  /**
   * An instance of the discovered Huddly device.
   *
   * @type {*}
   * @memberof ITransport
   */
  device: any;

  /**
   * Prepares the device for communication (opening the device, claiming the interface/endpoints)
   *
   * @returns {Promise<void>} Returns a promise which resolves in case the device initialisation
   * is completed, otherwise it rejects with an error message.
   * @memberof ITransport
   */
  init(): Promise<void>;

  /**
   * EventEmitter `on` method used to register event listeners.
   *
   * @param {string} message The message use to setup the listener for.
   * @param {*} listener The listener handler.
   * @memberof ITransport
   */
  on(message: string, listener: any);

  /**
   * EventEmitter `removeListener` method used to remove an event listener.
   *
   * @param {string} message The message use to remove the listener for.
   * @param {*} listener The listener handler.
   * @memberof ITransport
   */
  removeListener(message: string, listener: any);

  /**
   * A function similar to `removeListener` expect no listener handler is
   * provided.
   *
   * @param {string} [message] Optional event listener name.
   * @memberof ITransport
   */
  removeAllListeners(message?: string);

  /**
   * Clears the communication channel, releases corresponding device interfaces
   * and closes the device.
   *
   * @returns {Promise<any>} A promise representing the status of the close action.
   * @memberof ITransport
   */
  close(): Promise<any>;
}
