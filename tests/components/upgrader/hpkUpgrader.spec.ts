import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

import HPKUpgrader from './../../../src/components/upgrader/hpkUpgrader';
import DefaultLogger from './../../../src/utilitis/logger';
import Boxfish from './../../../src/components/device/boxfish';
import CameraEvents from './../../../src/utilitis/events';
import Api from './../../../src/components/api';
import { executionAsyncId } from 'async_hooks';

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);

const dummyCameraManager = sinon.createStubInstance(Boxfish);
dummyCameraManager._api = {
  sendAndReceiveMessagePack: () => {},
  withSubscribe: () => {},
};

const validHpkBuffer = fs.readFileSync(path.resolve(__dirname, '../../testData/dummy.pkg'));

describe('HPKUpgrader', () => {
  let hpkUpgrader;
  let dummyEmitter;
  beforeEach(() => {
    dummyEmitter = new EventEmitter();
    dummyCameraManager.transport = new EventEmitter();
    dummyCameraManager.transport.close = () => {};
    dummyCameraManager.transport.stopEventLoop = () => {};
    hpkUpgrader = new HPKUpgrader(dummyCameraManager, dummyEmitter, new DefaultLogger(false));
  });

  describe('#init', () => {
    it('should emit UPGRADE_REBOOT_COMPLETE on ATTACH', () => {
      hpkUpgrader.init({});
      const upgradeCompletePromise = new Promise(resolve => {
        hpkUpgrader.once('UPGRADE_REBOOT_COMPLETE', resolve);
      });
      dummyEmitter.emit(CameraEvents.ATTACH, dummyCameraManager);
      return upgradeCompletePromise;
    });

    describe('DETACH', () => {
      beforeEach(() => {
        sinon.stub(dummyCameraManager.transport, 'close');
      });

      afterEach(() => {
        dummyCameraManager.transport.close.restore();
      });

      it('should close transport on DETACH', () => {
        hpkUpgrader.init({});
        dummyEmitter.emit(CameraEvents.DETACH);
        expect(dummyCameraManager.transport.close).to.have.been.calledOnce;
      });

      it('should emit UPGRADE_REBOOT on DETACH', () => {
        hpkUpgrader.init({});
        const upgradeRebootPromise = new Promise(resolve => {
          hpkUpgrader.once('UPGRADE_REBOOT', resolve);
        });
        dummyEmitter.emit(CameraEvents.DETACH);
        return upgradeRebootPromise;
      });
    });
  });

  describe('#start', () => {
    function mockSucessMessages(donePayload = {}) {
      dummyCameraManager.api.sendAndReceiveMessagePack.onCall(0).resolves({
        status: 0
      });
      dummyCameraManager.api.sendAndReceiveMessagePack.onCall(1).resolves({
        string: 'Success'
      });
      dummyCameraManager.api.sendAndReceiveMessagePack.onCall(2).resolves({
        status: 0
      });
      dummyCameraManager.api.sendAndReceiveMessagePack.onCall(3).resolves({
        string: 'Success'
      });
      dummyCameraManager.api.withSubscribe.callsFake((topic, cb) => {
        return cb();
      });
      dummyCameraManager.transport.on.withArgs('upgrader/status').callsArgWith(1, {
        payload: Api.encode({ operation: 'done', ...donePayload })
      });
    }
    beforeEach(() => {
      sinon.stub(dummyCameraManager.api, 'sendAndReceiveMessagePack');
      sinon.stub(dummyCameraManager.api, 'withSubscribe');
      sinon.stub(dummyCameraManager.transport, 'on');
    });

    afterEach(() => {
      dummyCameraManager.api.sendAndReceiveMessagePack.restore();
      dummyCameraManager.api.withSubscribe.restore();
      dummyCameraManager.transport.on.restore();
    });

    describe('upload hpk file', () => {
      beforeEach(() => {
        hpkUpgrader.init({
          file: validHpkBuffer,
        });
      });

      it('should throw if status is not zero', async () => {
        dummyCameraManager.api.sendAndReceiveMessagePack.resolves({
          status: 1
        });
        try {
          await hpkUpgrader.start();
          throw new Error('Should fail');
        } catch (e) {
          expect(e.code).to.equal(17);
        }
      });

      it('should emit UPGRADE_FAILED if status is not zero', () => {
        const upgradeFailedPromise = new Promise(resolve => {
          hpkUpgrader.once('UPGRADE_FAILED', resolve);
        });
        dummyCameraManager.api.sendAndReceiveMessagePack.resolves({
          status: 1
        });
        hpkUpgrader.start();
        return upgradeFailedPromise;
      });
    });

    describe('when uploaded run hpk', () => {
      beforeEach(() => {
        hpkUpgrader.init({
          file: validHpkBuffer,
        });
      });

      it('should wait for run completion if return success', () => {
        mockSucessMessages();
        return hpkUpgrader.start();
      });

      it('should throw if run fails', async () => {
        dummyCameraManager.api.sendAndReceiveMessagePack.onCall(0).resolves({
          status: 0
        });
        dummyCameraManager.api.sendAndReceiveMessagePack.onCall(1).resolves({
          string: 'Error'
        });
        dummyCameraManager.api.sendAndReceiveMessagePack.onCall(2).resolves({
          status: 0
        });
        dummyCameraManager.api.sendAndReceiveMessagePack.onCall(3).resolves({
          string: 'Success'
        });

        try {
          await hpkUpgrader.start();
          throw new Error('Should fail');
        } catch (e) {
          expect(e.code).to.equal(15);
        }
      });

      it('should try again until MAX_UPLOAD_ATTEMPTS have been reached', async () => {
        dummyCameraManager.api.sendAndReceiveMessagePack.throws(new Error('upload failed'));
        try {
          await hpkUpgrader.start();
        } catch (e) {
          expect(e.code).to.equal(17);
        }
        expect(dummyCameraManager.api.sendAndReceiveMessagePack).to.have.callCount(5);
      });
    });

    describe('running hpk', () => {
      beforeEach(() => {
        hpkUpgrader.init({
          file: validHpkBuffer,
        });
        sinon.stub(dummyCameraManager.transport, 'close');
      });
      afterEach(() => {
        dummyCameraManager.transport.close.restore;
      });

      it('should throw if run fails', async () => {
        dummyCameraManager.api.sendAndReceiveMessagePack.onCall(0).resolves({
          status: 0
        });
        dummyCameraManager.api.sendAndReceiveMessagePack.onCall(1).resolves({
          string: 'Error'
        });
        dummyCameraManager.api.sendAndReceiveMessagePack.onCall(2).resolves({
          status: 0
        });
        dummyCameraManager.api.sendAndReceiveMessagePack.onCall(3).resolves({
          string: 'Success'
        });
        dummyCameraManager.api.withSubscribe.callsArg(1);
        dummyCameraManager.transport.on.withArgs('upgrader/status').callsArgWith(1, {
          payload: Api.encode({ operation: 'done' })
        });

        try {
          await hpkUpgrader.start();
          throw new Error('Should fail');
        } catch (e) {
          expect(e.code).to.equal(15);
        }
      });

      it('should emit UPGRADE_PROGRESS with upgrade status as it progress', async () => {
        dummyCameraManager.api.sendAndReceiveMessagePack.onCall(0).resolves({
          status: 0
        });
        dummyCameraManager.api.sendAndReceiveMessagePack.onCall(1).resolves({
          string: 'Success'
        });
        dummyCameraManager.api.sendAndReceiveMessagePack.onCall(2).resolves({
          status: 0
        });
        dummyCameraManager.api.sendAndReceiveMessagePack.onCall(3).resolves({
          string: 'Success'
        });
        dummyCameraManager.api.withSubscribe.callsArg(1);
        dummyCameraManager.transport.on.callsFake((msg, fn) => {
          if (msg === 'upgrader/status') {
            fn({
              payload: Api.encode({
                operation: 'starting upgrade',
                total_points: 71739737.49,
              })
            });
            fn({
              payload: Api.encode({ operation: 'read_flash', elapsed_points: 65852139.84000063 })
            });
            fn({
              payload: Api.encode({  operation: 'done' })
            });
          }
        });

        const upgradeProgressPromise = new Promise(resolve => {
          hpkUpgrader.on('UPGRADE_PROGRESS', message => {
            if (message.progress > 82) {
              resolve(message);
            }
          });
        });

        hpkUpgrader.init({
          file: validHpkBuffer,
        });

        hpkUpgrader.start();

        const upgradeStatus = <any>await upgradeProgressPromise;
        expect(upgradeStatus.progress).to.be.above(0);
      });


      describe('watchdog', () => {
        it('should timeout if there no status message within specified timeout', async () => {
          dummyCameraManager.api.withSubscribe.callsFake((topics, cb) => cb());
          dummyCameraManager.transport.on.withArgs('upgrader/status').callsFake(() => {});
          dummyCameraManager.api.sendAndReceiveMessagePack.resolves({
            status: 0,
            string: 'Success'
          });

          hpkUpgrader.init({
            file: validHpkBuffer,
            statusMessageTimeout: 10,
          });

          const startPromise = hpkUpgrader.start();
          await new Promise(resolve => setImmediate(resolve));

          try {
            await startPromise;
            expect(true).to.be.equal(false);
          } catch (e) {
            expect(e.message).to.be.equal('Upgrading HPK: no status message within 10');
            expect(e.code).to.be.equal(12);
          }
        }).timeout(11000);
      });

      it('should not throw an error if transport close fails', () => {
        mockSucessMessages({reboot: false});
        dummyCameraManager.transport.close.throws(new Error('transport close failed'));
        hpkUpgrader.init({
          file: validHpkBuffer,
        });
        const completedPromise = new Promise(resolve => {
          hpkUpgrader.on('UPGRADE_COMPLETE', resolve);
        });
        hpkUpgrader.start();
        return expect(completedPromise).to.eventually.be.resolved;
      });

      it('should complete if it gets done without reboot initally', () => {
        mockSucessMessages({reboot: false});
        hpkUpgrader.init({
          file: validHpkBuffer,
        });
        const completedPromise = new Promise(resolve => {
          hpkUpgrader.on('UPGRADE_COMPLETE', resolve);
        });
        hpkUpgrader.start();
        return completedPromise;
      });

      describe('after reboot', () => {
        let clock;
        beforeEach(() => {
          clock = sinon.useFakeTimers();
        });

        afterEach(() => {
          clock.restore();
        });

        it('should timeout if camera does not come back', async () => {
          mockSucessMessages({reboot: true});
          hpkUpgrader.init({
            file: validHpkBuffer,
          });
          const failedPromise = new Promise((resolve, reject) => {
            hpkUpgrader.on('UPGRADE_FAILED', reject);
          });
          await hpkUpgrader.start();
          clock.tick(10000);
          try {
            await failedPromise;
            throw new Error('Should fail');
          } catch (e) {
            expect(e.message).to.be.equal('Did not come back after reboot');
            expect(e.code).to.be.equal(10);
          }
        }).timeout(11000);
      });
    });
  });

  describe('#upgradeIsValid', () => {
    it('should be be true upgrade_status if status is 0', async () => {
      dummyCameraManager.getState.resolves({
        status: 0
      });

      const isValid = await hpkUpgrader.upgradeIsValid();
      expect(isValid).to.equal(true);
    });

    it('should be be true upgrade_status if status is not 0', async () => {
      dummyCameraManager.getState.resolves({
        status: 12
      });

      const isValid = await hpkUpgrader.upgradeIsValid();
      expect(isValid).to.equal(false);
    });

    it('should be be false if upgrade_status throws ', async () => {
      dummyCameraManager.getState.rejects({});

      const isValid = await hpkUpgrader.upgradeIsValid();
      expect(isValid).to.equal(false);
    });
  });
});
