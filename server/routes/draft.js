import express from 'express';
import Card from '../models/Card.js';
import { Errors, asyncHandler, processDbError } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import { mongoConnected, fbFind } from '../utils/fallbackCards.js';

const router = express.Router();

// Fetch cards from Mongo when connected, else from the bundled JSON DB, so
// drafting works with no database (matches the /api/cards fallback).
async function fetchCards(query = {}) {
  if (mongoConnected()) return Card.find(query).lean();
  let cards = fbFind({ rarity: query.rarity });
  const nin = query._id && query._id.$nin;
  if (nin) cards = cards.filter((c) => !nin.includes(c._id));
  return cards;
}

// In-memory draft storage (no database)
const drafts = new Map();

// Cleanup configuration
const CLEANUP_DELAY_MS = 5 * 60 * 1000; // 5 minutes after completion

/**
 * @route POST /api/draft/create
 * @desc Create a new draft session
 * @access Public
 */
router.post('/create', asyncHandler(async (req, res) => {
  const { draftType, playerName, numBots = 0 } = req.body;

  logger.info(`Creating new ${draftType} draft for player: ${playerName} with ${numBots} bots`);

  if (!draftType || !playerName) {
    throw Errors.missingField('draftType and playerName');
  }

  // Create initial player
  const players = [{
    id: generatePlayerId(),
    name: playerName,
    isBot: false,
    isConnected: true,
    pickedCards: [],
    seatNumber: 0
  }];

  logger.debug(`Created player at seat 0: ${playerName}`);

  // Add bots
  for (let i = 0; i < numBots; i++) {
    players.push({
      id: `bot-${i}`,
      name: `Bot ${i + 1}`,
      isBot: true,
      isConnected: true,
      pickedCards: [],
      seatNumber: i + 1
    });
  }

  const draftId = generateDraftId();
  const draft = {
    _id: draftId,
    draftType,
    players,
    status: 'waiting',
    currentRound: 0,
    totalRounds: 3,
    cardsPerBooster: 15,
    direction: 'left',
    boosters: [],
    usedCards: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  drafts.set(draftId, draft);
  logger.info(`Draft created with ID: ${draftId}, total players: ${draft.players.length}`);
  res.status(201).json(draft);
}));

/**
 * @route POST /api/draft/:id/join
 * @desc Join an existing draft session
 */
router.post('/:id/join', asyncHandler(async (req, res) => {
  const { playerName } = req.body;

  if (!playerName) {
    throw Errors.missingField('playerName');
  }

  const draft = drafts.get(req.params.id);

  if (!draft) {
    throw Errors.draftNotFound();
  }

  if (draft.status !== 'waiting') {
    throw Errors.draftAlreadyStarted();
  }

  const MAX_PLAYERS = 4;
  if (draft.players.length >= MAX_PLAYERS) {
    throw Errors.draftFull(MAX_PLAYERS);
  }

  const seatNumber = draft.players.length;
  const newPlayer = {
    id: generatePlayerId(),
    name: playerName,
    isBot: false,
    isConnected: true,
    pickedCards: [],
    seatNumber
  };

  draft.players.push(newPlayer);
  draft.updatedAt = new Date();

  logger.info(`Player ${playerName} joined draft ${draft._id}`);
  res.json({ draft, playerId: newPlayer.id });
}));

/**
 * @route POST /api/draft/:id/add-bots
 * @desc Add bot players to a draft
 */
router.post('/:id/add-bots', asyncHandler(async (req, res) => {
  const { count } = req.body;

  if (!count || count < 1) {
    throw Errors.missingField('count');
  }

  const draft = drafts.get(req.params.id);

  if (!draft) {
    throw Errors.draftNotFound();
  }

  if (draft.status !== 'waiting') {
    throw Errors.draftAlreadyStarted();
  }

  const MAX_PLAYERS = 4;
  const currentPlayerCount = draft.players.length;
  const availableSlots = MAX_PLAYERS - currentPlayerCount;

  if (availableSlots <= 0) {
    throw Errors.draftFull(MAX_PLAYERS);
  }

  if (count > availableSlots) {
    throw Errors.invalidAction(`add ${count} bots (only ${availableSlots} slot${availableSlots === 1 ? '' : 's'} available)`);
  }

  const currentBots = draft.players.filter(p => p.isBot).length;
  for (let i = 0; i < count; i++) {
    draft.players.push({
      id: `bot-${currentBots + i}`,
      name: `Bot ${currentBots + i + 1}`,
      isBot: true,
      isConnected: true,
      pickedCards: [],
      seatNumber: draft.players.length
    });
  }

  draft.updatedAt = new Date();
  logger.info(`Added ${count} bots to draft ${draft._id}`);
  res.json(draft);
}));

/**
 * @route POST /api/draft/:id/start
 * @desc Start the draft and generate initial boosters
 */
router.post('/:id/start', asyncHandler(async (req, res) => {
  const draft = drafts.get(req.params.id);

  if (!draft) {
    throw Errors.draftNotFound();
  }

  if (draft.players.length < 2) {
    throw Errors.insufficientPlayers(2);
  }

  logger.info(`Starting draft ${draft._id} with ${draft.players.length} players`);

  // Generate first round of boosters
  const boosters = await generateBoosters(draft);
  draft.boosters = boosters;
  draft.status = 'drafting';
  draft.currentRound = 1;

  // Set initial pick deadlines for all players
  setPickDeadlines(draft);
  draft.updatedAt = new Date();

  logger.info(`Draft started! Round ${draft.currentRound}, generated ${boosters.length} boosters`);

  res.json(draft);
}));

/**
 * @route GET /api/draft/active
 * @desc Get list of active drafts (for debugging)
 */
router.get('/active', asyncHandler(async (req, res) => {
  const activeDrafts = Array.from(drafts.values()).map(draft => ({
    id: draft._id,
    status: draft.status,
    players: draft.players.length,
    round: draft.currentRound,
    createdAt: draft.createdAt
  }));

  res.json({
    count: activeDrafts.length,
    drafts: activeDrafts
  });
}));

/**
 * @route GET /api/draft/:id
 * @desc Get draft status
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const draft = drafts.get(req.params.id);

  if (!draft) {
    throw Errors.draftNotFound();
  }

  // Check for expired picks and auto-pick if needed
  if (draft.status === 'drafting') {
    await checkExpiredPicks(draft);
    setPickDeadlines(draft);
    draft.updatedAt = new Date();
  }

  res.json(draft);
}));

/**
 * @route POST /api/draft/:id/pick
 * @desc Make a card pick - NEW SIMPLIFIED VERSION
 */
router.post('/:id/pick', asyncHandler(async (req, res) => {
  const { playerId, cardId } = req.body;

  if (!playerId || !cardId) {
    throw Errors.missingField('playerId and cardId');
  }

  const draft = drafts.get(req.params.id);

  if (!draft) {
    throw Errors.draftNotFound();
  }

  const playerIndex = draft.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw Errors.playerNotFound();
  }

  // Find player's current booster
  const boosterIndex = findPlayerBooster(draft, playerIndex);
  if (boosterIndex === -1) {
    throw Errors.noBoosterAvailable();
  }

  const booster = draft.boosters[boosterIndex];
  const cardIndex = booster.cards.findIndex(c => c._id.toString() === cardId);

  if (cardIndex === -1) {
    throw Errors.cardNotInBooster();
  }

  const pickedCard = booster.cards[cardIndex];
  logger.info(`${draft.players[playerIndex].name} picked: ${pickedCard.name}`);

  // Make the pick
  draft.players[playerIndex].pickedCards.push(pickedCard);
  draft.players[playerIndex].pickStartTime = null;
  draft.players[playerIndex].pickDeadline = null;
  booster.cards.splice(cardIndex, 1);

  // DON'T remove empty boosters yet - bots still need to pick from them!

  // Now have ALL players (including bots) pick simultaneously
  // They all pick from the current state BEFORE any boosters are removed
  await makeSimultaneousPicks(draft);

  // After all picks are made, pass ALL boosters together
  passAllBoosters(draft);

  // NOW remove empty boosters (after passing)
  for (let i = draft.boosters.length - 1; i >= 0; i--) {
    if (draft.boosters[i].cards.length === 0) {
      draft.boosters.splice(i, 1);
    }
  }

  // Check if round is complete
  if (draft.boosters.length === 0) {
    if (draft.currentRound < draft.totalRounds) {
      // Start new round
      draft.currentRound++;
      draft.direction = draft.direction === 'left' ? 'right' : 'left';
      const newBoosters = await generateBoosters(draft);
      draft.boosters = newBoosters;
      logger.info(`Round ${draft.currentRound}/${draft.totalRounds} started`);
    } else {
      // Draft complete
      draft.status = 'completed';
      logger.info(`Draft complete!`);
      scheduleCleanup(draft._id);
    }
  }

  draft.updatedAt = new Date();

  res.json(draft);
}));

