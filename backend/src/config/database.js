const { MongoClient } = require("mongodb");

let mongoConnection = null;

const initializeDatabase = async () => {
  if (mongoConnection) return mongoConnection;

  mongoConnection = new MongoClient(process.env.CONNECTION_STRING_MONGO);
  await mongoConnection.connect();
  console.log("Database connected successfully");

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
    console.log("Database connection closed");
  }
};

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
};
