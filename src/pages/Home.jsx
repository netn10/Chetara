import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  const [boosterOpening, setBoosterOpening] = useState(false);
  const [revealedCards, setRevealedCards] = useState([]);
  const [boosterCards, setBoosterCards] = useState([]);
  const [backgroundCards, setBackgroundCards] = useState([]);
  const [allCards, setAllCards] = useState([]);

  // Fetch all cards on component mount
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/cards');
        const cards = await response.json();
        setAllCards(cards);
        // Set initial background cards
        if (cards.length > 0) {
          const shuffled = [...cards].sort(() => Math.random() - 0.5);
          setBackgroundCards(shuffled.slice(0, 18));
        }
      } catch (error) {
        console.error('Error fetching cards:', error);
      }
    };
    fetchCards();
  }, []);


  const renderManaSymbols = (colors) => {
    const colorPairs = colors.split('');
    return (
      <span className="archetype-mana-symbols">
        {colorPairs.map((color, index) => (
          <span key={index} className={`mana-symbol-home mana-${color.toLowerCase()}`}>
            {color.toUpperCase()}
          </span>
        ))}
      </span>
    );
  };

  const openBoosterPack = async () => {
    setBoosterOpening(true);
    setRevealedCards([]);

    try {
      const response = await fetch('http://localhost:5000/api/cards');
      const allCards = await response.json();

      // Randomly select 15 cards
      const shuffled = [...allCards].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 15);
      setBoosterCards(selected);

      // Reveal cards one by one with a delay
      selected.forEach((card, index) => {
        setTimeout(() => {
          setRevealedCards(prev => [...prev, card]);
        }, index * 150);
      });
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const closeBooster = () => {
    setBoosterOpening(false);
    setRevealedCards([]);
    setBoosterCards([]);
  };

  return (
    <div className="home">
      <section className="hero">
        {/* Background floating cards */}
        <div className="background-cards">
          {backgroundCards.map((card, index) => (
            <Link
              key={`${card._id}-${index}`}
              to={`/cards/${card._id}`}
              className="floating-card"
            >
              <img
                src={card.imageUrl || '/placeholder-card.png'}
                alt={card.name}
                onError={(e) => {
                  e.target.src = '/placeholder-card.png';
                }}
              />
            </Link>
          ))}
        </div>

        <div className="hero-content">
          <h1 className="hero-title">Chess Magic</h1>
          <p className="hero-subtitle">Where Strategy Meets Sorcery</p>
          <p className="hero-description">
            A revolutionary 180-card custom cube that combines Magic: The Gathering with Chess
          </p>
          <div className="hero-buttons">
            <Link to="/rules" className="btn btn-primary">Learn to Play</Link>
            <Link to="/cards" className="btn btn-secondary">View Cards</Link>
            <Link to="/play" className="btn btn-secondary">Play Chess</Link>
          </div>
        </div>
        <div className="hero-chess-pattern"></div>
      </section>

      {/* Booster Pack Section */}
      <section className="booster-section">
        <div className="container">
          <h2 className="section-title">Open a Booster Pack</h2>
          <p className="section-subtitle">Click the pack to reveal 15 random cards!</p>

          {!boosterOpening ? (
            <div className="booster-pack-wrapper">
              <button className="booster-pack" onClick={openBoosterPack}>
                <div className="pack-shine"></div>
                <div className="pack-content">
                  <div className="pack-logo">♜ ✨</div>
                  <div className="pack-title">CHESS MAGIC</div>
                  <div className="pack-subtitle">Booster Pack</div>
                  <div className="pack-count">15 Cards</div>
                </div>
                <div className="pack-glint"></div>
              </button>
            </div>
          ) : (
            <div className="booster-opened">
              <div className="cards-fan">
                {boosterCards.map((card, index) => (
                  <Link
                    key={card._id}
                    to={`/cards/${card._id}`}
                    className={`fan-card ${revealedCards.includes(card) ? 'revealed' : ''}`}
                    style={{
                      '--card-index': index,
                      '--total-cards': boosterCards.length,
                      '--card-image': `url(${card.imageUrl || '/placeholder-card.png'})`,
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    <img
                      src={card.imageUrl || '/placeholder-card.png'}
                      alt={card.name}
                      onError={(e) => {
                        e.target.src = '/placeholder-card.png';
                      }}
                    />
                  </Link>
                ))}
              </div>
              {revealedCards.length === boosterCards.length && boosterCards.length > 0 && (
                <button className="btn btn-primary reset-pack-btn" onClick={closeBooster}>
                  Open Another Pack
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="about">
        <div className="container">
          <h2 className="section-title">What is Chess Magic?</h2>
          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon">♜</div>
              <h3>Dual Battlefield</h3>
              <p>Battle your opponent on both the Magic battlefield and the chess board simultaneously</p>
            </div>
            <div className="about-card">
              <div className="about-icon">✨</div>
              <h3>180 Card Cube</h3>
              <p>A carefully designed cube for 2-4 players supporting draft and sealed formats</p>
            </div>
            <div className="about-card">
              <div className="about-icon">⚔️</div>
              <h3>Chess Creature Cards</h3>
              <p>Unique cards that exist on both the battlefield and chess board, linking the two games</p>
            </div>
            <div className="about-card">
              <div className="about-icon">👑</div>
              <h3>Checkmate to Win</h3>
              <p>Victory comes through checkmate - even if you lose in Magic, you can still win with chess</p>
            </div>
          </div>

          <div className="story">
            <h3>The Story</h3>
            <p>
              It started with two words: "Magic Chess." How were these two incredible strategy games not
              combined yet? This passion project brings together the best of both worlds - the complex
              deckbuilding and spellcasting of Magic: The Gathering with the timeless strategic depth of chess.
            </p>
            <p>
              After drafting or sealed deck construction, players build standard 40-card decks. But then the
              real innovation begins: a new Chess Phase is added between the cleanup and end phases, where
              players make their chess moves. Some cards break these rules, allowing chess moves during regular
              play, while Chess Creature Cards create thrilling connections between both games.
            </p>
          </div>
        </div>
      </section>

      <section className="archetypes">
        <div className="container">
          <h2 className="section-title">Color Pair Archetypes</h2>
          <p className="section-subtitle">Each two-color combination offers unique strategic paths</p>

          <div className="archetypes-grid">
            <div className="archetype-card" data-colors="wu">
              <div className="archetype-header">
                {renderManaSymbols('wu')}
                <h3>Azorius - Blink</h3>
              </div>
              <p>Flicker your Chess Creatures to reposition pieces and gain value from enters-the-battlefield effects.</p>
            </div>

            <div className="archetype-card" data-colors="ub">
              <div className="archetype-header">
                {renderManaSymbols('ub')}
                <h3>Dimir - Evasion</h3>
              </div>
              <p>Unblockable creatures and evasive threats dominate both the battlefield and the board.</p>
            </div>

            <div className="archetype-card" data-colors="br">
              <div className="archetype-header">
                {renderManaSymbols('br')}
                <h3>Rakdos - Sacrifice</h3>
              </div>
              <p>Sacrifice chess pieces for powerful effects - sometimes losing a piece wins the war.</p>
            </div>

            <div className="archetype-card" data-colors="rg">
              <div className="archetype-header">
                {renderManaSymbols('rg')}
                <h3>Gruul - Knights Matter</h3>
              </div>
              <p>Jump over obstacles! Knights and cards that reward their unique L-shaped movement.</p>
            </div>

            <div className="archetype-card" data-colors="gw">
              <div className="archetype-header">
                {renderManaSymbols('gw')}
                <h3>Selesnya - Enchantments</h3>
              </div>
              <p>Enchant your pieces and creatures for long-term advantage and protection.</p>
            </div>

            <div className="archetype-card" data-colors="wb">
              <div className="archetype-header">
                {renderManaSymbols('wb')}
                <h3>Orzhov - Pawns & Bishops</h3>
              </div>
              <p>Master the humble pawn and the diagonal Bishop to control the board.</p>
            </div>

            <div className="archetype-card" data-colors="bg">
              <div className="archetype-header">
                {renderManaSymbols('bg')}
                <h3>Golgari - Graveyard</h3>
              </div>
              <p>Recursion and graveyard strategies let you bring back lost pieces and creatures.</p>
            </div>

            <div className="archetype-card" data-colors="gu">
              <div className="archetype-header">
                {renderManaSymbols('gu')}
                <h3>Simic - Rooks Ramp</h3>
              </div>
              <p>Ramp into powerful Rooks that dominate files and ranks with overwhelming force.</p>
            </div>

            <div className="archetype-card" data-colors="ur">
              <div className="archetype-header">
                {renderManaSymbols('ur')}
                <h3>Izzet - Instant Speed</h3>
              </div>
              <p>Play during your opponent's turn - control both games with perfect timing.</p>
            </div>

            <div className="archetype-card" data-colors="rw">
              <div className="archetype-header">
                {renderManaSymbols('rw')}
                <h3>Boros - Extra Moves</h3>
              </div>
              <p>Break the rules by moving chess pieces outside the chess phase for aggressive advantage.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact">
        <div className="container">
          <h2 className="section-title">Get Involved</h2>

          <div className="contact-grid">
            <div className="contact-card">
              <h3>🎨 Artists Wanted</h3>
              <p>
                This project currently uses AI-generated art for concepts that don't have readily
                available artwork. If you're an artist interested in contributing, please reach out!
              </p>
            </div>

            <div className="contact-card">
              <h3>🎲 Playtest</h3>
              <p>
                Have feedback from playtesting? Share your experience and help improve the cube!
              </p>
            </div>

            <div className="contact-card">
              <h3>💭 Feedback & Ideas</h3>
              <p>
                Got ideas for flavor, new cards, or mechanics? All suggestions are welcome!
              </p>
            </div>
          </div>

          <div className="creator-note">
            <p>
              <em>
                "Thank you from the bottom of my heart for reading this far. Any comments, ideas,
                and playtesting would be more than welcome. The future goal is to make this fully
                playable online!"
              </em>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
