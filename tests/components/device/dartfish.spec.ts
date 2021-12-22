import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import fs from 'fs';
import path from 'path';

import ITransport from '@huddly/sdk-interfaces/lib/interfaces/ITransport';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';

import Dartfish from './../../../src/components/device/dartfish';
import { EventEmitter } from 'events';
import CameraEvents from './../../../src/utilitis/events';
import Api from './../../../src/components/api';

chai.should();
chai.use(sinonChai);

class DummyTransport extends EventEmitter implements ITransport {
  device: any;  eventLoopSpeed: number;
  setEventLoopReadSpeed(timeout?: number): void {
    throw new Error('Method not implemented.');
  }
  init(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  initEventLoop(): void {
    throw new Error('Method not implemented.');
  }
  startListen(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  receiveMessage(message: string, timeout?: number): Promise<any> {
    throw new Error('Method not implemented.');
  }
  read(receiveMsg?: string, timeout?: number): Promise<any> {
    throw new Error('Method not implemented.');
  }
  write(cmd: string, payload?: Buffer): Promise<any> {
    throw new Error('Method not implemented.');
  }
  subscribe(command: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  unsubscribe(command: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  clear(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  close(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  stopEventLoop(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

class DummyUpgrader extends EventEmitter implements IDeviceUpgrader {
  init(opts: import('@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts').default): void {
    return;
  }
  start(): Promise<void> {
    return Promise.resolve();
  }
  upgradeIsValid(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}

describe('Dartfish', () => {
  let device: Dartfish;
  beforeEach(() => {
    device = new Dartfish(
      {},
      sinon.createStubInstance(DummyTransport),
      {},
      new EventEmitter(),
    );
  });

  describe('#upgrade', () => {
    let upgrader;
    const validBuffer = fs.readFileSync(path.resolve(__dirname, '../../testData/dummy.pkg'));
    beforeEach(() => {
      upgrader = new DummyUpgrader();
      sinon.spy(upgrader, 'start');
    });

    it('should use provided upgrader if one is provided', async () => {
      device.upgrade({
        file: Buffer.alloc(0),
        upgrader,
      });
      expect(upgrader.start).to.have.been.calledOnce;
    });

    it('should cerate a new upgrader if it fails on first attempt', async () => {
      await device.initialize();
      sinon.stub(device.api, 'sendAndReceiveMessagePack').resolves({});
      sinon.stub(device.api, 'getCameraInfo').resolves({
        softwareVersion: 'HuddlyIQ-9.9.9',
      });
      try {
        device.upgrade({
          file: validBuffer,
          upgrader,
        });
      } catch (e)  {
        // Will eventually fail which is ok
      }

      upgrader.emit(CameraEvents.UPGRADE_FAILED, {
        runAgain: true,
        deviceManager: device,
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(upgrader.start).to.have.been.calledOnce;
    });
  });

  describe('#reboot', () => {
    describe('on mvusb mode', () => {
      it('should send upgrader/mv_usb', async () => {
        await device.initialize();
        await device.reboot('mvusb');
        expect(device.transport.clear).to.have.been.calledOnce;
        expect(device.transport.write).to.have.been.calledOnce;
        expect(device.transport.write).to.have.been.calledWith('upgrader/mv_usb', Api.encode({}));
      });
    });
    describe('on other modes', () => {
      it('should only send reboot command', async () => {
        await device.initialize();
        await device.reboot();
        expect(device.transport.clear).to.have.been.calledOnce;
        expect(device.transport.write).to.have.been.calledOnce;
        expect(device.transport.write).to.have.been.calledWith('camctrl/reboot');
      });
    });
  });

  describe('#getLatestFirmwareUrl', () => {
    let getLatestFirmwareUrlStub;
    beforeEach(async () => {
      await device.initialize();
      getLatestFirmwareUrlStub = sinon.stub(device.api, 'getLatestFirmwareUrl').resolves({});
    });
    afterEach(() => {
      getLatestFirmwareUrlStub.restore();
    });

    it('should call api.getLatestFirmwareUrl', async () => {
      await device.getLatestFirmwareUrl();
      expect(getLatestFirmwareUrlStub.called).to.equals(true);
      expect(getLatestFirmwareUrlStub.getCall(0).args[0]).to.equals('iq');
      expect(getLatestFirmwareUrlStub.getCall(0).args[1]).to.equals(ReleaseChannel.STABLE);
    });

    it('should call api.getLatestFirmwareUrl with non-default channel', async () => {
      await device.getLatestFirmwareUrl(ReleaseChannel.RELEASE_CANDIDATE);
      expect(getLatestFirmwareUrlStub.called).to.equals(true);
      expect(getLatestFirmwareUrlStub.getCall(0).args[0]).to.equals('iq');
      expect(getLatestFirmwareUrlStub.getCall(0).args[1]).to.equals(ReleaseChannel.RELEASE_CANDIDATE);
    });
  });

  describe('#getDetector', () => {
    it('should throw an error', () => {
      expect(device.getDetector).to.throw('Method not implemented/supported.');
    });
  });

  describe('#getAutozoomControl', () => {
    it('should throw an error', () => {
      expect(device.getAutozoomControl).to.throw('Method not implemented/supported.');
    });
  });

  describe('#getState', () => {
    it('should throw an error', () => {
      expect(device.getState).to.throw('Method not implemented/supported.');
    });
  });


  describe('#setInterpolationParams', () => {
    it('should throw an error', async () => {
      try {
        await device.setInterpolationParams();
        throw new Error('should fail');
      } catch (e) {
        expect(e.message).equal('Method not implemented/supported.');
      }
    });
  });

  describe('#getInterpolationParams', () => {
    it('should throw an error', async () => {
      try {
        await device.getInterpolationParams();
        throw new Error('should fail');
      } catch (e) {
        expect(e.message).equal('Method not implemented/supported.');
      }
    });
  });

  describe('#disableCanvasEnhanceMode', () => {
    describe('on success', () => {
      it('should change to canvas-no-enhance', async () => {
        await device.initialize();
        sinon.stub(device.api, 'setProductInfo').resolves({});
        sinon.stub(device.api, 'getProductInfo').resolves({
          'camera-mode': 'canvas-no-enhance'
        });

        const promise = device.disableCanvasEnhanceMode();
        return expect(promise).to.be.fulfilled;
      });
    });
    describe('on error', () => {
      it('should reject if mode not updated', async () => {
        await device.initialize();
        sinon.stub(device.api, 'setProductInfo').resolves({});
        sinon.stub(device.api, 'getProductInfo').resolves({
          'camera-mode': 'canvas'
        });

        const promise = device.disableCanvasEnhanceMode();
        return expect(promise).to.eventually.be.rejectedWith('Unable to turn off canvas enhance mode!');
      });
    });
  });

  describe('#enableCanvasEnhanceMode', () => {
    describe('on success', () => {
      it('should change to canvas-no-enhance', async () => {
        await device.initialize();
        sinon.stub(device.api, 'setProductInfo').resolves({});
        sinon.stub(device.api, 'getProductInfo').resolves({
          'camera-mode': 'canvas'
        });

        const promise = device.enableCanvasEnhanceMode();
        return expect(promise).to.be.fulfilled;
      });
    });
    describe('on error', () => {
      it('should reject if mode not updated', async () => {
        await device.initialize();
        sinon.stub(device.api, 'setProductInfo').resolves({});
        sinon.stub(device.api, 'getProductInfo').resolves({
          'camera-mode': 'canvas-no-enhance'
        });

        const promise = device.enableCanvasEnhanceMode();
        return expect(promise).to.eventually.be.rejectedWith('Unable to turn on canvas enhance mode!');
      });
    });
  });
});
