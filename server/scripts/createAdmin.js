import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-magic';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });

    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Username: admin');
      console.log('You can update the password if needed');
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123', // Simple password for development
      isAdmin: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('⚠️  Please change this password in production!');

  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createAdmin();
