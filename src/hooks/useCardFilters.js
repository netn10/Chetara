import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { applyFilter, searchFilter, FILTER_MODES } from '../utils/filterUtils';
import logger from '../utils/logger';

/**
 * Custom hook for managing card filter state and logic
 *
 * @param {Array} cards - Array of all cards
 * @returns {Object} Filter state and handlers
 */
export function useCardFilters(cards) {
  const [searchParams] = useSearchParams();

  /**
   * Gets initial filter state from URL parameters
   * @returns {Object} Initial filter configuration
   */
  const getInitialFilters = () => {
    const chessPieceParam = searchParams.get('chessPiece');
    return {
      colors: [],
      colorMode: FILTER_MODES.INCLUDING,
      rarities: [],
      rarityMode: FILTER_MODES.INCLUDING,
      chessPieces: chessPieceParam ? [chessPieceParam] : [],
      chessPieceMode: FILTER_MODES.INCLUDING,
      cardTypes: [],
      cardTypeMode: FILTER_MODES.INCLUDING,
      customStatus: [],
      search: '',
      searchMode: 'nameAndText'
    };
  };

  const [filters, setFilters] = useState(getInitialFilters());

  // Update filters when URL params change
  useEffect(() => {
    const chessPieceParam = searchParams.get('chessPiece');
    if (chessPieceParam) {
      setFilters(prev => ({
        ...prev,
        chessPieces: [chessPieceParam]
      }));
    }
  }, [searchParams]);

  /**
   * Applies all active filters to the card collection
   * @returns {Array} Filtered cards
   */
  const filteredCards = useMemo(() => {
    let result = [...cards];

    // Color filtering with special handling for Colorless and Gold
    if (filters.colors.length > 0) {
      logger.debug('Applying color filter:', filters.colors, 'Mode:', filters.colorMode);

      result = result.filter(card => {
        const cardColors = card.colors || [];

        // Special case: Colorless
        if (filters.colors.includes('Colorless')) {
          return cardColors.length === 0;
        }

        // Special case: Gold (multicolor)
        if (filters.colors.includes('Gold')) {
          return cardColors.length > 1;
        }

        // Apply standard filter modes
        if (filters.colorMode === FILTER_MODES.EXACTLY) {
          return cardColors.length === filters.colors.length &&
                 filters.colors.every(color => cardColors.includes(color)) &&
                 cardColors.every(color => filters.colors.includes(color));
        } else if (filters.colorMode === FILTER_MODES.AT_MOST) {
          return cardColors.every(color => filters.colors.includes(color));
        } else {
          return filters.colors.some(color => cardColors.includes(color));
        }
      });

      logger.debug('Cards after color filter:', result.length);
    }

    // Rarity filtering
    if (filters.rarities.length > 0) {
      result = applyFilter(result, {
        values: filters.rarities,
        mode: filters.rarityMode,
        getValue: card => [card.rarity?.toLowerCase() || '']
      });
    }

    // Chess piece filtering
    if (filters.chessPieces.length > 0) {
      result = applyFilter(result, {
        values: filters.chessPieces,
        mode: filters.chessPieceMode,
        getValue: card => [card.chessPiece || 'none']
      });
    }

    // Card type filtering
    if (filters.cardTypes.length > 0) {
      result = result.filter(card => {
        if (!card.type) return false;
        const cardTypeLower = card.type.toLowerCase();

        if (filters.cardTypeMode === FILTER_MODES.EXACTLY) {
          return filters.cardTypes.every(type => cardTypeLower.includes(type.toLowerCase())) &&
                 filters.cardTypes.some(type => cardTypeLower.includes(type.toLowerCase()));
        } else if (filters.cardTypeMode === FILTER_MODES.AT_MOST) {
          return filters.cardTypes.some(type => cardTypeLower.includes(type.toLowerCase()));
        } else {
          return filters.cardTypes.some(type => cardTypeLower.includes(type.toLowerCase()));
        }
      });
    }

    // Custom status filtering
    if (filters.customStatus.length > 0) {
      logger.debug('Applying custom status filter:', filters.customStatus);

      result = result.filter(card => {
        if (filters.customStatus.includes('custom') && filters.customStatus.includes('noncustom')) {
          return true;
        } else if (filters.customStatus.includes('custom')) {
          return card.custom === true;
        } else if (filters.customStatus.includes('noncustom')) {
          return card.custom === false;
        }
        return true;
      });

      logger.debug('Cards after custom status filter:', result.length);
    }

    // Search filtering
    if (filters.search) {
      const searchFunctions = filters.searchMode === 'nameOnly'
        ? [card => card.name]
        : [card => card.name, card => card.text || ''];

      result = searchFilter(result, filters.search, searchFunctions);
    }

    return result;
  }, [cards, filters]);

  /**
   * Updates a specific filter value
   * @param {string} filterType - Filter key to update
   * @param {*} value - New filter value
   */
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  /**
   * Toggles a color selection
   * @param {string} color - Color to toggle
   */
  const handleColorToggle = (color) => {
    setFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  /**
   * Toggles a rarity selection
   * @param {string} rarity - Rarity to toggle
   */
  const handleRarityToggle = (rarity) => {
    setFilters(prev => ({
      ...prev,
      rarities: prev.rarities.includes(rarity)
        ? prev.rarities.filter(r => r !== rarity)
        : [...prev.rarities, rarity]
    }));
  };

  /**
   * Toggles a chess piece selection
   * @param {string} piece - Chess piece to toggle
   */
  const handleChessPieceToggle = (piece) => {
    setFilters(prev => ({
      ...prev,
      chessPieces: prev.chessPieces.includes(piece)
        ? prev.chessPieces.filter(p => p !== piece)
        : [...prev.chessPieces, piece]
    }));
  };

  /**
   * Toggles a card type selection
   * @param {string} type - Card type to toggle
   */
  const handleCardTypeToggle = (type) => {
    setFilters(prev => ({
      ...prev,
      cardTypes: prev.cardTypes.includes(type)
        ? prev.cardTypes.filter(t => t !== type)
        : [...prev.cardTypes, type]
    }));
  };

  /**
   * Toggles a custom status selection
   * @param {string} status - Custom status to toggle ('custom' or 'noncustom')
   */
  const handleCustomStatusToggle = (status) => {
    setFilters(prev => ({
      ...prev,
      customStatus: prev.customStatus.includes(status)
        ? prev.customStatus.filter(s => s !== status)
        : [...prev.customStatus, status]
    }));
  };

  /**
   * Clears all active filters
   */
  const clearAllFilters = () => {
    setFilters({
      colors: [],
      colorMode: FILTER_MODES.INCLUDING,
      rarities: [],
      rarityMode: FILTER_MODES.INCLUDING,
      chessPieces: [],
      chessPieceMode: FILTER_MODES.INCLUDING,
      cardTypes: [],
      cardTypeMode: FILTER_MODES.INCLUDING,
      customStatus: [],
      search: '',
      searchMode: 'nameAndText'
    });
  };

  /**
   * Checks if any filters are currently active
   * @returns {boolean} True if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return filters.colors.length > 0 ||
           filters.rarities.length > 0 ||
           filters.chessPieces.length > 0 ||
           filters.cardTypes.length > 0 ||
           filters.customStatus.length > 0 ||
           filters.search !== '';
  }, [filters]);

  return {
    filters,
    filteredCards,
    hasActiveFilters,
    handleFilterChange,
    handleColorToggle,
    handleRarityToggle,
    handleChessPieceToggle,
    handleCardTypeToggle,
    handleCustomStatusToggle,
    clearAllFilters
  };
}
