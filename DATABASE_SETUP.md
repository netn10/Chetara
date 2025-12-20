# Chess Magic Database Setup

This guide explains how to set up and populate the MongoDB database for the Chess Magic website.

## Prerequisites

1. **MongoDB**: Make sure MongoDB is installed and running on your system
   - Download from: https://www.mongodb.com/try/download/community
   - Start MongoDB service before running the scripts

2. **Node.js**: Ensure Node.js is installed (v18 or higher recommended)

## Database Schema

The cards are stored in MongoDB with the following schema:

```javascript
{
  name: String (required, unique),
  manaCost: String (required),
  type: String (required),
  subtype: String,
  power: Number (null for non-creatures),
  toughness: Number (null for non-creatures),
  loyalty: Number (null for non-planeswalkers),
  text: String (required),
  colors: Array of Strings ['W', 'U', 'B', 'R', 'G'],
  rarity: String ['Common', 'Uncommon', 'Rare', 'Mythic'] (required),
  custom: Boolean (default: true),
  archetypes: Array of Strings,
  imageUrl: String,
  flavorText: String,
  artist: String,
  set: String (default: 'Set 1'),
  notes: String,
  chessPiece: String ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'none'],
  createdAt: Date
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd Website
npm install
```

### 2. Configure Environment Variables

The `.env` file should already be configured with:

```
MONGODB_URI=mongodb://localhost:27017/chess-magic
PORT=5000
```

If you're using a different MongoDB URI (e.g., MongoDB Atlas), update the `MONGODB_URI` value.

### 3. Populate the Database

Run the population script to scan the card image folders and create database entries:

```bash
npm run populate
```

This script will:
- Connect to MongoDB
- Clear any existing cards
- Scan the following folders for card images:
  - Black
  - Blue
  - Colorless
  - Gold
  - Green
  - Land
  - Red
  - White
- Create database entries for each card found (180 cards total)
- Use placeholder data for card text, mana costs, and other properties

**Note**: The initial population uses placeholder data. You'll need to update the card details (text, mana costs, power/toughness, etc.) with the actual card information.

### 4. Start the Development Server

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server (Vite) on http://localhost:5173

### 5. View the Cards

Open your browser and navigate to:
- http://localhost:5173/cards

You should see all 180 cards from the database with filtering options.

## Updating Card Data

The populate script creates cards with placeholder data. To update the cards with real data:

### Option 1: Manual Updates via MongoDB

Use MongoDB Compass or the mongo shell to update individual cards:

```javascript
db.cards.updateOne(
  { name: "Card Name" },
  {
    $set: {
      text: "Actual card text",
      manaCost: "{2}{B}{B}",
      power: 3,
      toughness: 4,
      // ... other fields
    }
  }
)
```

### Option 2: Create a Bulk Update Script

Create a JSON file with your card data and import it:

```javascript
// Example: server/scripts/updateCardData.js
import mongoose from 'mongoose';
import Card from '../models/Card.js';
import cardData from './cardData.json';

// Update cards with real data
for (const data of cardData) {
  await Card.updateOne(
    { name: data.name },
    { $set: data }
  );
}
```

### Option 3: Use the API

Send PUT requests to update individual cards:

```bash
curl -X PUT http://localhost:5000/api/cards/:id \
  -H "Content-Type: application/json" \
  -d '{"text": "Updated card text", ...}'
```

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/cards` - Get all cards (supports query filters)
- `GET /api/cards/:id` - Get a specific card
- `POST /api/cards` - Create a new card
- `PUT /api/cards/:id` - Update a card
- `DELETE /api/cards/:id` - Delete a card
- `POST /api/cards/bulk` - Bulk create cards

## Troubleshooting

### MongoDB Connection Error

If you see a connection error:
1. Make sure MongoDB is running: `mongod` or start the MongoDB service
2. Check that the port (27017) is not blocked
3. Verify the MONGODB_URI in `.env`

### Cards Not Showing

1. Check the browser console for errors
2. Verify the backend is running on port 5000
3. Make sure CORS is enabled (already configured in server.js)
4. Check that cards were populated: `mongo chess-magic` then `db.cards.count()`

### Image Paths

Currently, the populate script uses local file paths for images. To display images on the web:
1. Upload images to a web server or CDN
2. Update the `imageUrl` field for each card with the web URL
3. Or serve the images statically from the backend

## Next Steps

1. Update the placeholder card data with real card information
2. Upload card images to a web server or CDN
3. Update imageUrl fields to point to hosted images
4. Add more detailed archetypes and notes for each card
5. Consider adding card search/sort functionality
6. Add admin panel for easy card management
