import { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { AshtapadaBoard } from './components/AshtapadaBoard';
import { PlayerCard } from './components/PlayerCard';
import { GamePanel } from './components/GamePanel';
import { RulesModal } from './components/RulesModal';
import { LobbyModal } from './components/LobbyModal';
import { useChaturangaGame } from './hooks/useChaturangaGame';
import { evaluateBoard } from './engine/ai';
import type { GameMode, AIDifficulty, PieceColor } from './types/game';

export default function App() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [showEvalBar, setShowEvalBar] = useState(true);

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
    setMode,
    setAiDifficulty,
    setPlayerColor,
    setOnlineRoomId,
    setOnlinePlayerName,
    handleSquareClick,
    resetGame,
    resignGame,
    toggleMute,
  } = useChaturangaGame();

  // Mode switching handlers
  const handleSelectMode = (newMode: GameMode) => {
    setMode(newMode);
    if (newMode === 'online') {
      setIsLobbyOpen(true);
    } else {
      resetGame();
    }
  };

  const handleSelectLocal = () => {
    setMode('pass_and_play');
    setOnlineRoomId(null);
    resetGame();
  };

  const handleSelectAI = (difficulty: AIDifficulty, color: PieceColor) => {
    setMode('vs_ai');
    setAiDifficulty(difficulty);
    setPlayerColor(color);
    setOnlineRoomId(null);
    resetGame();
  };

  const handleSelectOnline = (roomId: string, playerName: string) => {
    setMode('online');
    setOnlineRoomId(roomId);
    setOnlinePlayerName(playerName);
    resetGame();
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
      ? 'Challenger'
      : 'Empty Chair';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#161512] text-[#e3ded7] font-sans">
      {/* Left Navigation Sidebar matching reference */}
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
        <div className="flex-1 overflow-y-auto flex flex-col xl:flex-row items-center justify-center p-2 sm:p-5 gap-4 lg:gap-8 max-w-7xl mx-auto w-full">
          {/* Middle: Opponent Card + Board + Player Card */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            {/* Opponent Card (Top) */}
            <PlayerCard
              name={opponentName}
              rating={mode === 'vs_ai' ? 1500 : undefined}
              capturedPieces={capturedBlack}
              materialAdvantage={materialAdvantageBlack}
              isActiveTurn={turn === (playerColor === 'white' ? 'black' : 'white')}
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
            />

            {/* Self Player Card (Bottom - as seen in screenshot: jaunty-barbareeka) */}
            <PlayerCard
              name="jaunty-barbareeka"
              rating={1624}
              countryFlag="🇮🇳"
              isSelf={true}
              capturedPieces={capturedWhite}
              materialAdvantage={materialAdvantageWhite}
              isActiveTurn={turn === playerColor}
            />
          </div>

          {/* Right: Tactical Command / Moves Panel matching reference */}
          <div className="w-full xl:w-auto flex justify-center">
            <GamePanel
              moves={moveHistory}
              status={status}
              turn={turn}
              showEvalBar={showEvalBar}
              onToggleEvalBar={() => setShowEvalBar(prev => !prev)}
              onNewGame={resetGame}
              onOpenRules={() => setIsRulesOpen(true)}
              onResign={() => resignGame(playerColor)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <LobbyModal
        isOpen={isLobbyOpen}
        currentMode={mode}
        currentDifficulty={aiDifficulty}
        onClose={() => setIsLobbyOpen(false)}
        onSelectLocal={handleSelectLocal}
        onSelectAI={handleSelectAI}
        onSelectOnline={handleSelectOnline}
      />
    </div>
  );
}
