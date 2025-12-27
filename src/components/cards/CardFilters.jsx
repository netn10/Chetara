import { FILTER_MODES } from '../../utils/filterUtils';
import './CardFilters.css';

/**
 * CardFilters component - Renders all filter UI and manages filter interactions
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter state
 * @param {Function} props.onFilterChange - Handler for filter changes
 * @param {Function} props.onColorToggle - Handler for color toggles
 * @param {Function} props.onRarityToggle - Handler for rarity toggles
 * @param {Function} props.onChessPieceToggle - Handler for chess piece toggles
 * @param {Function} props.onCardTypeToggle - Handler for card type toggles
 * @param {Function} props.onCustomStatusToggle - Handler for custom status toggles
 * @param {Function} props.onClearAll - Handler for clearing all filters
 * @param {number} props.filteredCount - Number of filtered cards
 * @param {number} props.currentPage - Current page number
 * @param {number} props.cardsPerPage - Cards per page
 */
export default function CardFilters({
  filters,
  onFilterChange,
  onColorToggle,
  onRarityToggle,
  onChessPieceToggle,
  onCardTypeToggle,
  onCustomStatusToggle,
  onClearAll,
  filteredCount,
  currentPage,
  cardsPerPage
}) {
  const hasActiveFilters = filters.colors.length > 0 ||
                          filters.rarities.length > 0 ||
                          filters.chessPieces.length > 0 ||
                          filters.cardTypes.length > 0 ||
                          filters.customStatus.length > 0 ||
                          filters.search !== '';

  return (
    <div className="filters-section">
      {/* Search Box */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search cards..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="search-input"
        />
        <div className="search-mode-toggle">
          <button
            className={`mode-btn ${filters.searchMode === 'nameOnly' ? 'active' : ''}`}
            onClick={() => onFilterChange('searchMode', 'nameOnly')}
            title="Search in card names only"
          >
            Name Only
          </button>
          <button
            className={`mode-btn ${filters.searchMode === 'nameAndText' ? 'active' : ''}`}
            onClick={() => onFilterChange('searchMode', 'nameAndText')}
            title="Search in both card names and card text"
          >
            Name & Text
          </button>
        </div>
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
                className={`mode-btn ${filters.colorMode === FILTER_MODES.INCLUDING ? 'active' : ''}`}
                onClick={() => onFilterChange('colorMode', FILTER_MODES.INCLUDING)}
                title="Card includes at least one of the selected colors"
              >
                Including
              </button>
              <button
                className={`mode-btn ${filters.colorMode === FILTER_MODES.EXACTLY ? 'active' : ''}`}
                onClick={() => onFilterChange('colorMode', FILTER_MODES.EXACTLY)}
                title="Card has exactly these colors"
              >
                Exactly
              </button>
              <button
                className={`mode-btn ${filters.colorMode === FILTER_MODES.AT_MOST ? 'active' : ''}`}
                onClick={() => onFilterChange('colorMode', FILTER_MODES.AT_MOST)}
                title="Card has at most these colors"
              >
                At Most
              </button>
            </div>
          </div>
          <div className="filter-options">
            <button
              className={`filter-btn color-white ${filters.colors.includes('W') ? 'active' : ''}`}
              onClick={() => onColorToggle('W')}
            >
              ☀ White
            </button>
            <button
              className={`filter-btn color-blue ${filters.colors.includes('U') ? 'active' : ''}`}
              onClick={() => onColorToggle('U')}
            >
              💧 Blue
            </button>
            <button
              className={`filter-btn color-black ${filters.colors.includes('B') ? 'active' : ''}`}
              onClick={() => onColorToggle('B')}
            >
              💀 Black
            </button>
            <button
              className={`filter-btn color-red ${filters.colors.includes('R') ? 'active' : ''}`}
              onClick={() => onColorToggle('R')}
            >
              🔥 Red
            </button>
            <button
              className={`filter-btn color-green ${filters.colors.includes('G') ? 'active' : ''}`}
              onClick={() => onColorToggle('G')}
            >
              🌲 Green
            </button>
            <button
              className={`filter-btn color-colorless ${filters.colors.includes('Colorless') ? 'active' : ''}`}
              onClick={() => onColorToggle('Colorless')}
            >
              ◇ Colorless
            </button>
            <button
              className={`filter-btn color-gold ${filters.colors.includes('Gold') ? 'active' : ''}`}
              onClick={() => onColorToggle('Gold')}
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
                onClick={() => onRarityToggle('common')}
              >
                Common
              </button>
              <button
                className={`filter-btn ${filters.rarities.includes('uncommon') ? 'active' : ''}`}
                onClick={() => onRarityToggle('uncommon')}
              >
                Uncommon
              </button>
              <button
                className={`filter-btn ${filters.rarities.includes('rare') ? 'active' : ''}`}
                onClick={() => onRarityToggle('rare')}
              >
                Rare
              </button>
              <button
                className={`filter-btn ${filters.rarities.includes('mythic') ? 'active' : ''}`}
                onClick={() => onRarityToggle('mythic')}
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
                onClick={() => onCustomStatusToggle('custom')}
              >
                ✨ Custom
              </button>
              <button
                className={`filter-btn noncustom-btn ${filters.customStatus.includes('noncustom') ? 'active' : ''}`}
                onClick={() => onCustomStatusToggle('noncustom')}
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
                className={`mode-btn ${filters.cardTypeMode === FILTER_MODES.INCLUDING ? 'active' : ''}`}
                onClick={() => onFilterChange('cardTypeMode', FILTER_MODES.INCLUDING)}
                title="Card includes at least one of the selected types"
              >
                Including
              </button>
              <button
                className={`mode-btn ${filters.cardTypeMode === FILTER_MODES.EXACTLY ? 'active' : ''}`}
                onClick={() => onFilterChange('cardTypeMode', FILTER_MODES.EXACTLY)}
                title="Card has exactly these types"
              >
                Exactly
              </button>
              <button
                className={`mode-btn ${filters.cardTypeMode === FILTER_MODES.AT_MOST ? 'active' : ''}`}
                onClick={() => onFilterChange('cardTypeMode', FILTER_MODES.AT_MOST)}
                title="Card has at most these types"
              >
                At Most
              </button>
            </div>
          </div>
          <div className="filter-options">
            <button
              className={`filter-btn ${filters.cardTypes.includes('Creature') ? 'active' : ''}`}
              onClick={() => onCardTypeToggle('Creature')}
            >
              Creature
            </button>
            <button
              className={`filter-btn ${filters.cardTypes.includes('Instant') ? 'active' : ''}`}
              onClick={() => onCardTypeToggle('Instant')}
            >
              Instant
            </button>
            <button
              className={`filter-btn ${filters.cardTypes.includes('Sorcery') ? 'active' : ''}`}
              onClick={() => onCardTypeToggle('Sorcery')}
            >
              Sorcery
            </button>
            <button
              className={`filter-btn ${filters.cardTypes.includes('Enchantment') ? 'active' : ''}`}
              onClick={() => onCardTypeToggle('Enchantment')}
            >
              Enchantment
            </button>
            <button
              className={`filter-btn ${filters.cardTypes.includes('Artifact') ? 'active' : ''}`}
              onClick={() => onCardTypeToggle('Artifact')}
            >
              Artifact
            </button>
            <button
              className={`filter-btn ${filters.cardTypes.includes('Land') ? 'active' : ''}`}
              onClick={() => onCardTypeToggle('Land')}
            >
              Land
            </button>
            <button
              className={`filter-btn ${filters.cardTypes.includes('Planeswalker') ? 'active' : ''}`}
              onClick={() => onCardTypeToggle('Planeswalker')}
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
              onClick={() => onChessPieceToggle('pawn')}
            >
              ♟ Pawn
            </button>
            <button
              className={`filter-btn ${filters.chessPieces.includes('knight') ? 'active' : ''}`}
              onClick={() => onChessPieceToggle('knight')}
            >
              ♞ Knight
            </button>
            <button
              className={`filter-btn ${filters.chessPieces.includes('bishop') ? 'active' : ''}`}
              onClick={() => onChessPieceToggle('bishop')}
            >
              ♝ Bishop
            </button>
            <button
              className={`filter-btn ${filters.chessPieces.includes('rook') ? 'active' : ''}`}
              onClick={() => onChessPieceToggle('rook')}
            >
              ♜ Rook
            </button>
            <button
              className={`filter-btn ${filters.chessPieces.includes('queen') ? 'active' : ''}`}
              onClick={() => onChessPieceToggle('queen')}
            >
              ♛ Queen
            </button>
            <button
              className={`filter-btn ${filters.chessPieces.includes('king') ? 'active' : ''}`}
              onClick={() => onChessPieceToggle('king')}
            >
              ♚ King
            </button>
          </div>
        </div>
      </div>

      {/* Filter Footer */}
      <div className="filter-footer">
        <button
          className="clear-filters-btn"
          onClick={onClearAll}
          disabled={!hasActiveFilters}
        >
          ✕ Clear All Filters
        </button>
        <div className="results-count">
          Showing {Math.min((currentPage - 1) * cardsPerPage + 1, filteredCount)}-{Math.min(currentPage * cardsPerPage, filteredCount)} of {filteredCount} cards
        </div>
      </div>
    </div>
  );
}
