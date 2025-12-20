import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import './ChessBoard.css';
import {
  MTG_PHASES,
  canLinkCardToPiece,
  getSampleCards,
  calculateCardBonus,
  getValidLinkSquares
} from '../utils/chessMagicUtils';

function ChessBoard() {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameStatus, setGameStatus] = useState('');
  const [moveHistory, setMoveHistory] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [gameTime, setGameTime] = useState({ white: 600, black: 600 }); // 10 minutes each
  const [activeTimer, setActiveTimer] = useState(null);
  const [lastMoveTime, setLastMoveTime] = useState(Date.now());
  const [materialBalance, setMaterialBalance] = useState(0);
  const [lastMove, setLastMove] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [movablePieces, setMovablePieces] = useState([]);

  // MTG Integration State
  const [currentPhase, setCurrentPhase] = useState('untap');
  const [linkedCards, setLinkedCards] = useState({}); // { square: cardData }
  const [playerHand, setPlayerHand] = useState([]);
  const [battlefield, setBattlefield] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [manaPool, setManaPool] = useState({ white: 0, blue: 0, black: 0, red: 0, green: 0, colorless: 0 });

  // MTG Phases
  const phases = MTG_PHASES;

  useEffect(() => {
    updateGameStatus();
    calculateMaterialBalance();
    updateMovablePieces();

    // Start timer for current player
    if (!game.isGameOver()) {
      setActiveTimer(game.turn());
      setLastMoveTime(Date.now());
    } else {
      setActiveTimer(null);
    }
  }, [game]);

  // Initialize with sample cards
  useEffect(() => {
    setPlayerHand(getSampleCards().slice(0, 3));
  }, []);

  // Timer effect
  useEffect(() => {
    if (!activeTimer || game.isGameOver()) return;

    const interval = setInterval(() => {
      setGameTime(prev => {
        const newTime = { ...prev };
        if (newTime[activeTimer === 'w' ? 'white' : 'black'] > 0) {
          newTime[activeTimer === 'w' ? 'white' : 'black']--;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, game]);

  const updateGameStatus = () => {
    if (game.isCheckmate()) {
      setGameStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
    } else if (game.isDraw()) {
      setGameStatus('Game is a draw!');
    } else if (game.isStalemate()) {
      setGameStatus('Stalemate!');
    } else if (game.isCheck()) {
      setGameStatus(`${game.turn() === 'w' ? 'White' : 'Black'} is in check!`);
    } else {
      setGameStatus(`${game.turn() === 'w' ? 'White' : 'Black'}'s turn`);
    }
  };

  const getPieceSymbol = (piece) => {
    if (!piece) return null;

    const symbols = {
      p: { w: '♙', b: '♟' },
      n: { w: '♘', b: '♞' },
      b: { w: '♗', b: '♝' },
      r: { w: '♖', b: '♜' },
      q: { w: '♕', b: '♛' },
      k: { w: '♔', b: '♚' }
    };

    return symbols[piece.type]?.[piece.color] || null;
  };

  const handleSquareClick = (square) => {
    if (game.isGameOver()) return;

    // If a square is already selected
    if (selectedSquare) {
      // Try to make a move
      const move = {
        from: selectedSquare,
        to: square,
        promotion: 'q' // Always promote to queen for simplicity
      };

      try {
        const result = game.move(move);
        if (result) {
          // Update captured pieces
          if (result.captured) {
            const capturedColor = result.color === 'w' ? 'black' : 'white';
            setCapturedPieces(prev => ({
              ...prev,
              [capturedColor]: [...prev[capturedColor], result.captured]
            }));
          }

          // Update move history
          setMoveHistory(prev => [...prev, result.san]);

          // Play move sound
          playMoveSound(result);

          // Store last move for highlighting
          setLastMove({ from: result.from, to: result.to });

          // Create new game instance to trigger re-render
          setGame(new Chess(game.fen()));
        }
      } catch (error) {
        // Invalid move, just deselect
      }

      setSelectedSquare(null);
      setValidMoves([]);
    } else {
      // Select a square
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setValidMoves(moves.map(m => m.to));
      } else {
        // Deselect if clicking on empty square or opponent piece
        setSelectedSquare(null);
        setValidMoves([]);
      }
    }
  };

  const handleResetGame = () => {
    if (moveHistory.length > 0) {
      setShowResetConfirm(true);
    } else {
      resetGame();
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setSelectedSquare(null);
    setValidMoves([]);
    setMoveHistory([]);
    setCapturedPieces({ white: [], black: [] });
    setGameTime({ white: 600, black: 600 });
    setActiveTimer('w');
    setLastMoveTime(Date.now());
    setMaterialBalance(0);
    setLastMove(null);
    setShowResetConfirm(false);
    setMovablePieces([]);

    // Reset MTG state
    setCurrentPhase('untap');
    setLinkedCards({});
    setBattlefield([]);
    setSelectedCard(null);
    setManaPool({ white: 0, blue: 0, black: 0, red: 0, green: 0, colorless: 0 });

    // Reset hand to initial cards
    setPlayerHand(getSampleCards().slice(0, 3));
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playMoveSound = (move) => {
    // Create audio context for move sounds
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different move types
      if (move.captured) {
        // Capture sound - lower pitch
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      } else if (move.san.includes('+')) {
        // Check sound - higher pitch
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      } else {
        // Regular move sound - medium pitch
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      }

      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silently fail if audio context is not available
      console.log('Audio not available');
    }
  };

  const calculateMaterialBalance = () => {
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    const board = game.board();
    let whiteValue = 0;
    let blackValue = 0;

    board.forEach(row => {
      row.forEach(square => {
        if (square) {
          const value = pieceValues[square.type];
          if (square.color === 'w') {
            whiteValue += value;
          } else {
            blackValue += value;
          }
        }
      });
    });

    setMaterialBalance(whiteValue - blackValue);
  };

  const updateMovablePieces = () => {
    if (game.isGameOver()) {
      setMovablePieces([]);
      return;
    }

    const currentTurn = game.turn();
    const board = game.board();
    const movable = [];

    board.forEach((row, rankIndex) => {
      row.forEach((piece, fileIndex) => {
        if (piece && piece.color === currentTurn) {
          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
          const square = `${files[fileIndex]}${ranks[rankIndex]}`;
          const moves = game.moves({ square });
          if (moves.length > 0) {
            movable.push(square);
          }
        }
      });
    });

    setMovablePieces(movable);
  };

  const undoMove = () => {
    game.undo();
    setGame(new Chess(game.fen()));
    setMoveHistory(prev => prev.slice(0, -1));
    // Recalculate captured pieces
    const newGame = new Chess();
    const history = game.history({ verbose: true });
    const newCaptured = { white: [], black: [] };
    history.forEach(move => {
      if (move.captured) {
        const capturedColor = move.color === 'w' ? 'black' : 'white';
        newCaptured[capturedColor].push(move.captured);
      }
    });
    setCapturedPieces(newCaptured);
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
  };

  // MTG Functions
  const nextPhase = () => {
    const currentIndex = phases.findIndex(p => p.id === currentPhase);
    const nextIndex = (currentIndex + 1) % phases.length;
    setCurrentPhase(phases[nextIndex].id);

    // Handle phase-specific logic
    if (phases[nextIndex].id === 'untap') {
      // New turn - switch active player in chess if needed
    } else if (phases[nextIndex].id === 'draw') {
      // Draw a card (simulate)
      drawCard();
    }
  };

  const drawCard = () => {
    // Simulate drawing a card - in real implementation, this would fetch from server
    const sampleCards = [
      {
        id: 1,
        name: "Lightning Bolt",
        manaCost: "R",
        type: "Instant",
        text: "Lightning Bolt deals 3 damage to any target.",
        chessPiece: "none",
        colors: ["red"]
      },
      {
        id: 2,
        name: "Chess Knight",
        manaCost: "2W",
        type: "Creature",
        subtype: "Knight",
        power: 2,
        toughness: 2,
        text: "When Chess Knight enters the battlefield, you may place it on an empty knight square on the chess board.",
        chessPiece: "knight",
        colors: ["white"]
      },
      {
        id: 3,
        name: "Royal Guard",
        manaCost: "1B",
        type: "Creature",
        subtype: "Human Soldier",
        power: 1,
        toughness: 3,
        text: "Defender. Linked chess piece gains +0/+1.",
        chessPiece: "pawn",
        colors: ["black"]
      }
    ];

    const randomCard = sampleCards[Math.floor(Math.random() * sampleCards.length)];
    setPlayerHand(prev => [...prev, { ...randomCard, id: Date.now() + Math.random() }]);
  };

  const playCard = (card) => {
    if (currentPhase !== 'main1' && currentPhase !== 'main2') {
      alert('You can only play cards during main phases!');
      return;
    }

    // Remove from hand and add to battlefield
    setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    setBattlefield(prev => [...prev, card]);

    // If it's a chess creature, allow linking to board
    if (card.chessPiece !== 'none') {
      setSelectedCard(card);
    }
  };

  const linkCardToPiece = (square, card) => {
    const piece = game.get(square);
    if (!piece) return false;

    if (canLinkCardToPiece(card, piece)) {
      setLinkedCards(prev => ({
        ...prev,
        [square]: card
      }));
      setSelectedCard(null);
      return true;
    }

    return false;
  };

  const handleSquareClickWithCard = (square) => {
    if (selectedCard) {
      // Try to link card to piece
      if (linkCardToPiece(square, selectedCard)) {
        alert(`${selectedCard.name} linked to ${square}!`);
      } else {
        alert('Cannot link this card to this piece!');
      }
      return;
    }

    // Regular chess move logic
    handleSquareClick(square);
  };

  const renderBoard = () => {
    const board = game.board();
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    return (
      <div className="chess-board">
        {ranks.map((rank, rankIndex) => (
          <div key={rank} className="board-row">
            {files.map((file, fileIndex) => {
              const square = `${file}${rank}`;
              const piece = board[rankIndex][fileIndex];
              const isLight = (rankIndex + fileIndex) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isValidMove = validMoves.includes(square);
              const isInCheck = game.isCheck() && piece && piece.type === 'k' && piece.color === game.turn();
              const isLastMoveSquare = lastMove && (lastMove.from === square || lastMove.to === square);
              const isMovablePiece = movablePieces.includes(square);
              const canLinkCard = selectedCard && piece && canLinkCardToPiece(selectedCard, piece);

              return (
                <div
                  key={square}
                  className={`
                    chess-square
                    ${isLight ? 'light' : 'dark'}
                    ${isSelected ? 'selected' : ''}
                    ${isValidMove ? 'valid-move' : ''}
                    ${isInCheck ? 'in-check' : ''}
                    ${isLastMoveSquare ? 'last-move' : ''}
                    ${isMovablePiece ? 'movable-piece' : ''}
                    ${canLinkCard ? 'can-link-card' : ''}
                    ${linkedCards[square] ? 'has-linked-card' : ''}
                  `}
                  onClick={() => handleSquareClickWithCard(square)}
                >
                  <span className="square-label">{square}</span>
                  {piece && (
                    <span className={`piece ${piece.color === 'w' ? 'white' : 'black'}`}>
                      {getPieceSymbol(piece)}
                    </span>
                  )}
                  {linkedCards[square] && (
                    <div className="linked-card-indicator">
                      <span className="card-link-icon">🃏</span>
                      <span className="card-link-name">{linkedCards[square].name}</span>
                    </div>
                  )}
                  {isValidMove && !piece && <div className="move-indicator"></div>}
                  {isValidMove && piece && <div className="capture-indicator"></div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderCapturedPieces = (color) => {
    const pieces = capturedPieces[color];
    const symbols = {
      p: color === 'white' ? '♙' : '♟',
      n: color === 'white' ? '♘' : '♞',
      b: color === 'white' ? '♗' : '♝',
      r: color === 'white' ? '♖' : '♜',
      q: color === 'white' ? '♕' : '♛'
    };

    return (
      <div className={`captured-pieces ${color}`}>
        <h4>Captured {color === 'white' ? 'White' : 'Black'} Pieces:</h4>
        <div className="captured-list">
          {pieces.length === 0 ? (
            <span className="no-captures">None</span>
          ) : (
            pieces.map((piece, idx) => (
              <span key={idx} className="captured-piece">
                {symbols[piece]}
              </span>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`chess-magic-game ${game.turn() === 'w' ? 'white-turn' : 'black-turn'}`}>
      <div className="game-layout">
        {/* MTG Phases Sidebar */}
        <div className="phases-sidebar">
          <h3>Game Phases</h3>
          <div className="phases-list">
            {phases.map((phase, index) => (
              <div
                key={phase.id}
                className={`phase-item ${currentPhase === phase.id ? 'active' : ''}`}
              >
                <div className="phase-name">{phase.name}</div>
                <div className="phase-description">{phase.description}</div>
              </div>
            ))}
          </div>
          <button onClick={nextPhase} className="btn btn-primary phase-btn">
            Next Phase →
          </button>
        </div>

        {/* Main Game Area */}
        <div className="main-game-area">
          <div className="game-info">
            <div className="timer-display">
              <div className={`player-timer ${activeTimer === 'w' ? 'active' : ''}`}>
                <span className="timer-label">White</span>
                <span className={`timer-value ${gameTime.white < 60 ? 'low-time' : ''}`}>
                  {formatTime(gameTime.white)}
                </span>
              </div>
              <div className={`player-timer ${activeTimer === 'b' ? 'active' : ''}`}>
                <span className="timer-label">Black</span>
                <span className={`timer-value ${gameTime.black < 60 ? 'low-time' : ''}`}>
                  {formatTime(gameTime.black)}
                </span>
              </div>
            </div>

            <div className={`status-display ${game.isCheck() ? 'check' : ''} ${game.isGameOver() ? 'game-over' : ''}`}>
              {gameStatus}
            </div>

            <div className="material-balance">
              <span className="balance-label">Material Balance:</span>
              <span className={`balance-value ${materialBalance > 0 ? 'white-advantage' : materialBalance < 0 ? 'black-advantage' : 'equal'}`}>
                {materialBalance > 0 ? `+${materialBalance}` : materialBalance === 0 ? '=' : materialBalance}
              </span>
            </div>
            <div className="game-controls">
              <button onClick={undoMove} className="btn btn-secondary" disabled={moveHistory.length === 0}>
                ↶ Undo
              </button>
              <button onClick={handleResetGame} className="btn btn-primary">
                🔄 New Game
              </button>
            </div>
          </div>

          <div className="game-board-container">
            <div className="board-labels rank-labels">
              {['8', '7', '6', '5', '4', '3', '2', '1'].map(rank => (
                <div key={rank} className="rank-label">{rank}</div>
              ))}
            </div>

            {renderBoard()}

            <div className="board-labels file-labels">
              {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
                <div key={file} className="file-label">{file}</div>
              ))}
            </div>
          </div>

          <div className="game-sidebar">
            <div className="captured-section">
              {renderCapturedPieces('black')}
              {renderCapturedPieces('white')}
            </div>

            <div className="move-history">
              <h3>Move History</h3>
              <div className="moves-list">
                {moveHistory.length === 0 ? (
                  <p className="no-moves">No moves yet</p>
                ) : (
                  moveHistory.map((move, idx) => (
                    <div key={idx} className="move-item">
                      <span className="move-number">{Math.floor(idx / 2) + 1}.</span>
                      <span className={`move-notation ${idx % 2 === 0 ? 'white-move' : 'black-move'}`}>
                        {move}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MTG Cards Area */}
        <div className="cards-area">
          <div className="battlefield-section">
            <h3>Battlefield</h3>
            <div className="battlefield-cards">
              {battlefield.length === 0 ? (
                <p className="no-cards">No creatures on battlefield</p>
              ) : (
                battlefield.map(card => (
                  <div key={card.id} className="battlefield-card">
                    <div className="card-name">{card.name}</div>
                    <div className="card-cost">{card.manaCost}</div>
                    {card.power !== undefined && (
                      <div className="card-stats">{card.power}/{card.toughness}</div>
                    )}
                    <div className="card-text">{card.text}</div>
                    {card.chessPiece !== 'none' && (
                      <div className="chess-link">🏰 {card.chessPiece}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="hand-section">
            <h3>Hand ({playerHand.length})</h3>
            <div className="hand-cards">
              {playerHand.length === 0 ? (
                <p className="no-cards">No cards in hand</p>
              ) : (
                playerHand.map(card => (
                  <div
                    key={card.id}
                    className={`hand-card ${selectedCard?.id === card.id ? 'selected' : ''}`}
                    onClick={() => playCard(card)}
                  >
                    <div className="card-name">{card.name}</div>
                    <div className="card-cost">{card.manaCost}</div>
                    {card.power !== undefined && (
                      <div className="card-stats">{card.power}/{card.toughness}</div>
                    )}
                    <div className="card-text">{card.text}</div>
                    {card.chessPiece !== 'none' && (
                      <div className="chess-link">🏰 {card.chessPiece}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h3>Start New Game?</h3>
            <p>Are you sure you want to start a new game? This will reset the current game and all progress will be lost.</p>
            <div className="modal-buttons">
              <button onClick={cancelReset} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={resetGame} className="btn btn-danger">
                Yes, Start New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChessBoard;
