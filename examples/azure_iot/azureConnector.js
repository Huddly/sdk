const azureIotDevice = require('azure-iot-device');
const azureIotDeviceConnection = require('azure-iot-device-amqp');
const Message = azureIotDevice.Message;


exports.default = class AzureConnector {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.client = azureIotDeviceConnection.clientFromConnectionString(this.connectionString);
  }

  async init() {
    await this.client.open();
    console.log('Azure connection established');
  }

  async sendEvent(eventJson) {
    console.log('Sending event to Azure');
    const m = new Message(JSON.stringify(eventJson));
    await this.client.sendEvent(m);
  }
}
