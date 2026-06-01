const logger = require("../utils/logger");
const { COLLECTIONS } = require("../utils/constants");

const createIndexes = async (db) => {
  try {
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const productsCollection = db.collection(COLLECTIONS.FOOD_PRODUCTS);
    const tokensCollection = db.collection(COLLECTIONS.REFRESH_TOKENS);
    const analysisCollection = db.collection(COLLECTIONS.INGREDIENT_ANALYSES);

    await usersCollection.createIndex({ email: 1 }, { unique: true });
    logger.info("Created index on USERS.email");

    await productsCollection.createIndex({ for_user: 1, timestamp: -1 });
    logger.info("Created index on FOOD PRODUCTS.for_user and timestamp");

    await productsCollection.createIndex({ product_barcode: 1, for_user: 1 });
    logger.info(
      "Created index on FOOD PRODUCTS.product_barcode and for_user"
    );

    await tokensCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 604800 }
    );
    logger.info("Created TTL index on REFRESH TOKENS.createdAt");

    await tokensCollection.createIndex({ userId: 1 });
    logger.info("Created index on REFRESH TOKENS.userId");

    await tokensCollection.createIndex(
      { tokenHash: 1 },
      { unique: true, partialFilterExpression: { tokenHash: { $exists: true } } }
    );
    logger.info("Created unique index on REFRESH TOKENS.tokenHash");

    await analysisCollection.createIndex({ for_user: 1, timestamp: -1 });
    logger.info("Created index on INGREDIENT_ANALYSES.for_user and timestamp");

    logger.info("All database indexes created successfully");
  } catch (error) {
    logger.warn("Error creating indexes", error);
  }
};

module.exports = {
  createIndexes,
};
