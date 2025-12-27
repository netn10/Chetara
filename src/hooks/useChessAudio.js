/**
 * Audio management hook for chess moves
 * Generates different sounds for move types (normal, capture, check)
 */

import { useCallback } from 'react';
import logger from '../utils/logger';

/**
 * Hook for managing chess move audio
 * @returns {Object} Audio playback functions
 */
export function useChessAudio() {
  /**
   * Play sound for a chess move
   * @param {Object} move - Move object from chess.js
   */
  const playMoveSound = useCallback((move) => {
    if (!move) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different move types
      if (move.captured) {
        // Capture sound - lower pitch
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      } else if (move.san && move.san.includes('+')) {
        // Check sound - higher pitch
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      } else {
        // Regular move sound - medium pitch
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      }

      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      logger.debug('Audio not available:', error);
    }
  }, []);

  /**
   * Play victory sound
   */
  const playVictorySound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Victory fanfare - ascending notes
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.15); // E5
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.3); // G5

      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      logger.debug('Audio not available:', error);
    }
  }, []);

  return {
    playMoveSound,
    playVictorySound
  };
}
