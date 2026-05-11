const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  addProduct,
  getProductInfo,
  getRecentProducts,
  getProductHistory,
  getAlternatives,
  getAlternativeDetail,
  getDashboardStats,
} = require("../controllers/productController");
const { generateRecipe } = require("../controllers/recipeController");

router.get("/add/:barcode", authenticateToken, addProduct);
router.get("/info/:barcode", authenticateToken, getProductInfo);
router.get("/recents", authenticateToken, getRecentProducts);
router.get("/history", authenticateToken, getProductHistory);
router.get("/alternatives/:barcode", authenticateToken, getAlternatives);
router.get("/alternative-detail/:barcode", authenticateToken, getAlternativeDetail);
router.get("/dashboard/stats", authenticateToken, getDashboardStats);
router.get("/generate-recipe/:barcode", authenticateToken, generateRecipe);

module.exports = router;
