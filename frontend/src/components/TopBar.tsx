import React, { useState } from 'react';
import { Menu, History, Volume2, VolumeX, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';

interface TopBarProps {
  onToggleMobileMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileMenu,
  isMuted,
  onToggleMute,
  onOpenSettings,
}) => {
  const { user, isAuthenticated, promptGoogleSignIn } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="w-full h-12 bg-[#161512] border-b border-[#262421] px-4 flex items-center justify-between select-none z-30 relative">
      {/* Left: Mobile menu toggle and title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-md hover:bg-[#262421] text-[#b5b0a8] lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-sm tracking-wide text-[#e3ded7]">
            Chaturanga
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#262421] text-[#8a857d] font-mono">
            pvp
          </span>
        </div>
      </div>

      {/* Right: Quick actions and avatar matching reference */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleMute}
          className="p-1.5 rounded-lg hover:bg-[#262421] text-[#8a857d] hover:text-[#e3ded7] transition-colors cursor-pointer"
          title={isMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg hover:bg-[#262421] text-[#8a857d] hover:text-[#e3ded7] transition-colors cursor-pointer"
          title="History / Chronicle"
        >
          <History className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#262421]" />


        {/* Profile Avatar with gold ring border */}
        <div className="relative">
          <div
            onClick={() => {
              if (isAuthenticated) {
                setIsDropdownOpen(prev => !prev);
              } else {
                promptGoogleSignIn();
              }
            }}
            className="w-8 h-8 rounded-full border-2 border-[#d4af37] bg-[#2a241c] overflow-hidden flex items-center justify-center cursor-pointer shadow-sm hover:border-[#fcd34d] transition-colors"
            title={isAuthenticated ? `${user?.name} (Click for profile)` : 'Click to sign in with Google'}
          >
            {isAuthenticated && user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : isAuthenticated ? (
              <UserIcon className="w-4 h-4 text-[#d4af37]" />
            ) : (
              <span className="text-sm">🥷</span>
            )}
          </div>

          {/* Profile Dropdown menu */}
          <ProfileDropdown
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
          />
        </div>
      </div>
    </header>
  );
};
