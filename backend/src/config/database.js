const { MongoClient } = require("mongodb");
const { createIndexes } = require("./indexes");
const logger = require("../utils/logger");

let mongoConnection = null;

const initializeDatabase = async () => {
  if (mongoConnection) return mongoConnection;

  mongoConnection = new MongoClient(process.env.CONNECTION_STRING_MONGO);
  await mongoConnection.connect();
  logger.info("Database connected successfully");

  const db = mongoConnection.db("ALLERGENIC");
  await createIndexes(db);

  return mongoConnection;
};

const getDatabase = (dbName = "ALLERGENIC") => {
  if (!mongoConnection) {
    throw new Error("Database connection not initialized. Call initializeDatabase first.");
  }
  return mongoConnection.db(dbName);
};

const closeDatabase = async () => {
  if (mongoConnection) {
    await mongoConnection.close();
    mongoConnection = null;
    logger.info("Database connection closed");
  }
};

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
};
