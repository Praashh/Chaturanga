import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { Board } from './engine/board';
import type { ClientMessage, ServerMessage } from './ws/messages';
import { authPlugin } from './auth';

interface PlayerSession {
  name: string;
  color: 'white' | 'black';
  ws: any;
}

interface Room {
  id: string;
  board: Board;
  players: PlayerSession[];
}

// In-memory room manager
const rooms = new Map<string, Room>();

const PORT = Number(process.env.PORT) || 3001;

const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )
  .use(authPlugin)
  .get('/api/health', () => ({
    status: 'online',
    service: 'chaturanga-backend',
    runtime: 'bun + elysia',
    timestamp: new Date().toISOString(),
    message: 'Chaturanga Bun + Elysia server with Prisma v8 PostgreSQL & Google OAuth is active.',
  }))
  .ws('/ws', {
    open(ws) {
      console.log(`📡 WebSocket client connected: ${ws.id}`);
    },

    message(ws, rawMessage) {
      try {
        let msg: ClientMessage;
        if (typeof rawMessage === 'string') {
          msg = JSON.parse(rawMessage);
        } else if (typeof rawMessage === 'object' && rawMessage !== null) {
          msg = rawMessage as ClientMessage;
        } else {
          return;
        }

        switch (msg.type) {
          case 'ping': {
            const pong: ServerMessage = { type: 'pong' };
            ws.send(JSON.stringify(pong));
            break;
          }

          case 'join_room': {
            const { room_id, player_name } = msg.payload;
            let room = rooms.get(room_id);

            if (!room) {
              room = {
                id: room_id,
                board: new Board(),
                players: [],
              };
              rooms.set(room_id, room);
            }

            // Assign white to first player, black to second
            const assignedColor: 'white' | 'black' =
              room.players.length === 0 ? 'white' : 'black';

            const newPlayer: PlayerSession = {
              name: player_name || 'Warrior',
              color: assignedColor,
              ws,
            };
            room.players.push(newPlayer);

            const opponent = room.players.find(p => p.ws !== ws);

            const resp: ServerMessage = {
              type: 'room_joined',
              payload: {
                room_id,
                color: assignedColor,
                opponent: opponent ? opponent.name : null,
              },
            };
            ws.send(JSON.stringify(resp));

            // Notify opponent if already waiting
            if (opponent) {
              const notifyOpponent: ServerMessage = {
                type: 'room_joined',
                payload: {
                  room_id,
                  color: opponent.color,
                  opponent: player_name,
                },
              };
              opponent.ws.send(JSON.stringify(notifyOpponent));
            }
            break;
          }

          case 'make_move': {
            const { room_id, from_col, from_row, to_col, to_row } = msg.payload;
            const room = rooms.get(room_id);

            if (room) {
              // Execute move on starter Board engine
              room.board.makeMove({
                from: { col: from_col, row: from_row },
                to: { col: to_col, row: to_row },
              });

              const broadcast: ServerMessage = {
                type: 'move_made',
                payload: {
                  from_col,
                  from_row,
                  to_col,
                  to_row,
                  next_turn: room.board.turn,
                },
              };

              // Broadcast move to all room participants
              for (const player of room.players) {
                player.ws.send(JSON.stringify(broadcast));
              }
            }
            break;
          }

          case 'chat': {
            const { room_id, text } = msg.payload;
            const room = rooms.get(room_id);

            if (room) {
              const sender = room.players.find(p => p.ws === ws)?.name || 'Player';
              const broadcast: ServerMessage = {
                type: 'chat_broadcast',
                payload: { sender, text },
              };
              for (const player of room.players) {
                player.ws.send(JSON.stringify(broadcast));
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    },

    close(ws) {
      console.log(`🔌 WebSocket client disconnected: ${ws.id}`);
      // Remove from room registry
      for (const [roomId, room] of rooms.entries()) {
        room.players = room.players.filter(p => p.ws !== ws);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        }
      }
    },
  })
  .listen(PORT);

console.log(`🕉️  Chaturanga Backend (Bun + Elysia + Prisma 7) listening on http://localhost:${PORT}`);
console.log(`📡 WebSocket endpoint ready at ws://localhost:${PORT}/ws`);
console.log(`🩺 Health check available at http://localhost:${PORT}/api/health`);
console.log(`🔑 Auth endpoints ready at http://localhost:${PORT}/api/auth`);
