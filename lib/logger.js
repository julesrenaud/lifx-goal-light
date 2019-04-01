const Winston = require('winston');
const { format } = require('logform');

const logger = Winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.align(),
    format.printf(info => `${info.timestamp}: ${info.message}`)
  ),
  transports: [
    new Winston.transports.File({ filename: path.join(__dirname, '../logs/errors.log'), level: 'error', options: { flags: 'w' }}),
    new Winston.transports.File({ filename: path.join(__dirname, '../logs/events.log'), options: { flags: 'w' }})
  ]
});

module.exports = logger;