const TRACKED_ALLERGENS = [
  "milk",
  "gluten",
  "soy",
  "eggs",
  "cashew nuts",
  "almonds",
  "peanuts",
  "fish",
  "shellfish",
  "sesame",
  "mustard",
  "celery",
  "tree nuts",
  "sulfites",
];

const ALLERGEN_SYNONYMS = {
  milk: ["milk", "whey", "casein", "lactose", "milk-powder", "skimmed-milk", "lactalbumin", "dairy"],
  gluten: ["gluten", "wheat", "barley", "rye", "malt", "spelt", "kamut", "farro", "durum", "semolina", "triticale", "oats"],
  soy: ["soy", "soya", "soybean", "edamame", "tofu", "tempeh", "miso", "tamari", "tvp"],
  eggs: ["egg", "eggs", "albumen", "ovalbumin", "mayonnaise", "meringue", "lysozyme", "globulin"],
  egg: ["egg", "eggs", "albumen", "ovalbumin", "mayonnaise", "meringue", "lysozyme", "globulin"],
  "cashew nuts": ["cashew", "cashews", "cashew-nut", "cashew-nuts"],
  cashew: ["cashew", "cashews", "cashew-nut", "cashew-nuts"],
  almonds: ["almond", "almonds", "almond-paste"],
  almond: ["almond", "almonds", "almond-paste"],
  peanuts: ["peanut", "peanuts", "groundnut", "groundnuts", "peanut-oil", "arachis", "monkey nuts", "goober"],
  peanut: ["peanut", "peanuts", "groundnut", "groundnuts", "peanut-oil", "arachis", "monkey nuts", "goober"],
  fish: ["fish", "salmon", "tuna", "cod", "tilapia", "anchovies", "sardines", "mackerel"],
  shellfish: ["shellfish", "crustacean", "crustaceans", "shrimp", "crab", "lobster", "prawn", "prawns", "crayfish", "mollusc", "mussels", "oysters", "scallops"],
  sesame: ["sesame", "sesame seeds", "tahini", "gingelly"],
  mustard: ["mustard", "mustard seeds", "mustard powder"],
  celery: ["celery", "celeriac"],
  "tree nuts": ["tree nuts", "walnut", "walnuts", "pecan", "pecans", "hazelnut", "hazelnuts", "macadamia", "pistachio", "pistachios", "brazil nut", "pine nut", "cashew", "almond"],
  sulfites: ["sulfites", "sulphites", "sulfur dioxide", "sulphur dioxide", "e220", "e221", "e222", "e223", "e224", "e225", "e226", "e227", "e228"],
};

const DB_NAMES = {
  ALLERGENIC: "ALLERGENIC",
};

const COLLECTIONS = {
  USERS: "USERS",
  FOOD_PRODUCTS: "FOOD PRODUCTS",
  REFRESH_TOKENS: "REFRESH TOKENS",
  DASHBOARD: "DASHBOARD",
  PRODUCT_CACHE: "PRODUCT_CACHE",
};

// Vague ingredient terms that may conceal allergens — triggers "safety uncertain"
const UNCERTAIN_TERMS = [
  "flavouring", "flavourings", "flavoring", "flavorings",
  "natural flavouring", "natural flavourings", "natural flavoring",
  "artificial flavouring", "artificial flavourings",
  "spices", "spice", "seasoning", "seasonings",
  "starch", "modified starch", "vegetable starch",
  "hydrolysed protein", "hydrolyzed protein",
  "vegetable protein", "plant protein",
  "emulsifier", "emulsifiers",
  "thickener", "thickeners",
  "flour", "vegetable oil", "vegetable fat",
];

module.exports = {
  TRACKED_ALLERGENS,
  ALLERGEN_SYNONYMS,
  UNCERTAIN_TERMS,
  DB_NAMES,
  COLLECTIONS,
};
