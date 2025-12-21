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

async function updateSetToSet1() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all cards that don't have "Set 1" as their set
    const cardsToUpdate = await Card.find({
      set: { $ne: 'Set 1' }
    });

    console.log(`Found ${cardsToUpdate.length} cards with set other than "Set 1"`);

    if (cardsToUpdate.length === 0) {
      console.log('All cards already have "Set 1" as their set.');
      return;
    }

    // Group cards by their current set
    const setGroups = {};
    cardsToUpdate.forEach(card => {
      const setName = card.set || 'undefined';
      if (!setGroups[setName]) {
        setGroups[setName] = [];
      }
      setGroups[setName].push(card.name);
    });

    console.log('\nCards grouped by current set:');
    Object.keys(setGroups).forEach(setName => {
      console.log(`\n${setName} (${setGroups[setName].length} cards):`);
      setGroups[setName].forEach((cardName, index) => {
        console.log(`  ${index + 1}. ${cardName}`);
      });
    });

    // Update all cards to have "Set 1"
    const result = await Card.updateMany(
      {},
      { $set: { set: 'Set 1' } }
    );

    console.log(`\n✅ Successfully updated all cards to "Set 1"`);
    console.log(`   - Matched: ${result.matchedCount} cards`);
    console.log(`   - Modified: ${result.modifiedCount} cards`);

    // Verify the update
    const verifyCards = await Card.find({
      set: { $ne: 'Set 1' }
    });

    console.log(`\n📊 Verification: ${verifyCards.length} cards still have a set other than "Set 1"`);
    if (verifyCards.length > 0) {
      console.log('   Cards that still have different sets:');
      verifyCards.forEach((card) => {
        console.log(`   - ${card.name}: ${card.set}`);
      });
    } else {
      console.log('   ✅ All cards now have "Set 1" as their set!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

updateSetToSet1();
