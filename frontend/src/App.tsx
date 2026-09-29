import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Battlefield } from './components/Battlefield';
import { GamePanel } from './components/GamePanel';
import { AppModals } from './components/AppModals';
import { OnboardingPage } from './components/OnboardingPage';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './context/AuthContext';
import { useChaturangaGame } from './hooks/useChaturangaGame';
import { useGameActions } from './hooks/useGameActions';
import { useAppRouting } from './hooks/useAppRouting';
import { useMatchmakingSearch } from './hooks/useMatchmakingSearch';
import { useMoveNavigation } from './hooks/useMoveNavigation';
import { getRoomIdFromUrl } from './utils/roomUrl';
import { Toaster } from './components/ui/sonner';
import { SidebarProvider, SidebarInset } from './components/ui/sidebar';
import type { PieceColor, GameStatus, Move } from './types/game';

function getOpponentDisplayName(
  mode: string,
  aiDifficulty: string,
  opponentName?: string | null
): string {
  if (mode === 'vs_ai') {
    const elo = aiDifficulty === 'novice' ? '1200' : aiDifficulty === 'warrior' ? '1500' : '1800';
    return `Computer (${elo})`;
  }
  if (mode === 'online') {
    return opponentName || 'Awaiting Opponent...';
  }
  return 'Empty Chair';
}

function getResignedOrMatedColor(status: GameStatus): PieceColor | null {
  if (status.type === 'resignation' || status.type === 'checkmate' || status.type === 'abandoned') {
    return status.winner === 'white' ? 'black' : 'white';
  }
  return null;
}

const RealmLoadingScreen: React.FC = () => (
  <div className="min-h-screen w-full bg-[#0d0c0a] flex items-center justify-center text-[#d4af37]">
    <div className="flex flex-col items-center gap-3">
      <img
        src="/logo.png"
        alt="Chaturanga Logo"
        className="w-14 h-14 object-contain animate-pulse drop-shadow-[0_4px_12px_rgba(212,175,55,0.25)]"
      />
      <span className="text-xs font-mono tracking-widest uppercase text-[#8a857d]">Entering Realm...</span>
    </div>
  </div>
);

