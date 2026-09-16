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
}) => {
  const [isAnalyzeActive, setIsAnalyzeActive] = useState<boolean>(true);
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

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
    <div className="w-full lg:w-[340px] bg-[#1a1815] border border-[#262421] rounded-lg overflow-hidden flex flex-col h-[520px] sm:h-[580px] lg:h-[640px] shadow-xl text-xs select-none">
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
