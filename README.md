# Chaturanga 

A full-stack, real-time web implementation of **Chaturanga**—the ancient 6th-century Indian strategy game that originated modern Chess, Shatranj, and Xiangqi.

Built with **React 19 + TypeScript + Tailwind CSS** on the frontend and **Bun + ElysiaJS** (WebSockets) on the backend.

---

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) (v1.0+)

### Frontend
```bash
cd frontend
bun install
bun run dev
```
Open **`http://localhost:5173`**. Run tests with `bun test`.

### Backend
```bash
cd backend
bun install
bun run dev
```
Server runs on **`http://localhost:3001`** (WebSocket at `ws://localhost:3001/ws`).

---

## Game Modes

- **Local Pass & Play**: Play side-by-side on a shared board.
- **Versus AI**: Challenge a client-side Minimax bot with Alpha-Beta pruning (Novice, Warrior, Master).
- **Online Multiplayer**: Real-time matchmaking and shareable room links over WebSockets.

---

## Piece Movements

| Unit | Sanskrit | Movement |
| :--- | :--- | :--- |
| **King** | *Rāja* (राजा) | 1 step in any direction. No castling. |
| **Counselor** | *Mantri* (मन्त्री) | 1 step diagonally only. |
| **War Elephant** | *Gaja* (गज) | Leaps exactly 2 squares diagonally (jumps over intervening pieces). |
| **Cavalry Horse** | *Ashva* (अश्व) | Knight L-shape leap. |
| **War Chariot** | *Ratha* (रथ) | Rook orthogonal rays. |
| **Foot Soldier** | *Padāti* (पदाति) | 1 step forward, 1 step diagonal capture. No 2-step first move. Promotes to *Mantri* on 8th rank. |

### Victory Conditions
1. **Checkmate**: Trapping the enemy *Rāja*.
2. **Bare King (*Borah*)**: Capturing all opposing pieces until only the solitary *Rāja* remains.
3. **Stalemate**: Leaving the opponent with zero legal moves.
