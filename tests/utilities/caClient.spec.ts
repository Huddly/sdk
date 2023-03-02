import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import CaClient from './../../src/utilitis/caClient';

chai.should();
chai.use(sinonChai);

describe('CaClient', () => {
  const optionCert = { format: 'PEM', option: 'speakerframing', data: 'data' };
  const optionCerts = [optionCert, optionCert];
  const testError = new Error('There was an issue');
  let caClient: CaClient;
  beforeEach(() => {
    caClient = new CaClient();
  });
  describe('createCaClientRequestUrl', () => {
    it('should return a valid ca request url', () => {
      const serialNumber = 'serial123';
      const hostUrl = 'host.com';
      const expectedRequestUrl = `${hostUrl}/certificates/options?serialNumber=${serialNumber}`;
      const requestUrl = caClient._createCaClientRequestUrl(hostUrl, serialNumber);
      expect(expectedRequestUrl).to.equal(requestUrl);
    });
  });
  describe('getOptionCertificates', () => {
    let _requestOptionCertificatesFromServiceStub;
    let _constructValidOptionCertificateResult;
    beforeEach(() => {
      _requestOptionCertificatesFromServiceStub = sinon.stub(
        caClient,
        '_requestOptionCertificatesFromService'
      );
    });
    afterEach(() => {
      _requestOptionCertificatesFromServiceStub.restore();
    });
    it('should return a list of on or more valid option certificates', async () => {
      _requestOptionCertificatesFromServiceStub.resolves(optionCerts);
      expect((await caClient.getOptionCertificates('test')).optionCertificates).to.deep.equal(
        optionCerts
      );
    });

    describe('if both hosts has an error', () => {
      beforeEach(() => {
        _constructValidOptionCertificateResult = sinon.stub(
          caClient,
          '_constructValidOptionCertificateResult'
        );
      });
      afterEach(() => {
        _constructValidOptionCertificateResult.restore();
      });
      it('should return a result with an error when getting the options certificate fails', async () => {
        _requestOptionCertificatesFromServiceStub.rejects(testError);
        expect((await caClient.getOptionCertificates('test')).error).to.not.equal(undefined);
      });
      it('should return a result with an error when validation fails', async () => {
        _constructValidOptionCertificateResult.throws(testError);
        expect((await caClient.getOptionCertificates('test')).error).to.not.equal(undefined);
      });
    });
    describe('if there is an issue with only one host', () => {
      it('it should return a result with option certificates and without an error', async () => {
        _requestOptionCertificatesFromServiceStub.onCall(0).rejects(testError);
        _requestOptionCertificatesFromServiceStub.onCall(1).resolves(optionCerts);

        const result = await caClient.getOptionCertificates('test');
        expect(result.error).to.equal(undefined);
        expect(result.optionCertificates).to.deep.equal(optionCerts);
      });
    });
  });
  describe('_constructValidOptionCertificateResult', () => {
    describe('top level response is not a list', () => {
      it('should throw an error', () => {
        expect(
          caClient._constructValidOptionCertificateResult.bind(caClient, optionCert)
        ).to.throw();
      });
    });
    describe('one or more option certificate is not formatted correctly', () => {
      it('lacks a format attribute', () => {
        const cert = { formats: 'PEM', option: 'speakerframing', data: 'data' };
        expect(caClient._constructValidOptionCertificateResult.bind(caClient, [cert])).to.throw();
      });
      it('lacks a option attribute', () => {
        const cert = { formats: 'PEM', options: 'speakerframing', data: 'data' };
        expect(caClient._constructValidOptionCertificateResult.bind(caClient, [cert])).to.throw();
      });
      it('lacks a data attribute', () => {
        const cert = { formats: 'PEM', option: 'speakerframing', datas: 'data' };
        expect(caClient._constructValidOptionCertificateResult.bind(caClient, [cert])).to.throw();
      });
    });
    describe('correctly formatted response from the server', () => {
      it('should return a list with correctly formatted option certificates result', () => {
        expect(caClient._constructValidOptionCertificateResult(optionCerts)).to.deep.equal({
          optionCertificates: optionCerts,
        });
      });
    });
  });
});
