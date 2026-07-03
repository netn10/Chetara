import express from 'express';
import Card from '../models/Card.js';
import { Errors, asyncHandler } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import { mongoConnected, fbFind, fbById } from '../utils/fallbackCards.js';

const router = express.Router();

// In-memory sealed events (no database). State is ephemeral — lost on restart.
const events = new Map();

function generatePlayerId() {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateSealedId() {
  return `sealed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// pool/deck/sideboard are stored as card ids; expand them to full card objects
// for the response (replaces Mongoose .populate()).
function populate(sealed) {
  return {
    ...sealed,
    players: sealed.players.map((p) => ({
      ...p,
      pool: (p.pool || []).map(fbById).filter(Boolean),
      deck: (p.deck || []).map(fbById).filter(Boolean),
      sideboard: (p.sideboard || []).map(fbById).filter(Boolean),
    })),
  };
}

// Random sample of `size` cards of a rarity, from Mongo when connected else the
// bundled JSON DB, so sealed works with no database.
async function sampleCards(rarity, size, excludeIds = []) {
  if (mongoConnected()) {
    const match = { rarity };
    if (excludeIds.length) match._id = { $nin: excludeIds };
    return Card.aggregate([{ $match: match }, { $sample: { size } }]);
  }
  let pool = fbFind({ rarity });
  if (excludeIds.length) pool = pool.filter((c) => !excludeIds.includes(c._id));
  return shuffleArray(pool).slice(0, size);
}

async function generateBooster(count = 15) {
  const commons = await sampleCards('Common', 10);
  const uncommons = await sampleCards('Uncommon', 3);
  const isMythic = Math.random() < 0.125;
  const rareCards = await sampleCards(isMythic ? 'Mythic' : 'Rare', 1);

  const totalCards = commons.length + uncommons.length + rareCards.length;
  if (totalCards < count) {
    const extraCommons = await sampleCards('Common', count - totalCards, commons.map((c) => c._id));
    commons.push(...extraCommons);
  }
  return shuffleArray([...commons, ...uncommons, ...rareCards]);
}

/** POST /api/sealed/create */
router.post('/create', asyncHandler(async (req, res) => {
  const { playerName, packsPerPlayer = 6 } = req.body;
  if (!playerName) throw Errors.missingField('playerName');

  const sealed = {
    _id: generateSealedId(),
    players: [{
      id: generatePlayerId(), name: playerName, isConnected: true,
      pool: [], deck: [], sideboard: [], deckBuilt: false,
    }],
    packsPerPlayer,
    cardsPerPack: 15,
    status: 'waiting',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  events.set(sealed._id, sealed);
  logger.info(`Sealed event created with ID: ${sealed._id}`);
  res.status(201).json(populate(sealed));
}));

/** POST /api/sealed/:id/join */
router.post('/:id/join', asyncHandler(async (req, res) => {
  const { playerName } = req.body;
  if (!playerName) throw Errors.missingField('playerName');

  const sealed = events.get(req.params.id);
  if (!sealed) throw Errors.sealedNotFound();
  if (sealed.status !== 'waiting') throw Errors.gameAlreadyStarted();

  const newPlayer = {
    id: generatePlayerId(), name: playerName, isConnected: true,
    pool: [], deck: [], sideboard: [], deckBuilt: false,
  };
  sealed.players.push(newPlayer);
  sealed.updatedAt = new Date();
  logger.info(`Player ${playerName} joined sealed event ${sealed._id}`);
  res.json({ sealed: populate(sealed), playerId: newPlayer.id });
}));

/** POST /api/sealed/:id/start */
router.post('/:id/start', asyncHandler(async (req, res) => {
  const sealed = events.get(req.params.id);
  if (!sealed) throw Errors.sealedNotFound();
  if (sealed.players.length < 1) throw Errors.insufficientPlayers(1);

  try {
    for (let player of sealed.players) {
      const pool = [];
      for (let i = 0; i < sealed.packsPerPlayer; i++) {
        const booster = await generateBooster(sealed.cardsPerPack);
        pool.push(...booster.map((c) => c._id));
      }
      player.pool = pool;
      player.sideboard = [...pool];
    }
    sealed.status = 'building';
    sealed.updatedAt = new Date();
    logger.info(`Sealed event ${sealed._id} started successfully`);
    res.json(populate(sealed));
  } catch (error) {
    logger.error('Error starting sealed event:', error);
    throw Errors.cardsInsufficient();
  }
}));

/** GET /api/sealed/:id */
router.get('/:id', asyncHandler(async (req, res) => {
  const sealed = events.get(req.params.id);
  if (!sealed) throw Errors.sealedNotFound();
  res.json(populate(sealed));
}));

/** POST /api/sealed/:id/update-deck */
router.post('/:id/update-deck', asyncHandler(async (req, res) => {
  const { playerId, deck, sideboard } = req.body;
  if (!playerId) throw Errors.missingField('playerId');

  const sealed = events.get(req.params.id);
  if (!sealed) throw Errors.sealedNotFound();

  const player = sealed.players.find((p) => p.id === playerId);
  if (!player) throw Errors.playerNotFound();

  player.deck = deck || [];
  player.sideboard = sideboard || [];
  player.deckBuilt = player.deck.length >= 40;
  sealed.updatedAt = new Date();
  logger.info(`Player ${player.name} updated deck in sealed event ${sealed._id}`);
  res.json(populate(sealed));
}));

/** POST /api/sealed/:id/complete-deck */
router.post('/:id/complete-deck', asyncHandler(async (req, res) => {
  const { playerId } = req.body;
  if (!playerId) throw Errors.missingField('playerId');

  const sealed = events.get(req.params.id);
  if (!sealed) throw Errors.sealedNotFound();

  const player = sealed.players.find((p) => p.id === playerId);
  if (!player) throw Errors.playerNotFound();
  if (player.deck.length < 40) throw Errors.deckSizeInvalid(40);

  player.deckBuilt = true;
  if (sealed.players.every((p) => p.deckBuilt)) {
    sealed.status = 'ready';
    logger.info(`All players ready in sealed event ${sealed._id}`);
  }
  sealed.updatedAt = new Date();
  logger.info(`Player ${player.name} completed deck in sealed event ${sealed._id}`);
  res.json(populate(sealed));
}));

export default router;
