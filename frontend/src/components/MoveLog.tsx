import React, { useRef, useEffect } from 'react';
import type { Move } from '../types/game';

interface MoveLogProps {
  moves: Move[];
}

export const MoveLog: React.FC<MoveLogProps> = ({ moves }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [moves]);

  // Group moves into pairs (White move, Black move)
  const pairedMoves: { num: number; white: Move; black?: Move }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairedMoves.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="w-full glass-panel rounded-xl p-3 flex flex-col h-48 sm:h-56">
      <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2 mb-2">
        <h3 className="text-xs font-serif uppercase tracking-widest text-[#d4af37] font-bold">
          Battle Chronicle (Moves)
        </h3>
        <span className="text-[10px] text-amber-200/50 font-mono">
          {moves.length} Half-turns
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs select-text"
      >
        {pairedMoves.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[11px] text-amber-200/40 italic font-serif">
            Opening clash awaits...
          </div>
        ) : (
          pairedMoves.map(pair => (
            <div
              key={pair.num}
              className="grid grid-cols-7 py-1 px-1.5 rounded hover:bg-amber-500/10 text-amber-100/90 transition-colors"
            >
              <span className="col-span-1 text-amber-400/60">{pair.num}.</span>
              <span className="col-span-3 font-semibold text-amber-100">
                {pair.white.san}
              </span>
              <span className="col-span-3 text-amber-200/80">
                {pair.black ? pair.black.san : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
