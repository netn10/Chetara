import express from 'express';
import Draft from '../models/Draft.js';
import Card from '../models/Card.js';
import { Errors, asyncHandler, processDbError } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route POST /api/draft/create
 * @desc Create a new draft session
 * @access Public
 * @body {string} draftType - Type of draft (set or cube)
 * @body {string} playerName - Name of the player creating the draft
 * @body {number} [numBots=0] - Number of bot players to add
 * @returns {object} Created draft object
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

  try {
    const draft = new Draft({
      draftType,
      players,
      status: 'waiting'
    });

    await draft.save();
    logger.info(`Draft created with ID: ${draft._id}, total players: ${draft.players.length}`);
    res.status(201).json(draft);
  } catch (error) {
    logger.error('Error creating draft:', error);
    throw processDbError(error, 'draft');
  }
}));

/**
 * @route POST /api/draft/:id/join
 * @desc Join an existing draft session
 * @access Public
 * @param {string} id - Draft ID
 * @body {string} playerName - Name of the joining player
 * @returns {object} Updated draft and player ID
 */
router.post('/:id/join', asyncHandler(async (req, res) => {
  const { playerName } = req.body;

  if (!playerName) {
    throw Errors.missingField('playerName');
  }

  const draft = await Draft.findById(req.params.id);

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

  try {
    await draft.save();
    logger.info(`Player ${playerName} joined draft ${draft._id}`);
    res.json({ draft, playerId: newPlayer.id });
  } catch (error) {
    logger.error('Error joining draft:', error);
    throw processDbError(error, 'draft');
  }
}));

/**
 * @route POST /api/draft/:id/add-bots
 * @desc Add bot players to a draft
 * @access Public
 * @param {string} id - Draft ID
 * @body {number} count - Number of bots to add
 * @returns {object} Updated draft object
 */
router.post('/:id/add-bots', asyncHandler(async (req, res) => {
  const { count } = req.body;

  if (!count || count < 1) {
    throw Errors.missingField('count');
  }

  const draft = await Draft.findById(req.params.id);

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

  try {
    await draft.save();
    logger.info(`Added ${count} bots to draft ${draft._id}`);
    res.json(draft);
  } catch (error) {
    logger.error('Error adding bots to draft:', error);
    throw processDbError(error, 'draft');
  }
}));

/**
 * @route POST /api/draft/:id/start
 * @desc Start the draft and generate initial boosters
 * @access Public
 * @param {string} id - Draft ID
 * @returns {object} Updated draft with boosters
 */
router.post('/:id/start', asyncHandler(async (req, res) => {
  const draft = await Draft.findById(req.params.id);

  if (!draft) {
    throw Errors.draftNotFound();
  }

  if (draft.players.length < 2) {
    throw Errors.insufficientPlayers(2);
  }

  logger.info(`Starting draft ${draft._id} with ${draft.players.length} players`);

  // Generate first round of boosters
  try {
    const boosters = await generateBoosters(draft);
    draft.boosters = boosters;
    draft.status = 'drafting';
    draft.currentRound = 1;

    // Set initial pick deadlines for all players
    setPickDeadlines(draft);

    await draft.save();

    logger.info(`Draft started! Round ${draft.currentRound}, generated ${boosters.length} boosters`);

    res.json(draft);
  } catch (error) {
    logger.error('Error starting draft:', error);
    if (error.message.includes('Not enough cards')) {
      throw Errors.cardsInsufficient();
    }
    throw processDbError(error, 'draft');
  }
}));

