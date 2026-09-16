# 🕉️ Chaturanga (चतुरङ्ग)

A full-stack, real-time implementation of **Chaturanga**, the ancient 6th-century Indian strategy board game that gave birth to modern Chess, Persian Shatranj, and Chinese Xiangqi.

Built with **React (TypeScript + Tailwind CSS v4)** on the frontend and an initialized **Bun + ElysiaJS** backend with native WebSockets.

---

## 🏛️ Project Architecture

```
Chaturanga/
├── backend/                  # Bun + ElysiaJS Backend
│   ├── package.json          # Elysia, @elysiajs/cors, @types/bun
│   ├── tsconfig.json         # Bun TypeScript configuration
│   ├── README.md             # Guide for developing your engine
│   └── src/
│       ├── index.ts          # Elysia server (CORS, health check, WebSockets on port 3001)
│       ├── engine/           # Chaturanga Engine definitions
│       │   ├── types.ts      # Raja, Mantri, Gaja, Ashva, Ratha, Padati types
│       │   └── board.ts      # Board state & makeMove placeholder
│       └── ws/
│           └── messages.ts   # ClientMessage and ServerMessage schemas
│
└── frontend/                 # React 19 + TypeScript + Tailwind CSS v4 App
    ├── package.json
    ├── vite.config.ts        # Vite + Tailwind CSS v4 plugin
    └── src/
        ├── types/game.ts     # Core types, Ashtāpada markings & Sanskrit terms
        ├── engine/
        │   ├── rules.ts      # Pure client-side Chaturanga rules engine
        │   ├── ai.ts         # Minimax bot with Alpha-Beta pruning (3 tiers)
        │   └── rules.test.ts # Bun unit tests for movement & promotion rules
        ├── components/
        │   ├── AshtapadaBoard.tsx # 8x8 board with flush eval bar & glowing indicators
        │   ├── PieceIcon.tsx      # Vector SVGs matching chess platform standards
        │   ├── PlayerCard.tsx     # Opponent and user cards with avatars & ratings
        │   ├── GamePanel.tsx      # Tactical command panel with analysis & move history
        │   ├── Sidebar.tsx        # Left navigation drawer
        │   ├── TopBar.tsx         # Header bar with auth and audio controls
        │   ├── RulesModal.tsx     # Theme-consistent piece guide and rules
        │   └── LobbyModal.tsx     # War Chamber: Pass & Play, AI Bot, or Online
        └── hooks/
            ├── useChaturangaGame.ts   # Main game state machine with undo & AI loop
            ├── useChaturangaSocket.ts # WebSocket client hook connected to Elysia
            └── useAudio.ts            # Acoustic hardwood sound modeling engine
```

---

## ⚡ Quick Start

### 1. Frontend (React + Vite + Tailwind CSS v4)

```bash
cd frontend
bun install
bun run dev
```
Open **`http://localhost:5173`** in your browser.

To run the rules unit tests:
```bash
bun test
```

### 2. Backend (Bun + Elysia)

In a separate terminal:
```bash
cd backend
bun install
bun run dev
```
The server will boot on **`http://localhost:3001`**:
- **Health check**: `http://localhost:3001/api/health`
- **WebSocket endpoint**: `ws://localhost:3001/ws`

---

## 📜 Authentic Classical Rules Implemented

| Unit | Sanskrit | Movement |
| :--- | :--- | :--- |
| **King** | *Rāja* (राजा) | 1 step in any direction. No castling. |
| **Counselor / Vizier** | *Mantri* (मन्त्री) | 1 step diagonally only. |
| **War Elephant** | *Gaja* (गज) | **Leaps exactly 2 squares diagonally**, jumping over intervening pieces. |
| **Cavalry Horse** | *Ashva* (अश्व) | Knight L-shape leap. |
| **War Chariot** | *Ratha* (रथ) | Rook orthogonal rays. |
| **Foot Soldier** | *Padāti* (पदाति) | 1 step forward, 1 step diagonal capture. No initial double move. Promotes to *Mantri* on the 8th rank. |

### Victory Conditions
1. **Checkmate**: Trapping the enemy Raja.
2. **Bare King (*Borah*)**: Capturing all opposing army units until only the solitary Raja remains.
3. **Stalemate**: Leaving the opponent with zero legal moves.
