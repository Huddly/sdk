import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

import { CameraInfo, FwUpdateSchedule, FwUpdateScheduleStatus } from '@huddly/sdk-interfaces/lib/interfaces/ICameraSwitchModels';

import CameraSwitchService, { ServiceCameraActions } from '../../../src/components/service/cameraSwitchService';
import { HuddlyCameraServiceClient } from '@huddly/camera-switch-proto/lib/api/service_grpc_pb';
import * as switchservice from '@huddly/camera-switch-proto/lib/api/service_pb';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';


chai.should();
chai.use(sinonChai);

const createServiceInstance = (): CameraSwitchService => {
  const service = new CameraSwitchService({});
  const grpcClientMock = sinon.createStubInstance(HuddlyCameraServiceClient, {
    setActiveCamera: sinon.stub(),
    setDefaultCamera: sinon.stub(),
    getActiveCamera: sinon.stub(),
    getDefaultCamera: sinon.stub(),
    setUserPTZ: sinon.stub(),
    getUserPTZ: sinon.stub(),
    getAvailableCameras: sinon.stub(),
    setFwUpdateSchedule: sinon.stub(),
    scheduleFwUpdate: sinon.stub(),
    scheduleFwUpdateAll: sinon.stub()
  });
  service.grpcClient = grpcClientMock;
  return service;
};

const getGenericDeviceInfo = (): switchservice.CameraInfo => {
  const device1: switchservice.CameraInfo = new switchservice.CameraInfo();
  device1.setIp('0.0.0.0');
  device1.setName('L1');
  device1.setVersion('1.1.0');
  device1.setVersionState(switchservice.VersionState.VERIFIED);
  device1.addPairingStates(switchservice.CameraPairingState.ACTIVE);
  device1.addPairingStates(switchservice.CameraPairingState.PAIRED);
  return device1;
};

