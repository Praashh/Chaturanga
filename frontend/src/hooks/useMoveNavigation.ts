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

function computeSnapshots(moveHistory: Move[]): BoardSnapshot[] {
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
}

interface KeyboardShortcutsProps {
  enabled: boolean;
  goToFirst: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  goToLast: () => void;
  togglePlay: () => void;
  onFlipBoard?: () => void;
}

function useMoveKeyboardShortcuts({
  enabled,
  goToFirst,
  goToPrevious,
  goToNext,
  goToLast,
  togglePlay,
  onFlipBoard,
}: KeyboardShortcutsProps) {
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
}

interface AutoPlayProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  moveHistory: Move[];
  selectedMoveIndexRef: React.RefObject<number | null>;
  setSelectedMoveIndex: (index: number | null) => void;
  playMoveAudio: (move?: Move | null) => void;
}

function useAutoPlay({
  isPlaying,
  setIsPlaying,
  moveHistory,
  selectedMoveIndexRef,
  setSelectedMoveIndex,
  playMoveAudio,
}: AutoPlayProps) {
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const current = selectedMoveIndexRef.current;
      if (current === null) {
        setIsPlaying(false);
        return;
      }
      if (current === -1) {
        if (moveHistory.length === 0) {
          setIsPlaying(false);
          return;
        }
        playMoveAudio(moveHistory[0]);
        if (moveHistory.length === 1) {
          setIsPlaying(false);
          setSelectedMoveIndex(null);
          return;
        }
        setSelectedMoveIndex(0);
        return;
      }
      const nextIndex = current + 1;
      if (nextIndex < moveHistory.length) {
        playMoveAudio(moveHistory[nextIndex]);
      }
      if (current >= moveHistory.length - 2) {
        setIsPlaying(false);
        setSelectedMoveIndex(null);
      } else {
        setSelectedMoveIndex(nextIndex);
      }
    }, 750);

    return () => clearInterval(interval);
  }, [isPlaying, moveHistory, playMoveAudio, selectedMoveIndexRef, setIsPlaying, setSelectedMoveIndex]);
}

