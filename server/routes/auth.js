import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { loginValidationRules, validate } from '../middleware/validation.js';
import { authMiddleware } from '../middleware/auth.js';
import { Errors, asyncHandler, sendErrorResponse } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Generate JWT token for authenticated user
 * @param {object} user - User object from database
 * @returns {string} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      isAdmin: user.isAdmin
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.SESSION_EXPIRY || '7d' }
  );
}

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT token
 * @access Public
 * @body {string} username - User's username
 * @body {string} password - User's password
 * @returns {object} Token and user information
 */
router.post('/login', loginValidationRules, validate, asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  logger.info(`Login attempt for user: ${username}`);

  // Find user
  const user = await User.findOne({ username });

  if (!user) {
    logger.warn(`Login failed - user not found: ${username}`);
    throw Errors.invalidCredentials();
  }

  // Check password with bcrypt
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    logger.warn(`Login failed - invalid password for user: ${username}`);
    throw Errors.invalidCredentials();
  }

  // Generate JWT token
  const token = generateToken(user);

  logger.info(`Login successful for user: ${username}`);

  res.json({
    token,
    user: {
      username: user.username,
      isAdmin: user.isAdmin
    }
  });
}));

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Public
 * @returns {object} Success message
 */
router.post('/logout', (req, res) => {
  logger.info('User logged out');
  res.json({ message: 'Logged out successfully' });
});

/**
 * @route POST /api/auth/verify
 * @desc Verify JWT token and return user data
 * @access Public
 * @body {string} token - JWT token to verify
 * @returns {object} User information if token is valid
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw Errors.tokenMissing();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn(`Token verification failed - user not found: ${decoded.userId}`);
      throw Errors.userNotFound();
    }

    logger.debug(`Token verified for user: ${user.username}`);

    res.json({
      user: {
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token verification failed - token expired');
      throw Errors.tokenExpired();
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Token verification failed - invalid token');
      throw Errors.tokenInvalid();
    }
    throw error;
  }
}));

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user's information
 * @access Private
 * @returns {object} Current user's information
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password');

  if (!user) {
    throw Errors.userNotFound();
  }

  res.json({
    user: {
      username: user.username,
      isAdmin: user.isAdmin
    }
  });
}));

/**
 * @route POST /api/auth/register
 * @desc Register a new user account
 * @access Public
 * @body {string} username - Desired username
 * @body {string} password - Desired password
 * @returns {object} Token and new user information
 */
router.post('/register', loginValidationRules, validate, asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  logger.info(`Registration attempt for username: ${username}`);

  // Check if user already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    logger.warn(`Registration failed - username already exists: ${username}`);
    throw Errors.missingField('username').constructor(
      'VALIDATION_DUPLICATE',
      400,
      'Username already exists',
      'Please choose a different username'
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const user = new User({
    username,
    password: hashedPassword,
    isAdmin: false
  });

  await user.save();

  // Generate token
  const token = generateToken(user);

  logger.info(`Registration successful for user: ${username}`);

  res.status(201).json({
    token,
    user: {
      username: user.username,
      isAdmin: user.isAdmin
    }
  });
}));

export default router;
