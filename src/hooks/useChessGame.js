/**
 * Main chess game hook that manages all game state using a reducer
 * Consolidates complex state management for the chess game
 */

import { useReducer, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { chessGameReducer, initialChessState, CHESS_ACTIONS, MODAL_TYPES } from '../reducers/chessGameReducer';
import { canLinkCardToPiece } from '../utils/chessMagicUtils';
import logger from '../utils/logger';

/**
 * Main chess game hook with reducer-based state management
 * @returns {Object} Chess game state and actions
 */
export function useChessGame() {
  const [state, dispatch] = useReducer(chessGameReducer, initialChessState);

  /**
   * Load saved game state from localStorage
   */
  const loadGameState = useCallback(() => {
    try {
      const savedState = localStorage.getItem('chessMagicGameState');
      if (savedState) {
        const gameState = JSON.parse(savedState);
        dispatch({
          type: CHESS_ACTIONS.LOAD_GAME,
          payload: {
            fen: gameState.fen,
            moveHistory: gameState.moveHistory || [],
            capturedPieces: gameState.capturedPieces || { white: [], black: [] },
            gameTime: gameState.gameTime || { white: 600, black: 600 },
            linkedCards: gameState.linkedCards || {},
            linkedCardsHistory: gameState.linkedCardsHistory || [],
            fenHistory: gameState.fenHistory || [],
            capturedPiecesHistory: gameState.capturedPiecesHistory || [],
            isGameStarted: gameState.gameStarted || false,
            lastMove: gameState.lastMove || null
          }
        });
      }
    } catch (error) {
      logger.error('Error loading game state:', error);
    }
  }, []);

  /**
   * Save game state to localStorage
   */
  const saveGameState = useCallback(() => {
    if (!state.isGameStarted) return;

    try {
      const gameState = {
        fen: state.game.fen(),
        moveHistory: state.moveHistory,
        capturedPieces: state.capturedPieces,
        gameTime: state.gameTime,
        linkedCards: state.linkedCards,
        linkedCardsHistory: state.linkedCardsHistory,
        fenHistory: state.fenHistory,
        capturedPiecesHistory: state.capturedPiecesHistory,
        gameStarted: state.isGameStarted,
        lastMove: state.lastMove
      };
      localStorage.setItem('chessMagicGameState', JSON.stringify(gameState));
    } catch (error) {
      logger.error('Error saving game state:', error);
    }
  }, [state]);

  /**
   * Start a new game
   */
  const startNewGame = useCallback(() => {
    dispatch({ type: CHESS_ACTIONS.START_GAME });
  }, []);

  /**
   * Make a chess move
   */
  const makeMove = useCallback((from, to) => {
    const move = {
      from,
      to,
      promotion: 'q'
    };

    const previousFen = state.game.fen();
    const previousCaptured = { ...state.capturedPieces };
    const previousLinkedCards = { ...state.linkedCards };

    try {
      const result = state.game.move(move);
      if (result) {
        let newLinkedCards = { ...state.linkedCards };

        // Move linked card if piece has one
        if (newLinkedCards[result.from]) {
          newLinkedCards[result.to] = newLinkedCards[result.from];
          delete newLinkedCards[result.from];
        }

        // Update captured pieces
        let newCapturedPieces = { ...state.capturedPieces };
        if (result.captured) {
          const capturedColor = result.color === 'w' ? 'black' : 'white';
          newCapturedPieces = {
            ...newCapturedPieces,
            [capturedColor]: [...newCapturedPieces[capturedColor], result.captured]
          };

          // Remove linked card from captured square if any
          if (newLinkedCards[result.to]) {
            delete newLinkedCards[result.to];
          }
        }

        dispatch({
          type: CHESS_ACTIONS.MAKE_MOVE,
          payload: {
            result,
            newLinkedCards,
            capturedPieces: newCapturedPieces,
            previousFen,
            previousCaptured,
            previousLinkedCards
          }
        });

        return result;
      }
    } catch (error) {
      logger.debug('Invalid move:', error);
    }

    return null;
  }, [state.game, state.capturedPieces, state.linkedCards]);

  /**
   * Make a free move (can move any piece anywhere)
   */
  const makeFreeMove = useCallback((fromSquare, toSquare) => {
    const piece = state.game.get(fromSquare);
    const targetPiece = state.game.get(toSquare);

    if (!piece) return;

    const previousFen = state.game.fen();
    const previousCaptured = { ...state.capturedPieces };
    const previousLinkedCards = { ...state.linkedCards };

    const isKingCapture = targetPiece && targetPiece.type === 'k';
    const winningColor = isKingCapture ? (targetPiece.color === 'w' ? 'Black' : 'White') : null;

    let newLinkedCards = { ...state.linkedCards };

    // Move linked card if piece has one
    if (newLinkedCards[fromSquare]) {
      newLinkedCards[toSquare] = newLinkedCards[fromSquare];
      delete newLinkedCards[fromSquare];
    }

    // Remove linked card from captured square if any
    if (targetPiece && newLinkedCards[toSquare]) {
      delete newLinkedCards[toSquare];
    }

    // Manually update the board
    const newGame = new Chess(state.game.fen());
    newGame.remove(fromSquare);
    newGame.put(piece, toSquare);

    // Update captured pieces
    let newCapturedPieces = { ...state.capturedPieces };
    if (targetPiece) {
      const capturedColor = targetPiece.color === 'w' ? 'white' : 'black';
      newCapturedPieces = {
        ...newCapturedPieces,
        [capturedColor]: [...newCapturedPieces[capturedColor], targetPiece.type]
      };
    }

    dispatch({
      type: CHESS_ACTIONS.MAKE_FREE_MOVE,
      payload: {
        fromSquare,
        toSquare,
        newGame,
        newLinkedCards,
        capturedPieces: newCapturedPieces,
        isKingCapture,
        winningColor,
        previousFen,
        previousCaptured,
        previousLinkedCards
      }
    });
  }, [state.game, state.capturedPieces, state.linkedCards]);

  /**
   * Undo the last move
   */
  const undoMove = useCallback(() => {
    dispatch({ type: CHESS_ACTIONS.UNDO_MOVE });
  }, []);

  /**
   * Link a card to a chess piece
   */
  const linkCard = useCallback((square, card) => {
    const piece = state.game.get(square);
    if (!piece || !canLinkCardToPiece(card, piece)) {
      return false;
    }

    // Generate random color for the link
    const hue = Math.floor(Math.random() * 360);
    const saturation = 65 + Math.floor(Math.random() * 30);
    const lightness = 45 + Math.floor(Math.random() * 20);
    const linkColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    dispatch({
      type: CHESS_ACTIONS.LINK_CARD,
      payload: {
        square,
        card: { ...card, linkColor }
      }
    });

    return true;
  }, [state.game]);

  // Load game state on mount
  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  // Auto-save game state when it changes
  useEffect(() => {
    saveGameState();
  }, [saveGameState]);

  return {
    state,
    dispatch,
    actions: {
      startNewGame,
      makeMove,
      makeFreeMove,
      undoMove,
      linkCard
    }
  };
}
