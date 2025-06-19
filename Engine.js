//backend/Engine.js

const { Chess } = require('chess.js');

class Engine {
  constructor() {
    this.engine = Stockfish();
    this.engine.onmessage = (line) => {
      if (typeof line === 'string' && line.startsWith('bestmove')) {
        this.resolve(line.split(' ')[1]);
      }
    };
  }

  evaluatePosition(fen, depth = 15) {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.engine.postMessage(`position fen ${fen}`);
      this.engine.postMessage(`go depth ${depth}`);
    });
  }
}

module.exports = Engine;