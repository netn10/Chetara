import React, { useState, useEffect } from 'react';
import './DraftInterface.css';

function DraftInterface({ draftId, onExit }) {
  const [draft, setDraft] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [currentBooster, setCurrentBooster] = useState([]);
  const [pickedCards, setPickedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get player ID from localStorage or draft data
    const storedPlayerId = localStorage.getItem(`draft_${draftId}_playerId`);
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }

    fetchDraftStatus();
    const interval = setInterval(fetchDraftStatus, 1500);
    return () => clearInterval(interval);
  }, [draftId]);

  useEffect(() => {
    if (draft && playerId) {
      updatePlayerView();
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
      const currentPosition = (boosterOwner + direction * (booster.currentPlayerIndex || 0) + totalPlayers) % totalPlayers;

      if (currentPosition === playerIndex) {
        return booster;
      }
    }

    return null;
  };

  const handleCardPick = async (cardId) => {
    if (!playerId || !cardId) return;

    try {
      const response = await fetch(`http://localhost:5000/api/drafts/${draftId}/pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, cardId })
      });

      if (response.ok) {
        const data = await response.json();
        setDraft(data);
        setSelectedCard(null);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to pick card');
      }
    } catch (err) {
      setError('Connection error');
    }
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
          </div>
        </div>
        <button className="exit-btn-small" onClick={onExit}>Exit</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="draft-main">
        <div className="booster-section">
          <h3>Current Pack ({currentBooster.length} cards remaining)</h3>
          {currentBooster.length > 0 ? (
            <div className="booster-grid">
              {currentBooster.map((card) => (
                <div
                  key={card._id}
                  className={`draft-card ${selectedCard?._id === card._id ? 'selected' : ''}`}
                  onClick={() => setSelectedCard(card)}
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

        {selectedCard && (
          <div className="card-preview">
            <h3>Card Preview</h3>
            <div className="preview-content">
              {selectedCard.imageUrl ? (
                <img src={selectedCard.imageUrl} alt={selectedCard.name} className="preview-image" />
              ) : (
                <div className="preview-details">
                  <h4>{selectedCard.name}</h4>
                  {renderManaCost(selectedCard.manaCost)}
                  <p className="card-type">{selectedCard.type}</p>
                  <p className="card-text">{selectedCard.oracleText}</p>
                  {selectedCard.power && selectedCard.toughness && (
                    <p className="card-stats">{selectedCard.power}/{selectedCard.toughness}</p>
                  )}
                </div>
              )}
              <button
                className="pick-btn"
                onClick={() => handleCardPick(selectedCard._id)}
              >
                Pick This Card
              </button>
            </div>
          </div>
        )}
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
