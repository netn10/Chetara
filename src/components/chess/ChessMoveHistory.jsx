/**
 * Move history display component
 * Shows all moves made in the game with alternating colors
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Chess move history component
 * @param {Object} props - Component props
 */
const ChessMoveHistory = memo(({ moveHistory }) => {
  const hasMoves = moveHistory.length > 0;

  return (
    <div className="move-history">
      <h3>Move History</h3>
      <div className="moves-list">
        {!hasMoves ? (
          <p className="no-moves">No moves yet</p>
        ) : (
          moveHistory.map((move, idx) => (
            <div key={idx} className="move-item">
              <span className="move-number">{Math.floor(idx / 2) + 1}.</span>
              <span className={`move-notation ${idx % 2 === 0 ? 'white-move' : 'black-move'}`}>
                {move}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

ChessMoveHistory.displayName = 'ChessMoveHistory';

ChessMoveHistory.propTypes = {
  moveHistory: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default ChessMoveHistory;
