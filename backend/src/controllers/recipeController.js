const { ObjectId } = require("mongodb");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getDatabase } = require("../config/database");
const { COLLECTIONS, DB_NAMES } = require("../utils/constants");
const { fetchProductFromOpenFoodFacts } = require("../utils/allergenUtils");

let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (e) {
  console.error("Failed to initialize Gemini for recipe generation:", e);
}

const generateRecipe = async (req, res) => {
  try {
    if (!genAI) {
      return res.status(503).json({ error: "AI recipe generation is not available. GEMINI_API_KEY is missing." });
    }

    const { barcode } = req.params;
    const userId = req.user.id;

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const productsCollection = db.collection(COLLECTIONS.FOOD_PRODUCTS);

    // Get user allergens
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    const userAllergens = user?.allergens || [];

    // Try to get product info from DB first, fallback to Open Food Facts
    let productName = null;
    let categoryTags = [];
    let ingredientsText = "";

    const dbProduct = await productsCollection.findOne(
      { product_barcode: barcode, for_user: new ObjectId(userId) },
      { projection: { product_name: 1, category_tags: 1, ingredients_text: 1 } }
    );

    if (dbProduct) {
      productName = dbProduct.product_name;
      categoryTags = dbProduct.category_tags || [];
      ingredientsText = dbProduct.ingredients_text || "";
    } else {
      const data = await fetchProductFromOpenFoodFacts(barcode);
      if (data.status === 1 && data.product) {
        productName = data.product.product_name;
        categoryTags = data.product.categories_tags || [];
        ingredientsText = data.product.ingredients_text || "";
      }
    }

    if (!productName) {
      return res.status(404).json({ error: "Product not found. Cannot generate recipe." });
    }

    const categoryLabel = categoryTags.length > 0
      ? categoryTags[categoryTags.length - 1].replace(/^en:/, "").replace(/-/g, " ")
      : "food";

    const allergensText = userAllergens.length > 0
      ? userAllergens.join(", ")
      : "none";

    const prompt = `You are a professional chef and nutritionist specializing in allergen-free cooking.

A user was looking for a product called "${productName}" (category: ${categoryLabel}) but could not find any safe alternatives because of their allergen profile.

User's allergens to AVOID: ${allergensText}

The original product ingredients (for context/inspiration only): ${ingredientsText || "Not available"}

Please generate a simple, delicious homemade recipe that:
1. Serves as a safe homemade substitute for "${productName}"
2. Does NOT contain any of these allergens: ${allergensText}
3. Uses common, easy-to-find ingredients
4. Is practical to make at home

Respond ONLY with a strict JSON object in this exact format (no markdown, no code blocks, just raw JSON):
{
  "recipe_name": "string - creative name for the recipe",
  "description": "string - 1-2 sentence description of what this recipe is and why it's a great alternative",
  "prep_time": "string - e.g. '10 minutes'",
  "cook_time": "string - e.g. '20 minutes'",
  "servings": "string - e.g. '4 servings'",
  "ingredients": ["array of ingredient strings with quantities"],
  "steps": ["array of step-by-step instruction strings"],
  "allergen_note": "string - confirm which allergens this recipe is free from"
}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text() || "{}";

    let recipe;
    try {
      recipe = JSON.parse(rawText);
    } catch (parseError) {
      console.error("Failed to parse Gemini recipe response:", parseError.message);
      return res.status(500).json({ error: "AI returned an invalid response. Please try again." });
    }

    // Validate the recipe has the required fields
    if (!recipe.recipe_name || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) {
      return res.status(500).json({ error: "AI returned an incomplete recipe. Please try again." });
    }

    return res.status(200).json({
      product_name: productName,
      category: categoryLabel,
      recipe,
    });
  } catch (error) {
    console.error("Generate recipe error:", error);
    return res.status(500).json({ error: "Internal server error while generating recipe." });
  }
};

module.exports = { generateRecipe };
