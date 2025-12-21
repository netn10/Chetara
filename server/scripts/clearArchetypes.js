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

async function clearArchetypes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all cards that have non-empty archetypes
    const cardsWithArchetypes = await Card.find({
      archetypes: { $exists: true, $ne: [] }
    });

    console.log(`Found ${cardsWithArchetypes.length} cards with archetypes`);

    if (cardsWithArchetypes.length === 0) {
      console.log('No cards have archetypes. Nothing to clear.');
      return;
    }

    console.log('\nCards with archetypes:');
    cardsWithArchetypes.forEach((card, index) => {
      console.log(`${index + 1}. ${card.name}: [${card.archetypes.join(', ')}]`);
    });

    // Clear all archetypes by setting to empty array
    const result = await Card.updateMany(
      {},
      { $set: { archetypes: [] } }
    );

    console.log(`\n✅ Successfully cleared archetypes`);
    console.log(`   - Matched: ${result.matchedCount} cards`);
    console.log(`   - Modified: ${result.modifiedCount} cards`);

    // Verify the update
    const verifyCards = await Card.find({
      archetypes: { $exists: true, $ne: [] }
    });

    console.log(`\n📊 Verification: ${verifyCards.length} cards still have archetypes`);
    if (verifyCards.length > 0) {
      console.log('   Cards that still have archetypes:');
      verifyCards.forEach((card) => {
        console.log(`   - ${card.name}: [${card.archetypes.join(', ')}]`);
      });
    } else {
      console.log('   ✅ All archetypes have been cleared successfully!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

clearArchetypes();
