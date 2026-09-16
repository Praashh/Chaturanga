import React from 'react';
import {
  Home,
  Monitor,
  Users,
  User,
  Puzzle,
  BookOpen,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import type { GameMode } from '../types/game';


interface SidebarProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenRules: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  onOpenRules,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed md:static top-0 left-0 bottom-0 z-50 w-52 bg-[#161512] border-r border-[#262421] flex flex-col justify-between py-3 px-2 overflow-y-auto select-none transition-transform duration-200 text-[#b5b0a8] text-xs font-medium shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >

        {/* Brand Logo */}
        <div>
          <div className="flex items-center gap-2.5 px-3 py-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-[#262421] border border-[#3a352f] flex items-center justify-center text-sm">
              👑
            </div>
            <span className="font-serif font-bold text-base tracking-wide text-[#e3ded7]">
              Chaturanga
            </span>
          </div>

          {/* Core Game Modes */}
          <nav className="space-y-1">
            <button
              onClick={() => onSelectMode('pass_and_play')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${currentMode === 'pass_and_play'
                ? 'bg-[#262421] text-[#ffffff] font-semibold'
                : 'hover:bg-[#201e1b] hover:text-[#e3ded7]'
                }`}
            >
              <Home className="w-4 h-4 text-[#8a857d]" />
              <span>Home</span>
            </button>

            <button
              onClick={() => onSelectMode('vs_ai')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${currentMode === 'vs_ai'
                ? 'bg-[#262421] text-[#ffffff] font-semibold'
                : 'hover:bg-[#201e1b] hover:text-[#e3ded7]'
                }`}
            >
              <Monitor className="w-4 h-4 text-[#8a857d]" />
              <span>Player vs CPU</span>
            </button>

            <button
              onClick={() => onSelectMode('online')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left relative ${currentMode === 'online'
                ? 'bg-[#262421] text-[#ffffff] font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#d4af37] before:rounded-r'
                : 'hover:bg-[#201e1b] hover:text-[#e3ded7]'
                }`}
            >
              <Users className="w-4 h-4 text-[#8a857d]" />
              <span>Player vs Player</span>
            </button>

            <button
              onClick={() => onSelectMode('pass_and_play')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#201e1b] hover:text-[#e3ded7] transition-colors text-left"
            >
              <User className="w-4 h-4 text-[#8a857d]" />
              <span>Play vs Self</span>
            </button>
          </nav>

          {/* Learn & Explore Navigation */}
          <div className="mt-4 pt-3 border-t border-[#262421] space-y-0.5">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#201e1b] hover:text-[#e3ded7] transition-colors text-left">
              <Puzzle className="w-4 h-4 text-[#8a857d]" />
              <span>Puzzles</span>
            </button>
            <button
              onClick={onOpenRules}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#201e1b] hover:text-[#e3ded7] transition-colors text-left"
            >
              <BookOpen className="w-4 h-4 text-[#8a857d]" />
              <span>Rules</span>
            </button>
            <button
              onClick={onOpenRules}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#201e1b] hover:text-[#e3ded7] transition-colors text-left"
            >
              <GraduationCap className="w-4 h-4 text-[#8a857d]" />
              <span>Terms</span>
            </button>
            <button
              onClick={onOpenRules}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#201e1b] hover:text-[#e3ded7] transition-colors text-left"
            >
              <HelpCircle className="w-4 h-4 text-[#8a857d]" />
              <span>Help</span>
            </button>
          </div>
        </div>

        {/* Bottom Social & Sign In (Google only) */}
        <div className="mt-4 pt-3 border-t border-[#262421] space-y-2">
          <a
            href="https://x.com/10xpraash"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-[#201e1b] hover:text-[#e3ded7] transition-colors text-left text-zinc-400"
          >
            <span className="font-bold text-xs">𝕏</span>
            <span>Follow on X</span>
          </a>

          <div className="px-3 text-[10px] font-semibold tracking-wider text-[#635f58] uppercase mt-2">
            Sign In
          </div>

          <button
            onClick={() => alert('Sign-in integration is ready for your OAuth credentials!')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#201e1b] hover:bg-[#2a2824] border border-[#2c2823] text-[#d4cfc7] text-left transition-colors"
          >
            <span className="text-red-400 font-bold">G</span>
            <span>Sign in with Google</span>
          </button>
        </div>
      </aside>
    </>
  );
};
