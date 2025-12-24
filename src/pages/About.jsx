import React from 'react';
import './About.css';

function About() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1 className="section-title">About Chess Magic</h1>
          <p className="section-subtitle">
            Where the timeless strategy of Chess meets the arcane power of Magic: The Gathering
          </p>
        </div>
      </section>

      <section className="about-content">
        <div className="container">
          <div className="about-intro">
            <h2>What is Chess Magic?</h2>
            <p>
              Chess Magic is a revolutionary custom cube format that seamlessly blends two of the greatest
              strategy games ever created: Chess and Magic: The Gathering. With 180 carefully crafted cards,
              Chess Magic introduces a new dimension of strategic depth where every decision matters across
              two interconnected battlefields.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">♟️</div>
              <h3>Dual Gameplay</h3>
              <p>
                Master both the chess board and the Magic battlefield. Success requires balancing tactical
                chess moves with powerful spell casting and creature combat.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Chess Creature Cards</h3>
              <p>
                Link Magic creatures to chess pieces, creating powerful synergies. When either the creature
                or piece is removed, both are lost - high risk, high reward gameplay.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Strategic Depth</h3>
              <p>
                Every card is designed to interact meaningfully with both games. Plan your moves across
                multiple turns and anticipate your opponent's strategy on both fronts.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Victory Through Checkmate</h3>
              <p>
                The only way to win is by checkmate. You can lose the Magic game but still claim victory
                through superior chess play - or vice versa!
              </p>
            </div>
          </div>

          <div className="philosophy-section">
            <h2>Our Philosophy</h2>
            <div className="philosophy-content">
              <div className="philosophy-item">
                <h3>Strategic Excellence</h3>
                <p>
                  Chess Magic rewards players who think deeply about both games. Every card is balanced
                  to ensure that skill in both Chess and Magic matters equally.
                </p>
              </div>
              <div className="philosophy-item">
                <h3>Innovative Design</h3>
                <p>
                  We've created entirely new mechanics and card types that couldn't exist in either game
                  alone. Chess Magic is truly greater than the sum of its parts.
                </p>
              </div>
              <div className="philosophy-item">
                <h3>Accessible Complexity</h3>
                <p>
                  While the game offers incredible depth, the core rules are straightforward. If you know
                  Chess and Magic, you can start playing Chess Magic immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="journey-section">
            <h2>The Journey</h2>
            <p>
              Chess Magic began as an experiment: what if we could combine the perfect information gameplay
              of Chess with the hidden information and deck construction of Magic? After countless iterations,
              playtests, and refinements, we've created a format that honors both games while introducing
              entirely new strategic dimensions.
            </p>
            <p>
              Our 180-card cube is carefully curated to provide balanced gameplay across all color combinations
              and archetypes. Whether you prefer aggressive chess tactics supported by burn spells, or
              defensive positioning backed by control magic, there's a strategy for every player.
            </p>
          </div>

          <div className="community-section">
            <h2>Join the Community</h2>
            <p>
              Chess Magic is more than just a game - it's a growing community of players who love deep
              strategic gameplay. Whether you're a Chess grandmaster, a Magic pro, or new to both games,
              there's a place for you at the table.
            </p>
            <div className="community-features">
              <div className="community-item">
                <h4>🎮 Regular Tournaments</h4>
                <p>Compete against players from around the world</p>
              </div>
              <div className="community-item">
                <h4>📚 Strategy Guides</h4>
                <p>Learn from experienced players and improve your game</p>
              </div>
              <div className="community-item">
                <h4>💬 Active Discussion</h4>
                <p>Share strategies, decklists, and memorable games</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
