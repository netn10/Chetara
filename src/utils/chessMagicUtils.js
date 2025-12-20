// Chess Magic Integration Utilities

export const CHESS_PIECE_TYPES = {
    PAWN: 'pawn',
    KNIGHT: 'knight',
    BISHOP: 'bishop',
    ROOK: 'rook',
    QUEEN: 'queen',
    KING: 'king',
    NONE: 'none'
};

export const MTG_PHASES = [
    { id: 'untap', name: 'Untap', description: 'Untap all permanents' },
    { id: 'upkeep', name: 'Upkeep', description: 'Upkeep triggers resolve' },
    { id: 'draw', name: 'Draw', description: 'Draw a card' },
    { id: 'main1', name: 'Main Phase 1', description: 'Play spells and abilities' },
    { id: 'combat', name: 'Combat', description: 'Declare attackers and blockers' },
    { id: 'chess', name: 'Chess Phase', description: 'Make chess moves with linked pieces' },
    { id: 'main2', name: 'Main Phase 2', description: 'Play more spells' },
    { id: 'end', name: 'End Step', description: 'End of turn effects' }
];

export const PIECE_TYPE_MAP = {
    'p': CHESS_PIECE_TYPES.PAWN,
    'n': CHESS_PIECE_TYPES.KNIGHT,
    'b': CHESS_PIECE_TYPES.BISHOP,
    'r': CHESS_PIECE_TYPES.ROOK,
    'q': CHESS_PIECE_TYPES.QUEEN,
    'k': CHESS_PIECE_TYPES.KING
};

/**
 * Check if a card can be linked to a chess piece
 * @param {Object} card - MTG card object
 * @param {Object} piece - Chess piece object from chess.js
 * @returns {boolean} - Whether the card can be linked to the piece
 */
export const canLinkCardToPiece = (card, piece) => {
    if (!card || !piece || card.chessPiece === CHESS_PIECE_TYPES.NONE) {
        return false;
    }

    const pieceType = PIECE_TYPE_MAP[piece.type];
    return pieceType === card.chessPiece;
};

/**
 * Get sample MTG cards for testing
 * @returns {Array} - Array of sample card objects
 */
export const getSampleCards = () => [
    {
        id: 'sample1',
        name: "Chess Knight",
        manaCost: "2W",
        type: "Creature",
        subtype: "Knight",
        power: 2,
        toughness: 2,
        text: "When Chess Knight enters the battlefield, you may place it on an empty knight square on the chess board.",
        chessPiece: CHESS_PIECE_TYPES.KNIGHT,
        colors: ["white"],
        rarity: "uncommon"
    },
    {
        id: 'sample2',
        name: "Royal Guard",
        manaCost: "1B",
        type: "Creature",
        subtype: "Human Soldier",
        power: 1,
        toughness: 3,
        text: "Defender. Linked chess piece gains +0/+1 and cannot be captured by pieces of lesser value.",
        chessPiece: CHESS_PIECE_TYPES.PAWN,
        colors: ["black"],
        rarity: "common"
    },
    {
        id: 'sample3',
        name: "Lightning Bolt",
        manaCost: "R",
        type: "Instant",
        text: "Lightning Bolt deals 3 damage to any target. If target is a linked chess piece, also deal 1 damage to adjacent pieces.",
        chessPiece: CHESS_PIECE_TYPES.NONE,
        colors: ["red"],
        rarity: "common"
    },
    {
        id: 'sample4',
        name: "Castle Rook",
        manaCost: "3W",
        type: "Creature",
        subtype: "Construct",
        power: 4,
        toughness: 4,
        text: "Vigilance. When Castle Rook is linked to a rook, you may castle even if the king has moved.",
        chessPiece: CHESS_PIECE_TYPES.ROOK,
        colors: ["white"],
        rarity: "rare"
    },
    {
        id: 'sample5',
        name: "Bishop's Blessing",
        manaCost: "1W",
        type: "Enchantment - Aura",
        text: "Enchant chess piece. Enchanted piece can move diagonally through other pieces once per turn.",
        chessPiece: CHESS_PIECE_TYPES.BISHOP,
        colors: ["white"],
        rarity: "uncommon"
    },
    {
        id: 'sample6',
        name: "Queen's Gambit",
        manaCost: "2UB",
        type: "Sorcery",
        text: "If you control a linked queen, draw two cards and each opponent discards a card.",
        chessPiece: CHESS_PIECE_TYPES.QUEEN,
        colors: ["blue", "black"],
        rarity: "rare"
    }
];

/**
 * Calculate the material value bonus from linked cards
 * @param {Object} linkedCards - Object mapping squares to linked cards
 * @param {Object} game - Chess.js game instance
 * @returns {number} - Additional material value from card effects
 */
export const calculateCardBonus = (linkedCards, game) => {
    let bonus = 0;

    Object.entries(linkedCards).forEach(([square, card]) => {
        const piece = game.get(square);
        if (piece && card.power !== undefined) {
            // Add card power as bonus material value
            bonus += card.power * (piece.color === 'w' ? 1 : -1);
        }
    });

    return bonus;
};

/**
 * Get valid squares for linking a specific card type
 * @param {Object} game - Chess.js game instance
 * @param {string} chessPieceType - Type of chess piece the card can link to
 * @param {string} playerColor - 'w' or 'b' for white or black
 * @returns {Array} - Array of valid square names
 */
export const getValidLinkSquares = (game, chessPieceType, playerColor = null) => {
    const board = game.board();
    const validSquares = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    board.forEach((row, rankIndex) => {
        row.forEach((piece, fileIndex) => {
            if (piece && PIECE_TYPE_MAP[piece.type] === chessPieceType) {
                if (!playerColor || piece.color === playerColor) {
                    const square = `${files[fileIndex]}${ranks[rankIndex]}`;
                    validSquares.push(square);
                }
            }
        });
    });

    return validSquares;
};