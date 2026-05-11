const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/database");
const { COLLECTIONS, DB_NAMES } = require("../utils/constants");
const {
  fetchOpenFoodFactsJson,
  fetchProductFromOpenFoodFacts,
  normalizeIngredientTags,
  findUserAllergens,
  checkUncertainIngredients,
  checkTraceWarnings,
  buildAllergenLabels,
} = require("../utils/allergenUtils");

const addProduct = async (req, res) => {
  try {
    const barcode = req.params.barcode;
    const userId = req.user.id;

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

    // Reject products with no usable data
    if (!product.product_name || !product.product_name.trim()) {
      return res.status(404).json({ error: "Product details not found" });
    }
    if (!product.ingredients_tags?.length && !product.ingredients_text?.trim()) {
      return res.status(404).json({ error: "Product details not found" });
    }
    const ingredientTags = product.ingredients_tags || [];
    const normalizedIngredientTags = normalizeIngredientTags(ingredientTags);
    const foundAllergens = findUserAllergens(
      userAllergens,
      normalizedIngredientTags
    );

    const ingredients = product.ingredients_text || "";
    const totalIngredients = normalizedIngredientTags.length;
    const totalAllergens = foundAllergens.length;
    const uncertainIngredients = checkUncertainIngredients(normalizedIngredientTags);
    const { hasTraceWarning, traceAllergens } = checkTraceWarnings(
      ingredients,
      product.traces_tags || [],
      userAllergens
    );
    const {
      allergenLabels,
      freeFrom,
      contains,
      mayContain,
    } = buildAllergenLabels(
      ingredients,
      normalizedIngredientTags,
      product.traces_tags || []
    );
    const safe = totalAllergens === 0;
    const uncertain = safe && (uncertainIngredients.length > 0 || hasTraceWarning);

    const productData = {
      for_user: new ObjectId(userId),
      product_barcode: barcode,
      product_name: product.product_name,
      category_tags: getProductCategories(product),
      ingredients_text: ingredients,
      ingredients_tags: normalizedIngredientTags,
      foundAllergens,
      uncertainIngredients,
      traceAllergens,
      hasTraceWarning,
      allergen_labels: allergenLabels,
      free_from_labels: freeFrom,
      contains_allergens: contains,
      may_contain_allergens: mayContain,
      total_ingredients: totalIngredients,
      total_allergens: totalAllergens,
      safe,
      uncertain,
      image_url: product.image_front_url || null,
      timestamp: new Date(),
    };

    await productsCollection.insertOne(productData);

    const primaryCategory = (product.categories_tags || []).slice(-1)[0];
    if (primaryCategory) {
      try {
        await fetchAndCacheCategory(db, primaryCategory);
      } catch (cacheError) {
        console.warn(`Category cache refresh failed for ${primaryCategory}:`, cacheError.message);
      }
    }

    // Dashboard stats are now dynamically calculated on the fly

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
          timestamp: 1,
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

// Extract meaningful flavor/variant keywords from a product name.
// Strips generic words so only descriptive terms like "strawberry", "chocolate" remain.
const GENERIC_WORDS = new Set([
  "bar", "bars", "cereal", "biscuit", "biscuits", "cookie", "cookies",
  "cake", "cakes", "snack", "snacks", "original", "classic", "natural",
  "organic", "light", "low", "fat", "sugar", "free", "with", "and",
  "the", "a", "an", "of", "in", "on", "for", "by", "new", "pack",
  "multipack", "mini", "big", "extra", "special", "edition", "flavour",
  "flavor", "flavored", "flavoured", "variety", "mixed", "assorted",
]);

const extractFlavorKeywords = (productName) => {
  return productName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !GENERIC_WORDS.has(w));
};

const getProductCategories = (product = {}) => {
  if (Array.isArray(product.category_tags) && product.category_tags.length > 0) {
    return product.category_tags;
  }

  if (Array.isArray(product.categories_tags) && product.categories_tags.length > 0) {
    return product.categories_tags;
  }

  return [];
};

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_VERSION = 5; // bumped: adds allergens_tags, fixes empty-cache poison bug

const hasAllergenConflict = (product, userAllergens) => {
  const { ALLERGEN_SYNONYMS } = require("../utils/constants");
  const userSet = new Set((userAllergens || []).map((a) => a.toLowerCase()));

  // Check structured allergens_tags from Open Food Facts (most reliable)
  const structuredAllergens = (product.allergens_tags || []).map((a) => a.toLowerCase());
  if (structuredAllergens.some((tag) => {
    // tag e.g. "milk" — check if any user allergen or its synonyms matches
    for (const userAllergen of userAllergens) {
      const keywords = ALLERGEN_SYNONYMS[userAllergen.toLowerCase()] || [userAllergen.toLowerCase()];
      if (keywords.some((kw) => tag.includes(kw) || kw.includes(tag))) return true;
    }
    return false;
  })) {
    return true;
  }

  // Fallback: check text-derived contains_allergens
  const blockedAllergens = (product.contains_allergens || []).map((a) => a.toLowerCase());
  return blockedAllergens.some((allergen) => userSet.has(allergen));
};

const getCategorySearchUrls = (category) => {
  const cleanCategory = String(category || "").replace(/^en:/, "");
  const fields = "product_name,code,image_front_url,ingredients_tags,ingredients_text,traces_tags,categories_tags,allergens_tags";

  return [
    `https://world.openfoodfacts.org/api/v2/search?categories_tags=${encodeURIComponent(category)}&fields=${fields}&page_size=80`,
    `https://world.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=${encodeURIComponent(category)}&fields=${fields}&json=1&page_size=80`,
    `https://world.openfoodfacts.org/cgi/search.pl?action=process&search_terms=${encodeURIComponent(cleanCategory)}&search_simple=1&fields=${fields}&json=1&page_size=80`,
  ];
};

const fetchCategoryProductsFromApi = async (category) => {
  let lastError = null;

  for (const url of getCategorySearchUrls(category)) {
    try {
      const data = await fetchOpenFoodFactsJson(url, `Category fetch for ${category}`);
      if (Array.isArray(data.products)) {
        return data.products;
      }
    } catch (error) {
      lastError = error;
      console.warn(`Category fetch attempt failed for ${category}:`, error.message);
    }
  }

  throw lastError || new Error(`Unable to fetch category data for ${category}`);
};

const cleanupLegacyProductCache = async (cacheCollection) => {
  await cacheCollection.deleteMany({
    $or: [
      { alternatives: { $exists: true } },
      { sourceBarcode: { $exists: true } },
      { sourceProduct: { $exists: true } },
      { sourceProductName: { $exists: true } },
    ],
  });
};

const fetchAndCacheCategory = async (db, category) => {
  const cacheCollection = db.collection(COLLECTIONS.PRODUCT_CACHE);
  await cleanupLegacyProductCache(cacheCollection);

  let raw = [];
  try {
    raw = await fetchCategoryProductsFromApi(category);
  } catch (error) {
    const staleCache = await cacheCollection.findOne({
      category,
      cacheType: "category-catalog",
    });

    if (Array.isArray(staleCache?.products) && staleCache.products.length > 0) {
      console.warn(`Using stale cache for ${category}:`, error.message);
      return staleCache.products;
    }

    console.warn(`No category cache available for ${category}:`, error.message);
    return [];
  }

  const toCache = [];
  for (const p of raw) {
    if (!p.product_name?.trim() || !p.code) continue;

    let ingredientTags = normalizeIngredientTags(p.ingredients_tags || []);
    if (ingredientTags.length === 0 && p.ingredients_text) {
      ingredientTags = p.ingredients_text
        .toLowerCase()
        .split(/[,;()\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1);
    }
    if (ingredientTags.length === 0) continue;

    const { allergenLabels, freeFrom, contains, mayContain } = buildAllergenLabels(
      p.ingredients_text || "",
      ingredientTags,
      p.traces_tags || []
    );
    const uncertainIngredients = checkUncertainIngredients(ingredientTags);

    toCache.push({
      code: p.code,
      product_name: p.product_name,
      image_url: p.image_front_url || null,
      categories_tags: p.categories_tags || [category],
      ingredients_text: p.ingredients_text || "",
      ingredients_tags: ingredientTags,
      allergens_tags: (p.allergens_tags || []).map((t) => t.replace(/^en:/, "").toLowerCase()),
      allergen_labels: allergenLabels,
      free_from_labels: freeFrom,
      contains_allergens: contains,
      may_contain_allergens: mayContain,
      uncertain_ingredients: uncertainIngredients,
    });
  }

  // Don't cache an empty result — it would poison the cache for 7 days.
  // Only persist if we actually have products to store.
  if (toCache.length === 0) {
    console.warn(`fetchAndCacheCategory: no products to cache for category "${category}". API returned ${raw.length} raw products, all filtered out.`);
    return [];
  }

  await cacheCollection.updateOne(
    { category },
    {
      $set: {
        category,
        cacheVersion: CACHE_VERSION,
        cacheType: "category-catalog",
        productCount: toCache.length,
        products: toCache,
        cachedAt: new Date(),
      },
      $unset: {
        barcode: "",
        alternatives: "",
        sourceBarcode: "",
        sourceProduct: "",
        sourceProductName: "",
      },
    },
    { upsert: true }
  );
  return toCache;
};

const getAlternatives = async (req, res) => {
  try {
    const barcode = req.params.barcode;
    const userId = req.user.id;

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const productsCollection = db.collection(COLLECTIONS.FOOD_PRODUCTS);

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    const userAllergens = user?.allergens || [];

    let origProduct = await productsCollection.findOne(
      { product_barcode: barcode },
      { projection: { product_name: 1, category_tags: 1, categories_tags: 1 } }
    );

    let categories = getProductCategories(origProduct);

    if (!origProduct || categories.length === 0) {
      const origData = await fetchProductFromOpenFoodFacts(barcode);
      if (origData.status !== 1) {
        return res.status(404).json({ error: "Original product not found" });
      }

      origProduct = origData.product;
      categories = getProductCategories(origProduct);

      if (categories.length > 0) {
        await productsCollection.updateMany(
          { product_barcode: barcode },
          {
            $set: {
              category_tags: categories,
              ...(origProduct.product_name ? { product_name: origProduct.product_name } : {}),
            },
          }
        );
      }
    }

    const category = categories[categories.length - 1];
    if (!category) {
      return res.status(404).json({
        error: "No category metadata available for product from database or Open Food Facts",
      });
    }

    const flavorKeywords = extractFlavorKeywords(origProduct.product_name || "");

    // Check cache first — fall back to API on miss or stale
    const cacheCollection = db.collection(COLLECTIONS.PRODUCT_CACHE);
    await cleanupLegacyProductCache(cacheCollection);
    const cached = await cacheCollection.findOne({
      category,
      cacheType: "category-catalog",
    });
    const cacheValid = Boolean(
      cached
      && cached.cacheVersion === CACHE_VERSION
      && Array.isArray(cached.products)
      && Date.now() - new Date(cached.cachedAt).getTime() < CACHE_TTL_MS
    );
    const candidates = cacheValid ? cached.products : await fetchAndCacheCategory(db, category);

    if (candidates.length === 0) {
      return res.status(200).json({
        category,
        cachedProducts: 0,
        alternatives: [],
      });
    }

    // Filter and score from the category-wide cache
    const safeAlternatives = [];
    for (const p of candidates) {
      if (!p.product_name?.trim() || p.code === barcode) continue;
      if (hasAllergenConflict(p, userAllergens)) continue;

      const relevantTraceAllergens = (p.may_contain_allergens || []).filter((allergen) =>
        userAllergens.some((userAllergen) => userAllergen.toLowerCase() === allergen.toLowerCase())
      );
      const score = flavorKeywords.filter((kw) => p.product_name.toLowerCase().includes(kw)).length;
      const uncertain = Boolean(
        (p.uncertain_ingredients || []).length > 0 || relevantTraceAllergens.length > 0
      );

      safeAlternatives.push({
        barcode: p.code,
        product_name: p.product_name,
        image_url: p.image_url || null,
        ingredients_count: p.ingredients_tags.length,
        free_from_labels: p.free_from_labels || [],
        allergen_labels: p.allergen_labels || {},
        safe: true,
        uncertain,
        hasTraceWarning: relevantTraceAllergens.length > 0,
        traceAllergens: relevantTraceAllergens,
        uncertainIngredients: p.uncertain_ingredients || [],
        score,
      });
    }

    safeAlternatives.sort((a, b) => b.score - a.score);
    const results = safeAlternatives.slice(0, 10).map(({ score, ...rest }) => rest);

    return res.status(200).json({
      category,
      cachedProducts: candidates.length,
      alternatives: results,
    });
  } catch (error) {
    console.error("Get alternatives error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAlternativeDetail = async (req, res) => {
  try {
    const { barcode } = req.params;
    const userId = req.user.id;

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    const userAllergens = user?.allergens || [];

    const data = await fetchProductFromOpenFoodFacts(barcode);

    if (data.status !== 1 || !data.product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const p = data.product;
    const ingredientTags = normalizeIngredientTags(p.ingredients_tags || []);
    const foundAllergens = findUserAllergens(userAllergens, ingredientTags);
    const uncertainIngredients = checkUncertainIngredients(ingredientTags);
    const { hasTraceWarning, traceAllergens } = checkTraceWarnings(
      p.ingredients_text || "",
      p.traces_tags || [],
      userAllergens
    );
    const { allergenLabels, freeFrom, contains, mayContain } = buildAllergenLabels(
      p.ingredients_text || "",
      ingredientTags,
      p.traces_tags || []
    );
    const safe = foundAllergens.length === 0;
    const uncertain = safe && (uncertainIngredients.length > 0 || hasTraceWarning);

    return res.status(200).json({
      product_barcode: barcode,
      product_name: p.product_name || "Unknown Product",
      image_url: p.image_front_url || null,
      ingredients_text: p.ingredients_text || "",
      ingredients_tags: ingredientTags,
      foundAllergens,
      uncertainIngredients,
      traceAllergens,
      hasTraceWarning,
      allergen_labels: allergenLabels,
      free_from_labels: freeFrom,
      contains_allergens: contains,
      may_contain_allergens: mayContain,
      total_ingredients: ingredientTags.length,
      total_allergens: foundAllergens.length,
      safe,
      uncertain,
      brands: p.brands || null,
      quantity: p.quantity || null,
      nutriscore_grade: p.nutriscore_grade || null,
    });
  } catch (error) {
    console.error("Get alternative detail error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDatabase(DB_NAMES.ALLERGENIC);
    
    // 1. Get user and their current allergens
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const userAllergens = user.allergens || [];

    // 2. Fetch all regular barcode scans
    const productsCollection = db.collection(COLLECTIONS.FOOD_PRODUCTS);
    const barcodeScans = await productsCollection.find({ for_user: new ObjectId(userId) }).toArray();

    // 3. Fetch all OCR scans
    const analysisCollection = db.collection("INGREDIENT_ANALYSES");
    const ocrScans = await analysisCollection.find({ for_user: new ObjectId(userId) }).toArray();

    // 4. Compute stats dynamically
    let totalScans = barcodeScans.length + ocrScans.length;
    let safeProducts = 0;
    let unsafeProducts = 0;
    let allergenCountsMap = {};

    // Helper to process each item against current user allergens
    const processItem = (ingredients) => {
      const found = findUserAllergens(userAllergens, ingredients);
      if (found.length === 0) {
        safeProducts++;
      } else {
        unsafeProducts++;
        for (const allergen of found) {
          allergenCountsMap[allergen] = (allergenCountsMap[allergen] || 0) + 1;
        }
      }
    };

    barcodeScans.forEach(scan => processItem(scan.ingredients_tags || []));
    ocrScans.forEach(scan => processItem(scan.ingredients_list || []));

    // Convert allergenCounts map to sorted array
    const topAllergens = Object.entries(allergenCountsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.status(200).json({
      totalScans,
      safeProducts,
      unsafeProducts,
      topAllergens,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  addProduct,
  getProductInfo,
  getRecentProducts,
  getProductHistory,
  getAlternatives,
  getAlternativeDetail,
  getDashboardStats,
};
