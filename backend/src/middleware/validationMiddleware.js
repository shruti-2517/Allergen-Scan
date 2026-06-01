const { body, param, validationResult } = require("express-validator");
const logger = require("../utils/logger");
const { TRACKED_ALLERGENS } = require("../utils/constants");

const trackedAllergens = new Set(TRACKED_ALLERGENS.map((item) => item.toLowerCase()));

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Validation errors", {
      path: req.path,
      errors: errors.array(),
    });
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

const validateSignup = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain uppercase, lowercase, number, and special character"
    ),
  handleValidationErrors,
];

const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

const validateBarcode = [
  param("barcode")
    .trim()
    .matches(/^[0-9]{8,14}$/)
    .withMessage("Barcode must be 8-14 digits"),
  handleValidationErrors,
];

const validatePagination = [
  body("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  body("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

const validateAllergens = [
  body("Allergens")
    .isArray({ max: 20 })
    .withMessage("Allergens must be an array with at most 20 items")
    .custom((items) =>
      items.every(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0 &&
          item.trim().length <= 50 &&
          trackedAllergens.has(item.trim().toLowerCase())
      )
    )
    .withMessage("Allergens contains unsupported values"),
  handleValidationErrors,
];

const validateIngredientConfirmation = [
  body("ingredients_list")
    .isArray({ min: 1, max: 100 })
    .withMessage("Ingredients list must contain 1-100 items")
    .custom((items) =>
      items.every(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0 &&
          item.trim().length <= 120
      )
    )
    .withMessage("Ingredients must be non-empty strings under 120 characters"),
  body("extracted_text")
    .optional()
    .isString()
    .isLength({ max: 5000 })
    .withMessage("Extracted text is too long"),
  body("product_name")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage("Product name is too long"),
  handleValidationErrors,
];

module.exports = {
  validateSignup,
  validateLogin,
  validateBarcode,
  validatePagination,
  validateAllergens,
  validateIngredientConfirmation,
  handleValidationErrors,
};
