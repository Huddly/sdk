import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { PassThrough } from 'stream';
import { TextEncoder } from 'util';

import IGrpcTransport from './../../../src/interfaces/IGrpcTransport';
import { HuddlyServiceClient } from '@huddly/camera-proto/lib/api/huddly_grpc_pb';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import Logger from './../../../src/utilitis/logger';
import { EventEmitter } from 'events';
import Ace, { minMax } from './../../../src/components/device/ace';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

chai.should();
chai.use(sinonChai);

const statusDummy = new huddly.DeviceStatus();
statusDummy.setMessage('status');

const dummyRange = new huddly.Range();
dummyRange.setMin(0);
dummyRange.setMax(1000);

const saturationDummy = new huddly.Saturation();
saturationDummy.setSaturation(10);
saturationDummy.setRange(dummyRange);

const brightnessDummy = new huddly.Brightness();
brightnessDummy.setBrightness(10);
brightnessDummy.setRange(dummyRange);

const ptzDummy = new huddly.PTZ();
ptzDummy.setPan(1);
ptzDummy.setTilt(2);
ptzDummy.setZoom(3);

const tempDummy1 = new huddly.Temperature();
tempDummy1.setName('temp1');
tempDummy1.setValue(888);
const tempDummy2 = new huddly.Temperature();
tempDummy2.setName('temp2');
tempDummy2.setValue(5);
const temperaturesDummy = new huddly.Temperatures();
temperaturesDummy.setTemperaturesList([tempDummy1, tempDummy2]);

const cnnStatusDummy = new huddly.CNNStatus();
const autozoomStatus = new huddly.AZStatus();
autozoomStatus.setAzEnabled(true);
cnnStatusDummy.setAzStatus(autozoomStatus);

