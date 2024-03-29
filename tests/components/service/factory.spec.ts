import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

import IHuddlyService from '@huddly/sdk-interfaces/lib/interfaces/IHuddlyService';

import ServiceFactory from './../../../src/components/service/factory';
import CameraSwitchService from '../../../src/components/service/cameraSwitchService';

chai.should();
chai.use(sinonChai);

describe('ServiceFactory', () => {
  let platformMock;

  beforeEach(() => {
    platformMock = sinon.stub(process, 'platform');
  });

  afterEach(() => {
    platformMock.restore();
  });

  describe('#getService', () => {
    it('should create new instance of CameraSwitchService when on Windows os', () => {
      platformMock.value('win32');
      const service: IHuddlyService = ServiceFactory.getService({});
      expect(service).to.be.instanceof(CameraSwitchService);
    });

    it('should throw error when running on ubuntu', () => {
      const platform = 'linux';
      platformMock.value(platform);
      const badFunc = () => { ServiceFactory.getService({}); };
      expect(badFunc).to.throw(`Currently there is no Huddly Service support for platform ${platform}`);
    });
    it('should throw error when running on osx', () => {
      const platform = 'darwin';
      platformMock.value(platform);
      const badFunc = () => { ServiceFactory.getService({}); };
      expect(badFunc).to.throw(`Currently there is no Huddly Service support for platform ${platform}`);
    });
    it('should throw error when running on other os', () => {
      const platform = 'helloworld';
      platformMock.value(platform);
      const badFunc = () => { ServiceFactory.getService({}); };
      expect(badFunc).to.throw(`Currently there is no Huddly Service support for platform ${platform}`);
    });
  });
});
