const fs = require("fs");
const path = require("path");
const env = require("../env");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
  TRACE: "TRACE",
};

const LOG_LEVEL_PRIORITY = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

class Logger {
  constructor(level = env.LOG_LEVEL) {
    this.level = level.toUpperCase();
    this.minLevel = LOG_LEVEL_PRIORITY[this.level] ?? LOG_LEVEL_PRIORITY.INFO;
  }

  /**
   * Format log message with timestamp and context
   */
  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      message,
      ...data,
    };
  }

  /**
   * Write log to console and file
   */
  writeLog(level, message, data = {}) {
    if (LOG_LEVEL_PRIORITY[level] > this.minLevel) {
      return;
    }

    const logEntry = this.formatMessage(level, message, data);
    const logString = JSON.stringify(logEntry);

    // Console output
    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(`[${logEntry.timestamp}] ❌ ${message}`, data);
        break;
      case LOG_LEVELS.WARN:
        console.warn(`[${logEntry.timestamp}] ⚠️  ${message}`, data);
        break;
      case LOG_LEVELS.INFO:
        console.log(`[${logEntry.timestamp}] ℹ️  ${message}`, data);
        break;
      case LOG_LEVELS.DEBUG:
        console.log(`[${logEntry.timestamp}] 🐛 ${message}`, data);
        break;
      case LOG_LEVELS.TRACE:
        console.trace(`[${logEntry.timestamp}] 📍 ${message}`, data);
        break;
    }

    // File output
    if (env.NODE_ENV === "production" || level === LOG_LEVELS.ERROR) {
      const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
      fs.appendFileSync(logFile, logString + "\n", { flag: "a" });
    }
  }

  error(message, data = {}) {
    this.writeLog(LOG_LEVELS.ERROR, message, data);
  }

  warn(message, data = {}) {
    this.writeLog(LOG_LEVELS.WARN, message, data);
  }

  info(message, data = {}) {
    this.writeLog(LOG_LEVELS.INFO, message, data);
  }

  debug(message, data = {}) {
    this.writeLog(LOG_LEVELS.DEBUG, message, data);
  }

  trace(message, data = {}) {
    this.writeLog(LOG_LEVELS.TRACE, message, data);
  }
}

module.exports = new Logger();