// Debug endpoint
router.post('/:id/debug-pick-45', asyncHandler(async (req, res) => {
  const { playerId } = req.body;
  const draft = drafts.get(req.params.id);

  if (!draft) {
    throw Errors.draftNotFound();
  }

  const playerIndex = draft.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw Errors.playerNotFound();
  }

  if (draft.players[playerIndex].seatNumber !== 0) {
    throw Errors.invalidAction('Debug feature only available for admin (seat 0)');
  }

  const allCards = await fetchCards({});
  const shuffled = shuffleArray([...allCards]);
  const selectedCards = shuffled.slice(0, 45);

  draft.players[playerIndex].pickedCards = selectedCards;
  draft.status = 'completed';
  draft.boosters = [];
  draft.updatedAt = new Date();
  scheduleCleanup(draft._id);

  res.json(draft);
}));

// Update player's deck
router.post('/:id/update-deck', asyncHandler(async (req, res) => {
  const { playerId, deck, sideboard } = req.body;
  const draft = drafts.get(req.params.id);

  if (!draft) {
    throw Errors.draftNotFound();
  }

  const player = draft.players.find(p => p.id === playerId);
  if (!player) {
    throw Errors.playerNotFound();
  }

  player.deck = deck;
  player.sideboard = sideboard;
  player.deckBuilt = deck.length >= 40;
  draft.updatedAt = new Date();

  res.json({ success: true });
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generatePlayerId() {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Schedule a draft for automatic cleanup after completion
 */
function scheduleCleanup(draftId) {
  setTimeout(() => {
    if (drafts.has(draftId)) {
      const draft = drafts.get(draftId);
      if (draft.status === 'completed') {
        drafts.delete(draftId);
        logger.info(`🗑️ Cleaned up completed draft: ${draftId}`);
      }
    }
  }, CLEANUP_DELAY_MS);
}

/**
 * Find which booster belongs to a player
 */
function findPlayerBooster(draft, playerIndex) {
  const totalPlayers = draft.players.length;
  const direction = draft.direction === 'left' ? 1 : -1;

  for (let i = 0; i < draft.boosters.length; i++) {
    const booster = draft.boosters[i];
    const boosterOwner = (i + draft.currentRound - 1) % totalPlayers;
    const passCount = booster.currentPlayerIndex || 0;
    const currentPosition = ((boosterOwner + direction * passCount) % totalPlayers + totalPlayers) % totalPlayers;

    if (currentPosition === playerIndex) {
      return i;
    }
  }

  return -1;
}

/**
 * NEW: Make simultaneous picks for all bots
 */
async function makeSimultaneousPicks(draft) {
  console.log(`🤖 Simultaneous bot picks (Round ${draft.currentRound})`);

  // Collect all bot decisions BEFORE modifying anything
  const picks = [];

  for (let playerIndex = 0; playerIndex < draft.players.length; playerIndex++) {
    const player = draft.players[playerIndex];

    // Only bots pick automatically
    if (!player.isBot) continue;

    const boosterIndex = findPlayerBooster(draft, playerIndex);
    if (boosterIndex === -1) continue;

    const booster = draft.boosters[boosterIndex];
    if (booster.cards.length === 0) continue;

    // Bot picks a random card
    const randomIndex = Math.floor(Math.random() * booster.cards.length);
    const card = booster.cards[randomIndex];

    picks.push({
      playerIndex,
      boosterIndex,
      cardIndex: randomIndex,
      card
    });

    console.log(`  ${player.name} will pick: ${card.name}`);
  }

  console.log(`  Total picks: ${picks.length}`);

  // Sort to avoid index shifting (remove from end first)
  picks.sort((a, b) => {
    if (a.boosterIndex !== b.boosterIndex) {
      return b.boosterIndex - a.boosterIndex;
    }
    return b.cardIndex - a.cardIndex;
  });

  // Apply all picks atomically
  for (const pick of picks) {
    const player = draft.players[pick.playerIndex];
    const booster = draft.boosters[pick.boosterIndex];

    player.pickedCards.push(pick.card);
    player.pickStartTime = null;
    player.pickDeadline = null;
    booster.cards.splice(pick.cardIndex, 1);

    console.log(`  ✓ ${player.name} picked: ${pick.card.name} (${player.pickedCards.length} total)`);
  }

  // DON'T remove empty boosters here - let the caller handle it
  // This prevents duplicate removal and index issues
}

/**
 * Pass all boosters to the next player
 */
function passAllBoosters(draft) {
  for (let i = 0; i < draft.boosters.length; i++) {
    const oldIndex = draft.boosters[i].currentPlayerIndex || 0;
    draft.boosters[i].currentPlayerIndex = oldIndex + 1;
  }
}

/**
 * Generate boosters for a new round
 */
async function generateBoosters(draft) {
  const boosters = [];

  if (draft.draftType === 'set') {
    const numBoosters = draft.players.length;
    const cardsPerBooster = draft.cardsPerBooster || 15;

    const [allCommons, allUncommons, allRares, allMythics] = await Promise.all([
      fetchCards({ rarity: 'Common' }),
      fetchCards({ rarity: 'Uncommon' }),
      fetchCards({ rarity: 'Rare' }),
      fetchCards({ rarity: 'Mythic' })
    ]);

    for (let i = 0; i < numBoosters; i++) {
      const boosterCards = generateSetBoosterFromPool(
        allCommons,
        allUncommons,
        allRares,
        allMythics,
        cardsPerBooster
      );
      boosters.push({
        cards: boosterCards,
        currentPlayerIndex: 0
      });
    }
  } else {
    // Cube draft
    const allCards = await fetchCards({ _id: { $nin: draft.usedCards } });

    if (allCards.length < draft.players.length * draft.cardsPerBooster) {
      throw new Error('Not enough cards for cube draft');
    }

    const shuffled = shuffleArray([...allCards]);

    for (let i = 0; i < draft.players.length; i++) {
      const boosterCards = shuffled.slice(
        i * draft.cardsPerBooster,
        (i + 1) * draft.cardsPerBooster
      );

      draft.usedCards.push(...boosterCards.map(c => c._id));

      boosters.push({
        cards: boosterCards, // Store full card objects, not IDs
        currentPlayerIndex: 0
      });
    }
  }

  return boosters;
}

function generateSetBoosterFromPool(commons, uncommons, rares, mythics, count = 15) {
  const boosterCards = [];
  const usedCardIds = new Set(); // Track used card IDs to prevent duplicates

  // Helper function to get random unique cards
  const getUniqueRandomCards = (pool, needed) => {
    const available = pool.filter(card => !usedCardIds.has(card._id.toString()));
    if (available.length === 0) return [];

    const shuffled = shuffleArray(available);
    const selected = shuffled.slice(0, Math.min(needed, available.length));

    // Mark these cards as used
    selected.forEach(card => usedCardIds.add(card._id.toString()));
    return selected;
  };

  // 10 commons
  boosterCards.push(...getUniqueRandomCards(commons, 10));

  // 3 uncommons
  boosterCards.push(...getUniqueRandomCards(uncommons, 3));

  // 1 rare/mythic (1/8 chance for mythic)
  const isMythic = Math.random() < 0.125;
  const rarePool = isMythic && mythics.length > 0 ? mythics : rares;
  boosterCards.push(...getUniqueRandomCards(rarePool, 1));

  // Fill remaining with commons if needed
  const remaining = count - boosterCards.length;
  if (remaining > 0) {
    boosterCards.push(...getUniqueRandomCards(commons, remaining));
  }

  return shuffleArray(boosterCards);
}

function getRandomCards(pool, count) {
  if (pool.length === 0) return [];
  if (pool.length <= count) return [...pool];

  const shuffled = shuffleArray([...pool]);
  return shuffled.slice(0, count);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getPickTimeLimit(picksThisRound) {
  if (picksThisRound < 5) return 60;
  if (picksThisRound < 10) return 30;
  return 15;
}

function setPickDeadlines(draft) {
  const now = new Date();

  draft.players.forEach((player, playerIndex) => {
    const boosterIndex = findPlayerBooster(draft, playerIndex);

    if (boosterIndex !== -1) {
      const booster = draft.boosters[boosterIndex];

      if (booster.cards.length > 0) {
        const totalPicks = player.pickedCards?.length || 0;
        const picksThisRound = totalPicks % 15;
        const timeLimit = getPickTimeLimit(picksThisRound);

        if (!player.pickDeadline || !player.pickStartTime) {
          player.pickStartTime = now;
          player.pickDeadline = new Date(now.getTime() + (timeLimit * 1000));
        }
      } else {
        player.pickStartTime = null;
        player.pickDeadline = null;
      }
    } else {
      player.pickStartTime = null;
      player.pickDeadline = null;
    }
  });
}

async function checkExpiredPicks(draft) {
  if (!draft || draft.status !== 'drafting') return false;

  const now = new Date();
  let anyExpired = false;

  for (let i = 0; i < draft.players.length; i++) {
    const player = draft.players[i];

    if (player.isBot) continue;

    if (player.pickDeadline && now > player.pickDeadline) {
      const boosterIndex = findPlayerBooster(draft, i);

      if (boosterIndex !== -1) {
        const booster = draft.boosters[boosterIndex];

        if (booster.cards.length > 0) {
          console.log(`⏰ Time expired for ${player.name}, auto-picking...`);

          const randomIndex = Math.floor(Math.random() * booster.cards.length);
          const pickedCard = booster.cards[randomIndex];

          player.pickedCards.push(pickedCard);
          booster.cards.splice(randomIndex, 1);
          player.pickStartTime = null;
          player.pickDeadline = null;

          anyExpired = true;

          if (booster.cards.length === 0) {
            draft.boosters.splice(boosterIndex, 1);
          }
        }
      }
    }
  }

  if (anyExpired) {
    await makeSimultaneousPicks(draft);
    passAllBoosters(draft);
    draft.updatedAt = new Date();
    setPickDeadlines(draft);
    return true;
  }

  return false;
}

export default router;
