const { ALLERGEN_SYNONYMS } = require("./constants");

const fetchProductFromOpenFoodFacts = async (barcode) => {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`API error: ${error.message}`);
  }
};

const normalizeIngredientTags = (ingredientTags) => {
  return ingredientTags.map((tag) => tag.replace("en:", "").toLowerCase());
};

const parseIngredientText = (text) => {
  /**
   * Parse ingredient text and extract individual ingredients
   * Handles various formats: comma-separated, line-separated, etc.
   */
  return text
    .split(/[,;\n]/)
    .map((ingredient) =>
      ingredient
        .trim()
        .toLowerCase()
        .replace(/[()[\]{}]/g, "") // Remove brackets and parentheses
        .replace(/\d+(\.\d+)?%?/g, "") // Remove percentages and quantities
        .trim()
    )
    .filter((ingredient) => ingredient.length > 2); // Filter out very short strings
};

const findUserAllergens = (userAllergens, ingredientsList) => {
  /**
   * Find allergens in ingredient list
   * Handles both array of ingredients and raw text
   */
  const normalizedIngredients = Array.isArray(ingredientsList)
    ? ingredientsList.map((ing) => ing.toLowerCase())
    : parseIngredientText(ingredientsList);

  const foundAllergensSet = new Set();

  for (const allergen of userAllergens) {
    const keywords = ALLERGEN_SYNONYMS[allergen.toLowerCase()] || [
      allergen.toLowerCase(),
    ];
    if (
      keywords.some((word) =>
        normalizedIngredients.some((ing) =>
          ing.includes(word) || word.includes(ing)
        )
      )
    ) {
      foundAllergensSet.add(allergen);
    }
  }

  return Array.from(foundAllergensSet);
};

module.exports = {
  fetchProductFromOpenFoodFacts,
  normalizeIngredientTags,
  parseIngredientText,
  findUserAllergens,
};
