import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { GameArena } from './components/GameArena';
import { AppModals } from './components/AppModals';
import { OnboardingPage } from './components/OnboardingPage';
import { AuthProvider } from './context/AuthProvider';
import { PieceThemeProvider } from './context/PieceThemeContext';
import { useAuth } from './context/AuthContext';
import { useChaturangaGame } from './hooks/useChaturangaGame';
import { useGameActions } from './hooks/useGameActions';
import { useAppRouting } from './hooks/useAppRouting';
import { useMatchmakingSearch } from './hooks/useMatchmakingSearch';
import { useMoveNavigation } from './hooks/useMoveNavigation';
import { pingBackendHealth } from './utils/auth-session';
import { Toaster } from './components/ui/sonner';
import { SidebarProvider } from './components/ui/sidebar';
import type { Move } from './types/game';

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
  } = useChaturangaGame({
    isAuthenticated,
    playerId: user?.id,
    playerName: user?.name,
  });

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

  useEffect(() => {
    pingBackendHealth().catch(() => {});
  }, []);

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

  const opponentName = getOpponentDisplayName(mode, aiDifficulty, socket.opponentName);

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

      <GameArena
        isMuted={isMuted}
        toggleMute={toggleMute}
        soundTheme={soundTheme}
        toggleSoundTheme={toggleSoundTheme}
        setIsHistoryOpen={setIsHistoryOpen}
        setIsFriendsOpen={setIsFriendsOpen}
        setIsLobbyOpen={setIsLobbyOpen}
        setIsRulesOpen={setIsRulesOpen}
        mode={mode}
        onlineRoomId={onlineRoomId}
        onlinePlayerName={onlinePlayerName}
        socket={socket}
        opponentName={opponentName}
        aiDifficulty={aiDifficulty}
        playerColor={playerColor}
        boardFlipped={boardFlipped}
        flipBoard={flipBoard}
        status={status}
        turn={turn}
        board={board}
        moveHistory={moveHistory}
        legalMoves={legalMoves}
        selectedSquare={selectedSquare}
        searchSeconds={searchSeconds}
        isMatchJustFound={isMatchJustFound}
        showEvalBar={showEvalBar}
        setShowEvalBar={setShowEvalBar}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        user={user}
        friends={friends}
        moveNav={moveNav}
        handleShareGame={handleShareGame}
        handleBoardSquareClick={handleBoardSquareClick}
        handleBoardMove={handleBoardMove}
        handleNewGame={handleNewGame}
        handleResign={handleResign}
        handleSelectAI={handleSelectAI}
        promptGoogleSignIn={promptGoogleSignIn}
      />

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
      <PieceThemeProvider>
        <ChaturangaApp />
        <Toaster />
      </PieceThemeProvider>
    </AuthProvider>
  );
}

