import React, { useState, useEffect } from 'react';
import './DraftLobby.css';

function DraftLobby({ draftType, onBack, onDraftStart }) {
  // Restore state from localStorage
  const [draftId, setDraftId] = useState(() => {
    return localStorage.getItem(`lobby_${draftType}_draftId`) || null;
  });
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem(`lobby_${draftType}_playerName`) || '';
  });
  const [joinCode, setJoinCode] = useState('');
  const [draft, setDraft] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [botCount, setBotCount] = useState(0);
  const [error, setError] = useState('');

  // Restore draft on mount if we have a draftId
  useEffect(() => {
    if (draftId && !draft) {
      fetchDraftStatus();
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (draftId) {
      localStorage.setItem(`lobby_${draftType}_draftId`, draftId);
    } else {
      localStorage.removeItem(`lobby_${draftType}_draftId`);
    }
  }, [draftId, draftType]);

  useEffect(() => {
    if (playerName) {
      localStorage.setItem(`lobby_${draftType}_playerName`, playerName);
    }
  }, [playerName, draftType]);

  // Poll for draft status updates
  useEffect(() => {
    if (draftId) {
      const interval = setInterval(() => {
        fetchDraftStatus();
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [draftId]);

  const fetchDraftStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/drafts/${draftId}`);
      if (response.ok) {
        const data = await response.json();
        setDraft(data);

        // If draft started, navigate to draft interface
        if (data.status === 'drafting') {
          onDraftStart(draftId);
        }
      }
    } catch (err) {
      console.error('Error fetching draft status:', err);
    }
  };

  const handleCreateDraft = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/drafts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftType,
          playerName: playerName.trim(),
          numBots: botCount
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDraftId(data._id);
        setDraft(data);
        // Store player info in localStorage
        localStorage.setItem(`draft_${data._id}_playerName`, playerName.trim());
        localStorage.setItem(`draft_${data._id}_playerId`, data.players[0].id);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create draft');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinDraft = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!joinCode.trim()) {
      setError('Please enter a draft code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/drafts/${joinCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setDraftId(data.draft._id);
        setDraft(data.draft);
        // Store player info in localStorage
        localStorage.setItem(`draft_${data.draft._id}_playerName`, playerName.trim());
        localStorage.setItem(`draft_${data.draft._id}_playerId`, data.playerId);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to join draft');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setIsJoining(false);
    }
  };

  const handleAddBots = async (count) => {
    try {
      const response = await fetch(`http://localhost:5000/api/drafts/${draftId}/add-bots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });

      if (response.ok) {
        const data = await response.json();
        setDraft(data);
        setError('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to add bots');
      }
    } catch (err) {
      console.error('Error adding bots:', err);
      setError('Connection error');
    }
  };

  const handleStartDraft = async () => {
    setIsStarting(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/drafts/${draftId}/start`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setDraft(data);
        onDraftStart(draftId);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to start draft');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setIsStarting(false);
    }
  };

  const renderSetupScreen = () => (
    <div className="lobby-setup">
      <div className="setup-header">
        <h2>Create or Join {draftType === 'set' ? 'Set' : 'Cube'} Draft</h2>
        <p>Draft from {draftType === 'set' ? 'Play Boosters with rarity distribution' : 'the complete 180-card Chess Magic Cube'}</p>
      </div>

      <div className="setup-options">
        <div className="setup-card">
          <h3>Create New Draft</h3>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>
          <div className="form-group">
            <label>Number of Bots</label>
            <div className="bot-selector">
              {[0, 1, 2, 3].map(count => (
                <button
                  key={count}
                  className={`bot-count-btn ${botCount === count ? 'active' : ''}`}
                  onClick={() => setBotCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          <button
            className="create-btn"
            onClick={handleCreateDraft}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Draft'}
          </button>
        </div>

        <div className="setup-divider">
          <span>OR</span>
        </div>

        <div className="setup-card">
          <h3>Join Existing Draft</h3>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>
          <div className="form-group">
            <label>Draft Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter draft code"
            />
          </div>
          <button
            className="join-btn"
            onClick={handleJoinDraft}
            disabled={isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Draft'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );

  const renderLobby = () => (
    <div className="draft-lobby">
      <div className="lobby-header">
        <h2>{draftType === 'set' ? 'Set' : 'Cube'} Draft Lobby</h2>
        <div className="draft-code">
          <span>Draft Code:</span>
          <code>{draftId}</code>
          <button
            className="copy-btn"
            onClick={() => {
              navigator.clipboard.writeText(draftId);
              alert('Draft code copied to clipboard!');
            }}
          >
            📋 Copy
          </button>
        </div>
      </div>

      <div className="lobby-content">
        <div className="players-section">
          <h3>Players ({draft?.players?.length || 0})</h3>
          <div className="players-list">
            {draft?.players?.map((player, index) => (
              <div key={player.id} className={`player-item ${player.isBot ? 'bot' : 'human'}`}>
                <span className="seat-number">#{player.seatNumber + 1}</span>
                <span className="player-name">
                  {player.name} {player.isBot && '🤖'}
                </span>
                <span className={`connection-status ${player.isConnected ? 'connected' : 'disconnected'}`}>
                  {player.isConnected ? '🟢' : '🔴'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lobby-controls">
          <div className="bot-controls">
            <h3>Add Bots</h3>
            {draft && draft.players.length < 4 ? (
              <>
                <p className="available-slots">
                  Available slots: {4 - draft.players.length}
                </p>
                <div className="bot-buttons">
                  <button
                    onClick={() => handleAddBots(1)}
                    disabled={draft.players.length >= 4}
                  >
                    Add 1 Bot
                  </button>
                  <button
                    onClick={() => handleAddBots(2)}
                    disabled={draft.players.length >= 3}
                  >
                    Add 2 Bots
                  </button>
                  <button
                    onClick={() => handleAddBots(3)}
                    disabled={draft.players.length >= 2}
                  >
                    Add 3 Bots
                  </button>
                </div>
              </>
            ) : (
              <p className="room-full">Room is full (4/4 players)</p>
            )}
          </div>

          <div className="start-controls">
            <button
              className="start-draft-btn"
              onClick={handleStartDraft}
              disabled={!draft || draft.players.length < 2 || isStarting}
            >
              {isStarting ? (
                <>
                  <span className="loading-spinner"></span>
                  Starting Draft...
                </>
              ) : (
                'Start Draft'
              )}
            </button>
            {draft && draft.players.length < 2 && (
              <p className="warning-text">Need at least 2 players to start</p>
            )}
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );

  const handleBack = () => {
    // Clear lobby state when going back
    localStorage.removeItem(`lobby_${draftType}_draftId`);
    localStorage.removeItem(`lobby_${draftType}_playerName`);

    // Also clear the showDraftLobby flag so we don't return to lobby
    localStorage.removeItem('play_showDraftLobby');

    onBack();
  };

  return (
    <div className="draft-lobby-container">
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>
      {!draft ? renderSetupScreen() : renderLobby()}
    </div>
  );
}

export default DraftLobby;
