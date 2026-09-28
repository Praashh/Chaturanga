import { useAuth } from '../context/AuthContext';
import { useFriends } from './useFriends';
import {
  updateGameRoomUrl,
  getGameShareUrl,
  generateRoomId,
} from '../utils/roomUrl';
import { toast } from 'sonner';
import type { GameMode, AIDifficulty, PieceColor, SquareCoord } from '../types/game';
import type { FriendUser } from '../types/friends';

interface UseGameActionsOptions {
  mode: GameMode;
  onlineRoomId: string | null;
  onlinePlayerName: string;
  playerColor: PieceColor;
  setMode: (m: GameMode) => void;
  setAiDifficulty: (d: AIDifficulty) => void;
  setPlayerColor: (c: PieceColor) => void;
  setOnlineRoomId: (id: string | null) => void;
  setOnlinePlayerName: (n: string) => void;
  setIsLobbyOpen: (v: boolean) => void;
  handleSquareClick: (coord: SquareCoord) => void;
  handleMove: (from: SquareCoord, to: SquareCoord) => void;
  resetGame: () => void;
  resignGame: (color: PieceColor) => void;
  socket: {
    isSearching: boolean;
    opponentId?: string | null;
    opponentName?: string | null;
    clearRatingSettlement: () => void;
    findMatch: (
      playerId: string,
      playerName: string,
      rating: number,
      picture: string | null,
    ) => void;
    cancelFindMatch: () => void;
  };
}

export function useGameActions(options: UseGameActionsOptions) {
  const {
    mode,
    onlineRoomId,
    playerColor,
    setMode,
    setAiDifficulty,
    setPlayerColor,
    setOnlineRoomId,
    setOnlinePlayerName,
    setIsLobbyOpen,
    handleSquareClick,
    handleMove,
    resetGame,
    resignGame,
    socket,
  } = options;

  const { user, isAuthenticated, promptGoogleSignIn } = useAuth();
  const friends = useFriends();

  /** Require sign-in, returning true when the gate blocks the action. */
  const requireAuth = (): boolean => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return true;
    }
    return false;
  };

  // ── Mode switching ────────────────────────────────────────
  const handleSelectMode = (newMode: GameMode) => {
    if (requireAuth()) return;
    socket.clearRatingSettlement();
    setMode(newMode);
    if (newMode === 'online') {
      setIsLobbyOpen(true);
    } else {
      updateGameRoomUrl(null);
      setOnlineRoomId(null);
      resetGame();
    }
  };

  const handleSelectLocal = () => {
    if (requireAuth()) return;
    socket.clearRatingSettlement();
    setMode('pass_and_play');
    setOnlineRoomId(null);
    updateGameRoomUrl(null);
    resetGame();
  };

  const handleSelectAI = (difficulty: AIDifficulty, color: PieceColor) => {
    if (requireAuth()) return;
    socket.clearRatingSettlement();
    setMode('vs_ai');
    setAiDifficulty(difficulty);
    setPlayerColor(color);
    setOnlineRoomId(null);
    updateGameRoomUrl(null);
    resetGame();
  };

  const handleSelectOnline = (roomId: string, playerName: string) => {
    if (requireAuth()) return;
    socket.clearRatingSettlement();
    setMode('online');
    setOnlineRoomId(roomId);
    setOnlinePlayerName(playerName);
    updateGameRoomUrl(roomId);
    resetGame();
  };

  // ── Copy / Share ──────────────────────────────────────────
  const handleShareGame = () => {
    if (requireAuth()) return;
    let targetRoom = onlineRoomId;
    if (!targetRoom || mode !== 'online') {
      targetRoom = generateRoomId();
      setMode('online');
      setOnlineRoomId(targetRoom);
      updateGameRoomUrl(targetRoom);
      resetGame();
    }
    const shareUrl = getGameShareUrl(targetRoom);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Game room link copied! Send it to your friend to play.');
      });
    }
  };

  // ── Challenge a friend ────────────────────────────────────
  const handleChallengeFriend = (friend: FriendUser) => {
    if (requireAuth()) return;
    const roomId = `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    handleSelectOnline(roomId, user?.name || 'Warrior');
    const shareUrl = getGameShareUrl(roomId);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success(`Challenged ${friend.name}! Game link copied to clipboard.`);
      });
    }
  };

  // ── Board interaction guards ──────────────────────────────
  const handleBoardSquareClick = (coord: SquareCoord) => {
    if (requireAuth()) return;
    handleSquareClick(coord);
  };

  const handleBoardMove = (from: SquareCoord, to: SquareCoord) => {
    if (requireAuth()) return;
    handleMove(from, to);
  };

  // ── Matchmaking ───────────────────────────────────────────
  const handleFindMatch = () => {
    if (requireAuth()) return;
    const playerId = user?.id || 'player-' + Math.random().toString(36).substring(2, 8);
    const playerName = user?.username || user?.name || 'Warrior';
    socket.findMatch(playerId, playerName, user?.rating ?? 1500, user?.picture ?? null);
  };

  // ── New game / resign ─────────────────────────────────────
  const handleNewGame = () => {
    if (requireAuth()) return;
    socket.clearRatingSettlement();
    if (mode === 'online') {
      setIsLobbyOpen(true);
      return;
    }
    resetGame();
  };

  const handleResign = () => {
    if (requireAuth()) return;
    resignGame(playerColor);
  };

  return {
    friends,
    handleSelectMode,
    handleSelectLocal,
    handleSelectAI,
    handleSelectOnline,
    handleShareGame,
    handleChallengeFriend,
    handleBoardSquareClick,
    handleBoardMove,
    handleFindMatch,
    handleNewGame,
    handleResign,
  };
}
