/**
 * Utility functions for array operations
 */

/**
 * Checks if two arrays contain the same elements (order independent)
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} True if arrays have same elements
 */
export function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;

  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();

  return sorted1.every((val, index) => val === sorted2[index]);
}

/**
 * Checks if array1 is a subset of array2
 * @param {Array} subset - The potential subset array
 * @param {Array} superset - The potential superset array
 * @returns {boolean} True if subset is contained in superset
 */
export function isSubset(subset, superset) {
  return subset.every(item => superset.includes(item));
}

/**
 * Checks if two arrays have any common elements
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} True if arrays have at least one common element
 */
export function hasCommonElement(arr1, arr2) {
  return arr1.some(item => arr2.includes(item));
}

/**
 * Removes duplicates from an array
 * @param {Array} arr - Array with potential duplicates
 * @returns {Array} Array with unique values only
 */
export function unique(arr) {
  return [...new Set(arr)];
}

/**
 * Groups array items by a key function
 * @param {Array} arr - Array to group
 * @param {Function} keyFn - Function to extract grouping key
 * @returns {Object} Object with grouped items
 *
 * @example
 * groupBy([{type: 'a', val: 1}, {type: 'b', val: 2}], item => item.type)
 * // Returns: { a: [{type: 'a', val: 1}], b: [{type: 'b', val: 2}] }
 */
export function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}
