const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/database");
const { COLLECTIONS, DB_NAMES } = require("../utils/constants");
const {
  fetchProductFromOpenFoodFacts,
  normalizeIngredientTags,
  findUserAllergens,
} = require("../utils/allergenUtils");

const addProduct = async (req, res) => {
  try {
    const barcode = req.params.barcode;
    const userId = req.user.id;

    console.log(`Adding product ${barcode} for user ${userId}`);

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const productsCollection = db.collection(COLLECTIONS.FOOD_PRODUCTS);

    // Get user's allergens
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userAllergens = user.allergens || [];

    // Fetch product data from API
    const data = await fetchProductFromOpenFoodFacts(barcode);

    if (data.status !== 1) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = data.product;
    const ingredientTags = product.ingredients_tags || [];
    const normalizedIngredientTags = normalizeIngredientTags(ingredientTags);
    const foundAllergens = findUserAllergens(
      userAllergens,
      normalizedIngredientTags
    );

    const ingredients = product.ingredients_text || "";
    const totalIngredients = normalizedIngredientTags.length;
    const totalAllergens = foundAllergens.length;
    const safe = totalAllergens === 0;

    const productData = {
      for_user: new ObjectId(userId),
      product_barcode: barcode,
      product_name: product.product_name,
      ingredients_text: ingredients,
      ingredients_tags: normalizedIngredientTags,
      foundAllergens,
      total_ingredients: totalIngredients,
      total_allergens: totalAllergens,
      safe,
      image_url: product.image_front_url || null,
      timestamp: new Date(),
    };

    await productsCollection.insertOne(productData);

    return res.status(200).json({ message: "Product added successfully" });
  } catch (error) {
    console.error("Add product error:", error);
    return res.status(500).json({ error: `API error: ${error.message}` });
  }
};

const getProductInfo = async (req, res) => {
  try {
    const barcode = req.params.barcode;
    const userId = req.user.id;

    console.log(`Fetching product info for barcode ${barcode}, user ${userId}`);

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const productsCollection = db.collection(COLLECTIONS.FOOD_PRODUCTS);

    const product = await productsCollection.findOne(
      { product_barcode: barcode, for_user: new ObjectId(userId) },
      { projection: { for_user: 0 } }
    );

    if (!product) {
      return res
        .status(404)
        .json({ error: "No information about product found" });
    }

    console.log(`Found product for user ${userId}`);
    return res.status(200).json(product);
  } catch (error) {
    console.error("Get product info error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getRecentProducts = async (req, res) => {
  try {
    const userId = req.user.id;

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const productsCollection = db.collection(COLLECTIONS.FOOD_PRODUCTS);

    const products = await productsCollection
      .find({ for_user: new ObjectId(userId) }, {
        projection: {
          product_name: 1,
          product_barcode: 1,
          total_allergens: 1,
          safe: 1,
        },
      })
      .sort({ timestamp: -1 })
      .limit(3)
      .toArray();

    if (products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }

    return res.status(200).json(products);
  } catch (error) {
    console.error("Get recent products error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getProductHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const productsCollection = db.collection(COLLECTIONS.FOOD_PRODUCTS);

    const products = await productsCollection
      .find({ for_user: new ObjectId(userId) }, {
        projection: {
          product_name: 1,
          product_barcode: 1,
          total_allergens: 1,
          safe: 1,
        },
      })
      .sort({ timestamp: -1 })
      .toArray();

    if (products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }

    return res.status(200).json(products);
  } catch (error) {
    console.error("Get product history error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  addProduct,
  getProductInfo,
  getRecentProducts,
  getProductHistory,
};
