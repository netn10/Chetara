import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  isConnected: { type: Boolean, default: true },
  points: { type: Number, default: 0 },
  life: { type: Number, default: 20 },
  hand: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  permanents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  activatedAbilitiesThisTurn: [{
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
    abilityIndex: Number,
    activated: Boolean
  }]
});

const judgeTowerSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['waiting', 'playing', 'round_end', 'completed'],
    default: 'waiting'
  },
  players: [playerSchema],
  currentPlayerIndex: { type: Number, default: 0 },
  currentRound: { type: Number, default: 1 },

  // Shared game state
  library: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  graveyard: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  exile: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],

  // Game state tracking
  currentPhase: {
    type: String,
    enum: ['untap', 'upkeep', 'draw', 'main1', 'combat_begin', 'attackers', 'blockers', 'damage', 'combat_end', 'main2', 'end', 'cleanup', 'chess'],
    default: 'untap'
  },

  // Judge Tower specific tracking
  mustPlayCards: { type: Boolean, default: true },
  mustActivateAbilities: { type: Boolean, default: true },
  xValue: { type: Number, default: 3 },
  infiniteMana: { type: Boolean, default: true },

  // Round tracking
  roundWinner: { type: String, default: null },
  gameLog: [{ type: String }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Method to start a new round
judgeTowerSchema.methods.startNewRound = function() {
  // Reset all players' life to 20
  this.players.forEach(player => {
    player.life = 20;
    player.hand = [];
    player.permanents = [];
    player.activatedAbilitiesThisTurn = [];
  });

  // Exile all cards from graveyard
  this.exile.push(...this.graveyard);
  this.graveyard = [];

  this.currentRound++;
  this.roundWinner = null;
  this.currentPhase = 'untap';
  this.currentPlayerIndex = 0;
};

// Method to check if game is complete
judgeTowerSchema.methods.isGameComplete = function() {
  return this.library.length === 0;
};

// Method to get winner
judgeTowerSchema.methods.getWinner = function() {
  if (!this.isGameComplete()) return null;

  let maxPoints = -1;
  let winner = null;

  this.players.forEach(player => {
    if (player.points > maxPoints) {
      maxPoints = player.points;
      winner = player;
    }
  });

  return winner;
};

const JudgeTower = mongoose.model('JudgeTower', judgeTowerSchema);

export default JudgeTower;
