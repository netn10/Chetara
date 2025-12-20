import mongoose from 'mongoose';
import Card from '../models/Card.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-magic';

async function verifyCard() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const card = await Card.findOne({ name: 'Ambitious Contender' });

    if (card) {
      console.log('\n✅ Card found in database:');
      console.log('----------------------------');
      console.log(`Name: ${card.name}`);
      console.log(`Mana Cost: ${card.manaCost}`);
      console.log(`Type: ${card.type}${card.subtype ? ' — ' + card.subtype : ''}`);
      console.log(`Power/Toughness: ${card.power}/${card.toughness}`);
      console.log(`Rarity: ${card.rarity}`);
      console.log(`Chess Piece: ${card.chessPiece}`);
      console.log(`Set: ${card.set}`);
      console.log(`Artist: ${card.artist}`);
      console.log(`Image URL: ${card.imageUrl}`);
      console.log(`\nCard Text:\n${card.text}`);
      console.log('----------------------------');
    } else {
      console.log('❌ Card not found in database');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

verifyCard();
