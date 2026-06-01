const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "../../logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const formatDate = () => {
  return new Date().toISOString();
};

const formatLog = (level, message, data = null) => {
  return JSON.stringify({
    timestamp: formatDate(),
    level,
    message,
    ...(data && { data }),
  });
};

const writeLog = (logMessage) => {
  const filePath = path.join(
    logsDir,
    `app-${new Date().toISOString().split("T")[0]}.log`
  );

  fs.promises.appendFile(filePath, logMessage + "\n").catch((error) => {
    console.error("Failed to write log file:", error.message);
  });
};

const logger = {
  info: (message, data) => {
    const logMessage = formatLog("INFO", message, data);
    console.log(logMessage);
    writeLog(logMessage);
  },

  error: (message, error) => {
    const logMessage = formatLog("ERROR", message, {
      errorMessage: error?.message,
      stack: error?.stack,
    });
    console.error(logMessage);
    writeLog(logMessage);
  },

  warn: (message, data) => {
    const logMessage = formatLog("WARN", message, data);
    console.warn(logMessage);
    writeLog(logMessage);
  },

  debug: (message, data) => {
    if (process.env.NODE_ENV === "development") {
      const logMessage = formatLog("DEBUG", message, data);
      console.log(logMessage);
    }
  },
};

module.exports = logger;
