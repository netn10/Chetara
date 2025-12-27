import React, { useState, useEffect } from 'react';
import './JudgeTowerInterface.css';
import API_BASE_URL from '../config/api';
import logger from '../utils/logger';

function JudgeTowerInterface({ gameId, onExit }) {
  const [game, setGame] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedPlayerId = localStorage.getItem(`judgeTower_${gameId}_playerId`);
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }

    fetchGameStatus();
    const interval = setInterval(fetchGameStatus, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  const fetchGameStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/judge-tower/${gameId}`);
      if (response.ok) {
        const data = await response.json();
        setGame(data);
        setLoading(false);
      }
    } catch (err) {
      logger.error('Error fetching game:', err);
      setError('Connection error');
    }
  };

  const handleDraw = async () => {
    if (!playerId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/judge-tower/${gameId}/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });

      if (response.ok) {
        const data = await response.json();
        setGame(data);
        setError('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to draw');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handlePlayCard = async (cardId) => {
    if (!playerId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/judge-tower/${gameId}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, cardId })
      });

      if (response.ok) {
        const data = await response.json();
        setGame(data);
        setSelectedCard(null);
        setError('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to play card');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleNextPhase = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/judge-tower/${gameId}/next-phase`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setGame(data);
        setError('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to advance phase');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleEndRound = async (winnerId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/judge-tower/${gameId}/end-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, reason })
      });

      if (response.ok) {
        const data = await response.json();
        setGame(data);
        setError('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to end round');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleNextRound = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/judge-tower/${gameId}/next-round`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setGame(data);
        setError('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to start next round');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const getCurrentPlayer = () => {
    if (!game || !game.players || game.currentPlayerIndex === undefined) return null;
    return game.players[game.currentPlayerIndex];
  };

  const getPlayer = () => {
    if (!game || !playerId) return null;
    return game.players.find(p => p.id === playerId);
  };

  if (loading) {
    return (
      <div className="jt-interface loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Judge Tower...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="jt-interface error-screen">
        <p>Game not found</p>
        <button onClick={onExit}>Exit</button>
      </div>
    );
  }

  if (game.status === 'completed') {
    const winner = game.players.reduce((max, p) => p.points > max.points ? p : max, game.players[0]);

    return (
      <div className="jt-interface completed-screen">
        <div className="completion-message">
          <h2>🏆 Judge Tower Complete!</h2>
          <h3>Winner: {winner.name}</h3>
          <p>Total Points: {winner.points}</p>

          <div className="final-scores">
            <h4>Final Scores</h4>
            {game.players
              .sort((a, b) => b.points - a.points)
              .map((player, index) => (
                <div key={player.id} className="score-item">
                  <span className="score-rank">#{index + 1}</span>
                  <span className="score-name">{player.name}</span>
                  <span className="score-points">{player.points} points</span>
                </div>
              ))}
          </div>

          <button className="jt-exit-btn" onClick={onExit}>
            Exit Game
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer();
  const player = getPlayer();

  return (
    <div className="jt-interface">
      <div className="jt-header">
        <div className="jt-game-info">
          <h2>Judge Tower</h2>
          <div className="jt-game-stats">
            <span>Round {game.currentRound}</span>
            <span>•</span>
            <span>Phase: {game.currentPhase}</span>
            <span>•</span>
            <span>Library: {game.library?.length || 0}</span>
          </div>
        </div>
        <button className="jt-exit-btn-small" onClick={onExit}>Exit</button>
      </div>

      {error && <div className="jt-error-banner">{error}</div>}

      <div className="jt-rules-reminder">
        <h3>⚠️ Remember</h3>
        <div className="jt-rules-grid">
          <span>✋ Play all cards ASAP</span>
          <span>⚡ Activate all abilities</span>
          <span>🎲 X = 3</span>
          <span>⚔️ Attack/Block all</span>
          <span>♾️ Infinite mana</span>
          <span>❤️ 20 life per turn</span>
        </div>
      </div>

      <div className="jt-main">
        <div className="jt-game-area">
          <div className="jt-current-player">
            <h3>Current Player: {currentPlayer?.name}</h3>
            <div className="jt-player-stats">
              <span>❤️ Life: {currentPlayer?.life || 20}</span>
              <span>✋ Hand: {currentPlayer?.hand?.length || 0}</span>
              <span>🏆 Points: {currentPlayer?.points || 0}</span>
            </div>
          </div>

          {player && (
            <div className="jt-your-hand">
              <h3>Your Hand ({player.hand?.length || 0})</h3>
              <div className="jt-hand-cards">
                {player.hand && player.hand.length > 0 ? (
                  player.hand.map((card) => (
                    <div
                      key={card._id}
                      className={`jt-card ${selectedCard?._id === card._id ? 'selected' : ''}`}
                      onClick={() => setSelectedCard(card)}
                    >
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.name} />
                      ) : (
                        <div className="jt-card-placeholder">
                          <p>{card.name}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="jt-empty-message">No cards in hand - Draw during draw phase</p>
                )}
              </div>
              {selectedCard && (
                <button
                  className="jt-play-btn"
                  onClick={() => handlePlayCard(selectedCard._id)}
                >
                  Play {selectedCard.name}
                </button>
              )}
            </div>
          )}

          <div className="jt-shared-zones">
            <div className="jt-zone">
              <h4>Graveyard ({game.graveyard?.length || 0})</h4>
              {game.graveyard && game.graveyard.length > 0 && game.graveyard[game.graveyard.length - 1] && (
                <div className="jt-top-card">
                  {game.graveyard[game.graveyard.length - 1].name || 'Card'}
                </div>
              )}
            </div>
            <div className="jt-zone">
              <h4>Exile ({game.exile?.length || 0})</h4>
            </div>
          </div>

          <div className="jt-game-log">
            <h3>Game Log</h3>
            <div className="jt-log-entries">
              {game.gameLog && game.gameLog.slice(-10).reverse().map((entry, index) => (
                <div key={index} className="jt-log-entry">{entry}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="jt-controls">
          <h3>Controls</h3>

          {game.currentPhase === 'draw' && player && player.id === currentPlayer?.id && (
            <button className="jt-control-btn" onClick={handleDraw}>
              Draw Card
            </button>
          )}

          <button className="jt-control-btn" onClick={handleNextPhase}>
            Next Phase
          </button>

          <h4 className="jt-controls-section">End Round</h4>
          {game.players.map(p => (
            <button
              key={p.id}
              className="jt-control-btn winner-btn"
              onClick={() => handleEndRound(p.id, `${p.name} won!`)}
            >
              {p.name} Won
            </button>
          ))}

          <button
            className="jt-control-btn violation-btn"
            onClick={() => handleEndRound(null, 'Rules violation')}
          >
            Rules Violation
          </button>

          {game.status === 'round_end' && (
            <button className="jt-control-btn next-round-btn" onClick={handleNextRound}>
              Start Next Round
            </button>
          )}

          <div className="jt-player-scores">
            <h4>Scores</h4>
            {game.players.map(p => (
              <div key={p.id} className="jt-score-line">
                {p.name}: {p.points}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JudgeTowerInterface;
