import express from 'express';
import Card from '../models/Card.js';
import { Errors, asyncHandler } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import { mongoConnected, fbFind, fbById } from '../utils/fallbackCards.js';

const router = express.Router();

// In-memory Judge Tower games (no database). State is ephemeral.
const games = new Map();

function generatePlayerId() {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function generateGameId() {
  return `judgetower-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function makePlayer(name) {
  return {
    id: generatePlayerId(), name, isConnected: true, points: 0, life: 20,
    hand: [], permanents: [], activatedAbilitiesThisTurn: [],
  };
}

// Ported JudgeTower model methods (operate on the plain in-memory game object).
function startNewRound(game) {
  game.players.forEach((p) => {
    p.life = 20; p.hand = []; p.permanents = []; p.activatedAbilitiesThisTurn = [];
  });
  game.exile.push(...game.graveyard);
  game.graveyard = [];
  game.currentRound++;
  game.roundWinner = null;
  game.currentPhase = 'untap';
  game.currentPlayerIndex = 0;
}
function isGameComplete(game) {
  return game.library.length === 0;
}
function getWinner(game) {
  if (!isGameComplete(game)) return null;
  let max = -1, winner = null;
  game.players.forEach((p) => { if (p.points > max) { max = p.points; winner = p; } });
  return winner;
}

// Expand card-id arrays to full card objects for the response.
const pc = (ids) => (ids || []).map(fbById).filter(Boolean);
function populate(game) {
  return {
    ...game,
    library: pc(game.library),
    graveyard: pc(game.graveyard),
    exile: pc(game.exile),
    players: game.players.map((p) => ({ ...p, hand: pc(p.hand), permanents: pc(p.permanents) })),
  };
}

/** POST /api/judge-tower/create */
router.post('/create', asyncHandler(async (req, res) => {
  const { playerName } = req.body;
  if (!playerName) throw Errors.missingField('playerName');

  const allCards = mongoConnected() ? await Card.find({}) : fbFind({});
  if (allCards.length === 0) throw Errors.cardsInsufficient();
  const shuffledCards = shuffleArray(allCards.map((c) => c._id));

  const game = {
    _id: generateGameId(),
    players: [makePlayer(playerName)],
    library: shuffledCards,
    graveyard: [], exile: [],
    status: 'waiting',
    currentPlayerIndex: 0, currentRound: 1, currentPhase: 'untap',
    mustPlayCards: true, mustActivateAbilities: true, xValue: 3, infiniteMana: true,
    roundWinner: null, gameLog: [],
    createdAt: new Date(), updatedAt: new Date(),
  };
  games.set(game._id, game);
  logger.info(`Judge Tower game created with ID: ${game._id}`);
  res.status(201).json(game);
}));

/** POST /api/judge-tower/:id/join */
router.post('/:id/join', asyncHandler(async (req, res) => {
  const { playerName } = req.body;
  if (!playerName) throw Errors.missingField('playerName');

  const game = games.get(req.params.id);
  if (!game) throw Errors.gameNotFound();
  if (game.status !== 'waiting') throw Errors.gameAlreadyStarted();

  const newPlayer = makePlayer(playerName);
  game.players.push(newPlayer);
  game.updatedAt = new Date();
  logger.info(`Player ${playerName} joined Judge Tower game ${game._id}`);
  res.json({ game, playerId: newPlayer.id });
}));

/** POST /api/judge-tower/:id/start */
router.post('/:id/start', asyncHandler(async (req, res) => {
  const game = games.get(req.params.id);
  if (!game) throw Errors.gameNotFound();
  if (game.players.length < 1) throw Errors.insufficientPlayers(1);

  game.status = 'playing';
  game.currentRound = 1;
  game.currentPlayerIndex = 0;
  game.currentPhase = 'untap';
  game.updatedAt = new Date();
  logger.info(`Judge Tower game ${game._id} started with ${game.players.length} players`);
  res.json(game);
}));

/** GET /api/judge-tower/:id */
router.get('/:id', asyncHandler(async (req, res) => {
  const game = games.get(req.params.id);
  if (!game) throw Errors.gameNotFound();
  res.json(populate(game));
}));

/** POST /api/judge-tower/:id/draw */
router.post('/:id/draw', asyncHandler(async (req, res) => {
  const { playerId } = req.body;
  if (!playerId) throw Errors.missingField('playerId');

  const game = games.get(req.params.id);
  if (!game) throw Errors.gameNotFound();

  const player = game.players.find((p) => p.id === playerId);
  if (!player) throw Errors.playerNotFound();
  if (game.library.length === 0) throw Errors.libraryEmpty();

  const drawnCard = game.library.shift();
  player.hand.push(drawnCard);
  game.gameLog.push(`${player.name} drew a card`);
  game.updatedAt = new Date();
  logger.info(`Player ${player.name} drew a card in game ${game._id}`);
  res.json(populate(game));
}));

/** POST /api/judge-tower/:id/play */
router.post('/:id/play', asyncHandler(async (req, res) => {
  const { playerId, cardId } = req.body;
  if (!playerId || !cardId) throw Errors.missingField('playerId and cardId');

  const game = games.get(req.params.id);
  if (!game) throw Errors.gameNotFound();

  const player = game.players.find((p) => p.id === playerId);
  if (!player) throw Errors.playerNotFound();

  const cardIndex = player.hand.findIndex((id) => String(id) === String(cardId));
  if (cardIndex === -1) throw Errors.cardNotInHand();

  const cid = player.hand[cardIndex];
  const card = fbById(cid) || { type: '', name: 'a card' };
  player.hand.splice(cardIndex, 1);

  if (card.type.includes('Instant') || card.type.includes('Sorcery')) {
    game.graveyard.push(cid);
    game.gameLog.push(`${player.name} cast ${card.name} (goes to graveyard)`);
  } else {
    player.permanents.push(cid);
    game.gameLog.push(`${player.name} played ${card.name}`);
  }
  game.updatedAt = new Date();
  logger.info(`Player ${player.name} played ${card.name} in game ${game._id}`);
  res.json(populate(game));
}));

/** POST /api/judge-tower/:id/next-phase */
router.post('/:id/next-phase', asyncHandler(async (req, res) => {
  const game = games.get(req.params.id);
  if (!game) throw Errors.gameNotFound();

  const phaseOrder = ['untap', 'upkeep', 'draw', 'main1', 'combat_begin', 'attackers', 'blockers', 'damage', 'combat_end', 'main2', 'end', 'cleanup', 'chess'];
  const currentIndex = phaseOrder.indexOf(game.currentPhase);

  if (currentIndex === phaseOrder.length - 1) {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    game.currentPhase = 'untap';
    game.players.forEach((player) => { player.life = 20; player.activatedAbilitiesThisTurn = []; });
    game.gameLog.push(`Turn ${game.currentPlayerIndex + 1}: ${game.players[game.currentPlayerIndex].name}'s turn`);
  } else {
    game.currentPhase = phaseOrder[currentIndex + 1];
    game.gameLog.push(`Phase: ${game.currentPhase}`);
  }
  game.updatedAt = new Date();
  res.json(game);
}));

