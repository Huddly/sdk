import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import IMsgBusSubscriber, {
  MsgBusSubscriberOptions,
} from '@huddly/sdk-interfaces/lib/interfaces/IMsgBusSubscriber';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

/**
 * Class for handling framing subscriptions
 */
export default class MsgBusSubscriber implements IMsgBusSubscriber {
  _transport: IUsbTransport;
  _currentSubscription: string;
  _subscriptionHandler: Function;

  constructor(transport: IUsbTransport, subscriptionHandler: Function) {
    this._transport = transport;
    this._subscriptionHandler = subscriptionHandler;
    this._currentSubscription = undefined;
  }

  get currentSubscription() {
    return this._currentSubscription;
  }

  /**
   * Initialize the framing subscriber to use a given
   * subscription handler and autozoom mode.
   * @param {FramingSubscriberOptions} options
   */
  async subscribe({ msgBusCmd, subscriptionHandler }: MsgBusSubscriberOptions): Promise<void> {
    if (this._currentSubscription) {
      this.unsubscribe();
    }

    if (subscriptionHandler) {
      this._subscriptionHandler = subscriptionHandler;
    }

    try {
      await this._transport.subscribe(msgBusCmd);
      this._transport.on(msgBusCmd, this._subscriptionHandler);
      this._currentSubscription = msgBusCmd;
    } catch (err) {
      await this.unsubscribe();
      Logger.error(`Unable to subscribe to ${msgBusCmd}`, err, MsgBusSubscriber.name);
      throw err;
    }
  }

  /**
   * Removes the subscription from the transport.
   */
  async unsubscribe(): Promise<void> {
    await this._transport.unsubscribe(this._currentSubscription);
    this._transport.removeListener(this._currentSubscription, this._subscriptionHandler);
    this._currentSubscription = undefined;
  }
}
