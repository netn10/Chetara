import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Card from '../models/Card.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Color mapping from folder names to MTG color codes
const colorMapping = {
  'White': ['W'],
  'Blue': ['U'],
  'Black': ['B'],
  'Red': ['R'],
  'Green': ['G'],
  'Colorless': [],
  'Gold': [], // Will be set to multicolor based on card name/type
  'Land': []
};

// Helper function to extract card name from filename
function getCardNameFromFile(filename) {
  // Remove file extension and clean up the name
  return filename
    .replace(/\.(png|jpg|jpeg)$/i, '')
    .replace(/_/g, ' ')
    .trim();
}

// Helper function to determine rarity (placeholder logic)
function determineRarity(cardName) {
  // This is placeholder logic - you should update this based on actual rarity
  // For now, distributing randomly
  const random = Math.random();
  if (random < 0.4) return 'Common';
  if (random < 0.7) return 'Uncommon';
  if (random < 0.9) return 'Rare';
  return 'Mythic';
}

// Helper function to determine card type (placeholder logic)
function determineCardType(cardName, folderName) {
  if (folderName === 'Land') return 'Land';

  // Simple heuristics based on card name
  const nameLower = cardName.toLowerCase();

  if (nameLower.includes('summon')) return 'Sorcery';
  if (nameLower.includes('instant')) return 'Instant';
  if (nameLower.includes('aura') || nameLower.includes('enchant')) return 'Enchantment — Aura';
  if (nameLower.includes('artifact')) return 'Artifact';

  // Default to creature
  return 'Creature';
}

// Helper function to determine mana cost (placeholder)
function determineManaCost(cardName, colors, type) {
  if (type === 'Land') return '';

  // Placeholder mana cost based on colors
  if (colors.length === 0) return '{2}';
  if (colors.length === 1) return `{1}{${colors[0]}}`;
  if (colors.length === 2) return `{${colors[0]}}{${colors[1]}}`;
  return `{1}{${colors[0]}}{${colors[1]}}`;
}

// Helper function to get colors for Gold cards
function getGoldColors(cardName) {
  // Default to two colors for gold cards
  // This is a placeholder - you should update based on actual card data
  const combinations = [
    ['W', 'U'], ['U', 'B'], ['B', 'R'], ['R', 'G'], ['G', 'W'],
    ['W', 'B'], ['U', 'R'], ['B', 'G'], ['R', 'W'], ['G', 'U']
  ];
  const index = cardName.length % combinations.length;
  return combinations[index];
}

async function populateDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-magic');
    console.log('✅ Connected to MongoDB');

    // Clear existing cards
    console.log('🗑️  Clearing existing cards...');
    await Card.deleteMany({});

    // Preferred path: seed from the fully transcribed DB (real card data +
    // hosted GitHub-Release imageUrls). Falls back to a folder scan if absent.
    const dbFile = path.join(__dirname, '../data/cards.json');
    if (fs.existsSync(dbFile)) {
      const cards = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
      console.log(`📥 Seeding from data/cards.json (${cards.length} cards)`);
      await Card.insertMany(cards);
      console.log(`✅ Inserted ${cards.length} cards from data/cards.json`);
      await mongoose.disconnect();
      return;
    }
    console.log('ℹ️  data/cards.json not found — falling back to folder scan.');

    // Card art lives outside the repo (6+ GB). Point at it via CARD_IMAGES_DIR;
    // defaults to the local D: stash. The images themselves are hosted on a
    // GitHub Release (see gh_release_map.json) so deploys don't need the files.
    const baseDir = process.env.CARD_IMAGES_DIR || 'D:/נתי/Chess Magic';
    const colorFolders = ['Black', 'Blue', 'Colorless', 'Gold', 'Green', 'Land', 'Red', 'White'];

    // Map of "<Color>/<file>" -> hosted release URL, built by the art uploader.
    const mapPath = path.join(__dirname, 'gh_release_map.json');
    const artMap = fs.existsSync(mapPath) ? JSON.parse(fs.readFileSync(mapPath, 'utf-8')) : {};
    console.log(`🔗 Loaded ${Object.keys(artMap).length} hosted image URLs`);

    const cardsToInsert = [];

    // Scan each color folder
    for (const folder of colorFolders) {
      const folderPath = path.join(baseDir, folder);

      if (!fs.existsSync(folderPath)) {
        console.log(`⚠️  Folder not found: ${folder}`);
        continue;
      }

      const files = fs.readdirSync(folderPath);
      const imageFiles = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));

      console.log(`📁 Processing ${folder}: ${imageFiles.length} cards`);

      for (const file of imageFiles) {
        const cardName = getCardNameFromFile(file);
        const filePath = path.join(folderPath, file);

        // Determine colors
        let colors = colorMapping[folder] || [];
        if (folder === 'Gold') {
          colors = getGoldColors(cardName);
        }

        // Determine card type
        const cardType = determineCardType(cardName, folder);

        // Determine mana cost
        const manaCost = determineManaCost(cardName, colors, cardType);

        // Create card object
        const cardData = {
          name: cardName,
          manaCost: manaCost,
          type: cardType,
          rarity: determineRarity(cardName),
          text: 'Card text to be added.', // Placeholder
          colors: colors,
          custom: true,
          archetypes: [],
          imageUrl: artMap[`${folder}/${file}`] || `file:///${filePath.replace(/\\/g, '/')}`, // hosted URL, else local
          flavorText: '',
          artist: 'DALL-E 3',
          set: 'Set 1',
          notes: '',
          power: cardType.includes('Creature') ? 2 : null,
          toughness: cardType.includes('Creature') ? 2 : null,
          loyalty: cardType.includes('Planeswalker') ? 3 : null,
          chessPiece: 'none'
        };

        cardsToInsert.push(cardData);
      }
    }

    // Insert all cards
    console.log(`\n💾 Inserting ${cardsToInsert.length} cards into database...`);
    await Card.insertMany(cardsToInsert);

    console.log('✅ Database populated successfully!');
    console.log(`\n📊 Summary:`);
    for (const folder of colorFolders) {
      const count = cardsToInsert.filter(c => {
        if (folder === 'White') return c.colors.includes('W') && c.colors.length === 1;
        if (folder === 'Blue') return c.colors.includes('U') && c.colors.length === 1;
        if (folder === 'Black') return c.colors.includes('B') && c.colors.length === 1;
        if (folder === 'Red') return c.colors.includes('R') && c.colors.length === 1;
        if (folder === 'Green') return c.colors.includes('G') && c.colors.length === 1;
        if (folder === 'Colorless') return c.colors.length === 0 && c.type !== 'Land';
        if (folder === 'Gold') return c.colors.length > 1;
        if (folder === 'Land') return c.type === 'Land';
        return false;
      }).length;
      if (count > 0) {
        console.log(`  ${folder}: ${count} cards`);
      }
    }
    console.log(`  Total: ${cardsToInsert.length} cards`);

  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the script
populateDatabase();
