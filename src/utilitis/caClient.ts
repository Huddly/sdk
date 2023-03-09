import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';
import ICaClient, {
  OptionCertificate,
  isOptionCertificate,
} from '@huddly/sdk-interfaces/lib/interfaces/ICaClient';
import https from 'https';

const PRIMARY_CA_HOST_URL = 'https://public-ca.huddly.com';

// In cases of strict firewall policies we might be able to use an azure domain instead
const SECONDARY_CA_HOST_URL =
  'https://hmc-app-public-api-certificateauthority-prod-we.azurewebsites.net';

class CaClient implements ICaClient {
  /**
   * Gets any option certificates that exists on the CA server for a given camera
   *  *
   * @param serialNumber serial number of the camera to request option certificates for
   * @returns {Promise<OptionCertificate[]>} A list of option certificates for the given camera
   */
  async getOptionCertificates(serialNumber: string): Promise<OptionCertificate[]> {
    const errors: string[] = [];
    for (const hostUrl of [PRIMARY_CA_HOST_URL, SECONDARY_CA_HOST_URL]) {
      const requestUrl = this._createCaClientRequestUrl(hostUrl, serialNumber);
      Logger.info(`Requesting option certificates with ${requestUrl}`, CaClient.name);
      try {
        const serverReponse = await this._requestOptionCertificatesFromService(requestUrl);
        const optionCertificatesResult = this._constructValidOptionCertificate(serverReponse);
        return optionCertificatesResult;
      } catch (error) {
        Logger.warn(
          `Encountered error trying to get option certificates from ${hostUrl}: ${
            error.message || error
          }`,
          CaClient.name
        );
      }
    }
    Logger.warn(errors.toString());
    throw new Error('There was an issue communicating with the CA Servers.');
  }

  _constructValidOptionCertificate(serverReponse: any): OptionCertificate[] {
    if (!Array.isArray(serverReponse)) {
      const errorText = `Expected to get a list from option certificate server. Got: ${serverReponse.toString()}`;
      Logger.warn(errorText, CaClient.name);
      throw Error(errorText);
    }

    const optionCertificates: OptionCertificate[] = serverReponse.map(
      (serverOptionCert): OptionCertificate => {
        if (!isOptionCertificate(serverOptionCert)) {
          const errorText = `Expected option certificate from server to contain attributes 'format', 'option' and 'data', but got ${Object.keys(
            serverOptionCert
          ).toString()}`;
          Logger.warn(errorText, CaClient.name);
          throw Error(errorText);
        }

        return {
          format: serverOptionCert.format,
          data: serverOptionCert.data,
          option: serverOptionCert.option,
        };
      }
    );

    return optionCertificates;
  }

  _createCaClientRequestUrl(hostUrl: string, serialNumber: string): string {
    return `${hostUrl}/certificates/options?serialNumber=${serialNumber}`;
  }

  async _requestOptionCertificatesFromService(requestUrl: string): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      const responseCallack = (response) => {
        const data: Buffer[] = [];

        response.on('data', (chunk: Buffer) => {
          data.push(chunk);
        });

        response.on('end', () => {
          const parsedData = JSON.parse(Buffer.concat(data).toString());
          resolve(parsedData);
        });

        response.on('error', reject);
      };
      const request = https.request(requestUrl, responseCallack);
      request.on('error', reject);
      request.end();
    });
  }
}
export default CaClient;
