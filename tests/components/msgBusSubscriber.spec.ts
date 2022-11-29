import sinon from 'sinon';
import { expect } from 'chai';
import { transportMock } from '../mocks/devicemanager.mock';
import MsgBusSubscriber from '../../src/components/msgBusSubscriber';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

describe('MsgBusSubscriber', () => {
  const subscribeMsg = 'autozoom/framing';
  let msgBusSubscriber: MsgBusSubscriber;
  let transportSubscribeStub;
  let transportOnStub;
  let transportUnsubscribeStub;
  let transportRemoveListenerStub;
  let unsubscribeStub;

  const initHandler = () => {
    return 'Test';
  };
  beforeEach(() => {
    msgBusSubscriber = new MsgBusSubscriber(transportMock as IUsbTransport, initHandler);
    transportSubscribeStub = sinon.stub(msgBusSubscriber._transport, 'subscribe');
    transportOnStub = sinon.stub(msgBusSubscriber._transport, 'on');
    transportUnsubscribeStub = sinon.stub(msgBusSubscriber._transport, 'unsubscribe');
    transportRemoveListenerStub = sinon.stub(msgBusSubscriber._transport, 'removeListener');
  });
  afterEach(() => {
    transportSubscribeStub.restore();
    transportOnStub.restore();
    transportUnsubscribeStub.restore();
    transportRemoveListenerStub.restore();
  });
  it('should set _transport and _subscriptionHandler', () => {
    expect(msgBusSubscriber._transport).to.deep.equal(transportMock);
    expect(msgBusSubscriber._subscriptionHandler()).to.equal(initHandler());
  });

  describe('#subscribe', () => {
    describe('when successful', () => {
      it('should set _currentSubscription to true', async () => {
        await msgBusSubscriber.subscribe({ msgBusCmd: subscribeMsg });
        expect(msgBusSubscriber._currentSubscription).equals(subscribeMsg);
      });
      it('should subscribe to given message', async () => {
        await msgBusSubscriber.subscribe({ msgBusCmd: subscribeMsg });
        expect(transportSubscribeStub.getCall(0).args[0]).equals(subscribeMsg);
      });
      it('should listen to given message with handler', async () => {
        await msgBusSubscriber.subscribe({ msgBusCmd: subscribeMsg });
        expect(transportOnStub.getCall(0).args[0]).equals(subscribeMsg);
        expect(transportOnStub.getCall(0).args[1]()).equals(initHandler());
      });
      it('should update subscription handler if a new one is included in options', async () => {
        const testSubHandler = () => 'Hi';
        await msgBusSubscriber.subscribe({
          msgBusCmd: subscribeMsg,
          subscriptionHandler: testSubHandler,
        });
        expect(transportOnStub.getCall(0).args[1]()).equals(testSubHandler());
        expect(msgBusSubscriber._subscriptionHandler()).equals(testSubHandler());
      });
    });
    describe('when unsuccesful', () => {
      let errorLoggerStub;
      beforeEach(() => {
        transportSubscribeStub.rejects('error');
        unsubscribeStub = sinon.stub(msgBusSubscriber, 'unsubscribe');
        errorLoggerStub = sinon.stub(Logger, 'error');
      });
      afterEach(() => {
        unsubscribeStub.restore();
        errorLoggerStub.restore();
      });
      it('should unsubscribe to msg', async () => {
        await msgBusSubscriber.subscribe({ msgBusCmd: subscribeMsg }).catch(() => {});
        expect(unsubscribeStub).to.have.callCount(1);
      });
      it('should log error', async () => {
        await msgBusSubscriber.subscribe({ msgBusCmd: subscribeMsg }).catch(() => {});
        expect(errorLoggerStub).to.have.callCount(1);
        // We want to make sure that stack trace gets logged
        expect(errorLoggerStub.getCall(0).args.length > 1).equals(true);
      });
      it('should throw error', () => {
        msgBusSubscriber.subscribe({ msgBusCmd: subscribeMsg }).catch((err) => {
          expect(err).equals('error');
        });
      });
    });
    describe('when previously subscribed', () => {
      beforeEach(async () => {
        unsubscribeStub = sinon.stub(msgBusSubscriber, 'unsubscribe');
        await msgBusSubscriber.subscribe({ msgBusCmd: subscribeMsg });
      });
      afterEach(() => {
        unsubscribeStub.restore();
      });
      it('should unsubscribe to previous message', async () => {
        const newSub = 'autozoom/plaza/framing';
        await msgBusSubscriber.subscribe({ msgBusCmd: newSub });
        expect(unsubscribeStub).to.have.callCount(1);
      });
      it('should subscribe to new msg', async () => {
        unsubscribeStub.reset();
        const newSub = 'autozoom/plaza/framing';
        await msgBusSubscriber.subscribe({ msgBusCmd: newSub });
        // Getting 2nd call because it's already run once in setup
        expect(transportSubscribeStub.getCall(1).args[0]).equals(newSub);
        expect(transportOnStub.getCall(1).args[0]).equals(newSub);
      });
      it('should update set _currentSubscription to the new msg', async () => {
        const newSub = 'autozoom/plaza/framing';
        await msgBusSubscriber.subscribe({ msgBusCmd: newSub });
        expect(msgBusSubscriber._currentSubscription).equals(newSub);
      });
    });
  });
  describe('#unsubscribe', () => {
    beforeEach(async () => {
      await msgBusSubscriber.subscribe({ msgBusCmd: subscribeMsg });
    });
    it('should unsubscribe to current msg', async () => {
      await msgBusSubscriber.unsubscribe();
      expect(transportUnsubscribeStub.getCall(0).args[0]).equals(subscribeMsg);
    });
    it('should remove listener', async () => {
      await msgBusSubscriber.unsubscribe();
      expect(transportRemoveListenerStub.getCall(0).args[0]).equals(subscribeMsg);
      expect(transportRemoveListenerStub.getCall(0).args[1]()).equals(
        msgBusSubscriber._subscriptionHandler()
      );
    });
    it('should set _currentSubscription to undefined', async () => {
      await msgBusSubscriber.unsubscribe();
      expect(msgBusSubscriber._currentSubscription).equals(undefined);
    });
  });
});
