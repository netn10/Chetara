// JSON fallback for card reads when MongoDB is unavailable.
// Serves server/data/cards.json so the site works with no database, and
// automatically yields to Mongo whenever it's connected. Each card gets a
// deterministic 24-hex _id (md5 of its name) so it passes isMongoId() checks
// and stays stable across requests/deploys.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '../data/cards.json');

let _cards = null;
function load() {
  if (_cards) return _cards;
  const raw = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, 'utf-8')) : [];
  _cards = raw.map((c) => ({
    _id: crypto.createHash('md5').update(c.name).digest('hex').slice(0, 24),
    ...c,
  }));
  return _cards;
}

export function mongoConnected() {
  return mongoose.connection.readyState === 1;
}

export function fbFind({ color, rarity, chessPiece, search } = {}) {
  let cards = load();
  if (color) cards = cards.filter((c) => (c.colors || []).includes(color));
  if (rarity) cards = cards.filter((c) => c.rarity === rarity);
  if (chessPiece && chessPiece !== 'all') cards = cards.filter((c) => c.chessPiece === chessPiece);
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    cards = cards.filter((c) => re.test(c.name));
  }
  return cards.slice().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 1000);
}

export function fbById(id) {
  return load().find((c) => c._id === id) || null;
}

export function fbRandomChess() {
  const pool = load().filter((c) => c.chessPiece && c.chessPiece !== 'none');
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}
