import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { Board } from './engine/board';
import type { ClientMessage, ServerMessage, GameOverPayload } from './ws/messages';
import { authPlugin } from './auth';
import { friendsPlugin } from './friends';
import { ratingPlugin } from './rating/plugin';
import { RatingService } from './rating/service';
import { prisma } from './db';

interface PlayerSession {
  id?: string;
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
  rating?: number;
  picture?: string | null;
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
  .use(friendsPlugin)
  .use(ratingPlugin)
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

    async message(ws, rawMessage) {
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
            const { room_id, player_name, player_id } = msg.payload;
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
              id: player_id,
              name: player_name || 'Warrior',
              color: assignedColor,
              ws,
            };
            room.players.push(newPlayer);

            const opponent = room.players.find(p => p.ws !== ws);

            let playerRating = 1500;
            let playerPicture: string | null = null;
            if (player_id) {
              const pr = await RatingService.getPlayerRating(player_id);
              if (pr) playerRating = Math.round(pr.rating);
              const u = await prisma.user.findUnique({ where: { id: player_id }, select: { picture: true } });
              if (u) playerPicture = u.picture;
            }

            let oppRating = 1500;
            let oppPicture: string | null = null;
            if (opponent?.id) {
              const pr = await RatingService.getPlayerRating(opponent.id);
              if (pr) oppRating = Math.round(pr.rating);
              const u = await prisma.user.findUnique({ where: { id: opponent.id }, select: { picture: true } });
              if (u) oppPicture = u.picture;
            }

