const pino = require("pino");
const env = require("../env");
const path = require("path");
const fs = require("fs");
const httpContext = require('express-http-context');

const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      options: { destination: path.join(logsDir, 'app.log') },
      level: 'info',
    },
    {
      target: 'pino/file',
      options: { destination: path.join(logsDir, 'error.log') },
      level: 'error',
    },
    ...(env.NODE_ENV !== 'production' ? [{
      target: 'pino-pretty',
      options: { colorize: true }
    }] : [])
  ]
});

const logger = pino({
  level: env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  base: {
    pid: process.pid,
    hostname: require('os').hostname()
  }
}, transport);

class Logger {
  constructor() {
    this.pino = logger;
  }

  // Helper to extract correlation_id from data or context
  formatArgs(message, data = {}) {
    const { correlation_id, ...rest } = data;
    const contextId = httpContext.get('correlation_id');
    const finalId = correlation_id || contextId;
    const baseObj = finalId ? { correlation_id: finalId, ...rest } : { ...rest };
    return [baseObj, message];
  }

  error(message, data = {}) {
    this.pino.error(...this.formatArgs(message, data));
  }

  warn(message, data = {}) {
    this.pino.warn(...this.formatArgs(message, data));
  }

  info(message, data = {}) {
    this.pino.info(...this.formatArgs(message, data));
  }

  debug(message, data = {}) {
    this.pino.debug(...this.formatArgs(message, data));
  }

  trace(message, data = {}) {
    this.pino.trace(...this.formatArgs(message, data));
  }
}

module.exports = new Logger();
