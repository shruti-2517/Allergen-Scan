# AllergenScan – Smart Allergen Detection Web App

AllergenScan is a MERN stack web application that helps users **scan food product barcodes**, **identify allergens** in ingredients, and **track personal food safety**. Users can sign up, select allergens, scan products, and receive instant feedback on whether a product is safe for them to consume.

Whether you are allergic to gluten, dairy, nuts, or any combination of ingredients, AllergenScan helps you stay safe and informed while shopping or eating.

---

## 🎯 Problem Statement

Food allergies can be life-threatening, yet ingredient labels are often long, complex, and vary across brands. This app aims to solve this by:

- Letting users **specify their allergens**.
- **Scanning food barcodes** to instantly analyze product ingredients.
- Informing users **whether a product is safe** for them based on detected allergens.
- Storing a **scan history** for tracking what products were checked.

---

## 🧠 Key Features

### ✅ Allergen Profile
- Users can select allergens from a **predefined checklist** (like peanuts, soy, dairy, gluten, etc.).
- These preferences are stored and used in every product scan.

### 📷 Barcode Scanner
- Use your phone or laptop camera to scan a barcode.
- App fetches product details (e.g., from OpenFoodFacts API).
- Extracts and parses the ingredient list.

### 🧪 Allergen Detection
- The app checks the scanned ingredients **against the user's selected allergens**.
- Highlights if any allergens are present and **marks the product as SAFE or UNSAFE**.

### 🕓 Recents / Scan History
- Shows the **latest scanned products** in a scrollable/swipeable card layout.
- Displays allergen detection summary for each item.

### 👤 User Authentication
- Sign up and log in with email and password (no third-party login).
- Uses JWT-based access/refresh token system.
- Stores user profile and preferences securely.

---

## 🛠️ Tech Stack

### Frontend
- React.js
- React Bootstrap (for mobile-friendly UI)
- React Router
- `react-qr-barcode-scanner` for barcode reading
- Custom swipeable cards and UI logic

### Backend
- Express.js
- MongoDB
- bcrypt (for password hashing)
- JWT (for token-based authentication)
- Cookie-parser (to handle refresh tokens)
- OpenFoodFacts API integration

---
