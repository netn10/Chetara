/**
 * Main Chess Board Component (Refactored)
 * Orchestrates the chess game using smaller components and hooks
 */

import React, { useEffect, useCallback } from 'react';
import './ChessBoard.css';
import CardSearch from './CardSearch';
import ChessBoardGrid from './chess/ChessBoardGrid';
import ChessTimer from './chess/ChessTimer';
import ChessMoveHistory from './chess/ChessMoveHistory';
import ChessControls from './chess/ChessControls';
import ChessCapturedPieces from './chess/ChessCapturedPieces';
import ChessLinkedCardSidebar from './chess/ChessLinkedCardSidebar';
import ChessModals from './chess/ChessModals';
import { useChessGame } from '../hooks/useChessGame';
import { useChessTimer } from '../hooks/useChessTimer';
import { useChessAudio } from '../hooks/useChessAudio';
import { CHESS_ACTIONS, MODAL_TYPES } from '../reducers/chessGameReducer';
import { canLinkCardToPiece } from '../utils/chessMagicUtils';
import logger from '../utils/logger';

/**
 * Calculate material balance for the current board position
 */
const calculateMaterialBalance = (game) => {
  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const board = game.board();
  let whiteValue = 0;
  let blackValue = 0;

  board.forEach(row => {
    row.forEach(square => {
      if (square) {
        const value = pieceValues[square.type];
        if (square.color === 'w') {
          whiteValue += value;
        } else {
          blackValue += value;
        }
      }
    });
  });

  return whiteValue - blackValue;
};

/**
 * Get list of movable pieces for current turn
 */
const getMovablePieces = (game) => {
  if (game.isGameOver()) return [];

  const currentTurn = game.turn();
  const board = game.board();
  const movable = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  board.forEach((row, rankIndex) => {
    row.forEach((piece, fileIndex) => {
      if (piece && piece.color === currentTurn) {
        const square = `${files[fileIndex]}${ranks[rankIndex]}`;
        const moves = game.moves({ square });
        if (moves.length > 0) {
          movable.push(square);
        }
      }
    });
  });

  return movable;
};

/**
 * Main Chess Board Component
 */
