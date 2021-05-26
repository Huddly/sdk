import ITransport from './iTransport';

/**
 * Interface used to communicate with the usb device.
 *
 * @ignore
 * @interface IUsbTransport
 */
export default interface IUsbTransport extends ITransport {
  /**
   * A number which determins how long the event read loop should wait
   * until it proceeds to the next iteration.
   *
   * @type {number}
   * @memberof IUsbTransport
   */
  eventLoopSpeed: number;

  /**
   * A setter function for the eventLoopSpeed class attribute.
   *
   * @param {number} [timeout] Timeout parameter used to configure the event loop speed.
   * @memberof IUsbTransport
   */
  setEventLoopReadSpeed(timeout?: number): void;

  /**
   * Starts the read event loop.
   *
   * @memberof IUsbTransport
   */
  initEventLoop(): void;

  /**
   * A function that spins up the event loop that
   * emitts an event as soon as a message is read back from the device.
   *
   * @returns {Promise<void>} Void
   * @memberof IUsbTransport
   */
  startListen(): Promise<void>;

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
   * @memberof IUsbTransport
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
   * @memberof IUsbTransport
   */
  read(receiveMsg?: string, timeout?: number): Promise<any>;

  /**
   * Sends a message to the device.
   *
   * @param {string} cmd The command message to be sent.
   * @param {Buffer} [payload] The payload accompanying the message.
   * @returns {Promise<any>} A promise that resolves in case the message is
   * sucessfully sent to the device, otherwise it rejects with an error message.
   * @memberof IUsbTransport
   */
  write(cmd: string, payload?: Buffer): Promise<any>;

  /**
   * Send a subscription message to the device.
   *
   * @param {string} command The message to subscribed to.
   * @returns {Promise<any>} A promise representing the status of the subscription action.
   * @memberof IUsbTransport
   */
  subscribe(command: string): Promise<any>;

  /**
   * Send an unsubscription message to the device.
   *
   * @param {string} command The message to unsubscribed to.
   * @returns {Promise<any>} A promise representing the status of the unsubscription action.
   * @memberof IUsbTransport
   */
  unsubscribe(command: string): Promise<any>;

  /**
   * Performs a communication reset sequence on the device.
   *
   * @returns {Promise<any>} A promise representing the status of the clear action.
   * @memberof IUsbTransport
   */
  clear(): Promise<any>;

  /**
   * Removes all listeners and stops the read event loop.
   *
   * @returns {Promise<void>} Void
   * @memberof IUsbTransport
   */
  stopEventLoop(): Promise<void>;
}
