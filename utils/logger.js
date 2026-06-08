const fs = require("fs");
const path = require("path");
const env = require("../env");

const logsDir = path.join(__dirname, "../logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const priorities = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

class Logger {
  constructor(level = env.LOG_LEVEL) {
    this.level = String(level || "info").toLowerCase();
    this.minPriority = priorities[this.level] ?? priorities.info;
  }

  shouldWrite(level) {
    return priorities[level] <= this.minPriority;
  }

  format(level, message, data = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data,
    };
  }

  write(level, message, data = {}) {
    if (!this.shouldWrite(level)) {
      return;
    }

    const entry = this.format(level, message, data);
    const line = JSON.stringify(entry);

    if (level === "error") {
      console.error(`[${entry.timestamp}] ERROR ${message}`, data);
    } else if (level === "warn") {
      console.warn(`[${entry.timestamp}] WARN ${message}`, data);
    } else {
      console.log(`[${entry.timestamp}] ${level.toUpperCase()} ${message}`, data);
    }

    if (env.NODE_ENV === "production" || level === "error") {
      fs.appendFileSync(path.join(logsDir, `${level}.log`), `${line}\n`, {
        flag: "a",
      });
    }
  }

  error(message, data = {}) {
    this.write("error", message, data);
  }

  warn(message, data = {}) {
    this.write("warn", message, data);
  }

  info(message, data = {}) {
    this.write("info", message, data);
  }

  debug(message, data = {}) {
    this.write("debug", message, data);
  }

  trace(message, data = {}) {
    this.write("trace", message, data);
  }
}

module.exports = new Logger();
