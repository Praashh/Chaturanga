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
  useSidebar,
} from './ui/sidebar';
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
        <div
          onClick={() => handleModeClick('pass_and_play')}
          className={`flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity ${
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
        </div>
      </SidebarHeader>

      {/* Main Navigation Content */}
      <SidebarContent className="px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Quick Match Action */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  variant="gold"
                  tooltip="Quick Match (1v1 Online)"
                  onClick={() => {
                    if (!isAuthenticated) {
                      promptGoogleSignIn();
                      return;
                    }
                    onFindMatch?.();
                    if (isMobile) setOpenMobile(false);
                  }}
                  className="mb-1.5 h-9"
                >
                  <span className="text-sm shrink-0">⚡</span>
                  {!isCollapsed && (
                    <span className="font-semibold text-xs tracking-wide">Quick Match</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentMode === 'pass_and_play'}
                  tooltip="Home / Local Pass & Play"
                  onClick={() => handleModeClick('pass_and_play')}
                >
                  <Home className="w-4 h-4 text-[#8a857d] shrink-0" />
                  {!isCollapsed && <span>Home</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentMode === 'vs_ai'}
                  tooltip="Play vs Computer"
                  onClick={() => handleModeClick('vs_ai')}
                >
                  <Monitor className="w-4 h-4 text-[#8a857d] shrink-0" />
                  {!isCollapsed && <span>Player vs CPU</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentMode === 'online'}
                  tooltip="Player vs Player (Online)"
                  onClick={() => handleModeClick('online')}
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
                  onClick={() => handleModeClick('pass_and_play')}
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
                      promptGoogleSignIn();
                      return;
                    }
                    onOpenFriends?.();
                    if (isMobile) setOpenMobile(false);
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

        <SidebarSeparator className="my-2" />

        {/* Learn & Explore Section */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel>Learn & Strategy</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Puzzles"
                  onClick={() => {
                    if (!isAuthenticated) {
                      promptGoogleSignIn();
                      return;
                    }
                    if (isMobile) setOpenMobile(false);
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
                    if (isMobile) setOpenMobile(false);
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
                    if (isMobile) setOpenMobile(false);
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
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  <HelpCircle className="w-4 h-4 text-[#8a857d] shrink-0" />
                  {!isCollapsed && <span>Help</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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

        {!isAuthenticated ? (
          !isCollapsed ? (
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
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={promptGoogleSignIn}
                  className="w-10 h-10 rounded-full border border-[#d4af37] bg-[#2a241c] flex items-center justify-center cursor-pointer mx-auto shadow-sm"
                >
                  <span className="text-base">🥷</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Sign In with Google</TooltipContent>
            </Tooltip>
          )
        ) : !isCollapsed ? (
          <div className="p-2.5 rounded-lg bg-[#201e1b] border border-[#2c2823] space-y-2">
            <div className="flex items-center gap-2.5">
              <Avatar className="w-8 h-8 border border-[#d4af37] bg-[#2a241c] shrink-0">
                {user?.picture && <AvatarImage src={user.picture} alt={user.name} />}
                <AvatarFallback className="bg-[#2a241c] text-xs">🥷</AvatarFallback>
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
              onClick={logout}
              variant="secondary"
              size="sm"
              className="w-full h-7 text-[11px] hover:bg-red-950/50 hover:text-red-300"
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-1 mx-auto py-1">
                <Avatar className="w-9 h-9 border border-[#d4af37] bg-[#2a241c]">
                  {user?.picture && <AvatarImage src={user.picture} alt={user.name} />}
                  <AvatarFallback className="bg-[#2a241c] text-xs">🥷</AvatarFallback>
                </Avatar>
                <button
                  onClick={logout}
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
        )}
      </SidebarFooter>
    </ShadcnSidebar>
  );
};
