import React from 'react';
import { SidebarInset } from './ui/sidebar';
import { TopBar } from './TopBar';
import { Battlefield } from './Battlefield';
import { GamePanel } from './GamePanel';
import type { PieceColor, GameStatus, Move, SquareCoord, Piece, GameMode, AIDifficulty } from '../types/game';
import type { User } from '../types/auth';
import type { useFriends } from '../hooks/useFriends';
import type { useChaturangaSocket } from '../hooks/useChaturangaSocket';
import type { useMoveNavigation } from '../hooks/useMoveNavigation';
import type { SoundTheme } from '@sounds';

function getResignedOrMatedColor(status: GameStatus): PieceColor | null {
  if (status.type === 'resignation' || status.type === 'checkmate' || status.type === 'abandoned') {
    return status.winner === 'white' ? 'black' : 'white';
  }
  return null;
}

function getOpponentRating(
  mode: GameMode,
  aiDifficulty: AIDifficulty,
  matchedOpponentRating?: number
): number {
  if (matchedOpponentRating !== undefined) {
    return matchedOpponentRating;
  }
  if (mode === 'vs_ai') {
    return aiDifficulty === 'novice' ? 1200 : aiDifficulty === 'warrior' ? 1500 : 1800;
  }
  return 1500;
}

export interface GameArenaProps {
  isMuted: boolean;
  toggleMute: () => void;
  soundTheme: SoundTheme;
  toggleSoundTheme: () => void;
  setIsHistoryOpen: (open: boolean) => void;
  setIsFriendsOpen: (open: boolean) => void;
  setIsLobbyOpen: (open: boolean) => void;
  setIsRulesOpen: (open: boolean) => void;
  mode: GameMode;
  onlineRoomId: string | null;
  onlinePlayerName: string;
  socket: ReturnType<typeof useChaturangaSocket>;
  opponentName: string;
  aiDifficulty: AIDifficulty;
  playerColor: PieceColor;
  boardFlipped: boolean;
  flipBoard: () => void;
  status: GameStatus;
  turn: PieceColor;
  board: (Piece | null)[][];
  moveHistory: Move[];
  legalMoves: SquareCoord[];
  selectedSquare: SquareCoord | null;
  searchSeconds: number;
  isMatchJustFound: boolean;
  showEvalBar: boolean;
  setShowEvalBar: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  friends: ReturnType<typeof useFriends>;
  moveNav: ReturnType<typeof useMoveNavigation>;
  handleShareGame: () => void;
  handleBoardSquareClick: (pos: SquareCoord) => void;
  handleBoardMove: (from: SquareCoord, to: SquareCoord) => void;
  handleNewGame: () => void;
  handleResign: () => void;
  handleSelectAI: (difficulty: AIDifficulty, color: PieceColor) => void;
  promptGoogleSignIn: () => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  isMuted,
  toggleMute,
  soundTheme,
  toggleSoundTheme,
  setIsHistoryOpen,
  setIsFriendsOpen,
  setIsLobbyOpen,
  setIsRulesOpen,
  mode,
  onlineRoomId,
  onlinePlayerName,
  socket,
  opponentName,
  aiDifficulty,
  playerColor,
  boardFlipped,
  flipBoard,
  status,
  turn,
  moveHistory,
  legalMoves,
  selectedSquare,
  searchSeconds,
  isMatchJustFound,
  showEvalBar,
  setShowEvalBar,
  isAuthenticated,
  isLoading,
  user,
  friends,
  moveNav,
  handleShareGame,
  handleBoardSquareClick,
  handleBoardMove,
  handleNewGame,
  handleResign,
  handleSelectAI,
  promptGoogleSignIn,
}) => {
  const materialAdvantageWhite = Math.max(0, moveNav.displayedEvalScore);
  const materialAdvantageBlack = Math.max(0, -moveNav.displayedEvalScore);
  const resignedOrMatedColor = getResignedOrMatedColor(status);
  const effectivePerspective: PieceColor = boardFlipped
    ? (playerColor === 'white' ? 'black' : 'white')
    : playerColor;

  const opponentRating = getOpponentRating(
    mode,
    aiDifficulty,
    socket.matchedOpponent?.opponentRating
  );
  const playerName = user?.name || onlinePlayerName || 'You';
  const playerRating = user?.rating ?? 1500;

  return (
    <SidebarInset className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
      <TopBar
        isMuted={isMuted}
        onToggleMute={toggleMute}
        soundTheme={soundTheme}
        onToggleSoundTheme={toggleSoundTheme}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        friendsCount={friends.friendsCount}
      />

      <div
        className={`flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row items-center justify-center p-2 sm:p-3 xl:p-4 gap-3 lg:gap-4 xl:gap-6 w-full ${
          mode === 'online' && onlineRoomId ? 'online-active' : ''
        }`}
      >
        <Battlefield
          mode={mode}
          onlineRoomId={onlineRoomId}
          socket={socket}
          opponentName={opponentName}
          aiDifficulty={aiDifficulty}
          playerColor={effectivePerspective}
          capturedWhite={moveNav.displayedCapturedWhite}
          capturedBlack={moveNav.displayedCapturedBlack}
          materialAdvantageWhite={materialAdvantageWhite}
          materialAdvantageBlack={materialAdvantageBlack}
          status={status}
          turn={moveNav.displayedTurn}
          searchSeconds={searchSeconds}
          uiFlags={{
            isMatchJustFound,
            showEvalBar,
            isAuthenticated,
            isLoading,
          }}
          user={user}
          friends={friends}
          inCheck={moveNav.displayedInCheck}
          lastMove={moveNav.displayedLastMove}
          board={moveNav.displayedBoard}
          legalMoves={legalMoves}
          selectedSquare={selectedSquare}
          resignedOrMatedColor={resignedOrMatedColor}
          evalScore={moveNav.displayedEvalScore}
          onlinePlayerName={onlinePlayerName}
          handleShareGame={handleShareGame}
          handleBoardSquareClick={handleBoardSquareClick}
          handleBoardMove={handleBoardMove}
          promptGoogleSignIn={promptGoogleSignIn}
          isReviewing={moveNav.isReviewing}
          selectedMoveIndex={moveNav.selectedMoveIndex}
          onReturnToLive={moveNav.returnToLive}
        />

        <div
          className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] flex justify-center shrink-0"
          style={{ height: 'var(--panel-height)' }}
        >
          <GamePanel
            moves={moveHistory}
            status={status}
            turn={turn}
            showEvalBar={showEvalBar}
            onToggleEvalBar={() => setShowEvalBar(prev => !prev)}
            onNewGame={handleNewGame}
            onOpenRules={() => setIsRulesOpen(true)}
            onResign={handleResign}
            roomId={onlineRoomId}
            onShare={handleShareGame}
            isSearching={socket.isSearching}
            searchDuration={searchSeconds}
            targetRating={playerRating}
            ratingSettlement={socket.ratingSettlement}
            onCancelSearch={socket.cancelFindMatch}
            onPlayBot={() => {
              socket.cancelFindMatch();
              handleSelectAI('warrior', 'white');
            }}
            selectedMoveIndex={moveNav.selectedMoveIndex}
            onSelectMove={moveNav.selectMove}
            onGoFirst={moveNav.goToFirst}
            onGoPrevious={moveNav.goToPrevious}
            onGoNext={moveNav.goToNext}
            onGoLast={moveNav.goToLast}
            isPlaying={moveNav.isPlaying}
            onTogglePlay={moveNav.togglePlay}
            canGoBack={moveNav.canGoBack}
            canGoForward={moveNav.canGoForward}
            onFlipBoard={flipBoard}
            opponentName={opponentName}
            opponentRating={opponentRating}
            playerName={playerName}
            playerRating={playerRating}
            gameMode={mode}
            onOpenLobby={() => setIsLobbyOpen(true)}
            onOpenFriends={() => setIsFriendsOpen(true)}
          />
        </div>
      </div>
    </SidebarInset>
  );
};
