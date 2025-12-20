import React, { useState, useEffect } from 'react';
import './SealedInterface.css';

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
  const cardsPerPage = 20;

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
      const response = await fetch(`http://localhost:5000/api/sealed/${sealedId}`);
      if (response.ok) {
        const data = await response.json();
        setSealed(data);

        // Update deck and sideboard if needed
        const player = data.players.find(p => p.id === playerId);
        if (player && !deck.length && !sideboard.length) {
          console.log('Fetching - Player data:', player);
          setDeck(player.deck || []);
          setSideboard(player.sideboard || []);
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
      const response = await fetch('http://localhost:5000/api/sealed/create', {
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
      const response = await fetch(`http://localhost:5000/api/sealed/${joinCode}/join`, {
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
      const response = await fetch(`http://localhost:5000/api/sealed/${sealedId}/start`, {
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

  const moveToDeck = (cardId) => {
    const sideboardCard = sideboard.find(c => c._id === cardId);
    if (sideboardCard) {
      setDeck([...deck, sideboardCard]);
      setSideboard(sideboard.filter(c => c._id !== cardId));
      updateDeck([...deck, sideboardCard], sideboard.filter(c => c._id !== cardId));
    }
  };

  const moveToSideboard = (cardId) => {
    const deckCard = deck.find(c => c._id === cardId);
    if (deckCard) {
      setSideboard([...sideboard, deckCard]);
      setDeck(deck.filter(c => c._id !== cardId));
      updateDeck(deck.filter(c => c._id !== cardId), [...sideboard, deckCard]);
    }
  };

  const updateDeck = async (newDeck, newSideboard) => {
    try {
      await fetch(`http://localhost:5000/api/sealed/${sealedId}/update-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          deck: newDeck.map(c => c._id),
          sideboard: newSideboard.map(c => c._id)
        })
      });
    } catch (err) {
      console.error('Error updating deck:', err);
    }
  };

  const handleCompleteDeck = async () => {
    if (deck.length < 40) {
      setError('Deck must have at least 40 cards');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/sealed/${sealedId}/complete-deck`, {
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

  const renderDeckBuilder = () => {
    const player = sealed?.players?.find(p => p.id === playerId);

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
            {sideboard.length > cardsPerPage && (
              <div className="sealed-pagination sealed-pagination-top">
                <button
                  className="sealed-page-btn"
                  onClick={() => setSideboardPage(prev => Math.max(1, prev - 1))}
                  disabled={sideboardPage === 1}
                >
                  Previous
                </button>
                <span className="sealed-page-info">
                  Page {sideboardPage} of {Math.ceil(sideboard.length / cardsPerPage)}
                </span>
                <button
                  className="sealed-page-btn"
                  onClick={() => setSideboardPage(prev => Math.min(Math.ceil(sideboard.length / cardsPerPage), prev + 1))}
                  disabled={sideboardPage === Math.ceil(sideboard.length / cardsPerPage)}
                >
                  Next
                </button>
              </div>
            )}
            <div className="sealed-cards-grid">
              {sideboard
                .slice((sideboardPage - 1) * cardsPerPage, sideboardPage * cardsPerPage)
                .map((card) => (
                  <div key={card._id} className="sealed-card" onClick={() => moveToDeck(card._id)}>
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.name} />
                    ) : (
                      <div className="sealed-card-placeholder">{card.name}</div>
                    )}
                  </div>
                ))}
            </div>
            {sideboard.length > cardsPerPage && (
              <div className="sealed-pagination">
                <button
                  className="sealed-page-btn"
                  onClick={() => setSideboardPage(prev => Math.max(1, prev - 1))}
                  disabled={sideboardPage === 1}
                >
                  Previous
                </button>
                <span className="sealed-page-info">
                  Page {sideboardPage} of {Math.ceil(sideboard.length / cardsPerPage)}
                </span>
                <button
                  className="sealed-page-btn"
                  onClick={() => setSideboardPage(prev => Math.min(Math.ceil(sideboard.length / cardsPerPage), prev + 1))}
                  disabled={sideboardPage === Math.ceil(sideboard.length / cardsPerPage)}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className="sealed-zone deck-zone">
            <h3>Deck ({deck.length})</h3>
            {deck.length > cardsPerPage && (
              <div className="sealed-pagination sealed-pagination-top">
                <button
                  className="sealed-page-btn"
                  onClick={() => setDeckPage(prev => Math.max(1, prev - 1))}
                  disabled={deckPage === 1}
                >
                  Previous
                </button>
                <span className="sealed-page-info">
                  Page {deckPage} of {Math.ceil(deck.length / cardsPerPage)}
                </span>
                <button
                  className="sealed-page-btn"
                  onClick={() => setDeckPage(prev => Math.min(Math.ceil(deck.length / cardsPerPage), prev + 1))}
                  disabled={deckPage === Math.ceil(deck.length / cardsPerPage)}
                >
                  Next
                </button>
              </div>
            )}
            <div className="sealed-cards-grid">
              {deck
                .slice((deckPage - 1) * cardsPerPage, deckPage * cardsPerPage)
                .map((card) => (
                  <div key={card._id} className="sealed-card" onClick={() => moveToSideboard(card._id)}>
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.name} />
                    ) : (
                      <div className="sealed-card-placeholder">{card.name}</div>
                    )}
                  </div>
                ))}
            </div>
            {deck.length > cardsPerPage && (
              <div className="sealed-pagination">
                <button
                  className="sealed-page-btn"
                  onClick={() => setDeckPage(prev => Math.max(1, prev - 1))}
                  disabled={deckPage === 1}
                >
                  Previous
                </button>
                <span className="sealed-page-info">
                  Page {deckPage} of {Math.ceil(deck.length / cardsPerPage)}
                </span>
                <button
                  className="sealed-page-btn"
                  onClick={() => setDeckPage(prev => Math.min(Math.ceil(deck.length / cardsPerPage), prev + 1))}
                  disabled={deckPage === Math.ceil(deck.length / cardsPerPage)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sealed-builder-controls">
          <button
            className="sealed-complete-btn"
            onClick={handleCompleteDeck}
            disabled={deck.length < 40 || player?.deckBuilt}
          >
            {player?.deckBuilt ? 'Deck Complete ✓' : 'Complete Deck (Min 40 cards)'}
          </button>
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
