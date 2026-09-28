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
  LogOut,
  Zap,
} from 'lucide-react';
import type { GameMode } from '../types/game';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from './ui/sidebar';
import { useSidebar } from './ui/sidebar-context';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface SidebarProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenRules: () => void;
  onOpenFriends?: () => void;
  incomingRequestsCount?: number;
  onFindMatch?: () => void;
}

interface SidebarFooterContentProps {
  isAuthenticated: boolean;
  isCollapsed: boolean;
  user: {
    picture?: string | null;
    name?: string;
    username?: string;
    rating?: number;
  } | null;
  onSignIn: () => void;
  onLogout: () => void;
}

const SidebarFooterContent: React.FC<SidebarFooterContentProps> = ({
  isAuthenticated,
  isCollapsed,
  user,
  onSignIn,
  onLogout,
}) => {
  if (!isAuthenticated) {
    if (!isCollapsed) {
      return (
        <div className="space-y-1.5 pt-1">
          <div className="px-2 text-[10px] font-semibold tracking-wider text-[#635f58] uppercase">
            Sign In
          </div>
          <div className="w-full">
            <GoogleSignInButton
              type="standard"
              theme="filled_white"
              size="medium"
              shape="pill"
              width="100%"
            />
          </div>
        </div>
      );
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onSignIn}
            aria-label="Sign In with Google"
            className="w-10 h-10 rounded-full border border-[#d4af37]/60 bg-[#2a241c] flex items-center justify-center cursor-pointer mx-auto shadow-sm hover:border-[#d4af37] transition-colors"
          >
            <User className="w-5 h-5 text-[#d4af37]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Sign In with Google</TooltipContent>
      </Tooltip>
    );
  }

  if (!isCollapsed) {
    return (
      <div className="p-2.5 rounded-lg bg-[#201e1b] border border-[#2c2823] space-y-2">
        <div className="flex items-center gap-2.5">
          <Avatar className="w-8 h-8 border border-[#d4af37]/70 bg-[#2a241c] shrink-0">
            {user?.picture && <AvatarImage src={user.picture} alt={user.name} />}
            <AvatarFallback className="bg-[#2a241c] text-xs font-semibold text-[#d4af37]">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5 text-[#8a857d]" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white text-xs truncate">
              {user?.username ? `@${user.username}` : user?.name}
            </p>
            <p className="text-[10px] text-[#fcd34d] font-mono">
              Rating: {user?.rating}
            </p>
          </div>
        </div>

        <Button
          onClick={onLogout}
          variant="secondary"
          size="sm"
          className="w-full h-7 text-[11px] hover:bg-red-950/50 hover:text-red-300"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center gap-1 mx-auto py-1">
          <Avatar className="w-9 h-9 border border-[#d4af37]/70 bg-[#2a241c]">
            {user?.picture && <AvatarImage src={user.picture} alt={user.name} />}
            <AvatarFallback className="bg-[#2a241c] text-xs font-semibold text-[#d4af37]">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-[#8a857d]" />}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign Out"
            className="p-1 text-muted-foreground hover:text-red-300 rounded cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        {user?.username ? `@${user.username}` : user?.name} ({user?.rating})
      </TooltipContent>
    </Tooltip>
  );
};

interface SidebarPlayMenuProps {
  currentMode: GameMode;
  isCollapsed: boolean;
  isAuthenticated: boolean;
  incomingRequestsCount: number;
  onModeClick: (mode: GameMode) => void;
  onFindMatch?: () => void;
  onOpenFriends?: () => void;
  onAuthPrompt: () => void;
  closeMobile: () => void;
}

const SidebarPlayMenu: React.FC<SidebarPlayMenuProps> = ({
  currentMode,
  isCollapsed,
  isAuthenticated,
  incomingRequestsCount,
  onModeClick,
  onFindMatch,
  onOpenFriends,
  onAuthPrompt,
  closeMobile,
}) => (
  <SidebarGroup className="p-0">
    <SidebarGroupContent>
      <SidebarMenu>
        {/* Quick Match Action */}
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Play Online (1v1 Live Match)"
            onClick={() => {
              if (!isAuthenticated) {
                onAuthPrompt();
                return;
              }
              onFindMatch?.();
              closeMobile();
            }}
            className="mb-2 h-9 bg-[#231f18] hover:bg-[#2c261e] border border-[#3c3325] hover:border-[#d4af37]/60 text-[#e8e2d8] hover:text-white transition-colors shadow-xs"
          >
            <Zap className="w-4 h-4 text-[#d4af37] shrink-0" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-xs tracking-wide">Play Online</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#181613] text-[#d4af37] border border-[#3e3525]">1v1</span>
              </div>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={currentMode === 'pass_and_play'}
            tooltip="Home / Local Pass & Play"
            onClick={() => onModeClick('pass_and_play')}
          >
            <Home className="w-4 h-4 text-[#8a857d] shrink-0" />
            {!isCollapsed && <span>Home</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={currentMode === 'vs_ai'}
            tooltip="Play vs Computer"
            onClick={() => onModeClick('vs_ai')}
          >
            <Monitor className="w-4 h-4 text-[#8a857d] shrink-0" />
            {!isCollapsed && <span>Player vs CPU</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={currentMode === 'online'}
            tooltip="Player vs Player (Online)"
            onClick={() => onModeClick('online')}
            className={
              currentMode === 'online' && !isCollapsed
                ? 'relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#d4af37] before:rounded-r'
                : ''
            }
          >
            <Users className="w-4 h-4 text-[#8a857d] shrink-0" />
            {!isCollapsed && <span>Player vs Player</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Play vs Self"
            onClick={() => onModeClick('pass_and_play')}
          >
            <User className="w-4 h-4 text-[#8a857d] shrink-0" />
            {!isCollapsed && <span>Play vs Self</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Friends & Allies"
            onClick={() => {
              if (!isAuthenticated) {
                onAuthPrompt();
                return;
              }
              onOpenFriends?.();
              closeMobile();
            }}
          >
            <UserPlus className="w-4 h-4 text-[#d4af37] shrink-0" />
            {!isCollapsed && <span>Friends</span>}
          </SidebarMenuButton>
          {incomingRequestsCount > 0 && !isCollapsed && (
            <SidebarMenuBadge>
              <Badge variant="gold" className="px-1.5 py-0 text-[10px]">
                {incomingRequestsCount}
              </Badge>
            </SidebarMenuBadge>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
);

interface SidebarLearnMenuProps {
  isCollapsed: boolean;
  isAuthenticated: boolean;
  onOpenRules: () => void;
  onAuthPrompt: () => void;
  closeMobile: () => void;
}

const SidebarLearnMenu: React.FC<SidebarLearnMenuProps> = ({
  isCollapsed,
  isAuthenticated,
  onOpenRules,
  onAuthPrompt,
  closeMobile,
}) => (
  <SidebarGroup className="p-0">
    <SidebarGroupLabel>Learn & Strategy</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Puzzles"
            onClick={() => {
              if (!isAuthenticated) {
                onAuthPrompt();
                return;
              }
              closeMobile();
            }}
          >
            <Puzzle className="w-4 h-4 text-[#8a857d] shrink-0" />
            {!isCollapsed && <span>Puzzles</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Piece Movements & Rules"
            onClick={() => {
              onOpenRules();
              closeMobile();
            }}
          >
            <BookOpen className="w-4 h-4 text-[#8a857d] shrink-0" />
            {!isCollapsed && <span>Rules</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Terms & Sanskrit Glossary"
            onClick={() => {
              onOpenRules();
              closeMobile();
            }}
          >
            <GraduationCap className="w-4 h-4 text-[#8a857d] shrink-0" />
            {!isCollapsed && <span>Terms</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Help & FAQ"
            onClick={() => {
              onOpenRules();
              closeMobile();
            }}
          >
            <HelpCircle className="w-4 h-4 text-[#8a857d] shrink-0" />
            {!isCollapsed && <span>Help</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
);

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  onOpenRules,
  onOpenFriends,
  incomingRequestsCount = 0,
  onFindMatch,
}) => {
  const { user, isAuthenticated, logout, promptGoogleSignIn } = useAuth();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;

  const handleModeClick = (mode: GameMode) => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
    onSelectMode(mode);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <ShadcnSidebar className="bg-[#161512] border-r border-[#262421] text-[#b5b0a8]">
      {/* Brand Header */}
      <SidebarHeader className="p-3">
        <button
          type="button"
          onClick={() => handleModeClick('pass_and_play')}
          aria-label="Go to Chaturanga home"
          className={`w-full flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity bg-transparent border-0 text-left p-0 ${
            isCollapsed ? 'justify-center px-0' : 'px-1'
          }`}
          title="Chaturanga"
        >
          <div className="w-8 h-8 rounded-lg bg-[#221f1b] border border-[#3a352f] p-1 flex items-center justify-center shrink-0 shadow-sm">
            <img
              src="/logo.png"
              alt="Chaturanga Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <span className="font-serif font-bold text-base tracking-wide text-[#e3ded7]">
              Chaturanga
            </span>
          )}
        </button>
      </SidebarHeader>

      {/* Main Navigation Content */}
      <SidebarContent className="px-2">
        <SidebarPlayMenu
          currentMode={currentMode}
          isCollapsed={isCollapsed}
          isAuthenticated={isAuthenticated}
          incomingRequestsCount={incomingRequestsCount}
          onModeClick={handleModeClick}
          onFindMatch={onFindMatch}
          onOpenFriends={onOpenFriends}
          onAuthPrompt={promptGoogleSignIn}
          closeMobile={() => isMobile && setOpenMobile(false)}
        />

        <SidebarSeparator className="my-2" />

        <SidebarLearnMenu
          isCollapsed={isCollapsed}
          isAuthenticated={isAuthenticated}
          onOpenRules={onOpenRules}
          onAuthPrompt={promptGoogleSignIn}
          closeMobile={() => isMobile && setOpenMobile(false)}
        />
      </SidebarContent>

      {/* Footer Profile & Social */}
      <SidebarFooter className="p-2 border-t border-[#262421]">
        {!isCollapsed && (
          <a
            href="https://x.com/10xpraash"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-[#201e1b] hover:text-[#e3ded7] transition-colors text-left text-zinc-400 text-xs font-medium mb-1"
          >
            <span className="font-bold text-xs">𝕏</span>
            <span>Follow on X</span>
          </a>
        )}

        <SidebarFooterContent
          isAuthenticated={isAuthenticated}
          isCollapsed={isCollapsed}
          user={user}
          onSignIn={promptGoogleSignIn}
          onLogout={logout}
        />
      </SidebarFooter>
    </ShadcnSidebar>
  );
};
