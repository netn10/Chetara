import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  isBot: { type: Boolean, default: false },
  isConnected: { type: Boolean, default: true },
  currentPick: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
  pickedCards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  seatNumber: { type: Number, required: true }
});

const boosterSchema = new mongoose.Schema({
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  currentPlayerIndex: { type: Number, default: 0 }
});

const draftSchema = new mongoose.Schema({
  draftType: {
    type: String,
    enum: ['set', 'cube'],
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'drafting', 'completed'],
    default: 'waiting'
  },
  players: [playerSchema],
  currentRound: { type: Number, default: 0 },
  totalRounds: { type: Number, default: 3 }, // 3 packs per player
  cardsPerBooster: { type: Number, default: 15 },
  direction: { type: String, enum: ['left', 'right'], default: 'left' },
  boosters: [boosterSchema],
  usedCards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }], // For cube mode
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  // Disable versioning to avoid conflicts with rapid bot picks
  versionKey: false
});

draftSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Draft', draftSchema);
