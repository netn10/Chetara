import React, { useState, useEffect, useRef } from 'react';
import './DraftInterface.css';

function DraftInterface({ draftId, onExit }) {
  const [draft, setDraft] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [currentBooster, setCurrentBooster] = useState([]);
  const [pickedCards, setPickedCards] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPicking, setIsPicking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [picksThisRound, setPicksThisRound] = useState(0);
  const [lastBoosterLength, setLastBoosterLength] = useState(0);
  const currentBoosterRef = useRef([]);

  useEffect(() => {
    // Get player ID from localStorage or draft data
    const storedPlayerId = localStorage.getItem(`draft_${draftId}_playerId`);
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }

    fetchDraftStatus();
    // Poll frequently to catch rapid bot picks (but pause during picks)
    const interval = setInterval(() => {
      if (!isPicking) {
        fetchDraftStatus();
      }
    }, 300);
    return () => clearInterval(interval);
  }, [draftId, isPicking]);

  useEffect(() => {
    if (draft && playerId) {
      updatePlayerView();
    }
  }, [draft, playerId]);

  // Keep ref in sync with current booster
  useEffect(() => {
    currentBoosterRef.current = currentBooster;
  }, [currentBooster]);

  // Calculate time limit based on picks made this round
  const getTimeLimit = (pickCount) => {
    if (pickCount < 5) return 60; // First 5 picks: 60 seconds
    if (pickCount < 10) return 30; // Next 5 picks: 30 seconds
    return 10; // Last 5 picks: 10 seconds
  };

  // Auto-pick when timer hits 0
  useEffect(() => {
    if (timeRemaining === 0 && currentBooster.length > 0 && !isPicking) {
      const randomCard = currentBooster[Math.floor(Math.random() * currentBooster.length)];
      handleCardPick(randomCard._id);
    }
  }, [timeRemaining]);

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isPicking) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          return prev;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isPicking]);

  // Start timer when new pack arrives (only when length actually changes)
  useEffect(() => {
    if (currentBooster.length > 0 && !isPicking && currentBooster.length !== lastBoosterLength) {
      const timeLimit = getTimeLimit(picksThisRound);
      setTimeRemaining(timeLimit);
      setLastBoosterLength(currentBooster.length);
    } else if (currentBooster.length === 0) {
      setLastBoosterLength(0);
      setTimeRemaining(null);
    }
  }, [currentBooster.length, isPicking, lastBoosterLength, picksThisRound]);

  // Track picks per round
  useEffect(() => {
    if (draft && playerId) {
      const player = draft.players.find(p => p.id === playerId);
      if (player) {
        // Calculate picks made this round (total picks % 15)
        const totalPicks = player.pickedCards?.length || 0;
        const picksInCurrentRound = totalPicks % 15;
        setPicksThisRound(picksInCurrentRound);
      }
    }
  }, [draft, playerId]);

  const fetchDraftStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/drafts/${draftId}`);
      if (response.ok) {
        const data = await response.json();
        setDraft(data);
        setLoading(false);

        // If draft is completed, could show final deck
        if (data.status === 'completed') {
          // Handle completion
        }
      }
    } catch (err) {
      console.error('Error fetching draft:', err);
      setError('Connection error');
    }
  };

  const updatePlayerView = () => {
    if (!draft || !playerId) return;

    // Find current player
    const player = draft.players.find(p => p.id === playerId);
    if (!player) {
      // Try to find by name in localStorage
      const playerName = localStorage.getItem(`draft_${draftId}_playerName`);
      const foundPlayer = draft.players.find(p => p.name === playerName);
      if (foundPlayer) {
        setPlayerId(foundPlayer.id);
        localStorage.setItem(`draft_${draftId}_playerId`, foundPlayer.id);
        setPickedCards(foundPlayer.pickedCards || []);
        return;
      }
      setError('Player not found in this draft');
      return;
    }

    setPickedCards(player.pickedCards || []);

    // Find player's current booster
    const playerIndex = draft.players.findIndex(p => p.id === playerId);
    const booster = findPlayerBooster(draft, playerIndex);

    if (booster) {
      setCurrentBooster(booster.cards || []);
    } else {
      setCurrentBooster([]);
    }
  };

  const findPlayerBooster = (draft, playerIndex) => {
    const totalPlayers = draft.players.length;
    const direction = draft.direction === 'left' ? 1 : -1;

    for (let i = 0; i < draft.boosters.length; i++) {
      const booster = draft.boosters[i];
      const boosterOwner = (i + draft.currentRound - 1) % totalPlayers;
      // Use proper modulo to handle negative numbers
      const currentPosition = ((boosterOwner + direction * (booster.currentPlayerIndex || 0)) % totalPlayers + totalPlayers) % totalPlayers;

      if (currentPosition === playerIndex) {
        return booster;
      }
    }

    return null;
  };

  const handleCardPick = async (cardId) => {
    if (!playerId || !cardId || isPicking) return;

    try {
      setIsPicking(true); // Pause polling while picking
      setError(''); // Clear any previous errors
      setTimeRemaining(null); // Stop timer

      const response = await fetch(`http://localhost:5000/api/drafts/${draftId}/pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, cardId })
      });

      if (response.ok) {
        const data = await response.json();
        setDraft(data);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to pick card');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsPicking(false); // Resume polling after pick completes
    }
  };

  const autoPickCard = () => {
    if (currentBooster.length === 0 || isPicking) return;

    // Pick a random card from the current booster
    const randomCard = currentBooster[Math.floor(Math.random() * currentBooster.length)];
    handleCardPick(randomCard._id);
  };

  const renderManaCost = (manaCost) => {
    if (!manaCost) return null;

    const symbols = manaCost.match(/\{[^}]+\}/g) || [];
    return (
      <div className="mana-cost">
        {symbols.map((symbol, index) => {
          const cleaned = symbol.replace(/[{}]/g, '');
          return (
            <span key={index} className={`mana-symbol mana-${cleaned.toLowerCase()}`}>
              {cleaned}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="draft-interface loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading draft...</p>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="draft-interface error-screen">
        <p>Draft not found</p>
        <button onClick={onExit}>Exit</button>
      </div>
    );
  }

  if (draft.status === 'completed') {
    return (
      <div className="draft-interface completed-screen">
        <div className="completion-message">
          <h2>Draft Completed!</h2>
          <p>You picked {pickedCards.length} cards</p>

          <div className="final-pool">
            <h3>Your Card Pool</h3>
            <div className="card-pool-grid">
              {pickedCards.map((card, index) => (
                <div key={index} className="pool-card">
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.name} />
                  ) : (
                    <div className="card-placeholder">
                      <p>{card.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button className="exit-btn" onClick={onExit}>
            Exit Draft
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="draft-interface">
      <div className="draft-header">
        <div className="draft-info">
          <h2>{draft.draftType === 'set' ? 'Set' : 'Cube'} Draft</h2>
          <div className="draft-stats">
            <span>Round {draft.currentRound}/{draft.totalRounds}</span>
            <span>•</span>
            <span>Picked: {pickedCards.length}</span>
            <span>•</span>
            <span className="direction-indicator">
              Passing {draft.direction === 'left' ? '←' : '→'}
            </span>
            <span>•</span>
            <span>Current Pack ({currentBooster.length} cards)</span>
          </div>
        </div>
        {(timeRemaining !== null || isPicking) && (
          <div className={`timer-display ${timeRemaining <= 10 ? 'timer-display-urgent' : timeRemaining <= 30 ? 'timer-display-warning' : ''}`}>
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
        <button className="exit-btn-small" onClick={onExit}>Exit</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="draft-main">
        <div className="booster-section">
          {currentBooster.length > 0 ? (
            <div className="booster-grid">
              {currentBooster.map((card) => (
                <div
                  key={card._id}
                  className="draft-card"
                  onClick={() => !isPicking && handleCardPick(card._id)}
                  style={{ cursor: isPicking ? 'not-allowed' : 'pointer' }}
                >
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.name} />
                  ) : (
                    <div className="card-placeholder">
                      <p>{card.name}</p>
                      {renderManaCost(card.manaCost)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="waiting-message">
              <p>⏳ Waiting for next pack...</p>
              <p className="waiting-subtext">Bots are making their picks</p>
            </div>
          )}
        </div>
      </div>

      <div className="picked-section">
        <h3>Your Picks ({pickedCards.length})</h3>
        <div className="picked-cards">
          {pickedCards.length > 0 ? (
            pickedCards.map((card, index) => (
              <div key={index} className="picked-card-mini">
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt={card.name} />
                ) : (
                  <div className="mini-placeholder">{card.name}</div>
                )}
              </div>
            ))
          ) : (
            <p className="no-picks">No cards picked yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DraftInterface;
