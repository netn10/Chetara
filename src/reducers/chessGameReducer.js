/**
 * Chess game reducer for managing complex game state
 * Consolidates 36 useState calls into a single reducer
 */

import { Chess } from 'chess.js';

export const CHESS_ACTIONS = {
  START_GAME: 'START_GAME',
  LOAD_GAME: 'LOAD_GAME',
  SELECT_SQUARE: 'SELECT_SQUARE',
  DESELECT_SQUARE: 'DESELECT_SQUARE',
  MAKE_MOVE: 'MAKE_MOVE',
  MAKE_FREE_MOVE: 'MAKE_FREE_MOVE',
  UNDO_MOVE: 'UNDO_MOVE',
  UPDATE_TIMER: 'UPDATE_TIMER',
  SET_ACTIVE_TIMER: 'SET_ACTIVE_TIMER',
  LINK_CARD: 'LINK_CARD',
  SELECT_CARD: 'SELECT_CARD',
  VIEW_LINKED_CARD: 'VIEW_LINKED_CARD',
  SHOW_MODAL: 'SHOW_MODAL',
  HIDE_MODAL: 'HIDE_MODAL',
  SET_WINNER: 'SET_WINNER',
  TOGGLE_FREE_MOVE_MODE: 'TOGGLE_FREE_MOVE_MODE',
  SET_PENDING_LINK: 'SET_PENDING_LINK',
  SET_PENDING_FREE_MOVE: 'SET_PENDING_FREE_MOVE',
  UPDATE_GAME_STATUS: 'UPDATE_GAME_STATUS',
  UPDATE_MATERIAL_BALANCE: 'UPDATE_MATERIAL_BALANCE',
  UPDATE_MOVABLE_PIECES: 'UPDATE_MOVABLE_PIECES'
};

export const MODAL_TYPES = {
  RESET_CONFIRM: 'RESET_CONFIRM',
  LINK_CONFIRM: 'LINK_CONFIRM',
  FREE_MOVE_KING_CONFIRM: 'FREE_MOVE_KING_CONFIRM',
  VICTORY: 'VICTORY'
};

export const initialChessState = {
  // Game state
  isGameStarted: false,
  game: new Chess(),
  gameStatus: '',
  winner: null,
  winMethod: null,

  // Board interaction
  selectedSquare: null,
  validMoves: [],
  lastMove: null,
  movablePieces: [],
  freeMoveMode: false,

  // Move history
  moveHistory: [],
  fenHistory: [],
  capturedPieces: { white: [], black: [] },
  capturedPiecesHistory: [],

  // Timer
  gameTime: { white: 600, black: 600 },
  activeTimer: null,
  lastMoveTime: Date.now(),

  // Material
  materialBalance: 0,

  // MTG Integration
  linkedCards: {},
  linkedCardsHistory: [],
  selectedCard: null,
  viewedLinkedCard: null,
  viewedSquare: null,

  // Modals
  modals: {
    [MODAL_TYPES.RESET_CONFIRM]: false,
    [MODAL_TYPES.LINK_CONFIRM]: false,
    [MODAL_TYPES.FREE_MOVE_KING_CONFIRM]: false,
    [MODAL_TYPES.VICTORY]: false
  },
  pendingLink: null,
  pendingFreeMove: null
};

