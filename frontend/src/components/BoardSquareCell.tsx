import React from 'react';
import type { Piece } from '../types/game';
import { isAshtapadaMark } from '../types/game';
import { PieceIcon } from './PieceIcon';

export interface SquareVisualState {
  isLight: boolean;
  isSelected: boolean;
  isMoveFrom: boolean;
  isMoveTo: boolean;
  isTarget: boolean;
  isHoveredTarget: boolean;
  isSourceBeingDragged: boolean;
  isFallenKing: boolean;
  isCheckKing: boolean;
  canDrag: boolean;
  hasMoved: boolean;
  isFlipped: boolean;
}

interface BoardSquareCellProps {
  col: number;
  row: number;
  piece: Piece | null;
  state: SquareVisualState;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

function getCursorClass(canDrag: boolean, hasMoved: boolean, isTarget: boolean): string {
  if (canDrag) return hasMoved ? 'cursor-grabbing' : 'cursor-grab';
  if (isTarget) return 'cursor-pointer';
  return 'cursor-default';
}

const AshtapadaInlay: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-1.5 opacity-30 select-none z-0">
    <svg viewBox="0 0 100 100" className="w-full h-full text-amber-950 dark:text-[#d4af37]">
      <line x1="12" y1="12" x2="88" y2="88" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="88" y1="12" x2="12" y2="88" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 24 L12 12 L24 12 M76 12 L88 12 L88 24 M88 76 L88 88 L76 88 M24 88 L12 88 L12 76" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <polygon points="50,42 58,50 50,58 42,50" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  </div>
);

const SquareHighlights: React.FC<{ state: SquareVisualState }> = ({ state }) => (
  <>
    {state.isSelected && <div className="absolute inset-0 bg-[#f59e0b]/35 pointer-events-none z-10" />}
    {state.isMoveFrom && !state.isSelected && <div className="absolute inset-0 bg-[#d97706]/25 pointer-events-none z-10" />}
    {state.isMoveTo && (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
        <div className="w-[90%] h-[90%] rounded-full border-[3px] border-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.7)]" />
      </div>
    )}
    {state.isHoveredTarget && (
      <div className="absolute inset-0 bg-[#84cc16]/30 border-2 border-[#84cc16] shadow-[inset_0_0_12px_rgba(132,204,22,0.5)] z-30 pointer-events-none" />
    )}
  </>
);

const SquareCoordinates: React.FC<{
  showRank: boolean;
  showFile: boolean;
  labelColor: string;
  row: number;
  col: number;
}> = ({ showRank, showFile, labelColor, row, col }) => (
  <>
    {showRank && (
      <span className={`absolute top-0.5 left-1 text-[10px] sm:text-[11px] font-sans font-bold leading-none select-none pointer-events-none z-10 ${labelColor}`}>
        {row + 1}
      </span>
    )}
    {showFile && (
      <span className={`absolute bottom-0.5 right-1 text-[10px] sm:text-[11px] font-sans font-bold leading-none select-none pointer-events-none lowercase z-10 ${labelColor}`}>
        {String.fromCharCode(97 + col)}
      </span>
    )}
  </>
);

const TargetIndicator: React.FC<{ hasPiece: boolean }> = ({ hasPiece }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
    {hasPiece ? (
      <div className="w-[90%] h-[90%] rounded-full border-[3px] border-red-500 bg-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
    ) : (
      <div className="w-[28%] h-[28%] max-w-6 max-h-6 min-w-3 min-h-3 rounded-full bg-[#84cc16] shadow-[0_0_12px_rgba(132,204,22,0.9)] opacity-85" />
    )}
  </div>
);

const ThreatenedKingGlow: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center animate-pulse">
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(circle, rgba(239, 68, 68, 0.85) 0%, rgba(220, 38, 38, 0.35) 60%, transparent 85%)',
      }}
    />
    <div className="w-[110%] h-[110%] rounded-full border border-red-500/60 animate-spin [animation-duration:9s] opacity-70" />
  </div>
);

export const BoardSquareCell: React.FC<BoardSquareCellProps> = ({
  col,
  row,
  piece,
  state,
  onPointerDown,
}) => {
  const {
    isLight,
    isTarget,
    isSourceBeingDragged,
    isFallenKing,
    isCheckKing,
    canDrag,
    hasMoved,
    isFlipped,
  } = state;

  const baseBg = isLight ? 'bg-[#efdfc8]' : 'bg-[#b58863]';
  const labelColor = isLight ? 'text-[#8a684b]' : 'text-[#efdfc8]';
  const cursorStyle = getCursorClass(canDrag, hasMoved, isTarget);

  return (
    <div
      onPointerDown={onPointerDown}
      onDragStart={e => e.preventDefault()}
      className={`relative flex items-center justify-center select-none transition-colors duration-100 ${baseBg} ${cursorStyle}`}
    >
      {isAshtapadaMark(col, row) && <AshtapadaInlay />}

      <SquareHighlights state={state} />

      <SquareCoordinates
        showRank={col === (isFlipped ? 7 : 0)}
        showFile={row === (isFlipped ? 7 : 0)}
        labelColor={labelColor}
        row={row}
        col={col}
      />

      {isTarget && <TargetIndicator hasPiece={Boolean(piece)} />}

      {(isFallenKing || isCheckKing) && <ThreatenedKingGlow />}

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
};
