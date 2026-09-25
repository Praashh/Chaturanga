import React from 'react';
import { User, UserPlus, UserCheck, Clock, X, Swords } from 'lucide-react';
import type { Piece } from '../types/game';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

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

  const bracket = Math.min(300, 50 + Math.floor(searchDuration / 3) * 30);
  const minRating = Math.max(100, targetRating - bracket);
  const maxRating = targetRating + bracket;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={`w-full flex items-center justify-between h-11 sm:h-12 px-2.5 sm:px-3 rounded-lg border transition-all duration-300 select-none backdrop-blur-sm ${
          isSearching
            ? 'bg-[#221f1a]/95 border-[#d4af37]/40 shadow-[0_0_16px_rgba(212,175,55,0.12)]'
            : isMatchJustFound
            ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_16px_rgba(52,211,153,0.2)]'
            : isActiveTurn
            ? 'bg-[#24201a] border-[#d4af37]/60 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
            : 'bg-[#1a1815]/90 border-[#2a2620] shadow-sm'
        }`}
      >
        {/* Left: Avatar + Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Profile Avatar */}
          {isSearching ? (
            <div className="relative w-8 h-8 rounded-full bg-[#1b1916] border border-[#d4af37]/50 flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(212,175,55,0.25)] shrink-0">
              <div className="absolute inset-0 rounded-full animate-spin [animation-duration:2.2s] bg-[conic-gradient(from_0deg,transparent_0_280deg,rgba(212,175,55,0.85)_360deg)]" />
              <div className="absolute inset-[2px] rounded-full bg-[#191714] flex items-center justify-center">
                <Swords className="w-3.5 h-3.5 text-[#fcd34d] animate-pulse" />
              </div>
            </div>
          ) : (
            <Avatar
              className={`w-8 h-8 border ${
                isMatchJustFound
                  ? 'border-emerald-400 ring-2 ring-emerald-500/50 animate-pulse'
                  : isActiveTurn
                  ? 'border-[#d4af37]'
                  : 'border-[#3d3832]'
              } bg-[#2a2824] shrink-0 transition-all duration-200`}
            >
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
              <AvatarFallback className="bg-[#2a2824] text-xs">
                {avatarIcon ? (
                  <span className="text-base">{avatarIcon}</span>
                ) : isSelf ? (
                  <span className="text-base">🥷</span>
                ) : (
                  <User className="w-4 h-4 text-[#8a857d]" />
                )}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Identity & Rating */}
          {isSearching ? (
            <div className="flex flex-col text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span className="text-xs font-semibold text-amber-200 tracking-wide animate-pulse truncate">
                  Searching for Opponent...
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#8a857d] font-mono">
                <span className="text-amber-400/90 font-medium">
                  {minRating}–{maxRating}
                </span>
                <span className="text-[#6d665b]">•</span>
                <span className="flex items-center gap-0.5 text-[#baa994]">
                  <Clock className="w-3 h-3 text-[#fcd34d]" />
                  <span>{formatTime(searchDuration)}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e3ded7] truncate">
                {isSelf && countryFlag && <span className="shrink-0">{countryFlag}</span>}
                <span className="truncate">{username || name}</span>
                {(ratingAfter !== undefined || rating !== undefined) && (
                  <span className="text-[#d4af37] font-bold font-mono text-[11px] shrink-0">
                    ({Math.round(ratingAfter ?? rating!)})
                  </span>
                )}
                {ratingDelta !== undefined && ratingDelta !== null && (
                  <Badge
                    variant={ratingDelta >= 0 ? 'emerald' : 'destructive'}
                    className="px-1 py-0 text-[10px] font-mono shrink-0"
                  >
                    {ratingDelta >= 0 ? `+${Math.round(ratingDelta)}` : Math.round(ratingDelta)}
                  </Badge>
                )}
                {isMatchJustFound && (
                  <Badge variant="emerald" className="text-[9px] uppercase tracking-wider animate-bounce ml-1 shrink-0">
                    Match Found!
                  </Badge>
                )}
                {!isSelf && onAddFriend && (
                  friendshipStatus === 'friend' ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 ml-0.5 shrink-0">
                          <UserCheck className="w-3 h-3" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">Allied Warrior</TooltipContent>
                    </Tooltip>
                  ) : friendshipStatus === 'pending_sent' ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5 ml-0.5 shrink-0">
                          <Clock className="w-3 h-3" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">Treaty Request Sent</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={e => {
                            e.stopPropagation();
                            onAddFriend();
                          }}
                          className="text-[#d4af37] hover:text-[#fef08a] hover:bg-[#353028] ml-0.5 shrink-0"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Propose Alliance</TooltipContent>
                    </Tooltip>
                  )
                )}
              </div>

              {/* Captured Pieces display */}
              <div className="flex items-center gap-1.5 text-[10px] text-[#8a857d]">
                {materialAdvantage > 0 && (
                  <span className="font-mono font-bold text-[#fcd34d] bg-[#d4af37]/15 px-1 py-0.2 rounded">
                    +{materialAdvantage}
                  </span>
                )}
                {capturedPieces.length > 0 && (
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <span>♟</span>
                    <span>{capturedPieces.length} captured</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Cancel button if searching, or Active turn indicator */}
        {isSearching && onCancelSearch ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onCancelSearch();
            }}
            className="h-7 px-2.5 text-[11px] gap-1 hover:bg-red-950/40 hover:text-red-300 border-[#3b3428] shrink-0"
          >
            <X className="w-3 h-3" />
            <span>Cancel</span>
          </Button>
        ) : isActiveTurn ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[10px] text-emerald-400 font-semibold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Turn</span>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
};
