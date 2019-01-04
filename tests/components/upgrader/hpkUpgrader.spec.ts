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
    function mockSucessMessages() {
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
      dummyCameraManager.transport.on.withArgs('upgrader/status').callsArgWith(1, {
        payload: Api.encode({ operation: 'done' })
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

      it('should throw if status is not zero', () => {
        dummyCameraManager.api.sendAndReceiveMessagePack.resolves({
          status: 1
        });
        return hpkUpgrader.start().should.be.rejectedWith(Error);
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
      it('should wait for run completion if return success', () => {
        mockSucessMessages();
        hpkUpgrader.init({
          file: validHpkBuffer,
        });
        return hpkUpgrader.start();
      });

      it('should throw if run fails', () => {
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

        return hpkUpgrader.start().should.be.rejectedWith(Error);
      });
    });

    describe('running hpk', () => {
      it('should throw if run fails', () => {
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

        return hpkUpgrader.start().should.be.rejectedWith(Error);
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
          }
        });

        const upgradeProgressPromise = new Promise(resolve => {
          hpkUpgrader.on('UPGRADE_PROGRESS', message => {
            if (message.operation === 'read_flash') {
              resolve(message);
            }
          });
        });

        hpkUpgrader.init({
          file: validHpkBuffer,
        });

        hpkUpgrader.start();

        const { operation, progress } = <any>await upgradeProgressPromise;
        expect(progress).to.equal(91.7931151465113);
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
