// Chess Magic - Game Configuration Constants

// Time settings (in seconds)
export const GAME_TIME = {
  WHITE_START: 600, // 10 minutes
  BLACK_START: 600, // 10 minutes
  LOW_TIME_THRESHOLD: 60, // Show warning when under 1 minute
  CRITICAL_TIME_THRESHOLD: 30 // Show critical warning
};

// Board settings
export const BOARD = {
  SQUARE_SIZE: 80, // pixels
  FILES: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
  RANKS: ['8', '7', '6', '5', '4', '3', '2', '1']
};

// Piece values for material calculation
export const PIECE_VALUES = {
  p: 1, // Pawn
  n: 3, // Knight
  b: 3, // Bishop
  r: 5, // Rook
  q: 9, // Queen
  k: 0  // King
};

// Chess piece symbols (Unicode)
export const PIECE_SYMBOLS = {
  p: { w: '♙', b: '♟' }, // Pawn
  n: { w: '♘', b: '♞' }, // Knight
  b: { w: '♗', b: '♝' }, // Bishop
  r: { w: '♖', b: '♜' }, // Rook
  q: { w: '♕', b: '♛' }, // Queen
  k: { w: '♔', b: '♚' }  // King
};

// Sound frequency settings (for move sounds)
export const SOUND = {
  CAPTURE_FREQUENCY: 200,    // Lower pitch for captures
  CHECK_FREQUENCY: 800,      // Higher pitch for checks
  MOVE_FREQUENCY: 400,       // Medium pitch for normal moves
  DURATION: 0.1,             // Sound duration in seconds
  VOLUME: 0.1                // Volume level (0-1)
};

// Card linking settings
export const CARD_LINKING = {
  MIN_HUE: 0,
  MAX_HUE: 360,
  MIN_SATURATION: 65,        // Percentage
  MAX_SATURATION: 95,        // Percentage
  MIN_LIGHTNESS: 45,         // Percentage
  MAX_LIGHTNESS: 65,         // Percentage
  BORDER_WIDTH: 3            // pixels
};

// LocalStorage keys
export const STORAGE_KEYS = {
  GAME_STATE: 'chessMagicGameState',
  CARDS_CACHE: 'chessmagic_cards',
  CARDS_TIMESTAMP: 'chessmagic_cards_timestamp',
  AUTH_TOKEN: 'authToken',
  SELECTED_MODE: 'play_selectedMode',
  DRAFT_TYPE: 'play_draftType'
};

// API settings
export const API = {
  CARD_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  DRAFT_POLL_INTERVAL: 1000,          // 1 second
  MAX_RETRY_ATTEMPTS: 3,
  REQUEST_TIMEOUT: 30000              // 30 seconds
};

// Card settings
export const CARD = {
  MAX_NAME_LENGTH: 100,
  MAX_TEXT_LENGTH: 2000,
  MIN_POWER: -100,
  MAX_POWER: 100,
  MIN_TOUGHNESS: -100,
  MAX_TOUGHNESS: 100
};

// Draft settings
export const DRAFT = {
  DEFAULT_ROUNDS: 3,
  DEFAULT_CARDS_PER_BOOSTER: 15,
  INITIAL_PICK_TIME: 60,     // seconds
  MIDDLE_PICK_TIME: 30,      // seconds
  FINAL_PICK_TIME: 15,       // seconds
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2
};

// Sealed settings
export const SEALED = {
  DEFAULT_PACKS_PER_PLAYER: 6,
  DEFAULT_CARDS_PER_PACK: 15
};

// Animation durations (in milliseconds)
export const ANIMATION = {
  VICTORY_PULSE: 2000,
  MODAL_FADE: 300,
  CARD_FLIP: 600,
  BOOSTER_OPEN: 1000
};

// Win methods
export const WIN_METHOD = {
  CHECKMATE: 'checkmate',
  TIMEOUT: 'timeout',
  KING_CAPTURE: 'king_capture',
  RESIGNATION: 'resignation'
};

// Game status messages
export const STATUS_MESSAGES = {
  WHITE_TURN: "White's turn",
  BLACK_TURN: "Black's turn",
  WHITE_CHECK: "White is in check!",
  BLACK_CHECK: "Black is in check!",
  CHECKMATE: "Checkmate!",
  STALEMATE: "Stalemate!",
  DRAW: "Game is a draw!"
};

// Color constants (MTG)
export const MTG_COLORS = {
  WHITE: 'W',
  BLUE: 'U',
  BLACK: 'B',
  RED: 'R',
  GREEN: 'G'
};

// Rarity constants
export const RARITY = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  MYTHIC: 'Mythic'
};

// Chess piece types
export const CHESS_PIECES = {
  PAWN: 'pawn',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  ROOK: 'rook',
  QUEEN: 'queen',
  KING: 'king',
  NONE: 'none'
};
