import React from 'react';
import { User } from 'lucide-react';
import type { Piece } from '../types/game';

interface PlayerCardProps {
  name: string;
  rating?: number;
  avatarIcon?: string;
  avatarUrl?: string | null;
  isSelf?: boolean;
  countryFlag?: string;
  capturedPieces: Piece[];
  materialAdvantage?: number;
  isActiveTurn?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  rating = 1600,
  avatarIcon,
  avatarUrl,
  isSelf = false,
  countryFlag = '🇮🇳',
  capturedPieces,
  materialAdvantage = 0,
  isActiveTurn = false,
}) => {
  return (
    <div
      className={`w-full flex items-center justify-between py-1 px-2 rounded-md transition-colors select-none ${
        isActiveTurn ? 'bg-[#262421]/60' : 'bg-transparent'
      }`}
    >

      {/* Left: Avatar + Identity */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#2a2824] border border-[#3d3832] flex items-center justify-center text-sm overflow-hidden shadow-sm">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : avatarIcon ? (
            <span className="text-base">{avatarIcon}</span>
          ) : isSelf ? (
            <span className="text-base">🥷</span>
          ) : (
            <User className="w-4 h-4 text-[#8a857d]" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e3ded7]">
            {isSelf && countryFlag && <span>{countryFlag}</span>}
            <span>{name}</span>
            {rating && (
              <span className="text-[#8a857d] font-normal font-mono text-[11px]">
                ({rating})
              </span>
            )}
          </div>

          {/* Captured Pieces display */}
          <div className="flex items-center gap-1 text-[10px] text-[#8a857d]">
            {materialAdvantage > 0 && (
              <span className="font-mono font-bold text-[#fcd34d]">
                +{materialAdvantage}
              </span>
            )}
            {capturedPieces.length > 0 && (
              <div className="flex items-center gap-0.5">
                <span>♟</span>
                <span className="font-mono">{capturedPieces.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Active turn indicator or clock */}
      {isActiveTurn && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#2a2620] border border-[#d4af37]/30 text-[10px] text-[#d4af37] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span>Active</span>
        </div>
      )}
    </div>
  );
};
