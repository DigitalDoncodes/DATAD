const { format } = require('date-fns');
const { v4: uuidv4 } = require('uuid');

/**
 * Simple logger that outputs JSON formatted logs for easy parsing.
 * In production, this could be replaced with a proper logging library like winston or pino.
 */
const log = (level, message, meta = {}) => {
  const logObject = {
    timestamp: new Date().toISOString(),
    level,
    message,
    id: uuidv4(),
    ...meta
  };
  console.log(JSON.stringify(logObject));
};

module.exports = {
  info: (message, meta = {}) => log('info', message, meta),
  warn: (message, meta = {}) => log('warn', message, meta),
  error: (message, meta = {}) => log('error', message, meta),
  debug: (message, meta = {}) => log('debug', message, meta)
};