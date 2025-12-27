import React from 'react';

/**
 * DraftPickedCards Component
 * Displays the cards that have been picked by the player so far
 *
 * @param {Object} props - Component props
 * @param {Array} props.pickedCards - Array of cards picked by the player
 * @returns {JSX.Element} Rendered picked cards section
 */
function DraftPickedCards({ pickedCards }) {
  const hasPickedCards = pickedCards.length > 0;

  return (
    <div className="picked-section">
      <h3>Your Picks ({pickedCards.length})</h3>
      <div className="picked-cards">
        {hasPickedCards ? (
          pickedCards.map((card, index) => (
            <div key={index} className="picked-card-mini">
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.name} loading="lazy" decoding="async" />
              ) : (
                <div className="mini-placeholder">{card.name}</div>
              )}
            </div>
          ))
        ) : (
          <p className="no-picks">No cards picked yet</p>
        )}
      </div>
    </div>
  );
}

export default DraftPickedCards;
