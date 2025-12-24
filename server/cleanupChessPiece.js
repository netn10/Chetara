import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Card from './models/Card.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

async function cleanupChessPiece() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-magic');
    console.log('✅ MongoDB connected successfully');

    // Find and remove chessPiece field where it's an empty string
    const result = await Card.updateMany(
      { chessPiece: "" },
      { $unset: { chessPiece: "" } }
    );

    console.log(`\n🔧 Cleanup completed!`);
    console.log(`   Modified ${result.modifiedCount} card(s)`);
    console.log(`   Matched ${result.matchedCount} card(s) with empty chessPiece\n`);

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupChessPiece();
