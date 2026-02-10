const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/database");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/tokenUtils");
const { COLLECTIONS, DB_NAMES } = require("../utils/constants");

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please enter all details" });
    }

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return res
      .status(201)
      .json({ message: "User created successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const tokensCollection = db.collection(COLLECTIONS.REFRESH_TOKENS);

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userData = { id: user._id };
    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await tokensCollection.insertOne({
      token: refreshToken,
      userId: user._id,
      createdAt: new Date(),
    });

    tokensCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 });

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const token = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token not provided" });
    }

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const tokensCollection = db.collection(COLLECTIONS.REFRESH_TOKENS);

    const tokenExists = await tokensCollection.findOne({ token: refreshToken });
    if (!tokenExists) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const jwt = require("jsonwebtoken");
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Token verification failed" });
      }

      const accessToken = generateAccessToken({ id: user.id });
      return res.status(200).json({ accessToken });
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const logout = async (req, res) => {
  try {
    const { token: refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const tokensCollection = db.collection(COLLECTIONS.REFRESH_TOKENS);

    await tokensCollection.deleteOne({ token: refreshToken });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  signup,
  login,
  token,
  logout,
};
