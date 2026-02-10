const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { authenticateToken } = require("../middleware/authMiddleware");
const { analyzeIngredientImage } = require("../controllers/imageController");

// Image upload and OCR endpoint
router.post(
  "/analyze-ingredients",
  authenticateToken,
  upload.single("image"),
  analyzeIngredientImage
);

module.exports = router;
