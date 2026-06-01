const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  token,
  logout,
} = require("../controllers/authController");
const {
  validateSignup,
  validateLogin,
} = require("../middleware/validationMiddleware");

router.post("/signup", validateSignup, signup);
router.post("/login", validateLogin, login);
router.post("/token", token);
router.post("/logout", logout);

module.exports = router;
