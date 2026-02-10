const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/database");
const { COLLECTIONS, DB_NAMES } = require("../utils/constants");

const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      name: user.name,
      email: user.email,
      allergens: user.allergens || [],
    });
  } catch (error) {
    console.error("Get user info error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updateAllergens = async (req, res) => {
  try {
    const userId = req.user.id;
    const { Allergens } = req.body;

    if (!Allergens || !Array.isArray(Allergens)) {
      return res.status(400).json({ error: "Allergens must be an array" });
    }

    const db = getDatabase(DB_NAMES.ALLERGENIC);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { allergens: Allergens, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ message: "Allergens updated successfully" });
  } catch (error) {
    console.error("Update allergens error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getUserInfo,
  updateAllergens,
};
