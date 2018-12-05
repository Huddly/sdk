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
   * A number which determins how long the event read loop should wait
   * until it proceeds to the next iteration.
   *
   * @type {number}
   * @memberof ITransport
   */
  eventLoopSpeed: number;

  /**
   * A setter function for the eventLoopSpeed class attribute.
   *
   * @param {number} [timeout] Timeout parameter used to configure the event loop speed.
   * @memberof ITransport
   */
  setEventLoopReadSpeed(timeout?: number): void;

  /**
   * Prepares the device for communication (opening the device, claiming the interface/endpoints)
   *
   * @returns {Promise<void>} Returns a promise which resolves in case the device initialisation
   * is completed, otherwise it rejects with an error message.
   * @memberof ITransport
   */
  init(): Promise<void>;

  /**
   * Starts the read event loop.
   *
   * @memberof ITransport
   */
  initEventLoop(): void;

  /**
   * A function that spins up the event loop that
   * emitts an event as soon as a message is read back from the device.
   *
   * @returns {Promise<void>} Void
   * @memberof ITransport
   */
  startListen(): Promise<void>;

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
   * A helper function which sets up a listener for the provided
   * message parameter and resolves as soon as that message is
   * emitted from the read event loop.
   *
   * @param {string} message The name of the event to listen to.
   * @param {number} [timeout] An optional parameter used to determin
   * how long the function should wait for the event to happen before
   * it times out.
   * @returns {Promise<any>} The decoded message that is received from
   * the device.
   * @memberof ITransport
   */
  receiveMessage(message: string, timeout?: number): Promise<any>;

  /**
   * Reads messages from the device.
   *
   * @param {string} [receiveMsg] An optional parameter used to log the message that is expected
   * to be sent from the camera back.
   * @param {number} [timeout] An optional parameter that controls how long to wait for a
   * message to be received until it times out.
   * @returns {Promise<any>} Returns an object that represend the decoded message received from
   * the device.
   * @memberof ITransport
   */
  read(receiveMsg?: string, timeout?: number): Promise<any>;

  /**
   * Sends a message to the device.
   *
   * @param {string} cmd The command message to be sent.
   * @param {Buffer} [payload] The payload accompanying the message.
   * @returns {Promise<any>} A promise that resolves in case the message is
   * sucessfully sent to the device, otherwise it rejects with an error message.
   * @memberof ITransport
   */
  write(cmd: string, payload?: Buffer): Promise<any>;

  /**
   * Send a subscription message to the device.
   *
   * @param {string} command The message to subscribed to.
   * @returns {Promise<any>} A promise representing the status of the subscription action.
   * @memberof ITransport
   */
  subscribe(command: string): Promise<any>;

  /**
   * Send an unsubscription message to the device.
   *
   * @param {string} command The message to unsubscribed to.
   * @returns {Promise<any>} A promise representing the status of the unsubscription action.
   * @memberof ITransport
   */
  unsubscribe(command: string): Promise<any>;

  /**
   * Performs a communication reset sequence on the device.
   *
   * @returns {Promise<any>} A promise representing the status of the clear action.
   * @memberof ITransport
   */
  clear(): Promise<any>;

  /**
   * Clears the communication channel, releases corresponding device interfaces
   * and closes the device.
   *
   * @returns {Promise<any>} A promise representing the status of the close action.
   * @memberof ITransport
   */
  close(): Promise<any>;

  /**
   * Removes all listeners and stops the read event loop.
   *
   * @returns {Promise<void>} Void
   * @memberof ITransport
   */
  stopEventLoop(): Promise<void>;
}
