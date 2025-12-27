/**
 * Generic sorting utilities for collections
 */

/**
 * Sort directions
 */
export const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc'
};

/**
 * Sorts items by a value extracted via getValue function
 *
 * @param {Array} items - Items to sort
 * @param {Function} getValue - Function to extract sort value
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted items (new array)
 *
 * @example
 * sortBy(cards, card => card.name, 'asc')
 * sortBy(cards, card => card.manaCost, 'desc')
 */
export function sortBy(items, getValue, direction = SORT_DIRECTION.ASC) {
  const sorted = [...items].sort((a, b) => {
    const aVal = getValue(a);
    const bVal = getValue(b);

    // Handle null/undefined
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    // Numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === SORT_DIRECTION.ASC ? aVal - bVal : bVal - aVal;
    }

    // String comparison
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (direction === SORT_DIRECTION.ASC) {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  return sorted;
}

/**
 * Sorts items by multiple criteria in priority order
 *
 * @param {Array} items - Items to sort
 * @param {Array<Object>} sortConfigs - Array of sort configurations
 * @param {Function} sortConfigs[].getValue - Function to extract sort value
 * @param {string} sortConfigs[].direction - Sort direction
 * @returns {Array} Sorted items (new array)
 *
 * @example
 * sortByMultiple(cards, [
 *   { getValue: c => c.rarity, direction: 'desc' },
 *   { getValue: c => c.name, direction: 'asc' }
 * ])
 */
export function sortByMultiple(items, sortConfigs) {
  return [...items].sort((a, b) => {
    for (const config of sortConfigs) {
      const { getValue, direction = SORT_DIRECTION.ASC } = config;

      const aVal = getValue(a);
      const bVal = getValue(b);

      // Handle null/undefined
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        // String comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        comparison = aStr.localeCompare(bStr);
      }

      if (comparison !== 0) {
        return direction === SORT_DIRECTION.ASC ? comparison : -comparison;
      }
    }

    return 0;
  });
}

/**
 * Creates a comparator function for custom sorting
 *
 * @param {Function} getValue - Function to extract sort value
 * @param {string} direction - Sort direction
 * @returns {Function} Comparator function
 */
export function createComparator(getValue, direction = SORT_DIRECTION.ASC) {
  return (a, b) => {
    const aVal = getValue(a);
    const bVal = getValue(b);

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === SORT_DIRECTION.ASC ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    return direction === SORT_DIRECTION.ASC
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  };
}
