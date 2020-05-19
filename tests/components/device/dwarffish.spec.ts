import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import fs from 'fs';
import path from 'path';

import ITransport from '../../../src/interfaces/iTransport';
import IDeviceUpgrader from '../../../src/interfaces/IDeviceUpgrader';
import Dwarffish from '../../../src/components/device/dwarffish';
import DefaultLogger from '../../../src/utilitis/logger';
import { EventEmitter } from 'events';
import CameraEvents from '../../../src/utilitis/events';
import Api from '../../../src/components/api';
import ReleaseChannel from '../../../src/interfaces/ReleaseChannelEnum';

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

describe('Dwarffish', () => {
  let device: Dwarffish;
  beforeEach(() => {
    device = new Dwarffish(
      {},
      sinon.createStubInstance(DummyTransport),
      {},
      new DefaultLogger(false),
      new EventEmitter(),
    );
  });

  describe('#getInfo', () => {
    beforeEach(async () => {
      await device.initialize();

      device['serialNumber'] = 'test-serialnumber';
      device['vendorId'] = 999;
      device['productId'] = 0x51;
      device['location'] = '/location-path';
      device['id'] = 'unique identifier';
    });

    it('should get camera info from api and populate status', async () => {
      sinon.stub(device.api, 'getCameraInfo').resolves({
        softwareVersion: 'HuddlyIQ-8.8.8',
        uptime: 67345.19,
      });

      const info = await device.getInfo();

      expect(info).to.deep.equals({
        id: 'unique identifier',
        serialNumber: 'test-serialnumber',
        vendorId: 999,
        productId: 0x51,
        version: '8.8.8',
        location: '/location-path',
        uptime: 67345.19,
        softwareVersion: 'HuddlyIQ-8.8.8',
      });
    });
  });

  describe('#getErrorLog', () => {
    beforeEach(async () => {
      await device.initialize();
    });

    it('should get camera info from api and populate status', async () => {
      sinon.stub(device.api, 'getErrorLog').resolves({});

      const errorLog = await device.getErrorLog();

      expect(device.api.getErrorLog).to.have.been.calledOnce;
    });
  });

  describe('#eraseErrorLog', () => {
    beforeEach(async () => {
      await device.initialize();
    });

    it('should get camera info from api and populate status', async () => {
      sinon.stub(device.api, 'eraseErrorLog').resolves({});

      const errorLog = await device.eraseErrorLog();

      expect(device.api.eraseErrorLog).to.have.been.calledOnce;
    });
  });

  describe('#upgrade', () => {
    it('should throw an error', async () => {
      try {
        await device.upgrade({
          file: Buffer.alloc(0),
        });
        throw new Error('should fail');
      } catch (e) {
        expect(e.message).to.equal('upgrade not implemented');
      }
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
    it('should throw an error', async () => {
      try {
        await device.getLatestFirmwareUrl();
        throw new Error('should fail');
      } catch (e) {
        expect(e.message).to.equal('getLatestFirmwareUrl not implemented');
      }
    });
  });

  describe('#getDetector', () => {
    it('should throw an error', () => {
      expect(device.getDetector).to.throw('getDetector not implemented');
    });
  });

  describe('#getAutozoomControl', () => {
    it('should throw an error', () => {
      expect(device.getAutozoomControl).to.throw('getAutozoomControl not implemented');
    });
  });

  describe('#getState', () => {
    it('should throw an error', () => {
      expect(device.getState).to.throw('getState not implemented');
    });
  });


  describe('#setInterpolationParams', () => {
    it('should throw an error', async () => {
      try {
        await device.setInterpolationParams();
        throw new Error('should fail');
      } catch (e) {
        expect(e.message).equal('setInterpolationParams not implemented');
      }
    });
  });

  describe('#getInterpolationParams', () => {
    it('should throw an error', async () => {
      try {
        await device.getInterpolationParams();
        throw new Error('should fail');
      } catch (e) {
        expect(e.message).equal('getInterpolationParams not implemented');
      }
    });
  });
});