interface NavigationActionsProps {
  moveHistory: Move[];
  playMove?: () => void;
  playMoveAudio: (move?: Move | null) => void;
  selectedMoveIndexRef: React.RefObject<number | null>;
  setSelectedMoveIndex: (index: number | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

function useNavigationActions({
  moveHistory,
  playMove,
  playMoveAudio,
  selectedMoveIndexRef,
  setSelectedMoveIndex,
  isPlaying,
  setIsPlaying,
}: NavigationActionsProps) {
  const goToFirst = useCallback(() => {
    setIsPlaying(false);
    if (selectedMoveIndexRef.current !== -1) {
      playMove?.();
    }
    setSelectedMoveIndex(-1);
  }, [playMove, selectedMoveIndexRef, setIsPlaying, setSelectedMoveIndex]);

  const goToPrevious = useCallback(() => {
    setIsPlaying(false);
    const current = selectedMoveIndexRef.current;
    if (current === null) {
      if (moveHistory.length === 0) return;
      playMove?.();
      setSelectedMoveIndex(Math.max(-1, moveHistory.length - 2));
    } else if (current <= -1) {
      setSelectedMoveIndex(-1);
    } else {
      playMove?.();
      setSelectedMoveIndex(current - 1);
    }
  }, [moveHistory.length, playMove, selectedMoveIndexRef, setIsPlaying, setSelectedMoveIndex]);

  const goToNext = useCallback(() => {
    setIsPlaying(false);
    const current = selectedMoveIndexRef.current;
    if (current === null) return;
    if (current === -1) {
      if (moveHistory.length === 0) return;
      playMoveAudio(moveHistory[0]);
      if (moveHistory.length === 1) {
        setSelectedMoveIndex(null);
      } else {
        setSelectedMoveIndex(0);
      }
      return;
    }
    const nextIndex = current + 1;
    if (nextIndex < moveHistory.length) {
      playMoveAudio(moveHistory[nextIndex]);
    } else {
      playMove?.();
    }
    if (current >= moveHistory.length - 2) {
      setSelectedMoveIndex(null);
    } else {
      setSelectedMoveIndex(nextIndex);
    }
  }, [moveHistory, playMoveAudio, playMove, selectedMoveIndexRef, setIsPlaying, setSelectedMoveIndex]);

  const goToLast = useCallback(() => {
    setIsPlaying(false);
    if (selectedMoveIndexRef.current !== null) {
      const lastM = moveHistory[moveHistory.length - 1];
      playMoveAudio(lastM);
    }
    setSelectedMoveIndex(null);
  }, [moveHistory, playMoveAudio, selectedMoveIndexRef, setIsPlaying, setSelectedMoveIndex]);

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
    [moveHistory, playMoveAudio, playMove, setIsPlaying, setSelectedMoveIndex]
  );

  const togglePlay = useCallback(() => {
    if (moveHistory.length === 0) return;

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const current = selectedMoveIndexRef.current;
    if (current === null || current >= moveHistory.length - 1) {
      playMove?.();
      setSelectedMoveIndex(-1);
    }
    setIsPlaying(true);
  }, [isPlaying, moveHistory.length, playMove, selectedMoveIndexRef, setIsPlaying, setSelectedMoveIndex]);

  return {
    goToFirst,
    goToPrevious,
    goToNext,
    goToLast,
    returnToLive,
    selectMove,
    togglePlay,
  };
}

function usePlayMoveAudio(
  playMove?: () => void,
  playCapture?: () => void,
  playPieceMove?: (pieceType: string, isBlack: boolean) => void
) {
  return useCallback(
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
}

function getDisplayedState(
  currentSnapshot: BoardSnapshot | null,
  liveBoard: (Piece | null)[][],
  liveTurn: PieceColor,
  liveLastMove: Move | null,
  liveCapturedWhite: Piece[],
  liveCapturedBlack: Piece[],
  liveInCheck: PieceColor | null
) {
  if (!currentSnapshot) {
    return {
      displayedBoard: liveBoard,
      displayedTurn: liveTurn,
      displayedLastMove: liveLastMove,
      displayedCapturedWhite: liveCapturedWhite,
      displayedCapturedBlack: liveCapturedBlack,
      displayedInCheck: liveInCheck,
      displayedEvalScore: Number((evaluateBoard(liveBoard, 'white') / 100).toFixed(1)),
    };
  }
  return {
    displayedBoard: currentSnapshot.board,
    displayedTurn: currentSnapshot.turn,
    displayedLastMove: currentSnapshot.lastMove,
    displayedCapturedWhite: currentSnapshot.capturedWhite,
    displayedCapturedBlack: currentSnapshot.capturedBlack,
    displayedInCheck: currentSnapshot.inCheck,
    displayedEvalScore: currentSnapshot.evalScore,
  };
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
  const [rawSelectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);
  const [rawIsPlaying, setIsPlaying] = useState<boolean>(false);

  const selectedMoveIndex =
    moveHistory.length === 0 ||
    (rawSelectedMoveIndex !== null && rawSelectedMoveIndex >= moveHistory.length - 1)
      ? null
      : rawSelectedMoveIndex;

  const isPlaying = moveHistory.length === 0 ? false : rawIsPlaying;

  const selectedMoveIndexRef = useRef<number | null>(selectedMoveIndex);
  useEffect(() => {
    selectedMoveIndexRef.current = selectedMoveIndex;
  }, [selectedMoveIndex]);

  const playMoveAudio = usePlayMoveAudio(playMove, playCapture, playPieceMove);

  const snapshots = useMemo<BoardSnapshot[]>(
    () => computeSnapshots(moveHistory),
    [moveHistory]
  );

  const {
    goToFirst,
    goToPrevious,
    goToNext,
    goToLast,
    returnToLive,
    selectMove,
    togglePlay,
  } = useNavigationActions({
    moveHistory,
    playMove,
    playMoveAudio,
    selectedMoveIndexRef,
    setSelectedMoveIndex,
    isPlaying,
    setIsPlaying,
  });

  useAutoPlay({
    isPlaying,
    setIsPlaying,
    moveHistory,
    selectedMoveIndexRef,
    setSelectedMoveIndex,
    playMoveAudio,
  });

  useMoveKeyboardShortcuts({
    enabled,
    goToFirst,
    goToPrevious,
    goToNext,
    goToLast,
    togglePlay,
    onFlipBoard,
  });

  const isReviewing =
    selectedMoveIndex !== null &&
    (selectedMoveIndex < moveHistory.length - 1 || selectedMoveIndex === -1);

  const currentSnapshot = useMemo(() => {
    if (selectedMoveIndex === null) return null;
    const snapIndex = Math.max(0, Math.min(snapshots.length - 1, selectedMoveIndex + 1));
    return snapshots[snapIndex] || null;
  }, [selectedMoveIndex, snapshots]);

  const {
    displayedBoard,
    displayedTurn,
    displayedLastMove,
    displayedCapturedWhite,
    displayedCapturedBlack,
    displayedInCheck,
    displayedEvalScore,
  } = getDisplayedState(
    currentSnapshot,
    liveBoard,
    liveTurn,
    liveLastMove,
    liveCapturedWhite,
    liveCapturedBlack,
    liveInCheck
  );

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
