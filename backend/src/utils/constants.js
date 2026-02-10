const ALLERGEN_SYNONYMS = {
  milk: ["milk", "whey", "casein", "lactose", "milk-powder", "skimmed-milk"],
  egg: ["egg", "albumen", "ovalbumin"],
  peanut: ["peanut", "groundnut", "peanut-oil"],
  gluten: ["gluten", "wheat", "barley", "rye", "malt"],
  soy: ["soy", "soya", "soybean"],
  almonds: ["almond", "almond-paste"],
};

const DB_NAMES = {
  ALLERGENIC: "ALLERGENIC",
};

const COLLECTIONS = {
  USERS: "USERS",
  FOOD_PRODUCTS: "FOOD PRODUCTS",
  REFRESH_TOKENS: "REFRESH TOKENS",
};

module.exports = {
  ALLERGEN_SYNONYMS,
  DB_NAMES,
  COLLECTIONS,
};
