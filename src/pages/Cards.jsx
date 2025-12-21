import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Cards.css';

function Cards() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize filters from URL params
  const getInitialFilters = () => {
    const chessPieceParam = searchParams.get('chessPiece');
    return {
      colors: [], // Array for multiple color selections
      colorMode: 'exactly', // 'including', 'exactly', 'atMost'
      rarities: [], // Array for multiple rarity selections
      rarityMode: 'including', // 'including', 'exactly', 'atMost'
      chessPieces: chessPieceParam ? [chessPieceParam] : [], // Array for multiple chess piece selections
      chessPieceMode: 'including', // 'including', 'exactly', 'atMost'
      cardTypes: [], // Array for multiple type selections
      cardTypeMode: 'including', // 'including', 'exactly', 'atMost'
      customStatus: [], // 'custom', 'noncustom'
      search: '',
      searchMode: 'nameAndText' // 'nameOnly', 'nameAndText'
    };
  };

  const [filters, setFilters] = useState(getInitialFilters());
  const [sortCriteria, setSortCriteria] = useState([
    { field: 'name', order: 'asc' }
  ]); // Array of sort criteria with field and order
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 24;
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  // Update filters when URL params change
  useEffect(() => {
    const chessPieceParam = searchParams.get('chessPiece');
    if (chessPieceParam) {
      setFilters(prev => ({
        ...prev,
        chessPieces: [chessPieceParam]
      }));
      setHasScrolled(false); // Reset scroll flag to trigger scroll animation
    }
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [filters, cards, sortCriteria]);

  // Smooth scroll to pagination section after all first page cards load
  useEffect(() => {
    if (!loading && filteredCards.length > 0 && !hasScrolled) {
      // Small delay to ensure DOM has updated with filtered cards
      setTimeout(() => {
        const pagination = document.querySelector('.pagination-top');
        if (pagination) {
          // Wait for all images on the first page to load
          const cardImages = document.querySelectorAll('.cards-grid .gallery-card-image');
          const firstPageImages = Array.from(cardImages).slice(0, cardsPerPage);

          if (firstPageImages.length === 0) {
            // No images to wait for, scroll immediately
            performScroll(pagination);
          } else {
            // Wait for all first page images to load
            Promise.all(
              firstPageImages.map(img => {
                if (img.complete) {
                  return Promise.resolve();
                }
                return new Promise((resolve) => {
                  img.addEventListener('load', resolve, { once: true });
                  img.addEventListener('error', resolve, { once: true }); // Also resolve on error
                });
              })
            ).then(() => {
              performScroll(pagination);
            });
          }
        }
      }, 50); // 50ms delay to ensure DOM update
    }
  }, [loading, filteredCards, hasScrolled]);

  const performScroll = (pagination) => {
    // Mark that we've scrolled to prevent multiple triggers
    setHasScrolled(true);

    const targetPosition = pagination.getBoundingClientRect().top + window.pageYOffset - 100;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 1; // Almost instant scroll (1 millisecond)
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      // Ease-in-out cubic function for smoother animation
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

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/cards');
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      const data = await response.json();

      // Debug: Check custom status distribution
      const customCount = data.filter(c => c.custom === true).length;
      const noncustomCount = data.filter(c => c.custom === false).length;
      const nullCount = data.filter(c => c.custom == null).length;
      console.log('=== CARD CUSTOM STATUS DISTRIBUTION ===');
      console.log(`Total cards: ${data.length}`);
      console.log(`Custom (true): ${customCount}`);
      console.log(`Official (false): ${noncustomCount}`);
      console.log(`Null/undefined: ${nullCount}`);

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

    // Color filtering with modes
    if (filters.colors.length > 0) {
      console.log('=== FILTER DEBUG ===');
      console.log('Selected colors:', filters.colors);
      console.log('Color mode:', filters.colorMode);

      let debugCount = 0;
      filtered = filtered.filter(card => {
        const cardColors = card.colors || [];

        // Debug first 5 cards with matching color
        if (debugCount < 5 && filters.colorMode === 'exactly' && cardColors.some(c => filters.colors.includes(c))) {
          console.log('Card #' + (debugCount + 1), {
            name: card.name,
            cardColors: JSON.stringify(cardColors),
            cardColorsLength: cardColors.length,
            selectedColors: JSON.stringify(filters.colors),
            selectedLength: filters.colors.length
          });
          debugCount++;
        }

        // Handle special color filters
        if (filters.colors.includes('Colorless')) {
          // If Colorless is selected, only show cards with no colors
          return cardColors.length === 0;
        }

        if (filters.colors.includes('Gold')) {
          // If Gold is selected, only show multicolor cards (more than 1 color)
          return cardColors.length > 1;
        }

        if (filters.colorMode === 'exactly') {
          // Card must have exactly these colors (no more, no less)
          // Check same length and all selected colors are present and all card colors are in selected
          return cardColors.length === filters.colors.length &&
                 filters.colors.every(color => cardColors.includes(color)) &&
                 cardColors.every(color => filters.colors.includes(color));
        } else if (filters.colorMode === 'atMost') {
          // Card can have at most these colors (subset)
          return cardColors.every(color => filters.colors.includes(color));
        } else { // 'including'
          // Card must include at least one of these colors
          return filters.colors.some(color => cardColors.includes(color));
        }
      });

      console.log('Filtered count:', filtered.length);
    }

    // Rarity filtering with modes
    if (filters.rarities.length > 0) {
      filtered = filtered.filter(card => {
        const cardRarity = card.rarity ? card.rarity.toLowerCase() : '';
        if (filters.rarityMode === 'exactly') {
          // Only one rarity can be selected in 'exactly' mode
          return filters.rarities.some(rarity => cardRarity === rarity.toLowerCase());
        } else if (filters.rarityMode === 'atMost') {
          // Card rarity is at most one of the selected rarities
          return filters.rarities.some(rarity => cardRarity === rarity.toLowerCase());
        } else { // 'including'
          // Card rarity is in the selected rarities
          return filters.rarities.some(rarity => cardRarity === rarity.toLowerCase());
        }
      });
    }

    // Chess Piece filtering with modes
    if (filters.chessPieces.length > 0) {
      filtered = filtered.filter(card => {
        const cardPiece = card.chessPiece || 'none';
        if (filters.chessPieceMode === 'exactly') {
          return filters.chessPieces.some(piece => cardPiece === piece);
        } else if (filters.chessPieceMode === 'atMost') {
          return filters.chessPieces.some(piece => cardPiece === piece);
        } else { // 'including'
          return filters.chessPieces.some(piece => cardPiece === piece);
        }
      });
    }

    // Card Type filtering with modes
    if (filters.cardTypes.length > 0) {
      filtered = filtered.filter(card => {
        if (!card.type) return false;
        const cardTypeLower = card.type.toLowerCase();

        if (filters.cardTypeMode === 'exactly') {
          // Card type must match exactly (contains only selected types)
          return filters.cardTypes.every(type => cardTypeLower.includes(type.toLowerCase())) &&
                 filters.cardTypes.some(type => cardTypeLower.includes(type.toLowerCase()));
        } else if (filters.cardTypeMode === 'atMost') {
          // Card type contains at most these types
          return filters.cardTypes.some(type => cardTypeLower.includes(type.toLowerCase()));
        } else { // 'including'
          // Card type includes at least one of these types
          return filters.cardTypes.some(type => cardTypeLower.includes(type.toLowerCase()));
        }
      });
    }

    // Custom Status filtering
    if (filters.customStatus.length > 0) {
      console.log('=== CUSTOM STATUS FILTER DEBUG ===');
      console.log('Selected custom status:', filters.customStatus);

      filtered = filtered.filter(card => {
        // Debug first 5 cards
        const debugIndex = filtered.indexOf(card);
        if (debugIndex < 5) {
          console.log(`Card #${debugIndex + 1}:`, {
            name: card.name,
            custom: card.custom,
            customType: typeof card.custom
          });
        }

        if (filters.customStatus.includes('custom') && filters.customStatus.includes('noncustom')) {
          // If both are selected, show all cards
          return true;
        } else if (filters.customStatus.includes('custom')) {
          return card.custom === true;
        } else if (filters.customStatus.includes('noncustom')) {
          return card.custom === false;
        }
        return true;
      });

      console.log('Filtered count after custom status:', filtered.length);
    }

    // Search filtering
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(card => {
        if (filters.searchMode === 'nameOnly') {
          return card.name.toLowerCase().includes(searchLower);
        } else { // 'nameAndText'
          return card.name.toLowerCase().includes(searchLower) ||
                 (card.text && card.text.toLowerCase().includes(searchLower));
        }
      });
    }

    // Apply sorting
    filtered = applySorting(filtered);

    setFilteredCards(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const compareByField = (a, b, field) => {
    switch (field) {
      case 'name':
        return a.name.localeCompare(b.name);

      case 'manaCost':
        const aCost = a.manaCost || '';
        const bCost = b.manaCost || '';
        // Extract numeric mana value from cost string
        const aValue = parseInt(aCost.match(/\d+/)?.[0] || '0');
        const bValue = parseInt(bCost.match(/\d+/)?.[0] || '0');
        return aValue - bValue;

      case 'rarity':
        const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'mythic': 4 };
        const aRarity = rarityOrder[a.rarity?.toLowerCase()] || 0;
        const bRarity = rarityOrder[b.rarity?.toLowerCase()] || 0;
        return aRarity - bRarity;

      case 'type':
        const aType = a.type || '';
        const bType = b.type || '';
        return aType.localeCompare(bType);

      case 'color':
        const aColors = (a.colors || []).length;
        const bColors = (b.colors || []).length;
        if (aColors === bColors) {
          // If same number of colors, sort alphabetically by color
          const aColorStr = (a.colors || []).join('');
          const bColorStr = (b.colors || []).join('');
          return aColorStr.localeCompare(bColorStr);
        }
        return aColors - bColors;

      case 'custom':
        const aCustom = a.custom ? 1 : 0;
        const bCustom = b.custom ? 1 : 0;
        return aCustom - bCustom;

      default:
        return 0;
    }
  };

  const applySorting = (cardsToSort) => {
    const sorted = [...cardsToSort];

    sorted.sort((a, b) => {
      // Apply each sort criterion in order until we find a non-zero result
      for (const criterion of sortCriteria) {
        const compareResult = compareByField(a, b, criterion.field);
        if (compareResult !== 0) {
          return criterion.order === 'asc' ? compareResult : -compareResult;
        }
      }
      return 0;
    });

    return sorted;
  };

  const addSortCriterion = () => {
    setSortCriteria([...sortCriteria, { field: 'name', order: 'asc' }]);
  };

  const updateSortCriterion = (index, field, value) => {
    const updated = [...sortCriteria];
    updated[index][field] = value;
    setSortCriteria(updated);
  };

  const removeSortCriterion = (index) => {
    if (sortCriteria.length > 1) {
      setSortCriteria(sortCriteria.filter((_, i) => i !== index));
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleColorToggle = (color) => {
    setFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const handleRarityToggle = (rarity) => {
    setFilters(prev => ({
      ...prev,
      rarities: prev.rarities.includes(rarity)
        ? prev.rarities.filter(r => r !== rarity)
        : [...prev.rarities, rarity]
    }));
  };

  const handleChessPieceToggle = (piece) => {
    setFilters(prev => ({
      ...prev,
      chessPieces: prev.chessPieces.includes(piece)
        ? prev.chessPieces.filter(p => p !== piece)
        : [...prev.chessPieces, piece]
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

  const handleCustomStatusToggle = (status) => {
    setFilters(prev => ({
      ...prev,
      customStatus: prev.customStatus.includes(status)
        ? prev.customStatus.filter(s => s !== status)
        : [...prev.customStatus, status]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      colors: [],
      colorMode: 'including',
      rarities: [],
      rarityMode: 'including',
      chessPieces: [],
      chessPieceMode: 'including',
      cardTypes: [],
      cardTypeMode: 'including',
      customStatus: [],
      search: '',
      searchMode: 'nameAndText'
    });
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
              <div className="search-mode-toggle">
                <button
                  className={`mode-btn ${filters.searchMode === 'nameOnly' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('searchMode', 'nameOnly')}
                  title="Search in card names only"
                >
                  Name Only
                </button>
                <button
                  className={`mode-btn ${filters.searchMode === 'nameAndText' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('searchMode', 'nameAndText')}
                  title="Search in both card names and card text"
                >
                  Name & Text
                </button>
              </div>
            </div>

            <div className="sort-section">
              <div className="sort-header">
                <label className="sort-label">Sort By:</label>
                <button
                  className="add-sort-btn"
                  onClick={addSortCriterion}
                  title="Add another sort criterion"
                >
                  + Add Sort
                </button>
              </div>
              {sortCriteria.map((criterion, index) => (
                <div key={index} className="sort-controls">
                  <span className="sort-priority">{index + 1}.</span>
                  <select
                    value={criterion.field}
                    onChange={(e) => updateSortCriterion(index, 'field', e.target.value)}
                    className="sort-select"
                  >
                    <option value="name">Name</option>
                    <option value="manaCost">Mana Cost</option>
                    <option value="rarity">Rarity</option>
                    <option value="type">Type</option>
                    <option value="color">Color Count</option>
                    <option value="custom">Custom Status</option>
                  </select>
                  <div className="sort-order-toggle">
                    <button
                      className={`sort-order-btn ${criterion.order === 'asc' ? 'active' : ''}`}
                      onClick={() => updateSortCriterion(index, 'order', 'asc')}
                      title="Ascending order"
                    >
                      ↑ Asc
                    </button>
                    <button
                      className={`sort-order-btn ${criterion.order === 'desc' ? 'active' : ''}`}
                      onClick={() => updateSortCriterion(index, 'order', 'desc')}
                      title="Descending order"
                    >
                      ↓ Desc
                    </button>
                  </div>
                  {sortCriteria.length > 1 && (
                    <button
                      className="remove-sort-btn"
                      onClick={() => removeSortCriterion(index)}
                      title="Remove this sort criterion"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="filter-buttons">
              {/* Color Filters */}
              <div className="filter-group">
                <div className="filter-header">
                  <label>
                    Colors {filters.colors.length > 0 && <span className="filter-count">({filters.colors.length})</span>}
                  </label>
                  <div className="mode-selector">
                    <button
                      className={`mode-btn ${filters.colorMode === 'including' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('colorMode', 'including')}
                      title="Card includes at least one of the selected colors"
                    >
                      Including
                    </button>
                    <button
                      className={`mode-btn ${filters.colorMode === 'exactly' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('colorMode', 'exactly')}
                      title="Card has exactly these colors"
                    >
                      Exactly
                    </button>
                    <button
                      className={`mode-btn ${filters.colorMode === 'atMost' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('colorMode', 'atMost')}
                      title="Card has at most these colors"
                    >
                      At Most
                    </button>
                  </div>
                </div>
                <div className="filter-options">
                  <button
                    className={`filter-btn color-white ${filters.colors.includes('W') ? 'active' : ''}`}
                    onClick={() => handleColorToggle('W')}
                  >
                    ☀ White
                  </button>
                  <button
                    className={`filter-btn color-blue ${filters.colors.includes('U') ? 'active' : ''}`}
                    onClick={() => handleColorToggle('U')}
                  >
                    💧 Blue
                  </button>
                  <button
                    className={`filter-btn color-black ${filters.colors.includes('B') ? 'active' : ''}`}
                    onClick={() => handleColorToggle('B')}
                  >
                    💀 Black
                  </button>
                  <button
                    className={`filter-btn color-red ${filters.colors.includes('R') ? 'active' : ''}`}
                    onClick={() => handleColorToggle('R')}
                  >
                    🔥 Red
                  </button>
                  <button
                    className={`filter-btn color-green ${filters.colors.includes('G') ? 'active' : ''}`}
                    onClick={() => handleColorToggle('G')}
                  >
                    🌲 Green
                  </button>
                  <button
                    className={`filter-btn color-colorless ${filters.colors.includes('Colorless') ? 'active' : ''}`}
                    onClick={() => handleColorToggle('Colorless')}
                  >
                    ◇ Colorless
                  </button>
                  <button
                    className={`filter-btn color-gold ${filters.colors.includes('Gold') ? 'active' : ''}`}
                    onClick={() => handleColorToggle('Gold')}
                  >
                    ⭐ Gold
                  </button>
                </div>
              </div>

              {/* Rarity and Origin Filters - Side by side */}
              <div className="filter-row">
                <div className="filter-group filter-half">
                  <label>
                    Rarity {filters.rarities.length > 0 && <span className="filter-count">({filters.rarities.length})</span>}
                  </label>
                  <div className="filter-options">
                    <button
                      className={`filter-btn ${filters.rarities.includes('common') ? 'active' : ''}`}
                      onClick={() => handleRarityToggle('common')}
                    >
                      Common
                    </button>
                    <button
                      className={`filter-btn ${filters.rarities.includes('uncommon') ? 'active' : ''}`}
                      onClick={() => handleRarityToggle('uncommon')}
                    >
                      Uncommon
                    </button>
                    <button
                      className={`filter-btn ${filters.rarities.includes('rare') ? 'active' : ''}`}
                      onClick={() => handleRarityToggle('rare')}
                    >
                      Rare
                    </button>
                    <button
                      className={`filter-btn ${filters.rarities.includes('mythic') ? 'active' : ''}`}
                      onClick={() => handleRarityToggle('mythic')}
                    >
                      Mythic
                    </button>
                  </div>
                </div>

                <div className="filter-group filter-half">
                  <label>
                    Card Origin {filters.customStatus.length > 0 && <span className="filter-count">({filters.customStatus.length})</span>}
                  </label>
                  <div className="filter-options">
                    <button
                      className={`filter-btn custom-btn ${filters.customStatus.includes('custom') ? 'active' : ''}`}
                      onClick={() => handleCustomStatusToggle('custom')}
                    >
                      ✨ Custom
                    </button>
                    <button
                      className={`filter-btn noncustom-btn ${filters.customStatus.includes('noncustom') ? 'active' : ''}`}
                      onClick={() => handleCustomStatusToggle('noncustom')}
                    >
                      📜 Official
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Types */}
              <div className="filter-group">
                <div className="filter-header">
                  <label>
                    Card Types {filters.cardTypes.length > 0 && <span className="filter-count">({filters.cardTypes.length})</span>}
                  </label>
                  <div className="mode-selector">
                    <button
                      className={`mode-btn ${filters.cardTypeMode === 'including' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('cardTypeMode', 'including')}
                      title="Card includes at least one of the selected types"
                    >
                      Including
                    </button>
                    <button
                      className={`mode-btn ${filters.cardTypeMode === 'exactly' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('cardTypeMode', 'exactly')}
                      title="Card has exactly these types"
                    >
                      Exactly
                    </button>
                    <button
                      className={`mode-btn ${filters.cardTypeMode === 'atMost' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('cardTypeMode', 'atMost')}
                      title="Card has at most these types"
                    >
                      At Most
                    </button>
                  </div>
                </div>
                <div className="filter-options">
                  <button
                    className={`filter-btn ${filters.cardTypes.includes('Creature') ? 'active' : ''}`}
                    onClick={() => handleCardTypeToggle('Creature')}
                  >
                    Creature
                  </button>
                  <button
                    className={`filter-btn ${filters.cardTypes.includes('Instant') ? 'active' : ''}`}
                    onClick={() => handleCardTypeToggle('Instant')}
                  >
                    Instant
                  </button>
                  <button
                    className={`filter-btn ${filters.cardTypes.includes('Sorcery') ? 'active' : ''}`}
                    onClick={() => handleCardTypeToggle('Sorcery')}
                  >
                    Sorcery
                  </button>
                  <button
                    className={`filter-btn ${filters.cardTypes.includes('Enchantment') ? 'active' : ''}`}
                    onClick={() => handleCardTypeToggle('Enchantment')}
                  >
                    Enchantment
                  </button>
                  <button
                    className={`filter-btn ${filters.cardTypes.includes('Artifact') ? 'active' : ''}`}
                    onClick={() => handleCardTypeToggle('Artifact')}
                  >
                    Artifact
                  </button>
                  <button
                    className={`filter-btn ${filters.cardTypes.includes('Land') ? 'active' : ''}`}
                    onClick={() => handleCardTypeToggle('Land')}
                  >
                    Land
                  </button>
                  <button
                    className={`filter-btn ${filters.cardTypes.includes('Planeswalker') ? 'active' : ''}`}
                    onClick={() => handleCardTypeToggle('Planeswalker')}
                  >
                    Planeswalker
                  </button>
                </div>
              </div>

              {/* Chess Pieces */}
              <div className="filter-group">
                <label>
                  Chess Pieces {filters.chessPieces.length > 0 && <span className="filter-count">({filters.chessPieces.length})</span>}
                </label>
                <div className="filter-options">
                  <button
                    className={`filter-btn ${filters.chessPieces.includes('pawn') ? 'active' : ''}`}
                    onClick={() => handleChessPieceToggle('pawn')}
                  >
                    ♟ Pawn
                  </button>
                  <button
                    className={`filter-btn ${filters.chessPieces.includes('knight') ? 'active' : ''}`}
                    onClick={() => handleChessPieceToggle('knight')}
                  >
                    ♞ Knight
                  </button>
                  <button
                    className={`filter-btn ${filters.chessPieces.includes('bishop') ? 'active' : ''}`}
                    onClick={() => handleChessPieceToggle('bishop')}
                  >
                    ♝ Bishop
                  </button>
                  <button
                    className={`filter-btn ${filters.chessPieces.includes('rook') ? 'active' : ''}`}
                    onClick={() => handleChessPieceToggle('rook')}
                  >
                    ♜ Rook
                  </button>
                  <button
                    className={`filter-btn ${filters.chessPieces.includes('queen') ? 'active' : ''}`}
                    onClick={() => handleChessPieceToggle('queen')}
                  >
                    ♛ Queen
                  </button>
                  <button
                    className={`filter-btn ${filters.chessPieces.includes('king') ? 'active' : ''}`}
                    onClick={() => handleChessPieceToggle('king')}
                  >
                    ♚ King
                  </button>
                </div>
              </div>
            </div>

            <div className="filter-footer">
              <button
                className="clear-filters-btn"
                onClick={clearAllFilters}
                disabled={
                  filters.colors.length === 0 &&
                  filters.rarities.length === 0 &&
                  filters.chessPieces.length === 0 &&
                  filters.cardTypes.length === 0 &&
                  filters.customStatus.length === 0 &&
                  filters.search === ''
                }
              >
                ✕ Clear All Filters
              </button>
              <div className="results-count">
                Showing {Math.min((currentPage - 1) * cardsPerPage + 1, filteredCards.length)}-{Math.min(currentPage * cardsPerPage, filteredCards.length)} of {filteredCards.length} cards
              </div>
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <div className="no-results">
              <p>No cards found matching your filters.</p>
              <button onClick={clearAllFilters} className="btn btn-secondary">
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
