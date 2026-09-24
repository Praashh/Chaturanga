import { useState, useEffect, useRef, useCallback } from 'react';
import type { SquareCoord } from '../types/game';

export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MatchedOpponentInfo {
  roomId: string;
  color: 'white' | 'black';
  opponentName: string;
  opponentId?: string | null;
  opponentRating?: number;
  opponentPicture?: string | null;
}

interface UseChaturangaSocketProps {
  roomId: string | null;
  playerName: string;
  onRemoteMove?: (move: { from: SquareCoord; to: SquareCoord }) => void;
  onRemoteChat?: (chat: { sender: string; text: string }) => void;
  onMatchFound?: (
    roomId: string,
    color: 'white' | 'black',
    opponent: string,
    opponentId?: string | null,
    opponentRating?: number,
    opponentPicture?: string | null
  ) => void;
  onRemoteResign?: (resignation: { color: 'white' | 'black'; winner: 'white' | 'black' }) => void;
}

export function useChaturangaSocket({
  roomId,
  playerName,
  onRemoteMove,
  onRemoteChat,
  onMatchFound,
  onRemoteResign,
}: UseChaturangaSocketProps) {
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [assignedColor, setAssignedColor] = useState<'white' | 'black' | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [matchedOpponent, setMatchedOpponent] = useState<MatchedOpponentInfo | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pendingActions = useRef<((ws: WebSocket) => void)[]>([]);
  const isSearchingRef = useRef(isSearching);
  isSearchingRef.current = isSearching;

  // Keep references to latest callbacks so functions have stable identity
  const onRemoteMoveRef = useRef(onRemoteMove);
  onRemoteMoveRef.current = onRemoteMove;

  const onRemoteChatRef = useRef(onRemoteChat);
  onRemoteChatRef.current = onRemoteChat;

  const onMatchFoundRef = useRef(onMatchFound);
  onMatchFoundRef.current = onMatchFound;

  const onRemoteResignRef = useRef(onRemoteResign);
  onRemoteResignRef.current = onRemoteResign;

  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;

  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  // Helper to compute correct WS URL
  const getWsUrl = useCallback(() => {
    const envWsUrl = import.meta.env.VITE_WS_URL;
    let wsUrl = envWsUrl && typeof envWsUrl === 'string' && envWsUrl.trim() !== '' ? envWsUrl.trim() : '';

    if (!wsUrl) {
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;
      } else {
        wsUrl = 'ws://localhost:3001/ws';
      }
    }
    return wsUrl;
  }, []);

  const disconnect = useCallback(() => {
    pendingActions.current = [];
    if (socketRef.current) {
      const ws = socketRef.current;
      socketRef.current = null;
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        } else if (ws.readyState === WebSocket.CONNECTING) {
          // Defer closing until open to avoid browser "closed before connection established" warning
          ws.onopen = () => {
            try {
              ws.close();
            } catch {}
          };
        }
      } catch {
        // ignore
      }
    }
    setStatus('disconnected');
    setAssignedColor(null);
    setOpponentName(null);
    setOpponentId(null);
  }, []);

  const initSocket = useCallback(() => {
    // If socket is already open or connecting, reuse it
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return socketRef.current;
    }

    setStatus('connecting');
    const wsUrl = getWsUrl();

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');

        // Flush all pending actions first (e.g. find_match)
        while (pendingActions.current.length > 0) {
          const action = pendingActions.current.shift();
          if (action) {
            try {
              action(ws);
            } catch (err) {
              console.error('Error executing queued WebSocket action:', err);
            }
          }
        }

        // If we have a roomId and are not currently searching for a match, join the room
        if (roomIdRef.current && !isSearchingRef.current) {
          const joinMsg = {
            type: 'join_room',
            payload: {
              room_id: roomIdRef.current,
              player_name: playerNameRef.current || 'Warrior',
            },
          };
          ws.send(JSON.stringify(joinMsg));
        }
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'room_joined') {
            isSearchingRef.current = false;
            setIsSearching(false);
            setAssignedColor(data.payload.color);
            if (data.payload.opponent) {
              setOpponentName(data.payload.opponent);
            }
            if (data.payload.opponent_id) {
              setOpponentId(data.payload.opponent_id);
            }

            const matchInfo: MatchedOpponentInfo = {
              roomId: data.payload.room_id,
              color: data.payload.color,
              opponentName: data.payload.opponent || 'Opponent',
              opponentId: data.payload.opponent_id || null,
              opponentRating: data.payload.opponent_rating || 1500,
              opponentPicture: data.payload.opponent_picture || null,
            };
            setMatchedOpponent(matchInfo);

            if (onMatchFoundRef.current) {
              onMatchFoundRef.current(
                data.payload.room_id,
                data.payload.color,
                data.payload.opponent || 'Opponent',
                data.payload.opponent_id || null,
                data.payload.opponent_rating,
                data.payload.opponent_picture
              );
            }
          } else if (data.type === 'move_made') {
            const { from_col, from_row, to_col, to_row } = data.payload;
            if (onRemoteMoveRef.current) {
              onRemoteMoveRef.current({
                from: { col: from_col, row: from_row },
                to: { col: to_col, row: to_row },
              });
            }
          } else if (data.type === 'chat_broadcast') {
            const newChat = {
              sender: data.payload.sender,
              text: data.payload.text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setChatLog(prev => [...prev, newChat]);
            if (onRemoteChatRef.current) {
              onRemoteChatRef.current(data.payload);
            }
          } else if (data.type === 'player_resigned') {
            const resigningColor = data.payload.color;
            const winningColor = data.payload.winner;
            const systemChat = {
              sender: 'System',
              text: `${resigningColor === 'white' ? 'White' : 'Black'} resigned. ${winningColor === 'white' ? 'White' : 'Black'} wins!`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setChatLog(prev => [...prev, systemChat]);
            if (onRemoteResignRef.current) {
              onRemoteResignRef.current(data.payload);
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = () => {
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus('disconnected');
      };

      return ws;
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      setStatus('error');
      return null;
    }
  }, [getWsUrl]);

  // Safe sender helper that queues actions if connection is still establishing
  const safeSend = useCallback(
    (action: (ws: WebSocket) => void) => {
      const ws = socketRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        action(ws);
      } else {
        pendingActions.current.push(action);
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          initSocket();
        }
      }
    },
    [initSocket]
  );

  const sendMove = useCallback(
    (from: SquareCoord, to: SquareCoord) => {
      if (roomId) {
        safeSend(ws => {
          const moveMsg = {
            type: 'make_move',
            payload: {
              room_id: roomId,
              from_col: from.col,
              from_row: from.row,
              to_col: to.col,
              to_row: to.row,
              promotion: null,
            },
          };
          ws.send(JSON.stringify(moveMsg));
        });
      }
    },
    [roomId, safeSend]
  );

  const sendChat = useCallback(
    (text: string) => {
      if (roomId) {
        safeSend(ws => {
          const chatMsg = {
            type: 'chat',
            payload: {
              room_id: roomId,
              text,
            },
          };
          ws.send(JSON.stringify(chatMsg));
        });
        setChatLog(prev => [
          ...prev,
          {
            sender: playerNameRef.current || 'You',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    },
    [roomId, safeSend]
  );

  const sendResign = useCallback(
    (color?: 'white' | 'black') => {
      if (roomId) {
        safeSend(ws => {
          const resignMsg = {
            type: 'resign',
            payload: {
              room_id: roomId,
              color,
            },
          };
          ws.send(JSON.stringify(resignMsg));
        });
      }
    },
    [roomId, safeSend]
  );

  const findMatch = useCallback(
    (playerId: string, name: string, rating?: number, picture?: string | null) => {
      isSearchingRef.current = true;
      setIsSearching(true);
      setMatchedOpponent(null);
      playerNameRef.current = name;

      safeSend(ws => {
        ws.send(
          JSON.stringify({
            type: 'find_match',
            payload: {
              player_id: playerId,
              player_name: name,
              rating: rating ?? 1500,
              picture: picture ?? null,
            },
          })
        );
      });
    },
    [safeSend]
  );

  const cancelFindMatch = useCallback(() => {
    isSearchingRef.current = false;
    setIsSearching(false);
    setMatchedOpponent(null);
    pendingActions.current = [];

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'cancel_find_match',
        })
      );
    }
    if (!roomIdRef.current) {
      disconnect();
    }
  }, [disconnect]);

  const clearMatchedOpponent = useCallback(() => {
    setMatchedOpponent(null);
  }, []);

  // Keep isSearchingRef synchronized
  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching]);

  // Handle roomId updates without premature tear-down
  useEffect(() => {
    roomIdRef.current = roomId;
    if (roomId) {
      initSocket();
    } else if (!isSearchingRef.current) {
      disconnect();
    }
  }, [roomId, initSocket, disconnect]);

  // Cleanup only on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    assignedColor,
    opponentName,
    opponentId,
    chatLog,
    isSearching,
    matchedOpponent,
    clearMatchedOpponent,
    findMatch,
    cancelFindMatch,
    sendMove,
    sendChat,
    sendResign,
    disconnect,
  };
}
