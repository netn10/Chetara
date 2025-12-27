/**
 * Captured pieces display component
 * Shows all captured pieces for both colors
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Get piece symbols for captured pieces
 * @param {string} pieceType - Type of piece (p, n, b, r, q)
 * @param {string} color - Color of piece (white or black)
 * @returns {string} Unicode chess piece symbol
 */
const getPieceSymbol = (pieceType, color) => {
  const symbols = {
    p: color === 'white' ? '♙' : '♟',
    n: color === 'white' ? '♘' : '♞',
    b: color === 'white' ? '♗' : '♝',
    r: color === 'white' ? '♖' : '♜',
    q: color === 'white' ? '♕' : '♛'
  };

  return symbols[pieceType] || '';
};

/**
 * Renders captured pieces for a single color
 * @param {Object} props - Component props
 */
const CapturedPiecesList = memo(({ color, pieces }) => {
  const hasPieces = pieces.length > 0;

  return (
    <div className={`captured-pieces ${color}`}>
      <h4>Captured {color === 'white' ? 'White' : 'Black'} Pieces:</h4>
      <div className="captured-list">
        {!hasPieces ? (
          <span className="no-captures">None</span>
        ) : (
          pieces.map((piece, idx) => (
            <span key={idx} className="captured-piece">
              {getPieceSymbol(piece, color)}
            </span>
          ))
        )}
      </div>
    </div>
  );
});

CapturedPiecesList.displayName = 'CapturedPiecesList';

CapturedPiecesList.propTypes = {
  color: PropTypes.oneOf(['white', 'black']).isRequired,
  pieces: PropTypes.arrayOf(PropTypes.string).isRequired
};

/**
 * Chess captured pieces component (both colors)
 * @param {Object} props - Component props
 */
const ChessCapturedPieces = memo(({ capturedPieces }) => {
  return (
    <div className="captured-section">
      <CapturedPiecesList color="black" pieces={capturedPieces.black} />
      <CapturedPiecesList color="white" pieces={capturedPieces.white} />
    </div>
  );
});

ChessCapturedPieces.displayName = 'ChessCapturedPieces';

ChessCapturedPieces.propTypes = {
  capturedPieces: PropTypes.shape({
    white: PropTypes.arrayOf(PropTypes.string).isRequired,
    black: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired
};

export default ChessCapturedPieces;
