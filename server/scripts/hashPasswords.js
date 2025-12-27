import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '../../.env') });

import User from '../models/User.js';

async function hashExistingPasswords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-magic');
    console.log('✅ Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let updatedCount = 0;

    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log(`⏭️  User ${user.username} already has a hashed password`);
        continue;
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Update the user
      user.password = hashedPassword;
      await user.save();

      console.log(`✅ Hashed password for user: ${user.username}`);
      updatedCount++;
    }

    console.log(`\n✨ Successfully hashed ${updatedCount} passwords`);
    console.log(`⏭️  Skipped ${users.length - updatedCount} already hashed passwords`);

    await mongoose.connection.close();
    console.log('Connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
hashExistingPasswords();
