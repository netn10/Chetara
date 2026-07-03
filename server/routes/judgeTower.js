import express from 'express';
import JudgeTower from '../models/JudgeTower.js';
import Card from '../models/Card.js';
import { Errors, asyncHandler, processDbError } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import { mongoConnected, fbFind } from '../utils/fallbackCards.js';

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
 * @route POST /api/judgetower/create
 * @desc Create a new Judge Tower game
 * @access Public
 * @body {string} playerName - Name of the player creating the game
 * @returns {object} Created Judge Tower game object
 */
router.post('/create', asyncHandler(async (req, res) => {
  const { playerName } = req.body;

  if (!playerName) {
    throw Errors.missingField('playerName');
  }

  logger.info(`Creating new Judge Tower game for player: ${playerName}`);

  // Get all cards for the cube (library) — Mongo when connected, else JSON DB.
  const allCards = mongoConnected() ? await Card.find({}) : fbFind({});

  if (allCards.length === 0) {
    throw Errors.cardsInsufficient();
  }

  // Shuffle the cards
  const shuffledCards = shuffleArray(allCards.map(c => c._id));

  // Create initial player
  const players = [{
    id: generatePlayerId(),
    name: playerName,
    isConnected: true,
    points: 0,
    life: 20,
    hand: [],
    permanents: [],
    activatedAbilitiesThisTurn: []
  }];

  try {
    const judgeTower = new JudgeTower({
      players,
      library: shuffledCards,
      graveyard: [],
      exile: [],
      status: 'waiting'
    });

    await judgeTower.save();
    logger.info(`Judge Tower game created with ID: ${judgeTower._id}`);
    res.status(201).json(judgeTower);
  } catch (error) {
    logger.error('Error creating Judge Tower game:', error);
    throw processDbError(error, 'Judge Tower game');
  }
}));

/**
 * @route POST /api/judgetower/:id/join
 * @desc Join an existing Judge Tower game
 * @access Public
 * @param {string} id - Judge Tower game ID
 * @body {string} playerName - Name of the joining player
 * @returns {object} Updated game and player ID
 */
router.post('/:id/join', asyncHandler(async (req, res) => {
  const { playerName } = req.body;

  if (!playerName) {
    throw Errors.missingField('playerName');
  }

  const game = await JudgeTower.findById(req.params.id);

  if (!game) {
    throw Errors.gameNotFound();
  }

  if (game.status !== 'waiting') {
    throw Errors.gameAlreadyStarted();
  }

  const newPlayer = {
    id: generatePlayerId(),
    name: playerName,
    isConnected: true,
    points: 0,
    life: 20,
    hand: [],
    permanents: [],
    activatedAbilitiesThisTurn: []
  };

  game.players.push(newPlayer);

  try {
    await game.save();
    logger.info(`Player ${playerName} joined Judge Tower game ${game._id}`);
    res.json({ game, playerId: newPlayer.id });
  } catch (error) {
    logger.error('Error joining Judge Tower game:', error);
    throw processDbError(error, 'Judge Tower game');
  }
}));

/**
 * @route POST /api/judgetower/:id/start
 * @desc Start the Judge Tower game
 * @access Public
 * @param {string} id - Judge Tower game ID
 * @returns {object} Updated game object
 */
router.post('/:id/start', asyncHandler(async (req, res) => {
  const game = await JudgeTower.findById(req.params.id);

  if (!game) {
    throw Errors.gameNotFound();
  }

  if (game.players.length < 1) {
    throw Errors.insufficientPlayers(1);
  }

  game.status = 'playing';
  game.currentRound = 1;
  game.currentPlayerIndex = 0;
  game.currentPhase = 'untap';

  try {
    await game.save();
    logger.info(`Judge Tower game ${game._id} started with ${game.players.length} players`);
    res.json(game);
  } catch (error) {
    logger.error('Error starting Judge Tower game:', error);
    throw processDbError(error, 'Judge Tower game');
  }
}));

/**
 * @route GET /api/judgetower/:id
 * @desc Get Judge Tower game status
 * @access Public
 * @param {string} id - Judge Tower game ID
 * @returns {object} Game object with populated data
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const game = await JudgeTower.findById(req.params.id)
    .populate('library')
    .populate('graveyard')
    .populate('exile')
    .populate('players.hand')
    .populate('players.permanents');

  if (!game) {
    throw Errors.gameNotFound();
  }

  res.json(game);
}));

/**
 * @route POST /api/judgetower/:id/draw
 * @desc Draw a card from the shared library
 * @access Public
 * @param {string} id - Judge Tower game ID
 * @body {string} playerId - Player ID drawing the card
 * @returns {object} Updated game object
 */
router.post('/:id/draw', asyncHandler(async (req, res) => {
  const { playerId } = req.body;

  if (!playerId) {
    throw Errors.missingField('playerId');
  }

  const game = await JudgeTower.findById(req.params.id);

  if (!game) {
    throw Errors.gameNotFound();
  }

  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    throw Errors.playerNotFound();
  }

  if (game.library.length === 0) {
    throw Errors.libraryEmpty();
  }

  // Draw from top of library
  const drawnCard = game.library.shift();
  player.hand.push(drawnCard);

  game.gameLog.push(`${player.name} drew a card`);
  game.updatedAt = Date.now();

  try {
    await game.save();
    logger.info(`Player ${player.name} drew a card in game ${game._id}`);
    res.json(game);
  } catch (error) {
    logger.error('Error drawing card:', error);
    throw processDbError(error, 'Judge Tower game');
  }
}));

/**
 * @route POST /api/judgetower/:id/play
 * @desc Play a card from hand
 * @access Public
 * @param {string} id - Judge Tower game ID
 * @body {string} playerId - Player ID playing the card
 * @body {string} cardId - Card ID to play
 * @returns {object} Updated game object
 */
