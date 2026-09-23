import React, { useRef, useEffect } from 'react';
import { LogOut, Trophy, Swords, User as UserIcon, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFriends?: () => void;
  friendsCount?: number;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  isOpen,
  onClose,
  onOpenFriends,
  friendsCount,
}) => {
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const winRate =
    user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 mt-1 w-64 rounded-xl bg-[#1a1815] border border-[#2e2a24] shadow-2xl p-4 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150 select-none text-[#e3ded7]"
    >
      {/* Header: Avatar + Identity */}
      <div className="flex items-center gap-3 pb-3 border-b border-[#262421]">
        <div className="w-11 h-11 rounded-full border-2 border-[#d4af37] bg-[#2a241c] overflow-hidden flex items-center justify-center shrink-0 shadow-md">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-5 h-5 text-[#d4af37]" />
          )}
        </div>
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

      <div className="flex justify-between items-center px-1 text-[11px] text-[#8a857d] mb-3">
        <span>Matches: {user.gamesPlayed}</span>
        <span>Won: {user.gamesWon}</span>
      </div>

      {/* Friends Button */}
      <button
        onClick={() => {
          onClose();
          onOpenFriends?.();
        }}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#201e1b] hover:bg-[#262421] text-white border border-[#2c2823] transition-colors font-medium cursor-pointer mb-2"
      >
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Friends & Allies</span>
        </div>
        {friendsCount !== undefined && (
          <span className="text-[11px] text-[#8a857d] font-mono">{friendsCount}</span>
        )}
      </button>

      {/* Sign Out Button */}
      <button
        onClick={() => {
          logout();
          onClose();
        }}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#262421] hover:bg-red-950/60 hover:text-red-300 text-[#b5b0a8] border border-transparent hover:border-red-900/50 transition-colors font-medium cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Sign Out</span>
      </button>
    </div>
  );
};
