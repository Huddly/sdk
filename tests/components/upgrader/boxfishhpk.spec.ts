import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import fs from 'fs';
import path from 'path';

import { IMAGE_TYPES } from '@huddly/sdk-interfaces/lib/interfaces/IBoxfishUpgraderFile';

import BoxfishHpk from './../../../src/components/upgrader/boxfishhpk';

chai.should();
chai.use(sinonChai);

describe('BoxfishHpk', () => {
  const validBuffer = fs.readFileSync(path.resolve(__dirname, '../../testData/dummy.pkg'));
  const invalidHeaderBuffer = fs.readFileSync(path.resolve(__dirname, '../../testData/invalidDummy.pkg'));

  describe('#init', () => {

    it('should throw error if can not find hpk marker', () => {
      const upgrader = new BoxfishHpk(new Buffer(''));
      expect(upgrader.init).to.throw(Error);
    });

    it('should get and parse header', () => {
      const upgrader = new BoxfishHpk(validBuffer);
      upgrader.init();
      expect(upgrader.header).to.be.an('object');
    });

    it('should throw if there is no valid file data', () => {
      const upgrader = new BoxfishHpk(invalidHeaderBuffer);
      expect(upgrader.init).to.throw(Error);
    });
  });

  describe('#getData', () => {
    let upgrader;
    beforeEach(() => {
      upgrader = new BoxfishHpk(validBuffer);
      upgrader.init();
    });

    it('should get APP buffer from hpk', () => {
      expect(upgrader.getData(IMAGE_TYPES.APP)).to.have.length(1636240);
    });

    it('should get APP_HEADER buffer from hpk', () => {
      expect(upgrader.getData(IMAGE_TYPES.APP_HEADER)).to.have.length(20);
    });

    it('should get SSBL buffer from hpk', () => {
      expect(upgrader.getData(IMAGE_TYPES.SSBL)).to.have.length(205344);
    });
  });

  describe('#isHpk', () => {
    it('should return true if buffer contains marker', () => {
      expect(BoxfishHpk.isHpk(validBuffer)).to.equal(true);
    });

    it('should return false if buffer does not contains marker', () => {
      expect(BoxfishHpk.isHpk(new Buffer(''))).to.equal(false);
    });
  });
});
