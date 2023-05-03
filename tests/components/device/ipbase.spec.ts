import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { PassThrough } from 'stream';
import { TextEncoder } from 'util';

import IGrpcTransport from '@huddly/sdk-interfaces/lib/interfaces/IGrpcTransport';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';
import HuddlyHEX from '@huddly/sdk-interfaces/lib/enums/HuddlyHex';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import { HuddlyServiceClient } from '@huddly/camera-proto/lib/api/huddly_grpc_pb';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import { EventEmitter } from 'events';
import IpBaseDevice from '../../../src/components/device/ipbase';
import Boxfish from '../../../src/components/device/boxfish';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import AceUpgrader from '../../../src/components/upgrader/aceUpgrader';
import IpAutozoomControl from '../../../src/components/ipAutozoomControl';
import IpFaceBasedExposureControl from '../../../src/components/ipFaceBasedExposureControl';
import IpDetector from '../../../src/components/ipDetector';

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
ptzDummy.setDefaultpan(0);
const customRange = new huddly.Range();
customRange.setMax(100);
customRange.setMin(-100);
ptzDummy.setRangepan(customRange);
ptzDummy.setTilt(2);
ptzDummy.setDefaulttilt(0);
ptzDummy.setRangetilt(customRange);
ptzDummy.setZoom(3);
ptzDummy.setDefaultzoom(0);
ptzDummy.setRangezoom(customRange);
ptzDummy.setRangedzoom(customRange);

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
const deviceVersion = new huddly.DeviceVersion();
deviceVersion.setVersion('1.2.3');

const optionCerts = new huddly.OptionCertificates();
const optionCert = new huddly.OptionCertificates.OptionCertificate();
optionCert.setName('test_cert');
optionCert.setCertificate('bytes');
optionCerts.addCertificates(optionCert);

