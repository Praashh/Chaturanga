import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Piece, PieceColor, Move } from '../types/game';
import { createInitialBoard, executeMove, isKingInCheck } from '../engine/rules';
import { evaluateBoard } from '../engine/ai';

export interface BoardSnapshot {
  board: (Piece | null)[][];
  turn: PieceColor;
  lastMove: Move | null;
  capturedWhite: Piece[];
  capturedBlack: Piece[];
  inCheck: PieceColor | null;
  evalScore: number;
}

interface UseMoveNavigationProps {
  moveHistory: Move[];
  liveBoard: (Piece | null)[][];
  liveTurn: PieceColor;
  liveLastMove: Move | null;
  liveCapturedWhite: Piece[];
  liveCapturedBlack: Piece[];
  liveInCheck: PieceColor | null;
  onFlipBoard?: () => void;
  enabled?: boolean;
  playMove?: () => void;
  playCapture?: () => void;
  playPieceMove?: (pieceType: string, isOpponent?: boolean) => void;
}

export function useMoveNavigation({
  moveHistory,
  liveBoard,
  liveTurn,
  liveLastMove,
  liveCapturedWhite,
  liveCapturedBlack,
  liveInCheck,
  onFlipBoard,
  enabled = true,
  playMove,
  playCapture,
  playPieceMove,
}: UseMoveNavigationProps) {
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const playMoveAudio = useCallback(
    (move?: Move | null) => {
      if (!move) {
        playMove?.();
        return;
      }
      if (move.captured) {
        if (playCapture) playCapture();
        else if (playMove) playMove();
      } else {
        if (playPieceMove) playPieceMove(move.piece.type, move.piece.color === 'black');
        else if (playMove) playMove();
      }
    },
    [playMove, playCapture, playPieceMove]
  );

  const snapshots = useMemo<BoardSnapshot[]>(() => {
    const initialBoard = createInitialBoard();
    const list: BoardSnapshot[] = [
      {
        board: initialBoard,
        turn: 'white',
        lastMove: null,
        capturedWhite: [],
        capturedBlack: [],
        inCheck: null,
        evalScore: 0,
      },
    ];

    let currentBoard = initialBoard;
    const capWhite: Piece[] = [];
    const capBlack: Piece[] = [];

    for (let i = 0; i < moveHistory.length; i++) {
      const move = moveHistory[i];
      const { newBoard, moveRecord } = executeMove(currentBoard, move.from, move.to);
      currentBoard = newBoard;

      if (moveRecord.captured) {
        if (moveRecord.piece.color === 'white') {
          capWhite.push(moveRecord.captured);
        } else {
          capBlack.push(moveRecord.captured);
        }
      }

      const nextTurn: PieceColor = i % 2 === 0 ? 'black' : 'white';
      const checkColor = isKingInCheck(newBoard, nextTurn) ? nextTurn : null;
      const rawEval = evaluateBoard(newBoard, 'white');
      const evalScore = Number((rawEval / 100).toFixed(1));

      list.push({
        board: newBoard,
        turn: nextTurn,
        lastMove: move,
        capturedWhite: [...capWhite],
        capturedBlack: [...capBlack],
        inCheck: checkColor,
        evalScore,
      });
    }

    return list;
  }, [moveHistory]);

  useEffect(() => {
    if (moveHistory.length === 0) {
      setSelectedMoveIndex(null);
      setIsPlaying(false);
    }
  }, [moveHistory.length]);

  const goToFirst = useCallback(() => {
    setIsPlaying(false);
    setSelectedMoveIndex(prev => {
      if (prev !== -1) {
        playMove?.();
      }
      return -1;
    });
  }, [playMove]);

  const goToPrevious = useCallback(() => {
    setIsPlaying(false);
    setSelectedMoveIndex(prev => {
      if (prev === null) {
        if (moveHistory.length === 0) return -1;
        playMove?.();
        return Math.max(-1, moveHistory.length - 2);
      }
      if (prev <= -1) return -1;
      playMove?.();
      return prev - 1;
    });
  }, [moveHistory.length, playMove]);

  const goToNext = useCallback(() => {
    setIsPlaying(false);
    setSelectedMoveIndex(prev => {
      if (prev === null) return null;
      if (prev === -1) {
        if (moveHistory.length === 0) return null;
        playMoveAudio(moveHistory[0]);
        if (moveHistory.length === 1) return null;
        return 0;
      }
      const nextIndex = prev + 1;
      if (nextIndex < moveHistory.length) {
        playMoveAudio(moveHistory[nextIndex]);
      } else {
        playMove?.();
      }
      if (prev >= moveHistory.length - 2) {
        return null;
      }
      return nextIndex;
    });
  }, [moveHistory, playMoveAudio, playMove]);

  const goToLast = useCallback(() => {
    setIsPlaying(false);
    setSelectedMoveIndex(prev => {
      if (prev !== null) {
        const lastM = moveHistory[moveHistory.length - 1];
        playMoveAudio(lastM);
      }
      return null;
    });
  }, [moveHistory, playMoveAudio]);

  const returnToLive = goToLast;

  const selectMove = useCallback(
    (index: number | null) => {
      setIsPlaying(false);
      if (index === null || index >= moveHistory.length - 1) {
        const lastM = moveHistory[moveHistory.length - 1];
        playMoveAudio(lastM);
        setSelectedMoveIndex(null);
      } else if (index === -1) {
        playMove?.();
        setSelectedMoveIndex(-1);
      } else {
        const m = moveHistory[index];
        playMoveAudio(m);
        setSelectedMoveIndex(index);
      }
    },
    [moveHistory, playMoveAudio, playMove]
  );

  const togglePlay = useCallback(() => {
    if (moveHistory.length === 0) return;

    setIsPlaying(prev => {
      if (prev) return false;

      setSelectedMoveIndex(current => {
        if (current === null || current >= moveHistory.length - 1) {
          playMove?.();
          return -1;
        }
        return current;
      });
      return true;
    });
  }, [moveHistory.length, playMove]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSelectedMoveIndex(prev => {
        if (prev === null) {
          setIsPlaying(false);
          return null;
        }
        if (prev === -1) {
          if (moveHistory.length === 0) {
            setIsPlaying(false);
            return null;
          }
          playMoveAudio(moveHistory[0]);
          if (moveHistory.length === 1) {
            setIsPlaying(false);
            return null;
          }
          return 0;
        }
        const nextIndex = prev + 1;
        if (nextIndex < moveHistory.length) {
          playMoveAudio(moveHistory[nextIndex]);
        }
        if (prev >= moveHistory.length - 2) {
          setIsPlaying(false);
          return null;
        }
        return nextIndex;
      });
    }, 750);

    return () => clearInterval(interval);
  }, [isPlaying, moveHistory, playMoveAudio]);

  const isEnabledRef = useRef(enabled);
  useEffect(() => {
    isEnabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEnabledRef.current) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowUp':
        case 'Home':
          e.preventDefault();
          goToFirst();
          break;
        case 'ArrowDown':
        case 'End':
          e.preventDefault();
          goToLast();
          break;
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
        case 'F':
        case 'x':
        case 'X':
          if (onFlipBoard) {
            e.preventDefault();
            onFlipBoard();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, goToFirst, goToLast, togglePlay, onFlipBoard]);

  const isReviewing =
    selectedMoveIndex !== null &&
    (selectedMoveIndex < moveHistory.length - 1 || selectedMoveIndex === -1);

  const currentSnapshot = useMemo(() => {
    if (selectedMoveIndex === null) return null;
    const snapIndex = Math.max(0, Math.min(snapshots.length - 1, selectedMoveIndex + 1));
    return snapshots[snapIndex] || null;
  }, [selectedMoveIndex, snapshots]);

  const displayedBoard = currentSnapshot ? currentSnapshot.board : liveBoard;
  const displayedTurn = currentSnapshot ? currentSnapshot.turn : liveTurn;
  const displayedLastMove = currentSnapshot ? currentSnapshot.lastMove : liveLastMove;
  const displayedCapturedWhite = currentSnapshot
    ? currentSnapshot.capturedWhite
    : liveCapturedWhite;
  const displayedCapturedBlack = currentSnapshot
    ? currentSnapshot.capturedBlack
    : liveCapturedBlack;
  const displayedInCheck = currentSnapshot ? currentSnapshot.inCheck : liveInCheck;
  const displayedEvalScore = currentSnapshot
    ? currentSnapshot.evalScore
    : Number((evaluateBoard(liveBoard, 'white') / 100).toFixed(1));

  const canGoBack =
    moveHistory.length > 0 && (selectedMoveIndex === null || selectedMoveIndex > -1);
  const canGoForward = selectedMoveIndex !== null;

  return {
    selectedMoveIndex,
    isReviewing,
    isPlaying,
    displayedBoard,
    displayedTurn,
    displayedLastMove,
    displayedCapturedWhite,
    displayedCapturedBlack,
    displayedInCheck,
    displayedEvalScore,
    canGoBack,
    canGoForward,
    goToFirst,
    goToPrevious,
    goToNext,
    goToLast,
    returnToLive,
    selectMove,
    togglePlay,
  };
}
