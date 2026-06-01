const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { authenticateToken } = require("../middleware/authMiddleware");
const { validateIngredientConfirmation } = require("../middleware/validationMiddleware");
const { analyzeIngredientImage, confirmIngredientAnalysis } = require("../controllers/imageController");

const imageAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many image analysis requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Image upload and OCR endpoint (Step 1)
router.post(
  "/analyze-ingredients",
  authenticateToken,
  imageAnalysisLimiter,
  upload.single("image"),
  analyzeIngredientImage
);

// Confirm and save analysis endpoint (Step 2)
router.post(
  "/confirm-ingredients",
  authenticateToken,
  validateIngredientConfirmation,
  confirmIngredientAnalysis
);

module.exports = router;
