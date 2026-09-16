import { useState, useEffect, useRef, useCallback } from 'react';
import type { SquareCoord } from '../types/game';

export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseChaturangaSocketProps {
  roomId: string | null;
  playerName: string;
  onRemoteMove?: (move: { from: SquareCoord; to: SquareCoord }) => void;
  onRemoteChat?: (chat: { sender: string; text: string }) => void;
}

export function useChaturangaSocket({
  roomId,
  playerName,
  onRemoteMove,
  onRemoteChat,
}: UseChaturangaSocketProps) {
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [assignedColor, setAssignedColor] = useState<'white' | 'black' | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<{ sender: string; text: string; time: string }[]>([]);

  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!roomId) return;

    setStatus('connecting');
    const wsUrl = import.meta.env.VITE_WS_URL as string;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      // Send join_room
      const joinMsg = {
        type: 'join_room',
        payload: {
          room_id: roomId,
          player_name: playerName || 'Warrior',
        },
      };
      ws.send(JSON.stringify(joinMsg));
    };

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room_joined') {
          setAssignedColor(data.payload.color);
          if (data.payload.opponent) {
            setOpponentName(data.payload.opponent);
          }
        } else if (data.type === 'move_made') {
          const { from_col, from_row, to_col, to_row } = data.payload;
          if (onRemoteMove) {
            onRemoteMove({
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
          if (onRemoteChat) {
            onRemoteChat(data.payload);
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
  }, [roomId, playerName, onRemoteMove, onRemoteChat]);

  const sendMove = useCallback(
    (from: SquareCoord, to: SquareCoord) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && roomId) {
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
        socketRef.current.send(JSON.stringify(moveMsg));
      }
    },
    [roomId]
  );

  const sendChat = useCallback(
    (text: string) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && roomId) {
        const chatMsg = {
          type: 'chat',
          payload: {
            room_id: roomId,
            text,
          },
        };
        socketRef.current.send(JSON.stringify(chatMsg));
        setChatLog(prev => [
          ...prev,
          {
            sender: playerName || 'You',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    },
    [roomId, playerName]
  );

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    if (roomId) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      disconnect();
    };
  }, [roomId, connect, disconnect]);

  return {
    status,
    assignedColor,
    opponentName,
    chatLog,
    sendMove,
    sendChat,
    disconnect,
  };
}
