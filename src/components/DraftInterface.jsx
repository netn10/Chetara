import React, { useState, useEffect, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
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
  const skipNextUpdateRef = useRef(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Get player ID from localStorage or draft data
    const storedPlayerId = localStorage.getItem(`draft_${draftId}_playerId`);
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }

    fetchDraftStatus();
    // Poll frequently to catch rapid bot picks (but pause during picks)
    const interval = setInterval(() => {
      // No cooldown - poll immediately after picks complete
      if (!isPicking) {
        fetchDraftStatus();
      }
    }, 300);
    return () => clearInterval(interval);
  }, [draftId, isPicking]);

  useEffect(() => {
    console.log('⚡ [useEffect] Triggered', {
      hasDraft: !!draft,
      hasPlayerId: !!playerId,
      isPicking,
      skipNext: skipNextUpdateRef.current,
      currentBoosterLength: currentBooster.length
    });

    // Skip if we just manually updated (prevents duplicate update from causing flicker)
    if (skipNextUpdateRef.current) {
      console.log('⏭️ [useEffect] SKIPPED - manual update flag set');
      skipNextUpdateRef.current = false;
      return;
    }
    // Skip auto-update during picks to prevent flicker (handleCardPick updates manually)
    if (draft && playerId && !isPicking) {
      console.log('✅ [useEffect] Calling updatePlayerView');
      updatePlayerView();
    } else {
      console.log('⏭️ [useEffect] SKIPPED - isPicking or missing data');
    }
  }, [draft, playerId, isPicking]);

  // Keep ref in sync with current booster
  useEffect(() => {
    console.log('🎴 [currentBooster CHANGED]', {
      length: currentBooster.length,
      cardNames: currentBooster.map(c => c.name).slice(0, 5).join(', ') || 'EMPTY',
      isPicking
    });
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
    console.log('🔄 [POLL] Fetching draft status');

    // Cancel previous fetch if still running (but not during initial load)
    if (abortControllerRef.current && !loading) {
      console.log('🚫 [POLL] Cancelling previous fetch');
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this fetch
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`http://localhost:5000/api/drafts/${draftId}`, {
        signal: controller.signal
      });

      console.log('📡 [POLL] Response received, status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📥 [POLL] Draft data received', {
          status: data.status,
          currentRound: data.currentRound,
          boostersCount: data.boosters?.length || 0
        });
        setDraft(data);
        setLoading(false);

        // If draft is completed, could show final deck
        if (data.status === 'completed') {
          console.log('🏁 [POLL] Draft completed');
          // Handle completion
        }
      } else {
        console.error('❌ [POLL] Bad response:', response.status);
        setLoading(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('🚫 [POLL] Fetch cancelled');
      } else {
        console.error('❌ [POLL] Error fetching draft:', err);
        setError('Connection error');
        setLoading(false);
      }
    }
  };

  const updatePlayerView = () => {
    console.log('🔄 [updatePlayerView] Called', {
      hasDraft: !!draft,
      hasPlayerId: !!playerId,
      isPicking,
      currentBoosterLength: currentBooster.length
    });

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

    console.log('📦 [updatePlayerView] Booster found:', {
      playerIndex,
      boosterCards: booster ? booster.cards.length : 0,
      cardNames: booster ? booster.cards.map(c => c.name).join(', ') : 'none',
      isPicking
    });

    if (booster) {
      console.log('✅ [updatePlayerView] Setting booster with', booster.cards.length, 'cards');
      setCurrentBooster(booster.cards || []);
    } else if (!isPicking) {
      console.log('⚠️ [updatePlayerView] No booster found, clearing');
      // Only clear booster if we're not currently picking (prevents flicker)
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
    const pickedCardName = currentBooster.find(c => c._id === cardId)?.name;
    console.log('👆 [PICK START]', pickedCardName, {
      cardId,
      currentBoosterLength: currentBooster.length,
      isPicking
    });

    if (!playerId || !cardId || isPicking) {
      console.log('❌ [PICK BLOCKED] Already picking or invalid');
      return;
    }

    // Cancel any in-flight polling to prevent stale data from overwriting
    if (abortControllerRef.current) {
      console.log('🚫 [PICK] Cancelling in-flight polls');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Immediately hide booster (via isPicking) to prevent clicks on old cards
    console.log('🚫 [PICK] Setting isPicking=true, hiding booster');
    flushSync(() => {
      setIsPicking(true);
      setError('');
      setTimeRemaining(null);
    });
    console.log('✅ [PICK] Booster hidden, sending request');

    try {
      const response = await fetch(`http://localhost:5000/api/drafts/${draftId}/pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, cardId })
      });

      console.log('📨 [PICK] Server response received');

      if (response.ok) {
        const data = await response.json();
        const player = data.players.find(p => p.id === playerId);

        if (player) {
          const playerIndex = data.players.findIndex(p => p.id === playerId);
          const booster = findPlayerBooster(data, playerIndex);

          console.log('📦 [PICK] New booster found:', {
            newBoosterCards: booster ? booster.cards.length : 0,
            newCardNames: booster ? booster.cards.map(c => c.name).slice(0, 5).join(', ') : 'none',
            totalPicked: player.pickedCards.length
          });

          // Skip the next useEffect update to prevent duplicate render
          skipNextUpdateRef.current = true;

          console.log('🔄 [PICK] Updating states with flushSync');
          // Force synchronous update to show new booster immediately
          flushSync(() => {
            setPickedCards(player.pickedCards || []);
            setCurrentBooster(booster ? booster.cards || [] : []);
            setDraft(data);
            setIsPicking(false);
          });
          console.log('✅ [PICK COMPLETE] New booster set, isPicking=false');
        }
      } else {
        const data = await response.json();
        console.error('❌ [PICK ERROR]', data.message);
        setError(data.message || 'Failed to pick card');
        setIsPicking(false);
      }
    } catch (err) {
      console.error('❌ [PICK EXCEPTION]', err);
      setError('Connection error');
      setIsPicking(false);
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

      {/* Debug: Show bot picks */}
      {draft && draft.players && (
        <div style={{ padding: '10px', background: '#1a1a1a', margin: '10px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
          <div style={{ marginBottom: '5px', fontWeight: 'bold', color: '#888' }}>Recent Picks (Debug):</div>
          {draft.players.map((player, idx) => {
            const lastPick = player.pickedCards && player.pickedCards.length > 0
              ? player.pickedCards[player.pickedCards.length - 1]
              : null;
            return (
              <div key={player.id} style={{ color: player.isBot ? '#4a9eff' : '#4eff4a', marginBottom: '2px' }}>
                {player.name}: {lastPick ? lastPick.name : 'No picks yet'} ({player.pickedCards?.length || 0} total)
              </div>
            );
          })}
        </div>
      )}

      <div className="draft-main">
        <div className="booster-section">
          {currentBooster.length > 0 && !isPicking ? (
            <div className="booster-grid">
              {currentBooster.map((card) => (
                <div
                  key={card._id}
                  className="draft-card"
                  onClick={() => handleCardPick(card._id)}
                  style={{ cursor: 'pointer' }}
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
