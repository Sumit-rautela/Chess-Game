//frontend/src/ChessGame.js
import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { io } from "socket.io-client";
import Confetti from "react-confetti"; // 🎉
import { useWindowSize } from "@react-hook/window-size"; // 📏
import "./App.css";

function App({ stockfishInitializer }) {
  const [game, setGame] = useState(new Chess());
  const [mode, setMode] = useState("local");
  const [gameId, setGameId] = useState("");
  const [playerColor, setPlayerColor] = useState('w');
  const [status, setStatus] = useState("In Progress");
  const [isConnecting, setIsConnecting] = useState(false);
  const [showJoinUI, setShowJoinUI] = useState(false);
  const [createdGameId, setCreatedGameId] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false); // 🥳

  const [width, height] = useWindowSize(); // 📐
  const stockfish = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    if (mode === 'online') {
      socket.current = io('http://localhost:5000');

      socket.current.on('connect', () => {
        console.log("Socket connected:", socket.current.id);
      });

      socket.current.on('moveMade', (fen) => updateGameState(fen));
      socket.current.on('gameCreated', handleGameCreated);
      socket.current.on('gameJoined', handleGameJoined);
      socket.current.on('error', handleGameError);

      return () => {
        socket.current?.disconnect();
        socket.current = null;
      };
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'ai' && stockfishInitializer) {
      stockfish.current = stockfishInitializer();
      stockfish.current.onmessage = handleEngineMessage;
      stockfish.current.postMessage('uci');
      stockfish.current.postMessage('setoption name Skill Level value 15');
      stockfish.current.postMessage('isready');

      if (game.turn() === 'b') {
        requestAIMove();
      }

      return () => {
        if (stockfish.current) {
          stockfish.current.terminate();
          stockfish.current = null;
        }
      };
    }
  }, [mode, game.fen()]);
  const [checkmateSquare, setCheckmateSquare] = useState(null);
  const findKingSquare = (gameInstance, color) => {
    const board = gameInstance.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          return String.fromCharCode(97 + c) + (8 - r); // e.g., "e8"
        }
      }
    }
    return null;
  };

  const updateGameState = (fen) => {
    const newGame = new Chess(fen);
    setGame(newGame);

    if (newGame.isGameOver()) {
      if (newGame.isCheckmate()) {
        const winner = newGame.turn() === 'w' ? 'Black' : 'White';
        setStatus(`Checkmate! ${winner} wins`);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);

        const kingSq = findKingSquare(newGame, newGame.turn());
        setCheckmateSquare(kingSq);
      } else if (newGame.isDraw()) {
        setStatus("Draw!");
      } else {
        setStatus("Game Over");
      }
    } else {
      setCheckmateSquare(null);
      setStatus("In Progress");
    }
  };

  const handleGameCreated = ({ gameId, color }) => {
    setCreatedGameId(gameId);
    setGameId(gameId);
    setPlayerColor(color);
    setGame(new Chess());
    setShowJoinUI(false);
  };

  const handleGameJoined = ({ color, fen }) => {
    updateGameState(fen);
    setPlayerColor(color);
    setShowJoinUI(false);
    setCreatedGameId("");
  };

  const handleGameError = (error) => {
    console.error("Game error:", error);
    setStatus(`Error: ${error}`);
  };

  const handleEngineMessage = (e) => {
    const message = e.data || e;
    if (typeof message === 'string' && message.startsWith("bestmove")) {
      const parts = message.split(' ');
      if (parts.length < 2) return;
      const moveStr = parts[1];
      if (moveStr === '(none)' || moveStr === '0000' || moveStr.length < 4) return;
      const move = {
        from: moveStr.substring(0, 2),
        to: moveStr.substring(2, 4),
        promotion: 'q'
      };
      queueMicrotask(() => makeLocalMove(move));
    }
  };

  const makeLocalMove = (move) => {
    const newGame = new Chess(game.fen());
    try {
      const result = newGame.move(move);
      if (result) {
        setGame(newGame);

        if (mode === 'ai' && !newGame.isGameOver() && newGame.turn() === 'b') {
          requestAIMove();
        }

        if (newGame.isGameOver()) {
          if (newGame.isCheckmate()) {
            const winner = newGame.turn() === 'w' ? 'Black' : 'White';
            setStatus(`Checkmate! ${winner} wins`);
            setShowConfetti(true); // 🎊
            setTimeout(() => setShowConfetti(false), 4000);
            const kingSq = findKingSquare(newGame, newGame.turn());
            setCheckmateSquare(kingSq);
          } else if (newGame.isDraw()) {
            setStatus("Draw!");
          } else {
            setStatus("Game Over");
          }
        } else {
          setCheckmateSquare(null);
          setStatus("In Progress");
        }

        return true;
      }
    } catch (err) {
      setStatus("Invalid Move");
    }
    return false;
  };

  const requestAIMove = () => {
    if (stockfish.current && !game.isGameOver() && game.turn() === 'b') {
      stockfish.current.postMessage(`position fen ${game.fen()}`);
      stockfish.current.postMessage('go movetime 1000');
    }
  };

  const handleMove = (move) => {
    const result = makeLocalMove(move);
    if (!result) {
      alert("Illegal move!");
    }

    if (mode === 'online' && result) {
      socket.current.emit('move', {
        gameId,
        move: {
          from: move.from,
          to: move.to,
          promotion: move.promotion || 'q'
        }
      });
    }

    return result;
  };

  const canMakeMove = () => {
    if (mode === 'online') {
      return (game.turn() === 'w' && playerColor === 'w') ||
        (game.turn() === 'b' && playerColor === 'b');
    }
    return true;
  };

  const restartGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setCheckmateSquare(null);
    setStatus("In Progress");
    setShowConfetti(false);
    if (mode === 'ai' && newGame.turn() === 'b') {
      requestAIMove();
    }
  };

  const startNewGame = (newMode) => {
    setMode(newMode);
    setGame(new Chess());
    setCheckmateSquare(null);
    setStatus("In Progress");
    setShowJoinUI(false);
    setCreatedGameId("");
    setGameId("");
    setShowConfetti(false);
  };

  const handleCreateOnlineGame = () => {
    setIsConnecting(true);
    setShowJoinUI(false);
    setMode('online');

    const interval = setInterval(() => {
      if (socket.current?.connected) {
        clearInterval(interval);
        socket.current.emit('createGame');
        setIsConnecting(false);
      }
    }, 50);
  };

  const handleShowJoinUI = () => {
    setShowJoinUI(true);
    setCreatedGameId("");
    setMode('online');
  };

  const startOnlineGame = () => {
    setIsConnecting(true);
    setMode('online');

    const interval = setInterval(() => {
      if (socket.current?.connected) {
        clearInterval(interval);
        if (gameId) {
          socket.current.emit('joinGame', gameId);
        }
        setIsConnecting(false);
      }
    }, 50);
  };
  const [activeSquare, setActiveSquare] = useState(null);
  const [highlightedSquares, setHighlightedSquares] = useState({});
  const highlightMoves = (square) => {
    const moves = game.moves({ square, verbose: true });
    if (moves.length === 0) {
      setHighlightedSquares({});
      return;
    }

    const highlights = {};
    moves.forEach(move => {
      highlights[move.to] = {
        background: 'radial-gradient(rgb(0, 122, 10) 36%, transparent 40%)',
        borderRadius: '50%',
      };
    });

    highlights[square] = {
      background: 'rgb(97, 190, 100)',
    };

    setHighlightedSquares(highlights);
  };
  const onSquareClick = (square) => {
    if (!canMakeMove()) return;
    setActiveSquare(square);
    highlightMoves(square);
  };

  return (
    <div className="chess-app-container">
      <h1 className="title">Chess Game</h1>
      {showConfetti && <Confetti width={width} height={height} />} {/* 🎉 */}

      <div className="chess-layout">
        <div className="chess-controls">
          <button onClick={() => startNewGame('local')} disabled={isConnecting}>Local 2-Player</button>
          <button onClick={() => startNewGame('ai')} disabled={isConnecting}>Play vs AI</button>
          <button onClick={handleCreateOnlineGame} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Create Online Game'}
          </button>
          <button onClick={handleShowJoinUI} disabled={isConnecting}>Join Online Game</button>
          <button onClick={restartGame}>Restart</button>

          {createdGameId && (
            <div className="chess-game-id">
              <span>Game ID: {createdGameId}</span>
              <button onClick={async () => {
                await navigator.clipboard.writeText(createdGameId);
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 1500);
              }}>
                {copySuccess ? "Copied!" : "Copy"}
              </button>
            </div>
          )}

          {showJoinUI && (
            <div className="chess-online-controls">
              <input
                placeholder="Enter Game ID"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
              />
              <button onClick={startOnlineGame} disabled={isConnecting || !gameId}>
                {isConnecting ? 'Connecting...' : 'Join'}
              </button>
            </div>
          )}
        </div>

        <div className="chessboard-container">
          <Chessboard
            position={game.fen()}
            onPieceDrop={(s, t) => {
              setActiveSquare(null);
              setHighlightedSquares({});
              return handleMove({ from: s, to: t });
            }}
            onSquareClick={onSquareClick}
            boardWidth={500}
            arePremovesAllowed={mode === 'online'}
            boardOrientation={playerColor === 'b' ? 'black' : 'white'}
            customSquareStyles={{
  ...highlightedSquares,
  ...(checkmateSquare ? {
    [checkmateSquare]: {
      background: 'linear-gradient(to bottom right, #ff4d4d, #e60000)',
    }
  } : {})
}}

          />
        </div>

        <div className="right-panel chess-status">
          <p><strong>Mode:</strong> {mode.toUpperCase()}</p>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Turn:</strong> {game.turn() === 'w' ? 'White' : 'Black'}</p>
          {isConnecting && <p className="loading-indicator">Connecting to server...</p>}
        </div>
      </div>
    </div>
  );
}

export default App;