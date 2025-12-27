import React from 'react';

/**
 * Renders a single mana cost symbol
 * @param {string} manaCost - Mana cost string in format {W}{U}{B}{R}{G}{1}{2} etc.
 * @returns {JSX.Element|null} Rendered mana cost symbols
 */
const renderManaCost = (manaCost) => {
  if (!manaCost) return null;

  const symbols = manaCost.match(/\{[^}]+\}/g) || [];
  return (
    <div className="mana-cost">
      {symbols.map((symbol, index) => {
        const cleaned = symbol.replace(/[{}]/g, '');
        return (
          <span key={index} className={`mana-symbol mana-${cleaned.toLowerCase()}`}>
            {cleaned}
          </span>
        );
      })}
    </div>
  );
};

/**
 * DraftPackDisplay Component
 * Displays the current booster pack with cards available for selection
 *
 * @param {Object} props - Component props
 * @param {Array} props.currentBooster - Array of cards in the current booster
 * @param {boolean} props.isPicking - Whether the player is currently making a pick
 * @param {Function} props.onCardPick - Callback function when a card is picked
 * @returns {JSX.Element} Rendered pack display
 */
function DraftPackDisplay({ currentBooster, isPicking, onCardPick }) {
  const hasCards = currentBooster.length > 0 && !isPicking;

  if (!hasCards) {
    return (
      <div className="waiting-message">
        <p>⏳ Waiting for next pack...</p>
        <p className="waiting-subtext">Bots are making their picks</p>
      </div>
    );
  }

  return (
    <div className="booster-grid">
      {currentBooster.map((card) => (
        <div
          key={card._id}
          className="draft-card"
          onClick={() => onCardPick(card._id)}
          style={{ cursor: 'pointer' }}
        >
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} loading="eager" decoding="async" />
          ) : (
            <div className="card-placeholder">
              <p>{card.name}</p>
              {renderManaCost(card.manaCost)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default DraftPackDisplay;
