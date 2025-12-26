import React, { useState, useEffect } from 'react';
import './CardSearch.css';

function CardSearch({ onCardSelect, selectedCard }) {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false to use cache first
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chessPieceFilter, setChessPieceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 3;

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, chessPieceFilter, cards]);

  const fetchCards = async () => {
    // Try to load from cache first for instant display (reuse the same cache as Cards page)
    const cachedCards = localStorage.getItem('chessmagic_cards');
    const cacheTimestamp = localStorage.getItem('chessmagic_cards_timestamp');
    const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // If cache exists and is fresh, use it immediately
    if (cachedCards && cacheAge < CACHE_DURATION) {
      try {
        const parsedCache = JSON.parse(cachedCards);
        setCards(parsedCache);
        setFilteredCards(parsedCache);
        setLoading(false);
        // Still fetch fresh data in background to keep cache updated
      } catch (e) {
        console.error('Error parsing cached cards:', e);
      }
    } else if (cachedCards) {
      // Cache exists but is stale, still show it while fetching fresh data
      try {
        const parsedCache = JSON.parse(cachedCards);
        setCards(parsedCache);
        setFilteredCards(parsedCache);
        setLoading(false);
      } catch (e) {
        console.error('Error parsing cached cards:', e);
        setLoading(true);
      }
    } else {
      // No cache at all, show loading
      setLoading(true);
    }

    // Fetch fresh data from server
    try {
      const response = await fetch('http://localhost:5000/api/cards');
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      const data = await response.json();

      // Update cache
      localStorage.setItem('chessmagic_cards', JSON.stringify(data));
      localStorage.setItem('chessmagic_cards_timestamp', Date.now().toString());

      setCards(data);
      setFilteredCards(data);
      setLoading(false);
    } catch (err) {
      // Only show error if we don't have cached data
      if (!cachedCards) {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cards];

    // Filter by search term (name only)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by chess piece
    if (chessPieceFilter !== 'all') {
      filtered = filtered.filter(card => card.chessPiece === chessPieceFilter);
    } else {
      // When showing all, exclude cards with chessPiece 'none' by default
      // to show only cards that can be linked to chess pieces
      filtered = filtered.filter(card => card.chessPiece && card.chessPiece !== 'none');
    }

    setFilteredCards(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleCardClick = (card, e) => {
    e.stopPropagation(); // Prevent page-wide click handler from deselecting
    onCardSelect(card);
  };

  if (loading) {
    return (
      <div className="card-search">
        <div className="card-search-loading">Loading cards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-search">
        <div className="card-search-error">
          <p>Error loading cards: {error}</p>
          <button onClick={fetchCards} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-search">
      <div className="card-search-header">
        <h3>Card Library</h3>
        <p className="card-search-help">Select a card to link to a chess piece</p>
      </div>

      <div className="card-search-filters">
        <input
          type="text"
          className="card-search-input"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="chess-piece-filters">
          <button
            className={`piece-filter-btn ${chessPieceFilter === 'all' ? 'active' : ''}`}
            onClick={() => setChessPieceFilter('all')}
          >
            All Pieces
          </button>
          <button
            className={`piece-filter-btn ${chessPieceFilter === 'pawn' ? 'active' : ''}`}
            onClick={() => setChessPieceFilter('pawn')}
          >
            Pawn
          </button>
          <button
            className={`piece-filter-btn ${chessPieceFilter === 'knight' ? 'active' : ''}`}
            onClick={() => setChessPieceFilter('knight')}
          >
            Knight
          </button>
          <button
            className={`piece-filter-btn ${chessPieceFilter === 'bishop' ? 'active' : ''}`}
            onClick={() => setChessPieceFilter('bishop')}
          >
            Bishop
          </button>
          <button
            className={`piece-filter-btn ${chessPieceFilter === 'rook' ? 'active' : ''}`}
            onClick={() => setChessPieceFilter('rook')}
          >
            Rook
          </button>
          <button
            className={`piece-filter-btn ${chessPieceFilter === 'queen' ? 'active' : ''}`}
            onClick={() => setChessPieceFilter('queen')}
          >
            Queen
          </button>
          <button
            className={`piece-filter-btn ${chessPieceFilter === 'king' ? 'active' : ''}`}
            onClick={() => setChessPieceFilter('king')}
          >
            King
          </button>
        </div>
      </div>

      <div className="card-search-results">
        <div className="results-header">
          <div className="results-count">
            {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''} found
          </div>

          {filteredCards.length > 3 && (
            <div className="pagination-info">
              Page {currentPage} of {Math.ceil(filteredCards.length / cardsPerPage)}
            </div>
          )}
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
              Prev
            </button>
            <span className="page-number">
              {currentPage}
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

        <div className="card-list">
          {filteredCards.length === 0 ? (
            <div className="no-results">No cards found matching your search.</div>
          ) : (
            filteredCards
              .slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage)
              .map((card) => (
              <div
                key={card._id}
                className={`card-item ${selectedCard?._id === card._id || selectedCard?.name === card.name ? 'selected' : ''}`}
                onClick={(e) => handleCardClick(card, e)}
              >
                {card.imageUrl ? (
                  <div className="card-image-container">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="card-image"
                      loading="eager"
                      decoding="async"
                    />
                    <div className="card-hover-details">
                      <div className="card-detail-header">
                        <span className="card-detail-name">{card.name}</span>
                        <span className="card-detail-cost">{card.manaCost}</span>
                      </div>
                      <div className="card-detail-type">
                        {card.type} - {card.chessPiece}
                      </div>
                      {card.power !== undefined && (
                        <div className="card-detail-stats">
                          {card.power}/{card.toughness}
                        </div>
                      )}
                      <div className="card-detail-text">{card.text}</div>
                    </div>
                  </div>
                ) : (
                  <div className="card-fallback">
                    <div className="card-fallback-name">{card.name}</div>
                    <div className="card-fallback-type">{card.type}</div>
                    <div className="card-fallback-piece">{card.chessPiece}</div>
                    <div className="card-hover-details">
                      <div className="card-detail-header">
                        <span className="card-detail-name">{card.name}</span>
                        <span className="card-detail-cost">{card.manaCost}</span>
                      </div>
                      <div className="card-detail-type">
                        {card.type} - {card.chessPiece}
                      </div>
                      {card.power !== undefined && (
                        <div className="card-detail-stats">
                          {card.power}/{card.toughness}
                        </div>
                      )}
                      <div className="card-detail-text">{card.text}</div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CardSearch;
