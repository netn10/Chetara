import express from 'express';
import Card from '../models/Card.js';

const router = express.Router();

// Get all cards
router.get('/', async (req, res) => {
  try {
    const { color, rarity, chessPiece, search } = req.query;
    let query = {};

    if (color) {
      query.colors = color;
    }
    if (rarity) {
      query.rarity = rarity;
    }
    if (chessPiece && chessPiece !== 'all') {
      query.chessPiece = chessPiece;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { text: { $regex: search, $options: 'i' } }
      ];
    }

    const cards = await Card.find(query).sort({ name: 1 });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get random chess card (must be before /:id to avoid route conflict)
router.get('/random/chess', async (req, res) => {
  try {
    // Get a random card that has a chessPiece designation (not 'none')
    const cards = await Card.aggregate([
      { $match: { chessPiece: { $ne: 'none' } } },
      { $sample: { size: 1 } }
    ]);

    if (cards.length === 0) {
      return res.status(404).json({ message: 'No chess cards found' });
    }

    res.json(cards[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single card
router.get('/:id', async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create card
router.post('/', async (req, res) => {
  const card = new Card(req.body);
  try {
    const newCard = await card.save();
    res.status(201).json(newCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update card
router.put('/:id', async (req, res) => {
  try {
    const card = await Card.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    res.json(card);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete card
router.delete('/:id', async (req, res) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk create cards (for initial setup)
router.post('/bulk', async (req, res) => {
  try {
    const cards = await Card.insertMany(req.body.cards);
    res.status(201).json(cards);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
