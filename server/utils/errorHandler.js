/**
 * Error handling utilities for standardized API error responses
 * Provides consistent error messages, codes, and actionable suggestions
 */

import logger from './logger.js';

/**
 * Error codes for different types of failures
 */
export const ErrorCodes = {
  // Authentication errors (401)
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // Validation errors (400)
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_DUPLICATE: 'VALIDATION_DUPLICATE',

  // Resource errors (404)
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CARD_NOT_FOUND: 'CARD_NOT_FOUND',
  DRAFT_NOT_FOUND: 'DRAFT_NOT_FOUND',
  SEALED_NOT_FOUND: 'SEALED_NOT_FOUND',
  GAME_NOT_FOUND: 'GAME_NOT_FOUND',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',

  // State errors (400)
  STATE_INVALID: 'STATE_INVALID',
  DRAFT_ALREADY_STARTED: 'DRAFT_ALREADY_STARTED',
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
  GAME_NOT_STARTED: 'GAME_NOT_STARTED',
  GAME_COMPLETED: 'GAME_COMPLETED',

  // Business logic errors (400)
  INSUFFICIENT_PLAYERS: 'INSUFFICIENT_PLAYERS',
  DRAFT_FULL: 'DRAFT_FULL',
  INVALID_ACTION: 'INVALID_ACTION',
  CARD_NOT_IN_HAND: 'CARD_NOT_IN_HAND',
  CARD_NOT_IN_BOOSTER: 'CARD_NOT_IN_BOOSTER',
  NO_BOOSTER_AVAILABLE: 'NO_BOOSTER_AVAILABLE',
  LIBRARY_EMPTY: 'LIBRARY_EMPTY',
  DECK_SIZE_INVALID: 'DECK_SIZE_INVALID',

  // Database errors (500)
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',

  // Cards-specific errors
  CARDS_FETCH_ERROR: 'CARDS_FETCH_ERROR',
  CARDS_CREATE_ERROR: 'CARDS_CREATE_ERROR',
  CARDS_UPDATE_ERROR: 'CARDS_UPDATE_ERROR',
  CARDS_DELETE_ERROR: 'CARDS_DELETE_ERROR',
  CARDS_INSUFFICIENT: 'CARDS_INSUFFICIENT',

  // Server errors (500)
  SERVER_ERROR: 'SERVER_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

/**
 * User-friendly error messages with actionable suggestions
 */
const errorMessages = {
  // Authentication
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: {
    message: 'Invalid username or password',
    suggestion: 'Please check your credentials and try again',
  },
  [ErrorCodes.AUTH_TOKEN_MISSING]: {
    message: 'Authentication required',
    suggestion: 'Please log in to access this resource',
  },
  [ErrorCodes.AUTH_TOKEN_INVALID]: {
    message: 'Invalid authentication token',
    suggestion: 'Please log in again',
  },
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: {
    message: 'Your session has expired',
    suggestion: 'Please log in again to continue',
  },
  [ErrorCodes.AUTH_USER_NOT_FOUND]: {
    message: 'User account not found',
    suggestion: 'This account may have been deleted. Please contact support if you believe this is an error',
  },
  [ErrorCodes.AUTH_UNAUTHORIZED]: {
    message: 'You do not have permission to perform this action',
    suggestion: 'This action requires admin privileges',
  },

  // Validation
  [ErrorCodes.VALIDATION_FAILED]: {
    message: 'Invalid request data',
    suggestion: 'Please check your input and try again',
  },
  [ErrorCodes.VALIDATION_MISSING_FIELD]: {
    message: 'Required field is missing',
    suggestion: 'Please fill in all required fields',
  },
  [ErrorCodes.VALIDATION_INVALID_FORMAT]: {
    message: 'Invalid data format',
    suggestion: 'Please ensure your data is in the correct format',
  },
  [ErrorCodes.VALIDATION_DUPLICATE]: {
    message: 'A resource with this identifier already exists',
    suggestion: 'Please use a different name or identifier',
  },

  // Resources
  [ErrorCodes.RESOURCE_NOT_FOUND]: {
    message: 'The requested resource was not found',
    suggestion: 'Please check the URL and try again',
  },
  [ErrorCodes.CARD_NOT_FOUND]: {
    message: 'Card not found',
    suggestion: 'The card may have been deleted. Please refresh and try again',
  },
  [ErrorCodes.DRAFT_NOT_FOUND]: {
    message: 'Draft session not found',
    suggestion: 'The draft may have expired. Please create a new draft',
  },
  [ErrorCodes.SEALED_NOT_FOUND]: {
    message: 'Sealed event not found',
    suggestion: 'The event may have expired. Please create a new event',
  },
  [ErrorCodes.GAME_NOT_FOUND]: {
    message: 'Game not found',
    suggestion: 'The game may have ended. Please start a new game',
  },
  [ErrorCodes.PLAYER_NOT_FOUND]: {
    message: 'Player not found in this game',
    suggestion: 'Please rejoin the game or create a new session',
  },

  // State
  [ErrorCodes.STATE_INVALID]: {
    message: 'Invalid game state',
    suggestion: 'Please refresh the page and try again',
  },
  [ErrorCodes.DRAFT_ALREADY_STARTED]: {
    message: 'Draft has already started',
    suggestion: 'You cannot join a draft that is already in progress',
  },
  [ErrorCodes.GAME_ALREADY_STARTED]: {
    message: 'Game has already started',
    suggestion: 'You cannot join a game that is already in progress',
  },
  [ErrorCodes.GAME_NOT_STARTED]: {
    message: 'Game has not started yet',
    suggestion: 'Wait for the game to start before performing this action',
  },
  [ErrorCodes.GAME_COMPLETED]: {
    message: 'Game has already completed',
    suggestion: 'Start a new game to continue playing',
  },

  // Business logic
  [ErrorCodes.INSUFFICIENT_PLAYERS]: {
    message: 'Not enough players to start',
    suggestion: 'Add more players or bots before starting',
  },
  [ErrorCodes.DRAFT_FULL]: {
    message: 'Draft is full',
    suggestion: 'Maximum number of players reached. Please create a new draft',
  },
  [ErrorCodes.INVALID_ACTION]: {
    message: 'Invalid action',
    suggestion: 'This action is not allowed at this time',
  },
  [ErrorCodes.CARD_NOT_IN_HAND]: {
    message: 'Card is not in your hand',
    suggestion: 'Please select a card from your hand',
  },
  [ErrorCodes.CARD_NOT_IN_BOOSTER]: {
    message: 'Card is not in the current booster',
    suggestion: 'Please select a card from the available options',
  },
  [ErrorCodes.NO_BOOSTER_AVAILABLE]: {
    message: 'No booster pack available',
    suggestion: 'Please wait for your turn to draft',
  },
  [ErrorCodes.LIBRARY_EMPTY]: {
    message: 'No cards remaining in the library',
    suggestion: 'The game may be over or you cannot draw more cards',
  },
  [ErrorCodes.DECK_SIZE_INVALID]: {
    message: 'Deck does not meet minimum size requirements',
    suggestion: 'Ensure your deck has at least 40 cards',
  },

  // Database
  [ErrorCodes.DATABASE_ERROR]: {
    message: 'Database error occurred',
    suggestion: 'Please try again in a moment. If the problem persists, contact support',
  },
  [ErrorCodes.DATABASE_CONNECTION_ERROR]: {
    message: 'Unable to connect to database',
    suggestion: 'Please check your internet connection and try again',
  },
  [ErrorCodes.DATABASE_QUERY_ERROR]: {
    message: 'Error processing your request',
    suggestion: 'Please try again. If the problem persists, contact support',
  },

  // Cards
  [ErrorCodes.CARDS_FETCH_ERROR]: {
    message: 'Unable to load cards',
    suggestion: 'Please check your connection and try again',
  },
  [ErrorCodes.CARDS_CREATE_ERROR]: {
    message: 'Unable to create card',
    suggestion: 'Please verify all required fields are filled correctly',
  },
  [ErrorCodes.CARDS_UPDATE_ERROR]: {
    message: 'Unable to update card',
    suggestion: 'Please try again or refresh the page',
  },
  [ErrorCodes.CARDS_DELETE_ERROR]: {
    message: 'Unable to delete card',
    suggestion: 'The card may be in use. Please try again later',
  },
  [ErrorCodes.CARDS_INSUFFICIENT]: {
    message: 'Not enough cards available',
    suggestion: 'Please add more cards to the database before starting',
  },

  // Server
  [ErrorCodes.SERVER_ERROR]: {
    message: 'Internal server error',
    suggestion: 'An unexpected error occurred. Please try again later',
  },
  [ErrorCodes.INTERNAL_ERROR]: {
    message: 'An unexpected error occurred',
    suggestion: 'Please refresh the page and try again. Contact support if this continues',
  },
  [ErrorCodes.SERVICE_UNAVAILABLE]: {
    message: 'Service temporarily unavailable',
    suggestion: 'The server is currently under maintenance. Please try again later',
  },
};

/**
 * AppError class for consistent error handling
 */
export class AppError extends Error {
  /**
   * @param {string} code - Error code from ErrorCodes
   * @param {number} status - HTTP status code
   * @param {string} [customMessage] - Optional custom message to override default
   * @param {string} [customSuggestion] - Optional custom suggestion to override default
   * @param {object} [metadata] - Additional error metadata
   */
  constructor(code, status, customMessage = null, customSuggestion = null, metadata = {}) {
    const errorInfo = errorMessages[code] || {
      message: 'An error occurred',
      suggestion: 'Please try again',
    };

    super(customMessage || errorInfo.message);
    this.code = code;
    this.status = status;
    this.suggestion = customSuggestion || errorInfo.suggestion;
    this.metadata = metadata;
    this.isOperational = true; // Operational errors vs programming errors
  }
}

/**
 * Send a standardized error response
 * @param {object} res - Express response object
 * @param {Error} error - Error object (AppError or standard Error)
 */
export function sendErrorResponse(res, error) {
  // If it's an AppError, use its properties
  if (error instanceof AppError) {
    const response = {
      message: error.message,
      suggestion: error.suggestion,
      code: error.code,
      status: error.status,
    };

    // Include metadata in development
    if (process.env.NODE_ENV !== 'production' && Object.keys(error.metadata).length > 0) {
      response.metadata = error.metadata;
    }

    logger.error(`[${error.code}] ${error.message}`, error.metadata);
    return res.status(error.status).json(response);
  }

  // For standard errors, provide a generic response
  logger.error('Unexpected error:', error);
  return res.status(500).json({
    message: 'An unexpected error occurred',
    suggestion: 'Please try again later. If the problem persists, contact support',
    code: ErrorCodes.INTERNAL_ERROR,
    status: 500,
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {function} fn - Async route handler function
 * @returns {function} Wrapped function with error handling
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      sendErrorResponse(res, error);
    });
  };
}

