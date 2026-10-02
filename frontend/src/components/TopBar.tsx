import { History, Volume2, VolumeX, User as UserIcon, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePieceTheme } from '../context/PieceThemeContext';
import { ProfileDropdown } from './ProfileDropdown';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu';
import { SidebarTrigger } from './ui/sidebar';

interface TopBarProps {
  onToggleMobileMenu?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  soundTheme?: 'vedic' | 'classic';
  onToggleSoundTheme?: () => void;
  onOpenHistory: () => void;
  onOpenFriends?: () => void;
  friendsCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleMobileMenu,
  isMuted,
  onToggleMute,
  onOpenHistory,
  onOpenFriends,
  friendsCount,
}) => {
  const { user, isAuthenticated, promptGoogleSignIn } = useAuth();
  const { pieceTheme, togglePieceTheme } = usePieceTheme();

  return (
    <TooltipProvider delayDuration={200}>
      <header className="w-full h-12 bg-[#161512] border-b border-[#262421] px-3 sm:px-4 flex items-center justify-between select-none z-30 relative shrink-0">
        {/* Left: Sidebar trigger and title */}
        <div className="flex items-center gap-2">
          <SidebarTrigger onClick={onToggleMobileMenu} />

          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Chaturanga Logo"
              className="w-5 h-5 object-contain shrink-0 drop-shadow"
            />
            <span className="font-serif font-bold text-sm tracking-wide text-[#e3ded7]">
              Chaturanga
            </span>
            <Badge variant="mono" className="text-[10px] px-1.5 py-0.5">
              pvp
            </Badge>
          </div>
        </div>

        {/* Right: Quick actions and avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {onOpenFriends && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (!isAuthenticated) {
                      promptGoogleSignIn();
                      return;
                    }
                    onOpenFriends();
                  }}
                  className="text-[#8a857d] hover:text-[#e3ded7] hover:bg-[#262421] relative"
                  aria-label="Friends and Allies"
                >
                  <Users className="w-4 h-4 text-[#d4af37]" />
                  {friendsCount !== undefined && friendsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#d4af37] text-black font-bold text-[9px] flex items-center justify-center">
                      {friendsCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Friends & Allies</TooltipContent>
            </Tooltip>
          )}



          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePieceTheme}
                className="h-8 px-2 sm:px-2.5 text-[11px] font-mono gap-1 text-[#d4af37] hover:text-[#fcd34d] hover:bg-[#262421] border border-[#d4af37]/25 rounded-md"
                aria-label="Toggle Piece Style"
              >
                <span className="text-xs">{pieceTheme === 'standard' ? '♟️' : '🛞'}</span>
                <span className="hidden sm:inline font-medium">
                  {pieceTheme === 'standard' ? 'Standard' : 'Vedic'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Piece Style: {pieceTheme === 'standard' ? 'Standard (Chess.com)' : 'Ancient Vedic'} — Click to toggle
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMute}
                className="text-[#8a857d] hover:text-[#e3ded7] hover:bg-[#262421]"
                aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isMuted ? 'Unmute Sound' : 'Mute Sound'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenHistory}
                className="text-[#8a857d] hover:text-[#e3ded7] hover:bg-[#262421]"
                aria-label="Match History & Chronicles"
              >
                <History className="w-4 h-4 text-[#d4af37]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Match History (Previous Games)
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 bg-[#262421]" />

          {/* Profile Avatar with gold ring border & shadcn DropdownMenu */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className="w-8 h-8 rounded-full border-2 border-[#d4af37] bg-[#2a241c] overflow-hidden flex items-center justify-center cursor-pointer shadow-sm hover:border-[#fcd34d] transition-colors"
                  title={`${user?.name} (Click for profile)`}
                >
                  <Avatar className="w-full h-full border-none">
                    {user?.picture && <AvatarImage src={user.picture} alt={user.name} />}
                    <AvatarFallback className="bg-[#2a241c] text-[#d4af37]">
                      <UserIcon className="w-4 h-4 text-[#d4af37]" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <ProfileDropdown
                onOpenFriends={onOpenFriends}
                onOpenHistory={onOpenHistory}
                friendsCount={friendsCount}
              />
            </DropdownMenu>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={promptGoogleSignIn}
                  aria-label="Sign In with Google"
                  className="w-8 h-8 rounded-full border border-[#d4af37]/70 bg-[#2a241c] overflow-hidden flex items-center justify-center cursor-pointer shadow-sm hover:border-[#d4af37] transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-[#d4af37]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Click to Sign In with Google
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
};
