import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCw,
  BarChart2,
  Sliders,
  BookOpen,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  Flag,
  Swords,
  Bot,
  Clock,
  PlusSquare,
  LayoutGrid,
  Users,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import type { Move, GameStatus, PieceColor } from '../types/game';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

// ── Shared Utilities ─────────────────────────────────────────

const formatTime = (totalSec = 0) => {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getPieceSymbol = (type: string) => {
  switch (type) {
    case 'ratha': return '♖';
    case 'gaja': return '♗';
    case 'ashva': return '♘';
    case 'mantri': return '♕';
    case 'raja': return '♔';
    case 'padati':
    default: return '♙';
  }
};

const getStatusText = (status: GameStatus, turn: 'white' | 'black') => {
  if (status.type === 'checkmate') return `${status.winner.toUpperCase()} WINS BY CHECKMATE`;
  if (status.type === 'bare_king') return `${status.winner.toUpperCase()} WINS BY BARE KING`;
  if (status.type === 'resignation') return `${status.winner === 'white' ? 'White' : 'Black'} wins by resignation`;
  if (status.type === 'abandoned') return `${status.winner === 'white' ? 'White' : 'Black'} wins by abandonment`;
  if (status.type === 'stalemate') return 'DRAW BY STALEMATE';
  return `${turn.toUpperCase()} TO MOVE`;
};

export interface RatingSettlement {
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
}

interface PairedMove {
  num: number;
  white?: Move;
  black?: Move;
}

// ── Top Navigation Row (Play, New Game, Games, Players) ──────

interface TopIconBarProps {
  onNewGame: () => void;
  onOpenGames?: () => void;
  onOpenPlayers?: () => void;
  onSelectPlayTab: () => void;
  activeTab: 'moves' | 'info';
}

const TopIconBar: React.FC<TopIconBarProps> = ({
  onNewGame,
  onOpenGames,
  onOpenPlayers,
  onSelectPlayTab,
  activeTab,
}) => (
  <div className="grid grid-cols-4 border-b border-[#262421] bg-[#141310] select-none">
    <button
      onClick={onSelectPlayTab}
      className={`flex flex-col items-center justify-center py-2 px-1 text-[11px] font-medium transition-colors ${
        activeTab === 'moves'
          ? 'text-[#fcd34d] bg-[#221e17] font-semibold'
          : 'text-[#8a857d] hover:text-[#e3ded7] hover:bg-[#1a1815]'
      }`}
    >
      <Clock className="w-4 h-4 mb-0.5" />
      <span>Play</span>
    </button>

    <button
      onClick={onNewGame}
      className="flex flex-col items-center justify-center py-2 px-1 text-[11px] font-medium text-[#8a857d] hover:text-[#e3ded7] hover:bg-[#1a1815] transition-colors"
      title="Start New Game"
    >
      <PlusSquare className="w-4 h-4 mb-0.5" />
      <span>New Game</span>
    </button>

    <button
      onClick={onOpenGames}
      className="flex flex-col items-center justify-center py-2 px-1 text-[11px] font-medium text-[#8a857d] hover:text-[#e3ded7] hover:bg-[#1a1815] transition-colors"
      title="View Lobbies & Challenges"
    >
      <LayoutGrid className="w-4 h-4 mb-0.5" />
      <span>Games</span>
    </button>

    <button
      onClick={onOpenPlayers}
      className="flex flex-col items-center justify-center py-2 px-1 text-[11px] font-medium text-[#8a857d] hover:text-[#e3ded7] hover:bg-[#1a1815] transition-colors"
      title="Friends & Social"
    >
      <Users className="w-4 h-4 mb-0.5" />
      <span>Players</span>
    </button>
  </div>
);

// ── Tab Bar (Moves, Info) ────────────────────────────────────

interface TabHeaderProps {
  activeTab: 'moves' | 'info';
  onTabChange: (tab: 'moves' | 'info') => void;
}

const TabHeader: React.FC<TabHeaderProps> = ({ activeTab, onTabChange }) => (
  <div className="flex items-center border-b border-[#262421] bg-[#161512] text-xs font-medium">
    <button
      onClick={() => onTabChange('moves')}
      className={`flex-1 py-2 text-center transition-colors relative cursor-pointer ${
        activeTab === 'moves'
          ? 'text-[#fcd34d] font-bold'
          : 'text-[#8a857d] hover:text-[#d4cfc7]'
      }`}
    >
      <span>Moves</span>
      {activeTab === 'moves' && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]" />
      )}
    </button>

    <button
      onClick={() => onTabChange('info')}
      className={`flex-1 py-2 text-center transition-colors relative cursor-pointer ${
        activeTab === 'info'
          ? 'text-[#fcd34d] font-bold'
          : 'text-[#8a857d] hover:text-[#d4cfc7]'
      }`}
    >
      <span>Info</span>
      {activeTab === 'info' && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]" />
      )}
    </button>
  </div>
);

