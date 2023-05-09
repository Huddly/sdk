import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { EventEmitter } from 'events';
import cpio from 'cpio-stream';

import IpCameraUpgrader, { UpgradeSteps } from '../../../src/components/upgrader/ipUpgrader';
import Boxfish from '../../../src/components/device/boxfish';
import IpBaseDevice from '../../../src/components/device/ipbase';
import { CameraEvents } from '../../../src';
import AceUpgraderError from '../../../src/error/AceUpgraderError';

import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

chai.should();
chai.use(sinonChai);

const createDummyManager = () => {
  const dummyManager = sinon.createStubInstance(IpBaseDevice);
  dummyManager.transport = {
    grpcConnectionDeadlineSeconds: () => {},
    close: () => {},
  };
  dummyManager.grpcClient = {
    getDeviceVersion: sinon.stub(),
    upgradeDevice: sinon.stub(),
    upgradeVerify: sinon.stub(),
    reset: sinon.stub(),
    upgradeImage: sinon.stub(),
    verifyIntegrity: sinon.stub(),
  };
  dummyManager.wsdDevice = {
    serialNumber: '1245',
    mac: 'FF:FF:FF:FF:FF:FF',
  };
  return dummyManager;
};

const dummyEmitter = new EventEmitter();

describe('IpCameraUpgrader', () => {
  let upgrader: IpCameraUpgrader;
  let dummyManager;
  beforeEach(() => {
    dummyManager = createDummyManager();
    upgrader = new IpCameraUpgrader(dummyManager, dummyEmitter);
  });

  describe('getters', () => {
    describe('IpBaseDevice', () => {
      it('should return ace', () => {
        const manager = upgrader.ipBaseManager;
        expect(manager).to.be.an.instanceof(IpBaseDevice);
      });
      it('should throw error if instance is not Ace', () => {
        upgrader = new IpCameraUpgrader(sinon.createStubInstance(Boxfish), dummyEmitter);
        const badFn = () => {
          upgrader.ipBaseManager;
        };
        expect(badFn).to.throw(
          'IP camera upgrader initialized with wrong camera manager! Manager is not instance of IpBaseDevice but => Boxfish'
        );
      });
    });
  });

  describe('#init', () => {
    describe('upgrader file exists', () => {
      it('should not throw any error if opts.file is correct', () => {
        const goodFn = () => {
          upgrader.init({ file: Buffer.alloc(0) });
        };
        expect(goodFn).to.not.throw();
      });

      it('should update bootTimeout if ops.bootTimeout is provided', () => {
        upgrader.init({
          file: Buffer.alloc(0),
          bootTimeout: 5,
        });
        expect(upgrader.bootTimeout).to.equal(5000);
      });

      it('should call #registerHotPlugEvents', () => {
        const spy = sinon.spy(upgrader, 'registerHotPlugEvents');
        upgrader.init({
          file: Buffer.alloc(0),
        });
        expect(spy.called).to.equal(true);
      });
    });
  });

  describe('#registerHotPlugEvents', () => {
    describe('on ATTACH', () => {
      it('should emit UPGRADE_REBOOT_COMPLETE when the device under upgrade is attached', () => {
        const spy = sinon.spy();
        upgrader.on('UPGRADE_REBOOT_COMPLETE', spy);
        upgrader.registerHotPlugEvents();
        dummyManager.equals = () => {
          return true;
        }; // Stub device manager equals method
        dummyEmitter.emit(CameraEvents.ATTACH, dummyManager);
        expect(spy.called).to.equal(true);
      });
      it('should not emit any event if the attached device is not the one under upgrade', () => {
        const spy = sinon.spy();
        upgrader.on('UPGRADE_REBOOT_COMPLETE', spy);
        upgrader.registerHotPlugEvents();
        dummyManager.equals = () => {
          return false;
        }; // Stub device manager equals method
        dummyEmitter.emit(CameraEvents.ATTACH, dummyManager);
        expect(spy.called).to.equal(false);
      });
    });
    describe('on DETACH', () => {
      it('should emit UPGRADE_REBOOT when the device under upgrade is detached', () => {
        const spy = sinon.spy();
        upgrader.on('UPGRADE_REBOOT', spy);
        upgrader.registerHotPlugEvents();
        dummyEmitter.emit(CameraEvents.DETACH, { serialNumber: '1245' });
        expect(spy.called).to.equal(true);
        expect(dummyManager.closeConnection.called).to.equal(true);
      });
      it('should not emit any event if the detached device is not the one under upgrade', () => {
        const spy = sinon.spy();
        upgrader.on('UPGRADE_REBOOT', spy);
        upgrader.registerHotPlugEvents();
        dummyEmitter.emit(CameraEvents.DETACH, { serialNumber: '5555' });
        expect(spy.called).to.equal(false);
      });
    });
  });

  describe('#start', () => {
    let flashStub, rebootStub, commitStub, verifyVersionStateStub, verifyVersion, useLegacyStub;
    beforeEach(() => {
      flashStub = sinon.stub(upgrader, 'flash').resolves();
      rebootStub = sinon.stub(upgrader, 'reboot').resolves();
      commitStub = sinon.stub(upgrader, 'commit').resolves();
      useLegacyStub = sinon.stub(upgrader, 'useLegacy').resolves(true);
      verifyVersionStateStub = sinon.stub(upgrader, 'verifyVersionState').resolves();
      verifyVersion = sinon.stub(upgrader, 'verifyVersion').resolves();
    });

    it('should verify version state, flash and reboot', async () => {
      const spy = sinon.spy();
      upgrader.on(CameraEvents.UPGRADE_PROGRESS, spy);
      upgrader.bootTimeout = 0;
      await upgrader.start();
      expect(verifyVersionStateStub.called).to.equal(true);
      expect(flashStub.called).to.equal(true);
      expect(rebootStub.called).to.equal(true);
      expect(spy.callCount).to.equal(3);

      // Flash step
      expect(spy.getCall(0).args[0].status).to.equal('Starting upgrade');
      expect(spy.getCall(0).args[0].progress).to.equal(0);
      // Flash completed
      expect(spy.getCall(1).args[0].progress).to.equal(15);

      // Reboot step
      expect(spy.getCall(2).args[0].status).to.equal('Rebooting camera');
      expect(spy.getCall(2).args[0].progress).to.equal(31);
    });

    it('should check version state, version, commit and finish upgrade', async () => {
      const spy = sinon.spy();
      upgrader.on(CameraEvents.UPGRADE_PROGRESS, spy);
      upgrader.bootTimeout = 0;
      await upgrader.start();
      upgrader.emit('UPGRADE_REBOOT_COMPLETE');

      return new Promise((resolve, reject) => {
        upgrader.on(CameraEvents.UPGRADE_COMPLETE, () => {
          try {
            expect(verifyVersionStateStub.called).to.equal(true);
            expect(flashStub.called).to.equal(true);
            expect(rebootStub.called).to.equal(true);
            expect(verifyVersion.called).to.equal(true);
            expect(spy.callCount).to.equal(6);

            // Reboot step completed
            expect(spy.getCall(3).args[0].progress).to.equal(90);

            // Commit step started
            expect(spy.getCall(4).args[0].status).to.equal('Verifying new software');
            expect(spy.getCall(4).args[0].progress).to.equal(95);

            expect(commitStub.called).to.equal(true);

            // Commit completed
            expect(spy.getCall(5).args[0].status).to.equal('Upgrade complete');
            expect(spy.getCall(5).args[0].progress).to.equal(100);

            // We have also verified that `UPGRADE_COMPLETE` event was fired as we are already in the event callback
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('should time out when camera does not come up in time', () => {
      const spy = sinon.spy();
      upgrader.on(CameraEvents.TIMEOUT, spy);
      upgrader.bootTimeout = 0.1;
      upgrader.start();
      return new Promise<void>((resolve, reject) => {
        upgrader.on(CameraEvents.TIMEOUT, (msg) => {
          try {
            expect(msg).to.equal('Camera did not come back up after upgrade!');
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  });

  describe('#verifyVersionState', () => {
    let getVersionStateStub;
    afterEach(() => {
      getVersionStateStub.restore();
    });
    it('should do nothing if version state matches', () => {
      getVersionStateStub = sinon.stub(upgrader, 'getVersionState').resolves(0);
      const goodFunc = async () => {
        await upgrader.verifyVersionState(0);
      };
      expect(goodFunc).to.not.throw();
    });

    it('should emit UPGRADE_FAILURE and throw AceUpgradeError if state dont match', async () => {
      const spy = sinon.spy();
      upgrader.on(CameraEvents.UPGRADE_FAILED, spy);
      getVersionStateStub = sinon.stub(upgrader, 'getVersionState').resolves(1);
      try {
        await upgrader.verifyVersionState(0);
        expect(undefined).to.equal('Line above should throw error');
      } catch (e) {
        expect(e).to.be.instanceof(AceUpgraderError);
        expect(spy.called).to.equal(true);
        expect(e.message).to.equal(
          'Device not running in expected state. Expected UNKNOWNVERSIONSTATE | Got VERIFIED'
        );
      }
    });
  });

  describe('#verifyVersion', () => {
    let cpioStub, getVersionSub, streamStub, extractOnStub, extractDestroyStub;
    const extractEmitter: EventEmitter = cpio.extract();
    beforeEach(() => {
      cpioStub = sinon.stub(cpio, 'extract').returns(extractEmitter);
      upgrader.options = { file: Buffer.alloc(0) };
      getVersionSub = sinon.stub(upgrader, 'getVersion').resolves('1.2.3');
      streamStub = sinon.stub({ resume: () => {}, on: (msg, cb) => {} });
    });

    afterEach(() => {
      cpioStub?.restore();
      getVersionSub?.restore();
      extractOnStub?.restore();
      extractDestroyStub?.restore();
    });

    it('should successfully extract version from cpio and compare with current version', () => {
      const entryCb = () => {
        extractEmitter.emit('finish');
      };
      streamStub.resume.returns(true);
      streamStub.on.withArgs('data').yields('1.2.3');
      streamStub.on.withArgs('end').yields(entryCb);

      const header = { name: 'version' };
      extractOnStub = sinon.stub(extractEmitter, 'on');
      extractOnStub
        .withArgs('entry')
        .yields(header, streamStub, entryCb)
        .withArgs('finish')
        .yields();

      extractDestroyStub = sinon.stub(extractEmitter, 'destroy');
      extractDestroyStub.returns(true);
      const goodFn = async () => {
        await upgrader.verifyVersion();
      };
      expect(goodFn).to.not.throw();
    });

    it('should throw error if current version does not match with expected versiom', () => {
      const entryCb = () => {
        extractEmitter.emit('finish');
      };
      streamStub.resume.returns(true);
      streamStub.on.withArgs('data').yields('0.0.1');
      streamStub.on.withArgs('end').yields(entryCb);

      const header = { name: 'version' };
      extractOnStub = sinon.stub(extractEmitter, 'on');
      extractOnStub
        .withArgs('entry')
        .yields(header, streamStub, entryCb)
        .withArgs('finish')
        .yields();

      extractDestroyStub = sinon.stub(extractEmitter, 'destroy');
      extractDestroyStub.returns(true);
      const errMsg = 'Camera running wrong version! Expected 0.0.1 but got 1.2.3';
      return expect(upgrader.verifyVersion()).to.eventually.be.rejectedWith(
        AceUpgraderError,
        errMsg
      );
    });

    describe('onTimeout', () => {
      let clock;
      beforeEach(() => {
        clock = sinon.useFakeTimers();
      });
      afterEach(() => {
        clock.restore();
      });

      it('should timeout reading version from cpio and reject the call', () => {
        const errMsg = 'Camera running wrong version! Expected N/A but got 1.2.3';
        try {
          upgrader.verifyVersion();
          clock.tick(1000);
        } catch (e) {
          expect(e).to.be.instanceOf(AceUpgraderError);
          expect(e.message).to.equal(errMsg);
        }
      });
    });
  });

  describe('#calculateExpectedSlot', () => {
    it('should throw error for unexpected slots', () => {
      const badFn = () => {
        upgrader.calculateExpectedSlot('X');
      };
      expect(badFn).to.throw(AceUpgraderError, 'Unexpected slot: X');
    });
    it('should expect B given A', () => {
      expect(upgrader.calculateExpectedSlot('A')).to.equal('B');
    });
    it('should expect A given B', () => {
      expect(upgrader.calculateExpectedSlot('B')).to.equal('A');
    });
    it('should expect A given C', () => {
      expect(upgrader.calculateExpectedSlot('C')).to.equal('A');
    });
  });

  describe('#verifySlot', () => {
    afterEach(() => {
      dummyManager.getSlot.restore();
    });

    it('should do nothing if expected slot and current slot match', () => {
      dummyManager.getSlot.resolves('B');
      const goodFn = () => {
        upgrader.verifySlot('A');
      };
      expect(goodFn).to.not.throw();
    });

    it('should throw AceUpgraderError if expected slot and current slot dont match', () => {
      dummyManager.getSlot.resolves('B');
      const errMsg = 'Camera booted from wrong slot! Expected A but got B';
      return expect(upgrader.verifySlot('B')).to.eventually.be.rejectedWith(
        AceUpgraderError,
        errMsg
      );
    });
  });

  describe('getVersionState', () => {
    it('should resolve version state if grpc call succeeds', async () => {
      const versionState: huddly.DeviceVersion = new huddly.DeviceVersion();
      versionState.setVersionState(0);
      dummyManager.grpcClient.getDeviceVersion.yields(undefined, versionState);
      const state = await upgrader.getVersionState();
      expect(state).to.equals(0);
    });
    it('should resolve undefined if grpc call did not go through', async () => {
      dummyManager.grpcClient.getDeviceVersion.yields({ message: 'hi', stack: {} }, undefined);
      const state = await upgrader.getVersionState();
      expect(state).to.be.undefined;
    });
  });

  describe('#getVersion', () => {
    it('should resolve version if grpc call succeeds', async () => {
      const versionState: huddly.DeviceVersion = new huddly.DeviceVersion();
      versionState.setVersion('1.2.3');
      dummyManager.grpcClient.getDeviceVersion.yields(undefined, versionState);
      const version = await upgrader.getVersion();
      expect(version).to.equals('1.2.3');
    });
    it('should resolve undefined if grpc call did not go through', async () => {
      dummyManager.grpcClient.getDeviceVersion.yields({ message: 'hi', stack: {} }, undefined);
      const version = await upgrader.getVersion();
      expect(version).to.be.undefined;
    });
  });

  describe('#performUpgradeStep', () => {
    let cpioStub, streamStub, extractOnStub;
    const extractEmitter: EventEmitter = cpio.extract();
    beforeEach(() => {
      cpioStub = sinon.stub(cpio, 'extract').returns(extractEmitter);
      upgrader.options = { file: Buffer.alloc(0) };
      streamStub = sinon.stub({ resume: () => {}, on: (msg, cb) => {} });
    });

    afterEach(() => {
      cpioStub.restore();
      extractOnStub.restore();
    });

    describe('onSuccess', () => {
      describe('legacy', () => {
        beforeEach(() => {
          upgrader._useLegacy = true;
        });
        it('should call upgradeDevice and resolve when callback is invoked', async () => {
          extractOnStub = sinon.stub(extractEmitter, 'on');
          extractOnStub.withArgs('entry').yields({}, streamStub, () => {});

          const status: huddly.DeviceStatus = new huddly.DeviceStatus();
          status.setCode(0);
          status.setMessage('All good');
          dummyManager.grpcClient.upgradeDevice.yields(undefined, status);

          const upgradeStepStatus: string = await upgrader.performUpgradeStep(
            UpgradeSteps.FLASH,
            'Flash'
          );
          expect(upgradeStepStatus).to.equal(
            'Flash step completed. Status code 0, message All good'
          );
        });
        it('should call upgradeVerify and resolve when callback is invoked', async () => {
          extractOnStub = sinon.stub(extractEmitter, 'on');
          extractOnStub.withArgs('entry').yields({}, streamStub, () => {});

          const status: huddly.DeviceStatus = new huddly.DeviceStatus();
          status.setCode(0);
          status.setMessage('All good');
          dummyManager.grpcClient.upgradeVerify.yields(undefined, status);

          const upgradeStepStatus: string = await upgrader.performUpgradeStep(
            UpgradeSteps.COMMIT,
            'Commit'
          );
          expect(upgradeStepStatus).to.equal(
            'Commit step completed. Status code 0, message All good'
          );
        });
        it('should write chunks to ClientWritableStream', async () => {
          const cpioStreamEndSpy = sinon.spy();
          streamStub.resume.returns(true);
          const dataBuffer: Buffer = Buffer.from('Hello');
          streamStub.on.withArgs('data').yields(dataBuffer);
          streamStub.on.withArgs('end').yields();

          const header = { name: 'image.itb' };
          extractOnStub = sinon.stub(extractEmitter, 'on');
          extractOnStub
            .withArgs('entry')
            .yields(header, streamStub, cpioStreamEndSpy)
            .withArgs('end')
            .yields();

          const status: huddly.DeviceStatus = new huddly.DeviceStatus();
          status.setCode(0);
          status.setMessage('All good');
          const stub = {
            write: sinon.stub(),
            end: sinon.stub(),
          };
          dummyManager.grpcClient.upgradeVerify.yields(undefined, status).returns(stub);

          await upgrader.performUpgradeStep(UpgradeSteps.COMMIT, 'Commit');
          expect(cpioStreamEndSpy.called).to.equal(true);
          expect(stub.write.called).to.equal(true);
          expect(stub.write.getCall(0).args[0]).to.be.instanceof(huddly.Chunk);
          expect((<huddly.Chunk>stub.write.getCall(0).args[0]).getContent()).to.deep.equal(
            dataBuffer
          );
        });
      });
      describe('new cpio format', () => {
        beforeEach(() => {
          upgrader._useLegacy = false;
        });
        it('should call upgradeImage and resolve when callback is invoked', async () => {
          extractOnStub = sinon.stub(extractEmitter, 'on');
          extractOnStub.withArgs('entry').yields({}, streamStub, () => {});

          const status: huddly.DeviceStatus = new huddly.DeviceStatus();
          status.setCode(0);
          status.setMessage('All good');
          dummyManager.grpcClient.upgradeImage.yields(undefined, status);

          const upgradeStepStatus: string = await upgrader.performUpgradeStep(
            UpgradeSteps.FLASH,
            'Flash'
          );
          expect(upgradeStepStatus).to.equal(
            'Flash step completed. Status code 0, message All good'
          );
        });
        it('should write chunks to ClientWritableStream on flash step', async () => {
          const cpioStreamEndSpy = sinon.spy();
          streamStub.resume.returns(true);
          const dataBuffer: Buffer = Buffer.from('Hello');
          streamStub.on.withArgs('data').yields(dataBuffer);
          streamStub.on.withArgs('end').yields();

          const header = { name: 'image.img' };
          extractOnStub = sinon.stub(extractEmitter, 'on');
          extractOnStub
            .withArgs('entry')
            .yields(header, streamStub, cpioStreamEndSpy)
            .withArgs('end')
            .yields();

          const status: huddly.DeviceStatus = new huddly.DeviceStatus();
          status.setCode(0);
          status.setMessage('All good');
          const stub = {
            write: sinon.stub(),
            end: sinon.stub(),
          };
          dummyManager.grpcClient.upgradeImage.yields(undefined, status).returns(stub);

          await upgrader.performUpgradeStep(UpgradeSteps.FLASH, 'Flash');
          expect(cpioStreamEndSpy.called).to.equal(true);
          expect(stub.write.called).to.equal(true);
          expect(stub.write.getCall(0).args[0]).to.be.instanceof(huddly.Chunk);
          expect((<huddly.Chunk>stub.write.getCall(0).args[0]).getContent()).to.deep.equal(
            dataBuffer
          );
        });
        it('should write chunks to ClientWritableStreamWrapper on commit step', async () => {
          const cpioStreamEndSpy = sinon.spy();
          streamStub.resume.returns(true);
          const dataBuffer: Buffer = Buffer.from('Hello');
          streamStub.on.withArgs('data').yields(dataBuffer);
          streamStub.on.withArgs('end').yields();

          const header = { name: 'verify.md5' };
          extractOnStub = sinon.stub(extractEmitter, 'on');
          extractOnStub
            .withArgs('entry')
            .yields(header, streamStub, cpioStreamEndSpy)
            .withArgs('end')
            .yields();

          const status: huddly.DeviceStatus = new huddly.DeviceStatus();
          status.setCode(0);
          status.setMessage('All good');
          dummyManager.grpcClient.verifyIntegrity.yields(undefined, status);

          await upgrader.performUpgradeStep(UpgradeSteps.COMMIT, 'Commit');
          expect(cpioStreamEndSpy.called).to.equal(true);
          const callArg = dummyManager.grpcClient.verifyIntegrity.getCall(0).args[0];
          expect(callArg).to.be.instanceof(huddly.VerificationRequest);
          expect(callArg.getFormat()).to.equal(huddly.VerificationFormat.MD5SUM);
        });
      });
    });

    describe('onFailure', () => {
      let clock;
      beforeEach(() => {
        clock = sinon.useFakeTimers();
      });
      afterEach(() => {
        clock.restore();
      });

      it('should reject with AceUpgradeError when upgrade step is unknown', () => {
        const errMsg = 'Unknown upgrade step REBOOT';
        const upgradeStepPromise = upgrader.performUpgradeStep(UpgradeSteps.REBOOT, 'REBOOT');
        return expect(upgradeStepPromise).to.eventually.be.rejectedWith(AceUpgraderError, errMsg);
      });

      it('should reject if upgradeStep callback contains errors', () => {
        const callbackErr = {
          message: 'Something went wrong!',
          details: 'Something went wrong!',
        };
        upgrader._useLegacy = true;
        dummyManager.grpcClient.upgradeVerify.yields(callbackErr, undefined);
        const upgradeStepPromise = upgrader.performUpgradeStep(UpgradeSteps.COMMIT, 'Commit');
        return expect(upgradeStepPromise).to.eventually.be.rejectedWith('Something went wrong!');
      });
      it('should reject if the read time exceeds 10 seconds', () => {
        const errMsg = 'Unable to perform upgrade step FLASH within given time of 10 seconds';
        try {
          upgrader.performUpgradeStep(UpgradeSteps.FLASH, 'FLASH');
          clock.tick(10000);
        } catch (e) {
          expect(e).to.be.instanceOf(AceUpgraderError);
          expect(e.message).to.equal(errMsg);
        }
      });
    });
  });

  describe('#flash', () => {
    let performUpgradeStepStub;
    afterEach(() => {
      performUpgradeStepStub?.restore();
    });
    it('should call performUpgradeStep with Flash step', async () => {
      performUpgradeStepStub = sinon.stub(upgrader, 'performUpgradeStep');
      performUpgradeStepStub.resolves();
      await upgrader.flash();
      expect(performUpgradeStepStub.called).to.equal(true);
      expect(performUpgradeStepStub.getCall(0).args[0]).to.equal(UpgradeSteps.FLASH);
      expect(performUpgradeStepStub.getCall(0).args[1]).to.equal('FLASH');
    });
  });

  describe('#reboot', () => {
    it('should call reset, close transport connection and resolve', () => {
      const deviceStatus: huddly.DeviceStatus = new huddly.DeviceStatus();
      deviceStatus.setCode(huddly.StatusCode.OK);
      dummyManager.closeConnection.returns();
      dummyManager.grpcClient.reset.yields(undefined, deviceStatus);
      return expect(upgrader.reboot()).to.be.fulfilled;
    });

    it('should reject and emit UPGRADE_FAILED event if reset grpc call does not go through', async () => {
      const spy = sinon.spy();
      upgrader.on(CameraEvents.UPGRADE_FAILED, spy);
      const errObj = { code: 1, details: 'Something went wrong' };
      dummyManager.grpcClient.reset.yields(errObj, undefined);
      try {
        await upgrader.reboot();
        expect(false).to.equal(true); // This line should not be reached
      } catch (e) {
        expect(e).to.equal(
          `Reboot failed! Error: code [${errObj.code}] Details [${errObj.details}]`
        );
        expect(spy.called).to.equal(true);
        expect(spy.getCall(0).args[0]).to.deep.equal(errObj);
      }
    });

    it('should reject if device status is not OK', async () => {
      const spy = sinon.spy();
      const errObj = { code: 1, details: 'GPRC Timeout' };
      upgrader.on(CameraEvents.UPGRADE_FAILED, spy);
      const deviceStatus: huddly.DeviceStatus = new huddly.DeviceStatus();
      deviceStatus.setCode(huddly.StatusCode.FAILED);
      deviceStatus.setMessage(errObj.details);
      dummyManager.grpcClient.reset.yields(errObj, deviceStatus);
      try {
        await upgrader.reboot();
        expect(false).to.equal(true); // This line should not be reached
      } catch (e) {
        expect(e).to.equal(
          `Reboot failed! DeviceStatus: code [${huddly.StatusCode.FAILED}] Msg [${errObj.details}]`
        );
        expect(spy.called).to.equal(true);
        expect(spy.getCall(0).args[0]).to.deep.equal(errObj);
      }
    });
  });

  describe('#commit', () => {
    let performUpgradeStepStub;
    afterEach(() => {
      performUpgradeStepStub?.restore();
    });
    it('should call performUpgradeStep with Commit step', async () => {
      performUpgradeStepStub = sinon.stub(upgrader, 'performUpgradeStep');
      performUpgradeStepStub.resolves();
      await upgrader.commit();
      expect(performUpgradeStepStub.called).to.equal(true);
      expect(performUpgradeStepStub.getCall(0).args[0]).to.equal(UpgradeSteps.COMMIT);
      expect(performUpgradeStepStub.getCall(0).args[1]).to.equal('COMMIT');
    });
  });

  describe('#upgradeIsValid', () => {
    it('should not be supported"', () => {
      const badFn = () => {
        upgrader.upgradeIsValid();
      };
      expect(badFn).to.throw('Method not supported!');
    });
  });

  describe('#doUpgrade', () => {
    let startStub;
    let upgradeOnStub;
    beforeEach(() => {
      startStub = sinon.stub(upgrader, 'start');
    });
    afterEach(() => {
      startStub?.restore();
      upgradeOnStub?.restore();
    });
    it('should call start and resolve when UPGRADE_COMPLETE is emitted', () => {
      upgradeOnStub = sinon.stub(upgrader, 'on');
      upgradeOnStub.withArgs(CameraEvents.UPGRADE_COMPLETE).yields();
      return expect(upgrader.doUpgrade()).to.eventually.be.fulfilled;
    });
    it('should call start and reject when UPGRADE_FAIL is emitted', () => {
      const errMsg = 'Something went wrong';
      upgradeOnStub = sinon.stub(upgrader, 'on');
      upgradeOnStub.withArgs(CameraEvents.UPGRADE_FAILED).yields(errMsg);
      return expect(upgrader.doUpgrade()).to.eventually.be.rejectedWith(errMsg);
    });
  });
});