function ChaturangaApp() {
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showEvalBar, setShowEvalBar] = useState(true);

  const { user, isAuthenticated, isLoading, promptGoogleSignIn, refreshUser } = useAuth();
  const { navigate } = useAppRouting({ isAuthenticated, user, isLoading });

  const {
    board,
    turn,
    status,
    moveHistory,
    capturedWhite,
    capturedBlack,
    selectedSquare,
    legalMoves,
    lastMove,
    inCheck,
    mode,
    aiDifficulty,
    playerColor,
    boardFlipped,
    flipBoard,
    isMuted,
    soundTheme,
    toggleSoundTheme,
    onlineRoomId,
    onlinePlayerName,
    socket,
    setMode,
    setAiDifficulty,
    setPlayerColor,
    setOnlineRoomId,
    setOnlinePlayerName,
    handleSquareClick,
    handleMove,
    resetGame,
    resignGame,
    toggleMute,
    loadGameMoves,
    playGameStart,
    playMove,
    playPieceMove,
    playCapture,
  } = useChaturangaGame({ isAuthenticated, playerId: user?.id });

  const moveNav = useMoveNavigation({
    moveHistory,
    liveBoard: board,
    liveTurn: turn,
    liveLastMove: lastMove,
    liveCapturedWhite: capturedWhite,
    liveCapturedBlack: capturedBlack,
    liveInCheck: inCheck,
    onFlipBoard: flipBoard,
    enabled: !isRulesOpen && !isLobbyOpen && !isFriendsOpen && !isHistoryOpen,
    playMove,
    playPieceMove,
    playCapture,
  });

  const handleLoadGameForReview = useCallback(
    (movesToLoad: Move[]) => {
      loadGameMoves(movesToLoad);
      if (movesToLoad.length > 0) {
        moveNav.selectMove(movesToLoad.length - 1);
      }
    },
    [loadGameMoves, moveNav]
  );

  // Refresh user profile whenever authoritative rating settlement occurs
  useEffect(() => {
    if (socket.ratingSettlement) {
      refreshUser();
    }
  }, [socket.ratingSettlement, refreshUser]);

  const { searchSeconds, isMatchJustFound } = useMatchmakingSearch({
    isSearching: socket.isSearching,
    matchedOpponent: socket.matchedOpponent,
    playGameStart,
  });

  // Synchronize authenticated user's name with online player identity
  useEffect(() => {
    if (user?.name) {
      setOnlinePlayerName(user.name);
    }
  }, [user?.name, setOnlinePlayerName]);

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_URL as string)?.replace(/\/$/, '');
    fetch(`${apiBase}/api/health`, { method: 'GET' }).catch(() => { });
  }, []);

  // Listen to browser URL changes (/game/:roomId) and popstate
  useEffect(() => {
    const syncFromUrl = () => {
      const urlRoomId = getRoomIdFromUrl();
      if (urlRoomId) {
        setMode('online');
        setOnlineRoomId(urlRoomId);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [setMode, setOnlineRoomId]);

  // All auth-guarded action handlers live in this hook
  const {
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
  } = useGameActions({
    mode,
    onlineRoomId,
    onlinePlayerName,
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
  });

  const materialAdvantageWhite = Math.max(0, moveNav.displayedEvalScore);
  const materialAdvantageBlack = Math.max(0, -moveNav.displayedEvalScore);
  const resignedOrMatedColor = getResignedOrMatedColor(status);
  const opponentName = getOpponentDisplayName(mode, aiDifficulty, socket.opponentName);

  const effectivePerspective: PieceColor = boardFlipped
    ? (playerColor === 'white' ? 'black' : 'white')
    : playerColor;

  if (isLoading) {
    return <RealmLoadingScreen />;
  }

  if (isAuthenticated && user && !user.onboarded) {
    return <OnboardingPage onCompleted={() => navigate('/')} />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar
        currentMode={mode}
        onSelectMode={handleSelectMode}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        incomingRequestsCount={friends.incomingCount}
        onFindMatch={handleFindMatch}
      />

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
          className={`flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row items-center justify-center p-2 sm:p-3 xl:p-4 gap-3 lg:gap-4 xl:gap-6 w-full ${mode === 'online' && onlineRoomId ? 'online-active' : ''
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
              targetRating={user?.rating ?? 1500}
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
              opponentRating={
                socket.matchedOpponent?.opponentRating ??
                (mode === 'vs_ai'
                  ? (aiDifficulty === 'novice' ? 1200 : aiDifficulty === 'warrior' ? 1500 : 1800)
                  : 1500)
              }
              playerName={user?.name || onlinePlayerName || 'You'}
              playerRating={user?.rating ?? 1500}
              gameMode={mode}
              onOpenLobby={() => setIsLobbyOpen(true)}
              onOpenFriends={() => setIsFriendsOpen(true)}
            />
          </div>
        </div>
      </SidebarInset>

      <AppModals
        isRulesOpen={isRulesOpen}
        onCloseRules={() => setIsRulesOpen(false)}
        isFriendsOpen={isFriendsOpen}
        onCloseFriends={() => setIsFriendsOpen(false)}
        isLobbyOpen={isLobbyOpen}
        onCloseLobby={() => setIsLobbyOpen(false)}
        isHistoryOpen={isHistoryOpen}
        onCloseHistory={() => setIsHistoryOpen(false)}
        mode={mode}
        aiDifficulty={aiDifficulty}
        onlineRoomId={onlineRoomId}
        onChallengeFriend={handleChallengeFriend}
        onSelectLocal={handleSelectLocal}
        onSelectAI={handleSelectAI}
        onSelectOnline={handleSelectOnline}
        onFindMatch={handleFindMatch}
        onLoadGameForReview={handleLoadGameForReview}
      />
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChaturangaApp />
      <Toaster />
    </AuthProvider>
  );
}
