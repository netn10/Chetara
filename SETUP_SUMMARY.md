# Chess Magic Website - Setup Summary

I've set up the MongoDB database integration and Cards page for your Chess Magic website. Here's what has been done:

## What's Been Set Up

### 1. Database Schema
Updated the Card model (`server/models/Card.js`) to match your specifications:
- All fields from your example schema are now included
- Colors use MTG standard notation (W, U, B, R, G)
- Added: `loyalty`, `custom`, `archetypes`, `set`, `notes` fields
- Compatible with your provided schema example

### 2. Database Population Script
Created `server/scripts/populateCards.js` that:
- Scans all color folders (Black, Blue, Colorless, Gold, Green, Land, Red, White)
- Finds all PNG/JPG card images (180 cards total)
- Creates database entries with:
  - Card names extracted from filenames
  - Placeholder mana costs and text (you'll need to update these)
  - Appropriate colors based on folder
  - Local file paths for images

### 3. Updated Frontend
Modified `src/pages/Cards.jsx` to:
- Work with new color notation (W, U, B, R, G)
- Display cards from the database
- Support filtering by color, rarity, chess piece
- Include search functionality

### 4. Documentation
Created comprehensive setup guides:
- `DATABASE_SETUP.md` - Complete setup and usage instructions
- This summary file

## Next Steps

### Required: Start MongoDB

You have two options:

#### Option A: Local MongoDB (Recommended for Development)
1. Install MongoDB Community Edition:
   - Download from: https://www.mongodb.com/try/download/community
   - Or use package manager:
     - Windows: `winget install MongoDB.Server`
     - Mac: `brew install mongodb-community`
2. Start MongoDB service:
   - Windows: MongoDB should start automatically, or run `net start MongoDB`
   - Mac: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

#### Option B: MongoDB Atlas (Cloud - Recommended for Production)
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier available)
3. Get your connection string
4. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chess-magic
   ```

### Once MongoDB is Running

1. **Populate the database:**
   ```bash
   cd Website
   npm run populate
   ```

   This will scan your card folders and create 180 database entries.

2. **Start the development server:**
   ```bash
   npm run dev
   ```

   This starts both the backend (port 5000) and frontend (port 5173).

3. **View your cards:**
   Open http://localhost:5173/cards in your browser

## Important Notes

### Placeholder Data
The population script creates cards with placeholder data:
- **Mana costs**: Generic placeholders based on colors
- **Card text**: "Card text to be added."
- **Power/Toughness**: All creatures default to 2/2
- **Card types**: Basic detection based on card name

You'll need to update these with real card data. See DATABASE_SETUP.md for update methods.

### Image URLs
Currently using local file paths. For web display, you'll need to either:
1. Upload images to a CDN/web host and update `imageUrl` fields
2. Configure backend to serve images statically
3. Use a service like Imgur (as in your example schema)

### Rarity Distribution
The script randomly assigns rarities for now. You should update these based on your actual card rarities.

## File Structure

```
Website/
├── server/
│   ├── models/
│   │   └── Card.js              # MongoDB schema (updated)
│   ├── routes/
│   │   └── cards.js             # API endpoints
│   ├── scripts/
│   │   └── populateCards.js     # Population script (new)
│   └── server.js                # Express server
├── src/
│   └── pages/
│       └── Cards.jsx            # Cards page (updated)
├── .env                         # MongoDB configuration
├── package.json                 # Added 'populate' script
├── DATABASE_SETUP.md            # Setup guide (new)
└── SETUP_SUMMARY.md            # This file (new)
```

## API Endpoints Available

- `GET /api/cards` - Get all cards with optional filters
- `GET /api/cards/:id` - Get single card
- `POST /api/cards` - Create new card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `POST /api/cards/bulk` - Bulk create cards

## Quick Start Commands

```bash
# 1. Install dependencies (if not already done)
cd Website
npm install

# 2. Make sure MongoDB is running (see options above)

# 3. Populate database
npm run populate

# 4. Start development server
npm run dev

# 5. Open in browser
# http://localhost:5173
```

## Need Help?

See `DATABASE_SETUP.md` for:
- Detailed setup instructions
- Troubleshooting common issues
- How to update card data
- API usage examples

## Summary

Your Chess Magic website now has:
- ✅ MongoDB database integration
- ✅ Card schema matching your specifications
- ✅ Database population script
- ✅ Functional Cards page with filtering
- ✅ RESTful API for card management
- ✅ Found 180 cards across all color folders

Just need to start MongoDB and run `npm run populate` to get started!
