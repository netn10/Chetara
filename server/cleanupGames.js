import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Draft from './models/Draft.js';
import Sealed from './models/Sealed.js';

dotenv.config();

async function cleanupGames() {
  try {
    // Connect to LOCAL MongoDB instance for localhost:3000 dev server
    const mongoUri = 'mongodb://localhost:27017/chess-magic';

    console.log('Connecting to:', mongoUri);

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');
    console.log('Database name:', mongoose.connection.db.databaseName);

    // List all databases
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    console.log('\nAvailable databases:');
    databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Check what's in the database
    const draftCount = await Draft.countDocuments();
    const sealedCount = await Sealed.countDocuments();
    console.log(`\nFound ${draftCount} draft(s) and ${sealedCount} sealed game(s)`);

    if (draftCount === 0 && sealedCount === 0) {
      console.log('\n⚠️  No games found via models. Checking collections directly...');

      // List all collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('\nAvailable collections:', collections.map(c => c.name).join(', '));

      // Check drafts collection directly
      const draftsCollection = mongoose.connection.db.collection('drafts');
      const directDraftCount = await draftsCollection.countDocuments();
      console.log(`\nDirect drafts collection count: ${directDraftCount}`);

      // Try to find specific game IDs from the UI
      const testIds = [
        '694f1252b5b3333023704c7b',
        '694e72d25a3b41f81b055811',
        '694d33653e8ac01a3411ec18'
      ];

      console.log('\nSearching for specific game IDs from UI:');
      for (const id of testIds) {
        try {
          const ObjectId = mongoose.Types.ObjectId;
          const game = await draftsCollection.findOne({ _id: new ObjectId(id) });
          if (game) {
            console.log(`  ✅ Found game ${id}`);
          } else {
            console.log(`  ❌ Game ${id} not found`);
          }
        } catch (err) {
          console.log(`  ❌ Error searching ${id}: ${err.message}`);
        }
      }

      // Check sealeds collection directly
      const sealedsCollection = mongoose.connection.db.collection('sealeds');
      const directSealedCount = await sealedsCollection.countDocuments();
      console.log(`\nDirect sealeds collection count: ${directSealedCount}`);

      if (directDraftCount > 0 || directSealedCount > 0) {
        console.log('\n⚠️  Collections have documents but models can\'t find them!');
        console.log('This might be a schema or model configuration issue.');
      }
    }

    // Delete all drafts
    const draftResult = await Draft.deleteMany({});
    console.log(`\nDeleted ${draftResult.deletedCount} draft(s)`);

    // Delete all sealed games
    const sealedResult = await Sealed.deleteMany({});
    console.log(`Deleted ${sealedResult.deletedCount} sealed game(s)`);

    console.log('\nCleanup complete!');

    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupGames();
