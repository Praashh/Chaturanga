import React from 'react';
import { LogOut, Trophy, Swords, User as UserIcon, Users, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

interface ProfileDropdownProps {
  onOpenFriends?: () => void;
  onOpenHistory?: () => void;
  friendsCount?: number;
  incomingRequestsCount?: number;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onOpenFriends,
  onOpenHistory,
  friendsCount,
  incomingRequestsCount,
}) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const winRate =
    user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0;

  return (
    <DropdownMenuContent
      align="end"
      className="w-64 rounded-xl bg-[#1a1815] border border-[#2e2a24] shadow-2xl p-3 text-xs select-none text-[#e3ded7]"
    >
      {/* Header: Avatar + Identity */}
      <div className="flex items-center gap-3 pb-3 border-b border-[#262421]">
        <Avatar className="w-11 h-11 border-2 border-[#d4af37] bg-[#2a241c] shrink-0 shadow-md">
          {user.picture && <AvatarImage src={user.picture} alt={user.name} />}
          <AvatarFallback className="bg-[#2a241c] text-[#d4af37]">
            <UserIcon className="w-5 h-5 text-[#d4af37]" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white truncate text-sm">
            {user.username ? `@${user.username}` : user.name}
          </p>
          <p className="text-[11px] text-[#8a857d] font-mono truncate">{user.name}</p>
        </div>
      </div>

      {/* Battle Stats Grid */}
      <div className="grid grid-cols-2 gap-2 my-3 p-2 rounded-lg bg-[#201e1b] border border-[#28241e]">
        <div className="flex items-center gap-2 p-1.5">
          <Trophy className="w-4 h-4 text-[#fcd34d] shrink-0" />
          <div>
            <span className="text-[10px] text-[#8a857d] uppercase tracking-wider block">
              Rating
            </span>
            <span className="font-mono font-bold text-white text-xs">{user.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5">
          <Swords className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] text-[#8a857d] uppercase tracking-wider block">
              Win Rate
            </span>
            <span className="font-mono font-bold text-emerald-400 text-xs">{winRate}%</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-1 text-[11px] text-[#8a857d] mb-2">
        <span>Matches: {user.gamesPlayed}</span>
        <span>Won: {user.gamesWon}</span>
      </div>

      <DropdownMenuSeparator className="bg-[#262421] my-2" />

      {/* Match History Button */}
      {onOpenHistory && (
        <DropdownMenuItem
          onClick={onOpenHistory}
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#201e1b] hover:bg-[#262421] focus:bg-[#262421] text-white border border-[#2c2823] cursor-pointer mb-1.5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Match History</span>
          </div>
          <Badge variant="mono">{user.gamesPlayed}</Badge>
        </DropdownMenuItem>
      )}

      {/* Friends Button */}
      <DropdownMenuItem
        onClick={onOpenFriends}
        className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#201e1b] hover:bg-[#262421] focus:bg-[#262421] text-white border border-[#2c2823] cursor-pointer mb-1.5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Friends & Allies</span>
        </div>
        <div className="flex items-center gap-1.5">
          {incomingRequestsCount !== undefined && incomingRequestsCount > 0 && (
            <Badge variant="gold" className="text-[10px] px-1.5 py-0 font-bold">
              {incomingRequestsCount} new
            </Badge>
          )}
          {friendsCount !== undefined && (
            <Badge variant="mono">{friendsCount}</Badge>
          )}
        </div>
      </DropdownMenuItem>

      {/* Sign Out Button */}
      <DropdownMenuItem
        onClick={logout}
        className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[#262421] hover:bg-red-950/60 focus:bg-red-950/60 hover:text-red-300 focus:text-red-300 text-[#b5b0a8] border border-transparent hover:border-red-900/50 cursor-pointer transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Sign Out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};
