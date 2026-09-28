import React, { useState } from 'react';
import {
  RotateCcw,
  BarChart2,
  Sliders,
  BookOpen,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Flag,
  Swords,
  Bot,
} from 'lucide-react';
import type { Move, GameStatus } from '../types/game';
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

// ── Sub-Components ───────────────────────────────────────────

interface ActionToolbarProps {
  onNewGame: () => void;
  isAnalyzeActive: boolean;
  onToggleAnalyze: () => void;
  showEvalBar: boolean;
  onToggleEvalBar: () => void;
  onOpenRules: () => void;
  copied: boolean;
  onShare: () => void;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onNewGame,
  isAnalyzeActive,
  onToggleAnalyze,
  showEvalBar,
  onToggleEvalBar,
  onOpenRules,
  copied,
  onShare,
}) => (
  <div className="flex items-center justify-between px-3 py-2 border-b border-[#262421] bg-[#161512]">
    <div className="flex items-center gap-1.5 font-serif font-bold text-xs text-[#e3ded7] tracking-wide">
      <span className="text-[#d4af37]">⚔️</span>
      <span>Command</span>
    </div>

    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onNewGame}
            aria-label="New Game"
            className="text-[#8a857d] hover:text-white hover:bg-[#262421]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">New Game</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleAnalyze}
            aria-label="Toggle Engine Evaluation"
            className={`text-[#8a857d] hover:text-white hover:bg-[#262421] ${isAnalyzeActive ? 'text-[#fcd34d] bg-[#2a2418]' : ''}`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Toggle Engine Evaluation</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleEvalBar}
            aria-label="Toggle Eval Bar"
            className={`text-[#8a857d] hover:text-white hover:bg-[#262421] ${showEvalBar ? 'text-sky-400 bg-[#262421]' : ''}`}
          >
            <Sliders className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Toggle Eval Bar</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenRules}
            aria-label="Rules & Piece Guide"
            className="text-[#8a857d] hover:text-white hover:bg-[#262421]"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Rules & Piece Guide</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onShare}
            aria-label="Share Room Link"
            className={`text-[#8a857d] hover:text-white hover:bg-[#262421] ${copied ? 'text-emerald-400 bg-emerald-950/60' : ''}`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {copied ? 'Link Copied!' : 'Share Room Link'}
        </TooltipContent>
      </Tooltip>
    </div>
  </div>
);

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

interface RatingSettlement {
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
}

interface StatusBannerProps {
  status: GameStatus;
  turn: 'white' | 'black';
  isGameOver: boolean;
  ratingSettlement?: RatingSettlement | null;
}

