import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  isConnected: { type: Boolean, default: true },
  pool: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  deck: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  sideboard: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  deckBuilt: { type: Boolean, default: false }
});

const sealedSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['waiting', 'opening', 'building', 'ready', 'completed'],
    default: 'waiting'
  },
  players: [playerSchema],
  packsPerPlayer: { type: Number, default: 6 },
  cardsPerPack: { type: Number, default: 15 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Sealed = mongoose.model('Sealed', sealedSchema);

export default Sealed;
