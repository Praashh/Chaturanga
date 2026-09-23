import { useState, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type {
  Piece,
  PieceColor,
  SquareCoord,
  Move,
  GameStatus,
  GameMode,
  AIDifficulty,
} from '../types/game';
import {
  createInitialBoard,
  cloneBoard,
  getLegalMoves,
  executeMove,
  evaluateGameStatus,
  isKingInCheck,
} from '../engine/rules';
import { getBestMove } from '../engine/ai';
import { useAudio } from './useAudio';
import { useChaturangaSocket } from './useChaturangaSocket';
import { updateGameRoomUrl } from '../utils/roomUrl';

interface BoardSnapshot {
  board: (Piece | null)[][];
  turn: PieceColor;
  status: GameStatus;
  moveHistory: Move[];
  capturedWhite: Piece[];
  capturedBlack: Piece[];
  lastMove: Move | null;
}

interface UseChaturangaGameOptions {
  isAuthenticated?: boolean;
}

export function useChaturangaGame(options?: UseChaturangaGameOptions) {
  const isAuthenticated = options?.isAuthenticated ?? true;
  const [board, setBoard] = useState<(Piece | null)[][]>(() => createInitialBoard());
  const [turn, setTurn] = useState<PieceColor>('white');
  const [status, setStatus] = useState<GameStatus>({ type: 'active' });
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [capturedWhite, setCapturedWhite] = useState<Piece[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<Piece[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);

  const [selectedSquare, setSelectedSquare] = useState<SquareCoord | null>(null);
  const [legalMoves, setLegalMoves] = useState<SquareCoord[]>([]);

  // Settings & Modes
  const [mode, setMode] = useState<GameMode>('pass_and_play');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('warrior');
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [boardFlipped, setBoardFlipped] = useState<boolean>(false);

  // Online Multiplayer Room
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const [onlinePlayerName, setOnlinePlayerName] = useState<string>('Maharaja');

  // History stack for Undo
  const historyStack = useRef<BoardSnapshot[]>([]);

  // Sound Engine
  const { isMuted, toggleMute, playMove, playCapture, playCheck, playVictory } = useAudio();

  const inCheck = status.type === 'active' ? (isKingInCheck(board, turn) ? turn : null) : null;

  const playerColorRef = useRef(playerColor);
  playerColorRef.current = playerColor;

  const statusRef = useRef(status);
  statusRef.current = status;

  // Remote Move Handler for WebSockets
  const handleRemoteMove = useCallback(
    ({ from, to }: { from: SquareCoord; to: SquareCoord }) => {
      setBoard(prevBoard => {
        const piece = prevBoard[from.row][from.col];
        if (!piece) return prevBoard; // Already executed locally or invalid

        const { newBoard, moveRecord } = executeMove(prevBoard, from, to);
        const nextTurn: PieceColor = piece.color === 'white' ? 'black' : 'white';
        const newStatus = evaluateGameStatus(newBoard, nextTurn);

        if (moveRecord.captured) {
          if (piece.color === 'white') {
            setCapturedWhite(prev => [...prev, moveRecord.captured!]);
          } else {
            setCapturedBlack(prev => [...prev, moveRecord.captured!]);
          }
          playCapture();
        } else {
          playMove();
        }

        setTurn(nextTurn);
        setStatus(newStatus);
        setLastMove(moveRecord);
        setMoveHistory(prev => [...prev, moveRecord]);
        setSelectedSquare(null);
        setLegalMoves([]);

        if (newStatus.type !== 'active') {
          playVictory();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else if (isKingInCheck(newBoard, nextTurn)) {
          playCheck();
        }

        return newBoard;
      });
    },
    [playCapture, playMove, playVictory, playCheck]
  );

  // Restart / Reset game
  const resetGame = useCallback(() => {
    setBoard(createInitialBoard());
    setTurn('white');
    setStatus({ type: 'active' });
    setMoveHistory([]);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setLastMove(null);
    setSelectedSquare(null);
    setLegalMoves([]);
    historyStack.current = [];
  }, []);

  const handleMatchFound = useCallback(
    (newRoomId: string, color: 'white' | 'black') => {
      setMode('online');
      setOnlineRoomId(newRoomId);
      setPlayerColor(color);
      updateGameRoomUrl(newRoomId);
      resetGame();
    },
    [resetGame]
  );

  // Remote Resignation Handler for WebSockets
  const handleRemoteResign = useCallback(
    ({ color, winner }: { color: 'white' | 'black'; winner: 'white' | 'black' }) => {
      if (statusRef.current.type === 'resignation') {
        return; // Already processed locally by the resigning player
      }
      setStatus({ type: 'resignation', winner });
      playVictory();

      // If the opponent was the one who resigned, celebrate our victory!
      if (color !== playerColorRef.current) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    },
    [playVictory]
  );

  // WebSocket connection (only connects when room exists AND player is authenticated)
  const socket = useChaturangaSocket({
    roomId: isAuthenticated ? onlineRoomId : null,
    playerName: onlinePlayerName,
    onRemoteMove: handleRemoteMove,
    onMatchFound: handleMatchFound,
    onRemoteResign: handleRemoteResign,
  });

  // Synchronize board perspective and player card with assigned color in online multiplayer
  useEffect(() => {
    if (mode === 'online' && socket.assignedColor) {
      setPlayerColor(socket.assignedColor);
    }
  }, [mode, socket.assignedColor]);

  // Make move helper
  const performMove = useCallback(
    (from: SquareCoord, to: SquareCoord) => {
      if (!isAuthenticated || status.type !== 'active') return;

      // Save snapshot for undo
      historyStack.current.push({
        board: cloneBoard(board),
        turn,
        status,
        moveHistory: [...moveHistory],
        capturedWhite: [...capturedWhite],
        capturedBlack: [...capturedBlack],
        lastMove,
      });

      const { newBoard, moveRecord } = executeMove(board, from, to);
      const nextTurn: PieceColor = turn === 'white' ? 'black' : 'white';
      const newStatus = evaluateGameStatus(newBoard, nextTurn);

      // Handle capture audio & trays
      if (moveRecord.captured) {
        if (turn === 'white') {
          setCapturedWhite(prev => [...prev, moveRecord.captured!]);
        } else {
          setCapturedBlack(prev => [...prev, moveRecord.captured!]);
        }
        playCapture();
      } else {
        playMove();
      }

      setBoard(newBoard);
      setTurn(nextTurn);
      setStatus(newStatus);
      setLastMove(moveRecord);
      setMoveHistory(prev => [...prev, moveRecord]);
      setSelectedSquare(null);
      setLegalMoves([]);

      // Check / Victory triggers
      if (newStatus.type !== 'active') {
        playVictory();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } else if (isKingInCheck(newBoard, nextTurn)) {
        playCheck();
      }

      // Notify WebSocket if in online mode
      if (mode === 'online') {
        socket.sendMove(from, to);
      }
    },
    [isAuthenticated, board, turn, status, moveHistory, capturedWhite, capturedBlack, lastMove, playCapture, playMove, playVictory, playCheck, mode, socket]
  );

  // Handle Square Selection and Clicking
  const handleSquareClick = useCallback(
    (coord: SquareCoord) => {
      if (!isAuthenticated || status.type !== 'active') return;

      // In vs AI mode, lock out player clicks during AI turn
      if (mode === 'vs_ai' && turn !== playerColor) return;

      // In online mode, lock out player clicks if not your turn
      if (mode === 'online' && socket.assignedColor && turn !== socket.assignedColor) return;

      const piece = board[coord.row][coord.col];

      // If a square is already selected, check if clicking a legal move target
      if (selectedSquare) {
        const isLegal = legalMoves.some(m => m.col === coord.col && m.row === coord.row);
        if (isLegal) {
          performMove(selectedSquare, coord);
          return;
        }
      }

      // If clicking own piece, select it and compute legal moves
      if (piece && piece.color === turn) {
        setSelectedSquare(coord);
        const moves = getLegalMoves(board, coord);
        setLegalMoves(moves);
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [isAuthenticated, board, turn, status, mode, playerColor, socket.assignedColor, selectedSquare, legalMoves, performMove]
  );

  // Handle Drag-and-Drop Direct Move Execution
  const handleMove = useCallback(
    (from: SquareCoord, to: SquareCoord) => {
      if (!isAuthenticated || status.type !== 'active') return;

      // In vs AI mode, lock out player moves during AI turn
      if (mode === 'vs_ai' && turn !== playerColor) return;

      // In online mode, lock out player moves if not your turn
      if (mode === 'online' && socket.assignedColor && turn !== socket.assignedColor) return;

      const piece = board[from.row][from.col];
      if (!piece || piece.color !== turn) return;

      const moves = getLegalMoves(board, from);
      const isLegal = moves.some(m => m.col === to.col && m.row === to.row);
      if (isLegal) {
        performMove(from, to);
      } else {
        // If target square has player's own piece, select that instead
        const targetPiece = board[to.row][to.col];
        if (targetPiece && targetPiece.color === turn) {
          setSelectedSquare(to);
          setLegalMoves(getLegalMoves(board, to));
        } else if (from.col === to.col && from.row === to.row) {
          setSelectedSquare(from);
          setLegalMoves(moves);
        }
      }
    },
    [isAuthenticated, status.type, mode, turn, playerColor, socket.assignedColor, board, performMove]
  );

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (!isAuthenticated || mode !== 'vs_ai' || status.type !== 'active') return;

    const aiColor: PieceColor = playerColor === 'white' ? 'black' : 'white';
    if (turn === aiColor) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board, aiColor, aiDifficulty);
        if (bestMove) {
          performMove(bestMove.from, bestMove.to);
        }
      }, 450); // slight breathing delay for lifelike feel
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, mode, status, turn, playerColor, board, aiDifficulty, performMove]);

  // Undo move
  const undoMove = useCallback(() => {
    if (historyStack.current.length === 0) return;

    // In AI mode, undo both AI and player move if possible
    const stepsToUndo = mode === 'vs_ai' && historyStack.current.length >= 2 ? 2 : 1;

    let snapshot: BoardSnapshot | undefined;
    for (let i = 0; i < stepsToUndo; i++) {
      snapshot = historyStack.current.pop();
    }

    if (snapshot) {
      setBoard(snapshot.board);
      setTurn(snapshot.turn);
      setStatus(snapshot.status);
      setMoveHistory(snapshot.moveHistory);
      setCapturedWhite(snapshot.capturedWhite);
      setCapturedBlack(snapshot.capturedBlack);
      setLastMove(snapshot.lastMove);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [mode]);

  const resignGame = useCallback(
    (resigningColor?: PieceColor) => {
      if (status.type !== 'active') return;

      const loser = resigningColor || playerColor;
      const winner: PieceColor = loser === 'white' ? 'black' : 'white';
      setStatus({ type: 'resignation', winner });
      playVictory();

      if (mode === 'online') {
        socket.sendResign(loser);
      }
    },
    [status.type, playerColor, playVictory, mode, socket]
  );

  const flipBoard = useCallback(() => {
    setBoardFlipped(prev => !prev);
  }, []);

  return {
    board,
    turn,
    status,
    moveHistory,
    capturedWhite,
    capturedBlack,
    selectedSquare,
    legalMoves,
    lastMove,
    inCheck,
    mode,
    aiDifficulty,
    playerColor,
    boardFlipped,
    isMuted,
    canUndo: historyStack.current.length > 0,
    onlineRoomId,
    onlinePlayerName,
    socket,
    setMode,
    setAiDifficulty,
    setPlayerColor,
    setOnlineRoomId,
    setOnlinePlayerName,
    handleSquareClick,
    handleMove,
    resetGame,
    resignGame,
    undoMove,
    flipBoard,
    toggleMute,
  };
}