describe('CameraSwitchService', () => {
  let service: CameraSwitchService;

  beforeEach(() => {
    service = createServiceInstance();
  });

  describe('#init', () => {
    let waitForReadyStub;
    afterEach(() => {
      waitForReadyStub.restore();
    });

    it('should connect', () => {
      waitForReadyStub = sinon
        .stub(HuddlyCameraServiceClient.prototype, 'waitForReady')
        .callsFake((deadline, cb) => {
          cb(undefined);
        });
      const p = service.init();
      return expect(p).to.be.fulfilled;
    });
    it('should not connect', () => {
      waitForReadyStub = sinon
        .stub(HuddlyCameraServiceClient.prototype, 'waitForReady')
        .callsFake((deadline, cb) => {
          cb(Error('Something went wrong'));
        });
      const p = service.init();
      return expect(p).to.eventually.be.rejectedWith('Something went wrong');
    });
  });

  describe('#serviceCameraSetter', () => {
    describe('onGrpcSuccess', () => {
      it('should call setActiveCamera and resolve on callback', () => {
        (service.grpcClient.setActiveCamera as any).yields(undefined);
        const promise = service.serviceCameraSetter(ServiceCameraActions.ACTIVE, { name: 'L1', ip: '1.2.3.4' });
        return expect(promise).to.be.fulfilled.then((_: any) => {
          expect((service.grpcClient.setActiveCamera as any).getCall(0).args[0]).to.be.instanceOf(switchservice.CameraInfoWrite);
        });
      });
      it('should call setDefaultCamera and resolve on callback', () => {
        (service.grpcClient.setDefaultCamera as any).yields(undefined);
        const promise = service.serviceCameraSetter(ServiceCameraActions.DEFAULT, { name: 'L1', ip: '1.2.3.4' });
        return expect(promise).to.be.fulfilled.then((_: any) => {
          expect((service.grpcClient.setDefaultCamera as any).getCall(0).args[0]).to.be.instanceOf(switchservice.CameraInfoWrite);
        });
      });
    });
    describe('onGrpcFailure', () => {
      it('should reject with the error received from grpc call', () => {
        (service.grpcClient.setDefaultCamera as any).yields({details: 'Something went wrong', stack: ''});
        const promise = service.serviceCameraSetter(ServiceCameraActions.DEFAULT, { name: 'L1', ip: '1.2.3.4' });
        return expect(promise).to.eventually.be.rejectedWith('Something went wrong');
      });
    });
    it('should throw error when passing wrong action', () => {
      const promise = service.serviceCameraSetter(-1, { name: 'L1', ip: '1.2.3.4' });
      return expect(promise).to.eventually.be.rejectedWith('Unknown service camera action: undefined');
    });
  });

  describe('#serviceCameraGetter', () => {
    const serviceCamInfo: switchservice.CameraInfo = new switchservice.CameraInfo();
    before(() => {
      serviceCamInfo.setName('L1');
      serviceCamInfo.setIp('1.2.3');
      serviceCamInfo.setVersion('1.1.0');
      serviceCamInfo.setPairingStatesList([]);
      serviceCamInfo.setVersionState(switchservice.VersionState.UNKNOWNVERSIONSTATE);
    });

    describe('onGrpcSuccess', () => {
      it('should call getActiveCamera and resolve on callback', () => {
        (service.grpcClient.getActiveCamera as any).yields(undefined, serviceCamInfo);
        const promise = service.serviceCameraGetter(ServiceCameraActions.ACTIVE);
        return expect(promise).to.be.fulfilled.then((gotCamInfo: CameraInfo) => {
          expect(gotCamInfo).to.deep.equal({
            ip: serviceCamInfo.getIp(),
            name: serviceCamInfo.getName(),
            version: serviceCamInfo.getVersion(),
            version_state: 'UNKNOWNVERSIONSTATE',
            pairing_state: []
          });
          expect((service.grpcClient.getActiveCamera as any).getCall(0).args[0]).to.be.instanceOf(Empty);
        });
      });
      it('should call getDefaultCamera and resolve on callback', () => {
        (service.grpcClient.getDefaultCamera as any).yields(undefined, serviceCamInfo);
        const promise = service.serviceCameraGetter(ServiceCameraActions.DEFAULT);
        return expect(promise).to.be.fulfilled.then((gotCamInfo: CameraInfo) => {
          expect(gotCamInfo).to.deep.equal({
            ip: serviceCamInfo.getIp(),
            name: serviceCamInfo.getName(),
            version: serviceCamInfo.getVersion(),
            version_state: 'UNKNOWNVERSIONSTATE',
            pairing_state: []
          });
          expect((service.grpcClient.getDefaultCamera as any).getCall(0).args[0]).to.be.instanceOf(Empty);
        });
      });
    });
    describe('onGrpcFailure', () => {
      it('should reject with the error received from grpc call', () => {
        (service.grpcClient.getDefaultCamera as any).yields({details: 'Something went wrong', stack: ''}, undefined);
        const promise = service.serviceCameraGetter(ServiceCameraActions.DEFAULT);
        return expect(promise).to.eventually.be.rejectedWith('Something went wrong');
      });
    });
    it('should throw error when passing wrong action', () => {
      const promise = service.serviceCameraGetter(-1);
      return expect(promise).to.eventually.be.rejectedWith('Unknown service camera action: undefined');
    });
  });

  describe('set/get default/active camera', () => {
    let serviceCameraSetterStub;
    let serviceCameraGetterStub;
    beforeEach(() => {
      serviceCameraSetterStub = sinon.stub(service, 'serviceCameraSetter').resolves();
      serviceCameraGetterStub = sinon.stub(service, 'serviceCameraGetter').resolves();
    });
    afterEach(() => {
      serviceCameraSetterStub.restore();
      serviceCameraGetterStub.restore();
    });
    describe('#setDefaultCamera', () => {
      it('should call serviceCameraSetter with action DEFAULT', () => {
        service.setDefaultCamera({ ip: '127.0.0.1', name: 'L1' });
        expect(serviceCameraSetterStub.called).to.equal(true);
        expect(serviceCameraSetterStub.getCall(0).args[0]).to.equals(ServiceCameraActions.DEFAULT);
      });
    });
    describe('#getDefaultCamera', () => {
      it('should call serviceCameraGetter with action DEFAULT', () => {
        service.getDefaultCamera();
        expect(serviceCameraGetterStub.called).to.equal(true);
        expect(serviceCameraGetterStub.getCall(0).args[0]).to.equals(ServiceCameraActions.DEFAULT);
      });
    });
    describe('#setActiveCamera', () => {
      it('should call serviceCameraSetter with action ACTIVE', () => {
        service.setActiveCamera({ ip: '127.0.0.1', name: 'L1' });
        expect(serviceCameraSetterStub.called).to.equal(true);
        expect(serviceCameraSetterStub.getCall(0).args[0]).to.equals(ServiceCameraActions.ACTIVE);
      });
    });
    describe('#getActiveCamera', () => {
      it('should call serviceCameraSetter with action ACTIVE', () => {
        service.getActiveCamera();
        expect(serviceCameraGetterStub.called).to.equal(true);
        expect(serviceCameraGetterStub.getCall(0).args[0]).to.equals(ServiceCameraActions.ACTIVE);
      });
    });
  });

  describe('#setUserPtz', () => {
    it('should call setUserPtz and resolve on callback', () => {
      (service.grpcClient.setUserPTZ as any).yields(undefined);
      const promise = service.setUserPtz(true);
      return expect(promise).to.be.fulfilled.then((_: any) => {
        expect((service.grpcClient.setUserPTZ as any).getCall(0).args[0]).to.be.instanceOf(switchservice.UserPtz);
      });
    });
    it('should reject with the error received from grpc call', () => {
      (service.grpcClient.setUserPTZ as any).yields({details: 'Something went wrong', stack: ''});
      const promise = service.setUserPtz(true);
      return expect(promise).to.eventually.be.rejectedWith('Something went wrong');
    });
  });

  describe('#isUserPtzAllowed', () => {
    it('should allow user ptz', () => {
      const userPtz: switchservice.UserPtz = new switchservice.UserPtz();
      userPtz.setEnabled(true);

      (service.grpcClient.getUserPTZ as any).yields(undefined, userPtz);
      const promise = service.isUserPtzAllowed();
      return expect(promise).to.be.fulfilled.then((isAllowed: any) => {
        expect(isAllowed).to.equal(true);
        expect((service.grpcClient.getUserPTZ as any).getCall(0).args[0]).to.be.instanceOf(Empty);
      });
    });
    it('should not allow user ptz', () => {
      const userPtz: switchservice.UserPtz = new switchservice.UserPtz();
      userPtz.setEnabled(false);

      (service.grpcClient.getUserPTZ as any).yields(undefined, userPtz);
      const promise = service.isUserPtzAllowed();
      return expect(promise).to.be.fulfilled.then((isAllowed: any) => {
        expect(isAllowed).to.equal(false);
        expect((service.grpcClient.getUserPTZ as any).getCall(0).args[0]).to.be.instanceOf(Empty);
      });
    });
    it('should reject with the error received from grpc call', () => {
      (service.grpcClient.getUserPTZ as any).yields({details: 'Something went wrong', stack: ''}, undefined);
      const promise = service.isUserPtzAllowed();
      return expect(promise).to.eventually.be.rejectedWith('Something went wrong');
    });
  });

  describe('allow/block user ptz', () => {
    let setUserPtzStub;
    beforeEach(() => {
      setUserPtzStub = sinon.stub(service, 'setUserPtz').resolves();
    });
    afterEach(() => {
      setUserPtzStub.restore();
    });
    describe('#allowUserPtz', () => {
      it('should call setUserPtz', () => {
        service.allowUserPtz();
        expect(setUserPtzStub.called).to.equal(true);
        expect(setUserPtzStub.getCall(0).args[0]).to.equals(true);
      });
    });
    describe('#blokUserPtz', () => {
      it('should call setUserPtz', () => {
        service.blokUserPtz();
        expect(setUserPtzStub.called).to.equal(true);
        expect(setUserPtzStub.getCall(0).args[0]).to.equals(false);
      });
    });
  });

  describe('#pairingStateToStringArray', () => {
    it('should convert pairing state enum to array of strings representing the key names', () => {
      const pairingList: Array<switchservice.CameraPairingStateMap[keyof switchservice.CameraPairingStateMap]> = [
        switchservice.CameraPairingState.ACTIVE,
        switchservice.CameraPairingState.DEFAULT,
        switchservice.CameraPairingState.PAIRED
      ];
      const pairingStateKeys: Array<string> = service.pairingStateToStringArray(pairingList);
      expect(pairingStateKeys).to.deep.equals(['Active', 'Default', 'Paired']);
    });

    it('should not contain duplicate keys', () => {
      const pairingList: Array<switchservice.CameraPairingStateMap[keyof switchservice.CameraPairingStateMap]> = [
        switchservice.CameraPairingState.ACTIVE,
        switchservice.CameraPairingState.ACTIVE,
        switchservice.CameraPairingState.ACTIVE
      ];
      const pairingStateKeys: Array<string> = service.pairingStateToStringArray(pairingList);
      expect(pairingStateKeys).to.deep.equals(['Active']);
    });
    it('should convert unknown states to the proper enum key', () => {
      const pairingList: Array<switchservice.CameraPairingStateMap[keyof switchservice.CameraPairingStateMap]> = [
        undefined,
        undefined
      ];
      const pairingStateKeys: Array<string> = service.pairingStateToStringArray(pairingList);
      expect(pairingStateKeys).to.deep.equals(['UnknownPairingState']);
    });
  });

  describe('#versionStateToString', () => {
    it('should convert device version state enum value to string representation of the corresponding key', () => {
      const deviceInfo: switchservice.CameraInfo = new switchservice.CameraInfo();
      deviceInfo.setVersionState(switchservice.VersionState.VERIFIED);
      const versionStateStr: string = service.versionStateToString(deviceInfo);
      expect(versionStateStr).to.equals('VERIFIED');
    });
    it('should return UNKNOWNVERSIONSTATE for unknown enum values', () => {
      const deviceInfo: switchservice.CameraInfo = new switchservice.CameraInfo();
      deviceInfo.setVersionState(undefined);
      const versionStateStr: string = service.versionStateToString(deviceInfo);
      expect(versionStateStr).to.equals('UNKNOWNVERSIONSTATE');
    });
  });

  describe('#protoCameraInfoListToLocalCameraInfoList', () => {
    it('should covert from protocolbuf type to local cameraswitch type', () => {
      const list: Array<switchservice.CameraInfo> = [];
      const device1: switchservice.CameraInfo = new switchservice.CameraInfo();
      device1.setIp('0.0.0.0');
      device1.setName('L1');
      device1.setVersion('1.1.0');
      device1.setVersionState(switchservice.VersionState.VERIFIED);
      device1.addPairingStates(switchservice.CameraPairingState.ACTIVE);
      device1.addPairingStates(switchservice.CameraPairingState.PAIRED);
      list.push(device1);
      const device2: switchservice.CameraInfo = new switchservice.CameraInfo();
      device2.setIp('1.1.1.1');
      device2.setName('SEE');
      device2.setVersion('1.0.0');
      device2.setVersionState(switchservice.VersionState.VERIFIED);
      device2.addPairingStates(switchservice.CameraPairingState.PAIRED);
      list.push(device2);

      const expectedList: Array<CameraInfo> = [];
      expectedList.push({
        ip: device1.getIp(),
        name: device1.getName(),
        version: device1.getVersion(),
        version_state: 'VERIFIED',
        pairing_state: ['Active', 'Paired']
      });
      expectedList.push({
        ip: device2.getIp(),
        name: device2.getName(),
        version: device2.getVersion(),
        version_state: 'VERIFIED',
        pairing_state: ['Paired']
      });
      const result: Array<CameraInfo> = service.protoCameraInfoListToLocalCameraInfoList(list);
      expect(result).to.deep.equal(expectedList);
    });
  });

  describe('#getAvailableCameras', () => {
    const availableCameras: switchservice.AvailableCameras = new switchservice.AvailableCameras();
    const dummyDevice = getGenericDeviceInfo();
    before(() => {
      availableCameras.addCameraList(dummyDevice);
    });

    describe('onGrpcSuccess', () => {
      it('should call getAvailableCameras and resolve on callback', () => {
        (service.grpcClient.getAvailableCameras as any).yields(undefined, availableCameras);
        const promise = service.getAvailableCameras();
        return expect(promise).to.be.fulfilled.then((cameraList: Array<CameraInfo>) => {
          expect(cameraList.length).to.equal(1);
          expect(cameraList).to.deep.equal([{
            ip: dummyDevice.getIp(),
            name: dummyDevice.getName(),
            version: dummyDevice.getVersion(),
            version_state: 'VERIFIED',
            pairing_state: ['Active', 'Paired']
          }]);
          expect((service.grpcClient.getAvailableCameras as any).getCall(0).args[0]).to.be.instanceOf(Empty);
        });
      });
    });
    describe('onGrpcFailure', () => {
      it('should reject with the error received from grpc call', () => {
        (service.grpcClient.getAvailableCameras as any).yields({details: 'Something went wrong', stack: ''}, undefined);
        const promise = service.getAvailableCameras();
        return expect(promise).to.eventually.be.rejectedWith('Something went wrong');
      });
    });
  });

  describe('#pairingStateKeysToValues', () => {
    it('should convert comma separated pairing states keys into protobuf CameraPairingStateMap', () => {
      const payload: string = 'Active,Paired';
      const result = service.pairingStateKeysToValues(payload);
      expect(result).to.deep.equals([switchservice.CameraPairingState.ACTIVE, switchservice.CameraPairingState.PAIRED]);
    });
    it('should ignore duplicate keys on the comma separated pairing states string', () => {
      const payload: string = 'Active,Active,Paired,Paired';
      const result = service.pairingStateKeysToValues(payload);
      expect(result).to.deep.equals([switchservice.CameraPairingState.ACTIVE, switchservice.CameraPairingState.PAIRED]);
    });
    it('should throw error if comma separated string contains unknown state', () => {
      const payload: string = 'Hello,Paired';
      const badFuncCall = () => service.pairingStateKeysToValues(payload);

      expect(badFuncCall).to.throw(`Unknown CameraPairingState [Hello]! Allowed States: UnknownPairingState,Default,Active,Paired`);
    });
  });

  describe('#setFwUpdateSchedule', () => {
    const newFwSchedule: FwUpdateSchedule = {
      daysOfWeek: 'Tuesday,Friday',
      hour: 3,
      maxStartDelay: 30,
      validPairingStates: 'Paired'
    };
    describe('onGrpcSuccess', () => {
      it('should update the fw schedule on the service', () => {
        const status: switchservice.FwUpdateScheduleStatus = new switchservice.FwUpdateScheduleStatus();
        status.setCode(switchservice.FwUpdateScheduleStatusCodes.SUCCESS);
        status.setMessage('All Good');
        const dummyDevice = getGenericDeviceInfo();
        status.addAffectedCameras(dummyDevice);

        (service.grpcClient.setFwUpdateSchedule as any).yields(undefined, status);
        const promise = service.setFwUpdateSchedule(newFwSchedule);
        return expect(promise).to.be.fulfilled.then((response: FwUpdateScheduleStatus) => {
          expect(response.message).to.equal('All Good');
          expect(response.affectedCameras).to.deep.equal([{
            ip: dummyDevice.getIp(),
            name: dummyDevice.getName(),
            version: dummyDevice.getVersion(),
            version_state: 'VERIFIED',
            pairing_state: ['Active', 'Paired']
          }]);
          expect((service.grpcClient.setFwUpdateSchedule as any).getCall(0).args[0])
          .to.be.instanceOf(switchservice.FwUpdateSchedule);
        });
      });
    });
    describe('onGrpcFailure', () => {
      it('should reject if grpc call fails', () => {
        (service.grpcClient.setFwUpdateSchedule as any).yields({details: 'Something went wrong', stack: ''}, undefined);
        const promise = service.setFwUpdateSchedule(newFwSchedule);
        return expect(promise).to.eventually.be.rejectedWith('Something went wrong');
      });
      it('should reject if status code errornous', () => {
        const status: switchservice.FwUpdateScheduleStatus = new switchservice.FwUpdateScheduleStatus();
        status.setCode(switchservice.FwUpdateScheduleStatusCodes.FAILED);
        status.setMessage('Could not update schedule!');
        (service.grpcClient.setFwUpdateSchedule as any).yields(undefined, status);
        const promise = service.setFwUpdateSchedule(newFwSchedule);
        return expect(promise).to.eventually.be.rejectedWith(status.getMessage());
      });
    });
  });

  describe('#getFwUpdateSchedule', () => {
    describe('onGrpcSuccess', () => {
      it('should get the current fw update schedule', () => {
        const grpcResponse: switchservice.FwUpdateSchedule = new switchservice.FwUpdateSchedule();
        grpcResponse.setDaysOfWeek('Monday,Tuesday');
        grpcResponse.setHourOfDay(3);
        grpcResponse.setStartDelayMaxSeconds(0);
        grpcResponse.setDisabled(true);
        grpcResponse.addValidPairingStates(switchservice.CameraPairingState.ACTIVE);

        (service.grpcClient.getFwUpdateSchedule as any).yields(undefined, grpcResponse);
        const promise = service.getFwUpdateSchedule();
        return expect(promise).to.be.fulfilled.then((response: FwUpdateSchedule) => {
          expect(response).to.deep.equal({
            daysOfWeek: grpcResponse.getDaysOfWeek(),
            validPairingStates: 'Active',
            hour: grpcResponse.getHourOfDay(),
            maxStartDelay: grpcResponse.getStartDelayMaxSeconds(),
            disabled: grpcResponse.getDisabled()
          });
          expect((service.grpcClient.getFwUpdateSchedule as any).getCall(0).args[0]).to.be.instanceOf(Empty);
        });
      });
    });
    describe('onGrpcFailure', () => {
      it('should reject if grpc call fails', () => {
        (service.grpcClient.getFwUpdateSchedule as any).yields({details: 'Something went wrong', stack: ''}, undefined);
        const promise = service.getFwUpdateSchedule();
        return expect(promise).to.eventually.be.rejectedWith('Something went wrong');
      });
    });
  });

  describe('#scheduleFwUpdate', () => {
    describe('onGrpcSuccess', () => {
      it('should start the update on the given camera', () => {
        const status: switchservice.FwUpdateScheduleStatus = new switchservice.FwUpdateScheduleStatus();
        status.setCode(switchservice.FwUpdateScheduleStatusCodes.SUCCESS);
        status.setMessage('All Good');
        const dummyDevice = getGenericDeviceInfo();
        status.addAffectedCameras(dummyDevice);

        (service.grpcClient.scheduleFwUpdate as any).yields(undefined, status);
        const promise = service.scheduleFwUpdate({
          ip: dummyDevice.getIp(),
          name: dummyDevice.getName()
        });
        return expect(promise).to.be.fulfilled.then((response: FwUpdateScheduleStatus) => {
          expect(response.message).to.equal('All Good');
          expect(response.affectedCameras).to.deep.equal([{
            ip: dummyDevice.getIp(),
            name: dummyDevice.getName(),
            version: dummyDevice.getVersion(),
            version_state: 'VERIFIED',
            pairing_state: ['Active', 'Paired']
          }]);
          expect((service.grpcClient.scheduleFwUpdate as any).getCall(0).args[0])
          .to.be.instanceOf(switchservice.CameraInfoWrite);
        });
      });
    });
    describe('onGrpcFailure', () => {
      it('should reject if grpc call fails', () => {
        (service.grpcClient.scheduleFwUpdate as any).yields({details: 'Something went wrong', stack: ''}, undefined);
        const dummyDevice = getGenericDeviceInfo();
        const promise = service.scheduleFwUpdate({
          ip: dummyDevice.getIp(),
          name: dummyDevice.getName()
        });
        return expect(promise).to.eventually.be.rejectedWith('Something went wrong');
      });
      it('should reject if status code errornous', () => {
        const status: switchservice.FwUpdateScheduleStatus = new switchservice.FwUpdateScheduleStatus();
        status.setCode(switchservice.FwUpdateScheduleStatusCodes.FAILED);
        status.setMessage('Camera not available for ugprade!');
        const dummyDevice = getGenericDeviceInfo();
        (service.grpcClient.scheduleFwUpdate as any).yields(undefined, status);
        const promise = service.scheduleFwUpdate({
          ip: dummyDevice.getIp(),
          name: dummyDevice.getName()
        });
        return expect(promise).to.eventually.be.rejectedWith(status.getMessage());
      });
    });
  });

  describe('#scheduleFwUpdateAll', () => {
    describe('onGrpcSuccess', () => {
      it('should start the update on the given camera', () => {
        const status: switchservice.FwUpdateScheduleStatus = new switchservice.FwUpdateScheduleStatus();
        status.setCode(switchservice.FwUpdateScheduleStatusCodes.SUCCESS);
        status.setMessage('All Good');
        const dummyDevice = getGenericDeviceInfo();
        status.addAffectedCameras(dummyDevice);

        (service.grpcClient.scheduleFwUpdateAll as any).yields(undefined, status);
        const promise = service.scheduleFwUpdateAll();
        return expect(promise).to.be.fulfilled.then((response: FwUpdateScheduleStatus) => {
          expect(response.message).to.equal('All Good');
          expect(response.affectedCameras).to.deep.equal([{
            ip: dummyDevice.getIp(),
            name: dummyDevice.getName(),
            version: dummyDevice.getVersion(),
            version_state: 'VERIFIED',
            pairing_state: ['Active', 'Paired']
          }]);
          expect((service.grpcClient.scheduleFwUpdateAll as any).getCall(0).args[0])
          .to.be.instanceOf(Empty);
        });
      });
    });
    describe('onGrpcFailure', () => {
      it('should reject if grpc call fails', () => {
        (service.grpcClient.scheduleFwUpdateAll as any).yields({details: 'Something went wrong', stack: ''}, undefined);
        const promise = service.scheduleFwUpdateAll();
        return expect(promise).to.eventually.be.rejectedWith('Something went wrong');
      });
      it('should reject if status code errornous', () => {
        const status: switchservice.FwUpdateScheduleStatus = new switchservice.FwUpdateScheduleStatus();
        status.setCode(switchservice.FwUpdateScheduleStatusCodes.FAILED);
        status.setMessage('Camera not available for ugprade!');
        (service.grpcClient.scheduleFwUpdateAll as any).yields(undefined, status);
        const promise = service.scheduleFwUpdateAll();
        return expect(promise).to.eventually.be.rejectedWith(status.getMessage());
      });
    });
  });

  describe('#close', () => {
    let waitForReadyStub;
    let closeSpy;
    afterEach(() => {
      waitForReadyStub.restore();
      closeSpy.restore();
    });
    it('should close grpc client if initialized', async () => {
      closeSpy = sinon.spy(HuddlyCameraServiceClient.prototype, 'close');
      waitForReadyStub = sinon
          .stub(HuddlyCameraServiceClient.prototype, 'waitForReady')
          .callsFake((deadline, cb) => {
              cb(undefined);
          });
      await service.init();
      await service.close();
      expect(closeSpy.calledOnce).to.equals(true);
    });
    it('should not close when client is not initialized', async () => {
      closeSpy = sinon.spy(HuddlyCameraServiceClient.prototype, 'close');
      await service.close();
      expect(closeSpy.called).to.equals(false);
    });
  });
});
