import React from 'react';
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
}

export const AshtapadaBoard: React.FC<AshtapadaBoardProps> = ({
  board,
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
}) => {
  // Perspective
  const isFlipped = playerColor === 'black';
  const rowIndices = isFlipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const colIndices = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

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

  // Evaluation bar height: 50% is even, range -15 to +15
  const clampedEval = Math.max(-15, Math.min(15, evaluationScore));
  const whiteEvalPct = 50 + (clampedEval / 30) * 100;

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Seamless Eval Bar (Directly attached to the left with zero gap) */}
      {showEvalBar && (
        <div className="relative w-3 sm:w-3.5 h-[340px] sm:h-[480px] md:h-[540px] lg:h-[560px] rounded-l overflow-hidden bg-[#1a1815] border-y border-l border-[#3a352f] flex flex-col justify-end shadow-md">
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
      <div className={`relative overflow-hidden border border-[#2b2723] shadow-2xl bg-[#1d1b18] ${showEvalBar ? 'rounded-r' : 'rounded'}`}>
        <div className="grid grid-cols-8 grid-rows-8 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] md:w-[540px] md:h-[540px] lg:w-[560px] lg:h-[560px] aspect-square">
          {rowIndices.map(row =>
            colIndices.map(col => {
              const piece = board[row][col];
              const isTarget = isLegalTarget(col, row);
              const selected = isSelected(col, row);
              const isMoveFrom = isLastMoveFrom(col, row);
              const isMoveTo = isLastMoveTo(col, row);

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
                  onClick={() => interactive && onSquareClick({ col, row })}
                  className={`relative flex items-center justify-center cursor-pointer select-none transition-colors duration-100 ${baseBg}`}
                >
                  {/* Selected Square Highlight (Classic clean yellow-gold tile overlay) */}
                  {selected && (
                    <div className="absolute inset-0 bg-[#f59e0b]/35 pointer-events-none" />
                  )}

                  {/* Previous Move Source square highlight */}
                  {isMoveFrom && !selected && (
                    <div className="absolute inset-0 bg-[#d97706]/25 pointer-events-none" />
                  )}

                  {/* Previous Move Destination highlight: Bold Neon Green Ring (as seen on c8 in reference) */}
                  {isMoveTo && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                      <div className="w-[90%] h-[90%] rounded-full border-[3px] border-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.7)]" />
                    </div>
                  )}

                  {/* Coordinates inside corners */}
                  {col === (isFlipped ? 7 : 0) && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] font-sans font-bold leading-none select-none pointer-events-none ${labelColor}`}
                    >
                      {row + 1}
                    </span>
                  )}
                  {row === (isFlipped ? 7 : 0) && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] font-sans font-bold leading-none select-none pointer-events-none lowercase ${labelColor}`}
                    >
                      {String.fromCharCode(97 + col)}
                    </span>
                  )}

                  {/* Move Target Indicators */}
                  {isTarget && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      {piece ? (
                        // Target capture ring
                        <div className="w-[92%] h-[92%] rounded-full border-[3px] border-red-500 bg-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                      ) : (
                        // Clean glowing green destination dot matching reference
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#84cc16] shadow-[0_0_12px_rgba(132,204,22,0.9)] opacity-85" />
                      )}
                    </div>
                  )}

                  {/* Attacked or Fallen King Crimson Glow (as seen on d1 in reference) */}
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
                    <div className="relative z-10 flex items-center justify-center w-full h-full">
                      <PieceIcon
                        type={piece.type}
                        color={piece.color}
                        fallen={isFallenKing}
                        size={window.innerWidth < 640 ? 40 : 58}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
