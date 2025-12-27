import { useNavigate } from 'react-router-dom';
import './CardGrid.css';

/**
 * CardGrid component - Displays paginated grid of cards
 *
 * @param {Object} props
 * @param {Array} props.cards - Array of cards to display
 * @param {number} props.currentPage - Current page number
 * @param {number} props.cardsPerPage - Number of cards per page
 */
export default function CardGrid({ cards, currentPage, cardsPerPage }) {
  const navigate = useNavigate();

  /**
   * Handles card click to navigate to detail page
   * @param {string} cardId - ID of the clicked card
   */
  const handleCardClick = (cardId) => {
    navigate(`/cards/${cardId}`);
  };

  // Calculate current page cards
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = currentPage * cardsPerPage;
  const currentCards = cards.slice(startIndex, endIndex);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="cards-grid">
      {currentCards.map((card) => (
        <div
          key={card._id}
          className={`card-display-minimal rarity-${card.rarity}`}
          onClick={() => handleCardClick(card._id)}
        >
          {card.imageUrl ? (
            <div className="card-image-only">
              <img
                src={card.imageUrl}
                alt={card.name}
                className="gallery-card-image"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : (
            <div className="card-fallback">
              <h3>{card.name}</h3>
              <span className="card-type-badge">{card.type}</span>
              <span className={`rarity-badge rarity-${card.rarity}`}>
                {card.rarity}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