            const resp: ServerMessage = {
              type: 'room_joined',
              payload: {
                room_id,
                color: assignedColor,
                opponent: opponent ? opponent.name : null,
                opponent_id: opponent ? opponent.id : null,
                opponent_rating: opponent ? oppRating : undefined,
                opponent_picture: opponent ? oppPicture : null,
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
                  opponent_id: player_id || null,
                  opponent_rating: playerRating,
                  opponent_picture: playerPicture,
                },
              };
              opponent.ws.send(JSON.stringify(notifyOpponent));
            }
            break;
          }

          case 'find_match': {
            const { player_id, player_name, picture } = msg.payload;

            // Fetch authoritative rating from DB if player_id exists
            let authoritativeRating = 1500;
            if (player_id) {
              const pr = await RatingService.getPlayerRating(player_id);
              if (pr) {
                authoritativeRating = Math.round(pr.rating);
              } else if (msg.payload.rating) {
                authoritativeRating = msg.payload.rating;
              }
            }

            console.log(`[Matchmaking] ${player_name} (${player_id}) finding match at authoritative rating ${authoritativeRating}`);

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
                  rating: authoritativeRating,
                  picture: picture ?? null,
                  ws,
                });
                break;
              }

              const roomId = `match-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

              const newRoom: Room = {
                id: roomId,
                board: new Board(),
                players: [
                  { id: opponent.playerId, name: opponent.playerName, color: 'white', ws: opponent.ws },
                  { id: player_id, name: player_name, color: 'black', ws },
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
                    opponent_id: player_id,
                    opponent_rating: authoritativeRating,
                    opponent_picture: picture ?? null,
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
                    opponent_id: opponent.playerId,
                    opponent_rating: opponent.rating ?? 1500,
                    opponent_picture: opponent.picture ?? null,
                  },
                })
              );

              console.log(`🎮 Match created! Room: ${roomId} between ${opponent.playerName} (${opponent.rating}) and ${player_name} (${authoritativeRating})`);
              break;
            } else {
              // No one is waiting -> push this player to wait
              matchmakingQueue.push({
                playerId: player_id,
                playerName: player_name,
                rating: authoritativeRating,
                picture: picture ?? null,
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
              console.log(`Player canceled queue. Waiting: ${matchmakingQueue.length}`);
            }
            break;
          }

          case 'make_move': {
            const { room_id, from_col, from_row, to_col, to_row } = msg.payload;
            const room = rooms.get(room_id);

            if (room) {
              const moveResult = room.board.makeMove({
                from: { col: from_col, row: from_row },
                to: { col: to_col, row: to_row },
              });

              if (!moveResult.success) {
                ws.send(
                  JSON.stringify({
                    type: 'invalid_move',
                    payload: { reason: moveResult.error || 'Invalid move' },
                  })
                );
                break;
              }

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
                try {
                  player.ws.send(JSON.stringify(broadcast));
                } catch (err) {
                  console.error('Error broadcasting move:', err);
                }
              }

              // Check if game has ended decisively
              if (room.board.status.type !== 'ongoing') {
                const whitePlayer = room.players.find(p => p.color === 'white');
                const blackPlayer = room.players.find(p => p.color === 'black');

                let gameWinner: 'white' | 'black' | 'draw' = 'draw';
                if (room.board.status.type === 'checkmate' || room.board.status.type === 'bare_king') {
                  gameWinner = room.board.status.winner;
                }

                console.log(`🏆 Game over in room ${room_id}: ${room.board.status.type}, winner: ${gameWinner}`);

                const settlement = await RatingService.settleGame({
                  gameId: room_id,
                  whitePlayerId: whitePlayer?.id || null,
                  blackPlayerId: blackPlayer?.id || null,
                  winner: gameWinner,
                  endReason: room.board.status.type,
                  category: 'standard',
                  isRated: true,
                });

                const gameOverPayload: GameOverPayload = {
                  room_id,
                  winner: gameWinner,
                  reason: room.board.status.type,
                  isRated: settlement.isRated,
                  whiteRating: settlement.white,
                  blackRating: settlement.black,
                };

                const gameOverMsg: ServerMessage = {
                  type: 'game_over',
                  payload: gameOverPayload,
                };

                for (const player of room.players) {
                  try {
                    player.ws.send(JSON.stringify(gameOverMsg));
                  } catch (err) {
                    console.error('Error broadcasting game_over:', err);
                  }
                }
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
                try {
                  player.ws.send(JSON.stringify(broadcast));
                } catch (err) {
                  console.error('Error broadcasting chat:', err);
                }
              }
            }
            break;
          }

          case 'resign': {
            const { room_id } = msg.payload;
            const room = rooms.get(room_id);

            if (room && room.board.status.type === 'ongoing') {
              const resigningPlayer = room.players.find(p => (p.ws.id ? p.ws.id === ws.id : p.ws === ws));
              const resigningColor: 'white' | 'black' = msg.payload.color || resigningPlayer?.color || 'white';
              const winner: 'white' | 'black' = resigningColor === 'white' ? 'black' : 'white';

              room.board.status = { type: 'resignation', winner };
              console.log(`🏳️ Resignation in room ${room_id}: ${resigningColor} resigned, winner: ${winner}`);

              const whitePlayer = room.players.find(p => p.color === 'white');
              const blackPlayer = room.players.find(p => p.color === 'black');

              const settlement = await RatingService.settleGame({
                gameId: room_id,
                whitePlayerId: whitePlayer?.id || null,
                blackPlayerId: blackPlayer?.id || null,
                winner,
                endReason: 'resignation',
                category: 'standard',
                isRated: true,
              });

              const resignedMsg: ServerMessage = {
                type: 'player_resigned',
                payload: {
                  color: resigningColor,
                  winner,
                  whiteRating: settlement.white,
                  blackRating: settlement.black,
                },
              };

              const gameOverMsg: ServerMessage = {
                type: 'game_over',
                payload: {
                  room_id,
                  winner,
                  reason: 'resignation',
                  isRated: settlement.isRated,
                  whiteRating: settlement.white,
                  blackRating: settlement.black,
                },
              };

              for (const player of room.players) {
                try {
                  player.ws.send(JSON.stringify(resignedMsg));
                  player.ws.send(JSON.stringify(gameOverMsg));
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

    async close(ws) {
      // Remove from matchmaking queue if disconnected while searching
      const queueIndex = matchmakingQueue.findIndex(p => (p.ws.id ? p.ws.id === ws.id : p.ws === ws));
      if (queueIndex !== -1) {
        matchmakingQueue.splice(queueIndex, 1);
      }
      // Remove from active rooms
      for (const [roomId, room] of rooms.entries()) {
        const disconnectedPlayer = room.players.find(p => (p.ws.id ? p.ws.id === ws.id : p.ws === ws));
        if (!disconnectedPlayer) continue;

        room.players = room.players.filter(p => (p.ws.id ? p.ws.id !== ws.id : p.ws !== ws));

        // If the match was actively ongoing between 2 players and at least 1 move was made, remaining player wins by abandonment
        if (room.board.status.type === 'ongoing' && room.players.length === 1 && room.board.moveHistory.length > 0) {
          const remainingPlayer = room.players[0];
          const winnerColor = remainingPlayer.color;

          room.board.status = { type: 'abandoned', winner: winnerColor } as any;
          console.log(`🔌 Player ${disconnectedPlayer.name} disconnected. ${remainingPlayer.name} wins by abandonment.`);

          const whitePlayer = winnerColor === 'white' ? remainingPlayer : disconnectedPlayer;
          const blackPlayer = winnerColor === 'black' ? remainingPlayer : disconnectedPlayer;

          const settlement = await RatingService.settleGame({
            gameId: roomId,
            whitePlayerId: whitePlayer?.id || null,
            blackPlayerId: blackPlayer?.id || null,
            winner: winnerColor,
            endReason: 'abandoned',
            category: 'standard',
            isRated: true,
          });

          const gameOverMsg: ServerMessage = {
            type: 'game_over',
            payload: {
              room_id: roomId,
              winner: winnerColor,
              reason: 'abandoned',
              isRated: settlement.isRated,
              whiteRating: settlement.white,
              blackRating: settlement.black,
            },
          };

          try {
            remainingPlayer.ws.send(JSON.stringify(gameOverMsg));
          } catch (err) {
            console.error('Error notifying remaining player of abandonment:', err);
          }
        }

        if (room.players.length === 0) {
          rooms.delete(roomId);
        }
      }
    },
  })
  .listen(PORT);

console.log(`Chaturanga Backend (Bun + Elysia + Prisma 7) listening on http://localhost:${PORT}`);
console.log(`WebSocket endpoint ready at ws://localhost:${PORT}/ws`);
console.log(`Health check available at http://localhost:${PORT}/api/health`);
console.log(`Auth endpoints ready at http://localhost:${PORT}/api/auth`);
console.log(`Leaderboard endpoints ready at http://localhost:${PORT}/api/leaderboard`);
console.log(`Rating endpoints ready at http://localhost:${PORT}/api/rating`);
