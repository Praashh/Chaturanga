import React from 'react';
import { Menu, History, Volume2, VolumeX } from 'lucide-react';

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
  return (
    <header className="w-full h-12 bg-[#161512] border-b border-[#262421] px-4 flex items-center justify-between select-none z-30">
      {/* Left: Mobile menu toggle and title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-md hover:bg-[#262421] text-[#b5b0a8] lg:hidden"
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
          className="p-1.5 rounded-lg hover:bg-[#262421] text-[#8a857d] hover:text-[#e3ded7] transition-colors"
          title={isMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg hover:bg-[#262421] text-[#8a857d] hover:text-[#e3ded7] transition-colors"
          title="History / Chronicle"
        >
          <History className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#262421]" />

        {/* Social / Auth icons matching screenshot */}
        <button
          onClick={() => alert('Sign-in integration is ready for your OAuth credentials!')}
          className="w-7 h-7 rounded-full bg-[#201e1b] hover:bg-[#2a2824] border border-[#33302b] flex items-center justify-center text-xs font-bold text-red-400"
          title="Sign in with Google"
        >
          G
        </button>

        {/* Profile Avatar with gold ring border matching screenshot */}

        <div className="w-8 h-8 rounded-full border-2 border-[#d4af37] bg-[#2a241c] overflow-hidden flex items-center justify-center cursor-pointer shadow-sm">
          <span className="text-sm">🥷</span>
        </div>
      </div>
    </header>
  );
};
