import React, { useState } from 'react';
import './Login.css';

export default function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const endpoint = isSignup ? '/api/signup' : '/api/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
      return;
    }
    if (isSignup) {
      setSuccess('Sign up successful! Please sign in.');
      setIsSignup(false); // Switch to sign in mode after successful sign up
      setUsername('');
      setPassword('');
    } else {
      setToken(data.token); // This will trigger the parent to show the game
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <h1 className="login-title">{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="Username"
              autoFocus
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Password"
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}
          <button className="login-btn" type="submit">
            {isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <div className="toggle-link">
          <span>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            className="toggle-btn"
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
              setSuccess('');
            }}
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
