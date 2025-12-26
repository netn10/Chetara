/**
 * Logging utility that respects NODE_ENV
 * - In development: All logs are output
 * - In production: Only errors and warnings are output
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = {
  /**
   * Log general information (only in development)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log informational messages (only in development)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log warnings (always logged)
   */
  warn: (...args) => {
    console.warn(...args);
  },

  /**
   * Log errors (always logged)
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log debug information (only in development)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

export default logger;