/** POST /api/judge-tower/:id/end-round */
router.post('/:id/end-round', asyncHandler(async (req, res) => {
  const { winnerId, reason } = req.body;
  const game = games.get(req.params.id);
  if (!game) throw Errors.gameNotFound();

  const winner = game.players.find((p) => p.id === winnerId);
  if (winner) {
    winner.points++;
    game.roundWinner = winnerId;
    game.gameLog.push(`Round ${game.currentRound} won by ${winner.name}! ${reason || ''}`);
  } else {
    game.gameLog.push(`Round ${game.currentRound} ended: ${reason || 'Rules violation'}`);
  }
  game.status = 'round_end';

  if (isGameComplete(game)) {
    game.status = 'completed';
    const gameWinner = getWinner(game);
    if (gameWinner) {
      game.gameLog.push(`GAME OVER! Winner: ${gameWinner.name} with ${gameWinner.points} points!`);
      logger.info(`Game ${game._id} completed! Winner: ${gameWinner.name}`);
    }
  }
  game.updatedAt = new Date();
  res.json(game);
}));

/** POST /api/judge-tower/:id/next-round */
router.post('/:id/next-round', asyncHandler(async (req, res) => {
  const game = games.get(req.params.id);
  if (!game) throw Errors.gameNotFound();
  if (isGameComplete(game)) throw Errors.gameCompleted();

  startNewRound(game);
  game.status = 'playing';
  game.gameLog.push(`Starting Round ${game.currentRound}`);
  game.updatedAt = new Date();
  logger.info(`Started round ${game.currentRound} in game ${game._id}`);
  res.json(game);
}));

export default router;
