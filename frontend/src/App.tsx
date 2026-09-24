import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AshtapadaBoard } from './components/AshtapadaBoard';
import { PlayerCard } from './components/PlayerCard';
import { GamePanel } from './components/GamePanel';
import { RulesModal } from './components/RulesModal';
import { LobbyModal } from './components/LobbyModal';
import { FriendsModal } from './components/FriendsModal';
import { OnboardingPage } from './components/OnboardingPage';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useChaturangaGame } from './hooks/useChaturangaGame';
import { useFriends } from './hooks/useFriends';
import { evaluateBoard } from './engine/ai';
import {
  getRoomIdFromUrl,
  updateGameRoomUrl,
  getGameShareUrl,
  generateRoomId,
} from './utils/roomUrl';
import type { GameMode, AIDifficulty, PieceColor, SquareCoord } from './types/game';
import type { FriendUser } from './types/friends';

function ChaturangaApp() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [showEvalBar, setShowEvalBar] = useState(true);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const { user, isAuthenticated, isLoading, promptGoogleSignIn, refreshUser } = useAuth();
  const friends = useFriends();

  const [, setCurrentPath] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  };

  // Route protection / Onboarding redirection
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user && !user.onboarded) {
      if (window.location.pathname !== '/onboard') {
        navigate('/onboard');
      }
    } else if (isAuthenticated && user?.onboarded) {
      if (window.location.pathname === '/onboard') {
        navigate('/');
      }
    } else if (!isAuthenticated) {
      if (window.location.pathname === '/onboard') {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, isLoading]);

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
    isMuted,
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
    playGameStart,
  } = useChaturangaGame({ isAuthenticated, playerId: user?.id });

  // Refresh user profile whenever authoritative rating settlement occurs
  useEffect(() => {
    if (socket.ratingSettlement) {
      refreshUser();
    }
  }, [socket.ratingSettlement, refreshUser]);

  // Matchmaking search timer & match found animation state
  const [searchSeconds, setSearchSeconds] = useState<number>(0);
  const [isMatchJustFound, setIsMatchJustFound] = useState<boolean>(false);

  useEffect(() => {
    if (!socket.isSearching) {
      setSearchSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setSearchSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [socket.isSearching]);

  // When match is found by socket, briefly highlight opponent card and play game start sound
  useEffect(() => {
    if (socket.matchedOpponent) {
      setIsMatchJustFound(true);
      playGameStart();
      const timeout = setTimeout(() => {
        setIsMatchJustFound(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [socket.matchedOpponent, playGameStart]);

  // Synchronize authenticated user's name with online player identity
  useEffect(() => {
    if (user?.name) {
      setOnlinePlayerName(user.name);
    }
  }, [user?.name, setOnlinePlayerName]);

  // Listen to browser URL changes (/game/:roomId) and popstate
  useEffect(() => {
    const syncFromUrl = () => {
      const urlRoomId = getRoomIdFromUrl();
      if (urlRoomId) {
        setMode('online');
        setOnlineRoomId(urlRoomId);
      }
    };

    // Initial check on mount
    syncFromUrl();

    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [setMode, setOnlineRoomId]);

  // Mode switching handlers
  const handleSelectMode = (newMode: GameMode) => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
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
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
    socket.clearRatingSettlement();
    setMode('pass_and_play');
    setOnlineRoomId(null);
    updateGameRoomUrl(null);
    resetGame();
  };

  const handleSelectAI = (difficulty: AIDifficulty, color: PieceColor) => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
    socket.clearRatingSettlement();
    setMode('vs_ai');
    setAiDifficulty(difficulty);
    setPlayerColor(color);
    setOnlineRoomId(null);
    updateGameRoomUrl(null);
    resetGame();
  };

  const handleSelectOnline = (roomId: string, playerName: string) => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
    socket.clearRatingSettlement();
    setMode('online');
    setOnlineRoomId(roomId);
    setOnlinePlayerName(playerName);
    updateGameRoomUrl(roomId);
    resetGame();
  };

  // Copy Game Room URL handler
  const handleShareGame = () => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
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
        setShareToast(`Game room link copied! Send it to your friend to play.`);
        setTimeout(() => setShareToast(null), 3000);
      });
    }
  };

  // Challenge a friend directly
  const handleChallengeFriend = (friend: FriendUser) => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
    const roomId = `match-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    handleSelectOnline(roomId, user?.name || 'Warrior');
    const shareUrl = getGameShareUrl(roomId);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setShareToast(`Challenged ${friend.name}! Game link copied to clipboard.`);
        setTimeout(() => setShareToast(null), 3000);
      });
    }
  };

  // Guarded board interaction handlers
  const handleBoardSquareClick = (coord: SquareCoord) => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
    handleSquareClick(coord);
  };

  const handleBoardMove = (from: SquareCoord, to: SquareCoord) => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
    handleMove(from, to);
  };

  const handleFindMatch = () => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
    const playerId = user?.id || 'player-' + Math.random().toString(36).substring(2, 8);
    const playerName = user?.username || user?.name || onlinePlayerName || 'Warrior';
    socket.findMatch(playerId, playerName, user?.rating ?? 1500, user?.picture ?? null);
  };

  const handleNewGame = () => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
    socket.clearRatingSettlement();
    if (mode === 'online') {
      setIsLobbyOpen(true);
      return;
    }
    resetGame();
  };

  const handleResign = () => {
    if (!isAuthenticated) {
      promptGoogleSignIn();
      return;
    }
    resignGame(playerColor);
  };

  // Compute live engine evaluation score
  const evalScore = useMemo(() => {
    const raw = evaluateBoard(board, 'white');
    return Number((raw / 100).toFixed(1));
  }, [board]);

  // Compute material difference
  const materialAdvantageWhite = Math.max(0, evalScore);
  const materialAdvantageBlack = Math.max(0, -evalScore);

  // Determine if a king is defeated/resigned for the fallen horizontal state
  const resignedOrMatedColor: PieceColor | null =
    status.type === 'resignation' || status.type === 'checkmate' || status.type === 'abandoned'
      ? status.winner === 'white'
        ? 'black'
        : 'white'
      : null;

  // Opponent name & avatar
  const opponentName =
    mode === 'vs_ai'
      ? `Computer (${aiDifficulty === 'novice' ? '1200' : aiDifficulty === 'warrior' ? '1500' : '1800'})`
      : mode === 'online'
      ? socket.opponentName || 'Awaiting Opponent...'
      : 'Empty Chair';

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0d0c0a] flex items-center justify-center text-[#d4af37]">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl animate-bounce">👑</span>
          <span className="text-xs font-mono tracking-widest uppercase text-[#8a857d]">Entering Realm...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user && !user.onboarded) {
    return <OnboardingPage onCompleted={() => navigate('/')} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#161512] text-[#e3ded7] font-sans">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentMode={mode}
        onSelectMode={handleSelectMode}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        incomingRequestsCount={friends.incomingCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onFindMatch={handleFindMatch}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <TopBar
          onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onOpenSettings={() => setIsRulesOpen(true)}
          onOpenFriends={() => setIsFriendsOpen(true)}
          friendsCount={friends.friendsCount}
        />

        {/* Center Battle Field & Control Panel */}
        <div
          className={`flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row items-center justify-center p-2 sm:p-3 xl:p-4 gap-3 lg:gap-4 xl:gap-6 w-full ${
            mode === 'online' && onlineRoomId ? 'online-active' : ''
          }`}
        >
          {/* Middle: Opponent Card + Board + Player Card */}
          <div
            className="flex flex-col items-center gap-1 shrink-0"
            style={{
              width: showEvalBar ? 'calc(var(--board-size) + 14px)' : 'var(--board-size)',
            }}
          >
            {/* Online Match Indicator Banner */}
            {mode === 'online' && onlineRoomId && (
              <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-[#201e1b] border border-[#2e2a24] text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      socket.status === 'connected'
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                        : socket.status === 'connecting'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-red-400'
                    }`}
                  />
                  <span className="text-[#8a857d] font-mono text-[11px]">Room:</span>
                  <span className="font-mono font-semibold text-[#fcd34d] text-[11px]">
                    {onlineRoomId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#b5b0a8] font-medium">
                    {socket.assignedColor
                      ? `Playing as ${socket.assignedColor === 'white' ? 'White ♔' : 'Black ♚'}`
                      : 'Connecting...'}
                  </span>
                  <button
                    onClick={handleShareGame}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2a2620] hover:bg-[#38332b] text-[10px] text-[#d4af37] border border-[#d4af37]/30 transition-colors cursor-pointer"
                    title="Copy game room invite link"
                  >
                    <span>Invite</span>
                  </button>
                </div>
              </div>
            )}

            {/* Opponent Card (Top) - with Chess.com searching animation on profile and name+rating */}
            <PlayerCard
              name={
                socket.isSearching
                  ? 'Searching for Opponent...'
                  : opponentName
              }
              rating={
                mode === 'vs_ai'
                  ? aiDifficulty === 'novice'
                    ? 1200
                    : aiDifficulty === 'warrior'
                    ? 1500
                    : 1800
                  : socket.matchedOpponent?.opponentRating ?? (mode === 'online' ? 1500 : undefined)
              }
              ratingDelta={mode === 'online' ? socket.opponentRatingSettlement?.ratingChange : undefined}
              ratingAfter={mode === 'online' ? socket.opponentRatingSettlement?.ratingAfter : undefined}
              avatarUrl={socket.matchedOpponent?.opponentPicture}
              capturedPieces={playerColor === 'white' ? capturedBlack : capturedWhite}
              materialAdvantage={playerColor === 'white' ? materialAdvantageBlack : materialAdvantageWhite}
              isActiveTurn={turn !== playerColor}
              isSearching={socket.isSearching}
              searchDuration={searchSeconds}
              targetRating={user?.rating ?? 1500}
              onCancelSearch={socket.cancelFindMatch}
              isMatchJustFound={isMatchJustFound}
              onAddFriend={
                mode === 'online' && socket.opponentId && socket.opponentId !== user?.id
                  ? async () => {
                      const res = await friends.sendRequest(socket.opponentId!);
                      if (res.success) {
                        setShareToast(`Alliance request sent to ${opponentName}!`);
                      } else {
                        setShareToast(res.error || 'Failed to send request');
                      }
                    }
                  : undefined
              }
              friendshipStatus={
                mode === 'online' && socket.opponentId
                  ? friends.isFriend(socket.opponentId)
                    ? 'friend'
                    : friends.hasPendingRequest(socket.opponentId)
                    ? 'pending_sent'
                    : 'none'
                  : undefined
              }
            />

            {/* The 8x8 Ashtāpada Board matching reference */}
            <div className="relative shrink-0 w-full flex justify-center">
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
                interactive={status.type === 'active' && isAuthenticated}
                onSquareClick={handleBoardSquareClick}
                onMove={handleBoardMove}
              />

              {/* Unauthenticated Lock Overlay */}
              {!isAuthenticated && !isLoading && (
                <div
                  onClick={promptGoogleSignIn}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/65 backdrop-blur-[2px] rounded cursor-pointer transition-all duration-300"
                  title="Click to sign in with Google"
                >
                  <div
                    onClick={e => e.stopPropagation()}
                    className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#1c1a17]/95 border border-[#3d3830] shadow-[0_20px_50px_rgba(0,0,0,0.85)] max-w-[280px] sm:max-w-[320px] animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#262421] border border-[#d4af37]/40 flex items-center justify-center text-2xl shadow-inner mb-3">
                      👑
                    </div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#fcd34d] tracking-wide mb-1">
                      Sign in to Play
                    </h3>
                    <p className="text-[11px] text-[#b5b0a8] mb-4 leading-relaxed">
                      Sign in with Google to make moves, battle players, and track your rating.
                    </p>
                    <div className="w-full flex justify-center">
                      <GoogleSignInButton
                        type="standard"
                        theme="filled_white"
                        size="large"
                        shape="pill"
                        width={240}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Self Player Card (Bottom) */}
            <PlayerCard
              name={
                user
                  ? user.username || user.name
                  : mode === 'online'
                  ? onlinePlayerName || 'You'
                  : 'Sign in to Play'
              }
              username={user?.username}
              rating={user ? user.rating : undefined}
              ratingDelta={mode === 'online' ? socket.ratingSettlement?.ratingChange : undefined}
              ratingAfter={mode === 'online' ? socket.ratingSettlement?.ratingAfter : undefined}
              avatarUrl={user?.picture}
              avatarIcon={!user ? '👑' : undefined}
              countryFlag={user ? '🇮🇳' : undefined}
              isSelf={true}
              capturedPieces={playerColor === 'white' ? capturedWhite : capturedBlack}
              materialAdvantage={playerColor === 'white' ? materialAdvantageWhite : materialAdvantageBlack}
              isActiveTurn={isAuthenticated && turn === playerColor}
            />
          </div>

          {/* Right: Tactical Command / Moves Panel */}
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
            />
          </div>
        </div>
      </div>

      {/* Copy Toast Feedback */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-[#201e1b] border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in duration-150">
          <span>✓</span>
          <span>{shareToast}</span>
        </div>
      )}

      {/* Modals */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        onChallengeFriend={handleChallengeFriend}
      />
      <LobbyModal
        isOpen={isLobbyOpen}
        currentMode={mode}
        currentDifficulty={aiDifficulty}
        initialRoomId={onlineRoomId}
        onClose={() => setIsLobbyOpen(false)}
        onSelectLocal={handleSelectLocal}
        onSelectAI={handleSelectAI}
        onSelectOnline={handleSelectOnline}
        onFindMatch={handleFindMatch}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChaturangaApp />
    </AuthProvider>
  );
}