function ChessBoard() {
  const { state, dispatch, actions } = useChessGame();
  const { playMoveSound } = useChessAudio();

  useChessTimer({
    gameTime: state.gameTime,
    activeTimer: state.activeTimer,
    isGameOver: state.game.isGameOver(),
    isGameStarted: state.isGameStarted,
    dispatch
  });

  // Update game status, material balance, and movable pieces when game state changes
  useEffect(() => {
    if (!state.isGameStarted) return;

    // Update game status
    let newStatus = '';
    if (state.game.isCheckmate()) {
      const winningColor = state.game.turn() === 'w' ? 'Black' : 'White';
      newStatus = `Checkmate! ${winningColor} wins!`;

      if (!state.winner) {
        dispatch({
          type: CHESS_ACTIONS.SET_WINNER,
          payload: {
            winner: winningColor,
            method: 'checkmate',
            status: newStatus
          }
        });
      }
    } else if (state.game.isDraw()) {
      newStatus = 'Game is a draw!';
    } else if (state.game.isStalemate()) {
      newStatus = 'Stalemate!';
    } else if (state.game.isCheck()) {
      newStatus = `${state.game.turn() === 'w' ? 'White' : 'Black'} is in check!`;
    } else {
      newStatus = `${state.game.turn() === 'w' ? 'White' : 'Black'}'s turn`;
    }

    dispatch({ type: CHESS_ACTIONS.UPDATE_GAME_STATUS, payload: newStatus });

    // Update material balance
    const balance = calculateMaterialBalance(state.game);
    dispatch({ type: CHESS_ACTIONS.UPDATE_MATERIAL_BALANCE, payload: balance });

    // Update movable pieces
    const movable = getMovablePieces(state.game);
    dispatch({ type: CHESS_ACTIONS.UPDATE_MOVABLE_PIECES, payload: movable });

    // Set active timer
    if (!state.game.isGameOver() && !state.activeTimer) {
      dispatch({ type: CHESS_ACTIONS.SET_ACTIVE_TIMER, payload: state.game.turn() });
    }
  }, [state.game, state.isGameStarted, state.winner, state.activeTimer, dispatch]);

  /**
   * Handle square click (for both normal and free move modes)
   */
  const handleSquareClick = useCallback((square, e) => {
    if (!state.isGameStarted || state.game.isGameOver()) return;

    e?.stopPropagation();

    // Show linked card if present
    if (state.linkedCards[square]) {
      dispatch({
        type: CHESS_ACTIONS.VIEW_LINKED_CARD,
        payload: { card: state.linkedCards[square], square }
      });
    }

    // Try to link card if one is selected
    if (state.selectedCard) {
      const piece = state.game.get(square);
      if (piece && canLinkCardToPiece(state.selectedCard, piece)) {
        const pieceName = { n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king', p: 'pawn' }[piece.type];
        dispatch({
          type: CHESS_ACTIONS.SET_PENDING_LINK,
          payload: { square, card: state.selectedCard, piece, pieceName }
        });
        dispatch({ type: CHESS_ACTIONS.SHOW_MODAL, payload: MODAL_TYPES.LINK_CONFIRM });
      } else {
        dispatch({ type: CHESS_ACTIONS.SELECT_CARD, payload: null });
      }
      return;
    }

    // Free move mode logic
    if (state.freeMoveMode) {
      handleFreeMoveClick(square);
      return;
    }

    // Normal chess move logic
    if (state.selectedSquare) {
      const result = actions.makeMove(state.selectedSquare, square);
      if (result) {
        playMoveSound(result);
      }
      dispatch({ type: CHESS_ACTIONS.DESELECT_SQUARE, payload: {} });
    } else {
      const piece = state.game.get(square);
      if (piece && piece.color === state.game.turn()) {
        const moves = state.game.moves({ square, verbose: true });
        dispatch({
          type: CHESS_ACTIONS.SELECT_SQUARE,
          payload: { square, validMoves: moves.map(m => m.to) }
        });
      }
    }
  }, [state, actions, playMoveSound, dispatch]);

  /**
   * Handle free move click
   */
  const handleFreeMoveClick = useCallback((square) => {
    if (state.selectedSquare) {
      const piece = state.game.get(state.selectedSquare);
      const targetPiece = state.game.get(square);

      if (piece) {
        // Check if capturing a king - require confirmation
        if (targetPiece && targetPiece.type === 'k') {
          dispatch({
            type: CHESS_ACTIONS.SET_PENDING_FREE_MOVE,
            payload: { from: state.selectedSquare, to: square, piece, targetPiece }
          });
          dispatch({ type: CHESS_ACTIONS.SHOW_MODAL, payload: MODAL_TYPES.FREE_MOVE_KING_CONFIRM });
          return;
        }

        // Execute the free move
        actions.makeFreeMove(state.selectedSquare, square);
      }
      dispatch({ type: CHESS_ACTIONS.DESELECT_SQUARE, payload: {} });
    } else {
      // Select any piece (regardless of color)
      const piece = state.game.get(square);
      if (piece) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        const allSquares = files.flatMap(file => ranks.map(rank => `${file}${rank}`));
        dispatch({
          type: CHESS_ACTIONS.SELECT_SQUARE,
          payload: { square, validMoves: allSquares }
        });
      }
    }
  }, [state.selectedSquare, state.game, actions, dispatch]);

  /**
   * Handle square mouse enter (show linked card)
   */
  const handleSquareMouseEnter = useCallback((square) => {
    if (state.linkedCards[square]) {
      dispatch({
        type: CHESS_ACTIONS.VIEW_LINKED_CARD,
        payload: { card: state.linkedCards[square], square }
      });
    }
  }, [state.linkedCards, dispatch]);

  /**
   * Modal handlers
   */
  const handleResetGame = useCallback(() => {
    if (state.isGameStarted && state.moveHistory.length > 0) {
      dispatch({ type: CHESS_ACTIONS.SHOW_MODAL, payload: MODAL_TYPES.RESET_CONFIRM });
    } else {
      actions.startNewGame();
    }
  }, [state.isGameStarted, state.moveHistory.length, actions, dispatch]);

  const handleResetConfirm = useCallback(() => {
    dispatch({ type: CHESS_ACTIONS.HIDE_MODAL, payload: MODAL_TYPES.RESET_CONFIRM });
    actions.startNewGame();
  }, [actions, dispatch]);

  const handleLinkConfirm = useCallback(() => {
    if (state.pendingLink) {
      actions.linkCard(state.pendingLink.square, state.pendingLink.card);
    }
    dispatch({ type: CHESS_ACTIONS.HIDE_MODAL, payload: MODAL_TYPES.LINK_CONFIRM });
    dispatch({ type: CHESS_ACTIONS.SET_PENDING_LINK, payload: null });
  }, [state.pendingLink, actions, dispatch]);

  const handleFreeMoveKingConfirm = useCallback(() => {
    if (state.pendingFreeMove) {
      actions.makeFreeMove(state.pendingFreeMove.from, state.pendingFreeMove.to);
    }
    dispatch({ type: CHESS_ACTIONS.HIDE_MODAL, payload: MODAL_TYPES.FREE_MOVE_KING_CONFIRM });
    dispatch({ type: CHESS_ACTIONS.SET_PENDING_FREE_MOVE, payload: null });
  }, [state.pendingFreeMove, actions, dispatch]);

  const handleVictoryNewGame = useCallback(() => {
    dispatch({ type: CHESS_ACTIONS.HIDE_MODAL, payload: MODAL_TYPES.VICTORY });
    actions.startNewGame();
  }, [actions, dispatch]);

  // Render start screen if game not started
  if (!state.isGameStarted) {
    return (
      <div className="chess-magic-game white-turn">
        <div className="game-start-screen">
          <div className="start-screen-content">
            <h1>Chess Magic</h1>
            <p className="start-description">
              Combine the strategy of Chess with the power of Magic: The Gathering cards.
              Link cards to chess pieces and dominate the board!
            </p>
            <button onClick={actions.startNewGame} className="btn btn-primary start-game-btn">
              Start New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const gameClass = state.winner
    ? (state.winner === 'White' ? 'white-turn' : 'black-turn')
    : (state.game.turn() === 'w' ? 'white-turn' : 'black-turn');

  return (
    <div className={`chess-magic-game ${gameClass}`} onClick={() => dispatch({ type: CHESS_ACTIONS.SELECT_CARD, payload: null })}>
      <div className="game-layout">
        <ChessLinkedCardSidebar viewedCard={state.viewedLinkedCard} viewedSquare={state.viewedSquare} />

        <div className="main-game-area">
          <div className="game-info">
            <button onClick={handleResetGame} className="btn btn-primary new-game-btn">
              New Game
            </button>

            <ChessTimer gameTime={state.gameTime} activeTimer={state.activeTimer} />

            <div className={`status-display ${state.game.isCheck() ? 'check' : ''} ${state.game.isGameOver() ? 'game-over' : ''}`}>
              {state.gameStatus}
            </div>

            <div className="material-balance">
              <span className="balance-label">Material Balance:</span>
              <span className={`balance-value ${state.materialBalance > 0 ? 'white-advantage' : state.materialBalance < 0 ? 'black-advantage' : 'equal'}`}>
                {state.materialBalance > 0 ? `+${state.materialBalance}` : state.materialBalance === 0 ? '=' : state.materialBalance}
              </span>
            </div>

            <ChessControls
              onUndo={actions.undoMove}
              onToggleFreeMove={() => dispatch({ type: CHESS_ACTIONS.TOGGLE_FREE_MOVE_MODE })}
              onNewGame={handleResetGame}
              canUndo={state.moveHistory.length > 0}
              isFreeMoveActive={state.freeMoveMode}
            />
          </div>

          <ChessBoardGrid
            game={state.game}
            selectedSquare={state.selectedSquare}
            validMoves={state.validMoves}
            lastMove={state.lastMove}
            movablePieces={state.movablePieces}
            linkedCards={state.linkedCards}
            selectedCard={state.selectedCard}
            onSquareClick={handleSquareClick}
            onSquareMouseEnter={handleSquareMouseEnter}
          />

          <div className="game-sidebar">
            <ChessCapturedPieces capturedPieces={state.capturedPieces} />
            <ChessMoveHistory moveHistory={state.moveHistory} />
          </div>
        </div>

        <div className="cards-area">
          <CardSearch
            onCardSelect={(card) => card.chessPiece && card.chessPiece !== 'none' && dispatch({ type: CHESS_ACTIONS.SELECT_CARD, payload: card })}
            selectedCard={state.selectedCard}
          />
          {state.selectedCard && (
            <div className="selected-card-info">
              <h4>Selected Card:</h4>
              <div className="selected-card-display">
                <div className="card-name">{state.selectedCard.name}</div>
                <div className="card-type">{state.selectedCard.type} - {state.selectedCard.chessPiece}</div>
                <p className="card-instruction">
                  Click on a {state.selectedCard.chessPiece} piece on the board to link this card.
                </p>
                <button className="btn btn-secondary" onClick={() => dispatch({ type: CHESS_ACTIONS.SELECT_CARD, payload: null })}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ChessModals
        modals={state.modals}
        pendingLink={state.pendingLink}
        pendingFreeMove={state.pendingFreeMove}
        winner={state.winner}
        winMethod={state.winMethod}
        onResetConfirm={handleResetConfirm}
        onResetCancel={() => dispatch({ type: CHESS_ACTIONS.HIDE_MODAL, payload: MODAL_TYPES.RESET_CONFIRM })}
        onLinkConfirm={handleLinkConfirm}
        onLinkCancel={() => {
          dispatch({ type: CHESS_ACTIONS.HIDE_MODAL, payload: MODAL_TYPES.LINK_CONFIRM });
          dispatch({ type: CHESS_ACTIONS.SET_PENDING_LINK, payload: null });
        }}
        onFreeMoveKingConfirm={handleFreeMoveKingConfirm}
        onFreeMoveKingCancel={() => {
          dispatch({ type: CHESS_ACTIONS.HIDE_MODAL, payload: MODAL_TYPES.FREE_MOVE_KING_CONFIRM });
          dispatch({ type: CHESS_ACTIONS.SET_PENDING_FREE_MOVE, payload: null });
        }}
        onVictoryClose={() => dispatch({ type: CHESS_ACTIONS.HIDE_MODAL, payload: MODAL_TYPES.VICTORY })}
        onVictoryNewGame={handleVictoryNewGame}
      />
    </div>
  );
}

export default ChessBoard;
