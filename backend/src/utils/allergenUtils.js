const { TRACKED_ALLERGENS, ALLERGEN_SYNONYMS, UNCERTAIN_TERMS } = require("./constants");

const OPEN_FOOD_FACTS_HEADERS = {
  Accept: "application/json",
  "User-Agent": "AllergenScan/1.0",
};

const fetchOpenFoodFactsJson = async (url, context = "Open Food Facts request") => {
  try {
    const response = await fetch(url, {
      headers: OPEN_FOOD_FACTS_HEADERS,
    });
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const rawBody = await response.text();

    if (!response.ok) {
      throw new Error(
        `${context} failed with status ${response.status}: ${rawBody.slice(0, 120)}`
      );
    }

    if (!contentType.includes("json")) {
      throw new Error(
        `${context} returned ${contentType || "unknown content"} instead of JSON`
      );
    }

    return JSON.parse(rawBody);
  } catch (error) {
    throw new Error(`API error: ${error.message}`);
  }
};

const fetchProductFromOpenFoodFacts = async (barcode) => {
  return fetchOpenFoodFactsJson(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
    `Product fetch for ${barcode}`
  );
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

// Phrases in free text that indicate trace/cross-contamination warnings
const TRACE_PATTERNS = [
  /may contain(?: traces? of)?/i,
  /might contain/i,
  /could contain/i,
  /produced in a (factory|facility|plant) (that also (processes|handles|uses|manufactures)|which (processes|handles|uses|manufactures))/i,
  /made in a (factory|facility|plant) (that also (processes|handles|uses|manufactures)|which (processes|handles|uses|manufactures))/i,
  /manufactured (on|in) (shared|the same) (equipment|line|facility)/i,
  /cross.?contaminat/i,
  /not suitable for.+allerg/i,
  /traces? of/i,
];

/**
 * Detect trace/cross-contamination warnings in ingredients text and traces_tags.
 * Returns { hasTraceWarning, traceAllergens } where traceAllergens are user allergens
 * mentioned near a trace warning phrase.
 */
const checkTraceWarnings = (ingredientsText, tracesTags, userAllergens) => {
  const text = (ingredientsText || "").toLowerCase();
  const traceTags = (tracesTags || []).map((t) => t.replace("en:", "").toLowerCase());

  // Check if any trace pattern appears in the free text
  const hasTracePhrase = TRACE_PATTERNS.some((re) => re.test(text));
  const hasTraceTags = traceTags.length > 0;

  // Find which user allergens are mentioned in traces_tags
  const traceAllergensFromTags = [];
  for (const allergen of userAllergens) {
    const keywords = ALLERGEN_SYNONYMS[allergen.toLowerCase()] || [allergen.toLowerCase()];
    if (keywords.some((kw) => traceTags.some((tag) => tag.includes(kw)))) {
      traceAllergensFromTags.push(allergen);
    }
  }

  // Find user allergens mentioned in the free text near a trace phrase
  const traceAllergensFromText = [];
  if (hasTracePhrase) {
    for (const allergen of userAllergens) {
      const keywords = ALLERGEN_SYNONYMS[allergen.toLowerCase()] || [allergen.toLowerCase()];
      if (keywords.some((kw) => text.includes(kw))) {
        traceAllergensFromText.push(allergen);
      }
    }
  }

  // Merge both sources, deduplicate
  const traceAllergens = [...new Set([...traceAllergensFromTags, ...traceAllergensFromText])];

  return {
    hasTraceWarning: traceAllergens.length > 0,
    hasAnyTraceWarning: hasTracePhrase || hasTraceTags,
    hasSpecificTraceMatch: traceAllergens.length > 0,
    traceAllergens,
  };
};

const toLabelSlug = (allergen) => allergen.toLowerCase().replace(/\s+/g, "-");

const buildAllergenLabels = (ingredientsText = "", ingredientTags = [], tracesTags = []) => {
  const normalizedTags = Array.isArray(ingredientTags)
    ? normalizeIngredientTags(ingredientTags)
    : [];
  const ingredientSource = normalizedTags.length > 0 ? normalizedTags : ingredientsText;

  const allergenLabels = {};
  const freeFrom = [];
  const contains = [];
  const mayContain = [];

  for (const allergen of TRACKED_ALLERGENS) {
    const slug = toLabelSlug(allergen);
    const found = findUserAllergens([allergen], ingredientSource);
    const { hasSpecificTraceMatch } = checkTraceWarnings(ingredientsText, tracesTags, [allergen]);

    if (found.length > 0) {
      allergenLabels[allergen] = `contains-${slug}`;
      contains.push(allergen);
    } else if (hasSpecificTraceMatch) {
      allergenLabels[allergen] = `may-contain-${slug}`;
      mayContain.push(allergen);
    } else {
      allergenLabels[allergen] = `${slug}-free`;
      freeFrom.push(`${slug}-free`);
    }
  }

  return {
    allergenLabels,
    freeFrom,
    contains,
    mayContain,
  };
};

const checkUncertainIngredients = (ingredientsList) => {
  const normalized = Array.isArray(ingredientsList)
    ? ingredientsList.map((i) => i.toLowerCase())
    : parseIngredientText(ingredientsList);

  return UNCERTAIN_TERMS.filter((term) =>
    normalized.some((ing) => ing.includes(term))
  );
};

module.exports = {
  fetchOpenFoodFactsJson,
  fetchProductFromOpenFoodFacts,
  normalizeIngredientTags,
  parseIngredientText,
  findUserAllergens,
  checkUncertainIngredients,
  checkTraceWarnings,
  buildAllergenLabels,
};
