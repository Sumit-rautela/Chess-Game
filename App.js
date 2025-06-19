localStorage.removeItem('token');
import React, { useState } from "react";
import Login from './Login';
import ChessGame from './ChessGame';

// Add props parameter to receive stockfishInitializer
function App({ stockfishInitializer }) {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleSetToken = (token) => {
    localStorage.setItem('token', token);
    setToken(token);
  };

  if (!token) {
    return <Login setToken={handleSetToken} />;
  }

  // Pass stockfishInitializer to ChessGame
  return <ChessGame stockfishInitializer={stockfishInitializer} />;
}

export default App;
