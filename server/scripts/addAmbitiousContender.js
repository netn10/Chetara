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

async function addCard() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const cardData = {
      name: 'Ambitious Contender',
      manaCost: '{0}', // 0-cost artifact creature
      type: 'Artifact Creature',
      subtype: 'Pawn',
      power: 2,
      toughness: 1,
      text: '(When this Pawn enters, you may link a Pawn you control on the chess board with it. When this leaves, that chess piece also leaves and vice versa. Whenever this creature deals combat damage to a player, you may also move the linked chess piece on the chess board.)\nWhenever this creature deals combat damage to a player, replace it on the chess board with a Queen, then put two +1/+1 counter her.',
      colors: [], // Artifact (colorless)
      rarity: 'Rare',
      custom: true,
      imageUrl: 'https://i.imgur.com/mnbXSTL.jpeg',
      artist: 'SPEARMINTAII',
      set: '2025 MTG',
      chessPiece: 'pawn',
      archetypes: ['Chess', 'Artifacts', 'Counters']
    };

    console.log('Adding card to database...');
    const card = await Card.create(cardData);
    console.log('Card added successfully:', card.name);
    console.log('Card ID:', card._id);

  } catch (error) {
    console.error('Error adding card:', error.message);
    if (error.code === 11000) {
      console.error('Card with this name already exists in the database');
    }
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

addCard();
