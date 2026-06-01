const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/database");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/tokenUtils");
const { COLLECTIONS, DB_NAMES } = require("../utils/constants");
const logger = require("../utils/logger");

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const signup = async (name, email, password) => {
  const db = getDatabase(DB_NAMES.ALLERGENIC);
  const usersCollection = db.collection(COLLECTIONS.USERS);

  const existingUser = await usersCollection.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await usersCollection.insertOne({
    name,
    email,
    password: hashedPassword,
    allergens: [],
    createdAt: new Date(),
  });

  logger.info("User created successfully", { userId: result.insertedId });
  return { id: result.insertedId, email, name };
};

const login = async (email, password) => {
  const db = getDatabase(DB_NAMES.ALLERGENIC);
  const usersCollection = db.collection(COLLECTIONS.USERS);
  const tokensCollection = db.collection(COLLECTIONS.REFRESH_TOKENS);

  const user = await usersCollection.findOne({ email });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error("Invalid credentials");
  }

  const userData = { id: user._id.toString() };
  const accessToken = generateAccessToken(userData);
  const refreshToken = generateRefreshToken(userData);
  const tokenHash = hashToken(refreshToken);

  await tokensCollection.insertOne({
    tokenHash,
    userId: user._id,
    createdAt: new Date(),
  });

  logger.info("User logged in", { userId: user._id });
  return { accessToken, refreshToken, user: { id: user._id, email: user.email, name: user.name } };
};

const refreshAccessToken = async (refreshToken) => {
  const db = getDatabase(DB_NAMES.ALLERGENIC);
  const tokensCollection = db.collection(COLLECTIONS.REFRESH_TOKENS);
  const tokenHash = hashToken(refreshToken);

  const tokenExists = await tokensCollection.findOne({ tokenHash });
  if (!tokenExists) {
    throw new Error("Invalid refresh token");
  }

  const user = verifyRefreshToken(refreshToken);
  if (!user) {
    throw new Error("Token verification failed");
  }

  const userData = { id: user.id };
  const accessToken = generateAccessToken(userData);
  const newRefreshToken = generateRefreshToken(userData);
  const newTokenHash = hashToken(newRefreshToken);

  await tokensCollection.updateOne(
    { tokenHash },
    {
      $set: {
        tokenHash: newTokenHash,
        userId: new ObjectId(user.id),
        createdAt: new Date(),
      },
    }
  );

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (refreshToken) => {
  const db = getDatabase(DB_NAMES.ALLERGENIC);
  const tokensCollection = db.collection(COLLECTIONS.REFRESH_TOKENS);

  await tokensCollection.deleteOne({ tokenHash: hashToken(refreshToken) });
  logger.info("User logged out successfully");
};

module.exports = {
  signup,
  login,
  refreshAccessToken,
  logout,
};
