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
  const normalizedIngredients = Array.isArray(ingredientsList)
    ? ingredientsList.map((ing) => ing.toLowerCase())
    : parseIngredientText(ingredientsList);

  const ingredientsSet = new Set(normalizedIngredients);
  const foundAllergens = [];

  for (const allergen of userAllergens) {
    const allergenLower = allergen.toLowerCase();
    const keywords = ALLERGEN_SYNONYMS[allergenLower] || [allergenLower];

    let found = false;
    for (const keyword of keywords) {
      if (ingredientsSet.has(keyword)) {
        found = true;
        break;
      }
      for (const ingredient of normalizedIngredients) {
        if (ingredient.includes(keyword) || keyword.includes(ingredient)) {
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (found) {
      foundAllergens.push(allergen);
    }
  }

  return foundAllergens;
};

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

const checkTraceWarnings = (ingredientsText, tracesTags, userAllergens) => {
  const text = (ingredientsText || "").toLowerCase();
  const traceTags = (tracesTags || []).map((t) => t.replace("en:", "").toLowerCase());
  const tagsSet = new Set(traceTags);

  let hasTracePhrase = false;
  for (const pattern of TRACE_PATTERNS) {
    if (pattern.test(text)) {
      hasTracePhrase = true;
      break;
    }
  }

  const traceAllergens = [];
  const seenAllergens = new Set();

  for (const allergen of userAllergens) {
    if (seenAllergens.has(allergen)) continue;

    const allergenLower = allergen.toLowerCase();
    const keywords = ALLERGEN_SYNONYMS[allergenLower] || [allergenLower];

    let isTraceAllergen = false;

    for (const keyword of keywords) {
      if (tagsSet.has(keyword) || traceTags.some((tag) => tag.includes(keyword))) {
        isTraceAllergen = true;
        break;
      }

      if (hasTracePhrase && text.includes(keyword)) {
        isTraceAllergen = true;
        break;
      }
    }

    if (isTraceAllergen) {
      traceAllergens.push(allergen);
      seenAllergens.add(allergen);
    }
  }

  return {
    hasTraceWarning: traceAllergens.length > 0,
    hasAnyTraceWarning: hasTracePhrase || traceTags.length > 0,
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
