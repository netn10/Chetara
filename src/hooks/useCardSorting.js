import { useState, useMemo } from 'react';
import { sortByMultiple, SORT_DIRECTION } from '../utils/sortUtils';

/**
 * Custom hook for managing card sorting state and logic
 *
 * @param {Array} cards - Array of cards to sort
 * @returns {Object} Sort state and handlers
 */
export function useCardSorting(cards) {
  const [sortCriteria, setSortCriteria] = useState([
    { field: 'name', order: SORT_DIRECTION.ASC }
  ]);

  /**
   * Maps a field name to a value getter function
   * @param {string} field - Field name
   * @returns {Function} Value getter function
   */
  const getFieldValueGetter = (field) => {
    switch (field) {
      case 'name':
        return card => card.name;

      case 'manaCost':
        return card => {
          const cost = card.manaCost || '';
          const match = cost.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        };

      case 'rarity':
        return card => {
          const rarityOrder = { 'common': 1, 'uncommon': 2, 'rare': 3, 'mythic': 4 };
          return rarityOrder[card.rarity?.toLowerCase()] || 0;
        };

      case 'type':
        return card => card.type || '';

      case 'color':
        return card => {
          const colorCount = (card.colors || []).length;
          const colorStr = (card.colors || []).join('');
          // Return composite value: sort by count first, then alphabetically
          return colorCount.toString().padStart(2, '0') + colorStr;
        };

      case 'custom':
        return card => card.custom ? 1 : 0;

      default:
        return card => card[field];
    }
  };

  /**
   * Applies sorting to the cards based on current criteria
   */
  const sortedCards = useMemo(() => {
    const sortConfigs = sortCriteria.map(criterion => ({
      getValue: getFieldValueGetter(criterion.field),
      direction: criterion.order
    }));

    return sortByMultiple(cards, sortConfigs);
  }, [cards, sortCriteria]);

  /**
   * Adds a new sort criterion
   */
  const handleAddSortCriterion = () => {
    setSortCriteria([...sortCriteria, { field: 'name', order: SORT_DIRECTION.ASC }]);
  };

  /**
   * Updates a specific sort criterion
   * @param {number} index - Index of criterion to update
   * @param {string} field - Field to update ('field' or 'order')
   * @param {*} value - New value
   */
  const handleUpdateSortCriterion = (index, field, value) => {
    const updated = [...sortCriteria];
    updated[index][field] = value;
    setSortCriteria(updated);
  };

  /**
   * Removes a sort criterion
   * @param {number} index - Index of criterion to remove
   */
  const handleRemoveSortCriterion = (index) => {
    if (sortCriteria.length > 1) {
      setSortCriteria(sortCriteria.filter((_, i) => i !== index));
    }
  };

  /**
   * Checks if multiple sort criteria are active
   * @returns {boolean} True if more than one criterion is active
   */
  const hasMultipleSortCriteria = sortCriteria.length > 1;

  return {
    sortCriteria,
    sortedCards,
    hasMultipleSortCriteria,
    handleAddSortCriterion,
    handleUpdateSortCriterion,
    handleRemoveSortCriterion
  };
}
