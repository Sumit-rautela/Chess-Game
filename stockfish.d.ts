declare module 'stockfish.js' {
  export default function Stockfish(): {
    postMessage: (command: string) => void;
    onmessage: (e: MessageEvent) => void;
    terminate: () => void;
  };
}
