import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Create a Stockfish Web Worker
const initializeStockfish = () => {
  return new Worker(process.env.PUBLIC_URL + '/stockfish.js');
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Pass initializer to App component */}
    <App stockfishInitializer={initializeStockfish} />
  </React.StrictMode>
);
