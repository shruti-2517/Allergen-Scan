const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { authenticateToken } = require("../middleware/authMiddleware");
const { analyzeIngredientImage, confirmIngredientAnalysis } = require("../controllers/imageController");

// Image upload and OCR endpoint (Step 1)
router.post(
  "/analyze-ingredients",
  authenticateToken,
  upload.single("image"),
  analyzeIngredientImage
);

// Confirm and save analysis endpoint (Step 2)
router.post(
  "/confirm-ingredients",
  authenticateToken,
  confirmIngredientAnalysis
);

module.exports = router;