export function chessGameReducer(state, action) {
  switch (action.type) {
    case CHESS_ACTIONS.START_GAME:
      return {
        ...initialChessState,
        isGameStarted: true,
        activeTimer: 'w',
        gameStatus: "White's turn"
      };

    case CHESS_ACTIONS.LOAD_GAME:
      return {
        ...state,
        ...action.payload,
        game: new Chess(action.payload.fen)
      };

    case CHESS_ACTIONS.SELECT_SQUARE:
      return {
        ...state,
        selectedSquare: action.payload.square,
        validMoves: action.payload.validMoves
      };

    case CHESS_ACTIONS.DESELECT_SQUARE:
      return {
        ...state,
        selectedSquare: null,
        validMoves: [],
        selectedCard: action.payload?.keepCard ? state.selectedCard : null
      };

    case CHESS_ACTIONS.MAKE_MOVE: {
      const { result, newLinkedCards, capturedPieces } = action.payload;

      return {
        ...state,
        game: new Chess(state.game.fen()),
        moveHistory: [...state.moveHistory, result.san],
        fenHistory: [...state.fenHistory, action.payload.previousFen],
        capturedPiecesHistory: [...state.capturedPiecesHistory, action.payload.previousCaptured],
        linkedCardsHistory: [...state.linkedCardsHistory, action.payload.previousLinkedCards],
        linkedCards: newLinkedCards,
        capturedPieces,
        lastMove: { from: result.from, to: result.to },
        selectedSquare: null,
        validMoves: []
      };
    }

    case CHESS_ACTIONS.MAKE_FREE_MOVE: {
      const { fromSquare, toSquare, newLinkedCards, capturedPieces, isKingCapture, winningColor } = action.payload;

      const newState = {
        ...state,
        game: action.payload.newGame,
        moveHistory: [...state.moveHistory, `FREE: ${fromSquare}-${toSquare}`],
        fenHistory: [...state.fenHistory, action.payload.previousFen],
        capturedPiecesHistory: [...state.capturedPiecesHistory, action.payload.previousCaptured],
        linkedCardsHistory: [...state.linkedCardsHistory, action.payload.previousLinkedCards],
        linkedCards: newLinkedCards,
        capturedPieces,
        lastMove: { from: fromSquare, to: toSquare },
        freeMoveMode: false,
        selectedSquare: null,
        validMoves: []
      };

      if (isKingCapture) {
        newState.gameStatus = `Game Over! ${winningColor} wins by capturing the king!`;
        newState.activeTimer = null;
        newState.winner = winningColor;
        newState.winMethod = 'king_capture';
        newState.modals = { ...state.modals, [MODAL_TYPES.VICTORY]: true };
      }

      return newState;
    }

    case CHESS_ACTIONS.UNDO_MOVE:
      if (state.moveHistory.length === 0) return state;

      return {
        ...state,
        game: new Chess(state.fenHistory[state.fenHistory.length - 1] || new Chess().fen()),
        linkedCards: state.linkedCardsHistory[state.linkedCardsHistory.length - 1] || {},
        capturedPieces: state.capturedPiecesHistory[state.capturedPiecesHistory.length - 1] || { white: [], black: [] },
        fenHistory: state.fenHistory.slice(0, -1),
        linkedCardsHistory: state.linkedCardsHistory.slice(0, -1),
        capturedPiecesHistory: state.capturedPiecesHistory.slice(0, -1),
        moveHistory: state.moveHistory.slice(0, -1),
        lastMove: null,
        selectedSquare: null,
        validMoves: []
      };

    case CHESS_ACTIONS.UPDATE_TIMER:
      return {
        ...state,
        gameTime: action.payload.gameTime,
        ...(action.payload.timeout ? {
          gameStatus: action.payload.gameStatus,
          winner: action.payload.winner,
          winMethod: 'timeout',
          activeTimer: null,
          modals: { ...state.modals, [MODAL_TYPES.VICTORY]: true }
        } : {})
      };

    case CHESS_ACTIONS.SET_ACTIVE_TIMER:
      return {
        ...state,
        activeTimer: action.payload,
        lastMoveTime: Date.now()
      };

    case CHESS_ACTIONS.LINK_CARD:
      return {
        ...state,
        linkedCards: {
          ...state.linkedCards,
          [action.payload.square]: action.payload.card
        },
        selectedCard: null,
        viewedLinkedCard: action.payload.card,
        viewedSquare: action.payload.square
      };

    case CHESS_ACTIONS.SELECT_CARD:
      return {
        ...state,
        selectedCard: action.payload
      };

    case CHESS_ACTIONS.VIEW_LINKED_CARD:
      return {
        ...state,
        viewedLinkedCard: action.payload.card,
        viewedSquare: action.payload.square
      };

    case CHESS_ACTIONS.SHOW_MODAL:
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: true }
      };

    case CHESS_ACTIONS.HIDE_MODAL:
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: false }
      };

    case CHESS_ACTIONS.SET_WINNER:
      return {
        ...state,
        winner: action.payload.winner,
        winMethod: action.payload.method,
        gameStatus: action.payload.status,
        modals: { ...state.modals, [MODAL_TYPES.VICTORY]: true }
      };

    case CHESS_ACTIONS.TOGGLE_FREE_MOVE_MODE:
      return {
        ...state,
        freeMoveMode: !state.freeMoveMode,
        selectedSquare: null,
        validMoves: []
      };

    case CHESS_ACTIONS.SET_PENDING_LINK:
      return {
        ...state,
        pendingLink: action.payload
      };

    case CHESS_ACTIONS.SET_PENDING_FREE_MOVE:
      return {
        ...state,
        pendingFreeMove: action.payload
      };

    case CHESS_ACTIONS.UPDATE_GAME_STATUS:
      return {
        ...state,
        gameStatus: action.payload
      };

    case CHESS_ACTIONS.UPDATE_MATERIAL_BALANCE:
      return {
        ...state,
        materialBalance: action.payload
      };

    case CHESS_ACTIONS.UPDATE_MOVABLE_PIECES:
      return {
        ...state,
        movablePieces: action.payload
      };

    default:
      return state;
  }
}
