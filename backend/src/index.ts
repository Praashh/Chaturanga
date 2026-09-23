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

// In-memory player online tracking
interface QueuedPlayer {
  playerId: string;
  playerName: string;
  ws: any; // Elysia WebSocket
}

const matchmakingQueue: QueuedPlayer[] = [];

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

          case 'find_match': {
            const { player_id, player_name } = msg.payload;
            console.log("USER CLICK ON FIND MATCH", matchmakingQueue);

            // Prevent duplicate entries if clicked multiple times
            if (matchmakingQueue.some(p => (p.ws.id ? p.ws.id === ws.id : p.ws === ws) || p.playerId === player_id)) {
              break;
            }

            if (matchmakingQueue.length > 0) {
              const opponent = matchmakingQueue.shift()!;

              // Avoid matching the same socket with itself
              if (opponent.ws.id ? opponent.ws.id === ws.id : opponent.ws === ws) {
                matchmakingQueue.push({
                  playerId: player_id,
                  playerName: player_name,
                  ws,
                });
                break;
              }

              const roomId = `match-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

              const newRoom: Room = {
                id: roomId,
                board: new Board(),
                players: [
                  { name: opponent.playerName, color: 'white', ws: opponent.ws },
                  { name: player_name, color: 'black', ws },
                ],
              };

              rooms.set(roomId, newRoom);

              // 1. Notify the waiting opponent (White)
              opponent.ws.send(
                JSON.stringify({
                  type: 'room_joined',
                  payload: {
                    room_id: roomId,
                    color: 'white',
                    opponent: player_name,
                  },
                })
              );

              // 2. Notify the incoming player (Black)
              ws.send(
                JSON.stringify({
                  type: 'room_joined',
                  payload: {
                    room_id: roomId,
                    color: 'black',
                    opponent: opponent.playerName,
                  },
                })
              );

              console.log(`🎮 Match created! Room: ${roomId} between ${opponent.playerName} and ${player_name}`);
              break;
            } else {
              // No one is waiting -> push this player to wait
              matchmakingQueue.push({
                playerId: player_id,
                playerName: player_name,
                ws,
              });

              console.log(`⏳ Player ${player_name || player_id} joined queue. Waiting: ${matchmakingQueue.length}`);
              break;
            }
          }

          case 'cancel_find_match': {
            const queueIndex = matchmakingQueue.findIndex(p => (p.ws.id ? p.ws.id === ws.id : p.ws === ws));
            if (queueIndex !== -1) {
              matchmakingQueue.splice(queueIndex, 1);
              console.log(` Player canceled queue. Waiting: ${matchmakingQueue.length}`);
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
              const sender = room.players.find(p => (p.ws.id ? p.ws.id === ws.id : p.ws === ws))?.name || 'Player';
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

          case 'resign': {
            const { room_id } = msg.payload;
            const room = rooms.get(room_id);

            if (room) {
              const resigningPlayer = room.players.find(p => (p.ws.id ? p.ws.id === ws.id : p.ws === ws));
              const resigningColor: 'white' | 'black' = msg.payload.color || resigningPlayer?.color || 'white';
              const winner: 'white' | 'black' = resigningColor === 'white' ? 'black' : 'white';

              room.board.status = { type: 'resignation', winner };
              console.log(`Resignation in room ${room_id}: ${resigningColor} resigned, winner: ${winner}`);

              const broadcast: ServerMessage = {
                type: 'player_resigned',
                payload: {
                  color: resigningColor,
                  winner,
                },
              };

              for (const player of room.players) {
                try {
                  player.ws.send(JSON.stringify(broadcast));
                } catch (err) {
                  console.error('Error broadcasting resignation:', err);
                }
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
      // Remove from matchmaking queue if disconnected while searching
      const queueIndex = matchmakingQueue.findIndex(p => (p.ws.id ? p.ws.id === ws.id : p.ws === ws));
      if (queueIndex !== -1) {
        matchmakingQueue.splice(queueIndex, 1);
      }
      // Remove from active rooms...
      for (const [roomId, room] of rooms.entries()) {
        room.players = room.players.filter(p => (p.ws.id ? p.ws.id !== ws.id : p.ws !== ws));
        if (room.players.length === 0) {
          rooms.delete(roomId);
        }
      }
    }
  })
  .listen(PORT);

console.log(`Chaturanga Backend (Bun + Elysia + Prisma 7) listening on http://localhost:${PORT}`);
console.log(`WebSocket endpoint ready at ws://localhost:${PORT}/ws`);
console.log(`Health check available at http://localhost:${PORT}/api/health`);
console.log(`Auth endpoints ready at http://localhost:${PORT}/api/auth`);
