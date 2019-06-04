const HuddlyService = require('./lib/huddlyService.js');
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({ filename: 'huddly.log' })
  ]
});
const service = new HuddlyService(logger);

service.start();