localStorage.removeItem('token');
import React, { useState } from "react";
import Login from './Login';
import ChessGame from './ChessGame'; // Move your chess logic here

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleSetToken = (token) => {
    localStorage.setItem('token', token);
    setToken(token);
  };

  if (!token) {
    return <Login setToken={handleSetToken} />;
  }

  return <ChessGame />;
}

export default App;
