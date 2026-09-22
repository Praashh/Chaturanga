import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AshtapadaBoard } from './components/AshtapadaBoard';
import { PlayerCard } from './components/PlayerCard';
import { GamePanel } from './components/GamePanel';
import { RulesModal } from './components/RulesModal';
import { LobbyModal } from './components/LobbyModal';
import { useChaturangaGame } from './hooks/useChaturangaGame';
import { evaluateBoard } from './engine/ai';
import {
  getRoomIdFromUrl,
  updateGameRoomUrl,
  getGameShareUrl,
  generateRoomId,
} from './utils/roomUrl';
import type { GameMode, AIDifficulty, PieceColor } from './types/game';

export default function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [showEvalBar, setShowEvalBar] = useState(true);
  const [shareToast, setShareToast] = useState<string | null>(null);

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
  } = useChaturangaGame();

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
    setMode('pass_and_play');
    setOnlineRoomId(null);
    updateGameRoomUrl(null);
    resetGame();
  };

  const handleSelectAI = (difficulty: AIDifficulty, color: PieceColor) => {
    setMode('vs_ai');
    setAiDifficulty(difficulty);
    setPlayerColor(color);
    setOnlineRoomId(null);
    updateGameRoomUrl(null);
    resetGame();
  };

  const handleSelectOnline = (roomId: string, playerName: string) => {
    setMode('online');
    setOnlineRoomId(roomId);
    setOnlinePlayerName(playerName);
    updateGameRoomUrl(roomId);
    resetGame();
  };

  // Copy Game Room URL handler
  const handleShareGame = () => {
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
    status.type === 'resignation' || status.type === 'checkmate'
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#161512] text-[#e3ded7] font-sans">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentMode={mode}
        onSelectMode={handleSelectMode}
        onOpenRules={() => setIsRulesOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <TopBar
          onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onOpenSettings={() => setIsRulesOpen(true)}
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

            {/* Opponent Card (Top) */}
            <PlayerCard
              name={opponentName}
              rating={mode === 'vs_ai' ? 1500 : undefined}
              capturedPieces={playerColor === 'white' ? capturedBlack : capturedWhite}
              materialAdvantage={playerColor === 'white' ? materialAdvantageBlack : materialAdvantageWhite}
              isActiveTurn={turn !== playerColor}
            />

            {/* The 8x8 Ashtāpada Board matching reference */}
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
              interactive={status.type === 'active'}
              onSquareClick={handleSquareClick}
              onMove={handleMove}
            />

            {/* Self Player Card (Bottom) */}
            <PlayerCard
              name={mode === 'online' ? onlinePlayerName || 'You' : 'jaunty-barbareeka'}
              rating={1624}
              countryFlag="🇮🇳"
              isSelf={true}
              capturedPieces={playerColor === 'white' ? capturedWhite : capturedBlack}
              materialAdvantage={playerColor === 'white' ? materialAdvantageWhite : materialAdvantageBlack}
              isActiveTurn={turn === playerColor}
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
              onNewGame={resetGame}
              onOpenRules={() => setIsRulesOpen(true)}
              onResign={() => resignGame(playerColor)}
              roomId={onlineRoomId}
              onShare={handleShareGame}
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
      <LobbyModal
        isOpen={isLobbyOpen}
        currentMode={mode}
        currentDifficulty={aiDifficulty}
        initialRoomId={onlineRoomId}
        onClose={() => setIsLobbyOpen(false)}
        onSelectLocal={handleSelectLocal}
        onSelectAI={handleSelectAI}
        onSelectOnline={handleSelectOnline}
      />
    </div>
  );
}
