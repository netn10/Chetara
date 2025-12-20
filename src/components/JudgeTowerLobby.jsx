import React, { useState, useEffect } from 'react';
import './JudgeTowerLobby.css';

function JudgeTowerLobby({ onBack, onGameStart }) {
  const [gameId, setGameId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [game, setGame] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (gameId) {
      const interval = setInterval(() => {
        fetchGameStatus();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [gameId]);

  const fetchGameStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/judge-tower/${gameId}`);
      if (response.ok) {
        const data = await response.json();
        setGame(data);

        if (data.status === 'playing') {
          onGameStart(gameId);
        }
      }
    } catch (err) {
      console.error('Error fetching game status:', err);
    }
  };

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/judge-tower/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setGameId(data._id);
        setGame(data);
        localStorage.setItem(`judgeTower_${data._id}_playerName`, playerName.trim());
        localStorage.setItem(`judgeTower_${data._id}_playerId`, data.players[0].id);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create game');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!joinCode.trim()) {
      setError('Please enter a game code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/judge-tower/${joinCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setGameId(data.game._id);
        setGame(data.game);
        localStorage.setItem(`judgeTower_${data.game._id}_playerName`, playerName.trim());
        localStorage.setItem(`judgeTower_${data.game._id}_playerId`, data.playerId);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to join game');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setIsJoining(false);
    }
  };

  const handleStartGame = async () => {
    setIsStarting(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/judge-tower/${gameId}/start`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setGame(data);
        onGameStart(gameId);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to start game');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setIsStarting(false);
    }
  };

  const renderSetupScreen = () => (
    <div className="jt-lobby-setup">
      <div className="jt-setup-header">
        <h2>Judge Tower - Cooperative Challenge</h2>
        <p>Work together to play through the entire cube without committing rules violations!</p>
      </div>

      <div className="jt-rules-summary">
        <h3>Rules Summary</h3>
        <ul>
          <li>🎴 Shared deck (entire cube) and graveyard</li>
          <li>✋ Start with 0 cards in hand</li>
          <li>⚡ Must play cards and activate abilities as soon as legally possible</li>
          <li>🎲 X in costs is always 3</li>
          <li>⚔️ Must attack/block with all legal creatures</li>
          <li>❤️ 20 life that resets each turn</li>
          <li>♾️ Infinite mana</li>
          <li>❌ Rules violations lose the round</li>
        </ul>
      </div>

      <div className="jt-setup-options">
        <div className="jt-setup-card">
          <h3>Create New Game</h3>
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
          <button
            className="jt-create-btn"
            onClick={handleCreateGame}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Game'}
          </button>
        </div>

        <div className="jt-setup-divider">
          <span>OR</span>
        </div>

        <div className="jt-setup-card">
          <h3>Join Existing Game</h3>
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
            <label>Game Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter game code"
            />
          </div>
          <button
            className="jt-join-btn"
            onClick={handleJoinGame}
            disabled={isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      </div>

      {error && <div className="jt-error-message">{error}</div>}
    </div>
  );

  const renderLobby = () => (
    <div className="jt-lobby">
      <div className="jt-lobby-header">
        <h2>Judge Tower Lobby</h2>
        <div className="jt-game-code">
          <span>Game Code:</span>
          <code>{gameId}</code>
          <button
            className="jt-copy-btn"
            onClick={() => {
              navigator.clipboard.writeText(gameId);
              alert('Game code copied to clipboard!');
            }}
          >
            📋 Copy
          </button>
        </div>
      </div>

      <div className="jt-lobby-content">
        <div className="jt-players-section">
          <h3>Players ({game?.players?.length || 0})</h3>
          <div className="jt-players-list">
            {game?.players?.map((player, index) => (
              <div key={player.id} className="jt-player-item">
                <span className="jt-player-number">#{index + 1}</span>
                <span className="jt-player-name">{player.name}</span>
                <span className={`jt-connection-status ${player.isConnected ? 'connected' : 'disconnected'}`}>
                  {player.isConnected ? '🟢' : '🔴'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="jt-game-info">
          <h3>Game Information</h3>
          <div className="jt-info-grid">
            <div className="jt-info-item">
              <span className="jt-info-label">Total Cards:</span>
              <span className="jt-info-value">{game?.library?.length || 0}</span>
            </div>
            <div className="jt-info-item">
              <span className="jt-info-label">Players:</span>
              <span className="jt-info-value">{game?.players?.length || 0}</span>
            </div>
          </div>

          <button
            className="jt-start-game-btn"
            onClick={handleStartGame}
            disabled={!game || game.players.length < 1 || isStarting}
          >
            {isStarting ? (
              <>
                <span className="jt-loading-spinner"></span>
                Starting Game...
              </>
            ) : (
              'Start Judge Tower'
            )}
          </button>
        </div>
      </div>

      {error && <div className="jt-error-message">{error}</div>}
    </div>
  );

  return (
    <div className="jt-lobby-container">
      <button className="jt-back-button" onClick={onBack}>
        ← Back
      </button>
      {!game ? renderSetupScreen() : renderLobby()}
    </div>
  );
}

export default JudgeTowerLobby;
