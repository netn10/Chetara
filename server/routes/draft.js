import express from 'express';
import Draft from '../models/Draft.js';
import Card from '../models/Card.js';

const router = express.Router();

// Create a new draft session
router.post('/create', async (req, res) => {
  try {
    const { draftType, playerName, numBots = 0 } = req.body;

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

    // Generate first round of boosters
    const boosters = await generateBoosters(draft);
    draft.boosters = boosters;
    draft.status = 'drafting';
    draft.currentRound = 1;

    await draft.save();

    // Auto-pick for bots
    setTimeout(() => autoPickForBots(draft._id), 2000);

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
    const cardIndex = booster.cards.findIndex(c => c._id.toString() === cardId);

    if (cardIndex === -1) {
      return res.status(400).json({ message: 'Card not in current booster' });
    }

    // Add card to player's picked cards
    draft.players[playerIndex].pickedCards.push(booster.cards[cardIndex]);
    draft.players[playerIndex].currentPick = null;

    // Remove card from booster
    booster.cards.splice(cardIndex, 1);

    // Pass booster or start new round
    if (booster.cards.length === 0) {
      // Remove empty booster
      draft.boosters.splice(boosterIndex, 1);

      // Check if round is complete
      if (draft.boosters.length === 0) {
        if (draft.currentRound < draft.totalRounds) {
          // Start new round
          draft.currentRound++;
          draft.direction = draft.direction === 'left' ? 'right' : 'left';
          const newBoosters = await generateBoosters(draft);
          draft.boosters = newBoosters;
        } else {
          // Draft complete
          draft.status = 'completed';
        }
      }
    } else {
      // Increment currentPlayerIndex to pass the booster
      booster.currentPlayerIndex = (booster.currentPlayerIndex || 0) + 1;
    }

    await draft.save();

    // Auto-pick for bots
    setTimeout(() => autoPickForBots(draft._id), 1500);

    res.json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper functions
function generatePlayerId() {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function findPlayerBooster(draft, playerIndex) {
  const totalPlayers = draft.players.length;
  const direction = draft.direction === 'left' ? 1 : -1;

  for (let i = 0; i < draft.boosters.length; i++) {
    const boosterOwner = (i + draft.currentRound - 1) % totalPlayers;
    const currentPosition = (boosterOwner + direction * draft.boosters[i].currentPlayerIndex + totalPlayers) % totalPlayers;

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
    for (let i = 0; i < draft.players.length; i++) {
      const boosterCards = await generateSetBooster(draft.cardsPerBooster);
      boosters.push({
        cards: boosterCards,
        currentPlayerIndex: 0
      });
    }
  } else {
    // Cube draft - singleton cards
    const allCards = await Card.find({ _id: { $nin: draft.usedCards } });

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

async function generateSetBooster(count = 15) {
  // Play booster distribution: 10-11 commons, 3-4 uncommons, 1 rare/mythic
  const commons = await Card.aggregate([
    { $match: { rarity: 'Common' } },
    { $sample: { size: 10 } }
  ]);

  const uncommons = await Card.aggregate([
    { $match: { rarity: 'Uncommon' } },
    { $sample: { size: 3 } }
  ]);

  // 1/8 chance for mythic, otherwise rare
  const isMythic = Math.random() < 0.125;
  const rareCards = await Card.aggregate([
    { $match: { rarity: isMythic ? 'Mythic' : 'Rare' } },
    { $sample: { size: 1 } }
  ]);

  // If we need more cards, add commons
  const totalCards = commons.length + uncommons.length + rareCards.length;
  if (totalCards < count) {
    const extraCommons = await Card.aggregate([
      { $match: { rarity: 'Common', _id: { $nin: commons.map(c => c._id) } } },
      { $sample: { size: count - totalCards } }
    ]);
    commons.push(...extraCommons);
  }

  return shuffleArray([...commons, ...uncommons, ...rareCards]).map(c => c._id);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function autoPickForBots(draftId) {
  try {
    const draft = await Draft.findById(draftId).populate('boosters.cards');

    if (!draft || draft.status !== 'drafting') {
      return;
    }

    let madePick = false;
    const boostersToRemove = [];
    const boostersPicked = new Set(); // Track which boosters had picks made

    // First, all bots pick from their current boosters
    for (let i = 0; i < draft.players.length; i++) {
      const player = draft.players[i];

      if (player.isBot) {
        const boosterIndex = findPlayerBooster(draft, i);

        if (boosterIndex !== -1) {
          const booster = draft.boosters[boosterIndex];

          if (booster.cards.length > 0) {
            // Bot picks a random card (simple AI)
            const randomIndex = Math.floor(Math.random() * booster.cards.length);
            const pickedCard = booster.cards[randomIndex];

            player.pickedCards.push(pickedCard._id);
            booster.cards.splice(randomIndex, 1);
            madePick = true;

            // Track that this booster had a pick made
            boostersPicked.add(boosterIndex);

            // Mark empty boosters for removal
            if (booster.cards.length === 0) {
              boostersToRemove.push(boosterIndex);
            }
          }
        }
      }
    }

    // Remove empty boosters (in reverse order to maintain indices)
    boostersToRemove.sort((a, b) => b - a);
    for (const index of boostersToRemove) {
      draft.boosters.splice(index, 1);
    }

    // Then, pass only the boosters that bots picked from
    if (madePick) {
      // Recalculate indices after removal
      const adjustedIndices = Array.from(boostersPicked).map(originalIndex => {
        const removedBefore = boostersToRemove.filter(removed => removed < originalIndex).length;
        return originalIndex - removedBefore;
      });

      for (const index of adjustedIndices) {
        if (index >= 0 && index < draft.boosters.length) {
          draft.boosters[index].currentPlayerIndex = (draft.boosters[index].currentPlayerIndex || 0) + 1;
        }
      }
    }

    // Check if round is complete
    if (draft.boosters.length === 0) {
      if (draft.currentRound < draft.totalRounds) {
        draft.currentRound++;
        draft.direction = draft.direction === 'left' ? 'right' : 'left';
        const newBoosters = await generateBoosters(draft);
        draft.boosters = newBoosters;
      } else {
        draft.status = 'completed';
      }
    }

    if (madePick) {
      await draft.save();

      // Continue auto-picking if there are more bots
      if (draft.status === 'drafting') {
        setTimeout(() => autoPickForBots(draftId), 1500);
      }
    }
  } catch (error) {
    console.error('Error in auto-pick:', error);
  }
}

export default router;
