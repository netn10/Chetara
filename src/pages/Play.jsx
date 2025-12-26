import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChessBoard from '../components/ChessBoard';
import DraftLobby from '../components/DraftLobby';
import './Play.css';

function Play() {
    const navigate = useNavigate();

    // Restore state from localStorage on mount
    const [selectedMode, setSelectedMode] = useState(() => {
        return localStorage.getItem('play_selectedMode') || null;
    });
    const [draftType, setDraftType] = useState(() => {
        return localStorage.getItem('play_draftType') || null;
    });
    const [showDraftLobby, setShowDraftLobby] = useState(() => {
        return localStorage.getItem('play_showDraftLobby') === 'true';
    });
    const [showContinuePrompt, setShowContinuePrompt] = useState(false);
    const [continueGame, setContinueGame] = useState(true);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (selectedMode) {
            localStorage.setItem('play_selectedMode', selectedMode);
        } else {
            localStorage.removeItem('play_selectedMode');
        }
    }, [selectedMode]);

    useEffect(() => {
        if (draftType) {
            localStorage.setItem('play_draftType', draftType);
        } else {
            localStorage.removeItem('play_draftType');
        }
    }, [draftType]);

    useEffect(() => {
        localStorage.setItem('play_showDraftLobby', showDraftLobby.toString());
    }, [showDraftLobby]);

    // Handle draft type selection
    const handleDraftSelect = (type) => {
        setDraftType(type);
        setShowDraftLobby(true);
    };

    // Handle draft start from lobby
    const handleDraftStart = (draftId) => {
        // Navigate to draft page with ID in URL
        navigate(`/draft/${draftId}`);
    };

    // Handle back from lobby
    const handleBackFromLobby = () => {
        setShowDraftLobby(false);
        setDraftType(null);
        // Don't reset selectedMode so we can go back to draft type selection
    };

    // Check if there's an existing game
    const hasExistingGame = () => {
        const savedState = localStorage.getItem('chessMagicGameState');
        if (!savedState) return false;

        try {
            const gameState = JSON.parse(savedState);
            return gameState.gameStarted === true;
        } catch (e) {
            return false;
        }
    };

    // Handle standard mode selection
    const handleStandardModeSelect = () => {
        if (hasExistingGame()) {
            setShowContinuePrompt(true);
        } else {
            setSelectedMode('standard');
            setContinueGame(true);
        }
    };

    // Handle continue/new game choice
    const handleContinueChoice = (shouldContinue) => {
        setContinueGame(shouldContinue);
        if (!shouldContinue) {
            // Clear the saved game state
            localStorage.removeItem('chessMagicGameState');
        }
        setSelectedMode('standard');
        setShowContinuePrompt(false);
    };

    // Clear all play state when going back to main menu
    const handleBackToMain = () => {
        setSelectedMode(null);
        setDraftType(null);
        setShowDraftLobby(false);
        setShowContinuePrompt(false);
        localStorage.removeItem('play_selectedMode');
        localStorage.removeItem('play_draftType');
        localStorage.removeItem('play_showDraftLobby');
    };

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
                    <button onClick={handleBackToMain} className="back-button">
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
                <button onClick={handleBackToMain} className="back-button chess-back-button">
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

            {showContinuePrompt && (
                <div className="modal-overlay" onClick={() => setShowContinuePrompt(false)}>
                    <div className="modal-content continue-prompt" onClick={(e) => e.stopPropagation()}>
                        <h2>♔ Game in Progress</h2>
                        <p>You have a game already started. What would you like to do?</p>
                        <div className="continue-buttons">
                            <button
                                className="btn btn-primary continue-btn"
                                onClick={() => handleContinueChoice(true)}
                            >
                                ▶ Continue
                            </button>
                            <button
                                className="btn btn-secondary new-game-btn"
                                onClick={() => handleContinueChoice(false)}
                            >
                                🆕 New Game
                            </button>
                        </div>
                        <button
                            className="modal-close"
                            onClick={() => setShowContinuePrompt(false)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <div className="mode-selection">
                <div className="game-modes">
                    <div className="mode-card" onClick={handleStandardModeSelect}>
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