# 🕉️ Chaturanga Backend (Bun + Elysia)

An initialized, lightning-fast backend for the ancient Indian strategy game **Chaturanga**, powered by [Bun](https://bun.sh) and [ElysiaJS](https://elysiajs.com).

---

## 📁 Architecture Overview

```
backend/
├── package.json           # Elysia, @elysiajs/cors, @types/bun
├── tsconfig.json          # Bun TypeScript configuration
├── README.md              # Documentation & developer guide
└── src/
    ├── index.ts           # Elysia HTTP server, CORS & native WebSockets
    ├── engine/            # Chaturanga Game Engine (Starter templates)
    │   ├── types.ts       # PieceType (raja, mantri, gaja, ashva, ratha, padati),
    │   │                  # PieceColor, SquareCoord, Move, GameStatus
    │   └── board.ts       # Board state with Ashtāpada 8x8 setup & makeMove placeholder
    └── ws/                # Real-Time WebSocket Handlers
        └── messages.ts    # ClientMessage and ServerMessage schemas
```

---

## 🚀 Running the Server

Make sure you have [Bun](https://bun.sh) installed.

### Development Mode (with hot-reloading)
```bash
bun run dev
```

### Production Mode
```bash
bun start
```

The server listens on **`http://localhost:3001`**:
- **Health Check**: `GET http://localhost:3001/api/health`
- **WebSocket Endpoint**: `ws://localhost:3001/ws`

---

## 🧠 Developing Your Game Engine

The backend is initialized with starter types and room networking ready for your custom logic:

1. **`src/engine/types.ts`**:
   - `raja`: King (1 step any direction)
   - `mantri`: Counselor (1 step diagonally)
   - `gaja`: War Elephant (2 steps diagonal leap over pieces)
   - `ashva`: Horse (Knight L-jump)
   - `ratha`: Chariot (Rook orthogonal rays)
   - `padati`: Foot Soldier (1 step forward, diagonal capture, promotes to mantri)

2. **`src/engine/board.ts`**:
   - Contains `Board` class with traditional Ashtāpada initial piece positions.
   - Implement your legal move validation, check/checkmate detection, and bare-king victory conditions inside `makeMove(move: Move)`.

3. **`src/index.ts` & `src/ws/messages.ts`**:
   - Pre-configured with native Bun WebSockets for:
     - `join_room`: Pairs two players into a room (assigning White and Black).
     - `make_move`: Relays validated moves between players.
     - `chat`: In-game chat broadcast.
     - `ping` / `pong`: Heartbeat keeping connections alive.
