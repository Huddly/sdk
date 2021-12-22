import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import DiagnosticsMessage, { DiagnosticsLevel } from '@huddly/sdk-interfaces/lib/abstract_classes/DiagnosticsMessage';
import { MinMaxDiagnosticsMessage } from './../../src/components/diagnosticsMessageData';


chai.should();
chai.use(sinonChai);

describe('DiagnosticsMessage', () => {
  describe('base class', () => {
    it('should expose type as getter', () => {
      class Foo extends DiagnosticsMessage { }
      const myFoo = new Foo('bar');
      expect(myFoo.type).to.equal('bar');
    });
  });
  describe('MinMaxDiagnosticsMessage', () => {
    it('should have level info when value is within limits', () => {
      const minT = 1.0;
      const maxT = 2.0;
      const min = 1.4, max = 1.6, curr = 1.5;
      const dm = new MinMaxDiagnosticsMessage('foo', minT, maxT, min, max, curr);
      expect(dm.level).to.equal(DiagnosticsLevel.INFO);
      expect(dm.message).to.equal('foo Ok');
    });

    it('should have level Error when min is below treshold', () => {
      const minT = 4.6;
      const maxT = 5.0;
      const min = 4.59, max = 5.0, curr = 5.0;
      const dm = new MinMaxDiagnosticsMessage('foo', minT, maxT, min, max, curr);
      expect(dm.level).to.equal(DiagnosticsLevel.ERROR);
      expect(dm.message).to.contain('foo low');
    });

    it('should have level Error when max is above treshold', () => {
      const minT = 4.6;
      const maxT = 5.0;
      const min = 4.69, max = 5.01, curr = 5.0;
      const dm = new MinMaxDiagnosticsMessage('foo', minT, maxT, min, max, curr);
      expect(dm.level).to.equal(DiagnosticsLevel.ERROR);
      expect(dm.message).to.contain('foo high');
    });

    it('should include tip when provided', () => {
      const minT = 4.6;
      const maxT = 5.0;
      const min = 4.69, max = 5.01, curr = 5.0;
      const tip = 'tip';
      const dm = new MinMaxDiagnosticsMessage('foo', minT, maxT, min, max, curr, undefined, tip);
      expect(dm.tip).to.equal(tip);
    });

    it('should include max tip when provided', () => {
      const minT = 0, maxT = 1, min = 1, max = 1.01, curr = 1.0;
      const maxTip = 'tip';
      const dm = new MinMaxDiagnosticsMessage('foo', minT, maxT, min, max, curr, undefined, maxTip);
      expect(dm.tip).to.equal(maxTip);
    });

    it('should include max tip when provided', () => {
      const minT = 1, maxT = 1, min = 0, max = 1, curr = 1.0;
      const minTip = 'tip';
      const dm = new MinMaxDiagnosticsMessage('foo', minT, maxT, min, max, curr, minTip, undefined);
      expect(dm.tip).to.equal(minTip);
    });
  });
});
