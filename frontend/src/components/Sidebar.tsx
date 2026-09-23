import React from 'react';
import {
  Home,
  Monitor,
  Users,
  User,
  UserPlus,
  Puzzle,
  BookOpen,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import type { GameMode } from '../types/game';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from './GoogleSignInButton';

interface SidebarProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenRules: () => void;
  onOpenFriends?: () => void;
  incomingRequestsCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onFindMatch?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  onOpenRules,
  onOpenFriends,
  incomingRequestsCount = 0,
  isOpenMobile,
  onCloseMobile,
  onFindMatch,
}) => {
  const { user, isAuthenticated, logout, promptGoogleSignIn } = useAuth();

  const handleModeClick = (mode: GameMode) => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
    onSelectMode(mode);
  };

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
        className={`fixed md:static top-0 left-0 bottom-0 z-50 w-52 bg-[#161512] border-r border-[#262421] flex flex-col justify-between py-3 px-2 overflow-y-auto select-none transition-transform duration-200 text-[#b5b0a8] text-xs font-medium shrink-0 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
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
              onClick={() => {
                if (!isAuthenticated) {
                  promptGoogleSignIn();
                  return;
                }
                onFindMatch?.();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left bg-gradient-to-r from-[#2a2418] to-[#1e1c18] border border-[#d4af37]/30 text-[#fcd34d] hover:border-[#d4af37]/60 hover:text-[#fef08a] shadow-sm mb-1 cursor-pointer"
            >
              <span className="text-sm">⚡</span>
              <span className="font-semibold text-xs tracking-wide">Quick Match</span>
            </button>

            <button
              onClick={() => handleModeClick('pass_and_play')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${currentMode === 'pass_and_play'
                  ? 'bg-[#262421] text-[#ffffff] font-semibold'
                  : 'hover:bg-[#201e1b] hover:text-[#e3ded7]'
                }`}
            >
              <Home className="w-4 h-4 text-[#8a857d]" />
              <span>Home</span>
            </button>

            <button
              onClick={() => handleModeClick('vs_ai')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${currentMode === 'vs_ai'
                  ? 'bg-[#262421] text-[#ffffff] font-semibold'
                  : 'hover:bg-[#201e1b] hover:text-[#e3ded7]'
                }`}
            >
              <Monitor className="w-4 h-4 text-[#8a857d]" />
              <span>Player vs CPU</span>
            </button>

            <button
              onClick={() => handleModeClick('online')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left relative ${currentMode === 'online'
                  ? 'bg-[#262421] text-[#ffffff] font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#d4af37] before:rounded-r'
                  : 'hover:bg-[#201e1b] hover:text-[#e3ded7]'
                }`}
            >
              <Users className="w-4 h-4 text-[#8a857d]" />
              <span>Player vs Player</span>
            </button>

            <button
              onClick={() => handleModeClick('pass_and_play')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#201e1b] hover:text-[#e3ded7] transition-colors text-left"
            >
              <User className="w-4 h-4 text-[#8a857d]" />
              <span>Play vs Self</span>
            </button>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  promptGoogleSignIn();
                  return;
                }
                onOpenFriends?.();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#201e1b] hover:text-[#e3ded7] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-4 h-4 text-[#d4af37]" />
                <span>Friends</span>
              </div>
              {incomingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {incomingRequestsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Learn & Explore Navigation */}
          <div className="mt-4 pt-3 border-t border-[#262421] space-y-0.5">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  promptGoogleSignIn();
                  return;
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#201e1b] hover:text-[#e3ded7] transition-colors text-left"
            >
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

          {!isAuthenticated ? (
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-semibold tracking-wider text-[#635f58] uppercase">
                Sign In
              </div>

              <div className="w-full px-1">
                <GoogleSignInButton
                  type="standard"
                  theme="filled_white"
                  size="medium"
                  shape="pill"
                  width="100%"
                />
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-[#201e1b] border border-[#2c2823] space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-[#d4af37] bg-[#2a241c] overflow-hidden flex items-center justify-center shrink-0">
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs">🥷</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-xs truncate">
                    {user?.username ? `@${user.username}` : user?.name}
                  </p>
                  <p className="text-[10px] text-[#fcd34d] font-mono">
                    Rating: {user?.rating}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full py-1 text-[11px] rounded bg-[#262421] hover:bg-red-950/50 hover:text-red-300 text-[#8a857d] transition-colors cursor-pointer text-center"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
