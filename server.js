const express = require('express');
const http = require('http');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const socketIo = require('socket.io');
const cors = require('cors');
const { Chess } = require('chess.js');
const Engine = require('./Engine'); 

const app = express();
app.use(express.json());
app.use(cors());

const USERS_FILE = './users.json';

// User management functions
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Authentication endpoints
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });
  saveUsers(users);
  res.status(201).json({ message: 'User registered' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.json({ token: 'dummy-token', username });
});

// Create HTTP server and Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const gameRooms = {};

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('New connection');

  socket.on('createGame', (isAI = false) => {
    const gameId = `game_${Math.random().toString(36).substring(2, 9)}`;
    const game = new Chess();

    gameRooms[gameId] = {
      gameInstance: game,
      players: { w: socket.id },
      spectators: [],
      isAI,
      currentTurn: 'w'
    };

    socket.join(gameId);
    socket.emit('gameCreated', { gameId, color: 'w' });
  });

  socket.on('joinGame', (gameId) => {
    const room = gameRooms[gameId];
    if (room) {
      if (!room.players.b) {
        room.players.b = socket.id;
        socket.join(gameId);
        socket.emit('gameJoined', { color: 'b', fen: room.gameInstance.fen() });
        io.to(gameId).emit('playerJoined', room.gameInstance.fen());
      } else {
        room.spectators.push(socket.id);
        socket.join(gameId);
        socket.emit('spectatorJoined', room.gameInstance.fen());
      }
    } else {
      socket.emit('error', 'Game not found');
    }
  });

  socket.on('move', ({ gameId, move }) => {
    const room = gameRooms[gameId];
    if (!room) return;

    const game = room.gameInstance;
    const playerColor = (room.players.w === socket.id) ? 'w' :
                        (room.players.b === socket.id) ? 'b' : null;

    if (!playerColor) {
      socket.emit('error', 'You are not a player in this game');
      return;
    }

    if (playerColor !== room.currentTurn) {
      socket.emit('error', 'Not your turn!');
      return;
    }

    try {
      game.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      });

      room.currentTurn = game.turn();
      io.to(gameId).emit('moveMade', game.fen());

      if (room.isAI && room.currentTurn === 'b') {
        generateAIMove(gameId, game.fen());
      }

      if (game.isGameOver()) {
        io.to(gameId).emit('gameOver', {
          result: game.isCheckmate() ? (room.currentTurn === 'w' ? 'Black wins' : 'White wins') : 'Draw',
          fen: game.fen()
        });
      }
    } catch (e) {
      socket.emit('error', 'Illegal move');
    }
  });

  const generateAIMove = (gameId, fen) => {
    const engine = new Engine();
    engine.evaluatePosition(fen).then(bestMove => {
      const room = gameRooms[gameId];
      if (room && bestMove) {
        try {
          room.gameInstance.move(bestMove);
          room.currentTurn = room.gameInstance.turn();
          io.to(gameId).emit('moveMade', room.gameInstance.fen());

          if (room.gameInstance.isGameOver()) {
            io.to(gameId).emit('gameOver', {
              result: room.gameInstance.isCheckmate() ? 'AI wins' : 'Draw',
              fen: room.gameInstance.fen()
            });
          }
        } catch (e) {
          console.error('AI made illegal move:', e);
        }
      }
    });
  };

  socket.on('disconnect', () => {
    Object.entries(gameRooms).forEach(([gameId, room]) => {
      const { w, b } = room.players;
      if (socket.id === w || socket.id === b) {
        delete gameRooms[gameId];
      }
    });
    console.log('Client disconnected');
  });
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});