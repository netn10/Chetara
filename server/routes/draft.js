import express from 'express';
import Draft from '../models/Draft.js';
import Card from '../models/Card.js';

const router = express.Router();

// Create a new draft session
router.post('/create', async (req, res) => {
  try {
    const { draftType, playerName, numBots = 0 } = req.body;

    console.log(`\n🎯 Creating new ${draftType} draft for player: ${playerName} with ${numBots} bots`);

    if (!draftType || !playerName) {
      return res.status(400).json({ message: 'Draft type and player name required' });
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

    console.log(`✅ Created player at seat 0: ${playerName}`);

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

    const draft = new Draft({
      draftType,
      players,
      status: 'waiting'
    });

    await draft.save();
    console.log(`✅ Draft created with ID: ${draft._id}`);
    console.log(`📊 Total players: ${draft.players.length}\n`);
    res.status(201).json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join an existing draft
router.post('/:id/join', async (req, res) => {
  try {
    const { playerName } = req.body;
    const draft = await Draft.findById(req.params.id);

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    if (draft.status !== 'waiting') {
      return res.status(400).json({ message: 'Draft already started' });
    }

    const MAX_PLAYERS = 4;
    if (draft.players.length >= MAX_PLAYERS) {
      return res.status(400).json({ message: 'Draft is full (4 players maximum)' });
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
    await draft.save();

    res.json({ draft, playerId: newPlayer.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add bots to draft
router.post('/:id/add-bots', async (req, res) => {
  try {
    const { count } = req.body;
    const draft = await Draft.findById(req.params.id);

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    if (draft.status !== 'waiting') {
      return res.status(400).json({ message: 'Draft already started' });
    }

    const MAX_PLAYERS = 4;
    const currentPlayerCount = draft.players.length;
    const availableSlots = MAX_PLAYERS - currentPlayerCount;

    if (availableSlots <= 0) {
      return res.status(400).json({ message: 'Draft is already full (4 players maximum)' });
    }

    if (count > availableSlots) {
      return res.status(400).json({
        message: `Can only add ${availableSlots} more player${availableSlots === 1 ? '' : 's'} (4 players maximum)`
      });
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

    await draft.save();
    res.json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start draft
router.post('/:id/start', async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.id);

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    if (draft.players.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 players to start' });
    }

    console.log(`\n🚀 Starting draft ${draft._id}`);
    console.log(`📊 Players: ${draft.players.map(p => `${p.name}(${p.isBot ? 'BOT' : 'HUMAN'})`).join(', ')}`);

    // Generate first round of boosters
    const boosters = await generateBoosters(draft);
    draft.boosters = boosters;
    draft.status = 'drafting';
    draft.currentRound = 1;

    await draft.save();

    console.log(`✅ Draft started! Round ${draft.currentRound}, Direction: ${draft.direction}`);
    console.log(`📦 Generated ${boosters.length} boosters with ${draft.cardsPerBooster} cards each`);
    console.log(`⏳ Waiting for human player to make first pick...\n`);

    // DON'T auto-pick for bots at start - let human pick first
    // This ensures everyone picks once per round (proper draft rules)
    res.json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get draft status
router.get('/:id', async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.id)
      .populate('boosters.cards')
      .populate('players.pickedCards');

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    res.json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Make a pick
router.post('/:id/pick', async (req, res) => {
  try {
    const { playerId, cardId } = req.body;
    const draft = await Draft.findById(req.params.id).populate('boosters.cards');

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    const playerIndex = draft.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Find player's current booster
    const boosterIndex = findPlayerBooster(draft, playerIndex);
    if (boosterIndex === -1) {
      return res.status(400).json({ message: 'No booster available for this player' });
    }

    const booster = draft.boosters[boosterIndex];
    const cardsBeforePick = booster.cards.length;
    const cardIndex = booster.cards.findIndex(c => c._id.toString() === cardId);

    if (cardIndex === -1) {
      return res.status(400).json({ message: 'Card not in current booster' });
    }

    // Add card to player's picked cards
    const pickedCardName = booster.cards[cardIndex]?.name;
    draft.players[playerIndex].pickedCards.push(booster.cards[cardIndex]);
    draft.players[playerIndex].currentPick = null;

    // Remove card from booster
    booster.cards.splice(cardIndex, 1);

    console.log(`👤 ${draft.players[playerIndex].name} picked: ${pickedCardName}`);

    // DON'T pass the booster here - let autoPickForBots pass ALL boosters together
    // This ensures everyone picks before anyone's pack is passed

    // Auto-pick for bots INSTANTLY (pass draft object directly, no DB round-trips)
    const newRoundStarted = await autoPickForBots(draft);

    // Always populate picked cards so completion screen shows them
    await draft.populate('players.pickedCards');

    // If new round didn't start, boosters already populated from previous round
    // If new round started, autoPickForBots already populated the new boosters
    res.json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
