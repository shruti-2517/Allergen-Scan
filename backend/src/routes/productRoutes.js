const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  addProduct,
  getProductInfo,
  getRecentProducts,
  getProductHistory,
} = require("../controllers/productController");

router.get("/add/:barcode", authenticateToken, addProduct);
router.get("/info/:barcode", authenticateToken, getProductInfo);
router.get("/recents", authenticateToken, getRecentProducts);
router.get("/history", authenticateToken, getProductHistory);

module.exports = router;
