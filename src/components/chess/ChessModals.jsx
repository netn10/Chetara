/**
 * All chess game modals component
 * Includes reset confirm, link confirm, free move confirm, and victory modals
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Reset game confirmation modal
 */
const ResetConfirmModal = memo(({ onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="confirmation-modal">
      <h3>Start New Game?</h3>
      <p>Are you sure you want to start a new game? This will reset the current game and all progress will be lost.</p>
      <div className="modal-buttons">
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button onClick={onConfirm} className="btn btn-danger">
          Yes, Start New Game
        </button>
      </div>
    </div>
  </div>
));

ResetConfirmModal.displayName = 'ResetConfirmModal';

ResetConfirmModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

/**
 * Link card confirmation modal
 */
const LinkConfirmModal = memo(({ pendingLink, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="confirmation-modal">
      <h3>Link Card to Chess Piece?</h3>
      <p>
        Are you sure you want to link <strong>{pendingLink.card.name}</strong> to the{' '}
        <strong>{pendingLink.pieceName}</strong> at <strong>{pendingLink.square}</strong>?
      </p>
      <div className="modal-buttons">
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button onClick={onConfirm} className="btn btn-primary">
          Yes, Link Card
        </button>
      </div>
    </div>
  </div>
));

LinkConfirmModal.displayName = 'LinkConfirmModal';

LinkConfirmModal.propTypes = {
  pendingLink: PropTypes.shape({
    square: PropTypes.string.isRequired,
    card: PropTypes.object.isRequired,
    pieceName: PropTypes.string.isRequired
  }).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

/**
 * Free move king capture confirmation modal
 */
const FreeMoveKingConfirmModal = memo(({ pendingFreeMove, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="confirmation-modal">
      <h3>Capture King with Free Movement?</h3>
      <p>
        Are you sure you want to capture the <strong>{pendingFreeMove.targetPiece.color === 'w' ? 'White' : 'Black'} King</strong> at{' '}
        <strong>{pendingFreeMove.to}</strong>?
      </p>
      <p style={{ fontSize: '0.9em', marginTop: '10px', fontStyle: 'italic' }}>
        This will remove the king from the board (not a legal chess move).
      </p>
      <div className="modal-buttons">
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button onClick={onConfirm} className="btn btn-danger">
          Yes, Capture King
        </button>
      </div>
    </div>
  </div>
));

FreeMoveKingConfirmModal.displayName = 'FreeMoveKingConfirmModal';

FreeMoveKingConfirmModal.propTypes = {
  pendingFreeMove: PropTypes.shape({
    to: PropTypes.string.isRequired,
    targetPiece: PropTypes.object.isRequired
  }).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

/**
 * Victory modal
 */
const VictoryModal = memo(({ winner, winMethod, onClose, onNewGame }) => {
  const isDarkMode = winner === 'Black';
  const loser = winner === 'White' ? 'Black' : 'White';

  let victoryMessage = '';
  if (winMethod === 'checkmate') {
    victoryMessage = 'Checkmate!';
  } else if (winMethod === 'timeout') {
    victoryMessage = `${loser} ran out of time!`;
  } else {
    victoryMessage = `The ${loser} King has been captured!`;
  }

  return (
    <div className="modal-overlay">
      <div className={`confirmation-modal victory-modal ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
        <h2 className="victory-title">Victory!</h2>
        <h3 className="victory-winner">{winner} Wins!</h3>
        <p className="victory-message">{victoryMessage}</p>
        <div className="modal-buttons">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          <button onClick={onNewGame} className="btn btn-primary">
            New Game
          </button>
        </div>
      </div>
    </div>
  );
});

VictoryModal.displayName = 'VictoryModal';

VictoryModal.propTypes = {
  winner: PropTypes.string.isRequired,
  winMethod: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onNewGame: PropTypes.func.isRequired
};

/**
 * Chess modals container component
 * @param {Object} props - Component props
 */
const ChessModals = memo(({
  modals,
  pendingLink,
  pendingFreeMove,
  winner,
  winMethod,
  onResetConfirm,
  onResetCancel,
  onLinkConfirm,
  onLinkCancel,
  onFreeMoveKingConfirm,
  onFreeMoveKingCancel,
  onVictoryClose,
  onVictoryNewGame
}) => {
  return (
    <>
      {modals.RESET_CONFIRM && (
        <ResetConfirmModal
          onConfirm={onResetConfirm}
          onCancel={onResetCancel}
        />
      )}

      {modals.LINK_CONFIRM && pendingLink && (
        <LinkConfirmModal
          pendingLink={pendingLink}
          onConfirm={onLinkConfirm}
          onCancel={onLinkCancel}
        />
      )}

      {modals.FREE_MOVE_KING_CONFIRM && pendingFreeMove && (
        <FreeMoveKingConfirmModal
          pendingFreeMove={pendingFreeMove}
          onConfirm={onFreeMoveKingConfirm}
          onCancel={onFreeMoveKingCancel}
        />
      )}

      {modals.VICTORY && winner && (
        <VictoryModal
          winner={winner}
          winMethod={winMethod}
          onClose={onVictoryClose}
          onNewGame={onVictoryNewGame}
        />
      )}
    </>
  );
});

ChessModals.displayName = 'ChessModals';

ChessModals.propTypes = {
  modals: PropTypes.object.isRequired,
  pendingLink: PropTypes.object,
  pendingFreeMove: PropTypes.object,
  winner: PropTypes.string,
  winMethod: PropTypes.string,
  onResetConfirm: PropTypes.func.isRequired,
  onResetCancel: PropTypes.func.isRequired,
  onLinkConfirm: PropTypes.func.isRequired,
  onLinkCancel: PropTypes.func.isRequired,
  onFreeMoveKingConfirm: PropTypes.func.isRequired,
  onFreeMoveKingCancel: PropTypes.func.isRequired,
  onVictoryClose: PropTypes.func.isRequired,
  onVictoryNewGame: PropTypes.func.isRequired
};

ChessModals.defaultProps = {
  pendingLink: null,
  pendingFreeMove: null,
  winner: null,
  winMethod: null
};

export default ChessModals;
