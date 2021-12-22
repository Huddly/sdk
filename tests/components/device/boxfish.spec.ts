import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import fs from 'fs';
import path from 'path';

import ITransport from '@huddly/sdk-interfaces/lib/interfaces/ITransport';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';

import Boxfish from './../../../src/components/device/boxfish';
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

describe('Boxfish', () => {
  let device: Boxfish;
  beforeEach(() => {
    device = new Boxfish(
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

  describe('#getDiagnostics', () => {
    it('should give you current diagonstics info', async () => {
      await device.initialize();
      sinon.stub(device.api, 'sendAndReceiveMessagePack').resolves({
        voltage:
          { min: 5.136000156402588,
            curr: 5.136000156402588,
            max: 5.144000053405762,
            avg: 5.140143871307373 },
         current:
          { min: 0.2849999964237213,
            curr: 0.28999999165534973,
            max: 0.3230000138282776,
            avg: 0.3018396198749542 },
         power:
          { min: 1.472000002861023,
            curr: 1.5139999389648438,
            max: 1.565999984741211,
            avg: 1.505385160446167 }
      });

      const diagnostics = await device.getDiagnostics();
      const currentInfo = diagnostics.find(d => d.type === 'Current');

      expect(currentInfo.message).to.be.equal('Current Ok');
    });

    it('should give you current is too heigh it should report it', async () => {
      await device.initialize();
      sinon.stub(device.api, 'sendAndReceiveMessagePack').resolves({
        voltage:
          { min: 5.136000156402588,
            curr: 5.136000156402588,
            max: 5.144000053405762,
            avg: 5.140143871307373 },
         current:
          { min: 0.2849999964237213,
            curr: 0.99,
            max: 0.99,
            avg: 0.3018396198749542 },
         power:
          { min: 1.472000002861023,
            curr: 1.5139999389648438,
            max: 1.565999984741211,
            avg: 1.505385160446167 }
      });

      const diagnostics = await device.getDiagnostics();
      const currentInfo = diagnostics.find(d => d.type === 'Current');

      expect(currentInfo.message).to.include('Current high');
    });

    it('should give you volgate diagonstics info', async () => {
      await device.initialize();
      sinon.stub(device.api, 'sendAndReceiveMessagePack').resolves({
        voltage:
          { min: 5.136000156402588,
            curr: 5.136000156402588,
            max: 5.144000053405762,
            avg: 5.140143871307373 },
         current:
          { min: 0.2849999964237213,
            curr: 0.28999999165534973,
            max: 0.3230000138282776,
            avg: 0.3018396198749542 },
         power:
          { min: 1.472000002861023,
            curr: 1.5139999389648438,
            max: 1.565999984741211,
            avg: 1.505385160446167 }
      });

      const diagnostics = await device.getDiagnostics();
      const currentInfo = diagnostics.find(d => d.type === 'Voltage');

      expect(currentInfo.message).to.be.equal('Voltage Ok');
    });

    it('should give you voltage is too heigh it should report it', async () => {
      await device.initialize();
      sinon.stub(device.api, 'sendAndReceiveMessagePack').resolves({
        voltage:
          { min: 5.136000156402588,
            curr: 5.136000156402588,
            max: 6.144000053405762,
            avg: 5.140143871307373 },
         current:
          { min: 0.2849999964237213,
            curr: 0.99,
            max: 0.99,
            avg: 0.3018396198749542 },
         power:
          { min: 1.472000002861023,
            curr: 1.5139999389648438,
            max: 1.565999984741211,
            avg: 1.505385160446167 }
      });

      const diagnostics = await device.getDiagnostics();
      const currentInfo = diagnostics.find(d => d.type === 'Voltage');

      expect(currentInfo.message).to.include('Voltage high');
    });

    it('should give the usb mode', async () => {
      await device.initialize();
      sinon.stub(device.api, 'sendAndReceiveMessagePack').resolves({
        usb: { mode: 'SuperSpeedPlus' }
      });

      const diagnostics = await device.getDiagnostics();
      const currentInfo = diagnostics.find(d => d.type === 'USBMODE');

      expect(currentInfo.message).to.include('USB Ok');
      expect(currentInfo.data.mode).to.equal('SuperSpeedPlus');
    });
  });
});
