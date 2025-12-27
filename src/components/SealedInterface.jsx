import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SealedInterface.css';
import API_BASE_URL from '../config/api';

function SealedInterface({ onBack }) {
  const [sealedId, setSealedId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [sealed, setSealed] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  const [deck, setDeck] = useState([]);
  const [sideboard, setSideboard] = useState([]);
  const [sideboardPage, setSideboardPage] = useState(1);
  const [deckPage, setDeckPage] = useState(1);
  const [lastSaved, setLastSaved] = useState(null);
  const cardsPerPage = 20;
  const updateInProgressRef = useRef(false);
  const deckInitializedRef = useRef(false);

  useEffect(() => {
    if (sealedId) {
      const interval = setInterval(() => {
        fetchSealedStatus();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [sealedId]);

  const fetchSealedStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sealed/${sealedId}`);
      if (response.ok) {
        const data = await response.json();
        setSealed(data);

        // Only sync deck and sideboard on initial load, not during active deck building
        const player = data.players.find(p => p.id === playerId);
        if (player && !deckInitializedRef.current && player.sideboard && player.sideboard.length > 0) {
          console.log('Fetching - Player data:', player);
          setDeck(player.deck || []);
          setSideboard(player.sideboard || []);
          deckInitializedRef.current = true;
        }
      }
    } catch (err) {
      console.error('Error fetching sealed:', err);
    }
  };

  const handleCreateSealed = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/sealed/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim(), packsPerPlayer: 6 })
      });

      if (response.ok) {
        const data = await response.json();
        setSealedId(data._id);
        setSealed(data);
        setPlayerId(data.players[0].id);
        localStorage.setItem(`sealed_${data._id}_playerName`, playerName.trim());
        localStorage.setItem(`sealed_${data._id}_playerId`, data.players[0].id);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create sealed event');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSealed = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!joinCode.trim()) {
      setError('Please enter an event code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/sealed/${joinCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setSealedId(data.sealed._id);
        setSealed(data.sealed);
        setPlayerId(data.playerId);
        localStorage.setItem(`sealed_${data.sealed._id}_playerName`, playerName.trim());
        localStorage.setItem(`sealed_${data.sealed._id}_playerId`, data.playerId);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to join sealed event');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setIsJoining(false);
    }
  };

  const handleStartSealed = async () => {
    setIsStarting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/sealed/${sealedId}/start`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setSealed(data);
        const player = data.players.find(p => p.id === playerId);
        if (player) {
          console.log('Player data:', player);
          console.log('Sideboard:', player.sideboard);
          setDeck(player.deck || []);
          setSideboard(player.sideboard || []);
          deckInitializedRef.current = true;
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to start sealed event');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsStarting(false);
    }
  };

  const updateDeck = useCallback(async (newDeck, newSideboard) => {
    if (updateInProgressRef.current) {
      return;
    }

    try {
      updateInProgressRef.current = true;
      await fetch(`${API_BASE_URL}/sealed/${sealedId}/update-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          deck: newDeck.map(c => c._id),
          sideboard: newSideboard.map(c => c._id)
        })
      });
      setLastSaved(new Date());
      console.log('💾 Deck saved automatically');
    } catch (err) {
      console.error('Error updating deck:', err);
      setError('Failed to save deck');
    } finally {
      updateInProgressRef.current = false;
    }
  }, [sealedId, playerId]);

  const moveToDeck = useCallback((cardIndex) => {
    setSideboard(prevSideboard => {
      if (cardIndex < 0 || cardIndex >= prevSideboard.length) return prevSideboard;

      const sideboardCard = prevSideboard[cardIndex];
      // Remove only ONE instance of the card
      const newSideboard = [
        ...prevSideboard.slice(0, cardIndex),
        ...prevSideboard.slice(cardIndex + 1)
      ];

      setDeck(prevDeck => {
        const newDeck = [...prevDeck, sideboardCard];
        updateDeck(newDeck, newSideboard);
        return newDeck;
      });

      return newSideboard;
    });
  }, [updateDeck]);

  const moveToSideboard = useCallback((cardIndex) => {
    setDeck(prevDeck => {
      if (cardIndex < 0 || cardIndex >= prevDeck.length) return prevDeck;

      const deckCard = prevDeck[cardIndex];
      // Remove only ONE instance of the card
      const newDeck = [
        ...prevDeck.slice(0, cardIndex),
        ...prevDeck.slice(cardIndex + 1)
      ];

      setSideboard(prevSideboard => {
        const newSideboard = [...prevSideboard, deckCard];
        updateDeck(newDeck, newSideboard);
        return newSideboard;
      });

      return newDeck;
    });
  }, [updateDeck]);

  const handleCompleteDeck = async () => {
    if (deck.length < 40) {
      setError('Deck must have at least 40 cards');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/sealed/${sealedId}/complete-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });

      if (response.ok) {
        const data = await response.json();
        setSealed(data);
        setError('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to complete deck');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const exportDeckAsTxt = () => {
    // Count cards by name
    const countCards = (cards) => {
      const counts = {};
      cards.forEach(card => {
        const name = card.name || 'Unknown Card';
        counts[name] = (counts[name] || 0) + 1;
      });
      return counts;
    };

    const deckCounts = countCards(deck);
    const sideboardCounts = countCards(sideboard);

    // Format deck list
    let txtContent = '=== Chess Magic Sealed Deck ===\n\n';

    // Player info
    const player = sealed?.players?.find(p => p.id === playerId);
    if (player) {
      txtContent += `Player: ${player.name}\n`;
    }
    txtContent += `Date: ${new Date().toLocaleDateString()}\n`;
    txtContent += `Format: Sealed (${sealed?.packsPerPlayer || 6} packs)\n\n`;

    // Main deck
    txtContent += `DECK (${deck.length} cards):\n`;
    txtContent += '─'.repeat(40) + '\n';
    Object.entries(deckCounts).sort().forEach(([name, count]) => {
      txtContent += `${count}x ${name}\n`;
    });

    // Sideboard
    txtContent += `\n\nSIDEBOARD (${sideboard.length} cards):\n`;
    txtContent += '─'.repeat(40) + '\n';
    Object.entries(sideboardCounts).sort().forEach(([name, count]) => {
      txtContent += `${count}x ${name}\n`;
    });

    txtContent += `\n\nTotal Cards: ${deck.length + sideboard.length}\n`;

    // Create download
    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chess-magic-sealed-${player?.name || 'deck'}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderSetup = () => (
    <div className="sealed-setup">
      <div className="sealed-setup-header">
        <h2>Sealed - 6 Packs</h2>
        <p>Open 6 booster packs and build a 40-card deck!</p>
      </div>

      <div className="sealed-setup-options">
        <div className="sealed-setup-card">
          <h3>Create New Event</h3>
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
            className="sealed-create-btn"
            onClick={handleCreateSealed}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Sealed Event'}
          </button>
        </div>

        <div className="sealed-setup-divider">
          <span>OR</span>
        </div>

        <div className="sealed-setup-card">
          <h3>Join Existing Event</h3>
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
            <label>Event Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter event code"
            />
          </div>
          <button
            className="sealed-join-btn"
            onClick={handleJoinSealed}
            disabled={isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Event'}
          </button>
        </div>
      </div>

      {error && <div className="sealed-error-message">{error}</div>}
    </div>
  );

  const renderLobby = () => (
    <div className="sealed-lobby">
      <div className="sealed-lobby-header">
        <h2>Sealed Event Lobby</h2>
        <div className="sealed-event-code">
          <span>Event Code:</span>
          <code>{sealedId}</code>
          <button
            className="sealed-copy-btn"
            onClick={() => {
              navigator.clipboard.writeText(sealedId);
              alert('Event code copied!');
            }}
          >
            📋 Copy
          </button>
        </div>
      </div>

      <div className="sealed-players-list">
        <h3>Players ({sealed?.players?.length || 0})</h3>
        {sealed?.players?.map((player, index) => (
          <div key={player.id} className="sealed-player-item">
            <span className="sealed-player-number">#{index + 1}</span>
            <span className="sealed-player-name">{player.name}</span>
          </div>
        ))}
      </div>

      <button className="sealed-start-btn" onClick={handleStartSealed} disabled={isStarting}>
        {isStarting ? (
          <>
            <span className="sealed-loading-spinner"></span>
            Opening Packs...
          </>
        ) : (
          'Open Packs'
        )}
      </button>

      {error && <div className="sealed-error-message">{error}</div>}
    </div>
  );

  // Helper function to group cards by name
  const groupCardsByName = (cards) => {
    const groups = {};
    cards.forEach((card, index) => {
      const key = card.name || card._id;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push({ ...card, originalIndex: index });
    });
    return Object.values(groups);
  };

  const renderDeckBuilder = () => {
    const player = sealed?.players?.find(p => p.id === playerId);

    // Group cards for stacking display
    const sideboardGroups = groupCardsByName(sideboard);
    const deckGroups = groupCardsByName(deck);

    return (
      <div className="sealed-deck-builder">
        <div className="sealed-builder-header">
          <h2>Build Your Deck</h2>
          <div className="sealed-deck-stats">
            <span>Deck: {deck.length}/40</span>
            <span>•</span>
            <span>Sideboard: {sideboard.length}</span>
          </div>
        </div>

        <div className="sealed-zones">
          <div className="sealed-zone">
            <h3>Sideboard ({sideboard.length})</h3>
            {sideboardGroups.length > cardsPerPage && (
              <div className="sealed-pagination sealed-pagination-top">
                <button
                  className="sealed-page-btn"
                  onClick={() => setSideboardPage(prev => Math.max(1, prev - 1))}
                  disabled={sideboardPage === 1}
                >
                  Previous
                </button>
                <span className="sealed-page-info">
                  Page {sideboardPage} of {Math.ceil(sideboardGroups.length / cardsPerPage)}
                </span>
                <button
                  className="sealed-page-btn"
                  onClick={() => setSideboardPage(prev => Math.min(Math.ceil(sideboardGroups.length / cardsPerPage), prev + 1))}
                  disabled={sideboardPage === Math.ceil(sideboardGroups.length / cardsPerPage)}
                >
                  Next
                </button>
              </div>
            )}
            <div className="sealed-cards-grid">
              {sideboardGroups
                .slice((sideboardPage - 1) * cardsPerPage, sideboardPage * cardsPerPage)
                .map((cardGroup, groupIndex) => (
                  <div
                    key={`group-${groupIndex}-${cardGroup[0]._id}`}
                    className="sealed-card-stack"
                    onClick={() => moveToDeck(cardGroup[cardGroup.length - 1].originalIndex)}
                    style={{ cursor: 'pointer' }}
                  >
                    {cardGroup.map((card, index) => (
                      <div
                        key={card._id}
                        className="sealed-card"
                        style={{
                          position: index > 0 ? 'relative' : 'static',
                          top: index > 0 ? `${index * 4}px` : '0',
                          marginTop: index > 0 ? '-96%' : '0',
                          zIndex: index,
                          pointerEvents: 'none'
                        }}
                      >
                        {card.imageUrl ? (
                          <img src={card.imageUrl} alt={card.name} />
                        ) : (
                          <div className="sealed-card-placeholder">{card.name}</div>
                        )}
                      </div>
                    ))}
                    {cardGroup.length > 1 && (
                      <div className="sealed-card-count" style={{ pointerEvents: 'none' }}>{cardGroup.length}</div>
                    )}
                  </div>
                ))}
            </div>
            {sideboardGroups.length > cardsPerPage && (
              <div className="sealed-pagination">
                <button
                  className="sealed-page-btn"
                  onClick={() => setSideboardPage(prev => Math.max(1, prev - 1))}
                  disabled={sideboardPage === 1}
                >
                  Previous
                </button>
                <span className="sealed-page-info">
                  Page {sideboardPage} of {Math.ceil(sideboardGroups.length / cardsPerPage)}
                </span>
                <button
                  className="sealed-page-btn"
                  onClick={() => setSideboardPage(prev => Math.min(Math.ceil(sideboardGroups.length / cardsPerPage), prev + 1))}
                  disabled={sideboardPage === Math.ceil(sideboardGroups.length / cardsPerPage)}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className="sealed-zone deck-zone">
            <h3>Deck ({deck.length})</h3>
            {deckGroups.length > cardsPerPage && (
              <div className="sealed-pagination sealed-pagination-top">
                <button
                  className="sealed-page-btn"
                  onClick={() => setDeckPage(prev => Math.max(1, prev - 1))}
                  disabled={deckPage === 1}
                >
                  Previous
                </button>
                <span className="sealed-page-info">
                  Page {deckPage} of {Math.ceil(deckGroups.length / cardsPerPage)}
                </span>
                <button
                  className="sealed-page-btn"
                  onClick={() => setDeckPage(prev => Math.min(Math.ceil(deckGroups.length / cardsPerPage), prev + 1))}
                  disabled={deckPage === Math.ceil(deckGroups.length / cardsPerPage)}
                >
                  Next
                </button>
              </div>
            )}
            <div className="sealed-cards-grid">
              {deckGroups
                .slice((deckPage - 1) * cardsPerPage, deckPage * cardsPerPage)
                .map((cardGroup, groupIndex) => (
                  <div
                    key={`group-${groupIndex}-${cardGroup[0]._id}`}
                    className="sealed-card-stack"
                    onClick={() => moveToSideboard(cardGroup[cardGroup.length - 1].originalIndex)}
                    style={{ cursor: 'pointer' }}
                  >
                    {cardGroup.map((card, index) => (
                      <div
                        key={card._id}
                        className="sealed-card"
                        style={{
                          position: index > 0 ? 'relative' : 'static',
                          top: index > 0 ? `${index * 4}px` : '0',
                          marginTop: index > 0 ? '-96%' : '0',
                          zIndex: index,
                          pointerEvents: 'none'
                        }}
                      >
                        {card.imageUrl ? (
                          <img src={card.imageUrl} alt={card.name} />
                        ) : (
                          <div className="sealed-card-placeholder">{card.name}</div>
                        )}
                      </div>
                    ))}
                    {cardGroup.length > 1 && (
                      <div className="sealed-card-count" style={{ pointerEvents: 'none' }}>{cardGroup.length}</div>
                    )}
                  </div>
                ))}
            </div>
            {deckGroups.length > cardsPerPage && (
              <div className="sealed-pagination">
                <button
                  className="sealed-page-btn"
                  onClick={() => setDeckPage(prev => Math.max(1, prev - 1))}
                  disabled={deckPage === 1}
                >
                  Previous
                </button>
                <span className="sealed-page-info">
                  Page {deckPage} of {Math.ceil(deckGroups.length / cardsPerPage)}
                </span>
                <button
                  className="sealed-page-btn"
                  onClick={() => setDeckPage(prev => Math.min(Math.ceil(deckGroups.length / cardsPerPage), prev + 1))}
                  disabled={deckPage === Math.ceil(deckGroups.length / cardsPerPage)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sealed-builder-controls">
          <div className="sealed-deck-status-row">
            {lastSaved && (
              <div className="sealed-deck-saved-message">
                💾 Saved {new Date(lastSaved).toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="sealed-action-buttons">
            <button className="sealed-save-txt-btn" onClick={exportDeckAsTxt}>
              📄 Save as TXT
            </button>
            <button
              className="sealed-complete-btn"
              onClick={handleCompleteDeck}
              disabled={deck.length < 40 || player?.deckBuilt}
            >
              {player?.deckBuilt ? 'Deck Complete ✓' : 'Complete Deck (Min 40 cards)'}
            </button>
          </div>
          {sealed?.status === 'ready' && (
            <p className="sealed-ready-text">All players ready! Event complete.</p>
          )}
        </div>

        {error && <div className="sealed-error-message">{error}</div>}
      </div>
    );
  };

  return (
    <div className="sealed-interface">
      <button className="sealed-back-button" onClick={onBack}>
        ← Back
      </button>

      {!sealed && renderSetup()}
      {sealed && sealed.status === 'waiting' && renderLobby()}
      {sealed && (sealed.status === 'building' || sealed.status === 'ready') && renderDeckBuilder()}
    </div>
  );
}

export default SealedInterface;
