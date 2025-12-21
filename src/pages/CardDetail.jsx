import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CardDetail.css';

function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReminderText, setShowReminderText] = useState(true);

  useEffect(() => {
    fetchCard();
  }, [id]);

  const fetchCard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/cards/${id}`);
      if (!response.ok) {
        throw new Error('Card not found');
      }
      const data = await response.json();
      setCard(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getPieceEmoji = (piece) => {
    const emojis = {
      pawn: '♟',
      knight: '♞',
      bishop: '♝',
      rook: '♜',
      queen: '♛',
      king: '♚',
      none: ''
    };
    return emojis[piece] || '';
  };

  const renderManaCost = (manaCost) => {
    if (!manaCost || manaCost === '{0}') return null;

    // Parse mana cost string like "{2}{W}{U}" into individual symbols
    const symbols = manaCost.match(/\{[^}]+\}/g) || [];

    return (
      <span className="mana-cost" style={{ userSelect: 'none' }}>
        {symbols.map((symbol, index) => {
          const cleanSymbol = symbol.replace(/[{}]/g, '');

          // Handle hybrid mana (e.g., "B/G", "W/U")
          if (cleanSymbol.includes('/')) {
            const parts = cleanSymbol.split('/');
            return (
              <span key={index} className={`mana-symbol mana-hybrid mana-${parts[0].toLowerCase()}-${parts[1].toLowerCase()}`}>
                <span className={`hybrid-half hybrid-left mana-${parts[0].toLowerCase()}`}></span>
                <span className={`hybrid-half hybrid-right mana-${parts[1].toLowerCase()}`}></span>
              </span>
            );
          }

          return (
            <span key={index} className={`mana-symbol mana-${cleanSymbol.toLowerCase()}`}>
              {cleanSymbol}
            </span>
          );
        })}
      </span>
    );
  };

  const processCardText = (text) => {
    if (!text) return '';
    if (showReminderText) return text;
    // Remove all text within parentheses (reminder text)
    return text.replace(/\s*\([^)]*\)/g, '').trim();
  };

  if (loading) {
    return (
      <div className="card-detail-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading card...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="card-detail-page">
        <div className="container">
          <div className="error-message">
            <h2>⚠️ Card Not Found</h2>
            <p>{error || 'This card does not exist.'}</p>
            <button onClick={() => navigate('/cards')} className="btn btn-primary">
              Back to Gallery
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-detail-page">
      <div className="container">
        <button onClick={() => navigate('/cards')} className="back-button">
          ← Back to Gallery
        </button>

        <div className="card-detail-content">
          {card.imageUrl ? (
            <div className="card-detail-image-section">
              <img
                src={card.imageUrl}
                alt={card.name}
                className="card-detail-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="image-fallback" style={{ display: 'none' }}>
                <p>Image failed to load</p>
              </div>
            </div>
          ) : null}

          <div className="card-detail-info">
            <div className="detail-header">
              <h1>{card.name}</h1>
              {card.manaCost && renderManaCost(card.manaCost)}
            </div>

            <div className="detail-type">
              {card.type} {card.subtype && `— ${card.subtype}`}
            </div>

            {card.chessPiece && card.chessPiece !== 'none' && (
              <div className="detail-chess-piece">
                <span
                  className="chess-piece-badge-large clickable"
                  onClick={() => navigate(`/cards?chessPiece=${card.chessPiece}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {getPieceEmoji(card.chessPiece)} {card.chessPiece.toUpperCase()}
                </span>
              </div>
            )}

            {card.text && (
              <div className="detail-text">
                <div className="text-header">
                  <h3>Card Text</h3>
                  <button
                    className="toggle-reminder-btn"
                    onClick={() => setShowReminderText(!showReminderText)}
                  >
                    {showReminderText ? 'Hide' : 'Show'} Reminder Text
                  </button>
                </div>
                <p>{processCardText(card.text)}</p>
              </div>
            )}

            {card.flavorText && (
              <div className="detail-flavor">
                <em>{card.flavorText}</em>
              </div>
            )}

            {(card.power !== undefined && card.power !== null && card.toughness !== undefined && card.toughness !== null) && (
              <div className="detail-stats">
                <h3>Power / Toughness</h3>
                <div className="stats-value">{card.power} / {card.toughness}</div>
              </div>
            )}

            {card.loyalty !== undefined && card.loyalty !== null && (
              <div className="detail-loyalty">
                <h3>Starting Loyalty</h3>
                <div className="loyalty-value">{card.loyalty}</div>
              </div>
            )}

            <div className="detail-meta">
              <div className="meta-row">
                <span className="meta-label">Rarity:</span>
                <span className="meta-value">{card.rarity || 'Unknown'}</span>
              </div>

              {card.artist && (
                <div className="meta-row">
                  <span className="meta-label">Artist:</span>
                  <span className="meta-value">{card.artist}</span>
                </div>
              )}

              {card.set && (
                <div className="meta-row">
                  <span className="meta-label">Set:</span>
                  <span className="meta-value">{card.set}</span>
                </div>
              )}

              {card.archetypes && card.archetypes.length > 0 && (
                <div className="meta-row">
                  <span className="meta-label">Archetypes:</span>
                  <span className="meta-value">{card.archetypes.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardDetail;
