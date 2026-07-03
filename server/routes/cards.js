import express from 'express';
import Card from '../models/Card.js';
import { authMiddleware, isAdmin } from '../middleware/auth.js';
import { cardValidationRules, idValidationRules, searchValidationRules, validate } from '../middleware/validation.js';
import { Errors, asyncHandler, processDbError } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import { mongoConnected, fbFind, fbById, fbRandomChess } from '../utils/fallbackCards.js';

const router = express.Router();

/**
 * @route GET /api/cards
 * @desc Get all cards with optional filters
 * @access Public
 * @query {string} [color] - Filter by card color
 * @query {string} [rarity] - Filter by card rarity
 * @query {string} [chessPiece] - Filter by chess piece type
 * @query {string} [search] - Search cards by name
 * @returns {Array} Array of card objects
 */
router.get('/', searchValidationRules, validate, asyncHandler(async (req, res) => {
  const { color, rarity, chessPiece, search } = req.query;
  let query = {};

  // Build query filters
  if (color) {
    query.colors = color;
  }
  if (rarity) {
    query.rarity = rarity;
  }
  if (chessPiece && chessPiece !== 'all') {
    query.chessPiece = chessPiece;
  }
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  logger.debug('Fetching cards with query:', query);

  // No database? Serve the bundled JSON DB so the site still works.
  if (!mongoConnected()) {
    const cards = fbFind(req.query);
    logger.info(`Fetched ${cards.length} cards from JSON fallback (Mongo down)`);
    return res.json(cards);
  }

  try {
    const cards = await Card.find(query).sort({ name: 1 }).limit(1000);
    logger.info(`Fetched ${cards.length} cards`);
    res.json(cards);
  } catch (error) {
    logger.error('Error fetching cards:', error);
    throw Errors.cardsFetchError();
  }
}));

/**
 * @route GET /api/cards/random/chess
 * @desc Get a random card with a chess piece designation
 * @access Public
 * @returns {object} Random chess card object
 */
router.get('/random/chess', asyncHandler(async (req, res) => {
  if (!mongoConnected()) {
    const c = fbRandomChess();
    if (!c) throw Errors.resourceNotFound('Chess card');
    return res.json(c);
  }
  try {
    // Get a random card that has a chessPiece designation (not 'none')
    const cards = await Card.aggregate([
      { $match: { chessPiece: { $ne: 'none' } } },
      { $sample: { size: 1 } }
    ]);

    if (cards.length === 0) {
      logger.warn('No chess cards found in database');
      throw Errors.resourceNotFound('Chess card');
    }

    logger.debug(`Random chess card selected: ${cards[0].name}`);
    res.json(cards[0]);
  } catch (error) {
    if (error.isOperational) throw error;
    logger.error('Error fetching random chess card:', error);
    throw Errors.cardsFetchError();
  }
}));

/**
 * @route GET /api/cards/:id
 * @desc Get a single card by ID
 * @access Public
 * @param {string} id - Card ID
 * @returns {object} Card object
 */
router.get('/:id', idValidationRules, validate, asyncHandler(async (req, res) => {
  if (!mongoConnected()) {
    const c = fbById(req.params.id);
    if (!c) throw Errors.cardNotFound();
    return res.json(c);
  }
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      logger.warn(`Card not found: ${req.params.id}`);
      throw Errors.cardNotFound();
    }

    logger.debug(`Card fetched: ${card.name}`);
    res.json(card);
  } catch (error) {
    if (error.isOperational) throw error;
    logger.error('Error fetching card:', error);
    throw processDbError(error, 'card');
  }
}));

/**
 * @route POST /api/cards
 * @desc Create a new card
 * @access Private (Admin only)
 * @body {object} Card data (validated by cardValidationRules)
 * @returns {object} Created card object
 */
router.post('/', authMiddleware, isAdmin, cardValidationRules, validate, asyncHandler(async (req, res) => {
  try {
    const card = new Card(req.body);
    const newCard = await card.save();

    logger.info(`Card created: ${newCard.name} (${newCard._id})`);
    res.status(201).json(newCard);
  } catch (error) {
    logger.error('Error creating card:', error);
    throw processDbError(error, 'card');
  }
}));

/**
 * @route PUT /api/cards/:id
 * @desc Update an existing card
 * @access Private (Admin only)
 * @param {string} id - Card ID
 * @body {object} Updated card data (validated by cardValidationRules)
 * @returns {object} Updated card object
 */
router.put('/:id', authMiddleware, isAdmin, idValidationRules, cardValidationRules, validate, asyncHandler(async (req, res) => {
  try {
    const card = await Card.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!card) {
      logger.warn(`Card not found for update: ${req.params.id}`);
      throw Errors.cardNotFound();
    }

    logger.info(`Card updated: ${card.name} (${card._id})`);
    res.json(card);
  } catch (error) {
    if (error.isOperational) throw error;
    logger.error('Error updating card:', error);
    throw processDbError(error, 'card');
  }
}));

/**
 * @route DELETE /api/cards/:id
 * @desc Delete a card
 * @access Private (Admin only)
 * @param {string} id - Card ID
 * @returns {object} Success message
 */
router.delete('/:id', authMiddleware, isAdmin, idValidationRules, validate, asyncHandler(async (req, res) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);

    if (!card) {
      logger.warn(`Card not found for deletion: ${req.params.id}`);
      throw Errors.cardNotFound();
    }

    logger.info(`Card deleted: ${card.name} (${card._id})`);
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    if (error.isOperational) throw error;
    logger.error('Error deleting card:', error);
    throw Errors.cardsDeleteError();
  }
}));

/**
 * @route POST /api/cards/bulk
 * @desc Create multiple cards at once
 * @access Private (Admin only)
 * @body {Array} cards - Array of card objects (max 100)
 * @returns {object} Created cards and count
 */
router.post('/bulk', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
  if (!req.body.cards || !Array.isArray(req.body.cards)) {
    throw Errors.missingField('cards array');
  }

  if (req.body.cards.length > 100) {
    throw Errors.invalidAction('bulk create more than 100 cards');
  }

  try {
    const cards = await Card.insertMany(req.body.cards, { ordered: false });

    logger.info(`Bulk card creation: ${cards.length} cards created`);

    res.status(201).json({
      message: `Successfully created ${cards.length} cards`,
      cards
    });
  } catch (error) {
    // Handle partial success in bulk operations
    if (error.code === 11000) {
      const insertedCount = error.insertedDocs?.length || 0;
      logger.warn(`Bulk card creation partial success: ${insertedCount} cards created, some duplicates skipped`);

      if (insertedCount > 0) {
        return res.status(201).json({
          message: 'Some cards already exist. Duplicates were skipped.',
          insertedCount,
          cards: error.insertedDocs
        });
      }

      throw processDbError(error, 'card');
    }

    logger.error('Error creating cards in bulk:', error);
    throw Errors.cardsCreateError();
  }
}));

export default router;