const mockedStream = new PassThrough();
class DummyTransport extends EventEmitter implements IGrpcTransport {
  device: any;
  grpcConnectionDeadlineSeconds: number;
  grpcClient: any;
  overrideGrpcClient(client: HuddlyServiceClient): void {
    // Ignore call
  }
  init(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
}

const grpcClient: any = {
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
  getDeviceVersion: (empty: Empty, cb: any) => {
    cb(undefined, deviceVersion);
  },
  getOptionCertificates: (empty: Empty, cb: any) => {
    cb(undefined, optionCerts);
  },
  close: () => {},
};

describe('IpBaseDevice', () => {
  const dummyError = { message: 'Bad', stack: 'Line33' };

  let device: IpBaseDevice;
  const dummyTransport = new DummyTransport();

  let warnStub, errorStub, infoStub;

  beforeEach(() => {
    device = new IpBaseDevice({}, dummyTransport, new EventEmitter());
    sinon.spy(device, 'handleError');
    warnStub = sinon.stub(Logger, 'warn');
    errorStub = sinon.stub(Logger, 'error');
    infoStub = sinon.stub(Logger, 'info');
    device.grpcClient = grpcClient;
  });

  afterEach(() => {
    warnStub.restore();
    errorStub.restore();
    infoStub.restore();
  });

  describe('getters', () => {
    describe('api', () => {
      it('IpBaseDevice manager should not support legacy API object', () => {
        const badFn = () => {
          device.api;
        };
        expect(badFn).to.throw(Error, 'Not Supported');
      });
    });
    describe('uvcControlInterface', () => {
      it('IpBaseDevice manager should not support uvcControlInterface getter', () => {
        const badFn = () => {
          device.uvcControlInterface;
        };
        expect(badFn).to.throw(Error, 'Not Supported');
      });
    });

    describe('grpcClient', () => {
      let waitForReadyStub;
      afterEach(() => {
        waitForReadyStub?.restore();
      });

      it('should return grpc client', async () => {
        waitForReadyStub = sinon
          .stub(HuddlyServiceClient.prototype, 'waitForReady')
          .callsFake((deadline, cb) => {
            cb(undefined);
          });
        await device.initialize();
        const client = device.grpcClient;
        expect(client).to.not.be.undefined;
      });
    });
  });

  describe('#initialize', () => {
    let waitForReadyStub;
    afterEach(() => {
      waitForReadyStub?.restore();
    });
    it('should resolve when grpcclinet connects successfully', () => {
      waitForReadyStub = sinon
        .stub(HuddlyServiceClient.prototype, 'waitForReady')
        .callsFake((deadline, cb) => {
          cb(undefined);
        });
      const initPromise = device.initialize();
      return expect(initPromise).to.be.fulfilled;
    });
    it('should reject when grpc client is unable to connect', () => {
      waitForReadyStub = sinon
        .stub(HuddlyServiceClient.prototype, 'waitForReady')
        .callsFake((deadline, cb) => {
          cb('Uuups, could not connect!');
        });
      const initPromise = device.initialize();
      return expect(initPromise).to.eventually.be.rejectedWith('Uuups, could not connect!');
    });
  });

  describe('#closeConnection', () => {
    let grpcCloseSpy;
    beforeEach(() => {
      grpcCloseSpy = sinon.spy(grpcClient, 'close');
      device.grpcClient = grpcClient;
    });
    afterEach(() => {
      grpcCloseSpy.restore();
    });
    it('should close grpc client and transport', () => {
      device.closeConnection();
      expect(grpcCloseSpy.called).to.equal(true);
    });
  });

  describe('#handleError', () => {
    it('should reject with message when error not provided', () => {
      const spy = sinon.spy();
      device.handleError('Hello World', undefined, spy);
      expect(spy.called).to.equal(true);
      expect(spy.getCall(0).args[0]).to.equal('Hello World');
    });
  });

  describe('#getInfo', () => {
    describe('on success', () => {
      it('should return available device information', async () => {
        const wsddDeviceObj = {
          infoObject: () => {
            return {
              name: 'Huddly L1',
              serial: '1234HA',
              mac: 'AA:BB:CC:DD:EE',
            };
          },
        };
        device = new IpBaseDevice(wsddDeviceObj, dummyTransport, new EventEmitter());
        device.grpcClient = grpcClient;
        grpcClient.getDeviceVersion = (empty: Empty, cb: any) => {
          const deviceVersion = new huddly.DeviceVersion();
          deviceVersion.setVersion('1.2.3-abc');
          cb(undefined, deviceVersion);
        };
        sinon.stub(device, 'uptime').resolves(123);
        sinon.stub(device, 'getSlot').resolves('C');
        const info = await device.getInfo();
        expect(info).to.deep.equal({
          ...wsddDeviceObj.infoObject(),
          slot: 'C',
          uptime: 123,
          version: '1.2.3-abc',
          vendorId: HuddlyHEX.VID,
        });
      });
    });
    describe('on Error', () => {
      it('should reject when device version cant be fetched', () => {
        const wsddDeviceObj = {
          infoObject: () => {},
        };
        device = new IpBaseDevice(wsddDeviceObj, dummyTransport, new EventEmitter());
        device.grpcClient = grpcClient;
        grpcClient.getDeviceVersion = (empty: Empty, cb: any) => {
          cb(dummyError);
        };
        const infoPromise = device.getInfo();
        return expect(infoPromise).to.eventually.be.rejectedWith(dummyError.message);
      });
      it('should reject when device uptime cant be fetched', () => {
        const wsddDeviceObj = {
          infoObject: () => {},
        };
        device = new IpBaseDevice(wsddDeviceObj, dummyTransport, new EventEmitter());
        device.grpcClient = grpcClient;
        grpcClient.getDeviceVersion = (empty: Empty, cb: any) => {
          const deviceVersion = new huddly.DeviceVersion();
          deviceVersion.setVersion('1.2.3-abc');
          cb(undefined, deviceVersion);
        };
        sinon.stub(device, 'uptime').rejects(dummyError);
        const infoPromise = device.getInfo();
        return expect(infoPromise).to.eventually.be.rejectedWith(dummyError.message);
      });
    });
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
      grpcClient.getTemperatures = (empty: Empty, cb: any) => {
        cb('error', undefined);
      };
      device._getTemperatures().catch((err) => expect(err).to.equal('error'));
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
      device.getTemperatures().catch((err) => {
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
      device.getTemperature().catch((err) => {
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
      device.getSettings().catch((err) => expect(err.message).to.equal(dummyError.message));
    });
  });
  describe('#setSaturation', () => {
    it('should attempt to set saturation with correct type', async () => {
      sinon.spy(grpcClient, 'setSaturation');
      await device.setSaturation(99);
      const arg = grpcClient.setSaturation.args[0][0];
      expect(arg).to.be.instanceof(huddly.Saturation);
      expect(arg.getSaturation()).to.equal(99);
    });
    it('should handle error if there is an issue', async () => {
      grpcClient.setSaturation = (empty: Empty, cb: any) => {
        cb(dummyError, undefined);
      };
      device.setSaturation(10).catch((err) => expect(err).to.equal(dummyError.message));
    });
  });
  describe('#_getSaturation', () => {
    it('should return a saturation instance', async () => {
      const saturation = await device._getSaturation();
      expect(saturation.getSaturation()).to.equal(saturationDummy.getSaturation());
      expect(saturation).to.be.instanceof(huddly.Saturation);
    });
    it('should reject with error if there is an issue', async () => {
      grpcClient.getSaturation = (empty: Empty, cb: any) => {
        cb('error', undefined);
      };
      device._getSaturation().catch((err) => expect(err).to.equal('error'));
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
      device.getSaturation().catch((err) => expect(err).to.equal(dummyError.message));
    });
  });
  describe('#setBrightness', () => {
    it('should attempt to set brightness with correct type', async () => {
      sinon.spy(grpcClient, 'setBrightness');
      await device.setBrightness(5);
      const arg = grpcClient.setBrightness.args[0][0];
      expect(arg).to.be.instanceof(huddly.Brightness);
      expect(arg.getBrightness()).to.equal(5);
    });
    it('should handle error if there is an issue', async () => {
      grpcClient.setBrightness = (empty: Empty, cb: any) => {
        cb(dummyError, undefined);
      };
      device.setBrightness(10).catch((err) => expect(err).to.equal(dummyError.message));
    });
  });
  describe('#_getBrightness', () => {
    it('should return a brightness instance', async () => {
      const brightness = await device._getBrightness();
      expect(brightness.getBrightness()).to.equal(brightnessDummy.getBrightness());
      expect(brightness).to.be.instanceof(huddly.Brightness);
    });
    it('should reject with error if there is an issue', async () => {
      grpcClient.getBrightness = (empty: Empty, cb: any) => {
        cb('error', undefined);
      };
      device._getBrightness().catch((err) => expect(err).to.equal('error'));
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
      device.getBrightness().catch((err) => {
        expect(err).to.equal(dummyError.message);
        expect(device.handleError).to.have.been.calledOnce;
      });
    });
  });
  describe('#setPanTiltZoom', () => {
    let getPtzStub;
    let setPtzSpy;
    beforeEach(() => {
      getPtzStub = sinon.stub(device, '_getPanTiltZoom');
      setPtzSpy = sinon.spy(grpcClient, 'setPTZ');
    });
    afterEach(() => {
      getPtzStub.restore();
      setPtzSpy.restore();
    });

    describe('on getPTZ Success', () => {
      it('should update pan and use rest from current ptz data', async () => {
        getPtzStub.resolves(ptzDummy);
        const data = { pan: 12 };
        await device.setPanTiltZoom(data);

        expect(getPtzStub.called).to.equal(true);
        expect(setPtzSpy.callCount).to.equal(1);
        const sentPtzObj = setPtzSpy.getCall(0).args[0];
        expect(sentPtzObj).to.be.instanceof(huddly.PTZ);
        expect((<huddly.PTZ>sentPtzObj).getPan()).to.equal(data.pan);
        expect((<huddly.PTZ>sentPtzObj).getTilt()).to.equal(ptzDummy.getTilt());
        expect((<huddly.PTZ>sentPtzObj).getZoom()).to.equal(ptzDummy.getZoom());
      });
      it('should update tilt and use rest from current ptz data', async () => {
        getPtzStub.resolves(ptzDummy);
        const data = { tilt: 25 };
        await device.setPanTiltZoom(data);

        expect(getPtzStub.called).to.equal(true);
        expect(setPtzSpy.callCount).to.equal(1);
        const sentPtzObj = setPtzSpy.getCall(0).args[0];
        expect(sentPtzObj).to.be.instanceof(huddly.PTZ);
        expect((<huddly.PTZ>sentPtzObj).getTilt()).to.equal(data.tilt);
        expect((<huddly.PTZ>sentPtzObj).getPan()).to.equal(ptzDummy.getPan());
        expect((<huddly.PTZ>sentPtzObj).getZoom()).to.equal(ptzDummy.getZoom());
      });
      it('should update zoom and use rest from current ptz data', async () => {
        getPtzStub.resolves(ptzDummy);
        const data = { zoom: 1200 };
        await device.setPanTiltZoom(data);

        expect(getPtzStub.called).to.equal(true);
        expect(setPtzSpy.callCount).to.equal(1);
        const sentPtzObj = setPtzSpy.getCall(0).args[0];
        expect(sentPtzObj).to.be.instanceof(huddly.PTZ);
        expect((<huddly.PTZ>sentPtzObj).getZoom()).to.equal(data.zoom);
        expect((<huddly.PTZ>sentPtzObj).getTilt()).to.equal(ptzDummy.getTilt());
        expect((<huddly.PTZ>sentPtzObj).getPan()).to.equal(ptzDummy.getPan());
      });
    });
    describe('on getPTZ Failure', () => {
      it('should update pan and use defalt values for rest of ptz data', async () => {
        getPtzStub.rejects('Cant perform this action');
        const data = { pan: 10 };
        await device.setPanTiltZoom(data);

        expect(getPtzStub.called).to.equal(true);
        expect(setPtzSpy.callCount).to.equal(1);
        const sentPtzObj = setPtzSpy.getCall(0).args[0];
        expect(sentPtzObj).to.be.instanceof(huddly.PTZ);
        expect((<huddly.PTZ>sentPtzObj).getPan()).to.equal(data.pan);
        expect((<huddly.PTZ>sentPtzObj).getTilt()).to.equal(new huddly.PTZ().getDefaulttilt());
        expect((<huddly.PTZ>sentPtzObj).getZoom()).to.equal(new huddly.PTZ().getDefaultzoom());
        expect((<huddly.PTZ>sentPtzObj).getTrans()).to.equal(0);
      });
      it('should update tilt and use defalt values for rest of ptz data', async () => {
        getPtzStub.rejects('Cant perform this action');
        const data = { tilt: -10 };
        await device.setPanTiltZoom(data);

        expect(getPtzStub.called).to.equal(true);
        expect(setPtzSpy.callCount).to.equal(1);
        const sentPtzObj = setPtzSpy.getCall(0).args[0];
        expect(sentPtzObj).to.be.instanceof(huddly.PTZ);
        expect((<huddly.PTZ>sentPtzObj).getTilt()).to.equal(data.tilt);
        expect((<huddly.PTZ>sentPtzObj).getPan()).to.equal(new huddly.PTZ().getDefaultpan());
        expect((<huddly.PTZ>sentPtzObj).getZoom()).to.equal(new huddly.PTZ().getDefaultzoom());
        expect((<huddly.PTZ>sentPtzObj).getTrans()).to.equal(0);
      });
      it('should update zoom and use defalt values for rest of ptz data', async () => {
        getPtzStub.rejects('Cant perform this action');
        const data = { zoom: 2300 };
        await device.setPanTiltZoom(data);

        expect(getPtzStub.called).to.equal(true);
        expect(setPtzSpy.callCount).to.equal(1);
        const sentPtzObj = setPtzSpy.getCall(0).args[0];
        expect(sentPtzObj).to.be.instanceof(huddly.PTZ);
        expect((<huddly.PTZ>sentPtzObj).getZoom()).to.equal(data.zoom);
        expect((<huddly.PTZ>sentPtzObj).getTilt()).to.equal(new huddly.PTZ().getDefaulttilt());
        expect((<huddly.PTZ>sentPtzObj).getPan()).to.equal(new huddly.PTZ().getDefaultpan());
        expect((<huddly.PTZ>sentPtzObj).getTrans()).to.equal(0);
      });
    });
    describe('on grpc failure', () => {
      it('should handle error if there is an issue', async () => {
        getPtzStub.resolves(ptzDummy);
        grpcClient.setPTZ = (ptz: huddly.PTZ, cb: any) => {
          cb(dummyError, undefined);
        };
        const badPromise = device.setPanTiltZoom({ pan: 1 });
        return expect(badPromise).to.eventually.be.rejectedWith(dummyError.message);
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
      grpcClient.getPTZ = (empty: Empty, cb: any) => {
        cb('error', undefined);
      };
      device._getPanTiltZoom().catch((err) => expect(err).to.equal('error'));
    });
  });
  describe('#getPanTiltZoom', () => {
    it('should return an object containing ptz values with correct ranges', async () => {
      sinon.stub(device, '_getPanTiltZoom').resolves(ptzDummy);
      const ptz = await device.getPanTiltZoom();
      expect(ptz['pan']['value']).to.equal(ptzDummy.getPan());
      expect(ptz['pan']['max']).to.equal(ptzDummy.getRangepan().getMax());
      expect(ptz['pan']['min']).to.equal(ptzDummy.getRangepan().getMin());
      expect(ptz['pan']['default']).to.equal(ptzDummy.getDefaultpan());

      expect(ptz['zoom']['value']).to.equal(ptzDummy.getZoom());
      expect(ptz['zoom']['max']).to.equal(ptzDummy.getRangezoom().getMax());
      expect(ptz['zoom']['min']).to.equal(ptzDummy.getRangezoom().getMin());
      expect(ptz['zoom']['default']).to.equal(ptzDummy.getDefaultzoom());

      expect(ptz['tilt']['value']).to.equal(ptzDummy.getTilt());
      expect(ptz['tilt']['max']).to.equal(ptzDummy.getRangetilt().getMax());
      expect(ptz['tilt']['min']).to.equal(ptzDummy.getRangetilt().getMin());
      expect(ptz['tilt']['default']).to.equal(ptzDummy.getDefaulttilt());
    });
    it('should handle error and reject with error message if something happens', async () => {
      sinon.stub(device, '_getPanTiltZoom').rejects(dummyError);
      device.getPanTiltZoom().catch((err) => {
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
      device.getPanTilt().catch((err) => {
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
      device.getSetting('dummy').catch((err) => expect(Logger.warn).to.have.been.calledOnce);
    });
    it('should throw a rejection if something happens', async () => {
      sinon.stub(device, '_getBrightness').rejects(dummyError);
      device.getSetting('brightness').catch((err) => expect(err).to.equal(dummyError.message));
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
      device
        .setSettingValue('dummy', 1)
        .catch((err) => expect(Logger.warn).to.have.been.calledOnce);
    });
    it('should throw a rejection if something happens', async () => {
      sinon.stub(device, 'setBrightness').rejects('error');
      device.setSettingValue('brightness', 2).catch((err) => expect(err.name).to.equal('error'));
    });
  });
  describe('#getLogFiles', () => {
    let resolver;
    const appLog = new huddly.LogFile();
    appLog.setFile(huddly.LogFiles.APP);

    it('should attempt to retrieve the log of the given type', async () => {
      sinon.spy(grpcClient, 'getLogFiles');
      device.getLogFiles(appLog).then((log) => {
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
      device.getLogFiles(appLog).catch((error) => {
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
      device.getErrorLog().catch((err) => {
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
      sinon.spy(grpcClient, 'getCnnFeatureStatus');
      const cnnFeatureStatus = await device.getCnnFeatureStatus(cnnFeature);
      const arg = grpcClient.getCnnFeatureStatus.args[0][0];
      expect(arg).to.be.instanceof(huddly.CnnFeature);
      expect(arg.getFeature()).to.equal(huddly.Feature.AUTOZOOM);
      expect(cnnFeatureStatus).to.be.instanceof(huddly.CNNStatus);
    });
    it('should handle error if something happens', async () => {
      grpcClient.getCnnFeatureStatus = (empty: Empty, cb: any) => {
        cb(dummyError, undefined);
      };
      device.getCnnFeatureStatus(cnnFeature).catch((err) => {
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
      device.getState().catch((err) => expect(err.name).to.equal('error'));
    });
  });
  describe('#eraseLogFile', () => {
    const logFile = new huddly.LogFile();
    logFile.setFile(huddly.LogFiles.APP);
    it('should attempt to erease a given log', async () => {
      sinon.spy(grpcClient, 'eraseLogFile');
      await device.eraseLogFile(logFile);
      const arg = grpcClient.eraseLogFile.args[0][0];
      expect(arg).to.be.instanceof(huddly.LogFile);
      expect(arg.getFile()).to.equal(huddly.LogFiles.APP);
    });
    it('should reject error if there is an issue', async () => {
      grpcClient.eraseLogFile = (empty: Empty, cb: any) => {
        cb(dummyError, undefined);
      };
      device
        .eraseLogFile(logFile)
        .catch((err) => expect(err.meessage).to.equal(dummyError.message));
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
      device.eraseErrorLog().catch((err) => {
        expect(err).to.equal(dummyError.message);
        expect(device.handleError).to.have.been.calledOnce;
      });
    });
  });

  describe('#reboot', () => {
    describe('on success', () => {
      it('should request device reboot', () => {
        grpcClient.reset = (empty: Empty, cb: any) => {
          const deviceStatus = new huddly.DeviceStatus();
          deviceStatus.setCode(huddly.StatusCode.OK);
          deviceStatus.setMessage('All Good');
          cb(undefined, deviceStatus);
        };
        const resetPromise = device.reboot();
        return expect(resetPromise).to.be.fulfilled;
      });
    });
    describe('on error', () => {
      it('should reject when device cannot be rebooted', () => {
        grpcClient.reset = (empty: Empty, cb: any) => {
          cb(dummyError);
        };
        const resetPromise = device.reboot();
        expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
      });
    });
  });

  describe('#getUpgrader', () => {
    it('should fail as this method must be called on the individual ip managers instead', async () => {
      const getUpgraderPromise = device.getUpgrader();
      return expect(getUpgraderPromise).to.eventually.be.rejectedWith(
        Error,
        'Please call this method from Ace or See controller instead!'
      );
    });
  });

  describe('#upgrade', () => {
    let upgraderStub;
    let getUpgradeStub;
    beforeEach(() => {
      upgraderStub = sinon.createStubInstance(AceUpgrader);
    });
    afterEach(() => {
      getUpgradeStub?.restore();
    });
    it('should resolve when upgrade completes', () => {
      upgraderStub.init.resolves();
      upgraderStub.doUpgrade.resolves();
      getUpgradeStub = sinon.stub(device, 'getUpgrader').resolves(upgraderStub);
      const upgradePromise = device.upgrade({ file: Buffer.alloc(0) });
      return expect(upgradePromise).to.be.fulfilled;
    });
    it('should reject when upgrade fails', () => {
      upgraderStub.init.resolves();
      getUpgradeStub = sinon.stub(device, 'getUpgrader').resolves(upgraderStub);
      upgraderStub.doUpgrade.rejects(dummyError);
      const upgradePromise = device.upgrade({ file: Buffer.alloc(0) });
      return expect(upgradePromise).to.eventually.be.rejectedWith(dummyError.message);
    });
    it('should reject when we cant get upgrader instance', () => {
      getUpgradeStub = sinon.stub(device, 'getUpgrader').rejects(dummyError);
      const upgradePromise = device.upgrade({ file: Buffer.alloc(0) });
      return expect(upgradePromise).to.eventually.be.rejectedWith(dummyError.message);
    });
  });

  describe('#getAutozoomControl', () => {
    it('should return an instance of IpAutozoomControl', () => {
      const AzControl = device.getAutozoomControl({});
      expect(AzControl).to.be.instanceOf(IpAutozoomControl);
    });
  });
  describe('#getFaceBasedExposureControl', () => {
    it('should return an instance of IpFaceBasedExposureControl', () => {
      const fbeCtrl = device.getFaceBasedExposureControl();
      expect(fbeCtrl).to.be.instanceOf(IpFaceBasedExposureControl);
    });
  });
  describe('#getDetector', () => {
    it('should throw an error', () => {
      const badFn = () => device.getDetector({});
      expect(badFn).to.throw(Error);
    });
  });
  describe('#getDiagnostics', () => {
    it('should not be implemented', () => {
      const badFn = () => {
        device.getDiagnostics();
      };
      return expect(badFn).to.throw(Error, 'Method not implemented.');
    });
  });
  describe('#getPowerUsage', () => {
    it('should not be implemented', () => {
      const badFn = () => {
        device.getPowerUsage();
      };
      return expect(badFn).to.throw(Error, 'Method not implemented.');
    });
  });
  describe('#getLatestFirmwareUrl', () => {
    it('should not be implemented', () => {
      const badFn = () => {
        device.getLatestFirmwareUrl(ReleaseChannel.STABLE);
      };
      return expect(badFn).to.throw(Error, 'Method not implemented.');
    });
  });
  describe('#getSlot', () => {
    describe('on success', () => {
      it('should request device slot', () => {
        grpcClient.getBootSlot = (empty: Empty, cb: any) => {
          const bootSlot = new huddly.BootSlot();
          bootSlot.setSlot(huddly.Slot.A);
          cb(undefined, bootSlot);
        };
        const resetPromise = device.getSlot();
        return expect(resetPromise).to.be.fulfilled;
      });
    });
    describe('on error', () => {
      it('should reject when device slot cannot be fetched', () => {
        grpcClient.getBootSlot = (empty: Empty, cb: any) => {
          cb(dummyError);
        };
        const resetPromise = device.getSlot();
        expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
      });
    });
  });
  describe('#uptime', () => {
    describe('on success', () => {
      it('should request device uptime', () => {
        grpcClient.getUptime = (empty: Empty, cb: any) => {
          const uptime = new huddly.Uptime();
          uptime.setUptime(200);
          cb(undefined, uptime);
        };
        const resetPromise = device.uptime();
        return expect(resetPromise).to.be.fulfilled;
      });
    });
    describe('on error', () => {
      it('should reject when device uptime cannot be fetched', () => {
        grpcClient.getUptime = (empty: Empty, cb: any) => {
          cb(dummyError);
        };
        const resetPromise = device.uptime();
        expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
      });
    });
  });
  describe('#getXUControl', () => {
    it('should not be implemented', () => {
      const badFn = () => {
        device.getXUControl(0);
      };
      return expect(badFn).to.throw(Error, 'Method not implemented.');
    });
  });
  describe('#setXUControl', () => {
    it('should not be implemented', () => {
      const badFn = () => {
        device.setXUControl(0, 0);
      };
      return expect(badFn).to.throw(Error, 'Method not implemented.');
    });
  });
  describe('#resetSettings', () => {
    let getBrightnessStub;
    let getSaturationStub;
    let getSettingStub;
    let setBrightnessStub;
    let setSaturationStub;
    let setSettingStub;

    beforeEach(() => {
      getBrightnessStub = sinon.stub(device, '_getBrightness');
      getSaturationStub = sinon.stub(device, '_getSaturation');
      getSettingStub = sinon.stub(device, 'getSetting');
      setBrightnessStub = sinon.stub(device, 'setBrightness');
      setSaturationStub = sinon.stub(device, 'setSaturation');
      setSettingStub = sinon.stub(device, 'setPanTiltZoom');
    });
    afterEach(() => {
      getBrightnessStub?.restore();
      getSaturationStub?.restore();
      getSettingStub?.restore();
      setBrightnessStub?.restore();
      setSaturationStub?.restore();
      setSettingStub?.restore();
    });
    describe('on succeess', () => {
      it('should reset brightness, saturation and ptz', async () => {
        const brightness = new huddly.Brightness();
        brightness.setDefaultBrightness(100);
        const saturation = new huddly.Saturation();
        saturation.setDefaultSaturation(200);
        getBrightnessStub.resolves(brightness);
        getSaturationStub.resolves(saturation);
        getSettingStub.withArgs('pan').resolves({ default: 150 });
        getSettingStub.withArgs('tilt').resolves({ default: -150 });
        getSettingStub.withArgs('zoom').resolves({ default: 250 });
        setBrightnessStub.resolves();
        setSaturationStub.resolves();
        setSettingStub.resolves();

        await device.resetSettings();

        expect(setBrightnessStub.getCall(0).args[0]).to.equal(100);
        expect(setSaturationStub.getCall(0).args[0]).to.equal(200);
        expect(setSettingStub.getCall(0).args[0]).to.deep.equal({ pan: 150 });
        expect(setSettingStub.getCall(1).args[0]).to.deep.equal({ tilt: -150 });
        expect(setSettingStub.getCall(2).args[0]).to.deep.equal({ zoom: 250 });
      });
      it('should reset only brightness', async () => {
        const brightness = new huddly.Brightness();
        brightness.setDefaultBrightness(100);
        getBrightnessStub.resolves(brightness);
        setBrightnessStub.resolves();
        setSaturationStub.resolves();
        setSettingStub.resolves();

        await device.resetSettings(['saturation', 'pan', 'tilt', 'zoom']);
        expect(setBrightnessStub.getCall(0).args[0]).to.equal(100);
        expect(setSaturationStub.called).to.equal(false);
        expect(setSettingStub.called).to.equal(false);
      });
      it('should reset only saturation', async () => {
        const saturation = new huddly.Saturation();
        saturation.setDefaultSaturation(200);
        getSaturationStub.resolves(saturation);
        setBrightnessStub.resolves();
        setSaturationStub.resolves();
        setSettingStub.resolves();

        await device.resetSettings(['brightness', 'pan', 'tilt', 'zoom']);
        expect(setSaturationStub.getCall(0).args[0]).to.equal(200);
        expect(setBrightnessStub.called).to.equal(false);
        expect(setSettingStub.called).to.equal(false);
      });
      it('should reset only ptz', async () => {
        getSettingStub.withArgs('pan').resolves({ default: 150 });
        getSettingStub.withArgs('tilt').resolves({ default: -150 });
        getSettingStub.withArgs('zoom').resolves({ default: 250 });
        setBrightnessStub.resolves();
        setSaturationStub.resolves();
        setSettingStub.resolves();

        await device.resetSettings(['brightness', 'saturation']);

        expect(setSettingStub.getCall(0).args[0]).to.deep.equal({ pan: 150 });
        expect(setSettingStub.getCall(1).args[0]).to.deep.equal({ tilt: -150 });
        expect(setSettingStub.getCall(2).args[0]).to.deep.equal({ zoom: 250 });
        expect(setBrightnessStub.called).to.equal(false);
        expect(setSaturationStub.called).to.equal(false);
      });
    });
    describe('on error', () => {
      describe('brightness', () => {
        it('should reject when get brightness fails', () => {
          getBrightnessStub.rejects(dummyError);
          const resetPromise = device.resetSettings(['saturation', 'pan', 'tilt', 'zoom']);
          return expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
        });
        it('should reject when set brightness fails', () => {
          const brightness = new huddly.Brightness();
          brightness.setDefaultBrightness(100);
          getBrightnessStub.resolves(brightness);
          setBrightnessStub.rejects(dummyError);
          const resetPromise = device.resetSettings(['saturation', 'pan', 'tilt', 'zoom']);
          return expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
        });
      });
      describe('saturation', () => {
        it('should reject when get saturation fails', () => {
          getSaturationStub.rejects(dummyError);
          const resetPromise = device.resetSettings(['brightness', 'pan', 'tilt', 'zoom']);
          return expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
        });
        it('should reject when set brightness fails', () => {
          const saturation = new huddly.Saturation();
          saturation.setDefaultSaturation(200);
          getSaturationStub.resolves(saturation);
          setSaturationStub.rejects(dummyError);
          const resetPromise = device.resetSettings(['brightness', 'pan', 'tilt', 'zoom']);
          return expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
        });
      });
      describe('pan', () => {
        it('should reject when get pan setting fails', () => {
          getSettingStub.withArgs('pan').rejects(dummyError);
          const resetPromise = device.resetSettings(['brightness', 'saturation', 'tilt', 'zoom']);
          return expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
        });
        it('should reject when set pan setting fails', () => {
          getSettingStub.withArgs('pan').resolves({ default: 150 });
          setSettingStub.rejects(dummyError);
          const resetPromise = device.resetSettings(['brightness', 'saturation', 'tilt', 'zoom']);
          return expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
        });
      });
      describe('tilt', () => {
        it('should reject when get tilt setting fails', () => {
          getSettingStub.withArgs('tilt').rejects(dummyError);
          const resetPromise = device.resetSettings(['brightness', 'saturation', 'pan', 'zoom']);
          return expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
        });
        it('should reject when set tilt setting fails', () => {
          getSettingStub.withArgs('tilt').resolves({ default: 150 });
          setSettingStub.rejects(dummyError);
          const resetPromise = device.resetSettings(['brightness', 'saturation', 'pan', 'zoom']);
          return expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
        });
      });
      describe('zoom', () => {
        it('should reject when get zoom setting fails', () => {
          getSettingStub.withArgs('zoom').rejects(dummyError);
          const resetPromise = device.resetSettings(['brightness', 'saturation', 'pan', 'tilt']);
          return expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
        });
        it('should reject when set zoom setting fails', () => {
          getSettingStub.withArgs('zoom').resolves({ default: 150 });
          setSettingStub.rejects(dummyError);
          const resetPromise = device.resetSettings(['brightness', 'saturation', 'pan', 'tilt']);
          return expect(resetPromise).to.eventually.be.rejectedWith(dummyError.message);
        });
      });
    });
  });
  describe('#setPanTilt', () => {
    let setPanTiltZoomStub;
    afterEach(() => {
      setPanTiltZoomStub?.restore();
    });
    describe('on success', () => {
      it('should set pan tilt zoom values on device', () => {
        setPanTiltZoomStub = sinon.stub(device, 'setPanTiltZoom').resolves();
        const promise = device.setPanTilt({});
        return expect(promise).to.be.fulfilled;
      });
    });
    describe('on error', () => {
      it('should reject when device uptime cannot be fetched', () => {
        setPanTiltZoomStub = sinon.stub(device, 'setPanTiltZoom').rejects(dummyError);
        const promise = device.setPanTilt({});
        expect(promise).to.eventually.be.rejectedWith(dummyError.message);
      });
    });
  });

  describe('#usbReEnumerate', () => {
    it('should not be implemented', () => {
      const badFn = () => {
        device.usbReEnumerate();
      };
      return expect(badFn).to.throw(Error, 'Method not implemented.');
    });
  });
  describe('#isAlive', () => {
    it('should not be implemented', () => {
      const badFn = () => {
        device.isAlive();
      };
      return expect(badFn).to.throw(Error, 'Method not implemented.');
    });
  });
  describe('#equals', () => {
    const wsddDeviceObj = {
      infoObject: () => {
        return {
          name: 'L1',
          serial: '1234HA',
          mac: 'AA:BB:CC:DD:EE',
        };
      },
      equals: () => {
        return true;
      },
    };

    it('should be equals when testing same device instance', () => {
      device = new IpBaseDevice(wsddDeviceObj, dummyTransport, new EventEmitter());
      expect(device.equals(device)).to.equal(true);
    });
    it('should not be equals when testing different device instances', () => {
      device = new IpBaseDevice(wsddDeviceObj, dummyTransport, new EventEmitter());
      const newDeviceStub = sinon.createStubInstance(IpBaseDevice);
      newDeviceStub.wsdDevice = {
        equals: () => {
          return false;
        },
      };
      expect(device.equals(newDeviceStub)).to.equal(false);
    });
    it('should not be equals when testing a non ip base device instance', () => {
      device = new IpBaseDevice(wsddDeviceObj, dummyTransport, new EventEmitter());
      const boxfishStub = sinon.createStubInstance(Boxfish);
      expect(device.equals(boxfishStub)).to.equal(false);
    });
  });
  describe('#_getOptionCertificates', () => {
    it('should return option certificates', async () => {
      const certs = await device._getOptionCertificates();
      expect(certs.getCertificatesList()[0].getName()).to.equal(optionCert.getName());
      expect(certs.getCertificatesList()[0].getCertificate()).to.equal(optionCert.getCertificate());
    });
    it('should reject if there is an issue', async () => {
      grpcClient.getOptionCertificates = (empty: Empty, cb: any) => {
        cb('error', undefined);
      };
      device._getOptionCertificates().catch((err) => expect(err).to.equal('error'));
    });
  });
  describe('#getOptionCertificates', () => {
    it('should return a list with certificates objects', async () => {
      const stub = sinon.stub(device, '_getOptionCertificates').resolves(optionCerts);
      const certs = await device.getOptionCertificates();
      expect(certs[0]).to.deep.equal({
        name: optionCert.getName(),
        certificate: optionCert.getCertificate(),
      });
      stub.restore();
    });
    it('should handle errors', async () => {
      const stub = sinon.stub(device, '_getOptionCertificates').rejects(dummyError);
      await device.getOptionCertificates().catch((err) => {
        expect(err).to.equal(dummyError.message);
        expect(device.handleError).to.have.been.calledOnce;
      });
      stub.restore();
    });
  });
});
