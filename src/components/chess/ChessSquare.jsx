/**
 * Individual chess square component (memoized for performance)
 * Displays piece, highlights, and linked card indicators
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import logger from '../../utils/logger';

/**
 * Get piece symbol for rendering
 * @param {Object} piece - Chess piece object
 * @returns {string|null} Unicode chess piece symbol
 */
const getPieceSymbol = (piece) => {
  if (!piece) return null;

  const symbols = {
    p: { w: '♙', b: '♟' },
    n: { w: '♘', b: '♞' },
    b: { w: '♗', b: '♝' },
    r: { w: '♖', b: '♜' },
    q: { w: '♕', b: '♛' },
    k: { w: '♔', b: '♚' }
  };

  return symbols[piece.type]?.[piece.color] || null;
};

/**
 * Individual chess square component
 * @param {Object} props - Component props
 */
const ChessSquare = memo(({
  square,
  piece,
  isLight,
  isSelected,
  isValidMove,
  isInCheck,
  isLastMoveSquare,
  isMovablePiece,
  hasLinkedCard,
  linkedColor,
  canLinkCard,
  onClick,
  onMouseEnter
}) => {
  const handleClick = (e) => {
    e.stopPropagation();
    onClick(square, e);
  };

  const handleMouseEnter = () => {
    if (onMouseEnter) {
      onMouseEnter(square);
    }
  };

  const squareClasses = [
    'chess-square',
    isLight ? 'light' : 'dark',
    isSelected && 'selected',
    isValidMove && 'valid-move',
    isInCheck && 'in-check',
    isLastMoveSquare && 'last-move',
    isMovablePiece && 'movable-piece',
    canLinkCard && 'can-link-card',
    hasLinkedCard && 'has-linked-card'
  ].filter(Boolean).join(' ');

  const squareStyle = linkedColor ? {
    boxShadow: `inset 0 0 0 3px ${linkedColor}`
  } : {};

  return (
    <div
      className={squareClasses}
      style={squareStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      <span className="square-label">{square}</span>

      {piece && (
        <span className={`piece ${piece.color === 'w' ? 'white' : 'black'}`}>
          {getPieceSymbol(piece)}
        </span>
      )}

      {hasLinkedCard && (
        <div
          className="linked-card-indicator"
          style={{
            background: linkedColor || 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
            borderColor: linkedColor || 'rgba(255, 215, 0, 0.5)',
            color: '#fff'
          }}
        >
          <span className="card-link-icon">⚡</span>
          <span className="card-link-badge">LINKED</span>
        </div>
      )}

      {isValidMove && !piece && <div className="move-indicator"></div>}
      {isValidMove && piece && <div className="capture-indicator"></div>}
    </div>
  );
});

ChessSquare.displayName = 'ChessSquare';

ChessSquare.propTypes = {
  square: PropTypes.string.isRequired,
  piece: PropTypes.object,
  isLight: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool,
  isValidMove: PropTypes.bool,
  isInCheck: PropTypes.bool,
  isLastMoveSquare: PropTypes.bool,
  isMovablePiece: PropTypes.bool,
  hasLinkedCard: PropTypes.bool,
  linkedColor: PropTypes.string,
  canLinkCard: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func
};

ChessSquare.defaultProps = {
  piece: null,
  isSelected: false,
  isValidMove: false,
  isInCheck: false,
  isLastMoveSquare: false,
  isMovablePiece: false,
  hasLinkedCard: false,
  linkedColor: null,
  canLinkCard: false,
  onMouseEnter: null
};

export default ChessSquare;
