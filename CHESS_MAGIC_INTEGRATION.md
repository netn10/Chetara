# Chess Magic Integration

This document explains the Chess Magic integration that combines Magic: The Gathering cards with chess gameplay.

## Features Implemented

### 1. MTG Phases Sidebar
- **Location**: Left side of the game interface
- **Phases**: 
  - Untap Phase
  - Upkeep Phase  
  - Draw Phase
  - Main Phase 1
  - Combat Phase
  - **Chess Phase** (NEW) - Special phase for making chess moves with linked pieces
  - Main Phase 2
  - End Step
- **Functionality**: Click "Next Phase" to advance through the turn phases

### 2. Card-Piece Linking System
- **Chess Piece Field**: Cards have a `chessPiece` field that determines which chess piece type they can link to
- **Linking Process**:
  1. Play a creature card with a chess piece type (knight, pawn, bishop, rook, queen, king)
  2. The card appears on the battlefield
  3. Click the card to select it for linking
  4. Click on a matching chess piece to link the card
  5. Linked pieces show a card indicator on the chess board

### 3. Card Types and Linking
- **Chess Knight** (2W): Links to knight pieces
- **Royal Guard** (1B): Links to pawn pieces  
- **Castle Rook** (3W): Links to rook pieces
- **Bishop's Blessing** (1W): Links to bishop pieces
- **Queen's Gambit** (2UB): Links to queen pieces
- **Lightning Bolt** (R): Non-creature spell, cannot link

### 4. Visual Indicators
- **Phase Highlighting**: Current phase is highlighted in gold
- **Card Selection**: Selected cards have a golden border
- **Linkable Pieces**: Chess pieces that can accept the selected card pulse with gold
- **Linked Pieces**: Show a small card icon with the card name
- **Valid Moves**: Chess moves still show as before with green highlights

### 5. Game Layout
- **Three-Column Layout**:
  - Left: MTG Phases sidebar
  - Center: Chess board and game controls
  - Right: MTG cards (battlefield and hand)
- **Responsive**: Adapts to smaller screens by stacking vertically

## Technical Implementation

### Files Modified
- `src/components/ChessBoard.jsx` - Main game component with MTG integration
- `src/components/ChessBoard.css` - Styling for the integrated interface
- `src/utils/chessMagicUtils.js` - Utility functions for card-piece interactions

### Key Functions
- `linkCardToPiece(square, card)` - Links a card to a chess piece
- `canLinkCardToPiece(card, piece)` - Checks if linking is valid
- `nextPhase()` - Advances to the next MTG phase
- `playCard(card)` - Plays a card from hand to battlefield

### Data Structures
- `linkedCards` - Maps chess squares to linked card data
- `battlefield` - Array of cards currently in play
- `playerHand` - Array of cards in player's hand
- `currentPhase` - Current MTG phase identifier

## Usage Instructions

1. **Start the Game**: The chess board loads with standard starting positions
2. **Draw Cards**: Use "Next Phase" to advance to Draw phase and get cards
3. **Play Cards**: During Main Phase 1 or 2, click cards in your hand to play them
4. **Link Creatures**: After playing a creature card, click it then click a matching chess piece
5. **Chess Phase**: During the Chess Phase, make moves with your linked pieces
6. **Strategic Play**: Use card effects to enhance your chess pieces and gain advantages

## Future Enhancements

- **Card Effects**: Implement actual card abilities that affect chess gameplay
- **Mana System**: Add mana costs and mana pool management
- **Turn Structure**: Alternate between players for both MTG and chess turns
- **Win Conditions**: Combine MTG and chess win conditions
- **Deck Building**: Allow players to customize their card decks
- **Multiplayer**: Support for online multiplayer games

## Card Database Integration

The system is designed to work with the existing Card model in `server/models/Card.js` which includes:
- `chessPiece` field for linking compatibility
- Standard MTG card properties (name, mana cost, type, power/toughness, etc.)
- Support for fetching cards from the database for deck building