/**
 * Handle MongoDB duplicate key errors
 * @param {Error} error - MongoDB error
 * @returns {AppError} Standardized AppError
 */
export function handleDuplicateKeyError(error, resourceName = 'resource') {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'identifier';
    return new AppError(
      ErrorCodes.VALIDATION_DUPLICATE,
      400,
      `A ${resourceName} with this ${field} already exists`,
      `Please use a different ${field}`
    );
  }
  return error;
}

/**
 * Handle MongoDB validation errors
 * @param {Error} error - MongoDB validation error
 * @returns {AppError} Standardized AppError
 */
export function handleValidationError(error) {
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);
    return new AppError(
      ErrorCodes.VALIDATION_FAILED,
      400,
      messages.join(', '),
      'Please check your input and try again'
    );
  }
  return error;
}

/**
 * Handle MongoDB CastError (invalid ObjectId)
 * @param {Error} error - MongoDB CastError
 * @returns {AppError} Standardized AppError
 */
export function handleCastError(error) {
  if (error.name === 'CastError') {
    return new AppError(
      ErrorCodes.VALIDATION_INVALID_FORMAT,
      400,
      `Invalid ${error.path}: ${error.value}`,
      'Please provide a valid identifier'
    );
  }
  return error;
}

/**
 * Centralized error processing for database operations
 * @param {Error} error - Original error
 * @param {string} resourceName - Name of the resource (for better error messages)
 * @returns {AppError} Standardized AppError
 */
