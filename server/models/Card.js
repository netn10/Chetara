import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  manaCost: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  subtype: String,
  power: {
    type: Number,
    default: null
  },
  toughness: {
    type: Number,
    default: null
  },
  loyalty: {
    type: Number,
    default: null
  },
  text: {
    type: String,
    required: true
  },
  colors: [{
    type: String,
    enum: ['W', 'U', 'B', 'R', 'G']
  }],
  rarity: {
    type: String,
    enum: ['Common', 'Uncommon', 'Rare', 'Mythic'],
    required: true
  },
  custom: {
    type: Boolean,
    default: true
  },
  archetypes: [String],
  imageUrl: String,
  artist: String,
  flavorText: String,
  set: {
    type: String,
    default: 'Set 1'
  },
  notes: String,
  chessPiece: {
    type: String,
    enum: ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'none'],
    default: 'none'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Card', cardSchema);
