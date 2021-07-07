import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

import ITransport from './../../../src/interfaces/iTransport';
import HuddlyGo from './../../../src/components/device/huddlygo';
import Logger from './../../../src/utilitis/logger';
import { EventEmitter } from 'events';

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

describe('HuddlyGO', () => {
  let device: HuddlyGo;
  beforeEach(() => {
    device = new HuddlyGo(
      {},
      sinon.createStubInstance(DummyTransport),
      {},
      {},
      new EventEmitter(),
    );

    // tslint:disable-next-line:no-null-keyword
    sinon.stub(device, 'getXUControl').withArgs(19).resolves(null);
  });

  describe('#getDiagnostics', () => {
    it('should give you current diagonstics info', async () => {
      await device.initialize();
      sinon.stub(device, 'getPowerUsage').resolves({
        voltage:
          { min: 5.136000156402588,
            curr: 5.136000156402588,
            max: 5.144000053405762,
            avg: 5.140143871307373 },
         current:
          { min: 0.2849999964237213,
            curr: 0.28999999165534973,
            max: 0.3230000138282776,
            avg: 0.3018396198749542 },
         power:
          { min: 1.472000002861023,
            curr: 1.5139999389648438,
            max: 1.565999984741211,
            avg: 1.505385160446167 }
      });

      const diagnostics = await device.getDiagnostics();
      const currentInfo = diagnostics.find(d => d.type === 'Current');

      expect(currentInfo.message).to.be.equal('Current Ok');
    });

    it('should give you current is too heigh it should report it', async () => {
      await device.initialize();
      sinon.stub(device, 'getPowerUsage').resolves({
        voltage:
          { min: 5.136000156402588,
            curr: 5.136000156402588,
            max: 5.144000053405762,
            avg: 5.140143871307373 },
         current:
          { min: 0.2849999964237213,
            curr: 0.99,
            max: 0.99,
            avg: 0.3018396198749542 },
         power:
          { min: 1.472000002861023,
            curr: 1.5139999389648438,
            max: 1.565999984741211,
            avg: 1.505385160446167 }
      });

      const diagnostics = await device.getDiagnostics();
      const currentInfo = diagnostics.find(d => d.type === 'Current');

      expect(currentInfo.message).to.include('Current high');
    });

    it('should give you volgate diagonstics info', async () => {
      await device.initialize();
      sinon.stub(device, 'getPowerUsage').resolves({
        voltage:
          { min: 5.136000156402588,
            curr: 5.136000156402588,
            max: 5.144000053405762,
            avg: 5.140143871307373 },
         current:
          { min: 0.2849999964237213,
            curr: 0.28999999165534973,
            max: 0.3230000138282776,
            avg: 0.3018396198749542 },
         power:
          { min: 1.472000002861023,
            curr: 1.5139999389648438,
            max: 1.565999984741211,
            avg: 1.505385160446167 }
      });

      const diagnostics = await device.getDiagnostics();
      const currentInfo = diagnostics.find(d => d.type === 'Voltage');

      expect(currentInfo.message).to.be.equal('Voltage Ok');
    });

    it('should give you voltage is too heigh it should report it', async () => {
      await device.initialize();
      sinon.stub(device, 'getPowerUsage').resolves({
        voltage:
          { min: 5.136000156402588,
            curr: 5.136000156402588,
            max: 6.144000053405762,
            avg: 5.140143871307373 },
         current:
          { min: 0.2849999964237213,
            curr: 0.99,
            max: 0.99,
            avg: 0.3018396198749542 },
         power:
          { min: 1.472000002861023,
            curr: 1.5139999389648438,
            max: 1.565999984741211,
            avg: 1.505385160446167 }
      });

      const diagnostics = await device.getDiagnostics();
      const currentInfo = diagnostics.find(d => d.type === 'Voltage');

      expect(currentInfo.message).to.include('Voltage high');
    });
  });
});
