import React from 'react';
import { PlayerCard } from './PlayerCard';
import { SanskritCombatBanner } from './SanskritCombatBanner';
import { AshtapadaBoard } from './AshtapadaBoard';
import { OnlineMatchBanner } from './OnlineMatchBanner';
import { SignInOverlay } from './SignInOverlay';
import { toast } from 'sonner';
import type { GameMode, AIDifficulty, PieceColor, SquareCoord, Piece, Move, GameStatus } from '../types/game';

export interface BattlefieldUIFlags {
  isMatchJustFound: boolean;
  showEvalBar: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface BattlefieldProps {
  mode: GameMode;
  onlineRoomId: string | null;
  socket: {
    status: 'connected' | 'connecting' | 'disconnected' | 'error';
    assignedColor: PieceColor | null;
    isSearching: boolean;
    matchedOpponent?: {
      opponentRating?: number;
      opponentPicture?: string | null;
    } | null;
    opponentRatingSettlement?: {
      ratingChange: number;
      ratingAfter: number;
    } | null;
    ratingSettlement?: {
      ratingChange: number;
      ratingAfter: number;
    } | null;
    cancelFindMatch: () => void;
    opponentId?: string | null;
  };
  opponentName: string;
  aiDifficulty: AIDifficulty;
  playerColor: PieceColor;
  capturedWhite: Piece[];
  capturedBlack: Piece[];
  materialAdvantageWhite: number;
  materialAdvantageBlack: number;
  status: GameStatus;
  turn: PieceColor;
  searchSeconds: number;
  uiFlags: BattlefieldUIFlags;
  user: {
    id: string;
    name: string;
    username?: string;
    picture?: string | null;
    rating?: number;
  } | null;
  friends: {
    sendRequest: (id: string) => Promise<{ success: boolean; error?: string }>;
    isFriend: (id: string) => boolean;
    hasPendingRequest: (id: string) => boolean;
  };
  inCheck: PieceColor | null;
  lastMove: Move | null;
  board: (Piece | null)[][];
  legalMoves: SquareCoord[];
  selectedSquare: SquareCoord | null;
  resignedOrMatedColor: PieceColor | null;
  evalScore: number;
  onlinePlayerName: string;
  handleShareGame: () => void;
  handleBoardSquareClick: (coord: SquareCoord) => void;
  handleBoardMove: (from: SquareCoord, to: SquareCoord) => void;
  promptGoogleSignIn: () => void;
  isReviewing?: boolean;
  selectedMoveIndex?: number | null;
  onReturnToLive?: () => void;
}

function getOpponentRating(
  mode: GameMode,
  aiDifficulty: AIDifficulty,
  matchedOpponentRating?: number
): number | undefined {
  if (mode === 'vs_ai') {
    if (aiDifficulty === 'novice') return 1200;
    if (aiDifficulty === 'warrior') return 1500;
    return 1800;
  }
  return matchedOpponentRating ?? (mode === 'online' ? 1500 : undefined);
}

function getFriendshipStatus(
  mode: GameMode,
  opponentId: string | null | undefined,
  isFriend: (id: string) => boolean,
  hasPending: (id: string) => boolean
): 'friend' | 'pending_sent' | 'none' | undefined {
  if (mode !== 'online' || !opponentId) return undefined;
  if (isFriend(opponentId)) return 'friend';
  if (hasPending(opponentId)) return 'pending_sent';
  return 'none';
}

function getSelfDisplayName(
  user: { name: string; username?: string } | null,
  mode: GameMode,
  onlinePlayerName: string
): string {
  if (user) return user.username || user.name;
  if (mode === 'online') return onlinePlayerName || 'You';
  return 'Sign in to Play';
}

function createAddFriendHandler(
  mode: GameMode,
  opponentId: string | null | undefined,
  userId: string | undefined,
  opponentName: string,
  sendRequest: (id: string) => Promise<{ success: boolean; error?: string }>
) {
  if (mode !== 'online' || !opponentId || opponentId === userId) return undefined;
  return async () => {
    const res = await sendRequest(opponentId);
    if (res.success) {
      toast.success(`Alliance request sent to ${opponentName}!`);
    } else {
      toast.error(res.error || 'Failed to send request');
    }
  };
}

interface CapturedPair {
  opponentCaptured: Piece[];
  opponentAdvantage: number;
  selfCaptured: Piece[];
  selfAdvantage: number;
}

function getCapturedStats(
  isWhite: boolean,
  capturedWhite: Piece[],
  capturedBlack: Piece[],
  materialAdvantageWhite: number,
  materialAdvantageBlack: number
): CapturedPair {
  if (isWhite) {
    return {
      opponentCaptured: capturedBlack,
      opponentAdvantage: materialAdvantageBlack,
      selfCaptured: capturedWhite,
      selfAdvantage: materialAdvantageWhite,
    };
  }
  return {
    opponentCaptured: capturedWhite,
    opponentAdvantage: materialAdvantageWhite,
    selfCaptured: capturedBlack,
    selfAdvantage: materialAdvantageBlack,
  };
}

interface OpponentSectionProps {
  mode: GameMode;
  socket: BattlefieldProps['socket'];
  opponentName: string;
  aiDifficulty: AIDifficulty;
  capturedPieces: Piece[];
  materialAdvantage: number;
  isActiveTurn: boolean;
  searchSeconds: number;
  targetRating: number;
  isMatchJustFound: boolean;
  onAddFriend?: () => void;
  friendshipStatus?: 'friend' | 'pending_sent' | 'none';
}

const OpponentSection: React.FC<OpponentSectionProps> = ({
  mode,
  socket,
  opponentName,
  aiDifficulty,
  capturedPieces,
  materialAdvantage,
  isActiveTurn,
  searchSeconds,
  targetRating,
  isMatchJustFound,
  onAddFriend,
  friendshipStatus,
}) => {
  const opponentRating = getOpponentRating(
    mode,
    aiDifficulty,
    socket.matchedOpponent?.opponentRating
  );

  return (
    <PlayerCard
      name={socket.isSearching ? 'Searching for Opponent...' : opponentName}
      rating={opponentRating}
      ratingDelta={mode === 'online' ? socket.opponentRatingSettlement?.ratingChange : undefined}
      ratingAfter={mode === 'online' ? socket.opponentRatingSettlement?.ratingAfter : undefined}
      avatarUrl={socket.matchedOpponent?.opponentPicture}
      capturedPieces={capturedPieces}
      materialAdvantage={materialAdvantage}
      isActiveTurn={isActiveTurn}
      matchmaking={{
        isSearching: socket.isSearching,
        searchDuration: searchSeconds,
        targetRating,
        onCancelSearch: socket.cancelFindMatch,
        isMatchJustFound,
      }}
      onAddFriend={onAddFriend}
      friendshipStatus={friendshipStatus}
    />
  );
};

interface SelfSectionProps {
  mode: GameMode;
  socket: BattlefieldProps['socket'];
  user: BattlefieldProps['user'];
  selfName: string;
  capturedPieces: Piece[];
  materialAdvantage: number;
  isActiveTurn: boolean;
}

const SelfSection: React.FC<SelfSectionProps> = ({
  mode,
  socket,
  user,
  selfName,
  capturedPieces,
  materialAdvantage,
  isActiveTurn,
}) => (
  <PlayerCard
    name={selfName}
    username={user?.username}
    rating={user ? user.rating : undefined}
    ratingDelta={mode === 'online' ? socket.ratingSettlement?.ratingChange : undefined}
    ratingAfter={mode === 'online' ? socket.ratingSettlement?.ratingAfter : undefined}
    avatarUrl={user?.picture}
    countryFlag={user ? '🇮🇳' : undefined}
    isSelf={true}
    capturedPieces={capturedPieces}
    materialAdvantage={materialAdvantage}
    isActiveTurn={isActiveTurn}
  />
);

interface BoardContainerProps {
  board: (Piece | null)[][];
  turn: PieceColor;
  playerColor: PieceColor;
  legalMoves: SquareCoord[];
  selectedSquare: SquareCoord | null;
  lastMove: Move | null;
  inCheck: PieceColor | null;
  resignedOrMatedColor: PieceColor | null;
  evalScore: number;
  showEvalBar: boolean;
  interactive: boolean;
  showSignInOverlay: boolean;
  onSquareClick: (coord: SquareCoord) => void;
  onMove: (from: SquareCoord, to: SquareCoord) => void;
  onSignInClick: () => void;
  isReviewing?: boolean;
  selectedMoveIndex?: number | null;
  onReturnToLive?: () => void;
}

const BoardContainer: React.FC<BoardContainerProps> = ({
  board,
  turn,
  playerColor,
  legalMoves,
  selectedSquare,
  lastMove,
  inCheck,
  resignedOrMatedColor,
  evalScore,
  showEvalBar,
  interactive,
  showSignInOverlay,
  onSquareClick,
  onMove,
  onSignInClick,
  isReviewing,
  selectedMoveIndex,
  onReturnToLive,
}) => (
  <div className="relative shrink-0 w-full flex justify-center">
    {isReviewing && (
      <div className="absolute top-2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181613]/95 border border-[#d4af37]/70 shadow-[0_4px_20px_rgba(0,0,0,0.7)] backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
        <span className="w-2 h-2 rounded-full bg-[#fcd34d] animate-pulse" />
        <span className="text-xs font-semibold text-amber-200">
          {selectedMoveIndex === -1
            ? 'Starting Position'
            : `Move ${Math.floor((selectedMoveIndex ?? 0) / 2) + 1} (${((selectedMoveIndex ?? 0) % 2 === 0) ? 'White' : 'Black'})`}
        </span>
        <span className="text-[10px] text-[#8a857d] font-mono hidden sm:inline">
          (← → explore)
        </span>
        {onReturnToLive && (
          <button
            onClick={onReturnToLive}
            className="ml-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#d4af37] text-[#0e0906] hover:bg-[#fcd34d] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
            title="Return to current live position (↓ / End)"
          >
            <span>Live</span>
            <span className="text-xs">⏭</span>
          </button>
        )}
      </div>
    )}
    <AshtapadaBoard
      board={board}
      turn={turn}
      playerColor={playerColor}
      legalMoves={legalMoves}
      selectedSquare={selectedSquare}
      lastMove={lastMove}
      inCheck={inCheck}
      isResignedOrMated={resignedOrMatedColor}
      evaluationScore={evalScore}
      showEvalBar={showEvalBar}
      interactive={interactive}
      onSquareClick={onSquareClick}
      onMove={onMove}
    />
    {showSignInOverlay && <SignInOverlay onSignInClick={onSignInClick} />}
  </div>
);

export const Battlefield: React.FC<BattlefieldProps> = ({
  mode,
  onlineRoomId,
  socket,
  opponentName,
  aiDifficulty,
  playerColor,
  capturedWhite,
  capturedBlack,
  materialAdvantageWhite,
  materialAdvantageBlack,
  status,
  turn,
  searchSeconds,
  uiFlags,
  user,
  friends,
  inCheck,
  lastMove,
  board,
  legalMoves,
  selectedSquare,
  resignedOrMatedColor,
  evalScore,
  onlinePlayerName,
  handleShareGame,
  handleBoardSquareClick,
  handleBoardMove,
  promptGoogleSignIn,
  isReviewing = false,
  selectedMoveIndex = null,
  onReturnToLive,
}) => {
  const { isMatchJustFound, showEvalBar, isAuthenticated, isLoading } = uiFlags;

  const isWhite = playerColor === 'white';
  const { opponentCaptured, opponentAdvantage, selfCaptured, selfAdvantage } =
    getCapturedStats(
      isWhite,
      capturedWhite,
      capturedBlack,
      materialAdvantageWhite,
      materialAdvantageBlack
    );

  const handleAddFriend = createAddFriendHandler(
    mode,
    socket.opponentId,
    user?.id,
    opponentName,
    friends.sendRequest
  );

  const friendshipStatus = getFriendshipStatus(
    mode,
    socket.opponentId,
    friends.isFriend,
    friends.hasPendingRequest
  );

  const selfName = getSelfDisplayName(user, mode, onlinePlayerName);
  const isGameActive = status.type === 'active';
  const isOpponentTurn = isGameActive && turn !== playerColor && !isReviewing;
  const isSelfTurn = isGameActive && isAuthenticated && turn === playerColor && !isReviewing;

  return (
    <div
      className="flex flex-col items-center gap-1 shrink-0"
      style={{
        width: showEvalBar ? 'calc(var(--board-size) + 14px)' : 'var(--board-size)',
      }}
    >
      {mode === 'online' && onlineRoomId && (
        <OnlineMatchBanner
          roomId={onlineRoomId}
          socketStatus={socket.status}
          assignedColor={socket.assignedColor}
          onShare={handleShareGame}
        />
      )}

      <OpponentSection
        mode={mode}
        socket={socket}
        opponentName={opponentName}
        aiDifficulty={aiDifficulty}
        capturedPieces={opponentCaptured}
        materialAdvantage={opponentAdvantage}
        isActiveTurn={isOpponentTurn}
        searchSeconds={searchSeconds}
        targetRating={user?.rating ?? 1500}
        isMatchJustFound={isMatchJustFound}
        onAddFriend={handleAddFriend}
        friendshipStatus={friendshipStatus}
      />

      <SanskritCombatBanner
        inCheck={inCheck}
        status={status}
        lastMoveIsPromotion={Boolean(lastMove?.promotion)}
      />

      <BoardContainer
        board={board}
        turn={turn}
        playerColor={playerColor}
        legalMoves={isReviewing ? [] : legalMoves}
        selectedSquare={isReviewing ? null : selectedSquare}
        lastMove={lastMove}
        inCheck={inCheck}
        resignedOrMatedColor={resignedOrMatedColor}
        evalScore={evalScore}
        showEvalBar={showEvalBar}
        interactive={isGameActive && isAuthenticated && !isReviewing}
        showSignInOverlay={!isAuthenticated && !isLoading}
        onSquareClick={isReviewing ? () => onReturnToLive?.() : handleBoardSquareClick}
        onMove={isReviewing ? () => {} : handleBoardMove}
        onSignInClick={promptGoogleSignIn}
        isReviewing={isReviewing}
        selectedMoveIndex={selectedMoveIndex}
        onReturnToLive={onReturnToLive}
      />

      <SelfSection
        mode={mode}
        socket={socket}
        user={user}
        selfName={selfName}
        capturedPieces={selfCaptured}
        materialAdvantage={selfAdvantage}
        isActiveTurn={isSelfTurn}
      />
    </div>
  );
};
