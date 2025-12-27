import React from 'react';

/**
 * DraftPlayerInfo Component
 * Displays draft header information including round, picks, and timer
 *
 * @param {Object} props - Component props
 * @param {Object} props.draft - Draft object containing status and configuration
 * @param {number} props.pickedCardsCount - Number of cards picked by the player
 * @param {number} props.currentBoosterLength - Number of cards in current booster
 * @param {number|null} props.timeRemaining - Seconds remaining for current pick
 * @param {boolean} props.isPicking - Whether the player is currently making a pick
 * @param {number} props.picksThisRound - Number of picks made in current round
 * @param {Function} props.getTimeLimit - Function to get time limit based on picks
 * @param {Function} props.onExit - Callback when exit button is clicked
 * @param {Function} props.onDebugPick45 - Callback for debug pick 45 function (dev only)
 * @param {Object} props.currentPlayer - Current player object
 * @returns {JSX.Element} Rendered player info header
 */
function DraftPlayerInfo({
  draft,
  pickedCardsCount,
  currentBoosterLength,
  timeRemaining,
  isPicking,
  picksThisRound,
  getTimeLimit,
  onExit,
  onDebugPick45,
  currentPlayer
}) {
  const hasTimer = timeRemaining !== null || isPicking;
  const isUrgent = timeRemaining <= 10;
  const isWarning = timeRemaining <= 30;
  const showDebugButton = process.env.NODE_ENV === 'development'
    && currentPlayer
    && currentPlayer.seatNumber === 0;

  return (
    <div className="draft-header">
      <div className="draft-info">
        <h2>{draft.draftType === 'set' ? 'Set' : 'Cube'} Draft</h2>
        <div className="draft-stats">
          <span>Round {draft.currentRound}/{draft.totalRounds}</span>
          <span>•</span>
          <span>Picked: {pickedCardsCount}</span>
          <span>•</span>
          <span className="direction-indicator">
            Passing {draft.direction === 'left' ? '←' : '→'}
          </span>
          <span>•</span>
          <span>Current Pack ({currentBoosterLength} cards)</span>
        </div>
      </div>

      {hasTimer && (
        <div className={`timer-display ${isUrgent ? 'timer-display-urgent' : isWarning ? 'timer-display-warning' : ''}`}>
          <div className="timer-circle">
            <svg className="timer-svg" viewBox="0 0 100 100">
              <circle
                className="timer-circle-bg"
                cx="50"
                cy="50"
                r="45"
              />
              {!isPicking && (
                <circle
                  className="timer-circle-progress"
                  cx="50"
                  cy="50"
                  r="45"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 45}`,
                    strokeDashoffset: `${2 * Math.PI * 45 * (1 - timeRemaining / getTimeLimit(picksThisRound))}`
                  }}
                />
              )}
            </svg>
            <div className="timer-text">
              {isPicking ? (
                <span className="timer-number">...</span>
              ) : (
                <>
                  <span className="timer-number">{timeRemaining}</span>
                  <span className="timer-label">sec</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showDebugButton && (
        <button
          className="exit-btn-small"
          onClick={onDebugPick45}
          disabled={isPicking}
          style={{
            marginRight: '10px',
            backgroundColor: '#ff6b35',
            opacity: isPicking ? 0.5 : 1
          }}
        >
          🔧 Pick 45
        </button>
      )}

      <button className="exit-btn-small" onClick={onExit}>Exit</button>
    </div>
  );
}

export default DraftPlayerInfo;
