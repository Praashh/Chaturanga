import React from 'react';
import { User, UserPlus, UserCheck, Clock, X, Swords } from 'lucide-react';
import type { Piece } from '../types/game';

interface PlayerCardProps {
  name: string;
  username?: string;
  rating?: number;
  ratingDelta?: number;
  ratingAfter?: number;
  avatarIcon?: string;
  avatarUrl?: string | null;
  isSelf?: boolean;
  countryFlag?: string;
  capturedPieces: Piece[];
  materialAdvantage?: number;
  isActiveTurn?: boolean;
  onAddFriend?: () => void;
  friendshipStatus?: 'friend' | 'pending_sent' | 'pending_received' | 'none' | null;
  // Matchmaking search props
  isSearching?: boolean;
  searchDuration?: number;
  targetRating?: number;
  onCancelSearch?: () => void;
  isMatchJustFound?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  username,
  rating,
  ratingDelta,
  ratingAfter,
  avatarIcon,
  avatarUrl,
  isSelf = false,
  countryFlag = '🇮🇳',
  capturedPieces,
  materialAdvantage = 0,
  isActiveTurn = false,
  onAddFriend,
  friendshipStatus,
  isSearching = false,
  searchDuration = 0,
  targetRating = 1500,
  onCancelSearch,
  isMatchJustFound = false,
}) => {
  const formatTime = (totalSec = 0) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Dynamic expanding rating bracket
  const bracket = Math.min(300, 50 + Math.floor(searchDuration / 3) * 30);
  const minRating = Math.max(100, targetRating - bracket);
  const maxRating = targetRating + bracket;

  return (
    <div
      className={`w-full flex items-center justify-between py-1 px-2 rounded-md transition-all duration-300 select-none ${
        isSearching
          ? 'bg-[#221f1a]/80 border border-[#3d362b]/80 shadow-[0_0_15px_rgba(212,175,55,0.08)]'
          : isMatchJustFound
          ? 'bg-emerald-950/30 border border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
          : isActiveTurn
          ? 'bg-[#262421]/60 border border-transparent'
          : 'bg-transparent border border-transparent'
      }`}
    >
      {/* Left: Avatar + Identity */}
      <div className="flex items-center gap-2.5">
        {/* Profile Avatar (with Chess.com searching radar animation if searching) */}
        {isSearching ? (
          <div className="relative w-8 h-8 rounded-full bg-[#1b1916] border border-[#d4af37]/40 flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(212,175,55,0.25)] shrink-0">
            {/* Spinning radar arc sweep */}
            <div className="absolute inset-0 rounded-full animate-spin [animation-duration:2.2s] bg-[conic-gradient(from_0deg,transparent_0_280deg,rgba(212,175,55,0.85)_360deg)]" />
            {/* Inner pulsing circle */}
            <div className="absolute inset-[2px] rounded-full bg-[#191714] flex items-center justify-center">
              <Swords className="w-3.5 h-3.5 text-[#fcd34d] animate-pulse" />
            </div>
          </div>
        ) : (
          <div
            className={`w-8 h-8 rounded-full bg-[#2a2824] border ${
              isMatchJustFound
                ? 'border-emerald-400 ring-2 ring-emerald-500/50 animate-pulse'
                : 'border-[#3d3832]'
            } flex items-center justify-center text-sm overflow-hidden shadow-sm shrink-0 transition-all duration-300`}
          >
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
        )}

        {/* Identity & Rating (with Chess.com searching animation if searching) */}
        {isSearching ? (
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-semibold text-amber-200 tracking-wide animate-pulse">
                Searching for Opponent...
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#8a857d] font-mono mt-0.5">
              <span className="text-amber-400/90 font-medium">
                Rating: {minRating}–{maxRating}
              </span>
              <span className="text-[#6d665b]">•</span>
              <span className="flex items-center gap-0.5 text-[#baa994]">
                <Clock className="w-3 h-3 text-[#fcd34d]" />
                <span>{formatTime(searchDuration)}</span>
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e3ded7]">
              {isSelf && countryFlag && <span>{countryFlag}</span>}
              <span>{username || name}</span>
              {(ratingAfter !== undefined || rating !== undefined) && (
                <span className="text-[#8a857d] font-normal font-mono text-[11px]">
                  ({Math.round(ratingAfter ?? rating!)})
                </span>
              )}
              {ratingDelta !== undefined && ratingDelta !== null && (
                <span
                  className={`text-[10px] font-bold font-mono px-1 py-0.2 rounded border ${
                    ratingDelta >= 0
                      ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                      : 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                  }`}
                >
                  {ratingDelta >= 0 ? `+${Math.round(ratingDelta)}` : Math.round(ratingDelta)}
                </span>
              )}
              {isMatchJustFound && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[9px] font-bold uppercase tracking-wider animate-bounce ml-1">
                  Match Found!
                </span>
              )}
              {!isSelf && onAddFriend && (
                friendshipStatus === 'friend' ? (
                  <span
                    className="text-[10px] text-emerald-400 flex items-center gap-0.5 ml-0.5"
                    title="Allied Warrior"
                  >
                    <UserCheck className="w-3 h-3" />
                  </span>
                ) : friendshipStatus === 'pending_sent' ? (
                  <span
                    className="text-[10px] text-amber-400 flex items-center gap-0.5 ml-0.5"
                    title="Friend Request Pending"
                  >
                    <Clock className="w-3 h-3" />
                  </span>
                ) : (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onAddFriend();
                    }}
                    className="p-1 rounded hover:bg-[#353028] text-[#d4af37] hover:text-[#fef08a] transition-colors cursor-pointer ml-0.5"
                    title="Add as Friend"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                )
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
        )}
      </div>

      {/* Right: Cancel button if searching, or Active turn indicator */}
      {isSearching && onCancelSearch ? (
        <button
          onClick={e => {
            e.stopPropagation();
            onCancelSearch();
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#28231c] hover:bg-red-950/40 border border-[#3b3428] hover:border-red-800/60 text-[#c8bea8] hover:text-red-300 text-[11px] font-medium transition-colors cursor-pointer shadow-sm active:scale-95"
          title="Cancel search"
        >
          <X className="w-3 h-3" />
          <span>Cancel</span>
        </button>
      ) : isActiveTurn ? (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#2a2620] border border-[#d4af37]/30 text-[10px] text-[#d4af37] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span>Active</span>
        </div>
      ) : null}
    </div>
  );
};