export function processDbError(error, resourceName = 'resource') {
  // Handle specific MongoDB errors
  if (error.code === 11000) {
    return handleDuplicateKeyError(error, resourceName);
  }

  if (error.name === 'ValidationError') {
    return handleValidationError(error);
  }

  if (error.name === 'CastError') {
    return handleCastError(error);
  }

  // If already an AppError, return as-is
  if (error instanceof AppError) {
    return error;
  }

  // Generic database error
  return new AppError(
    ErrorCodes.DATABASE_ERROR,
    500,
    null,
    null,
    { originalError: error.message }
  );
}

/**
 * Create common error helper functions for quick access
 */
export const Errors = {
  // Auth errors
  invalidCredentials: () => new AppError(ErrorCodes.AUTH_INVALID_CREDENTIALS, 401),
  tokenMissing: () => new AppError(ErrorCodes.AUTH_TOKEN_MISSING, 401),
  tokenInvalid: () => new AppError(ErrorCodes.AUTH_TOKEN_INVALID, 401),
  tokenExpired: () => new AppError(ErrorCodes.AUTH_TOKEN_EXPIRED, 401),
  userNotFound: () => new AppError(ErrorCodes.AUTH_USER_NOT_FOUND, 404),
  unauthorized: () => new AppError(ErrorCodes.AUTH_UNAUTHORIZED, 403),

  // Resource errors
  resourceNotFound: (resource = 'Resource') => new AppError(
    ErrorCodes.RESOURCE_NOT_FOUND,
    404,
    `${resource} not found`,
    'Please check the identifier and try again'
  ),
  cardNotFound: () => new AppError(ErrorCodes.CARD_NOT_FOUND, 404),
  draftNotFound: () => new AppError(ErrorCodes.DRAFT_NOT_FOUND, 404),
  sealedNotFound: () => new AppError(ErrorCodes.SEALED_NOT_FOUND, 404),
  gameNotFound: () => new AppError(ErrorCodes.GAME_NOT_FOUND, 404),
  playerNotFound: () => new AppError(ErrorCodes.PLAYER_NOT_FOUND, 404),

  // State errors
  draftAlreadyStarted: () => new AppError(ErrorCodes.DRAFT_ALREADY_STARTED, 400),
  gameAlreadyStarted: () => new AppError(ErrorCodes.GAME_ALREADY_STARTED, 400),
  gameNotStarted: () => new AppError(ErrorCodes.GAME_NOT_STARTED, 400),
  gameCompleted: () => new AppError(ErrorCodes.GAME_COMPLETED, 400),

  // Business logic errors
  insufficientPlayers: (min = 2) => new AppError(
    ErrorCodes.INSUFFICIENT_PLAYERS,
    400,
    `Need at least ${min} player${min === 1 ? '' : 's'} to start`,
    'Add more players or bots before starting'
  ),
  draftFull: (max = 4) => new AppError(
    ErrorCodes.DRAFT_FULL,
    400,
    `Draft is full (${max} players maximum)`,
    'Please create a new draft'
  ),
  invalidAction: (action) => new AppError(
    ErrorCodes.INVALID_ACTION,
    400,
    action ? `Cannot ${action} at this time` : 'Invalid action',
    'This action is not allowed in the current game state'
  ),
  cardNotInHand: () => new AppError(ErrorCodes.CARD_NOT_IN_HAND, 400),
  cardNotInBooster: () => new AppError(ErrorCodes.CARD_NOT_IN_BOOSTER, 400),
  noBoosterAvailable: () => new AppError(ErrorCodes.NO_BOOSTER_AVAILABLE, 400),
  libraryEmpty: () => new AppError(ErrorCodes.LIBRARY_EMPTY, 400),
  deckSizeInvalid: (min = 40) => new AppError(
    ErrorCodes.DECK_SIZE_INVALID,
    400,
    `Deck must have at least ${min} cards`,
    `Please add more cards to reach the minimum of ${min}`
  ),

  // Validation errors
  missingField: (fieldName) => new AppError(
    ErrorCodes.VALIDATION_MISSING_FIELD,
    400,
    `${fieldName} is required`,
    `Please provide a ${fieldName}`
  ),
  invalidFormat: (fieldName) => new AppError(
    ErrorCodes.VALIDATION_INVALID_FORMAT,
    400,
    `Invalid ${fieldName} format`,
    `Please check the ${fieldName} format and try again`
  ),

  // Cards errors
  cardsFetchError: () => new AppError(ErrorCodes.CARDS_FETCH_ERROR, 500),
  cardsCreateError: () => new AppError(ErrorCodes.CARDS_CREATE_ERROR, 500),
  cardsUpdateError: () => new AppError(ErrorCodes.CARDS_UPDATE_ERROR, 500),
  cardsDeleteError: () => new AppError(ErrorCodes.CARDS_DELETE_ERROR, 500),
  cardsInsufficient: () => new AppError(ErrorCodes.CARDS_INSUFFICIENT, 400),

  // Server errors
  serverError: () => new AppError(ErrorCodes.SERVER_ERROR, 500),
  internalError: () => new AppError(ErrorCodes.INTERNAL_ERROR, 500),
  serviceUnavailable: () => new AppError(ErrorCodes.SERVICE_UNAVAILABLE, 503),
};

export default {
  AppError,
  ErrorCodes,
  Errors,
  sendErrorResponse,
  asyncHandler,
  handleDuplicateKeyError,
  handleValidationError,
  handleCastError,
  processDbError,
};
