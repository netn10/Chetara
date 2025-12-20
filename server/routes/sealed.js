import express from 'express';
import Sealed from '../models/Sealed.js';
import Card from '../models/Card.js';

const router = express.Router();

function generatePlayerId() {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function generateBooster(count = 15) {
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
}

// Create a new sealed event
router.post('/create', async (req, res) => {
  try {
    const { playerName, packsPerPlayer = 6 } = req.body;

    if (!playerName) {
      return res.status(400).json({ message: 'Player name required' });
    }

    const players = [{
      id: generatePlayerId(),
      name: playerName,
      isConnected: true,
      pool: [],
      deck: [],
      sideboard: [],
      deckBuilt: false
    }];

    const sealed = new Sealed({
      players,
      packsPerPlayer,
      status: 'waiting'
    });

    await sealed.save();
    res.status(201).json(sealed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join sealed event
router.post('/:id/join', async (req, res) => {
  try {
    const { playerName } = req.body;
    const sealed = await Sealed.findById(req.params.id);

    if (!sealed) {
      return res.status(404).json({ message: 'Sealed event not found' });
    }

    if (sealed.status !== 'waiting') {
      return res.status(400).json({ message: 'Event already started' });
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
    await sealed.save();

    res.json({ sealed, playerId: newPlayer.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start sealed event - open packs for all players
router.post('/:id/start', async (req, res) => {
  try {
    const sealed = await Sealed.findById(req.params.id);

    if (!sealed) {
      return res.status(404).json({ message: 'Sealed event not found' });
    }

    if (sealed.players.length < 1) {
      return res.status(400).json({ message: 'Need at least 1 player' });
    }

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

    res.json(populatedSealed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sealed event status
router.get('/:id', async (req, res) => {
  try {
    const sealed = await Sealed.findById(req.params.id)
      .populate('players.pool')
      .populate('players.deck')
      .populate('players.sideboard');

    if (!sealed) {
      return res.status(404).json({ message: 'Sealed event not found' });
    }

    res.json(sealed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update player's deck
router.post('/:id/update-deck', async (req, res) => {
  try {
    const { playerId, deck, sideboard } = req.body;
    const sealed = await Sealed.findById(req.params.id);

    if (!sealed) {
      return res.status(404).json({ message: 'Sealed event not found' });
    }

    const player = sealed.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    player.deck = deck;
    player.sideboard = sideboard;
    player.deckBuilt = deck.length >= 40;

    sealed.updatedAt = Date.now();
    await sealed.save();

    // Populate before returning
    const populatedSealed = await Sealed.findById(sealed._id)
      .populate('players.pool')
      .populate('players.deck')
      .populate('players.sideboard');

    res.json(populatedSealed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark deck as complete
router.post('/:id/complete-deck', async (req, res) => {
  try {
    const { playerId } = req.body;
    const sealed = await Sealed.findById(req.params.id);

    if (!sealed) {
      return res.status(404).json({ message: 'Sealed event not found' });
    }

    const player = sealed.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    if (player.deck.length < 40) {
      return res.status(400).json({ message: 'Deck must have at least 40 cards' });
    }

    player.deckBuilt = true;

    // Check if all players are ready
    const allReady = sealed.players.every(p => p.deckBuilt);
    if (allReady) {
      sealed.status = 'ready';
    }

    sealed.updatedAt = Date.now();
    await sealed.save();

    // Populate before returning
    const populatedSealed = await Sealed.findById(sealed._id)
      .populate('players.pool')
      .populate('players.deck')
      .populate('players.sideboard');

    res.json(populatedSealed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
