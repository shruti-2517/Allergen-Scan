const logger = require("./logger");

const REQUIRED_ENV_VARS = [
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "CONNECTION_STRING_MONGO",
  "GEMINI_API_KEY",
  "NODE_ENV",
];

const validateEnvironment = () => {
  const missingVars = REQUIRED_ENV_VARS.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    logger.error(
      "Missing required environment variables",
      missingVars
    );
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  // Validate environment variable formats
  if (!process.env.ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET.length < 32) {
    throw new Error("ACCESS_TOKEN_SECRET must be at least 32 characters");
  }

  if (!process.env.REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET.length < 32) {
    throw new Error("REFRESH_TOKEN_SECRET must be at least 32 characters");
  }

  if (
    !process.env.CONNECTION_STRING_MONGO.startsWith("mongodb://") &&
    !process.env.CONNECTION_STRING_MONGO.startsWith("mongodb+srv://")
  ) {
    throw new Error("Invalid MongoDB connection string format");
  }

  logger.info("Environment variables validated successfully");
};

module.exports = {
  validateEnvironment,
};
