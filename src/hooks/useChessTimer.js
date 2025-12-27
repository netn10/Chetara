/**
 * Chess timer hook with automatic countdown and timeout detection
 * Manages timer state and debouncing for both players
 */

import { useEffect, useRef } from 'react';
import { CHESS_ACTIONS } from '../reducers/chessGameReducer';
import logger from '../utils/logger';

/**
 * Hook for managing chess game timers
 * @param {Object} params - Hook parameters
 * @param {Object} params.gameTime - Current game time for both players
 * @param {string|null} params.activeTimer - Active timer ('w' or 'b' or null)
 * @param {boolean} params.isGameOver - Whether the game is over
 * @param {boolean} params.isGameStarted - Whether the game has started
 * @param {Function} params.dispatch - Reducer dispatch function
 */
export function useChessTimer({ gameTime, activeTimer, isGameOver, isGameStarted, dispatch }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    // Don't run timer if game not started, game is over, or no active timer
    if (!isGameStarted || !activeTimer || isGameOver) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start the timer interval
    intervalRef.current = setInterval(() => {
      const currentPlayer = activeTimer === 'w' ? 'white' : 'black';

      if (gameTime[currentPlayer] > 0) {
        const newTime = {
          ...gameTime,
          [currentPlayer]: gameTime[currentPlayer] - 1
        };

        // Check if time just ran out
        if (newTime[currentPlayer] === 0) {
          const winningColor = activeTimer === 'w' ? 'Black' : 'White';

          logger.debug(`Time's up! ${winningColor} wins by timeout!`);

          dispatch({
            type: CHESS_ACTIONS.UPDATE_TIMER,
            payload: {
              gameTime: newTime,
              timeout: true,
              winner: winningColor,
              gameStatus: `Time's up! ${winningColor} wins by timeout!`
            }
          });
        } else {
          // Normal timer update
          dispatch({
            type: CHESS_ACTIONS.UPDATE_TIMER,
            payload: {
              gameTime: newTime,
              timeout: false
            }
          });
        }
      }
    }, 1000);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeTimer, gameTime, isGameOver, isGameStarted, dispatch]);

  /**
   * Format time in MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    formatTime
  };
}
