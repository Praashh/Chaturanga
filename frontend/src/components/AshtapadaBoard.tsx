import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Piece, PieceColor, SquareCoord, Move } from '../types/game';
import { PieceIcon } from './PieceIcon';

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
      setDragState(prev => {
        if (!prev) return null;

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
                if (onMove) {
                  onMove(prev.from, targetCoord);
                } else {
                  onSquareClick(targetCoord);
                }
              }
            }
          }
        }
        return null;
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState, colIndices, rowIndices, onMove, onSquareClick]);

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
            className="w-full bg-[#efdfc8] transition-all duration-400 ease-out"
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
              const isSourceBeingDragged =
                dragState?.hasMoved &&
                dragState.from.col === col &&
                dragState.from.row === row;

              const cursorStyle = canDrag
                ? dragState?.hasMoved
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : isTarget
                ? 'cursor-pointer'
                : 'cursor-default';

              // Resigned or checkmated king (tipped sideways with crimson glow)
              const isFallenKing =
                Boolean(isResignedOrMated) &&
                piece?.type === 'raja' &&
                piece?.color === isResignedOrMated;

              const isCheckKing =
                !isFallenKing &&
                inCheck &&
                piece?.type === 'raja' &&
                piece?.color === inCheck;

              // Tile colors matching the reference screenshot
              const isLight = (row + col) % 2 === 1;
              const baseBg = isLight ? 'bg-[#efdfc8]' : 'bg-[#b58863]';
              const labelColor = isLight ? 'text-[#8a684b]' : 'text-[#efdfc8]';

              return (
                <div
                  key={`${col}-${row}`}
                  onPointerDown={e => handlePointerDown(e, col, row, piece)}
                  onDragStart={e => e.preventDefault()}
                  className={`relative flex items-center justify-center select-none transition-colors duration-100 ${baseBg} ${cursorStyle}`}
                >
                  {/* Selected Square Highlight (Classic clean yellow-gold tile overlay) */}
                  {selected && (
                    <div className="absolute inset-0 bg-[#f59e0b]/35 pointer-events-none" />
                  )}

                  {/* Previous Move Source square highlight */}
                  {isMoveFrom && !selected && (
                    <div className="absolute inset-0 bg-[#d97706]/25 pointer-events-none" />
                  )}

                  {/* Previous Move Destination highlight: Bold Neon Green Ring */}
                  {isMoveTo && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                      <div className="w-[90%] h-[90%] rounded-full border-[3px] border-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.7)]" />
                    </div>
                  )}

                  {/* Drag Hover Target Glow Highlight */}
                  {isHoveredTarget && (
                    <div className="absolute inset-0 bg-[#84cc16]/30 border-2 border-[#84cc16] shadow-[inset_0_0_12px_rgba(132,204,22,0.5)] z-30 pointer-events-none" />
                  )}

                  {/* Coordinates inside corners */}
                  {col === (isFlipped ? 7 : 0) && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] sm:text-[11px] font-sans font-bold leading-none select-none pointer-events-none ${labelColor}`}
                    >
                      {row + 1}
                    </span>
                  )}
                  {row === (isFlipped ? 7 : 0) && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] sm:text-[11px] font-sans font-bold leading-none select-none pointer-events-none lowercase ${labelColor}`}
                    >
                      {String.fromCharCode(97 + col)}
                    </span>
                  )}

                  {/* Move Target Indicators */}
                  {isTarget && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      {piece ? (
                        // Target capture ring
                        <div className="w-[90%] h-[90%] rounded-full border-[3px] border-red-500 bg-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                      ) : (
                        // Clean glowing green destination dot
                        <div className="w-[28%] h-[28%] max-w-6 max-h-6 min-w-3 min-h-3 rounded-full bg-[#84cc16] shadow-[0_0_12px_rgba(132,204,22,0.9)] opacity-85" />
                      )}
                    </div>
                  )}

                  {/* Attacked or Fallen King Crimson Glow */}
                  {(isFallenKing || isCheckKing) && (
                    <div
                      className="absolute inset-0 pointer-events-none z-10 animate-pulse"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(239, 68, 68, 0.85) 0%, rgba(220, 38, 38, 0.35) 60%, transparent 85%)',
                      }}
                    />
                  )}

                  {/* The Piece */}
                  {piece && (
                    <div
                      className={`relative z-10 flex items-center justify-center w-full h-full p-0.5 sm:p-1 transition-opacity duration-150 ${
                        isSourceBeingDragged ? 'opacity-30' : 'opacity-100'
                      }`}
                    >
                      <PieceIcon
                        type={piece.type}
                        color={piece.color}
                        fallen={isFallenKing}
                      />
                    </div>
                  )}
                </div>
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
