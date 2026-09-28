import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Piece, PieceColor, SquareCoord, Move } from '../types/game';
import { PieceIcon } from './PieceIcon';
import { BoardSquareCell } from './BoardSquareCell';

interface AshtapadaBoardProps {
  board: (Piece | null)[][];
  turn: PieceColor;
  playerColor?: PieceColor;
  legalMoves: SquareCoord[];
  selectedSquare: SquareCoord | null;
  lastMove: Move | null;
  inCheck: PieceColor | null;
  isResignedOrMated?: PieceColor | null;
  evaluationScore?: number;
  showEvalBar?: boolean;
  interactive?: boolean;
  onSquareClick: (coord: SquareCoord) => void;
  onMove?: (from: SquareCoord, to: SquareCoord) => void;
}

interface DragState {
  from: SquareCoord;
  piece: Piece;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  hasMoved: boolean;
  squareSize: number;
}

export const AshtapadaBoard: React.FC<AshtapadaBoardProps> = ({
  board,
  turn,
  playerColor = 'white',
  legalMoves,
  selectedSquare,
  lastMove,
  inCheck,
  isResignedOrMated,
  evaluationScore = 0,
  showEvalBar = true,
  interactive = true,
  onSquareClick,
  onMove,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef(dragState);
  const onMoveRef = useRef(onMove);
  const onSquareClickRef = useRef(onSquareClick);

  useEffect(() => {
    onMoveRef.current = onMove;
    onSquareClickRef.current = onSquareClick;
  });

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // Perspective
  const isFlipped = playerColor === 'black';
  const rowIndices = useMemo(
    () => (isFlipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]),
    [isFlipped]
  );
  const colIndices = useMemo(
    () => (isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]),
    [isFlipped]
  );

  const isLegalTarget = (c: number, r: number) => {
    return legalMoves.some(m => m.col === c && m.row === r);
  };


  const isSelected = (c: number, r: number) => {
    return selectedSquare?.col === c && selectedSquare?.row === r;
  };

  const isLastMoveFrom = (c: number, r: number) => {
    return lastMove?.from.col === c && lastMove?.from.row === r;
  };

  const isLastMoveTo = (c: number, r: number) => {
    return lastMove?.to.col === c && lastMove?.to.row === r;
  };

  // Drag listeners
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      setDragState(prev => {
        if (!prev) return null;
        const dist = Math.hypot(e.clientX - prev.startPos.x, e.clientY - prev.startPos.y);
        return {
          ...prev,
          currentPos: { x: e.clientX, y: e.clientY },
          hasMoved: prev.hasMoved || dist > 4,
        };
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      const prev = dragStateRef.current;
      setDragState(null);
      if (!prev) return;

      if (prev.hasMoved && boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const colIdx = Math.floor(((e.clientX - rect.left) / rect.width) * 8);
          const rowIdx = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
          if (colIdx >= 0 && colIdx < 8 && rowIdx >= 0 && rowIdx < 8) {
            const targetCol = colIndices[colIdx];
            const targetRow = rowIndices[rowIdx];
            const targetCoord = { col: targetCol, row: targetRow };

            if (targetCol === prev.from.col && targetRow === prev.from.row) {
              // Dropped on same square -> stay selected
            } else {
              if (onMoveRef.current) {
                onMoveRef.current(prev.from, targetCoord);
              } else {
                onSquareClickRef.current(targetCoord);
              }
            }
          }
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState, colIndices, rowIndices]);

  // Current hovered square during drag
  const hoveredSquare = useMemo(() => {
    if (!dragState || !dragState.hasMoved || !boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const { x, y } = dragState.currentPos;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
    const colIdx = Math.floor(((x - rect.left) / rect.width) * 8);
    const rowIdx = Math.floor(((y - rect.top) / rect.height) * 8);
    if (colIdx < 0 || colIdx >= 8 || rowIdx < 0 || rowIdx >= 8) return null;
    return { col: colIndices[colIdx], row: rowIndices[rowIdx] };
  }, [dragState, colIndices, rowIndices]);

  // Handle pointer down on a square
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    col: number,
    row: number,
    piece: Piece | null
  ) => {
    if (!interactive) return;
    if (e.button !== 0) return; // Left-click only

    const coord = { col, row };

    // If an existing piece is selected and clicking a legal target, perform move
    if (selectedSquare && legalMoves.some(m => m.col === col && m.row === row)) {
      if (onMove) {
        onMove(selectedSquare, coord);
      } else {
        onSquareClick(coord);
      }
      return;
    }

    // Start dragging own piece
    if (piece && piece.color === turn) {
      onSquareClick(coord);

      const rect = boardRef.current?.getBoundingClientRect();
      const sqSize = rect ? rect.width / 8 : 64;

      setDragState({
        from: coord,
        piece,
        startPos: { x: e.clientX, y: e.clientY },
        currentPos: { x: e.clientX, y: e.clientY },
        hasMoved: false,
        squareSize: sqSize,
      });
    } else {
      onSquareClick(coord);
    }
  };

  // Evaluation bar height: 50% is even, range -15 to +15
  const clampedEval = Math.max(-15, Math.min(15, evaluationScore));
  const whiteEvalPct = 50 + (clampedEval / 30) * 100;

  return (
    <div
      className="relative flex items-center justify-center select-none shrink-0"
      style={{
        width: showEvalBar ? 'calc(var(--board-size) + 14px)' : 'var(--board-size)',
        height: 'var(--board-size)',
      }}
    >
      {/* Seamless Eval Bar (Directly attached to the left with zero gap) */}
      {showEvalBar && (
        <div
          className="relative w-3.5 rounded-l overflow-hidden bg-[#1a1815] border-y border-l border-[#3a352f] flex flex-col justify-end shadow-md shrink-0"
          style={{ height: 'var(--board-size)' }}
        >
          {/* White height fill */}
          <div
            className="w-full bg-[#efdfc8] transition-[height] duration-400 ease-out"
            style={{ height: `${whiteEvalPct}%` }}
          />
          {/* Numerical label */}
          <div className="absolute bottom-0.5 left-0 right-0 text-[8px] font-mono font-bold text-center text-zinc-900 pointer-events-none">
            {Math.abs(evaluationScore).toFixed(1)}
          </div>
        </div>
      )}

      {/* 8x8 Chessboard */}
      <div
        ref={boardRef}
        className={`relative overflow-hidden border border-[#2b2723] shadow-2xl bg-[#1d1b18] shrink-0 touch-none ${showEvalBar ? 'rounded-r' : 'rounded'}`}
        style={{ width: 'var(--board-size)', height: 'var(--board-size)' }}
      >
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full aspect-square">
          {rowIndices.map(row =>
            colIndices.map(col => {
              const piece = board[row][col];
              const isTarget = isLegalTarget(col, row);
              const selected = isSelected(col, row);
              const isMoveFrom = isLastMoveFrom(col, row);
              const isMoveTo = isLastMoveTo(col, row);

              const isOwnPiece = Boolean(piece && piece.color === turn);
              const canDrag = interactive && isOwnPiece;
              const isHoveredTarget =
                hoveredSquare?.col === col &&
                hoveredSquare?.row === row &&
                isLegalTarget(col, row);
              const isSourceBeingDragged = Boolean(
                dragState?.hasMoved &&
                dragState.from.col === col &&
                dragState.from.row === row
              );

              // Resigned or checkmated king (tipped sideways with crimson glow)
              const isFallenKing =
                Boolean(isResignedOrMated) &&
                piece?.type === 'raja' &&
                piece?.color === isResignedOrMated;

              const isCheckKing =
                !isFallenKing &&
                inCheck !== null &&
                piece?.type === 'raja' &&
                piece?.color === inCheck;

              const isLight = (row + col) % 2 === 1;

              return (
                <BoardSquareCell
                  key={`${col}-${row}`}
                  col={col}
                  row={row}
                  piece={piece}
                  state={{
                    isLight,
                    isSelected: selected,
                    isMoveFrom,
                    isMoveTo,
                    isTarget,
                    isHoveredTarget: Boolean(isHoveredTarget),
                    isSourceBeingDragged,
                    isFallenKing: Boolean(isFallenKing),
                    isCheckKing: Boolean(isCheckKing),
                    canDrag,
                    hasMoved: Boolean(dragState?.hasMoved),
                    isFlipped,
                  }}
                  onPointerDown={e => handlePointerDown(e, col, row, piece)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Floating Dragged Piece following cursor */}
      {dragState && dragState.hasMoved && (
        <div
          className="fixed pointer-events-none z-50 flex items-center justify-center cursor-grabbing"
          style={{
            left: dragState.currentPos.x,
            top: dragState.currentPos.y,
            width: dragState.squareSize,
            height: dragState.squareSize,
            transform: 'translate(-50%, -50%) scale(1.15)',
            filter: 'drop-shadow(0 14px 24px rgba(0,0,0,0.65))',
          }}
        >
          <div className="w-[82%] h-[82%] flex items-center justify-center">
            <PieceIcon
              type={dragState.piece.type}
              color={dragState.piece.color}
            />
          </div>
        </div>
      )}
    </div>
  );
};
