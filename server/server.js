import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cardRoutes from './routes/cards.js';
import authRoutes from './routes/auth.js';
import draftRoutes from './routes/draft.js';
import judgeTowerRoutes from './routes/judgeTower.js';
import sealedRoutes from './routes/sealed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-magic')
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/cards', cardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/judge-tower', judgeTowerRoutes);
app.use('/api/sealed', sealedRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Chess Magic API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

