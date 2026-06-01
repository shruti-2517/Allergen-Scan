const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");
const fuzz = require("fuzzball");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getDatabase } = require("../config/database");
const { COLLECTIONS, DB_NAMES } = require("../utils/constants");
const {
  findUserAllergens,
} = require("../utils/allergenUtils");
const { ObjectId } = require("mongodb");

// Initialize Gemini if API key is present
let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (e) {
  console.error("Failed to initialize Gemini:", e);
}

const runHeuristics = (extractedText) => {
  // 1. Clean the text of weird OCR artifacts
  let cleanText = extractedText
    .replace(/[_®©‘'{}]/g, ' ')
    .toLowerCase();

  // 2. Handle newlines
  cleanText = cleanText.replace(/\n/g, ' ').replace(/\s+/g, ' ');

  // Split into chunks by standard separators
  const rawChunks = cleanText
    .split(/[,:;*]| and | contains | ingredients /i)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 2);

  // Basic NLP / Heuristics to remove obvious noise
  const noisePatterns = [/nutrition/i, /facts/i, /net wt/i, /calories/i, /daily value/i, /%/];
  let potentialIngredients = [];

  for (const chunk of rawChunks) {
    if (!noisePatterns.some(pattern => pattern.test(chunk))) {
      // Remove trailing numbers/weights (e.g. "mineral 1700")
      let cleanedChunk = chunk.replace(/[0-9]+[a-z]*/g, '').replace(/[().*•]/g, '').trim();

      // Breakdown extremely long lines missing commas
      if (cleanedChunk.length > 40) {
        let words = cleanedChunk.split(' ').filter(w => w.length > 2);
        potentialIngredients.push(...words);
      } else if (cleanedChunk.length > 2) {
        potentialIngredients.push(cleanedChunk);
      }
    }
  }

  // Deduplicate and filter using fuzzball to get meaningful labels
  let deduplicatedIngredients = [];
  for (const item of potentialIngredients) {
    if (deduplicatedIngredients.length === 0) {
      deduplicatedIngredients.push(item);
    } else {
      const match = fuzz.extract(item, deduplicatedIngredients, { limit: 1, cutoff: 80 });
      if (match.length === 0) {
        deduplicatedIngredients.push(item);
      }
    }
  }
  return deduplicatedIngredients;
};

const isSupportedImage = (filePath) => {
  const header = Buffer.alloc(12);
  const fd = fs.openSync(filePath, "r");

  try {
    fs.readSync(fd, header, 0, header.length, 0);
  } finally {
    fs.closeSync(fd);
  }

  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng = header.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp =
    header.slice(0, 4).toString("ascii") === "RIFF" &&
    header.slice(8, 12).toString("ascii") === "WEBP";

  return isJpeg || isPng || isWebp;
};

const cleanTextList = (items, maxItems = 100) => {
  return items
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
};

const analyzeIngredientImage = async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    filePath = req.file.path;
    const userId = req.user.id;

    if (!isSupportedImage(filePath)) {
      return res.status(400).json({ error: "Unsupported or invalid image file" });
    }

    console.log(`Processing ingredient image for user ${userId} using Tesseract.js`);

    // Perform OCR using Tesseract.js
    const { data: { text } } = await Tesseract.recognize(
      filePath,
      'eng'
    );

    let extractedText = text || "";

    if (!extractedText.trim()) {
      return res
        .status(400)
        .json({ error: "No text could be extracted from the image" });
    }

    let finalIngredients = [];

    // Use Gemini for extraction if available, otherwise fallback to heuristics
    if (genAI) {
      try {
        const prompt = `You are a data extraction assistant. I will provide you with messy OCR text from a food or cosmetic label. Your task is to extract the exact list of ingredients.
        Rules:
        1. Correct any obvious OCR spelling mistakes (e.g., 'glen' to 'gluten', 'groundnit' to 'groundnut', 'sait' to 'salt').
        2. Ignore irrelevant text such as 'Net Wt', 'Nutrition Facts', '%' daily values, or random numbers.
        3. If ingredients are grouped in parentheses like "Mixed spices (Onion powder, Garlic)", flatten them into individual simple items in the array (e.g., "Mixed spices", "Onion powder", "Garlic"). Do not leave long clubbed strings.
        4. Return the ingredients as a strict JSON array of strings. Do not include any markdown formatting, code blocks, or extra text. Just the JSON array.
        
        OCR Text:
        ${extractedText}`;

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json"
          }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawOutput = response.text() || "[]";

        finalIngredients = JSON.parse(rawOutput);

        finalIngredients = Array.isArray(finalIngredients) ? cleanTextList(finalIngredients) : [];
      } catch (llmError) {
        console.error("Gemini API error:", llmError.message);
        finalIngredients = runHeuristics(extractedText);
      }
    } else {
      console.log("Gemini API key not found. Falling back to heuristics...");
      finalIngredients = runHeuristics(extractedText);
    }

    // Return the extracted list to frontend for review
    return res.status(200).json({
      message: "Image processed, waiting for user confirmation",
      extracted_text: extractedText,
      ingredients_list: cleanTextList(finalIngredients),
    });
  } catch (error) {
    console.error("Analyze ingredient image error:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }
  }
};

const confirmIngredientAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ingredients_list, extracted_text, product_name } = req.body;

    if (!ingredients_list || !Array.isArray(ingredients_list)) {
      return res.status(400).json({ error: "Invalid ingredients list" });
    }

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userAllergens = user.allergens || [];
    const safeIngredientsList = cleanTextList(ingredients_list);
    const foundAllergens = findUserAllergens(userAllergens, safeIngredientsList);

    const analysis = {
      product_name: typeof product_name === "string" && product_name.trim()
        ? product_name.trim()
        : "Unknown Product",
      extracted_text: typeof extracted_text === "string"
        ? extracted_text.slice(0, 5000)
        : "User Confirmed List",
      ingredients_list: safeIngredientsList,
      found_allergens: foundAllergens,
      total_ingredients: safeIngredientsList.length,
      total_allergens: foundAllergens.length,
      safe: foundAllergens.length === 0,
      timestamp: new Date(),
    };

    // Save analysis to database
    const analysisCollection = db.collection(COLLECTIONS.INGREDIENT_ANALYSES);
    const result = await analysisCollection.insertOne({
      for_user: new ObjectId(userId),
      ...analysis,
    });

    return res.status(200).json({
      message: "Analysis confirmed successfully",
      analysis_id: result.insertedId,
      ...analysis,
    });
  } catch (error) {
    console.error("Confirm ingredient analysis error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  analyzeIngredientImage,
  confirmIngredientAnalysis,
};
