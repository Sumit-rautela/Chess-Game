# Chess Game

A full-stack chess game application built with Node.js for the backend and React for the frontend. The project supports user authentication, chess logic, and integrates Stockfish for AI moves.

## Table of Contents

- [Project Structure](#project-structure)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
- [Scripts](#scripts)
- [Dependencies](#dependencies)
- [License](#license)

## Project Structure

CHESS-GAME/
│
├── backend/
│   ├── node_modules/
│   ├── Engine.js
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   └── users.json
│
├── frontend/
│   ├── node_modules/
│   ├── public/
│   │   ├── index.html
│   │   ├── stockfish.d.ts
│   │   └── stockfish.js
│   ├── src/
│   │   ├── utils/
│   │   │   └── chessGame.js
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── ChessGame.js
│   │   ├── index.js
│   │   ├── Login.css
│   │   └── Login.js
│   ├── config-overrides.js
│   ├── package-lock.json
│   └── package.json
___________________________

## Features

- Play chess against Stockfish AI
- User authentication (login functionality)
- Responsive UI with React
- Chess logic handled in backend and frontend
- Modular codebase

## Setup Instructions

### Prerequisites

- Node.js (v14 or above)
- npm or yarn

### Backend

1. Navigate to the backend directory:
2. Install dependencies:
3. Start the backend server:

### Frontend

1. Navigate to the frontend directory:
2. Install dependencies:
3. Start the frontend development server:

## Scripts

- `npm start` - Starts the development server (both backend and frontend)
- `npm run build` - Builds the frontend for production (run in frontend directory)

## Dependencies

- **Backend:** Express, (possibly) Tailwind CSS, other Node.js packages
- **Frontend:** React, Stockfish.js, (possibly) Tailwind CSS

## License

This project is licensed under the MIT License.
