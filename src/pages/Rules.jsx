import React, { useState, useEffect } from 'react';
import './Rules.css';

function Rules() {
  const [exampleCard, setExampleCard] = useState(null);
  const [loadingCard, setLoadingCard] = useState(true);

  useEffect(() => {
    fetchRandomChessCard();
  }, []);

  const fetchRandomChessCard = async () => {
    try {
      setLoadingCard(true);
      const response = await fetch('http://localhost:5000/api/cards/random/chess');
      if (response.ok) {
        const card = await response.json();
        setExampleCard(card);
      }
    } catch (error) {
      console.error('Error fetching random chess card:', error);
    } finally {
      setLoadingCard(false);
    }
  };

  const getPieceEmoji = (piece) => {
    const emojis = {
      pawn: '♟',
      knight: '♞',
      bishop: '♝',
      rook: '♜',
      queen: '♛',
      king: '♚',
      none: ''
    };
    return emojis[piece] || '';
  };

  return (
    <div className="rules-page">
      <section className="rules-hero">
        <div className="container">
          <h1 className="section-title">How to Play Chess Magic</h1>
          <p className="section-subtitle">
            Combine the strategic depth of Magic: The Gathering with the tactical brilliance of Chess
          </p>
        </div>
      </section>

      <section className="rules-content">
        <div className="container">
          <div className="rules-grid">
            <div className="rule-card">
              <div className="rule-number">1</div>
              <h3>Draft or Sealed</h3>
              <p>
                2-4 players draft from the 180-card cube or play sealed. Build a standard 40-card
                Magic deck following normal deckbuilding rules.
              </p>
            </div>

            <div className="rule-card">
              <div className="rule-number">2</div>
              <h3>Set Up Chess Board</h3>
              <p>
                Each player sets up their side of the chess board with standard starting positions.
                Place the board between players alongside the Magic battlefield.
              </p>
            </div>

            <div className="rule-card">
              <div className="rule-number">3</div>
              <h3>The Chess Phase</h3>
              <p>
                A new phase occurs between cleanup and end phase. Make one chess move, then end your
                turn. No spells or abilities can be cast/activated during this phase.
              </p>
            </div>

            <div className="rule-card">
              <div className="rule-number">4</div>
              <h3>Chess Creature Cards</h3>
              <p>
                When a Chess Creature enters, designate a matching chess piece. If either leaves the
                battlefield/board, both do. Deal combat damage to move that piece outside the chess phase!
              </p>
            </div>

            <div className="rule-card">
              <div className="rule-number">5</div>
              <h3>Losing in Magic</h3>
              <p>
                If you lose the Magic game (life total, mill, etc.), your cards are gone but you still
                play chess. You only have the chess phase on your turn.
              </p>
            </div>

            <div className="rule-card">
              <div className="rule-number">6</div>
              <h3>Win by Checkmate</h3>
              <p>
                The only way to win is by checkmate. Both games matter - control the battlefield and
                the board! Strategic mastery of both games is essential.
              </p>
            </div>
          </div>

          <div className="example-section">
            <h2 className="section-title">
              Example: {loadingCard ? 'Loading...' : exampleCard ? `${exampleCard.name}` : 'Chess Card'}
            </h2>
            {loadingCard ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>Loading example card...</p>
              </div>
            ) : exampleCard ? (
              <div className="example-card-detailed">
                <div className="example-left">
                  {exampleCard.imageUrl ? (
                    <img
                      src={exampleCard.imageUrl}
                      alt={exampleCard.name}
                      className="example-card-image"
                    />
                  ) : (
                    <div className="example-card-fallback">
                      <h3>{exampleCard.name}</h3>
                      <p className="card-type-badge">{exampleCard.type}</p>
                    </div>
                  )}
                </div>
                <div className="example-right">
                  <h3>How It Works</h3>
                  <ul>
                    <li>
                      <strong>Link the Games:</strong> When you cast {exampleCard.name}, choose one of your
                      {exampleCard.chessPiece !== 'none' && ` ${exampleCard.chessPiece}s`} on the chess board to link with it.
                    </li>
                    <li>
                      <strong>Double Vulnerability:</strong> If your opponent destroys the creature OR
                      captures the {exampleCard.chessPiece}, you lose both! High risk, high reward.
                    </li>
                    <li>
                      <strong>Extra Chess Moves:</strong> Many chess creature cards let you move your
                      piece outside the Chess Phase - this is extremely powerful for tactical advantage.
                    </li>
                    <li>
                      <strong>Strategic Depth:</strong> Protect your creature with counterspells and
                      removal, while positioning your {exampleCard.chessPiece} safely on the board.
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="error-text">Failed to load example card. Please refresh the page.</p>
            )}
          </div>

          <div className="turn-structure">
            <h2 className="section-title">Turn Structure</h2>
            <div className="phase-diagram">
              <div className="phase">Untap</div>
              <div className="phase">Upkeep</div>
              <div className="phase">Draw</div>
              <div className="phase">Main Phase 1</div>
              <div className="phase">Combat</div>
              <div className="phase">Main Phase 2</div>
              <div className="phase">End Step</div>
              <div className="phase">Cleanup</div>
              <div className="phase chess-phase">Chess Phase ♔</div>
            </div>
            <p className="phase-note">
              The Chess Phase is the final step of your turn. Make your chess move, then pass priority.
            </p>
          </div>

          <div className="strategy-tips">
            <h2 className="section-title">Strategy Tips</h2>
            <div className="tips-grid">
              <div className="tip-card">
                <h4>🎯 Dual Threats</h4>
                <p>
                  Chess Creature Cards are powerful but vulnerable. Use protection spells and tactical
                  positioning to keep them safe in both games.
                </p>
              </div>
              <div className="tip-card">
                <h4>⚡ Tempo Advantage</h4>
                <p>
                  Extra chess moves outside the Chess Phase can swing the game. Cards that grant
                  additional moves are extremely valuable.
                </p>
              </div>
              <div className="tip-card">
                <h4>🛡️ Defensive Balance</h4>
                <p>
                  Don't over-commit to one game. A strong Magic board means nothing if you're getting
                  checkmated, and vice versa.
                </p>
              </div>
              <div className="tip-card">
                <h4>♟️ Piece Sacrifice</h4>
                <p>
                  Some cards reward sacrificing chess pieces. Sometimes the best play is to sacrifice
                  material for a game-winning spell or position.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Rules;