const StatusBanner: React.FC<StatusBannerProps> = ({
  status,
  turn,
  isGameOver,
  ratingSettlement,
}) => (
  <div
    className={`w-full py-2 px-3 text-center text-xs font-semibold tracking-wide border-b border-[#262421] ${
      isGameOver
        ? 'bg-[#352717] text-[#fcd34d]'
        : 'bg-[#1b1916] text-[#d4cfc7]'
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
      <span className="font-mono text-[11px] uppercase tracking-wider">{getStatusText(status, turn)}</span>
    </div>
    {isGameOver && ratingSettlement && (
      <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-mono">
        <span className="text-[#a89f91]">Rating:</span>
        <span className="text-white font-medium">
          {Math.round(ratingSettlement.ratingBefore)} → {Math.round(ratingSettlement.ratingAfter)}
        </span>
        <Badge
          variant={ratingSettlement.ratingChange >= 0 ? 'emerald' : 'destructive'}
          className="px-1.5 py-0 text-[10px]"
        >
          {ratingSettlement.ratingChange >= 0 ? '+' : ''}
          {Math.round(ratingSettlement.ratingChange)}
        </Badge>
      </div>
    )}
  </div>
);

interface PairedMove {
  num: number;
  white?: Move;
  black?: Move;
}

interface MoveRowProps {
  pair: PairedMove;
  selectedMoveIndex: number | null;
  totalMoves: number;
  onSelectMove: (index: number) => void;
}

const MoveRow: React.FC<MoveRowProps> = ({ pair, selectedMoveIndex, totalMoves, onSelectMove }) => {
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
      className={`grid grid-cols-12 items-center py-1 px-2 rounded text-[#d4cfc7] ${
        pair.num % 2 === 0 ? 'bg-[#201e1b]/40' : 'bg-transparent'
      }`}
    >
      {/* Move Number */}
      <span className="col-span-2 text-[#635f58] font-sans text-[11px]">
        {pair.num}.
      </span>

      {/* White Move */}
      <div className="col-span-5 flex items-center">
        {pair.white && (
          <button
            onClick={() => onSelectMove(whiteMoveIndex)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors cursor-pointer w-full text-left ${
              isWhiteActive
                ? 'bg-[#473b2c] text-[#fcd34d] font-bold shadow-sm'
                : 'hover:bg-[#262421]'
            }`}
          >
            <span className="text-sm">
              {getPieceSymbol(pair.white.piece.type)}
            </span>
            <span>{pair.white.san}</span>
          </button>
        )}
      </div>

      {/* Black Move */}
      <div className="col-span-5 flex items-center">
        {pair.black && (
          <button
            onClick={() => onSelectMove(blackMoveIndex)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors cursor-pointer w-full text-left ${
              isBlackActive
                ? 'bg-[#473b2c] text-[#fcd34d] font-bold shadow-sm'
                : 'hover:bg-[#262421]'
            }`}
          >
            <span className="text-sm">
              {getPieceSymbol(pair.black.piece.type)}
            </span>
            <span>{pair.black.san}</span>
          </button>
        )}
      </div>
    </div>
  );
};

interface MoveChronicleProps {
  moves: Move[];
  pairedMoves: PairedMove[];
  selectedMoveIndex: number | null;
  onSelectMove: React.Dispatch<React.SetStateAction<number | null>>;
}

const MoveChronicle: React.FC<MoveChronicleProps> = ({
  moves,
  pairedMoves,
  selectedMoveIndex,
  onSelectMove,
}) => (
  <>
    {/* MOVES Header with Navigation Controls */}
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#262421] text-[#8a857d] font-semibold text-[11px] bg-[#161512]">
      <span className="tracking-wider uppercase text-[10px]">Move Chronicle</span>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onSelectMove(0)}
          className="hover:text-white"
          title="First Move"
          aria-label="First Move"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            onSelectMove(prev => Math.max(0, (prev ?? moves.length - 1) - 1))
          }
          className="hover:text-white"
          title="Previous Move"
          aria-label="Previous Move"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            onSelectMove(prev => Math.min(moves.length - 1, (prev ?? 0) + 1))
          }
          className="hover:text-white"
          title="Next Move"
          aria-label="Next Move"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onSelectMove(null)}
          className="hover:text-white"
          title="Latest Move"
          aria-label="Latest Move"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>

    {/* Move Chronicle Table inside ScrollArea */}
    <ScrollArea className="flex-1 px-2.5 py-1.5 font-mono text-xs">
      {pairedMoves.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center text-[#635f58] italic font-sans text-xs gap-1">
          <span>Battle awaits first command...</span>
        </div>
      ) : (
        <div className="space-y-0.5">
          {pairedMoves.map(pair => (
            <MoveRow
              key={pair.num}
              pair={pair}
              selectedMoveIndex={selectedMoveIndex}
              totalMoves={moves.length}
              onSelectMove={idx => onSelectMove(idx)}
            />
          ))}
        </div>
      )}
    </ScrollArea>
  </>
);

interface ResignBarProps {
  onResign: () => void;
  moveCount: number;
}

const ResignBar: React.FC<ResignBarProps> = ({ onResign, moveCount }) => (
  <div className="p-2 border-t border-[#262421] bg-[#161512] flex items-center justify-between">
    <Button
      variant="destructive"
      size="sm"
      onClick={onResign}
      className="h-8 gap-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 font-semibold"
    >
      <Flag className="w-3.5 h-3.5" />
      <span>Resign</span>
    </Button>
    <span className="text-[11px] text-[#8a857d] font-mono">
      {moveCount} half-moves
    </span>
  </div>
);

// ── Main Component ───────────────────────────────────────────

interface GamePanelProps {
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
}

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
}) => {
  const [isAnalyzeActive, setIsAnalyzeActive] = useState<boolean>(true);
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

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

  const isGameOver = status.type !== 'active';

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] bg-[#1a1815] border border-[#2a2620] rounded-xl overflow-hidden flex flex-col shadow-xl text-xs select-none h-full min-h-[440px] lg:min-h-0">
        <ActionToolbar
          onNewGame={onNewGame}
          isAnalyzeActive={isAnalyzeActive}
          onToggleAnalyze={() => setIsAnalyzeActive(!isAnalyzeActive)}
          showEvalBar={showEvalBar}
          onToggleEvalBar={onToggleEvalBar}
          onOpenRules={onOpenRules}
          copied={copied}
          onShare={handleShare}
        />

        {isSearching ? (
          <SearchingView
            searchDuration={searchDuration}
            minRating={minRating}
            maxRating={maxRating}
            onPlayBot={onPlayBot}
            onCancelSearch={onCancelSearch}
          />
        ) : (
          <>
            <StatusBanner
              status={status}
              turn={turn}
              isGameOver={isGameOver}
              ratingSettlement={ratingSettlement}
            />
            <MoveChronicle
              moves={moves}
              pairedMoves={pairedMoves}
              selectedMoveIndex={selectedMoveIndex}
              onSelectMove={setSelectedMoveIndex}
            />
          </>
        )}

        {!isGameOver && <ResignBar onResign={onResign} moveCount={moves.length} />}
      </div>
    </TooltipProvider>
  );
};
