/**
 * Generic filtering utilities for card collections
 */

import { arraysEqual, isSubset, hasCommonElement } from './arrayUtils';

/**
 * Filter modes available for multi-value filters
 */
export const FILTER_MODES = {
  EXACTLY: 'exactly',
  AT_MOST: 'atMost',
  INCLUDING: 'including'
};

/**
 * Applies a filter to a collection of items based on configuration
 *
 * @param {Array} items - Items to filter
 * @param {Object} filterConfig - Filter configuration
 * @param {Array} filterConfig.values - Values to filter by
 * @param {string} filterConfig.mode - Filter mode (exactly, atMost, including)
 * @param {Function} filterConfig.getValue - Function to extract values from item
 * @returns {Array} Filtered items
 *
 * @example
 * const cards = [{colors: ['W', 'U']}, {colors: ['B']}];
 * applyFilter(cards, {
 *   values: ['W', 'U'],
 *   mode: 'exactly',
 *   getValue: card => card.colors
 * });
 * // Returns: [{colors: ['W', 'U']}]
 */
export function applyFilter(items, filterConfig) {
  const { values, mode, getValue } = filterConfig;

  // No filter applied if no values selected
  if (!values || values.length === 0) {
    return items;
  }

  return items.filter(item => {
    const itemValues = getValue(item);

    // Handle null/undefined values
    if (!itemValues) {
      return false;
    }

    // Ensure itemValues is an array
    const itemValuesArray = Array.isArray(itemValues) ? itemValues : [itemValues];

    switch (mode) {
      case FILTER_MODES.EXACTLY:
        // Item must have exactly these values and no others
        return arraysEqual(itemValuesArray, values);

      case FILTER_MODES.AT_MOST:
        // Item values must be a subset of filter values
        return isSubset(itemValuesArray, values);

      case FILTER_MODES.INCLUDING:
      default:
        // Item must have at least one of the filter values
        return hasCommonElement(itemValuesArray, values);
    }
  });
}

/**
 * Applies multiple filters sequentially to a collection
 *
 * @param {Array} items - Items to filter
 * @param {Array<Object>} filters - Array of filter configurations
 * @returns {Array} Filtered items
 *
 * @example
 * applyMultipleFilters(cards, [
 *   { values: ['W'], mode: 'including', getValue: c => c.colors },
 *   { values: ['rare'], mode: 'including', getValue: c => [c.rarity] }
 * ]);
 */
export function applyMultipleFilters(items, filters) {
  return filters.reduce((filtered, filterConfig) => {
    return applyFilter(filtered, filterConfig);
  }, items);
}

/**
 * Filters items by a text search term
 *
 * @param {Array} items - Items to filter
 * @param {string} searchTerm - Search term
 * @param {Function|Array<Function>} getSearchableText - Function(s) to extract searchable text
 * @returns {Array} Filtered items
 *
 * @example
 * searchFilter(cards, 'lightning', card => card.name)
 * searchFilter(cards, 'bolt', [card => card.name, card => card.text])
 */
export function searchFilter(items, searchTerm, getSearchableText) {
  if (!searchTerm || searchTerm.trim() === '') {
    return items;
  }

  const term = searchTerm.toLowerCase().trim();
  const textGetters = Array.isArray(getSearchableText) ? getSearchableText : [getSearchableText];

  return items.filter(item => {
    return textGetters.some(getter => {
      const text = getter(item);
      return text && text.toLowerCase().includes(term);
    });
  });
}

/**
 * Filters items by a numeric range
 *
 * @param {Array} items - Items to filter
 * @param {Object} range - Range configuration
 * @param {number} range.min - Minimum value (inclusive)
 * @param {number} range.max - Maximum value (inclusive)
 * @param {Function} getValue - Function to extract numeric value from item
 * @returns {Array} Filtered items
 */
export function rangeFilter(items, range, getValue) {
  const { min, max } = range;

  if (min === undefined && max === undefined) {
    return items;
  }

  return items.filter(item => {
    const value = getValue(item);

    if (value === undefined || value === null) {
      return false;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return false;
    }

    if (min !== undefined && numValue < min) {
      return false;
    }

    if (max !== undefined && numValue > max) {
      return false;
    }

    return true;
  });
}
