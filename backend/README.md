# Allergen Scan Backend

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection and initialization
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic (signup, login, token refresh)
│   │   ├── userController.js    # User profile management
│   │   └── productController.js # Product scanning and history
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT token verification
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication endpoints
│   │   ├── userRoutes.js        # User endpoints
│   │   └── productRoutes.js     # Product endpoints
│   └── utils/
│       ├── allergenUtils.js     # Allergen detection logic
│       ├── constants.js         # App constants (allergens, DB names, collections)
│       └── tokenUtils.js        # JWT token generation and verification
├── .env                         # Environment variables
├── server.js                    # Main application entry point
├── package.json                 # Dependencies and scripts
└── app.js                       # (Legacy - can be deleted)
```

## Architecture Overview

### Components

- **server.js**: Express app configuration and route mounting
- **config/database.js**: MongoDB connection management with singleton pattern
- **controllers/**: Business logic handlers for routes
- **middleware/**: Authentication middleware for protected routes
- **routes/**: Express Router instances defining endpoints
- **utils/**: Helper functions and constants

### API Endpoints

#### Authentication
- `POST /signup` - Create new user account
- `POST /login` - Login and get access token
- `POST /token` - Refresh access token
- `DELETE /logout` - Logout and invalidate refresh token

#### User Management
- `GET /user/info` - Get user profile and allergens
- `POST /user/update_allergens` - Update user's allergen list

#### Product Scanning
- `GET /add/:barcode` - Scan and add product to history
- `GET /info/:barcode` - Get product information with allergen details
- `GET /recents` - Get last 3 scanned products
- `GET /history` - Get full product scan history

## Setup and Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`

3. Run the server:
   ```bash
   npm start
   ```

4. For development with auto-reload (requires nodemon):
   ```bash
   npm run dev
   ```

## Key Improvements

✅ **Separation of Concerns** - Controllers, routes, and middleware are organized separately
✅ **Better Maintainability** - Code is modular and easier to extend
✅ **Reusable Utilities** - Common functions abstracted into utility modules
✅ **Configuration Management** - Database connection and constants centralized
✅ **Error Handling** - Consistent error responses across all endpoints
✅ **Logging** - Better console logging for debugging
✅ **Graceful Shutdown** - Proper database connection cleanup on server termination
✅ **Standard Node Structure** - Follows Express.js best practices

## Environment Variables

```
ACCESS_TOKEN_SECRET=your_secret_key
REFRESH_TOKEN_SECRET=your_secret_key
CONNECTION_STRING_MONGO=mongodb://user:password@host:port/database
NODE_ENV=development
PORT=8000
HOST=0.0.0.0
```
