/**
 * Chess board grid component
 * Renders the 8x8 chess board with all squares
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import ChessSquare from './ChessSquare';
import { canLinkCardToPiece } from '../../utils/chessMagicUtils';

/**
 * Chess board grid component
 * @param {Object} props - Component props
 */
const ChessBoardGrid = memo(({
  game,
  selectedSquare,
  validMoves,
  lastMove,
  movablePieces,
  linkedCards,
  selectedCard,
  onSquareClick,
  onSquareMouseEnter
}) => {
  const board = game.board();
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div className="game-board-container">
      {/* Rank labels (8-1) */}
      <div className="board-labels rank-labels">
        {ranks.map(rank => (
          <div key={rank} className="rank-label">{rank}</div>
        ))}
      </div>

      {/* Chess board grid */}
      <div className="chess-board">
        {ranks.map((rank, rankIndex) => (
          <div key={rank} className="board-row">
            {files.map((file, fileIndex) => {
              const square = `${file}${rank}`;
              const piece = board[rankIndex][fileIndex];
              const isLight = (rankIndex + fileIndex) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isValidMove = validMoves.includes(square);
              const isInCheck = game.isCheck() && piece && piece.type === 'k' && piece.color === game.turn();
              const isLastMoveSquare = lastMove && (lastMove.from === square || lastMove.to === square);
              const isMovablePiece = movablePieces.includes(square);
              const hasLinkedCard = !!linkedCards[square];
              const linkedColor = linkedCards[square]?.linkColor;
              const canLinkCard = selectedCard && piece && canLinkCardToPiece(selectedCard, piece);

              return (
                <ChessSquare
                  key={square}
                  square={square}
                  piece={piece}
                  isLight={isLight}
                  isSelected={isSelected}
                  isValidMove={isValidMove}
                  isInCheck={isInCheck}
                  isLastMoveSquare={isLastMoveSquare}
                  isMovablePiece={isMovablePiece}
                  hasLinkedCard={hasLinkedCard}
                  linkedColor={linkedColor}
                  canLinkCard={canLinkCard}
                  onClick={onSquareClick}
                  onMouseEnter={onSquareMouseEnter}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* File labels (a-h) */}
      <div className="board-labels file-labels">
        {files.map(file => (
          <div key={file} className="file-label">{file}</div>
        ))}
      </div>
    </div>
  );
});

ChessBoardGrid.displayName = 'ChessBoardGrid';

ChessBoardGrid.propTypes = {
  game: PropTypes.object.isRequired,
  selectedSquare: PropTypes.string,
  validMoves: PropTypes.arrayOf(PropTypes.string),
  lastMove: PropTypes.object,
  movablePieces: PropTypes.arrayOf(PropTypes.string),
  linkedCards: PropTypes.object,
  selectedCard: PropTypes.object,
  onSquareClick: PropTypes.func.isRequired,
  onSquareMouseEnter: PropTypes.func
};

ChessBoardGrid.defaultProps = {
  selectedSquare: null,
  validMoves: [],
  lastMove: null,
  movablePieces: [],
  linkedCards: {},
  selectedCard: null,
  onSquareMouseEnter: null
};

export default ChessBoardGrid;
