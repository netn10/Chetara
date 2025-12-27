import React, { useState, useEffect } from 'react';
import './Cards.css';
import API_BASE_URL from '../config/api';
import logger from '../utils/logger';
import { useCardFilters } from '../hooks/useCardFilters';
import { useCardSorting } from '../hooks/useCardSorting';
import CardFilters from '../components/cards/CardFilters';
import CardSortControls from '../components/cards/CardSortControls';
import CardGrid from '../components/cards/CardGrid';
import Pagination from '../components/shared/Pagination';

/**
 * Cards page component - Main gallery page for browsing all cards
 * Features filtering, sorting, search, and pagination
 *
 * @component
 * @returns {JSX.Element} The Cards page
 */
function Cards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasScrolled, setHasScrolled] = useState(false);

  const CARDS_PER_PAGE = 24;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Custom hooks for filters and sorting
  const {
    filters,
    filteredCards: filterResults,
    hasActiveFilters,
    handleFilterChange,
    handleColorToggle,
    handleRarityToggle,
    handleChessPieceToggle,
    handleCardTypeToggle,
    handleCustomStatusToggle,
    clearAllFilters
  } = useCardFilters(cards);

  const {
    sortCriteria,
    sortedCards,
    hasMultipleSortCriteria,
    handleAddSortCriterion,
    handleUpdateSortCriterion,
    handleRemoveSortCriterion
  } = useCardSorting(filterResults);

  // Fetch cards on component mount
  useEffect(() => {
    fetchCards();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [sortedCards]);

  // Auto-scroll to pagination after first page loads (only once on initial load)
  useEffect(() => {
    if (!loading && cards.length > 0 && !hasScrolled) {
      performAutoScroll();
    }
  }, [loading, cards, hasScrolled]);

  /**
   * Fetches cards from the API with localStorage caching
   * Shows cached data immediately for better UX
   */
  const fetchCards = async () => {
    const cachedCards = localStorage.getItem('chessmagic_cards');
    const cacheTimestamp = localStorage.getItem('chessmagic_cards_timestamp');
    const cacheAge = cacheTimestamp ? Date.now() - parseInt(cacheTimestamp) : Infinity;

    // Load from cache if available
    if (cachedCards) {
      try {
        const parsedCache = JSON.parse(cachedCards);
        setCards(parsedCache);
        setLoading(false);

        if (cacheAge < CACHE_DURATION) {
          logger.debug('Using fresh cache');
          return; // Cache is fresh, no need to fetch
        }
        logger.debug('Cache stale, fetching fresh data');
      } catch (e) {
        logger.error('Error parsing cached cards:', e);
        setLoading(true);
      }
    } else {
      setLoading(true);
    }

    // Fetch fresh data
    try {
      const response = await fetch(`${API_BASE_URL}/cards`);
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      const data = await response.json();

      logger.debug('Cards fetched:', data.length);
      logCardDistribution(data);

      // Update cache
      localStorage.setItem('chessmagic_cards', JSON.stringify(data));
      localStorage.setItem('chessmagic_cards_timestamp', Date.now().toString());

      setCards(data);
      setLoading(false);
    } catch (err) {
      if (!cachedCards) {
        setError(err.message);
      }
      setLoading(false);
      logger.error('Error fetching cards:', err);
    }
  };

  /**
   * Logs card distribution for debugging
   * @param {Array} data - Card data
   */
  const logCardDistribution = (data) => {
    const customCount = data.filter(c => c.custom === true).length;
    const noncustomCount = data.filter(c => c.custom === false).length;
    const nullCount = data.filter(c => c.custom == null).length;

    logger.debug('=== CARD CUSTOM STATUS DISTRIBUTION ===');
    logger.debug(`Total cards: ${data.length}`);
    logger.debug(`Custom (true): ${customCount}`);
    logger.debug(`Official (false): ${noncustomCount}`);
    logger.debug(`Null/undefined: ${nullCount}`);
  };

  /**
   * Performs smooth auto-scroll to pagination section
   */
  const performAutoScroll = () => {
    setTimeout(() => {
      const pagination = document.querySelector('.pagination-top');
      if (!pagination) return;

      const cardImages = document.querySelectorAll('.cards-grid .gallery-card-image');
      const firstPageImages = Array.from(cardImages).slice(0, CARDS_PER_PAGE);

      if (firstPageImages.length === 0) {
        scrollToPagination(pagination);
      } else {
        // Wait for all first page images to load
        Promise.all(
          firstPageImages.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.addEventListener('load', resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
            });
          })
        ).then(() => {
          scrollToPagination(pagination);
        });
      }
    }, 50);
  };

  /**
   * Scrolls to pagination element
   * @param {HTMLElement} pagination - Pagination element
   */
  const scrollToPagination = (pagination) => {
    setHasScrolled(true);
    const targetPosition = pagination.getBoundingClientRect().top + window.pageYOffset - 100;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 1;
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      // Ease-in-out cubic
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  /**
   * Handles page change
   * @param {number} page - New page number
   */
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Calculate pagination
  const totalPages = Math.ceil(sortedCards.length / CARDS_PER_PAGE);
  const shouldShowPagination = sortedCards.length > CARDS_PER_PAGE;

  // Loading state
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

  // Error state
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
      {/* Hero Section */}
      <section className="cards-hero">
        <div className="container">
          <h1 className="section-title">Card Gallery</h1>
          <p className="section-subtitle">
            Browse all 180 cards from the Chess Magic cube
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="cards-content">
        <div className="container">
          {/* Sort Controls */}
          <CardSortControls
            sortCriteria={sortCriteria}
            onAddCriterion={handleAddSortCriterion}
            onUpdateCriterion={handleUpdateSortCriterion}
            onRemoveCriterion={handleRemoveSortCriterion}
            hasMultipleCriteria={hasMultipleSortCriteria}
          />

          {/* Filters */}
          <CardFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onColorToggle={handleColorToggle}
            onRarityToggle={handleRarityToggle}
            onChessPieceToggle={handleChessPieceToggle}
            onCardTypeToggle={handleCardTypeToggle}
            onCustomStatusToggle={handleCustomStatusToggle}
            onClearAll={clearAllFilters}
            filteredCount={sortedCards.length}
            currentPage={currentPage}
            cardsPerPage={CARDS_PER_PAGE}
          />

          {/* No Results */}
          {sortedCards.length === 0 ? (
            <div className="no-results">
              <p>No cards found matching your filters.</p>
              <button onClick={clearAllFilters} className="btn btn-secondary">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Top Pagination */}
              {shouldShowPagination && (
                <div className="pagination-top">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    showFirstLast={false}
                  />
                </div>
              )}

              {/* Card Grid */}
              <CardGrid
                cards={sortedCards}
                currentPage={currentPage}
                cardsPerPage={CARDS_PER_PAGE}
              />

              {/* Bottom Pagination */}
              {shouldShowPagination && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  showFirstLast={false}
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Cards;