/**
 * @route GET /api/draft/:id
 * @desc Get draft status and handle expired picks
 * @access Public
 * @param {string} id - Draft ID
 * @returns {object} Draft object with populated data
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const draft = await Draft.findById(req.params.id)
    .populate('boosters.cards')
    .populate('players.pickedCards');

  if (!draft) {
    throw Errors.draftNotFound();
  }

  // Check for expired picks and auto-pick if needed
  if (draft.status === 'drafting') {
    // Verify and correct the current round based on actual picks
    if (draft.players.length > 0) {
      const firstPlayer = draft.players[0];
      const totalPicks = firstPlayer.pickedCards?.length || 0;
      const expectedRound = Math.floor(totalPicks / 15) + 1;

      // If boosters are empty but we haven't started the expected round yet, start it
      if (draft.boosters.length === 0 && expectedRound > draft.currentRound && expectedRound <= draft.totalRounds) {
        logger.info(`Starting missing round ${expectedRound} (player has ${totalPicks} picks)`);
        draft.currentRound = expectedRound;
        draft.direction = expectedRound % 2 === 0 ? 'right' : 'left';
        const newBoosters = await generateBoosters(draft);
        draft.boosters = newBoosters;
        await draft.populate('boosters.cards');
      }
      // Otherwise just correct the round number if it's wrong (and we have boosters)
      else if (expectedRound !== draft.currentRound && draft.boosters.length > 0 && expectedRound <= draft.totalRounds) {
        logger.debug(`Correcting round: ${draft.currentRound} → ${expectedRound}`);
        draft.currentRound = expectedRound;
      }
    }

    await checkExpiredPicks(draft);

    // Set deadlines for players who need to pick (if not already set)
    setPickDeadlines(draft);
    await draft.save();
  }

  res.json(draft);
}));

// DEBUG: Admin pick 45 cards instantly
router.post('/:id/debug-pick-45', async (req, res) => {
  try {
    const { playerId } = req.body;
    const draft = await Draft.findById(req.params.id);

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    const playerIndex = draft.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Only allow for seat 0 (admin/first player)
    if (draft.players[playerIndex].seatNumber !== 0) {
      return res.status(403).json({ message: 'Debug feature only available for admin (seat 0)' });
    }

    console.log(`\n🔧 DEBUG: Admin picking 45 cards instantly`);

    // Get 45 random cards from the database
    const allCards = await Card.find({}).lean();
    const shuffled = shuffleArray([...allCards]);
    const selectedCards = shuffled.slice(0, 45);

    // Add all cards to player's picked cards
    draft.players[playerIndex].pickedCards = selectedCards.map(c => c._id);

    // Mark draft as completed
    draft.status = 'completed';
    draft.boosters = [];

    await draft.save();
    await draft.populate('players.pickedCards');

    console.log(`✅ DEBUG: Admin now has 45 cards, draft marked as completed`);

    res.json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update player's deck
router.post('/:id/update-deck', async (req, res) => {
  try {
    const { playerId, deck, sideboard } = req.body;
    const draft = await Draft.findById(req.params.id);

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    const player = draft.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    player.deck = deck;
    player.sideboard = sideboard;
    player.deckBuilt = deck.length >= 40;

    draft.updatedAt = Date.now();
    await draft.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route POST /api/draft/:id/pick
 * @desc Make a card pick from the current booster
 * @access Public
 * @param {string} id - Draft ID
 * @body {string} playerId - ID of the player making the pick
 * @body {string} cardId - ID of the card to pick
 * @returns {object} Updated draft with new pick
 */
router.post('/:id/pick', asyncHandler(async (req, res) => {
  const { playerId, cardId } = req.body;

  if (!playerId || !cardId) {
    throw Errors.missingField('playerId and cardId');
  }

  const draft = await Draft.findById(req.params.id).populate('boosters.cards');

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

  // Add card to player's picked cards
  const pickedCardName = booster.cards[cardIndex]?.name;
  draft.players[playerIndex].pickedCards.push(booster.cards[cardIndex]);
  draft.players[playerIndex].currentPick = null;

  // Clear pick deadline for this player
  draft.players[playerIndex].pickStartTime = null;
  draft.players[playerIndex].pickDeadline = null;

  // Remove card from booster
  booster.cards.splice(cardIndex, 1);

  logger.info(`${draft.players[playerIndex].name} picked: ${pickedCardName}`);

  // Auto-pick for bots INSTANTLY (pass draft object directly, no DB round-trips)
  const newRoundStarted = await autoPickForBots(draft);

  // Set new deadlines for players who now need to pick
  setPickDeadlines(draft);

  // Always populate picked cards so completion screen shows them
  await draft.populate('players.pickedCards');

  res.json(draft);
}));