router.post('/:id/play', asyncHandler(async (req, res) => {
  const { playerId, cardId } = req.body;

  if (!playerId || !cardId) {
    throw Errors.missingField('playerId and cardId');
  }

  const game = await JudgeTower.findById(req.params.id).populate('players.hand');

  if (!game) {
    throw Errors.gameNotFound();
  }

  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    throw Errors.playerNotFound();
  }

  const cardIndex = player.hand.findIndex(c => c._id.toString() === cardId);
  if (cardIndex === -1) {
    throw Errors.cardNotInHand();
  }

  const card = player.hand[cardIndex];

  // Remove from hand
  player.hand.splice(cardIndex, 1);

  // Determine destination based on card type
  if (card.type.includes('Instant') || card.type.includes('Sorcery')) {
    // Instants and sorceries go to graveyard after resolution
    game.graveyard.push(card._id);
    game.gameLog.push(`${player.name} cast ${card.name} (goes to graveyard)`);
  } else {
    // Permanents go to battlefield
    player.permanents.push(card._id);
    game.gameLog.push(`${player.name} played ${card.name}`);
  }

  game.updatedAt = Date.now();

  try {
    await game.save();
    logger.info(`Player ${player.name} played ${card.name} in game ${game._id}`);
    res.json(game);
  } catch (error) {
    logger.error('Error playing card:', error);
    throw processDbError(error, 'Judge Tower game');
  }
}));

/**
 * @route POST /api/judgetower/:id/next-phase
 * @desc Advance to the next game phase
 * @access Public
 * @param {string} id - Judge Tower game ID
 * @returns {object} Updated game object
 */
router.post('/:id/next-phase', asyncHandler(async (req, res) => {
  const game = await JudgeTower.findById(req.params.id);

  if (!game) {
    throw Errors.gameNotFound();
  }

  const phaseOrder = ['untap', 'upkeep', 'draw', 'main1', 'combat_begin', 'attackers', 'blockers', 'damage', 'combat_end', 'main2', 'end', 'cleanup', 'chess'];
  const currentIndex = phaseOrder.indexOf(game.currentPhase);

  if (currentIndex === phaseOrder.length - 1) {
    // End of turn - move to next player
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    game.currentPhase = 'untap';

    // Reset life to 20 for all players
    game.players.forEach(player => {
      player.life = 20;
      player.activatedAbilitiesThisTurn = [];
    });

    game.gameLog.push(`Turn ${game.currentPlayerIndex + 1}: ${game.players[game.currentPlayerIndex].name}'s turn`);
  } else {
    game.currentPhase = phaseOrder[currentIndex + 1];
    game.gameLog.push(`Phase: ${game.currentPhase}`);
  }

  game.updatedAt = Date.now();

  try {
    await game.save();
    logger.debug(`Advanced to phase ${game.currentPhase} in game ${game._id}`);
    res.json(game);
  } catch (error) {
    logger.error('Error advancing phase:', error);
    throw processDbError(error, 'Judge Tower game');
  }
}));

/**
 * @route POST /api/judgetower/:id/end-round
 * @desc End the current round (someone won or rules violation)
 * @access Public
 * @param {string} id - Judge Tower game ID
 * @body {string} winnerId - ID of the winning player
 * @body {string} reason - Reason for ending the round
 * @returns {object} Updated game object
 */
router.post('/:id/end-round', asyncHandler(async (req, res) => {
  const { winnerId, reason } = req.body;

  const game = await JudgeTower.findById(req.params.id);

  if (!game) {
    throw Errors.gameNotFound();
  }

  const winner = game.players.find(p => p.id === winnerId);
  if (winner) {
    winner.points++;
    game.roundWinner = winnerId;
    game.gameLog.push(`Round ${game.currentRound} won by ${winner.name}! ${reason || ''}`);
    logger.info(`Round ${game.currentRound} won by ${winner.name} in game ${game._id}`);
  } else {
    game.gameLog.push(`Round ${game.currentRound} ended: ${reason || 'Rules violation'}`);
    logger.info(`Round ${game.currentRound} ended in game ${game._id}: ${reason || 'Rules violation'}`);
  }

  game.status = 'round_end';

  // Check if game is complete
  if (game.isGameComplete()) {
    game.status = 'completed';
    const gameWinner = game.getWinner();
    if (gameWinner) {
      game.gameLog.push(`GAME OVER! Winner: ${gameWinner.name} with ${gameWinner.points} points!`);
      logger.info(`Game ${game._id} completed! Winner: ${gameWinner.name}`);
    }
  }

  game.updatedAt = Date.now();

  try {
    await game.save();
    res.json(game);
  } catch (error) {
    logger.error('Error ending round:', error);
    throw processDbError(error, 'Judge Tower game');
  }
}));

/**
 * @route POST /api/judgetower/:id/next-round
 * @desc Start the next round
 * @access Public
 * @param {string} id - Judge Tower game ID
 * @returns {object} Updated game object
 */
router.post('/:id/next-round', asyncHandler(async (req, res) => {
  const game = await JudgeTower.findById(req.params.id);

  if (!game) {
    throw Errors.gameNotFound();
  }

  if (game.isGameComplete()) {
    throw Errors.gameCompleted();
  }

  game.startNewRound();
  game.status = 'playing';
  game.gameLog.push(`Starting Round ${game.currentRound}`);

  game.updatedAt = Date.now();

  try {
    await game.save();
    logger.info(`Started round ${game.currentRound} in game ${game._id}`);
    res.json(game);
  } catch (error) {
    logger.error('Error starting next round:', error);
    throw processDbError(error, 'Judge Tower game');
  }
}));

export default router;
