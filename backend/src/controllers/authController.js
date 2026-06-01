const authService = require("../services/authService");
const logger = require("../utils/logger");

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await authService.signup(name, email, password);
    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    logger.error("Signup error", error);
    if (error.message === "User already exists") {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);
    
    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

    res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    logger.error("Login error", error);
    res.status(401).json({ error: "Invalid credentials" });
  }
};

const token = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token not provided" });
    }

    const result = await authService.refreshAccessToken(refreshToken);
    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);
    res.status(200).json({ accessToken: result.accessToken });
  } catch (error) {
    logger.error("Token refresh error", error);
    res.status(403).json({ error: "Invalid or expired refresh token" });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ error: "No active session" });
    }

    await authService.logout(refreshToken);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout error", error);
    res.status(500).json({ error: "Failed to logout" });
  }
};

module.exports = {
  signup,
  login,
  token,
  logout,
};
