import chai, { expect } from 'chai';
import UpgradeStatus, { UpgradeStatusStep } from './../../../src/components/upgrader/upgradeStatus';

chai.should();

describe('UpgradeStatus', () => {
  it('should not return complete first step is not done', () => {
    const step = new UpgradeStatusStep('foo');
    const status = new UpgradeStatus([step]);
    const res = status.getStatus();
    expect(res.progress).to.not.equal(100.0);
  });

  it('should return progress 100 when step is completed', () => {
    const step = new UpgradeStatusStep('foo');
    const status = new UpgradeStatus([step]);
    step.progress = 100;
    const res = status.getStatus();
    expect(res.progress).to.equal(100);
  });

  it('should return progress for two steps', () => {
    const step1 = new UpgradeStatusStep('foo');
    const step2 = new UpgradeStatusStep('bar');
    const status = new UpgradeStatus([step1, step2]);
    expect(status.getStatus().progress).to.equal(0);
    step1.progress = 100;
    expect(status.getStatus().progress).to.equal(50);
    step2.progress = 50;
    expect(status.getStatus().progress).to.equal(75);
    step2.progress = 100;
    expect(status.getStatus().progress).to.equal(100);
  });

  it('should allow weighting steps', () => {
    const step1 = new UpgradeStatusStep('foo');
    const weighted = new UpgradeStatusStep('bar', 4);
    const status = new UpgradeStatus([step1, weighted]);
    expect(status.getStatus().progress).to.equal(0);
    step1.progress = 100;
    expect(status.getStatus().progress).to.equal(20);
    weighted.progress = 50;
    expect(status.getStatus().progress).to.equal(60);
    weighted.progress = 75;
    expect(status.getStatus().progress).to.equal(80);
    weighted.progress = 100;
    expect(status.getStatus().progress).to.equal(100);
  });
});