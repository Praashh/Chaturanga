import { useState, useCallback, useEffect, useRef } from 'react';
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
import { useAudio } from '@sounds';
import { useChaturangaSocket } from './useChaturangaSocket';
import { updateGameRoomUrl } from '../utils/roomUrl';
import { recordGameOutcome } from '../utils/gameHistoryStorage';

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
  playerId?: string;
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
  const {
    isMuted,
    toggleMute,
    soundTheme,
    toggleSoundTheme,
    playPieceMove,
    playCapture,
    playCheck,
    playGameStart,
    playGameEnd,
    playIllegal,
    playNotify,
    playPromote,
    playMove,
  } = useAudio();

  const inCheck = status.type === 'active' ? (isKingInCheck(board, turn) ? turn : null) : null;

  const boardRef = useRef(board);
  const playerColorRef = useRef(playerColor);
  const statusRef = useRef(status);
  const hasSavedGameRef = useRef<boolean>(false);
  const opponentNameRef = useRef<string | null>(null);
  const opponentRatingRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    boardRef.current = board;
    playerColorRef.current = playerColor;
    statusRef.current = status;
  }, [board, playerColor, status]);

  // Record game outcome to local history
  const recordOutcome = useCallback(
    (
      currentStatus: GameStatus,
      moves: Move[],
      overrideOpponent?: string,
      overrideOpponentRating?: number,
      ratingDelta?: number | null
    ) => {
      if (hasSavedGameRef.current || currentStatus.type === 'active' || moves.length === 0) return;
      hasSavedGameRef.current = true;

      let oppName = 'Opponent';
      let oppRating: number | undefined;

      if (mode === 'vs_ai') {
        oppName = `Computer (${aiDifficulty === 'novice' ? 'Novice' : aiDifficulty === 'warrior' ? 'Warrior' : 'Senapati'})`;
        oppRating = aiDifficulty === 'novice' ? 1200 : aiDifficulty === 'warrior' ? 1500 : 1800;
      } else if (mode === 'online') {
        oppName = overrideOpponent || opponentNameRef.current || 'Online Warrior';
        oppRating = overrideOpponentRating || opponentRatingRef.current;
      } else {
        oppName = 'Local Player (Pass & Play)';
      }

      const winnerColor = 'winner' in currentStatus ? currentStatus.winner : 'draw';

      recordGameOutcome({
        id: mode === 'online' && onlineRoomId ? onlineRoomId : undefined,
        mode,
        userColor: playerColor,
        winner: winnerColor,
        endReason: currentStatus.type,
        opponentName: oppName,
        opponentRating: oppRating,
        moves,
        ratingChange: ratingDelta,
      });
    },
    [mode, aiDifficulty, playerColor, onlineRoomId]
  );

  // Remote Move Handler for WebSockets
  const handleRemoteMove = useCallback(
    ({ from, to }: { from: SquareCoord; to: SquareCoord }) => {
      const currentBoard = boardRef.current;
      const piece = currentBoard[from.row][from.col];
      if (!piece) return; // Already executed locally or invalid

      const { newBoard, moveRecord } = executeMove(currentBoard, from, to);
      const nextTurn: PieceColor = piece.color === 'white' ? 'black' : 'white';
      const newStatus = evaluateGameStatus(newBoard, nextTurn);

      if (moveRecord.captured) {
        if (piece.color === 'white') {
          setCapturedWhite(prev => [...prev, moveRecord.captured!]);
        } else {
          setCapturedBlack(prev => [...prev, moveRecord.captured!]);
        }
        playCapture();
      } else if (moveRecord.promotion) {
        playPromote();
      } else {
        playPieceMove(moveRecord.piece.type, true);
      }

      setBoard(newBoard);
      setTurn(nextTurn);
      setStatus(newStatus);
      setLastMove(moveRecord);
      setMoveHistory(prev => [...prev, moveRecord]);
      setSelectedSquare(null);
      setLegalMoves([]);

      if (newStatus.type !== 'active') {
        playGameEnd();
        recordOutcome(newStatus, [...moveHistory, moveRecord]);
      } else if (isKingInCheck(newBoard, nextTurn)) {
        playCheck();
      }
    },
    [playCapture, playPromote, playPieceMove, playGameEnd, playCheck]
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
    hasSavedGameRef.current = false;
  }, []);

  const handleMatchFound = useCallback(
    (newRoomId: string, color: 'white' | 'black') => {
      setMode('online');
      setOnlineRoomId(newRoomId);
      setPlayerColor(color);
      updateGameRoomUrl(newRoomId);
      resetGame();
      playGameStart();
    },
    [resetGame, playGameStart]
  );

  // Remote Resignation Handler for WebSockets
  const handleRemoteResign = useCallback(
    ({ winner }: { color: 'white' | 'black'; winner: 'white' | 'black' }) => {
      if (statusRef.current.type === 'resignation') {
        return; // Already processed locally by the resigning player
      }
      const resignedStatus: GameStatus = { type: 'resignation', winner };
      setStatus(resignedStatus);
      playGameEnd();
      recordOutcome(resignedStatus, moveHistory);
    },
    [playGameEnd, recordOutcome, moveHistory]
  );

  // Remote Game Over Handler for WebSockets
  const handleRemoteGameOver = useCallback(
    (event: any) => {
      if (statusRef.current.type !== 'active') return;
      const finalStatus: GameStatus =
        event.winner === 'draw'
          ? { type: 'stalemate' }
          : { type: event.reason, winner: event.winner };
      setStatus(finalStatus);
      playGameEnd();
      recordOutcome(finalStatus, moveHistory);
    },
    [playGameEnd, recordOutcome, moveHistory]
  );

  // WebSocket connection (only connects when room exists AND player is authenticated)
  const socket = useChaturangaSocket({
    roomId: isAuthenticated ? onlineRoomId : null,
    playerName: onlinePlayerName,
    playerId: options?.playerId,
    onRemoteMove: handleRemoteMove,
    onMatchFound: handleMatchFound,
    onRemoteResign: handleRemoteResign,
    onGameOver: handleRemoteGameOver,
  });

  // Synchronize board perspective and player card with assigned color in online multiplayer
  useEffect(() => {
    if (mode === 'online' && socket.assignedColor) {
      setPlayerColor(socket.assignedColor);
    }
    if (socket.opponentName) {
      opponentNameRef.current = socket.opponentName;
    }
    if (socket.matchedOpponent?.opponentRating) {
      opponentRatingRef.current = socket.matchedOpponent.opponentRating;
    }
  }, [mode, socket.assignedColor, socket.opponentName, socket.matchedOpponent?.opponentRating]);

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
      const isOpponent = mode === 'vs_ai' && turn !== playerColor;
      if (moveRecord.captured) {
        if (turn === 'white') {
          setCapturedWhite(prev => [...prev, moveRecord.captured!]);
        } else {
          setCapturedBlack(prev => [...prev, moveRecord.captured!]);
        }
        playCapture();
      } else if (moveRecord.promotion) {
        playPromote();
      } else {
        playPieceMove(moveRecord.piece.type, isOpponent);
      }

      setBoard(newBoard);
      setTurn(nextTurn);
      setStatus(newStatus);
      setLastMove(moveRecord);
      setMoveHistory(prev => [...prev, moveRecord]);
      setSelectedSquare(null);
      setLegalMoves([]);

      // Check / Game Over triggers
      if (newStatus.type !== 'active') {
        playGameEnd();
        recordOutcome(newStatus, [...moveHistory, moveRecord]);
      } else if (isKingInCheck(newBoard, nextTurn)) {
        playCheck();
      }

      // Notify WebSocket if in online mode
      if (mode === 'online') {
        socket.sendMove(from, to);
      }
    },
    [isAuthenticated, board, turn, status, moveHistory, capturedWhite, capturedBlack, lastMove, playCapture, playPromote, playPieceMove, playGameEnd, playCheck, mode, playerColor, socket]
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
      const resignedStatus: GameStatus = { type: 'resignation', winner };
      setStatus(resignedStatus);
      playGameEnd();
      recordOutcome(resignedStatus, moveHistory);

      if (mode === 'online') {
        socket.sendResign(loser);
      }
    },
    [status.type, playerColor, playGameEnd, mode, socket, recordOutcome, moveHistory]
  );

  const flipBoard = useCallback(() => {
    setBoardFlipped(prev => !prev);
  }, []);

  // Load a completed or archived game's moves to review step-by-step
  const loadGameMoves = useCallback((movesToLoad: Move[]) => {
    let currentBoard = createInitialBoard();
    let currentTurn: PieceColor = 'white';
    const capWhite: Piece[] = [];
    const capBlack: Piece[] = [];
    let lastM: Move | null = null;
    let currentStatus: GameStatus = { type: 'active' };

    for (const m of movesToLoad) {
      const { newBoard, moveRecord } = executeMove(currentBoard, m.from, m.to);
      currentBoard = newBoard;
      lastM = moveRecord;
      currentTurn = currentTurn === 'white' ? 'black' : 'white';
      if (moveRecord.captured) {
        if (moveRecord.piece.color === 'white') {
          capWhite.push(moveRecord.captured);
        } else {
          capBlack.push(moveRecord.captured);
        }
      }
      currentStatus = evaluateGameStatus(currentBoard, currentTurn);
    }

    setBoard(currentBoard);
    setTurn(currentTurn);
    setStatus(currentStatus);
    setLastMove(lastM);
    setCapturedWhite(capWhite);
    setCapturedBlack(capBlack);
    setMoveHistory(movesToLoad);
    setSelectedSquare(null);
    setLegalMoves([]);
    setMode('pass_and_play');
    historyStack.current = [];
    hasSavedGameRef.current = true;
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
    loadGameMoves,
    soundTheme,
    toggleSoundTheme,
    playGameStart,
    playGameEnd,
    playIllegal,
    playNotify,
    playMove,
    playPieceMove,
    playCapture,
  };
}

