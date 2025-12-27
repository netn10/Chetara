/**
 * Chess timer display component
 * Shows countdown timers for both players with active state
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Format seconds into MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Chess timer component displaying both player timers
 * @param {Object} props - Component props
 */
const ChessTimer = memo(({ gameTime, activeTimer }) => {
  const isWhiteActive = activeTimer === 'w';
  const isBlackActive = activeTimer === 'b';
  const isWhiteLowTime = gameTime.white < 60;
  const isBlackLowTime = gameTime.black < 60;

  return (
    <div className="timer-display">
      <div className={`player-timer ${isWhiteActive ? 'active' : ''}`}>
        <span className="timer-label">White</span>
        <span className={`timer-value ${isWhiteLowTime ? 'low-time' : ''}`}>
          {formatTime(gameTime.white)}
        </span>
      </div>

      <div className={`player-timer ${isBlackActive ? 'active' : ''}`}>
        <span className="timer-label">Black</span>
        <span className={`timer-value ${isBlackLowTime ? 'low-time' : ''}`}>
          {formatTime(gameTime.black)}
        </span>
      </div>
    </div>
  );
});

ChessTimer.displayName = 'ChessTimer';

ChessTimer.propTypes = {
  gameTime: PropTypes.shape({
    white: PropTypes.number.isRequired,
    black: PropTypes.number.isRequired
  }).isRequired,
  activeTimer: PropTypes.oneOf(['w', 'b', null])
};

ChessTimer.defaultProps = {
  activeTimer: null
};

export default ChessTimer;
