import React from 'react';
import { User, UserPlus, UserCheck, Clock, X, Loader2 } from 'lucide-react';
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
  const initial = (username || name || 'W').trim().charAt(0).toUpperCase();

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={`w-full flex items-center justify-between h-11 sm:h-12 px-2.5 sm:px-3 rounded-lg border transition-all duration-200 select-none backdrop-blur-sm ${
          isSearching
            ? 'bg-[#1c1915] border-[#3d362a] shadow-inner'
            : isMatchJustFound
            ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
            : isActiveTurn
            ? 'bg-[#221f18] border-[#443a28] border-l-[3px] border-l-[#d4af37] shadow-sm'
            : 'bg-[#181613] border-[#29251f] shadow-sm'
        }`}
      >
        {/* Left: Avatar + Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Profile Avatar */}
          {isSearching ? (
            <div className="w-8 h-8 rounded-full bg-[#1e1b17] border border-[#3e3527] flex items-center justify-center shrink-0">
              <Loader2 className="w-3.5 h-3.5 text-[#d4af37] animate-spin" />
            </div>
          ) : (
            <Avatar
              className={`w-8 h-8 border ${
                isMatchJustFound
                  ? 'border-emerald-400 ring-1 ring-emerald-500/40'
                  : isActiveTurn
                  ? 'border-[#d4af37]/80 ring-1 ring-[#d4af37]/30'
                  : 'border-[#38332a]'
              } bg-[#23201b] shrink-0 transition-all duration-200`}
            >
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
              <AvatarFallback className="bg-[#23201b] text-xs font-semibold text-[#d4af37]">
                {avatarIcon ? (
                  <span className="text-sm">{avatarIcon}</span>
                ) : initial ? (
                  <span>{initial}</span>
                ) : (
                  <User className="w-3.5 h-3.5 text-[#8a857d]" />
                )}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Identity & Rating */}
          {isSearching ? (
            <div className="flex flex-col text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[#f0ebe1] tracking-wide truncate">
                  Finding Opponent
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#8a857d] font-mono">
                <span className="text-[#c2b6a3]">{minRating}–{maxRating}</span>
                <span className="text-[#555]">•</span>
                <span className="text-[#8a857d]">{formatTime(searchDuration)}</span>
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e3ded7] truncate">
                {isSelf && countryFlag && <span className="shrink-0 text-xs">{countryFlag}</span>}
                <span className="truncate">{username || name}</span>
                {(ratingAfter !== undefined || rating !== undefined) && (
                  <span className="text-[#c8a032] font-semibold font-mono text-[11px] shrink-0">
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
                  <Badge variant="emerald" className="text-[9px] uppercase tracking-wider font-mono ml-1 shrink-0">
                    Match Found
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
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onCancelSearch();
            }}
            className="h-7 px-2 text-[11px] text-[#8a857d] hover:text-white hover:bg-[#29241e] border border-[#352f25] shrink-0"
          >
            <X className="w-3 h-3 mr-1" />
            <span>Cancel</span>
          </Button>
        ) : isActiveTurn ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 text-[10px] font-mono tracking-wider font-semibold text-[#fcd34d] shrink-0 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
            <span>To Move</span>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
};
