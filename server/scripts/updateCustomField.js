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

async function updateCustomField() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all cards that are NOT from "Set 1"
    const cardsToUpdate = await Card.find({
      set: { $ne: 'Set 1' }
    });

    console.log(`Found ${cardsToUpdate.length} cards not from "Set 1"`);

    if (cardsToUpdate.length === 0) {
      console.log('No cards to update.');
      return;
    }

    console.log('\nCards to be updated:');
    cardsToUpdate.forEach((card, index) => {
      console.log(`${index + 1}. ${card.name} (Set: ${card.set}, Current custom: ${card.custom})`);
    });

    // Update all cards not from "Set 1" to have custom: false
    const result = await Card.updateMany(
      { set: { $ne: 'Set 1' } },
      { $set: { custom: false } }
    );

    console.log(`\n✅ Successfully updated ${result.modifiedCount} cards`);
    console.log(`   - Matched: ${result.matchedCount} cards`);
    console.log(`   - Modified: ${result.modifiedCount} cards`);

    // Verify the update
    const verifyCards = await Card.find({
      set: { $ne: 'Set 1' }
    });

    console.log('\n📊 Verification:');
    verifyCards.forEach((card) => {
      console.log(`   ${card.name}: custom = ${card.custom} (Set: ${card.set})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

updateCustomField();
