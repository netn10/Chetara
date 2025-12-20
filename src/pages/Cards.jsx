import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cards.css';

function Cards() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    color: 'all',
    rarity: 'all',
    chessPiece: 'all',
    cardTypes: [], // Array for multiple type selections
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 24;

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, cards]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/cards');
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      const data = await response.json();
      setCards(data);
      setFilteredCards(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cards];

    if (filters.color !== 'all') {
      filtered = filtered.filter(card => card.colors && card.colors.includes(filters.color));
    }

    if (filters.rarity !== 'all') {
      filtered = filtered.filter(card => card.rarity && card.rarity.toLowerCase() === filters.rarity.toLowerCase());
    }

    if (filters.chessPiece !== 'all') {
      filtered = filtered.filter(card => card.chessPiece === filters.chessPiece);
    }

    // Filter by card types (multiple selection)
    if (filters.cardTypes.length > 0) {
      filtered = filtered.filter(card => {
        if (!card.type) return false;
        const cardTypeLower = card.type.toLowerCase();
        return filters.cardTypes.some(type => cardTypeLower.includes(type.toLowerCase()));
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(searchLower) ||
        (card.text && card.text.toLowerCase().includes(searchLower))
      );
    }

    setFilteredCards(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleCardTypeToggle = (type) => {
    setFilters(prev => ({
      ...prev,
      cardTypes: prev.cardTypes.includes(type)
        ? prev.cardTypes.filter(t => t !== type)
        : [...prev.cardTypes, type]
    }));
  };

  if (loading) {
    return (
      <div className="cards-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading cards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cards-page">
        <div className="container">
          <div className="error-message">
            <h2>⚠️ Error Loading Cards</h2>
            <p>{error}</p>
            <p className="error-help">Make sure the MongoDB server is running and the backend is started.</p>
            <button onClick={fetchCards} className="btn btn-primary">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cards-page">
      <section className="cards-hero">
        <div className="container">
          <h1 className="section-title">Card Gallery</h1>
          <p className="section-subtitle">
            Browse all 180 cards from the Chess Magic cube
          </p>
        </div>
      </section>

      <section className="cards-content">
        <div className="container">
          <div className="filters-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search cards..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-buttons">
              <div className="filter-group">
                <label>Color:</label>
                <button
                  className={`filter-btn ${filters.color === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('color', 'all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn color-white ${filters.color === 'W' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('color', 'W')}
                >
                  ☀ White
                </button>
                <button
                  className={`filter-btn color-blue ${filters.color === 'U' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('color', 'U')}
                >
                  💧 Blue
                </button>
                <button
                  className={`filter-btn color-black ${filters.color === 'B' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('color', 'B')}
                >
                  💀 Black
                </button>
                <button
                  className={`filter-btn color-red ${filters.color === 'R' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('color', 'R')}
                >
                  🔥 Red
                </button>
                <button
                  className={`filter-btn color-green ${filters.color === 'G' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('color', 'G')}
                >
                  🌲 Green
                </button>
              </div>

              <div className="filter-group">
                <label>Rarity:</label>
                <button
                  className={`filter-btn ${filters.rarity === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('rarity', 'all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${filters.rarity === 'common' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('rarity', 'common')}
                >
                  Common
                </button>
                <button
                  className={`filter-btn ${filters.rarity === 'uncommon' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('rarity', 'uncommon')}
                >
                  Uncommon
                </button>
                <button
                  className={`filter-btn ${filters.rarity === 'rare' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('rarity', 'rare')}
                >
                  Rare
                </button>
                <button
                  className={`filter-btn ${filters.rarity === 'mythic' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('rarity', 'mythic')}
                >
                  Mythic
                </button>
              </div>

              <div className="filter-group">
                <label>Card Type: {filters.cardTypes.length > 0 && <span className="filter-count">({filters.cardTypes.length} selected)</span>}</label>
                <button
                  className={`filter-btn ${filters.cardTypes.includes('Creature') ? 'active' : ''}`}
                  onClick={() => handleCardTypeToggle('Creature')}
                >
                  🧙 Creature
                </button>
                <button
                  className={`filter-btn ${filters.cardTypes.includes('Instant') ? 'active' : ''}`}
                  onClick={() => handleCardTypeToggle('Instant')}
                >
                  ⚡ Instant
                </button>
                <button
                  className={`filter-btn ${filters.cardTypes.includes('Sorcery') ? 'active' : ''}`}
                  onClick={() => handleCardTypeToggle('Sorcery')}
                >
                  📜 Sorcery
                </button>
                <button
                  className={`filter-btn ${filters.cardTypes.includes('Enchantment') ? 'active' : ''}`}
                  onClick={() => handleCardTypeToggle('Enchantment')}
                >
                  ✨ Enchantment
                </button>
                <button
                  className={`filter-btn ${filters.cardTypes.includes('Artifact') ? 'active' : ''}`}
                  onClick={() => handleCardTypeToggle('Artifact')}
                >
                  ⚙️ Artifact
                </button>
                <button
                  className={`filter-btn ${filters.cardTypes.includes('Land') ? 'active' : ''}`}
                  onClick={() => handleCardTypeToggle('Land')}
                >
                  🏔️ Land
                </button>
                <button
                  className={`filter-btn ${filters.cardTypes.includes('Planeswalker') ? 'active' : ''}`}
                  onClick={() => handleCardTypeToggle('Planeswalker')}
                >
                  👤 Planeswalker
                </button>
              </div>

              <div className="filter-group">
                <label>Chess Piece:</label>
                <button
                  className={`filter-btn ${filters.chessPiece === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('chessPiece', 'all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${filters.chessPiece === 'pawn' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('chessPiece', 'pawn')}
                >
                  ♟ Pawn
                </button>
                <button
                  className={`filter-btn ${filters.chessPiece === 'knight' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('chessPiece', 'knight')}
                >
                  ♞ Knight
                </button>
                <button
                  className={`filter-btn ${filters.chessPiece === 'bishop' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('chessPiece', 'bishop')}
                >
                  ♝ Bishop
                </button>
                <button
                  className={`filter-btn ${filters.chessPiece === 'rook' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('chessPiece', 'rook')}
                >
                  ♜ Rook
                </button>
                <button
                  className={`filter-btn ${filters.chessPiece === 'queen' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('chessPiece', 'queen')}
                >
                  ♛ Queen
                </button>
                <button
                  className={`filter-btn ${filters.chessPiece === 'king' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('chessPiece', 'king')}
                >
                  ♚ King
                </button>
              </div>
            </div>

            <div className="results-count">
              Showing {Math.min((currentPage - 1) * cardsPerPage + 1, filteredCards.length)}-{Math.min(currentPage * cardsPerPage, filteredCards.length)} of {filteredCards.length} cards
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <div className="no-results">
              <p>No cards found matching your filters.</p>
              <button onClick={() => setFilters({ color: 'all', rarity: 'all', chessPiece: 'all', cardTypes: [], search: '' })} className="btn btn-secondary">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {filteredCards.length > cardsPerPage && (
                <div className="pagination pagination-top">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {Math.ceil(filteredCards.length / cardsPerPage)}
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredCards.length / cardsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(filteredCards.length / cardsPerPage)}
                  >
                    Next
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(Math.ceil(filteredCards.length / cardsPerPage))}
                    disabled={currentPage === Math.ceil(filteredCards.length / cardsPerPage)}
                  >
                    Last
                  </button>
                </div>
              )}

              <div className="cards-grid">
                {filteredCards
                  .slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage)
                  .map((card) => (
                    <div
                      key={card._id}
                      className={`card-display-minimal rarity-${card.rarity}`}
                      onClick={() => navigate(`/cards/${card._id}`)}
                    >
                      {card.imageUrl ? (
                        <div className="card-image-only">
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="gallery-card-image"
                          />
                        </div>
                      ) : (
                        <div className="card-fallback">
                          <h3>{card.name}</h3>
                          <span className="card-type-badge">{card.type}</span>
                          <span className={`rarity-badge rarity-${card.rarity}`}>
                            {card.rarity}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {filteredCards.length > cardsPerPage && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {Math.ceil(filteredCards.length / cardsPerPage)}
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredCards.length / cardsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(filteredCards.length / cardsPerPage)}
                  >
                    Next
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(Math.ceil(filteredCards.length / cardsPerPage))}
                    disabled={currentPage === Math.ceil(filteredCards.length / cardsPerPage)}
                  >
                    Last
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Cards;
