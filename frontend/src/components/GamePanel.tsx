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
  onCancelSearch,
  onPlayBot,
}) => {
  const [isAnalyzeActive, setIsAnalyzeActive] = useState<boolean>(true);
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const formatTime = (totalSec = 0) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
  const pairedMoves: { num: number; white?: Move; black?: Move }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairedMoves.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  const getPieceSymbol = (type: string) => {
    switch (type) {
      case 'ratha':
        return '🛞';
      case 'gaja':
        return '🐘';
      case 'ashva':
        return '♞';
      case 'mantri':
        return '🧙';
      case 'raja':
        return '👑';
      case 'padati':
      default:
        return '♟';
    }
  };

  const getStatusBannerText = () => {
    if (status.type === 'checkmate') {
      return `${status.winner.toUpperCase()} WINS BY CHECKMATE`;
    }
    if (status.type === 'bare_king') {
      return `${status.winner.toUpperCase()} WINS BY BARE KING`;
    }
    if (status.type === 'resignation') {
      return `${status.winner === 'white' ? 'White' : 'Black'} wins by resignation`;
    }
    if (status.type === 'stalemate') {
      return 'DRAW BY STALEMATE';
    }
    return `${turn === 'white' ? 'White' : 'Black'} to move`;
  };

  const isGameOver = status.type !== 'active';

  return (
    <div className="w-full lg:w-[320px] xl:w-[340px] 2xl:w-[360px] bg-[#1a1815] border border-[#262421] rounded-lg overflow-hidden flex flex-col shadow-xl text-xs select-none h-full min-h-[440px] lg:min-h-0">
      {/* Top Action Tabs matching screenshot */}

      <div className="flex items-center justify-between p-2 border-b border-[#262421] bg-[#161512]">
        <button
          onClick={onNewGame}
          className="flex flex-col items-center gap-1 p-1.5 rounded-md hover:bg-[#262421] text-[#b5b0a8] hover:text-[#ffffff] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-[10px]">New game</span>
        </button>

        <button
          onClick={() => setIsAnalyzeActive(!isAnalyzeActive)}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
            isAnalyzeActive
              ? 'bg-[#1d4ed8] text-white font-semibold shadow'
              : 'hover:bg-[#262421] text-[#b5b0a8]'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span className="text-[10px]">Analyze</span>
        </button>

        <button
          onClick={onToggleEvalBar}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-md transition-colors ${
            showEvalBar
              ? 'bg-[#262421] text-sky-400'
              : 'hover:bg-[#262421] text-[#b5b0a8]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span className="text-[10px]">Eval bar</span>
        </button>

        <button
          onClick={onOpenRules}
          className="flex flex-col items-center gap-1 p-1.5 rounded-md hover:bg-[#262421] text-[#b5b0a8] hover:text-[#ffffff] transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px]">Piece guide</span>
        </button>

        <button
          onClick={handleShare}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-md transition-all ${
            copied
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/50 shadow-sm'
              : 'hover:bg-[#262421] text-[#b5b0a8] hover:text-[#ffffff]'
          }`}
          title={copied ? 'Game room link copied!' : 'Share Game Room'}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          <span className={`text-[10px] font-medium ${copied ? 'text-emerald-400 font-bold' : ''}`}>
            {copied ? 'Copied!' : 'Share'}
          </span>
        </button>
      </div>

      {/* Matchmaking Queue Search State vs Game Moves Chronicle */}
      {isSearching ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center select-none">
          <div className="relative w-16 h-16 flex items-center justify-center mb-3">
            <div className="absolute inset-0 rounded-full border border-[#d4af37]/20 animate-ping duration-1000" />
            <div className="absolute inset-2 rounded-full border border-[#d4af37]/40 animate-pulse" />
            <div className="w-10 h-10 rounded-full bg-[#201d19] border border-[#d4af37]/60 flex items-center justify-center shadow-lg">
              <Swords className="w-5 h-5 text-[#fcd34d] animate-pulse" />
            </div>
          </div>

          <h4 className="font-serif font-bold text-white text-sm tracking-wide">
            Searching for Opponent...
          </h4>
          <p className="text-[11px] text-[#8a857d] mt-1 max-w-[200px]">
            Looking for a worthy challenger of similar rating across the realm.
          </p>

          <div className="mt-3 px-3 py-1 rounded-full bg-[#221f1a] border border-[#363026] text-xs font-mono font-semibold text-[#fcd34d]">
            ⏱ {formatTime(searchDuration)}
          </div>

          <div className="w-full mt-4 p-2.5 rounded-lg bg-[#201d19] border border-[#2e2922] text-[11px]">
            <div className="flex items-center justify-between text-[#baa994] font-medium mb-1">
              <span>Rating Window</span>
              <span className="font-mono text-amber-300">{minRating} – {maxRating}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#2c2720] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, 25 + (searchDuration / 15) * 75)}%`, margin: '0 auto' }}
              />
            </div>
          </div>

          {onPlayBot && (
            <button
              onClick={onPlayBot}
              className="w-full mt-4 py-2 px-3 rounded-lg bg-[#24201a] hover:bg-[#2e2920] border border-[#3a3328] hover:border-[#d4af37]/40 text-[#c8bfae] hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>Play vs Computer</span>
            </button>
          )}

          {onCancelSearch && (
            <button
              onClick={onCancelSearch}
              className="w-full mt-2.5 py-2 rounded-lg bg-[#26221c] hover:bg-red-950/40 text-[#baa994] hover:text-red-300 border border-[#363026] hover:border-red-800/50 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-98"
            >
              Cancel Search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Status Announcement Banner (as seen in screenshot: "Black wins by resignation") */}
          <div
            className={`w-full py-2 px-3 text-center text-xs font-semibold tracking-wide border-b border-[#262421] ${
              isGameOver
                ? 'bg-[#3b2b1a] text-[#fcd34d]'
                : 'bg-[#201e1b] text-[#d4cfc7]'
            }`}
          >
            {getStatusBannerText()}
          </div>

          {/* MOVES Header with Navigation Controls */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#262421] text-[#8a857d] font-semibold text-[11px]">
            <span>MOVES</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedMoveIndex(0)}
                className="p-1 hover:bg-[#262421] hover:text-white rounded"
                title="First Move"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  setSelectedMoveIndex(prev => Math.max(0, (prev ?? moves.length - 1) - 1))
                }
                className="p-1 hover:bg-[#262421] hover:text-white rounded"
                title="Previous Move"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  setSelectedMoveIndex(prev => Math.min(moves.length - 1, (prev ?? 0) + 1))
                }
                className="p-1 hover:bg-[#262421] hover:text-white rounded"
                title="Next Move"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedMoveIndex(null)}
                className="p-1 hover:bg-[#262421] hover:text-white rounded"
                title="Latest Move"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Move Chronicle Table matching screenshot */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 font-mono text-xs">
            {pairedMoves.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#635f58] italic font-sans text-xs">
                Awaiting first command...
              </div>
            ) : (
              pairedMoves.map(pair => {
                const whiteMoveIndex = (pair.num - 1) * 2;
                const blackMoveIndex = whiteMoveIndex + 1;
                const isWhiteActive =
                  selectedMoveIndex === whiteMoveIndex ||
                  (selectedMoveIndex === null && moves.length - 1 === whiteMoveIndex);
                const isBlackActive =
                  selectedMoveIndex === blackMoveIndex ||
                  (selectedMoveIndex === null && moves.length - 1 === blackMoveIndex);

                return (
                  <div
                    key={pair.num}
                    className="grid grid-cols-12 items-center py-1 px-1.5 rounded hover:bg-[#262421]/60 text-[#d4cfc7]"
                  >
                    {/* Move Number */}
                    <span className="col-span-2 text-[#635f58] font-sans">
                      {pair.num}.
                    </span>

                    {/* White Move */}
                    <div className="col-span-5 flex items-center">
                      {pair.white && (
                        <button
                          onClick={() => setSelectedMoveIndex(whiteMoveIndex)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${
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
                          onClick={() => setSelectedMoveIndex(blackMoveIndex)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${
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
              })
            )}
          </div>
        </>
      )}

      {/* Bottom Resign & Actions Bar */}
      {!isGameOver && (
        <div className="p-2 border-t border-[#262421] bg-[#161512] flex items-center justify-between">
          <button
            onClick={onResign}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Resign</span>
          </button>
          <span className="text-[11px] text-[#8a857d] font-mono">
            {moves.length} half-moves
          </span>
        </div>
      )}
    </div>
  );
};
