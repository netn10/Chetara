import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Simple in-memory session storage (for development only)
const sessions = new Map();

// Generate simple session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Simple password check (plain text - for development only)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Create session
    const sessionId = generateSessionId();
    sessions.set(sessionId, {
      userId: user._id,
      username: user.username,
      isAdmin: user.isAdmin
    });

    res.json({
      sessionId,
      user: {
        username: user.username,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  const { sessionId } = req.body;

  if (sessionId) {
    sessions.delete(sessionId);
  }

  res.json({ message: 'Logged out successfully' });
});

// Verify session route
router.post('/verify', (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(401).json({ message: 'No session ID provided' });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ message: 'Invalid session' });
  }

  res.json({
    user: {
      username: session.username,
      isAdmin: session.isAdmin
    }
  });
});

// Get current user
router.get('/me', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');

  if (!sessionId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ message: 'Invalid session' });
  }

  res.json({
    user: {
      username: session.username,
      isAdmin: session.isAdmin
    }
  });
});

export default router;
