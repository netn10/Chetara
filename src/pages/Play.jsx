import React, { useState } from 'react';
import ChessBoard from '../components/ChessBoard';
import DraftLobby from '../components/DraftLobby';
import DraftInterface from '../components/DraftInterface';
import JudgeTowerLobby from '../components/JudgeTowerLobby';
import JudgeTowerInterface from '../components/JudgeTowerInterface';
import SealedInterface from '../components/SealedInterface';
import './Play.css';

function Play() {
    const [selectedMode, setSelectedMode] = useState(null);
    const [activeDraftId, setActiveDraftId] = useState(null);
    const [activeJudgeTowerId, setActiveJudgeTowerId] = useState(null);

    const renderModeSelection = () => (
        <div className="mode-selection">
            <h2 className="section-title">Choose Your Game Mode</h2>
            <div className="game-modes">
                <div className="mode-card" onClick={() => setSelectedMode('draft')}>
                    <div className="mode-icon">♟️</div>
                    <h3>Draft</h3>
                    <p className="mode-description">
                        4-player draft format. Build your deck from the 180-card cube and combine Magic strategy with Chess tactics.
                    </p>
                    <div className="mode-details">
                        <span className="player-count">👥 4 Players</span>
                    </div>
                    <button className="mode-btn">Select Draft</button>
                </div>

                <div className="mode-card" onClick={() => setSelectedMode('judge-tower')}>
                    <div className="mode-icon">⚖️</div>
                    <h3>Judge Tower</h3>
                    <p className="mode-description">
                        Cooperative challenge mode. Work together to overcome tricky scenarios and test your Chess Magic knowledge.
                    </p>
                    <div className="mode-details">
                        <span className="player-count">👥 Any Players</span>
                    </div>
                    <button className="mode-btn">Select Judge Tower</button>
                </div>

                <div className="mode-card" onClick={() => setSelectedMode('sealed')}>
                    <div className="mode-icon">📦</div>
                    <h3>Sealed</h3>
                    <p className="mode-description">
                        Open 6 booster packs and build a 40-card deck. Classic limited format for any number of players.
                    </p>
                    <div className="mode-details">
                        <span className="player-count">👥 Any Players</span>
                    </div>
                    <button className="mode-btn">Select Sealed</button>
                </div>

                <div className="mode-card" onClick={() => setSelectedMode('match')}>
                    <div className="mode-icon">⚔️</div>
                    <h3>Match</h3>
                    <p className="mode-description">
                        1v1 competitive match. Play a full game of Chess Magic with your opponent across both boards.
                    </p>
                    <div className="mode-details">
                        <span className="player-count">👥 2 Players</span>
                    </div>
                    <button className="mode-btn">Select Match</button>
                </div>
            </div>
            <p className="mode-note">
                Note: These game modes are currently in development. Match mode includes a functional chess board for practice.
            </p>
        </div>
    );

    const renderDraft = () => (
        <div className="game-mode-content">
            <button className="back-button" onClick={() => setSelectedMode(null)}>
                ← Back to Mode Selection
            </button>
            <div className="mode-header">
                <h1>Draft Mode - 4 Players</h1>
                <p>Choose your draft format and build your deck!</p>
            </div>

            <div className="draft-modes">
                <div className="draft-mode-card" onClick={() => setSelectedMode('draft-set')}>
                    <div className="draft-mode-icon">📦</div>
                    <h3>Set Draft</h3>
                    <p className="draft-mode-description">
                        Draft from Play Boosters with classic rarity distribution. Each booster contains 15 cards with a mix of commons, uncommons, rares, and mythics.
                    </p>
                    <div className="booster-breakdown">
                        <h4>Booster Contents:</h4>
                        <ul>
                            <li>10-11 Commons</li>
                            <li>3-4 Uncommons</li>
                            <li>1 Rare or Mythic Rare</li>
                        </ul>
                    </div>
                    <button className="draft-mode-btn">Start Set Draft</button>
                </div>

                <div className="draft-mode-card" onClick={() => setSelectedMode('draft-cube')}>
                    <div className="draft-mode-icon">🎲</div>
                    <h3>Cube Draft</h3>
                    <p className="draft-mode-description">
                        Draft from the complete 180-card Chess Magic Cube. Each card appears only once - singleton format for maximum variety and strategy.
                    </p>
                    <div className="booster-breakdown">
                        <h4>Cube Features:</h4>
                        <ul>
                            <li>180 unique cards total</li>
                            <li>Each card appears once</li>
                            <li>15 cards per booster</li>
                        </ul>
                    </div>
                    <button className="draft-mode-btn">Start Cube Draft</button>
                </div>
            </div>
        </div>
    );

    const renderDraftSet = () => {
        if (activeDraftId) {
            return (
                <DraftInterface
                    draftId={activeDraftId}
                    onExit={() => {
                        setActiveDraftId(null);
                        setSelectedMode('draft');
                    }}
                />
            );
        }

        return (
            <DraftLobby
                draftType="set"
                onBack={() => setSelectedMode('draft')}
                onDraftStart={(draftId) => {
                    setActiveDraftId(draftId);
                }}
            />
        );
    };

    const renderDraftCube = () => {
        if (activeDraftId) {
            return (
                <DraftInterface
                    draftId={activeDraftId}
                    onExit={() => {
                        setActiveDraftId(null);
                        setSelectedMode('draft');
                    }}
                />
            );
        }

        return (
            <DraftLobby
                draftType="cube"
                onBack={() => setSelectedMode('draft')}
                onDraftStart={(draftId) => {
                    setActiveDraftId(draftId);
                }}
            />
        );
    };

    const renderJudgeTower = () => {
        if (activeJudgeTowerId) {
            return (
                <JudgeTowerInterface
                    gameId={activeJudgeTowerId}
                    onExit={() => {
                        setActiveJudgeTowerId(null);
                        setSelectedMode(null);
                    }}
                />
            );
        }

        return (
            <JudgeTowerLobby
                onBack={() => setSelectedMode(null)}
                onGameStart={(gameId) => {
                    setActiveJudgeTowerId(gameId);
                }}
            />
        );
    };

    const renderMatch = () => (
        <div className="game-mode-content">
            <button className="back-button" onClick={() => setSelectedMode(null)}>
                ← Back to Mode Selection
            </button>
            <div className="mode-header">
                <h1>Match Mode - 1v1</h1>
                <p>Practice chess while waiting for your Magic game!</p>
            </div>

            <ChessBoard />

            <div className="play-info">
                <div className="info-section">
                    <h3>How to Play</h3>
                    <ul>
                        <li>Click on a piece to select it and see valid moves</li>
                        <li>Click on a highlighted square to move your piece</li>
                        <li>The game follows standard chess rules</li>
                        <li>Use the Undo button to take back your last move</li>
                        <li>Start a New Game anytime with the reset button</li>
                    </ul>
                </div>

                <div className="info-section">
                    <h3>Chess Magic Integration</h3>
                    <p>
                        In the full Chess Magic experience, this chess board would be integrated with your Magic game.
                        Chess Creature Cards would appear on both the Magic battlefield and the chess board,
                        creating unique strategic interactions between the two games.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderSealed = () => (
        <SealedInterface onBack={() => setSelectedMode(null)} />
    );

    return (
        <div className="play-page">
            {!selectedMode && renderModeSelection()}
            {selectedMode === 'draft' && renderDraft()}
            {selectedMode === 'draft-set' && renderDraftSet()}
            {selectedMode === 'draft-cube' && renderDraftCube()}
            {selectedMode === 'judge-tower' && renderJudgeTower()}
            {selectedMode === 'sealed' && renderSealed()}
            {selectedMode === 'match' && renderMatch()}
        </div>
    );
}

export default Play;