const mockedStream = new PassThrough();
class DummyTransport extends EventEmitter implements IGrpcTransport {
  device: any;
  grpcConnectionDeadlineSeconds: number;
  grpcClient: any = {
    getSaturation: (empty: Empty, cb: any) => {
      cb(undefined, saturationDummy);
    },
    setSaturation: (saturation: huddly.Saturation, cb: any) => {
      cb(undefined, statusDummy);
    },
    getBrightness: (empty: Empty, cb: any) => {
      cb(undefined, brightnessDummy);
    },
    setBrightness: (brightness: huddly.Brightness, cb: any) => {
      cb(undefined, statusDummy);
    },
    getPTZ: (empty: Empty, cb: any) => {
      cb(undefined, ptzDummy);
    },
    setPTZ: (ptz: huddly.PTZ, cb: any) => {
      cb(undefined, statusDummy);
    },
    getTemperatures: (empty: Empty, cb: any) => {
      cb(undefined, temperaturesDummy);
    },
    getLogFiles: () => mockedStream,
    eraseLogFile: (logFile: huddly.LogFile, cb: any) => {
      cb(undefined, statusDummy);
    },
    getCnnFeatureStatus: (empty: Empty, cb: any) => {
      cb(undefined, cnnStatusDummy);
    },
  };
  overrideGrpcClient(client: HuddlyServiceClient): void {
    throw new Error('Method not implemented.');
  }
  init(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  close(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

describe('Ace', () => {
  const dummyError = {
    message: 'Error',
  };

  let device: Ace;
  const dummyTransport = new DummyTransport();

  let warnStub, errorStub, infoStub;

  beforeEach(() => {
    device = new Ace({}, dummyTransport, new EventEmitter());
    sinon.spy(device, 'handleError');
    warnStub = sinon.stub(Logger, 'warn');
    errorStub = sinon.stub(Logger, 'error');
    infoStub = sinon.stub(Logger, 'info');
  });

  afterEach(() => {
    warnStub.restore();
    errorStub.restore();
    infoStub.restore();
  });

  describe('#_getTemperatures', () => {
    it('should return a temperatures instance with correct values', async () => {
      const temperatures = await device._getTemperatures();
      expect(temperatures.getTemperaturesList()[0].getValue()).to.be.equal(
        temperaturesDummy.getTemperaturesList()[0].getValue()
      );
      expect(temperatures.getTemperaturesList()[1].getValue()).to.be.equal(
        temperaturesDummy.getTemperaturesList()[1].getValue()
      );
      expect(temperatures).to.be.instanceof(huddly.Temperatures);
    });
    it('should reject with error if there is an issue', async () => {
      dummyTransport.grpcClient.getTemperatures = (empty: Empty, cb: any) => {
        cb('error', undefined);
      };
      device._getTemperatures().catch(err => expect(err).to.equal('error'));
    });
  });
  describe('#getTemperatures', () => {
    it('should return an object containing temperature values', async () => {
      sinon.stub(device, '_getTemperatures').resolves(temperaturesDummy);
      const temperatures = await device.getTemperatures();
      expect(temperatures[0]['value']).to.be.equal(
        temperaturesDummy.getTemperaturesList()[0].getValue()
      );
      expect(temperatures[1]['value']).to.be.equal(
        temperaturesDummy.getTemperaturesList()[1].getValue()
      );
    });
    it('should handle error if there is an issue', async () => {
      sinon.stub(device, '_getTemperatures').rejects(dummyError);
      device.getTemperatures().catch(err => {
        expect(err).to.equal(dummyError.message);
        expect(device.handleError).to.have.been.calledOnce;
      });
    });
  });
  describe('#getTemperature', () => {
    it('should return an object containing the highest temperature if no key is given', async () => {
      sinon.stub(device, '_getTemperatures').resolves(temperaturesDummy);
      const temperature = await device.getTemperature();
      expect(temperature['value']).to.equal(tempDummy1.getValue());
    });
    it('should return a specified temperature if it is given as an argument', async () => {
      sinon.stub(device, '_getTemperatures').resolves(temperaturesDummy);
      const temperature = await device.getTemperature('temp2');
      expect(temperature['value']).to.equal(tempDummy2.getValue());
    });
    it('should handle error if there is an issue', async () => {
      sinon.stub(device, '_getTemperatures').rejects(dummyError);
      device.getTemperature().catch(err => {
        expect(err).to.equal(dummyError.message);
        expect(device.handleError).to.have.been.calledOnce;
      });
    });
  });
  describe('#getSettings', () => {
    it('should return an object containing the campera settings', async () => {
      sinon.stub(device, '_getPanTiltZoom').resolves(ptzDummy);
      sinon.stub(device, '_getBrightness').resolves(brightnessDummy);
      sinon.stub(device, '_getSaturation').resolves(saturationDummy);
      const settings = await device.getSettings();

      expect(settings['brightness']['value']).to.equal(brightnessDummy.getBrightness());
      expect(settings['saturation']['value']).to.equal(saturationDummy.getSaturation());
      expect(settings['pan']['value']).to.equal(ptzDummy.getPan());
      expect(settings['tilt']['value']).to.equal(ptzDummy.getTilt());
      expect(settings['zoom']['value']).to.equal(ptzDummy.getZoom());
    });
    it('should reject error if there is an issue', async () => {
      sinon.stub(device, 'getPanTiltZoom').rejects(dummyError);
      device.getSettings().catch(err => expect(err.message).to.equal(dummyError.message));
    });
  });
  describe('#setSaturation', () => {
    it('should attempt to set saturation with correct type', async () => {
      sinon.spy(dummyTransport.grpcClient, 'setSaturation');
      await device.setSaturation(99);
      const arg = dummyTransport.grpcClient.setSaturation.args[0][0];
      expect(arg).to.be.instanceof(huddly.Saturation);
      expect(arg.getSaturation()).to.equal(99);
    });
    it('should handle error if there is an issue', async () => {
      dummyTransport.grpcClient.setSaturation = (empty: Empty, cb: any) => {
        cb(dummyError, undefined);
      };
      device.setSaturation(10).catch(err => expect(err).to.equal(dummyError.message));
    });
  });
  describe('#_getSaturation', () => {
    it('should return a saturation instance', async () => {
      const saturation = await device._getSaturation();
      expect(saturation.getSaturation()).to.equal(saturationDummy.getSaturation());
      expect(saturation).to.be.instanceof(huddly.Saturation);
    });
    it('should reject with error if there is an issue', async () => {
      dummyTransport.grpcClient.getSaturation = (empty: Empty, cb: any) => {
        cb('error', undefined);
      };
      device._getSaturation().catch(err => expect(err).to.equal('error'));
    });
  });
  describe('#getSaturation', () => {
    it('should return an object containing saturation value', async () => {
      sinon.stub(device, '_getSaturation').resolves(saturationDummy);
      const saturation = await device.getSaturation();
      expect(saturation['value']).to.equal(saturationDummy.getSaturation());
    });
    it('should handle error if something happens', async () => {
      sinon.stub(device, '_getSaturation').rejects(dummyError);
      device.getSaturation().catch(err => expect(err).to.equal(dummyError.message));
    });
  });
  describe('#setBrightness', () => {
    it('should attempt to set brightness with correct type', async () => {
      sinon.spy(dummyTransport.grpcClient, 'setBrightness');
      await device.setBrightness(5);
      const arg = dummyTransport.grpcClient.setBrightness.args[0][0];
      expect(arg).to.be.instanceof(huddly.Brightness);
      expect(arg.getBrightness()).to.equal(5);
    });
    it('should handle error if there is an issue', async () => {
      dummyTransport.grpcClient.setSaturation = (empty: Empty, cb: any) => {
        cb(dummyError, undefined);
      };
      device.setSaturation(10).catch(err => expect(err).to.equal(dummyError.message));
    });
  });
  describe('#_getBrightness', () => {
    it('should return a brightness instance', async () => {
      const brightness = await device._getBrightness();
      expect(brightness.getBrightness()).to.equal(brightnessDummy.getBrightness());
      expect(brightness).to.be.instanceof(huddly.Brightness);
    });
    it('should reject with error if there is an issue', async () => {
      dummyTransport.grpcClient.getBrightness = (empty: Empty, cb: any) => {
        cb('error', undefined);
      };
      device._getBrightness().catch(err => expect(err).to.equal('error'));
    });
  });
  describe('#getBrightness', () => {
    it('should return an object containing brightness value', async () => {
      sinon.stub(device, '_getBrightness').resolves(brightnessDummy);
      const brightness = await device.getBrightness();
      expect(brightness['value']).to.equal(brightnessDummy.getBrightness());
    });
    it('should handle error if something happens', async () => {
      sinon.stub(device, '_getBrightness').rejects(dummyError);
      device.getBrightness().catch(err => {
        expect(err).to.equal(dummyError.message);
        expect(device.handleError).to.have.been.calledOnce;
      });
    });
  });
  describe('#setPanTiltZoom', () => {
    beforeEach(() => {
      sinon.stub(device, '_getPanTiltZoom').resolves(ptzDummy);
    });
    it('should attempt to set ptz values with correct type and log status appropriately', async () => {
      sinon.spy(dummyTransport.grpcClient, 'setPTZ');
      await device.setPanTiltZoom({
        pan: 1,
        tilt: 2,
        zoom: 3,
      });
      expect(dummyTransport.grpcClient.setPTZ).to.be.called;
      expect(dummyTransport.grpcClient.setPTZ.args[0][0]).to.be.instanceof(huddly.PTZ);
      expect(Logger.info).to.have.been.calledOnce;
    });
    it('should handle error if there is an issue', async () => {
      dummyTransport.grpcClient.setPTZ = (ptz: huddly.PTZ, cb: any) => {
        cb(dummyError, undefined);
      };
      device
        .setPanTiltZoom({ pan: 1 })
        .then()
        .catch(err => {
          expect(err).to.equal(dummyError.message);
          expect(device.handleError).to.have.been.calledOnce;
        });
    });
    describe('function should handle individual params', () => {
      beforeEach(() => {
        dummyTransport.grpcClient.setPTZ = (ptz: huddly.PTZ, cb: any) => {
          cb(undefined, dummyTransport);
        };
        sinon.spy(dummyTransport.grpcClient, 'setPTZ');
      });
      it('should not fail when setting only pan', async () => {
        await device.setPanTiltZoom({
          pan: 1,
        });
        expect(dummyTransport.grpcClient.setPTZ).to.be.called;
        expect(dummyTransport.grpcClient.setPTZ.args[0][0]).to.be.instanceof(huddly.PTZ);
      });
      it('should not fail when setting only tilt', async () => {
        await device.setPanTiltZoom({
          tilt: 1,
        });
        expect(dummyTransport.grpcClient.setPTZ).to.be.called;
        expect(dummyTransport.grpcClient.setPTZ.args[0][0]).to.be.instanceof(huddly.PTZ);
      });
      it('should not fail when setting only zoom', async () => {
        await device.setPanTiltZoom({
          zoom: 1,
        });
        expect(dummyTransport.grpcClient.setPTZ).to.be.called;
        expect(dummyTransport.grpcClient.setPTZ.args[0][0]).to.be.instanceof(huddly.PTZ);
      });
    });
  });
  describe('#_getPanTiltZoom', () => {
    it('should return a brightness instance', async () => {
      const ptz = await device._getPanTiltZoom();
      expect(ptz.getPan()).to.equal(ptzDummy.getPan());
      expect(ptz.getTilt()).to.equal(ptzDummy.getTilt());
      expect(ptz.getZoom()).to.equal(ptzDummy.getZoom());
      expect(ptz).to.be.instanceof(huddly.PTZ);
    });
    it('should handle error if there is an issue', async () => {
      dummyTransport.grpcClient.getPTZ = (empty: Empty, cb: any) => {
        cb('error', undefined);
      };
      device._getPanTiltZoom().catch(err => expect(err).to.equal('error'));
    });
  });
  describe('#getPanTiltZoom', () => {
    it('should return an object containing ptz values with correct ranges', async () => {
      sinon.stub(device, '_getPanTiltZoom').resolves(ptzDummy);
      const ptz = await device.getPanTiltZoom();

      expect(ptz['pan']['value']).to.equal(ptzDummy.getPan());
      expect(ptz['pan']['max']).to.equal(minMax['pan']['max']);
      expect(ptz['pan']['min']).to.equal(minMax['pan']['min']);

      expect(ptz['zoom']['value']).to.equal(ptzDummy.getZoom());
      expect(ptz['zoom']['max']).to.equal(minMax['zoom']['max']);
      expect(ptz['zoom']['min']).to.equal(minMax['zoom']['min']);

      expect(ptz['tilt']['value']).to.equal(ptzDummy.getTilt());
      expect(ptz['tilt']['max']).to.equal(minMax['tilt']['max']);
      expect(ptz['tilt']['min']).to.equal(minMax['tilt']['min']);
    });
    it('should handle error and reject with error message if something happens', async () => {
      sinon.stub(device, '_getPanTiltZoom').rejects(dummyError);
      device.getPanTiltZoom().catch(err => {
        expect(err).to.equal(dummyError.message);
        expect(device.handleError).to.have.been.calledOnce;
      });
    });
  });
  describe('#getPanTilt', () => {
    it('should return an object containing pan tilt values', async () => {
      sinon.stub(device, '_getPanTiltZoom').resolves(ptzDummy);
      const panTilt = await device.getPanTilt();

      expect(panTilt['pan']['value']).to.equal(ptzDummy.getPan());
      expect(panTilt['tilt']['value']).to.equal(ptzDummy.getTilt());
    });
    it('should handle error and reject with error message if something happens', async () => {
      sinon.stub(device, '_getPanTiltZoom').rejects(dummyError);
      device.getPanTilt().catch(err => {
        expect(err).to.equal(dummyError.message);
        expect(device.handleError).to.have.been.calledOnce;
      });
    });
  });
  describe('#getSupportedSettings', () => {
    it('should resolve a list of supported  params', async () => {
      const supported = await device.getSupportedSettings();
      expect(supported).to.deep.equal(['pan', 'tilt', 'zoom', 'brightness', 'saturation']);
    });
  });
  describe('#getSetting', () => {
    it('should return a given setting when giving a correct key', async () => {
      sinon.stub(device, '_getPanTiltZoom').resolves(ptzDummy);
      sinon.stub(device, '_getBrightness').resolves(brightnessDummy);
      sinon.stub(device, '_getSaturation').resolves(saturationDummy);

      const pan = await device.getSetting('pan');
      const tilt = await device.getSetting('tilt');
      const zoom = await device.getSetting('zoom');
      const brightness = await device.getSetting('brightness');
      const saturation = await device.getSetting('saturation');

      expect(pan['value']).to.equal(ptzDummy.getPan());
      expect(tilt['value']).to.equal(ptzDummy.getTilt());
      expect(zoom['value']).to.equal(ptzDummy.getZoom());
      expect(brightness['value']).to.equal(brightnessDummy.getBrightness());
      expect(saturation['value']).to.equal(saturationDummy.getSaturation());
    });
    it("should log a warning if value key isn't supported", async () => {
      device.getSetting('dummy').catch(err => expect(Logger.warn).to.have.been.calledOnce);
    });
    it('should throw a rejection if something happens', async () => {
      sinon.stub(device, '_getBrightness').rejects(dummyError);
      device.getSetting('brightness').catch(err => expect(err).to.equal(dummyError.message));
    });
  });
  describe('#setSetting', () => {
    it('should attempt to set the given setting', async () => {
      sinon.stub(device, 'setPanTiltZoom');
      sinon.stub(device, 'setBrightness');
      sinon.stub(device, 'setSaturation');

      await device.setSettingValue('pan', 1);
      expect(device.setPanTiltZoom).to.have.been.calledWith({ pan: 1 });
      await device.setSettingValue('tilt', 1);
      expect(device.setPanTiltZoom).to.have.been.calledWith({ tilt: 1 });
      await device.setSettingValue('zoom', 1);
      expect(device.setPanTiltZoom).to.have.been.calledWith({ zoom: 1 });
      await device.setSettingValue('brightness', 1);
      expect(device.setBrightness).to.have.been.calledWith(1);
      await device.setSettingValue('saturation', 1);
      expect(device.setSaturation).to.have.been.calledWith(1);
    });
    it("should log a warning if value key isn't supported", async () => {
      device.setSettingValue('dummy', 1).catch(err => expect(Logger.warn).to.have.been.calledOnce);
    });
    it('should throw a rejection if something happens', async () => {
      sinon.stub(device, 'setBrightness').rejects('error');
      device.setSettingValue('brightness', 2).catch(err => expect(err.name).to.equal('error'));
    });
  });
  describe('#getLogFiles', () => {
    let resolver;
    const appLog = new huddly.LogFile();
    appLog.setFile(huddly.LogFiles.APP);

    it('should attempt to retrieve the log of the given type', async () => {
      sinon.spy(dummyTransport.grpcClient, 'getLogFiles');
      device.getLogFiles(appLog).then(log => {
        expect(device.grpcClient.getLogFiles).to.have.been.calledWith(appLog);
        expect(log).to.equal('test');
        resolver();
      });

      const mockedChunk = new huddly.Chunk();
      const enc = new TextEncoder();
      mockedChunk.setContent(enc.encode('test'));
      mockedStream.emit('data', mockedChunk);
      mockedStream.end();

      await new Promise((res, rej) => (resolver = res));
    });
    it('should reject with error message if error occurs', async () => {
      device.getLogFiles(appLog).catch(error => {
        expect(error).to.equal('error');
        resolver();
      });
      mockedStream.emit('error', 'error');
      await new Promise((res, rej) => (resolver = res));
    });
  });
  describe('#getErrorLog', () => {
    it('should try to get the app log', async () => {
      const stub = sinon.stub(device, 'getLogFiles').resolves('log');
      const log = await device.getErrorLog();
      const args = stub.firstCall.args[0];
      expect(args.getFile()).to.equal(huddly.LogFiles.APP);
      expect(log).to.equal('log');
    });
    it('should handle error and reject with error message if something happens', async () => {
      sinon.stub(device, 'getLogFiles').rejects(dummyError);
      device.getErrorLog().catch(err => {
        expect(err).to.equal(dummyError.message);
        expect(device.handleError).to.have.been.calledOnce;
      });
    });
  });
  describe('#getCnnFeatureStatus', () => {
    let cnnFeature;
    beforeEach(() => {
      cnnFeature = new huddly.CnnFeature();
      cnnFeature.setFeature(huddly.Feature.AUTOZOOM);
    });
    it('should attempt to get a given cnn feature', async () => {
      sinon.spy(dummyTransport.grpcClient, 'getCnnFeatureStatus');
      const cnnFeatureStatus = await device.getCnnFeatureStatus(cnnFeature);
      const arg = dummyTransport.grpcClient.getCnnFeatureStatus.args[0][0];
      expect(arg).to.be.instanceof(huddly.CnnFeature);
      expect(arg.getFeature()).to.equal(huddly.Feature.AUTOZOOM);
      expect(cnnFeatureStatus).to.be.instanceof(huddly.CNNStatus);
    });
    it('should handle error if something happens', async () => {
      dummyTransport.grpcClient.getCnnFeatureStatus = (empty: Empty, cb: any) => {
        cb(dummyError, undefined);
      };
      device.getCnnFeatureStatus(cnnFeature).catch(err => {
        expect(err).to.equal(dummyError.message);
        expect(device.handleError).to.have.been.calledOnce;
      });
    });
  });
  describe('#getState', () => {
    it('should return a object containing autozoom status (for the time being)', async () => {
      sinon.stub(device, 'getCnnFeatureStatus').resolves(cnnStatusDummy);
      const azStatus = await device.getState();
      expect(azStatus).to.deep.equal({ autozoom_enabled: true });
    });
    it('should reject error if there is an issue', async () => {
      sinon.stub(device, 'getCnnFeatureStatus').rejects('error');
      device.getState().catch(err => expect(err.name).to.equal('error'));
    });
  });
  describe('#eraseLogFile', () => {
    const logFile = new huddly.LogFile();
    logFile.setFile(huddly.LogFiles.APP);
    it('should attempt to erease a given log', async () => {
      sinon.spy(dummyTransport.grpcClient, 'eraseLogFile');
      await device.eraseLogFile(logFile);
      const arg = dummyTransport.grpcClient.eraseLogFile.args[0][0];
      expect(arg).to.be.instanceof(huddly.LogFile);
      expect(arg.getFile()).to.equal(huddly.LogFiles.APP);
    });
    it('should reject error if there is an issue', async () => {
      dummyTransport.grpcClient.eraseLogFile = (logfile: huddly.LogFile, cb: any) => {
        cb(dummyError, undefined);
      };
      device.eraseLogFile(logFile).catch(err => expect(err.message).to.equal(dummyError.message));
    });
  });
  describe('#eraseErrorLog', () => {
    it('should try to erase the app log', async () => {
      const stub = sinon.stub(device, 'eraseLogFile').resolves('');
      await device.eraseErrorLog();
      const args = stub.firstCall.args[0];
      expect(args.getFile()).to.equal(huddly.LogFiles.APP);
    });
    it('should handle error and reject with error message if something happens', async () => {
      sinon.stub(device, 'eraseLogFile').rejects(dummyError);
      device.eraseErrorLog().catch(err => {
        expect(err).to.equal(dummyError.message);
        expect(device.handleError).to.have.been.calledOnce;
      });
    });
  });
});
