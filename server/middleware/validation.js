import { body, param, query, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// Card validation rules
export const cardValidationRules = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('manaCost')
    .trim()
    .matches(/^[\d{WUBRGCX}\/]+$/)
    .withMessage('Invalid mana cost format'),
  body('type')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Type is required and must be less than 100 characters'),
  body('text')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Text is required and must be less than 2000 characters'),
  body('rarity')
    .isIn(['Common', 'Uncommon', 'Rare', 'Mythic'])
    .withMessage('Rarity must be Common, Uncommon, Rare, or Mythic'),
  body('chessPiece')
    .optional()
    .isIn(['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'none'])
    .withMessage('Invalid chess piece type'),
  body('colors')
    .optional()
    .isArray()
    .withMessage('Colors must be an array'),
  body('colors.*')
    .optional()
    .isIn(['W', 'U', 'B', 'R', 'G'])
    .withMessage('Invalid color code'),
  body('power')
    .optional()
    .isInt({ min: -100, max: 100 })
    .withMessage('Power must be an integer between -100 and 100'),
  body('toughness')
    .optional()
    .isInt({ min: -100, max: 100 })
    .withMessage('Toughness must be an integer between -100 and 100'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
];

// Login validation rules
export const loginValidationRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
];

// ID validation
export const idValidationRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
];

// Search query validation
export const searchValidationRules = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Search query too long'),
  query('color')
    .optional()
    .isIn(['W', 'U', 'B', 'R', 'G'])
    .withMessage('Invalid color'),
  query('rarity')
    .optional()
    .isIn(['Common', 'Uncommon', 'Rare', 'Mythic'])
    .withMessage('Invalid rarity'),
  query('chessPiece')
    .optional()
    .isIn(['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'none', 'all'])
    .withMessage('Invalid chess piece type'),
];
