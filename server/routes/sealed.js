import express from 'express';
import Sealed from '../models/Sealed.js';
import Card from '../models/Card.js';
import { Errors, asyncHandler, processDbError } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Generate a unique player ID
 * @returns {string} Unique player identifier
 */
function generatePlayerId() {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a booster pack with rarity distribution
 * @param {number} count - Number of cards in the booster
 * @returns {Promise<Array>} Array of card objects
 */
async function generateBooster(count = 15) {
  try {
    // Play booster distribution: 10-11 commons, 3-4 uncommons, 1 rare/mythic
    const commons = await Card.aggregate([
      { $match: { rarity: 'Common' } },
      { $sample: { size: 10 } }
    ]);

    const uncommons = await Card.aggregate([
      { $match: { rarity: 'Uncommon' } },
      { $sample: { size: 3 } }
    ]);

    const isMythic = Math.random() < 0.125;
    const rareCards = await Card.aggregate([
      { $match: { rarity: isMythic ? 'Mythic' : 'Rare' } },
      { $sample: { size: 1 } }
    ]);

    const totalCards = commons.length + uncommons.length + rareCards.length;
    if (totalCards < count) {
      const extraCommons = await Card.aggregate([
        { $match: { rarity: 'Common', _id: { $nin: commons.map(c => c._id) } } },
        { $sample: { size: count - totalCards } }
      ]);
      commons.push(...extraCommons);
    }

    return shuffleArray([...commons, ...uncommons, ...rareCards]);
  } catch (error) {
    logger.error('Error generating booster:', error);
    throw error;
  }
}

/**
 * @route POST /api/sealed/create
 * @desc Create a new sealed event
 * @access Public
 * @body {string} playerName - Name of the player creating the event
 * @body {number} [packsPerPlayer=6] - Number of packs per player
 * @returns {object} Created sealed event object
 */
router.post('/create', asyncHandler(async (req, res) => {
  const { playerName, packsPerPlayer = 6 } = req.body;

  if (!playerName) {
    throw Errors.missingField('playerName');
  }

  logger.info(`Creating new sealed event for player: ${playerName}`);

  const players = [{
    id: generatePlayerId(),
    name: playerName,
    isConnected: true,
    pool: [],
    deck: [],
    sideboard: [],
    deckBuilt: false
  }];

  try {
    const sealed = new Sealed({
      players,
      packsPerPlayer,
      status: 'waiting'
    });

    await sealed.save();
    logger.info(`Sealed event created with ID: ${sealed._id}`);
    res.status(201).json(sealed);
  } catch (error) {
    logger.error('Error creating sealed event:', error);
    throw processDbError(error, 'sealed event');
  }
}));

/**
 * @route POST /api/sealed/:id/join
 * @desc Join an existing sealed event
 * @access Public
 * @param {string} id - Sealed event ID
 * @body {string} playerName - Name of the joining player
 * @returns {object} Updated sealed event and player ID
 */
router.post('/:id/join', asyncHandler(async (req, res) => {
  const { playerName } = req.body;

  if (!playerName) {
    throw Errors.missingField('playerName');
  }

  const sealed = await Sealed.findById(req.params.id);

  if (!sealed) {
    throw Errors.sealedNotFound();
  }

  if (sealed.status !== 'waiting') {
    throw Errors.gameAlreadyStarted();
  }

  const newPlayer = {
    id: generatePlayerId(),
    name: playerName,
    isConnected: true,
    pool: [],
    deck: [],
    sideboard: [],
    deckBuilt: false
  };

  sealed.players.push(newPlayer);

  try {
    await sealed.save();
    logger.info(`Player ${playerName} joined sealed event ${sealed._id}`);
    res.json({ sealed, playerId: newPlayer.id });
  } catch (error) {
    logger.error('Error joining sealed event:', error);
    throw processDbError(error, 'sealed event');
  }
}));

/**
 * @route POST /api/sealed/:id/start
 * @desc Start sealed event and open packs for all players
 * @access Public
 * @param {string} id - Sealed event ID
 * @returns {object} Updated sealed event with player pools
 */
router.post('/:id/start', asyncHandler(async (req, res) => {
  const sealed = await Sealed.findById(req.params.id);

  if (!sealed) {
    throw Errors.sealedNotFound();
  }

  if (sealed.players.length < 1) {
    throw Errors.insufficientPlayers(1);
  }

  logger.info(`Starting sealed event ${sealed._id} with ${sealed.players.length} players`);

  try {
    // Generate packs for each player
    for (let player of sealed.players) {
      const pool = [];
      for (let i = 0; i < sealed.packsPerPlayer; i++) {
        const booster = await generateBooster(sealed.cardsPerPack);
        pool.push(...booster.map(c => c._id));
      }
      player.pool = pool;
      player.sideboard = [...pool]; // Initially all cards are in sideboard
    }

    sealed.status = 'building';
    sealed.updatedAt = Date.now();

    await sealed.save();

    // Populate and return
    const populatedSealed = await Sealed.findById(sealed._id)
      .populate('players.pool')
      .populate('players.deck')
      .populate('players.sideboard');

    logger.info(`Sealed event ${sealed._id} started successfully`);
    res.json(populatedSealed);
  } catch (error) {
    logger.error('Error starting sealed event:', error);
    if (error.message && error.message.includes('sample')) {
      throw Errors.cardsInsufficient();
    }
    throw processDbError(error, 'sealed event');
  }
}));

/**
 * @route GET /api/sealed/:id
 * @desc Get sealed event status
 * @access Public
 * @param {string} id - Sealed event ID
 * @returns {object} Sealed event object with populated data
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const sealed = await Sealed.findById(req.params.id)
    .populate('players.pool')
    .populate('players.deck')
    .populate('players.sideboard');

  if (!sealed) {
    throw Errors.sealedNotFound();
  }

  res.json(sealed);
}));

/**
 * @route POST /api/sealed/:id/update-deck
 * @desc Update a player's deck and sideboard
 * @access Public
 * @param {string} id - Sealed event ID
 * @body {string} playerId - Player ID
 * @body {Array} deck - Array of card IDs in the deck
 * @body {Array} sideboard - Array of card IDs in the sideboard
 * @returns {object} Updated sealed event
 */
router.post('/:id/update-deck', asyncHandler(async (req, res) => {
  const { playerId, deck, sideboard } = req.body;

  if (!playerId) {
    throw Errors.missingField('playerId');
  }

  const sealed = await Sealed.findById(req.params.id);

  if (!sealed) {
    throw Errors.sealedNotFound();
  }

  const player = sealed.players.find(p => p.id === playerId);
  if (!player) {
    throw Errors.playerNotFound();
  }

  player.deck = deck;
  player.sideboard = sideboard;
  player.deckBuilt = deck.length >= 40;

  sealed.updatedAt = Date.now();

  try {
    await sealed.save();

    // Populate before returning
    const populatedSealed = await Sealed.findById(sealed._id)
      .populate('players.pool')
      .populate('players.deck')
      .populate('players.sideboard');

    logger.info(`Player ${player.name} updated deck in sealed event ${sealed._id}`);
    res.json(populatedSealed);
  } catch (error) {
    logger.error('Error updating deck:', error);
    throw processDbError(error, 'sealed event');
  }
}));

/**
 * @route POST /api/sealed/:id/complete-deck
 * @desc Mark a player's deck as complete
 * @access Public
 * @param {string} id - Sealed event ID
 * @body {string} playerId - Player ID
 * @returns {object} Updated sealed event
 */
router.post('/:id/complete-deck', asyncHandler(async (req, res) => {
  const { playerId } = req.body;

  if (!playerId) {
    throw Errors.missingField('playerId');
  }

  const sealed = await Sealed.findById(req.params.id);

  if (!sealed) {
    throw Errors.sealedNotFound();
  }

  const player = sealed.players.find(p => p.id === playerId);
  if (!player) {
    throw Errors.playerNotFound();
  }

  if (player.deck.length < 40) {
    throw Errors.deckSizeInvalid(40);
  }

  player.deckBuilt = true;

  // Check if all players are ready
  const allReady = sealed.players.every(p => p.deckBuilt);
  if (allReady) {
    sealed.status = 'ready';
    logger.info(`All players ready in sealed event ${sealed._id}`);
  }

  sealed.updatedAt = Date.now();

  try {
    await sealed.save();

    // Populate before returning
    const populatedSealed = await Sealed.findById(sealed._id)
      .populate('players.pool')
      .populate('players.deck')
      .populate('players.sideboard');

    logger.info(`Player ${player.name} completed deck in sealed event ${sealed._id}`);
    res.json(populatedSealed);
  } catch (error) {
    logger.error('Error completing deck:', error);
    throw processDbError(error, 'sealed event');
  }
}));

export default router;
