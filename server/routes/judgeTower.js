import express from 'express';
import JudgeTower from '../models/JudgeTower.js';
import Card from '../models/Card.js';

const router = express.Router();

// Helper function to generate player ID
function generatePlayerId() {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new Judge Tower game
router.post('/create', async (req, res) => {
  try {
    const { playerName } = req.body;

    if (!playerName) {
      return res.status(400).json({ message: 'Player name required' });
    }

    // Get all cards for the cube (library)
    const allCards = await Card.find({});

    if (allCards.length === 0) {
      return res.status(400).json({ message: 'No cards available in database' });
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

    const judgeTower = new JudgeTower({
      players,
      library: shuffledCards,
      graveyard: [],
      exile: [],
      status: 'waiting'
    });

    await judgeTower.save();
    res.status(201).json(judgeTower);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join an existing Judge Tower game
router.post('/:id/join', async (req, res) => {
  try {
    const { playerName } = req.body;
    const game = await JudgeTower.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Judge Tower game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ message: 'Game already started' });
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
    await game.save();

    res.json({ game, playerId: newPlayer.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start the game
router.post('/:id/start', async (req, res) => {
  try {
    const game = await JudgeTower.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Judge Tower game not found' });
    }

    if (game.players.length < 1) {
      return res.status(400).json({ message: 'Need at least 1 player to start' });
    }

    game.status = 'playing';
    game.currentRound = 1;
    game.currentPlayerIndex = 0;
    game.currentPhase = 'untap';

    await game.save();
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get game status
router.get('/:id', async (req, res) => {
  try {
    const game = await JudgeTower.findById(req.params.id)
      .populate('library')
      .populate('graveyard')
      .populate('exile')
      .populate('players.hand')
      .populate('players.permanents');

    if (!game) {
      return res.status(404).json({ message: 'Judge Tower game not found' });
    }

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Draw a card (from top of shared library)
router.post('/:id/draw', async (req, res) => {
  try {
    const { playerId } = req.body;
    const game = await JudgeTower.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Judge Tower game not found' });
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    if (game.library.length === 0) {
      return res.status(400).json({ message: 'Library is empty' });
    }

    // Draw from top of library
    const drawnCard = game.library.shift();
    player.hand.push(drawnCard);

    game.gameLog.push(`${player.name} drew a card`);
    game.updatedAt = Date.now();

    await game.save();
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Play a card
router.post('/:id/play', async (req, res) => {
  try {
    const { playerId, cardId } = req.body;
    const game = await JudgeTower.findById(req.params.id).populate('players.hand');

    if (!game) {
      return res.status(404).json({ message: 'Judge Tower game not found' });
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    const cardIndex = player.hand.findIndex(c => c._id.toString() === cardId);
    if (cardIndex === -1) {
      return res.status(400).json({ message: 'Card not in hand' });
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
    await game.save();
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Advance phase
router.post('/:id/next-phase', async (req, res) => {
  try {
    const game = await JudgeTower.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Judge Tower game not found' });
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
    await game.save();
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// End round (someone won or rules violation)
router.post('/:id/end-round', async (req, res) => {
  try {
    const { winnerId, reason } = req.body;
    const game = await JudgeTower.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Judge Tower game not found' });
    }

    const winner = game.players.find(p => p.id === winnerId);
    if (winner) {
      winner.points++;
      game.roundWinner = winnerId;
      game.gameLog.push(`Round ${game.currentRound} won by ${winner.name}! ${reason || ''}`);
    } else {
      game.gameLog.push(`Round ${game.currentRound} ended: ${reason || 'Rules violation'}`);
    }

    game.status = 'round_end';

    // Check if game is complete
    if (game.isGameComplete()) {
      game.status = 'completed';
      const gameWinner = game.getWinner();
      if (gameWinner) {
        game.gameLog.push(`GAME OVER! Winner: ${gameWinner.name} with ${gameWinner.points} points!`);
      }
    }

    game.updatedAt = Date.now();
    await game.save();
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start next round
router.post('/:id/next-round', async (req, res) => {
  try {
    const game = await JudgeTower.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Judge Tower game not found' });
    }

    if (game.isGameComplete()) {
      return res.status(400).json({ message: 'Game is complete, no more rounds' });
    }

    game.startNewRound();
    game.status = 'playing';
    game.gameLog.push(`Starting Round ${game.currentRound}`);

    game.updatedAt = Date.now();
    await game.save();
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default router;
