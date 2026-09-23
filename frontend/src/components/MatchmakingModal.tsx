import React, { useState, useEffect } from 'react';
import { X, Swords } from 'lucide-react';

interface MatchmakingModalProps {
  isOpen: boolean;
  onCancel: () => void;
  playerName: string;
  rating?: number;
  picture?: string | null;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onCancel,
  playerName,
  rating,
  picture,
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#1a1815] border border-[#2e2a24] shadow-2xl p-6 flex flex-col items-center text-center text-[#e3ded7]">
        {/* Close / Cancel corner button */}
        <button
          onClick={onCancel}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-[#8a857d] hover:text-white hover:bg-[#262421] transition-colors"
          title="Cancel search"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pulsing Radar / Swords Icon */}
        <div className="relative w-20 h-20 flex items-center justify-center my-2">
          <span className="absolute inset-0 rounded-full bg-[#d4af37]/15 animate-ping duration-1000" />
          <span className="absolute inset-1.5 rounded-full border-2 border-[#d4af37]/30 animate-pulse" />
          <div className="w-14 h-14 rounded-full bg-[#201e1b] border border-[#d4af37]/60 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            <Swords className="w-6 h-6 text-[#fcd34d]" />
          </div>
        </div>

        {/* Title & Status */}
        <h3 className="font-serif font-bold text-lg text-white tracking-wide mt-2">
          Searching for Opponent...
        </h3>
        <p className="text-xs text-[#8a857d] mt-1 max-w-[240px]">
          Matching you with a player across the realm.
        </p>

        {/* Elapsed Timer Counter */}
        <div className="mt-4 px-3.5 py-1 rounded-full bg-[#262421] border border-[#38332b] text-xs font-mono font-semibold text-[#fcd34d] tracking-wider">
          {formatTime(seconds)}
        </div>

        {/* Player Info Badge */}
        <div className="w-full mt-5 p-2.5 rounded-xl bg-[#201e1b] border border-[#2c2823] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full border border-[#d4af37]/40 bg-[#2a241c] overflow-hidden flex items-center justify-center text-sm shrink-0">
              {picture ? (
                <img src={picture} alt={playerName} className="w-full h-full object-cover" />
              ) : (
                <span>👑</span>
              )}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-white truncate max-w-[130px]">{playerName}</p>
              <p className="text-[10px] text-[#8a857d]">Rating: {rating ?? 1500}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>In Queue</span>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="w-full mt-4 py-2.5 rounded-xl bg-[#262421] hover:bg-red-950/40 text-[#b5b0a8] hover:text-red-300 border border-[#332e27] hover:border-red-800/50 text-xs font-semibold transition-all duration-150 cursor-pointer shadow active:scale-98"
        >
          Cancel Search
        </button>
      </div>
    </div>
  );
};
