const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { validateAllergens } = require("../middleware/validationMiddleware");
const {
  getUserInfo,
  updateAllergens,
} = require("../controllers/userController");

router.get("/info", authenticateToken, getUserInfo);
router.post("/update_allergens", authenticateToken, validateAllergens, updateAllergens);

module.exports = router;
