import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import './ChessBoard.css';
import CardSearch from './CardSearch';
import {
  MTG_PHASES,
  canLinkCardToPiece,
  getSampleCards,
  calculateCardBonus,
  getValidLinkSquares
} from '../utils/chessMagicUtils';

function ChessBoard() {
  const [gameStarted, setGameStarted] = useState(false);
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
  const [showLinkConfirm, setShowLinkConfirm] = useState(false);
  const [showFreeMoveKingConfirm, setShowFreeMoveKingConfirm] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [winner, setWinner] = useState(null); // 'White' or 'Black'
  const [winMethod, setWinMethod] = useState(null); // 'checkmate' or 'king_capture'
  const [pendingLink, setPendingLink] = useState(null); // {square, card, piece}
  const [pendingFreeMove, setPendingFreeMove] = useState(null); // {from, to, piece, targetPiece}
  const [movablePieces, setMovablePieces] = useState([]);
  const [freeMoveMode, setFreeMoveMode] = useState(false);

  // MTG Integration State
  const [linkedCards, setLinkedCards] = useState({}); // { square: cardData }
  const [linkedCardsHistory, setLinkedCardsHistory] = useState([]); // Track linked cards state for undo
  const [fenHistory, setFenHistory] = useState([]); // Track board positions for undo
  const [capturedPiecesHistory, setCapturedPiecesHistory] = useState([]); // Track captured pieces for undo
  const [selectedCard, setSelectedCard] = useState(null);
  const [viewedLinkedCard, setViewedLinkedCard] = useState(null); // Card being viewed in sidebar
  const [viewedSquare, setViewedSquare] = useState(null); // Square of the viewed card

  // Load saved game state on component mount
  useEffect(() => {
    loadGameState();
  }, []);

  // Save game state whenever it changes
  useEffect(() => {
    if (gameStarted) {
      saveGameState();
    }
  }, [game, moveHistory, capturedPieces, gameTime, linkedCards, linkedCardsHistory, fenHistory, capturedPiecesHistory, gameStarted]);

  useEffect(() => {
    if (gameStarted) {
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
    }
  }, [game, gameStarted]);

  // Timer effect
  useEffect(() => {
    if (!activeTimer || game.isGameOver() || !gameStarted) return;

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
  }, [activeTimer, game, gameStarted]);

  // Save game state to localStorage
  const saveGameState = () => {
    try {
      const gameState = {
        fen: game.fen(),
        moveHistory,
        capturedPieces,
        gameTime,
        linkedCards,
        linkedCardsHistory,
        fenHistory,
        capturedPiecesHistory,
        gameStarted,
        lastMove
      };
      localStorage.setItem('chessMagicGameState', JSON.stringify(gameState));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  };

  // Load game state from localStorage
  const loadGameState = () => {
    try {
      const savedState = localStorage.getItem('chessMagicGameState');
      if (savedState) {
        const gameState = JSON.parse(savedState);

        // Restore game state
        const loadedGame = new Chess(gameState.fen);
        setGame(loadedGame);
        setMoveHistory(gameState.moveHistory || []);
        setCapturedPieces(gameState.capturedPieces || { white: [], black: [] });
        setGameTime(gameState.gameTime || { white: 600, black: 600 });
        setLinkedCards(gameState.linkedCards || {});
        setLinkedCardsHistory(gameState.linkedCardsHistory || []);
        setFenHistory(gameState.fenHistory || []);
        setCapturedPiecesHistory(gameState.capturedPiecesHistory || []);
        setGameStarted(gameState.gameStarted || false);
        setLastMove(gameState.lastMove || null);
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  };

  // Start a new game
  const startNewGame = () => {
    setGameStarted(true);
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
    setMovablePieces([]);
    setLinkedCards({});
    setLinkedCardsHistory([]);
    setFenHistory([]);
    setCapturedPiecesHistory([]);
    setSelectedCard(null);
    setViewedLinkedCard(null);
    setViewedSquare(null);
    setWinner(null);
    setWinMethod(null);
  };

  const updateGameStatus = () => {
    if (game.isCheckmate()) {
      const winningColor = game.turn() === 'w' ? 'Black' : 'White';
      setGameStatus(`Checkmate! ${winningColor} wins!`);
      setWinner(winningColor);
      setWinMethod('checkmate');
      setShowVictoryModal(true);
      setActiveTimer(null); // Stop the timer
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
    if (!gameStarted || game.isGameOver()) return;

    // If free move mode is active, use special logic
    if (freeMoveMode) {
      handleFreeMoveClick(square);
      return;
    }

    // If a square is already selected
    if (selectedSquare) {
      // Try to make a move
      const move = {
        from: selectedSquare,
        to: square,
        promotion: 'q' // Always promote to queen for simplicity
      };

      // Save current state to history before attempting move
      const currentFen = game.fen();
      const currentCaptured = { ...capturedPieces };
      const currentLinkedCards = { ...linkedCards };

      try {
        const result = game.move(move);
        if (result) {
          // Save state to history
          setLinkedCardsHistory(prev => [...prev, currentLinkedCards]);
          setFenHistory(prev => [...prev, currentFen]);
          setCapturedPiecesHistory(prev => [...prev, currentCaptured]);

          // Move linked card if piece has one
          if (linkedCards[result.from]) {
            setLinkedCards(prev => {
              const newLinkedCards = { ...prev };
              newLinkedCards[result.to] = newLinkedCards[result.from];
              delete newLinkedCards[result.from];
              return newLinkedCards;
            });
          }

          // Update captured pieces
          if (result.captured) {
            const capturedColor = result.color === 'w' ? 'black' : 'white';
            setCapturedPieces(prev => ({
              ...prev,
              [capturedColor]: [...prev[capturedColor], result.captured]
            }));

            // Remove linked card from captured square if any
            if (linkedCards[result.to]) {
              setLinkedCards(prev => {
                const newLinkedCards = { ...prev };
                delete newLinkedCards[result.to];
                return newLinkedCards;
              });
            }
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

  const handleFreeMoveClick = (square) => {
    if (selectedSquare) {
      // Make a free move - can move any piece anywhere
      const piece = game.get(selectedSquare);
      const targetPiece = game.get(square);

      if (piece) {
        // Check if capturing a king - require confirmation
        if (targetPiece && targetPiece.type === 'k') {
          setPendingFreeMove({
            from: selectedSquare,
            to: square,
            piece: piece,
            targetPiece: targetPiece
          });
          setShowFreeMoveKingConfirm(true);
          return;
        }

        // Execute the free move
        executeFreeMoveInternal(selectedSquare, square, piece, targetPiece);
      }

      setSelectedSquare(null);
      setValidMoves([]);
    } else {
      // Select any piece (regardless of color)
      const piece = game.get(square);
      if (piece) {
        setSelectedSquare(square);
        // In free move mode, can move to any square
        const board = game.board();
        const allSquares = [];
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        files.forEach(file => {
          ranks.forEach(rank => {
            allSquares.push(`${file}${rank}`);
          });
        });
        setValidMoves(allSquares);
      }
    }
  };

  const executeFreeMoveInternal = (fromSquare, toSquare, piece, targetPiece) => {
    // Save current state to history before modifying
    const currentFen = game.fen();
    const currentCaptured = { ...capturedPieces };
    const currentLinkedCards = { ...linkedCards };

    setLinkedCardsHistory(prev => [...prev, currentLinkedCards]);
    setFenHistory(prev => [...prev, currentFen]);
    setCapturedPiecesHistory(prev => [...prev, currentCaptured]);

    // Check if capturing a king to end the game
    const isKingCapture = targetPiece && targetPiece.type === 'k';
    // Winner is the opposite color of the king that was captured
    const winningColor = isKingCapture ? (targetPiece.color === 'w' ? 'Black' : 'White') : null;

    // Move linked card if piece has one
    if (linkedCards[fromSquare]) {
      setLinkedCards(prev => {
        const newLinkedCards = { ...prev };
        newLinkedCards[toSquare] = newLinkedCards[fromSquare];
        delete newLinkedCards[fromSquare];
        return newLinkedCards;
      });
    }

    // Remove linked card from captured square if any
    if (targetPiece && linkedCards[toSquare]) {
      setLinkedCards(prev => {
        const newLinkedCards = { ...prev };
        delete newLinkedCards[toSquare];
        return newLinkedCards;
      });
    }

    // Manually update the board
    const newGame = new Chess(game.fen());

    // Remove piece from origin
    newGame.remove(fromSquare);

    // Place piece at destination
    newGame.put(piece, toSquare);

    // Update state
    setGame(newGame);

    // Add to captured if capturing
    if (targetPiece) {
      const capturedColor = targetPiece.color === 'w' ? 'white' : 'black';
      setCapturedPieces(prev => ({
        ...prev,
        [capturedColor]: [...prev[capturedColor], targetPiece.type]
      }));
    }

    // Store last move for highlighting
    setLastMove({ from: fromSquare, to: toSquare });

    // Add to history
    setMoveHistory(prev => [...prev, `FREE: ${fromSquare}-${toSquare}`]);

    // If king was captured, end the game
    if (isKingCapture) {
      setGameStatus(`Game Over! ${winningColor} wins by capturing the king!`);
      setActiveTimer(null); // Stop the timer
      setWinner(winningColor); // Set the winner
      setWinMethod('king_capture'); // Set win method
      setShowVictoryModal(true); // Show victory modal
    }

    // Deactivate free move mode after use
    setFreeMoveMode(false);
  };

  const handleResetGame = () => {
    if (gameStarted && moveHistory.length > 0) {
      setShowResetConfirm(true);
    } else {
      resetGame();
    }
  };

  const resetGame = () => {
    setShowResetConfirm(false);
    startNewGame();
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
    if (moveHistory.length === 0) return;

    // Restore previous FEN position
    if (fenHistory.length > 0) {
      const previousFen = fenHistory[fenHistory.length - 1];
      const restoredGame = new Chess(previousFen);
      setGame(restoredGame);
      setFenHistory(prev => prev.slice(0, -1));
    }

    // Restore previous linked cards state
    if (linkedCardsHistory.length > 0) {
      const previousLinkedCards = linkedCardsHistory[linkedCardsHistory.length - 1];
      setLinkedCards(previousLinkedCards);
      setLinkedCardsHistory(prev => prev.slice(0, -1));
    }

    // Restore previous captured pieces
    if (capturedPiecesHistory.length > 0) {
      const previousCaptured = capturedPiecesHistory[capturedPiecesHistory.length - 1];
      setCapturedPieces(previousCaptured);
      setCapturedPiecesHistory(prev => prev.slice(0, -1));
    }

    // Remove the last move from history
    setMoveHistory(prev => prev.slice(0, -1));

    // Reset last move highlighting
    if (moveHistory.length > 1) {
      // If there are still moves left, we need to figure out what the last move was
      // For now, just clear it - it's complex to reconstruct
      setLastMove(null);
    } else {
      setLastMove(null);
    }

    // Clear selection
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const handleCardSearchSelect = (card) => {
    // If it's a chess creature card, select it for linking
    if (card.chessPiece && card.chessPiece !== 'none') {
      setSelectedCard(card);
    }
  };

  // Handle mouse enter on chess square
  const handleSquareMouseEnter = (square) => {
    if (linkedCards[square]) {
      // Show the linked card
      setViewedLinkedCard(linkedCards[square]);
      setViewedSquare(square);
    }
    // Note: Don't clear the card when hovering over non-linked squares
    // The card should persist until another linked piece is hovered
  };

  // Handle click on chess square with linked card
  const handleLinkedCardClick = (square) => {
    if (linkedCards[square]) {
      setViewedLinkedCard(linkedCards[square]);
      setViewedSquare(square);
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

  const handleSquareClickWithCard = (square, e) => {
    // Stop propagation to prevent page-wide click handler
    if (e) e.stopPropagation();

    // First check if this square has a linked card - show it
    handleLinkedCardClick(square);

    if (selectedCard) {
      // Try to link card to piece
      const piece = game.get(square);
      if (piece && canLinkCardToPiece(selectedCard, piece)) {
        // Show confirmation dialog
        const pieceName = piece.type === 'n' ? 'knight' : piece.type === 'b' ? 'bishop' : piece.type === 'r' ? 'rook' : piece.type === 'q' ? 'queen' : piece.type === 'k' ? 'king' : 'pawn';
        setPendingLink({ square, card: selectedCard, piece, pieceName });
        setShowLinkConfirm(true);
      } else {
        // Cannot link to this square or piece - deselect card
        setSelectedCard(null);
      }
      return;
    }

    // Regular chess move logic
    handleSquareClick(square);
  };

  const confirmLink = () => {
    if (pendingLink) {
      linkCardToPiece(pendingLink.square, pendingLink.card);
      setSelectedCard(null);
      // Show the newly linked card
      setViewedLinkedCard(pendingLink.card);
      setViewedSquare(pendingLink.square);
    }
    setShowLinkConfirm(false);
    setPendingLink(null);
  };

  const cancelLink = () => {
    setShowLinkConfirm(false);
    setPendingLink(null);
  };

  const confirmFreeMoveKingCapture = () => {
    if (pendingFreeMove) {
      executeFreeMoveInternal(
        pendingFreeMove.from,
        pendingFreeMove.to,
        pendingFreeMove.piece,
        pendingFreeMove.targetPiece
      );
      setSelectedSquare(null);
      setValidMoves([]);
    }
    setShowFreeMoveKingConfirm(false);
    setPendingFreeMove(null);
  };

  const cancelFreeMoveKingCapture = () => {
    setShowFreeMoveKingConfirm(false);
    setPendingFreeMove(null);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const closeVictoryModal = () => {
    setShowVictoryModal(false);
  };

  const startNewGameFromVictory = () => {
    // Close victory modal
    setShowVictoryModal(false);
    setWinner(null);
    setWinMethod(null);

    // Reset all game state
    setGame(new Chess());
    setSelectedSquare(null);
    setValidMoves([]);
    setMoveHistory([]);
    setCapturedPieces({ white: [], black: [] });
    setGameTime({ white: 600, black: 600 });
    setActiveTimer(null);
    setLastMoveTime(Date.now());
    setMaterialBalance(0);
    setLastMove(null);
    setMovablePieces([]);
    setLinkedCards({});
    setLinkedCardsHistory([]);
    setFenHistory([]);
    setCapturedPiecesHistory([]);
    setSelectedCard(null);
    setViewedLinkedCard(null);
    setViewedSquare(null);

    // Return to start screen
    setGameStarted(false);
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
                  onClick={(e) => handleSquareClickWithCard(square, e)}
                  onMouseEnter={() => handleSquareMouseEnter(square)}
                >
                  <span className="square-label">{square}</span>
                  {piece && (
                    <span className={`piece ${piece.color === 'w' ? 'white' : 'black'}`}>
                      {getPieceSymbol(piece)}
                    </span>
                  )}
                  {linkedCards[square] && (
                    <div className="linked-card-indicator">
                      <span className="card-link-icon">⚡</span>
                      <span className="card-link-badge">LINKED</span>
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

  // Render start game screen
  if (!gameStarted) {
    return (
      <div className="chess-magic-game white-turn">
        <div className="game-start-screen">
          <div className="start-screen-content">
            <h1>Chess Magic</h1>
            <p className="start-description">
              Combine the strategy of Chess with the power of Magic: The Gathering cards.
              Link cards to chess pieces and dominate the board!
            </p>
            <button onClick={startNewGame} className="btn btn-primary start-game-btn">
              Start New Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePageClick = () => {
    // Deselect card when clicking on the page background
    if (selectedCard) {
      setSelectedCard(null);
    }
  };

  return (
    <div
      className={`chess-magic-game ${winner ? (winner === 'White' ? 'white-turn' : 'black-turn') : (game.turn() === 'w' ? 'white-turn' : 'black-turn')}`}
      onClick={handlePageClick}
    >
      <div className="game-layout">
        {/* Linked Card Display Sidebar */}
        <div className="linked-card-sidebar">
          <h3>Linked Card</h3>
          {viewedLinkedCard ? (
            <div className="viewed-card-container">
              {viewedSquare && (
                <div className="viewed-square-label">
                  Square: <span className="square-name">{viewedSquare}</span>
                </div>
              )}
              {viewedLinkedCard.imageUrl ? (
                <div className="viewed-card-image-wrapper">
                  <img
                    src={viewedLinkedCard.imageUrl}
                    alt={viewedLinkedCard.name}
                    className="viewed-card-image"
                  />
                </div>
              ) : (
                <div className="viewed-card-details">
                  <div className="viewed-card-header">
                    <span className="viewed-card-name">{viewedLinkedCard.name}</span>
                    <span className="viewed-card-cost">{viewedLinkedCard.manaCost}</span>
                  </div>
                  <div className="viewed-card-type">{viewedLinkedCard.type}</div>
                  {viewedLinkedCard.power !== undefined && (
                    <div className="viewed-card-stats">
                      {viewedLinkedCard.power}/{viewedLinkedCard.toughness}
                    </div>
                  )}
                  <div className="viewed-card-text">{viewedLinkedCard.text}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-card-selected">
              <p>Hover over a chess piece with a linked card to view it here.</p>
            </div>
          )}
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
              <button
                onClick={() => setFreeMoveMode(!freeMoveMode)}
                className={`btn ${freeMoveMode ? 'btn-warning' : 'btn-info'}`}
              >
                {freeMoveMode ? '✓ Free Move Active' : '🎯 Free Movement'}
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

        {/* Card Search Area */}
        <div className="cards-area">
          <CardSearch
            onCardSelect={handleCardSearchSelect}
            selectedCard={selectedCard}
          />
          {selectedCard && (
            <div className="selected-card-info">
              <h4>Selected Card:</h4>
              <div className="selected-card-display">
                <div className="card-name">{selectedCard.name}</div>
                <div className="card-type">{selectedCard.type} - {selectedCard.chessPiece}</div>
                <p className="card-instruction">
                  Click on a {selectedCard.chessPiece} piece on the board to link this card.
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedCard(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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

      {showLinkConfirm && pendingLink && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h3>Link Card to Chess Piece?</h3>
            <p>
              Are you sure you want to link <strong>{pendingLink.card.name}</strong> to the{' '}
              <strong>{pendingLink.pieceName}</strong> at <strong>{pendingLink.square}</strong>?
            </p>
            <div className="modal-buttons">
              <button onClick={cancelLink} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={confirmLink} className="btn btn-primary">
                Yes, Link Card
              </button>
            </div>
          </div>
        </div>
      )}

      {showFreeMoveKingConfirm && pendingFreeMove && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h3>Capture King with Free Movement?</h3>
            <p>
              Are you sure you want to capture the <strong>{pendingFreeMove.targetPiece.color === 'w' ? 'White' : 'Black'} King</strong> at{' '}
              <strong>{pendingFreeMove.to}</strong>?
            </p>
            <p style={{ fontSize: '0.9em', marginTop: '10px', fontStyle: 'italic' }}>
              This will remove the king from the board (not a legal chess move).
            </p>
            <div className="modal-buttons">
              <button onClick={cancelFreeMoveKingCapture} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={confirmFreeMoveKingCapture} className="btn btn-danger">
                Yes, Capture King
              </button>
            </div>
          </div>
        </div>
      )}

      {showVictoryModal && winner && (
        <div className="modal-overlay">
          <div className={`confirmation-modal victory-modal ${winner === 'White' ? 'light-mode' : 'dark-mode'}`}>
            <h2 className="victory-title">
              🎉 Victory! 🎉
            </h2>
            <h3 className="victory-winner">
              {winner} Wins!
            </h3>
            <p className="victory-message">
              {winMethod === 'checkmate'
                ? 'Checkmate!'
                : `The ${winner === 'White' ? 'Black' : 'White'} King has been captured!`}
            </p>
            <div className="modal-buttons">
              <button onClick={closeVictoryModal} className="btn btn-secondary">
                Close
              </button>
              <button onClick={startNewGameFromVictory} className="btn btn-primary">
                New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChessBoard;
