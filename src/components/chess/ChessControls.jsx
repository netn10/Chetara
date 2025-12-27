/**
 * Game controls component
 * Provides buttons for undo, free move mode, and new game
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Chess game controls component
 * @param {Object} props - Component props
 */
const ChessControls = memo(({
  onUndo,
  onToggleFreeMove,
  onNewGame,
  canUndo,
  isFreeMoveActive
}) => {
  return (
    <div className="game-controls">
      <button
        onClick={onUndo}
        className="btn btn-secondary"
        disabled={!canUndo}
      >
        ↶ Undo
      </button>

      <button
        onClick={onToggleFreeMove}
        className={`btn ${isFreeMoveActive ? 'btn-warning' : 'btn-info'}`}
      >
        {isFreeMoveActive ? '✓ Free Move Active' : '🎯 Free Movement'}
      </button>
    </div>
  );
});

ChessControls.displayName = 'ChessControls';

ChessControls.propTypes = {
  onUndo: PropTypes.func.isRequired,
  onToggleFreeMove: PropTypes.func.isRequired,
  onNewGame: PropTypes.func.isRequired,
  canUndo: PropTypes.bool,
  isFreeMoveActive: PropTypes.bool
};

ChessControls.defaultProps = {
  canUndo: false,
  isFreeMoveActive: false
};

export default ChessControls;