// ── Move Row ─────────────────────────────────────────────────

interface MoveRowProps {
  pair: PairedMove;
  selectedMoveIndex: number | null;
  totalMoves: number;
  onSelectMove: (index: number) => void;
  activeRef?: React.RefObject<HTMLButtonElement | null>;
}

const MoveRow: React.FC<MoveRowProps> = ({
  pair,
  selectedMoveIndex,
  totalMoves,
  onSelectMove,
  activeRef,
}) => {
  const whiteMoveIndex = (pair.num - 1) * 2;
  const blackMoveIndex = whiteMoveIndex + 1;
  const isWhiteActive =
    selectedMoveIndex === whiteMoveIndex ||
    (selectedMoveIndex === null && totalMoves - 1 === whiteMoveIndex);
  const isBlackActive =
    selectedMoveIndex === blackMoveIndex ||
    (selectedMoveIndex === null && totalMoves - 1 === blackMoveIndex);

  return (
    <div
      className={`grid grid-cols-12 items-center py-1 px-2 rounded text-[#d4cfc7] text-xs ${
        pair.num % 2 === 0 ? 'bg-[#201e1b]/40' : 'bg-transparent'
      }`}
    >
      {/* Turn Number */}
      <span className="col-span-2 text-[#635f58] font-mono text-[11px]">
        {pair.num}.
      </span>

      {/* White Move */}
      <div className="col-span-5 flex items-center pr-1">
        {pair.white && (
          <button
            ref={isWhiteActive ? activeRef : undefined}
            onClick={() => onSelectMove(whiteMoveIndex)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer w-full text-left font-mono ${
              isWhiteActive
                ? 'bg-[#473b2c] text-[#fcd34d] font-bold shadow-sm ring-1 ring-[#d4af37]/40'
                : 'hover:bg-[#262421]'
            }`}
          >
            <span className="text-sm font-sans">
              {getPieceSymbol(pair.white.piece.type)}
            </span>
            <span className="truncate">{pair.white.san}</span>
          </button>
        )}
      </div>

      {/* Black Move */}
      <div className="col-span-5 flex items-center pl-1">
        {pair.black && (
          <button
            ref={isBlackActive ? activeRef : undefined}
            onClick={() => onSelectMove(blackMoveIndex)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer w-full text-left font-mono ${
              isBlackActive
                ? 'bg-[#473b2c] text-[#fcd34d] font-bold shadow-sm ring-1 ring-[#d4af37]/40'
                : 'hover:bg-[#262421]'
            }`}
          >
            <span className="text-sm font-sans">
              {getPieceSymbol(pair.black.piece.type)}
            </span>
            <span className="truncate">{pair.black.san}</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ── Match Info Card (Matches Screenshot) ─────────────────────

interface MatchInfoCardProps {
  opponentName: string;
  opponentRating?: number;
  playerName: string;
  playerRating?: number;
  gameMode?: string;
  ratingSettlement?: RatingSettlement | null;
}

const MatchInfoCard: React.FC<MatchInfoCardProps> = ({
  opponentName,
  opponentRating,
  playerName,
  playerRating,
  gameMode = 'vs_ai',
  ratingSettlement,
}) => {
  const modeLabel =
    gameMode === 'vs_ai'
      ? '10 min'
      : gameMode === 'online'
      ? 'Rapid 10 min'
      : 'Pass & Play';

  return (
    <div className="px-3 py-2 bg-[#171512] border-t border-[#262421] text-center select-none">
      <div className="font-semibold text-xs text-[#e3ded7] truncate">
        <span className="text-[#fcd34d]">{opponentName}</span>
        {opponentRating && (
          <span className="text-[#8a857d] font-normal"> ({opponentRating})</span>
        )}
        <span className="text-[#635f58] mx-1.5 font-normal">vs.</span>
        <span className="text-white">{playerName}</span>
        {playerRating && (
          <span className="text-[#8a857d] font-normal"> ({playerRating})</span>
        )}
        <span className="text-[#8a857d] font-normal text-[11px] ml-1">({modeLabel})</span>
      </div>

      <div className="text-[11px] text-[#8a857d] font-mono mt-0.5 flex items-center justify-center gap-1.5">
        {ratingSettlement ? (
          <div className="flex items-center gap-1">
            <span>Result:</span>
            <span className="text-white font-medium">
              {Math.round(ratingSettlement.ratingBefore)} → {Math.round(ratingSettlement.ratingAfter)}
            </span>
            <Badge
              variant={ratingSettlement.ratingChange >= 0 ? 'emerald' : 'destructive'}
              className="px-1 py-0 text-[10px]"
            >
              {ratingSettlement.ratingChange >= 0 ? '+' : ''}
              {Math.round(ratingSettlement.ratingChange)}
            </Badge>
          </div>
        ) : (
          <>
            <span className="text-emerald-400 font-medium">win +8</span>
            <span className="text-[#444]">/</span>
            <span className="text-[#a89f91]">draw +0</span>
            <span className="text-[#444]">/</span>
            <span className="text-red-400 font-medium">lose -8</span>
          </>
        )}
      </div>
    </div>
  );
};

// ── 5-Button Move Navigation Toolbar ─────────────────────────

interface NavigationToolbarProps {
  onGoFirst: () => void;
  onGoPrevious: () => void;
  onTogglePlay: () => void;
  onGoNext: () => void;
  onGoLast: () => void;
  isPlaying: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

const NavigationToolbar: React.FC<NavigationToolbarProps> = ({
  onGoFirst,
  onGoPrevious,
  onTogglePlay,
  onGoNext,
  onGoLast,
  isPlaying,
  canGoBack,
  canGoForward,
}) => (
  <div className="grid grid-cols-5 gap-1 p-2 bg-[#12110e] border-t border-[#262421]">
    {/* First Move |< */}
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          onClick={onGoFirst}
          disabled={!canGoBack}
          aria-label="First Move / Starting Position (↑ / Home)"
          className="h-9 bg-[#1d1b17] hover:bg-[#28241e] border border-[#2e2922] text-[#c5beb3] disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Starting Position (↑ / Home)</TooltipContent>
    </Tooltip>

    {/* Previous Move < */}
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          onClick={onGoPrevious}
          disabled={!canGoBack}
          aria-label="Previous Move (←)"
          className="h-9 bg-[#1d1b17] hover:bg-[#28241e] border border-[#2e2922] text-[#c5beb3] disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Previous Move (←)</TooltipContent>
    </Tooltip>

    {/* Play / Pause Autoplay ▶ / ⏸ */}
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause Autoplay (Space)' : 'Play Moves (Space)'}
          className={`h-9 border border-[#2e2922] transition-colors ${
            isPlaying
              ? 'bg-[#3d321d] text-[#fcd34d] border-[#d4af37]/60 shadow-[0_0_10px_rgba(212,175,55,0.2)]'
              : 'bg-[#1d1b17] hover:bg-[#28241e] text-[#c5beb3]'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4 text-[#fcd34d]" /> : <Play className="w-4 h-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {isPlaying ? 'Pause Replay (Space)' : 'Autoplay Moves (Space)'}
      </TooltipContent>
    </Tooltip>

    {/* Next Move > */}
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          onClick={onGoNext}
          disabled={!canGoForward}
          aria-label="Next Move (→)"
          className="h-9 bg-[#1d1b17] hover:bg-[#28241e] border border-[#2e2922] text-[#c5beb3] disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Next Move (→)</TooltipContent>
    </Tooltip>

    {/* Latest / Live Move >| */}
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          onClick={onGoLast}
          disabled={!canGoForward}
          aria-label="Live Position / Latest Move (↓ / End)"
          className="h-9 bg-[#1d1b17] hover:bg-[#28241e] border border-[#2e2922] text-[#c5beb3] disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Live Position (↓ / End)</TooltipContent>
    </Tooltip>
  </div>
);

// ── Bottom Action Bar (⚑ Abort/Resign, 🔄 Flip) ──────────────

interface BottomActionBarProps {
  onResign: () => void;
  onFlipBoard?: () => void;
  movesCount: number;
}

const BottomActionBar: React.FC<BottomActionBarProps> = ({
  onResign,
  onFlipBoard,
  movesCount,
}) => {
  const isAbort = movesCount < 2;

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[#161512] border-t border-[#262421]">
      {/* Abort / Resign */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResign}
            className="h-8 px-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 gap-1.5"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{isAbort ? 'Abort Game' : 'Resign Battlefield'}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isAbort ? 'Abort game with no rating penalty' : 'Resign the battlefield'}
        </TooltipContent>
      </Tooltip>

      {/* Flip Board */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFlipBoard}
            className="h-8 px-3 text-xs text-[#a89f91] hover:text-[#e3ded7] hover:bg-[#24201a] gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Flip Board</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Flip Board Perspective (F)</TooltipContent>
      </Tooltip>
    </div>
  );
};

// ── Game Info Tab ────────────────────────────────────────────

interface InfoTabProps {
  onToggleAnalyze: () => void;
  isAnalyzeActive: boolean;
  onToggleEvalBar: () => void;
  showEvalBar: boolean;
  onOpenRules: () => void;
  onShare: () => void;
  copied: boolean;
}

const InfoTab: React.FC<InfoTabProps> = ({
  onToggleAnalyze,
  isAnalyzeActive,
  onToggleEvalBar,
  showEvalBar,
  onOpenRules,
  onShare,
  copied,
}) => (
  <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#181613] text-xs">
    {/* Commands card */}
    <div className="p-3 rounded-lg bg-[#1f1d19] border border-[#2d2821] space-y-2">
      <h5 className="font-serif font-bold text-xs text-[#fcd34d] uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
        <span>Game Tools</span>
      </h5>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleAnalyze}
          className={`justify-start gap-1.5 border-[#383126] text-xs ${
            isAnalyzeActive ? 'bg-[#2e2619] text-[#fcd34d] border-[#d4af37]/60' : 'text-[#baa994]'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>{isAnalyzeActive ? 'Analysis ON' : 'Analysis OFF'}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleEvalBar}
          className={`justify-start gap-1.5 border-[#383126] text-xs ${
            showEvalBar ? 'bg-[#2e2619] text-sky-400 border-sky-500/50' : 'text-[#baa994]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showEvalBar ? 'Eval Bar ON' : 'Eval Bar OFF'}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenRules}
          className="justify-start gap-1.5 border-[#383126] text-xs text-[#baa994] hover:text-white"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Rules Guide</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onShare}
          className={`justify-start gap-1.5 border-[#383126] text-xs ${
            copied ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40' : 'text-[#baa994]'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Share Room'}</span>
        </Button>
      </div>
    </div>

    {/* Keyboard shortcuts cheatsheet */}
    <div className="p-3 rounded-lg bg-[#1f1d19] border border-[#2d2821] space-y-2">
      <h5 className="font-serif font-bold text-xs text-[#fcd34d] uppercase tracking-wider flex items-center gap-1.5">
        <Keyboard className="w-3.5 h-3.5 text-[#d4af37]" />
        <span>Keyboard Navigation</span>
      </h5>

      <div className="space-y-1.5 text-[11px] font-mono">
        <div className="flex items-center justify-between text-[#d4cfc7]">
          <span>Previous Move:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#2b261e] border border-[#3d362a] text-amber-200">← Left Arrow</kbd>
        </div>
        <div className="flex items-center justify-between text-[#d4cfc7]">
          <span>Next Move:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#2b261e] border border-[#3d362a] text-amber-200">→ Right Arrow</kbd>
        </div>
        <div className="flex items-center justify-between text-[#d4cfc7]">
          <span>Starting Position:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#2b261e] border border-[#3d362a] text-amber-200">↑ / Home</kbd>
        </div>
        <div className="flex items-center justify-between text-[#d4cfc7]">
          <span>Live / Latest Move:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#2b261e] border border-[#3d362a] text-amber-200">↓ / End</kbd>
        </div>
        <div className="flex items-center justify-between text-[#d4cfc7]">
          <span>Autoplay Replay:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#2b261e] border border-[#3d362a] text-amber-200">Space</kbd>
        </div>
        <div className="flex items-center justify-between text-[#d4cfc7]">
          <span>Flip Board:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#2b261e] border border-[#3d362a] text-amber-200">F / X</kbd>
        </div>
      </div>
    </div>
  </div>
);

// ── Searching Opponent View ──────────────────────────────────

interface SearchingViewProps {
  searchDuration: number;
  minRating: number;
  maxRating: number;
  onPlayBot?: () => void;
  onCancelSearch?: () => void;
}

const SearchingView: React.FC<SearchingViewProps> = ({
  searchDuration,
  minRating,
  maxRating,
  onPlayBot,
  onCancelSearch,
}) => (
  <div className="flex-1 flex flex-col items-center justify-center p-5 text-center select-none">
    <div className="w-12 h-12 rounded-full bg-[#1e1b17] border border-[#3e3527] flex items-center justify-center mb-3">
      <Swords className="w-5 h-5 text-[#d4af37]" />
    </div>

    <h4 className="font-serif font-bold text-white text-sm tracking-wide">
      Finding Opponent...
    </h4>
    <p className="text-[11px] text-[#8a857d] mt-1 max-w-[220px] leading-relaxed">
      Matching with a player of equal prowess across the Ashtāpada realm.
    </p>

    <div className="mt-3 px-3 py-1 rounded bg-[#24201a] border border-[#383125] font-mono text-xs text-[#baa994]">
      Elapsed: {formatTime(searchDuration)}
    </div>

    <div className="w-full mt-4 p-3 rounded-lg bg-[#201d19] border border-[#2e2922] text-[11px]">
      <div className="flex items-center justify-between text-[#baa994] font-medium mb-1.5">
        <span>Rating Bracket</span>
        <span className="font-mono text-amber-300 font-bold">{minRating} – {maxRating}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[#2c2720] overflow-hidden">
        <div
          className="h-full bg-[#d4af37] rounded-full transition-[width] duration-700"
          style={{ width: `${Math.min(100, 25 + (searchDuration / 15) * 75)}%`, margin: '0 auto' }}
        />
      </div>
    </div>

    {onPlayBot && (
      <Button
        variant="outline"
        onClick={onPlayBot}
        className="w-full mt-4 h-9 gap-2 text-xs border-[#3a3328] hover:border-[#d4af37]/50 text-[#c8bfae]"
      >
        <Bot className="w-4 h-4 text-amber-400" />
        <span>Play vs Computer</span>
      </Button>
    )}

    {onCancelSearch && (
      <Button
        variant="secondary"
        onClick={onCancelSearch}
        className="w-full mt-2 h-9 text-xs font-semibold hover:bg-red-950/40 hover:text-red-300 border-[#363026]"
      >
        Cancel Search
      </Button>
    )}
  </div>
);

// ── Main GamePanel Component ─────────────────────────────────

export interface GamePanelProps {
  moves: Move[];
  status: GameStatus;
  turn: 'white' | 'black';
  showEvalBar: boolean;
  onToggleEvalBar: () => void;
  onNewGame: () => void;
  onOpenRules: () => void;
  onResign: () => void;
  roomId?: string | null;
  onShare?: () => void;
  isSearching?: boolean;
  searchDuration?: number;
  targetRating?: number;
  ratingSettlement?: RatingSettlement | null;
  onCancelSearch?: () => void;
  onPlayBot?: () => void;
  // Move exploration props
  selectedMoveIndex?: number | null;
  onSelectMove?: (index: number | null) => void;
  onGoFirst?: () => void;
  onGoPrevious?: () => void;
  onGoNext?: () => void;
  onGoLast?: () => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onFlipBoard?: () => void;
  opponentName?: string;
  opponentRating?: number;
  playerName?: string;
  playerRating?: number;
  gameMode?: string;
  onOpenLobby?: () => void;
  onOpenFriends?: () => void;
}

function useGamePanelNavigation({
  moves,
  externalSelectedMoveIndex,
  externalOnSelectMove,
  externalOnGoFirst,
  externalOnGoPrevious,
  externalOnGoNext,
  externalOnGoLast,
  externalOnTogglePlay,
  externalCanGoBack,
  externalCanGoForward,
}: {
  moves: Move[];
  externalSelectedMoveIndex?: number | null;
  externalOnSelectMove?: (idx: number | null) => void;
  externalOnGoFirst?: () => void;
  externalOnGoPrevious?: () => void;
  externalOnGoNext?: () => void;
  externalOnGoLast?: () => void;
  externalOnTogglePlay?: () => void;
  externalCanGoBack?: boolean;
  externalCanGoForward?: boolean;
}) {
  const [internalSelectedMoveIndex, setInternalSelectedMoveIndex] = useState<number | null>(null);
  const selectedMoveIndex = externalSelectedMoveIndex !== undefined
    ? externalSelectedMoveIndex
    : internalSelectedMoveIndex;

  const handleSelectMove = (idx: number | null) => {
    if (externalOnSelectMove) {
      externalOnSelectMove(idx);
    } else {
      setInternalSelectedMoveIndex(idx);
    }
  };

  const handleGoFirst = externalOnGoFirst || (() => handleSelectMove(-1));
  const handleGoPrevious = externalOnGoPrevious || (() => {
    if (selectedMoveIndex === null) {
      if (moves.length === 0) handleSelectMove(-1);
      else handleSelectMove(Math.max(-1, moves.length - 2));
    } else if (selectedMoveIndex <= -1) {
      handleSelectMove(-1);
    } else {
      handleSelectMove(selectedMoveIndex - 1);
    }
  });
  const handleGoNext = externalOnGoNext || (() => {
    if (selectedMoveIndex === null) return;
    if (selectedMoveIndex === -1) {
      if (moves.length <= 1) handleSelectMove(null);
      else handleSelectMove(0);
    } else if (selectedMoveIndex >= moves.length - 2) {
      handleSelectMove(null);
    } else {
      handleSelectMove(selectedMoveIndex + 1);
    }
  });
  const handleGoLast = externalOnGoLast || (() => handleSelectMove(null));
  const handleTogglePlay = externalOnTogglePlay || (() => {});

  const canGoBack = externalCanGoBack !== undefined
    ? externalCanGoBack
    : moves.length > 0 && (selectedMoveIndex === null || selectedMoveIndex > -1);
  const canGoForward = externalCanGoForward !== undefined
    ? externalCanGoForward
    : selectedMoveIndex !== null;

  return {
    selectedMoveIndex,
    handleSelectMove,
    handleGoFirst,
    handleGoPrevious,
    handleGoNext,
    handleGoLast,
    handleTogglePlay,
    canGoBack,
    canGoForward,
  };
}

interface MovesTabContentProps {
  status: GameStatus;
  turn: PieceColor;
  moves: Move[];
  pairedMoves: PairedMove[];
  selectedMoveIndex: number | null;
  isStartingPositionActive: boolean;
  startingPosRef: React.RefObject<HTMLButtonElement | null>;
  activeMoveRef: React.RefObject<HTMLButtonElement | null>;
  handleGoFirst: () => void;
  handleGoPrevious: () => void;
  handleTogglePlay: () => void;
  handleGoNext: () => void;
  handleGoLast: () => void;
  handleSelectMove: (idx: number | null) => void;
  externalIsPlaying: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onResign: () => void;
  onFlipBoard?: () => void;
  opponentName: string;
  opponentRating: number;
  playerName: string;
  playerRating: number;
  gameMode?: string;
  ratingSettlement?: RatingSettlement | null;
}

const MovesTabContent: React.FC<MovesTabContentProps> = ({
  status,
  turn,
  moves,
  pairedMoves,
  selectedMoveIndex,
  isStartingPositionActive,
  startingPosRef,
  activeMoveRef,
  handleGoFirst,
  handleGoPrevious,
  handleTogglePlay,
  handleGoNext,
  handleGoLast,
  handleSelectMove,
  externalIsPlaying,
  canGoBack,
  canGoForward,
  onResign,
  onFlipBoard,
  opponentName,
  opponentRating,
  playerName,
  playerRating,
  gameMode,
  ratingSettlement,
}) => {
  const isGameOver = status.type !== 'active';

  return (
    <>
      <div
        className={`w-full py-1.5 px-3 text-center text-[11px] font-semibold tracking-wide border-b border-[#262421] ${
          isGameOver
            ? 'bg-[#352717] text-[#fcd34d]'
            : 'bg-[#181613] text-[#d4cfc7]'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {!isGameOver && (
            <span
              className={`w-2 h-2 rounded-full border ${
                turn === 'white'
                  ? 'bg-[#f0ebe1] border-[#d4af37]'
                  : 'bg-[#161412] border-[#555]'
              }`}
            />
          )}
          <span className="font-mono uppercase tracking-wider">{getStatusText(status, turn)}</span>
        </div>
      </div>

      <button
        ref={startingPosRef}
        onClick={handleGoFirst}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium border-b border-[#262421] transition-colors cursor-pointer text-left ${
          isStartingPositionActive
            ? 'bg-[#3d321d] text-[#fcd34d] font-bold shadow-sm'
            : 'text-[#a89f91] hover:bg-[#201e1b] hover:text-[#e3ded7]'
        }`}
        title="Starting Position (↑ / Home)"
      >
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Starting Position</span>
        </div>
        <span className="text-[10px] text-[#8a857d] font-mono">Move 0</span>
      </button>

      <ScrollArea className="flex-1 px-2.5 py-1.5 font-mono text-xs">
        {pairedMoves.length === 0 ? (
          <div className="h-36 flex flex-col items-center justify-center text-[#635f58] italic font-sans text-xs gap-1.5 text-center px-4">
            <Swords className="w-5 h-5 text-[#8a857d]/40" />
            <span>Battle awaits first command...</span>
            <span className="text-[11px] text-[#635f58]/60">Use ← → arrow keys to explore moves once played</span>
          </div>
        ) : (
          <div className="space-y-0.5">
            {pairedMoves.map(pair => (
              <MoveRow
                key={pair.num}
                pair={pair}
                selectedMoveIndex={selectedMoveIndex}
                totalMoves={moves.length}
                onSelectMove={idx => handleSelectMove(idx)}
                activeRef={activeMoveRef}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <MatchInfoCard
        opponentName={opponentName}
        opponentRating={opponentRating}
        playerName={playerName}
        playerRating={playerRating}
        gameMode={gameMode}
        ratingSettlement={ratingSettlement}
      />

      <NavigationToolbar
        onGoFirst={handleGoFirst}
        onGoPrevious={handleGoPrevious}
        onTogglePlay={handleTogglePlay}
        onGoNext={handleGoNext}
        onGoLast={handleGoLast}
        isPlaying={externalIsPlaying}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
      />

      <BottomActionBar
        onResign={onResign}
        onFlipBoard={onFlipBoard}
        movesCount={moves.length}
      />
    </>
  );
};

export const GamePanel: React.FC<GamePanelProps> = ({
  moves,
  status,
  turn,
  showEvalBar,
  onToggleEvalBar,
  onNewGame,
  onOpenRules,
  onResign,
  roomId,
  onShare,
  isSearching = false,
  searchDuration = 0,
  targetRating = 1500,
  ratingSettlement,
  onCancelSearch,
  onPlayBot,
  selectedMoveIndex: externalSelectedMoveIndex,
  onSelectMove: externalOnSelectMove,
  onGoFirst: externalOnGoFirst,
  onGoPrevious: externalOnGoPrevious,
  onGoNext: externalOnGoNext,
  onGoLast: externalOnGoLast,
  isPlaying: externalIsPlaying = false,
  onTogglePlay: externalOnTogglePlay,
  canGoBack: externalCanGoBack,
  canGoForward: externalCanGoForward,
  onFlipBoard,
  opponentName = 'Computer (1500)',
  opponentRating = 1500,
  playerName = 'You',
  playerRating = 1500,
  gameMode = 'vs_ai',
  onOpenLobby,
  onOpenFriends,
}) => {
  const [activeTab, setActiveTab] = useState<'moves' | 'info'>('moves');
  const [isAnalyzeActive, setIsAnalyzeActive] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const {
    selectedMoveIndex,
    handleSelectMove,
    handleGoFirst,
    handleGoPrevious,
    handleGoNext,
    handleGoLast,
    handleTogglePlay,
    canGoBack,
    canGoForward,
  } = useGamePanelNavigation({
    moves,
    externalSelectedMoveIndex,
    externalOnSelectMove,
    externalOnGoFirst,
    externalOnGoPrevious,
    externalOnGoNext,
    externalOnGoLast,
    externalOnTogglePlay,
    externalCanGoBack,
    externalCanGoForward,
  });

  // Active move ref for auto-scrolling
  const activeMoveRef = useRef<HTMLButtonElement | null>(null);
  const startingPosRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (selectedMoveIndex === -1 && startingPosRef.current) {
      startingPosRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (activeMoveRef.current) {
      activeMoveRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedMoveIndex]);

  const bracket = Math.min(300, 50 + Math.floor(searchDuration / 3) * 30);
  const minRating = Math.max(100, targetRating - bracket);
  const maxRating = targetRating + bracket;

  const handleShare = () => {
    if (onShare) {
      onShare();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      return;
    }

    const shareUrl = roomId
      ? `${window.location.origin}/game/${encodeURIComponent(roomId)}`
      : window.location.href;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // Group moves into turns (White move, Black move)
  const pairedMoves: PairedMove[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairedMoves.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  const isStartingPositionActive = selectedMoveIndex === -1 || (selectedMoveIndex === null && moves.length === 0);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] bg-[#1a1815] border border-[#2a2620] rounded-xl overflow-hidden flex flex-col shadow-xl text-xs select-none h-full min-h-[460px] lg:min-h-0">
        {/* Top Icon Row */}
        <TopIconBar
          onNewGame={onNewGame}
          onOpenGames={onOpenLobby}
          onOpenPlayers={onOpenFriends}
          onSelectPlayTab={() => setActiveTab('moves')}
          activeTab={activeTab}
        />

        {/* Tab Headers: Moves | Chat | Info */}
        <TabHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {isSearching ? (
          <SearchingView
            searchDuration={searchDuration}
            minRating={minRating}
            maxRating={maxRating}
            onPlayBot={onPlayBot}
            onCancelSearch={onCancelSearch}
          />
        ) : activeTab === 'moves' ? (
          <MovesTabContent
            status={status}
            turn={turn}
            moves={moves}
            pairedMoves={pairedMoves}
            selectedMoveIndex={selectedMoveIndex}
            isStartingPositionActive={isStartingPositionActive}
            startingPosRef={startingPosRef}
            activeMoveRef={activeMoveRef}
            handleGoFirst={handleGoFirst}
            handleGoPrevious={handleGoPrevious}
            handleTogglePlay={handleTogglePlay}
            handleGoNext={handleGoNext}
            handleGoLast={handleGoLast}
            handleSelectMove={handleSelectMove}
            externalIsPlaying={externalIsPlaying}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onResign={onResign}
            onFlipBoard={onFlipBoard}
            opponentName={opponentName}
            opponentRating={opponentRating}
            playerName={playerName}
            playerRating={playerRating}
            gameMode={gameMode}
            ratingSettlement={ratingSettlement}
          />
        ) : (
          <InfoTab
            onToggleAnalyze={() => setIsAnalyzeActive(!isAnalyzeActive)}
            isAnalyzeActive={isAnalyzeActive}
            onToggleEvalBar={onToggleEvalBar}
            showEvalBar={showEvalBar}
            onOpenRules={onOpenRules}
            onShare={handleShare}
            copied={copied}
          />
        )}
      </div>
    </TooltipProvider>
  );
};
