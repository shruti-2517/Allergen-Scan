const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { validateBarcode } = require("../middleware/validationMiddleware");
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

router.post("/add/:barcode", authenticateToken, validateBarcode, addProduct);
router.get("/info/:barcode", authenticateToken, validateBarcode, getProductInfo);
router.get("/recents", authenticateToken, getRecentProducts);
router.get("/history", authenticateToken, getProductHistory);
router.get("/alternatives/:barcode", authenticateToken, validateBarcode, getAlternatives);
router.get("/alternative-detail/:barcode", authenticateToken, validateBarcode, getAlternativeDetail);
router.get("/dashboard/stats", authenticateToken, getDashboardStats);
router.get("/generate-recipe/:barcode", authenticateToken, validateBarcode, generateRecipe);

module.exports = router;
