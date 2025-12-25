import React, { useState } from 'react';
import ChessBoard from '../components/ChessBoard';
import DraftLobby from '../components/DraftLobby';
import DraftInterface from '../components/DraftInterface';
import './Play.css';

function Play() {
    const [selectedMode, setSelectedMode] = useState(null);
    const [draftType, setDraftType] = useState(null);
    const [showDraftLobby, setShowDraftLobby] = useState(false);
    const [activeDraftId, setActiveDraftId] = useState(null);

    // Handle draft type selection
    const handleDraftSelect = (type) => {
        setDraftType(type);
        setShowDraftLobby(true);
    };

    // Handle draft start from lobby
    const handleDraftStart = (draftId) => {
        setActiveDraftId(draftId);
        setShowDraftLobby(false);
    };

    // Handle exiting draft
    const handleExitDraft = () => {
        setActiveDraftId(null);
        setDraftType(null);
        setShowDraftLobby(false);
        setSelectedMode(null);
    };

    // Handle back from lobby
    const handleBackFromLobby = () => {
        setShowDraftLobby(false);
        setDraftType(null);
        setSelectedMode(null);
    };

    // Render active draft interface
    if (activeDraftId) {
        return (
            <div className="play-page">
                <DraftInterface draftId={activeDraftId} onExit={handleExitDraft} />
            </div>
        );
    }

    // Render draft lobby
    if (showDraftLobby && draftType) {
        return (
            <div className="play-page">
                <DraftLobby
                    draftType={draftType}
                    onBack={handleBackFromLobby}
                    onDraftStart={handleDraftStart}
                />
            </div>
        );
    }

    // Render draft type selection
    if (selectedMode === 'draft') {
        return (
            <div className="play-page">
                <div className="play-header">
                    <button onClick={() => setSelectedMode(null)} className="back-button">
                        ← Back to Mode Selection
                    </button>
                    <h1>Choose Draft Type</h1>
                    <p>Select how you want to draft cards</p>
                </div>

                <div className="mode-selection">
                    <div className="game-modes">
                        <div className="mode-card" onClick={() => handleDraftSelect('set')}>
                            <div className="mode-icon">📦</div>
                            <h3>Set Draft</h3>
                            <p className="mode-description">
                                Draft from Play Boosters with rarity distribution. Each pack contains 10 commons, 3 uncommons, and 1 rare/mythic.
                            </p>
                            <div className="mode-details">
                                <p className="player-count">2-4 Players</p>
                                <p className="pack-info">3 Packs • 15 Cards/Pack</p>
                            </div>
                            <button className="mode-btn">Draft Set</button>
                        </div>

                        <div className="mode-card" onClick={() => handleDraftSelect('cube')}>
                            <div className="mode-icon">🎲</div>
                            <h3>Cube Draft</h3>
                            <p className="mode-description">
                                Draft from the complete 180-card Chess Magic Cube. Singleton format with unique, powerful cards in every pack.
                            </p>
                            <div className="mode-details">
                                <p className="player-count">2-4 Players</p>
                                <p className="pack-info">3 Packs • 15 Cards/Pack</p>
                            </div>
                            <button className="mode-btn">Draft Cube</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render standard chess board
    if (selectedMode === 'standard') {
        return (
            <div className="play-page chess-mode">
                <button onClick={() => setSelectedMode(null)} className="back-button chess-back-button">
                    ← Back to Mode Selection
                </button>
                <ChessBoard />
            </div>
        );
    }

    // Render main mode selection
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

                    <div className="mode-card" onClick={() => setSelectedMode('draft')}>
                        <div className="mode-icon">📦</div>
                        <h3>Draft Mode</h3>
                        <p className="mode-description">
                            Draft cards from booster packs, build your deck, then play. Choose between Set or Cube draft!
                        </p>
                        <div className="mode-details">
                            <p className="player-count">2-4 Players</p>
                        </div>
                        <button className="mode-btn">Start Draft</button>
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