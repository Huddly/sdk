const crypto = require('crypto');
const AzureIotDevice = require('azure-iot-device');
const IotHubTransport = require('azure-iot-device-amqp').Amqp;
const IoTProvisioningTransport = require('azure-iot-provisioning-device-amqp').Amqp;
const ProvisioningServiceClient = require('azure-iot-provisioning-device').ProvisioningDeviceClient;
const SymmetricKeySecurityClient = require('azure-iot-security-symmetric-key').SymmetricKeySecurityClient;

const Message = AzureIotDevice.Message;
const Client = AzureIotDevice.Client;

const provisioningHost = 'global.azure-devices-provisioning.net';
const idScope = process.env.PROVISIONING_ID_SCOPE;
const provisioningKey = process.env.PROVISIONING_SYMMETRIC_KEY;

class AzureConnector {

  constructor(deviceId) {
    this.deviceId = deviceId;
  }
  
  computeDerivedSymmetricKey(masterKey, regId) {
    return crypto.createHmac('SHA256', Buffer.from(masterKey, 'base64'))
      .update(regId, 'utf8')
      .digest('base64');
  }

  async init() {
    if (!idScope || !provisioningKey) {
      throw new Error(`ID_SCOPE or PROVISIONING_SYMMETRIC_KEY not set`);
    }
    const symmetricKey = this.computeDerivedSymmetricKey(provisioningKey, this.deviceId);
    const securityClient = new SymmetricKeySecurityClient(this.deviceId, symmetricKey);

    const provisioningClient = ProvisioningServiceClient.create(provisioningHost, idScope, new IoTProvisioningTransport(), securityClient);
    const response = await provisioningClient.register();
    const azureIoTHubConnectionString = 'HostName=' + response.assignedHub +
      ';DeviceId=' + response.deviceId +
      ';SharedAccessKey=' + symmetricKey;
    this.azureClient = Client.fromConnectionString(azureIoTHubConnectionString, IotHubTransport);
    await this.azureClient.open();
  }

  async sendEvent(event) {
    const m = new Message(JSON.stringify(event));
    await this.azureClient.sendEvent(m);
  }
}

module.exports = AzureConnector;
