require("dotenv").config()
const expr = require("express")
const { MongoClient, Admin, Collection, ObjectId } = require("mongodb")
const cors = require("cors")
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const connection = new MongoClient(process.env.CONNECTION_STRING_MONGO)
async function start() {
    await connection.connect()
}
start();

const server = expr()
server.use(cors())
server.use(expr.json())
server.use(cookieParser())

server.post("/signup", async (req, res) => {
    //api for sign-up
    if (req.body.name && req.body.email && req.body.password) {
        const db = connection.db("ALLERGENIC")
        const collection = db.collection("USERS")
        const result = await collection.find({ "email": req.body.email }).toArray()
        if (result.length > 0) {
            res.json({ error: "User Already Exists" })
        }
        else {
            await collection.insertOne({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            })
            res.status(200).json({ message: "User Created" })
        }
    }
    else {
        res.json({ message: "Enter all details" })
    }
})

server.post("/login", async (req, res) => {

    if (req.body.email && req.body.password) {

        const db = connection.db("ALLERGENIC")
        const collection = db.collection("USERS")
        const result = await collection.findOne({ "email": req.body.email, "password": req.body.password })

        if (result) {
            user = { id: result._id }
            const accessToken = generateAccessToken(user)
            const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" })
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            const collection2 = db.collection("REFRESH TOKENS")
            await collection2.insertOne({ token: refreshToken, userId: user.id });
            res.status(200).json({ accessToken: accessToken });
        }
        else {
            res.status(401).json({ error: "Wrong Credentials" })
        }
    }
    else {
        res.status(401).json({ error: "Wrong Credentials" })
    }
})

server.post("/token", async (req, res) => {

    const db = connection.db("ALLERGENIC")
    const collection = db.collection("REFRESH TOKENS")
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const tokenExists = await collection.findOne({ token: refreshToken })
    if (!tokenExists) return res.sendStatus(403);

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = generateAccessToken({ id: user.id })
        res.json({ accessToken: accessToken });
    })
})

server.delete("/logout", async (req, res) => {
    const token = req.body.token;
    const db = connection.db("ALLERGENIC")
    const collection = db.collection("REFRESH TOKENS")
    await collection.deleteOne({ token });
    res.sendStatus(200)
})


server.get("/user/info", authenticateToken, async (req, res) => {

    const db = connection.db("ALLERGENIC")
    const collection = db.collection("USERS")
    const userId = req.user.id
    const result = await collection.find({ _id: new ObjectId(userId) }).toArray()
    if (result.length > 0) {
        res.status(200).json({ name: result[0].name, email: result[0].email, allergens: result[0].allergens || [] })
    }
    else {
        res.sendStatus(404)
    }
})

const ALLERGEN_SYNONYMS = {
    milk: ['milk', 'whey', 'casein', 'lactose', 'milk-powder', 'skimmed-milk'],
    egg: ['egg', 'albumen', 'ovalbumin'],
    peanut: ['peanut', 'groundnut', 'peanut-oil'],
    gluten: ['gluten', 'wheat', 'barley', 'rye', 'malt'],
    soy: ['soy', 'soya', 'soybean'],
    almonds: ['almond', 'almond-paste'],
}

server.post("/update_allergens", authenticateToken, async (req, res) => {

    const db = connection.db("ALLERGENIC")
    const collection = db.collection("USERS")
    const userId = req.user.id
    await collection.updateOne({ _id: new ObjectId(userId) }, { $set: { allergens: req.body.Allergens } })
    res.sendStatus(200)
})

server.get("/add/:barcode", authenticateToken, async (req, res) => {

    const barcode = req.params.barcode
    const db = connection.db("ALLERGENIC")
    const collection = db.collection("USERS")
    const collection2 = db.collection("FOOD PRODUCTS")
    const userId = req.user.id
    const result = await collection.findOne({ _id: new ObjectId(userId) })
    const userAllergens = result.allergens || []
    try {
        const resp = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
        const data = await resp.json()
        if (data.status === 1) {
            const product = data.product
            const ingredientTags = product.ingredients_tags || []
            const normalizedIngredientTags = ingredientTags.map(tag =>
                tag.replace('en:', '').toLowerCase()
            )
            const foundAllergensSet = new Set()
            for (const allergen of userAllergens) {
                const keywords = ALLERGEN_SYNONYMS[allergen.toLowerCase()] || [allergen.toLowerCase()]
                if (keywords.some(word => normalizedIngredientTags.some(tag => tag.includes(word)))) {
                    foundAllergensSet.add(allergen)
                }
            }
            const foundAllergens = Array.from(foundAllergensSet)
            const ingredients = product.ingredients_text || ''
            const totalIngredients = normalizedIngredientTags.length
            const totalAllergens = foundAllergens.length
            const safe = (totalAllergens > 0) ? false : true;
            const product_data = {
                for_user: userId,
                product_barcode: barcode,
                product_name: product.product_name,
                ingredients_text: ingredients,
                ingredients_tags: normalizedIngredientTags,
                foundAllergens: foundAllergens,
                total_ingredients: totalIngredients,
                total_allergens: totalAllergens,
                safe: safe,
                image_url: product.image_front_url || null,
                timestamp: new Date()
            }
            await collection2.insertOne(product_data)
            res.status(200).send({ message: "ok" })
        } else {
            res.status(404).json({ error: "Product not found" })
            return null
        }
    } catch (err) {
        console.log("500 error")
        res.status(500).json({ error: "API error:" + err })
        return null;
    }
})

server.get("/info/:barcode", authenticateToken, async (req, res) => {

    const barcode = req.params.barcode
    const db = connection.db("ALLERGENIC")
    const collection = db.collection("FOOD PRODUCTS")
    const userId = req.user.id
    const product = await collection.findOne({ "product_barcode": barcode, for_user: userId }, { projection: { for_user: 0 } })
    if (product) {
        res.status(200).json(product)
    }
    else {
        res.status(404).json({ error: "No information about product found" })
    }
})

server.get("/recents", authenticateToken, async (req, res) => {

    const db = connection.db("ALLERGENIC")
    const collection = db.collection("FOOD PRODUCTS")
    const userId = req.user.id
    const products = await collection.find({ for_user: userId }, { projection: { product_name: 1, product_barcode: 1, total_allergens: 1, safe: 1 } }).sort({ timestamp: -1 }).limit(3).toArray()
    if (products.length > 0) {
        res.status(200).json(products)
    }
    else {
        res.status(404).json({ error: "No products found" })
    }
})

server.get("/info/history", authenticateToken, async (req, res) => {

    const db = connection.db("ALLERGENIC")
    const collection = db.collection("FOOD PRODUCTS")
    const userId = req.user.userId
    const products = await collection.find({ for_user: userId }, { projection: { product_name: 1, product_barcode: 1, total_allergens: 1, safe: 1 } }).sort({ timestamp: -1 }).toArray()
    if (products.length > 0) {
        res.status(200).json(products)
    }
    else {
        res.status(404).json({ error: "No products found" })
    }
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '0.5h' })
}

server.listen(8000, '0.0.0.0', () => {
    console.log("Server is connected and listening on port 8000")
})

process.on('SIGINT', async () => {
    console.log("\nClosing MongoDB connection...")
    await client.close()
    process.exit(0)
})