/**
 * Logger utility for consistent logging across the application
 * Automatically filters out debug logs in production builds
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Debug logging - only shows in development
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Info logging - shows in all environments
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    console.info(...args);
  },

  /**
   * Warning logging - shows in all environments
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    console.warn(...args);
  },

  /**
   * Error logging - shows in all environments
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Group logging - only shows in development
   * @param {string} label - Group label
   */
  group: (label) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * End group logging - only shows in development
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Table logging for structured data - only shows in development
   * @param {any} data - Data to display in table format
   */
  table: (data) => {
    if (isDevelopment) {
      console.table(data);
    }
  }
};

export default logger;
