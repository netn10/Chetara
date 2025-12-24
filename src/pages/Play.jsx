import React, { useState } from 'react';
import ChessBoard from '../components/ChessBoard';
import './Play.css';

function Play() {
    const [selectedMode, setSelectedMode] = useState(null);

    if (selectedMode) {
        return (
            <div className="play-page">
                <div className="game-mode-content">
                    <button onClick={() => setSelectedMode(null)} className="back-button">
                        ← Back to Mode Selection
                    </button>
                    <ChessBoard />
                </div>
            </div>
        );
    }

    return (
        <div className="play-page">
            <div className="play-header">
                <h1>Chess Magic - Play</h1>
                <p>Choose your game mode and start playing!</p>
            </div>

            <div className="mode-selection">
                <div className="game-modes">
                    <div className="mode-card" onClick={() => setSelectedMode('standard')}>
                        <div className="mode-icon">♔</div>
                        <h3>Standard Play</h3>
                        <p className="mode-description">
                            Classic Chess Magic gameplay. Link cards to pieces and battle for supremacy on both the battlefield and the board.
                        </p>
                        <div className="mode-details">
                            <p className="player-count">1v1 or Practice</p>
                        </div>
                        <button className="mode-btn">Play Standard</button>
                    </div>

                    <div className="mode-card">
                        <div className="mode-icon">📦</div>
                        <h3>Draft Mode</h3>
                        <p className="mode-description">
                            Draft cards from booster packs, build your deck, then play. Full drafting experience coming soon!
                        </p>
                        <div className="mode-details">
                            <p className="player-count">2-8 Players</p>
                        </div>
                        <button className="mode-btn" disabled>Coming Soon</button>
                    </div>

                    <div className="mode-card">
                        <div className="mode-icon">🎲</div>
                        <h3>Sealed Deck</h3>
                        <p className="mode-description">
                            Open sealed booster packs and build a deck from what you get. Pure deck-building skill!
                        </p>
                        <div className="mode-details">
                            <p className="player-count">2-4 Players</p>
                        </div>
                        <button className="mode-btn" disabled>Coming Soon</button>
                    </div>

                    <div className="mode-card">
                        <div className="mode-icon">⚖️</div>
                        <h3>Judge's Tower</h3>
                        <p className="mode-description">
                            Chaotic multiplayer where anything can happen. Navigate complex board states and wild interactions!
                        </p>
                        <div className="mode-details">
                            <p className="player-count">3+ Players</p>
                        </div>
                        <button className="mode-btn" disabled>Coming Soon</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Play;