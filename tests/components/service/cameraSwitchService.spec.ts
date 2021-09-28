import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

import Logger from '../../../src/utilitis/logger';
import CameraSwitchService, { ServiceCameraActions } from '../../../src/components/service/cameraSwitchService';
import { HuddlyCameraServiceClient } from '@huddly/camera-switch-proto/lib/api/service_grpc_pb';
import * as switchservice from '@huddly/camera-switch-proto/lib/api/service_pb';


chai.should();
chai.use(sinonChai);

const stubLogger = () => {
  return sinon.createStubInstance(Logger);
};

const createServiceInstance = (): CameraSwitchService => {
  const service = new CameraSwitchService({});
  const grpcClientMock = sinon.createStubInstance(HuddlyCameraServiceClient, {
    setActiveCamera: sinon.stub(),
    setDefaultCamera: sinon.stub(),
    getActiveCamera: sinon.stub(),
    getDefaultCamera: sinon.stub(),
    setUserPTZ: sinon.stub(),
    getUserPTZ: sinon.stub()
  });
  service.grpcClient = grpcClientMock;
  return service;
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
        return expect(promise).to.be.fulfilled;
      });
      it('should call setDefaultCamera and resolve on callback', () => {
        (service.grpcClient.setDefaultCamera as any).yields(undefined);
        const promise = service.serviceCameraSetter(ServiceCameraActions.DEFAULT, { name: 'L1', ip: '1.2.3.4' });
        return expect(promise).to.be.fulfilled;
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
    });

    describe('onGrpcSuccess', () => {
      it('should call getActiveCamera and resolve on callback', () => {
        (service.grpcClient.getActiveCamera as any).yields(undefined, serviceCamInfo);
        const promise = service.serviceCameraGetter(ServiceCameraActions.ACTIVE);
        return expect(promise).to.be.fulfilled.then((gotCamInfo) => {
          expect(gotCamInfo).to.deep.equal(serviceCamInfo.toObject());
        });
      });
      it('should call getDefaultCamera and resolve on callback', () => {
        (service.grpcClient.getDefaultCamera as any).yields(undefined, serviceCamInfo);
        const promise = service.serviceCameraGetter(ServiceCameraActions.DEFAULT);
        return expect(promise).to.be.fulfilled.then((gotCamInfo) => {
          expect(gotCamInfo).to.deep.equal(serviceCamInfo.toObject());
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
        service.setDefaultCamera({});
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
        service.setActiveCamera({});
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
      return expect(promise).to.be.fulfilled;
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
      return expect(promise).to.be.fulfilled.then((isAllowed) => {
        expect(isAllowed).to.equal(true);
      });
    });
    it('should not allow user ptz', () => {
      const userPtz: switchservice.UserPtz = new switchservice.UserPtz();
      userPtz.setEnabled(false);

      (service.grpcClient.getUserPTZ as any).yields(undefined, userPtz);
      const promise = service.isUserPtzAllowed();
      return expect(promise).to.be.fulfilled.then((isAllowed) => {
        expect(isAllowed).to.equal(false);
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
