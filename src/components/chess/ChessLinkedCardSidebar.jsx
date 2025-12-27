/**
 * Linked card viewer sidebar component
 * Displays the currently viewed linked card with details
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Chess linked card sidebar component
 * @param {Object} props - Component props
 */
const ChessLinkedCardSidebar = memo(({ viewedCard, viewedSquare }) => {
  const hasCard = !!viewedCard;

  return (
    <div className="linked-card-sidebar">
      <h3>Linked Card</h3>

      {hasCard ? (
        <div className="viewed-card-container">
          {viewedSquare && (
            <div className="viewed-square-label">
              Square: <span className="square-name">{viewedSquare}</span>
            </div>
          )}

          {viewedCard.imageUrl ? (
            <div className="viewed-card-image-wrapper">
              <img
                src={viewedCard.imageUrl}
                alt={viewedCard.name}
                className="viewed-card-image"
              />
            </div>
          ) : (
            <div className="viewed-card-details">
              <div className="viewed-card-header">
                <span className="viewed-card-name">{viewedCard.name}</span>
                <span className="viewed-card-cost">{viewedCard.manaCost}</span>
              </div>

              <div className="viewed-card-type">{viewedCard.type}</div>

              {viewedCard.power !== undefined && (
                <div className="viewed-card-stats">
                  {viewedCard.power}/{viewedCard.toughness}
                </div>
              )}

              <div className="viewed-card-text">{viewedCard.text}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="no-card-selected">
          <p>Hover over a chess piece with a linked card to view it here.</p>
        </div>
      )}
    </div>
  );
});

ChessLinkedCardSidebar.displayName = 'ChessLinkedCardSidebar';

ChessLinkedCardSidebar.propTypes = {
  viewedCard: PropTypes.object,
  viewedSquare: PropTypes.string
};

ChessLinkedCardSidebar.defaultProps = {
  viewedCard: null,
  viewedSquare: null
};

export default ChessLinkedCardSidebar;