// Helper functions
function generatePlayerId() {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getBoosterCurrentPlayer(draft, boosterIndex) {
  const totalPlayers = draft.players.length;
  const direction = draft.direction === 'left' ? 1 : -1;
  const booster = draft.boosters[boosterIndex];

  // The booster owner is determined by which round we're in
  const boosterOwner = (boosterIndex + draft.currentRound - 1) % totalPlayers;

  // Calculate which player currently has this booster based on how many times it's been passed
  const currentPlayerIndex = booster.currentPlayerIndex || 0;
  // Use proper modulo to handle negative numbers correctly
  const currentPosition = ((boosterOwner + direction * currentPlayerIndex) % totalPlayers + totalPlayers) % totalPlayers;

  return currentPosition;
}

function findPlayerBooster(draft, playerIndex) {
  const totalPlayers = draft.players.length;
  const direction = draft.direction === 'left' ? 1 : -1;

  for (let i = 0; i < draft.boosters.length; i++) {
    const booster = draft.boosters[i];
    // The booster owner is determined by which round we're in
    // Round 1: booster 0 → player 0, booster 1 → player 1, etc.
    // Round 2: booster 0 → player 1, booster 1 → player 2, etc. (rotating)
    const boosterOwner = (i + draft.currentRound - 1) % totalPlayers;
    // Calculate which player currently has this booster based on how many times it's been passed
    // currentPlayerIndex tracks how many picks have been made from this booster
    // When currentPlayerIndex = 0, the pack is with the owner
    // When currentPlayerIndex = 1, the pack has been passed once (to the next player)
    const currentPlayerIndex = booster.currentPlayerIndex || 0;
    // Use proper modulo to handle negative numbers correctly
    const currentPosition = ((boosterOwner + direction * currentPlayerIndex) % totalPlayers + totalPlayers) % totalPlayers;

    if (currentPosition === playerIndex) {
      return i;
    }
  }

  return -1;
}

async function generateBoosters(draft) {
  const boosters = [];

  if (draft.draftType === 'set') {
    // Set draft - generate boosters with rarity distribution
    // OPTIMIZED: Fetch all cards once, then build multiple boosters from them
    const numBoosters = draft.players.length;
    const cardsPerBooster = draft.cardsPerBooster || 15;

    // Fetch all cards of each rarity in parallel (3 queries instead of 4+ per booster)
    const [allCommons, allUncommons, allRares, allMythics] = await Promise.all([
      Card.find({ rarity: 'Common' }).lean(),
      Card.find({ rarity: 'Uncommon' }).lean(),
      Card.find({ rarity: 'Rare' }).lean(),
      Card.find({ rarity: 'Mythic' }).lean()
    ]);

    // Generate all boosters
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
    // Cube draft - singleton cards
    const allCards = await Card.find({ _id: { $nin: draft.usedCards } }).lean();

    if (allCards.length < draft.players.length * draft.cardsPerBooster) {
      throw new Error('Not enough cards for cube draft');
    }

    // Shuffle cards
    const shuffled = shuffleArray([...allCards]);

    for (let i = 0; i < draft.players.length; i++) {
      const boosterCards = shuffled.slice(
        i * draft.cardsPerBooster,
        (i + 1) * draft.cardsPerBooster
      );

      // Mark cards as used
      draft.usedCards.push(...boosterCards.map(c => c._id));

      boosters.push({
        cards: boosterCards.map(c => c._id),
        currentPlayerIndex: 0
      });
    }
  }

  return boosters;
}

function generateSetBoosterFromPool(commons, uncommons, rares, mythics, count = 15) {
  // Play booster distribution: 10 commons, 3 uncommons, 1 rare/mythic, 1 extra common
  const boosterCards = [];

  // 10 random commons
  const selectedCommons = getRandomCards(commons, 10);
  boosterCards.push(...selectedCommons);

  // 3 random uncommons
  const selectedUncommons = getRandomCards(uncommons, 3);
  boosterCards.push(...selectedUncommons);

  // 1 rare or mythic (1/8 chance for mythic)
  const isMythic = Math.random() < 0.125;
  const rarePool = isMythic && mythics.length > 0 ? mythics : rares;
  const selectedRare = getRandomCards(rarePool, 1);
  boosterCards.push(...selectedRare);

  // Fill remaining slots with commons
  const remaining = count - boosterCards.length;
  if (remaining > 0) {
    const extraCommons = getRandomCards(commons, remaining);
    boosterCards.push(...extraCommons);
  }

  // Shuffle and return FULL CARD OBJECTS (not IDs) for instant client access
  return shuffleArray(boosterCards);
}

function getRandomCards(pool, count) {
  if (pool.length === 0) return [];
  if (pool.length <= count) return [...pool];

  const selected = [];
  const shuffled = shuffleArray([...pool]);

  for (let i = 0; i < count && i < shuffled.length; i++) {
    selected.push(shuffled[i]);
  }

  return selected;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get pick time limit based on picks made this round
function getPickTimeLimit(picksThisRound) {
  if (picksThisRound < 5) return 60; // 60 seconds for first 5 picks
  if (picksThisRound < 10) return 30; // 30 seconds for picks 6-10
  return 15; // 15 seconds for picks 11-15
}

// Set pick deadlines for all players who need to pick
function setPickDeadlines(draft) {
  const now = new Date();

  draft.players.forEach((player, playerIndex) => {
    const boosterIndex = findPlayerBooster(draft, playerIndex);

    if (boosterIndex !== -1) {
      const booster = draft.boosters[boosterIndex];

      // Player has a booster to pick from
      if (booster.cards.length > 0) {
        // Calculate picks made this round
        const totalPicks = player.pickedCards?.length || 0;
        const picksThisRound = totalPicks % 15;
        const timeLimit = getPickTimeLimit(picksThisRound);

        // Set deadline if not already set or if it's a new pick
        if (!player.pickDeadline || !player.pickStartTime) {
          player.pickStartTime = now;
          player.pickDeadline = new Date(now.getTime() + (timeLimit * 1000));
        }
      } else {
        // No cards to pick, clear deadline
        player.pickStartTime = null;
        player.pickDeadline = null;
      }
    } else {
      // No booster, clear deadline
      player.pickStartTime = null;
      player.pickDeadline = null;
    }
  });
}

// Check for expired picks and auto-pick
async function checkExpiredPicks(draft) {
  if (!draft || draft.status !== 'drafting') return false;

  const now = new Date();
  let anyExpired = false;

  for (let i = 0; i < draft.players.length; i++) {
    const player = draft.players[i];

    // Skip bots - they pick instantly
    if (player.isBot) continue;

    // Check if this player's pick has expired
    if (player.pickDeadline && now > player.pickDeadline) {
      const boosterIndex = findPlayerBooster(draft, i);

      if (boosterIndex !== -1) {
        const booster = draft.boosters[boosterIndex];

        if (booster.cards.length > 0) {
          console.log(`⏰ Time expired for ${player.name}, auto-picking...`);

          // Auto-pick random card
          const randomIndex = Math.floor(Math.random() * booster.cards.length);
          const pickedCard = booster.cards[randomIndex];

          player.pickedCards.push(pickedCard);
          booster.cards.splice(randomIndex, 1);

          // Clear deadline after pick
          player.pickStartTime = null;
          player.pickDeadline = null;

          anyExpired = true;

          // Remove empty booster
          if (booster.cards.length === 0) {
            draft.boosters.splice(boosterIndex, 1);
          }
        }
      }
    }
  }

  // If any picks were made due to expiration, pass boosters and check for bot picks
  if (anyExpired) {
    // Pass all remaining boosters
    for (let i = 0; i < draft.boosters.length; i++) {
      const oldIndex = draft.boosters[i].currentPlayerIndex || 0;
      draft.boosters[i].currentPlayerIndex = oldIndex + 1;
    }

    await draft.save();

    // Set new deadlines for players who now need to pick
    setPickDeadlines(draft);

    // Auto-pick for bots
    await autoPickForBots(draft);

    return true;
  }

  return false;
}

async function autoPickForBots(draftOrId, retryCount = 0) {
  try {
    // Accept either draft object or ID for instant bot picks
    let draft;
    if (typeof draftOrId === 'string') {
      // Fetch fresh draft if given ID
      draft = await Draft.findById(draftOrId).populate('boosters.cards');
    } else {
      // Use draft object directly (already populated) for instant picks
      draft = draftOrId;
    }

    if (!draft || draft.status !== 'drafting') {
      if (!draft) console.log(`   ⚠️  Draft not found`);
      if (draft?.status !== 'drafting') console.log(`   ⏸️  Draft status: ${draft?.status}\n`);
      return;
    }

    // Minimal logging for performance
    console.log(`\n🤖 Bot picks (Round ${draft.currentRound})`);

    // Pick for ALL bots simultaneously (in one pass)
    let anyBotPicked = false;
    const boostersToRemove = [];

    for (let i = 0; i < draft.players.length; i++) {
      const player = draft.players[i];

      if (player.isBot) {
        const boosterIndex = findPlayerBooster(draft, i);

        if (boosterIndex !== -1 && !boostersToRemove.includes(boosterIndex)) {
          const booster = draft.boosters[boosterIndex];

          if (booster.cards.length > 0) {
            // Bot picks a random card (simple AI)
            const randomIndex = Math.floor(Math.random() * booster.cards.length);
            const pickedCard = booster.cards[randomIndex];

            // Push full card object to keep it populated (Mongoose will store as ID)
            player.pickedCards.push(pickedCard);
            booster.cards.splice(randomIndex, 1);
            anyBotPicked = true;

            // Mark empty boosters for removal
            if (booster.cards.length === 0) {
              boostersToRemove.push(boosterIndex);
            }
          }
        }
      }
    }

    // Find ALL empty boosters (not just ones bots picked from)
    const allEmptyBoosters = [];
    for (let i = draft.boosters.length - 1; i >= 0; i--) {
      if (draft.boosters[i].cards.length === 0) {
        allEmptyBoosters.push(i);
      }
    }

    // Remove all empty boosters (already in reverse order)
    for (const index of allEmptyBoosters) {
      draft.boosters.splice(index, 1);
    }

    // If bots picked, pass ALL remaining boosters
    if (anyBotPicked) {
      for (let i = 0; i < draft.boosters.length; i++) {
        const oldIndex = draft.boosters[i].currentPlayerIndex || 0;
        draft.boosters[i].currentPlayerIndex = oldIndex + 1;
      }
    }

    // Check if round is complete (all boosters are empty)
    let newRoundStarted = false;
    if (draft.boosters.length === 0) {
      if (draft.currentRound < draft.totalRounds) {
        // Start new round
        draft.currentRound++;
        draft.direction = draft.direction === 'left' ? 'right' : 'left';
        const newBoosters = await generateBoosters(draft);
        draft.boosters = newBoosters;
        newRoundStarted = true;
        console.log(`Round ${draft.currentRound}/${draft.totalRounds} started`);
      } else {
        // Draft complete
        draft.status = 'completed';
        console.log(`Draft complete!`);
      }
    }

    await draft.save();

    // If new round started, populate the new boosters (Mongoose converted objects to IDs during save)
    if (newRoundStarted) {
      await draft.populate('boosters.cards');
      console.log(`✅ Populated new round boosters`);
    }

    return newRoundStarted;

  } catch (error) {
    console.error(`\n❌ Error in auto-pick (attempt ${retryCount + 1}):`, error.message);
    // Retry on any error (network issues, etc.)
    if (retryCount < 3) {
      console.log(`   🔄 Retrying...\n`);
      // On retry, use draft ID to get fresh data
      const draftId = typeof draftOrId === 'string' ? draftOrId : draftOrId._id.toString();
      setImmediate(() => autoPickForBots(draftId, retryCount + 1));
    } else {
      console.log(`   ⛔ Max retries reached, stopping auto-pick\n`);
    }
  }
}

export default router;
