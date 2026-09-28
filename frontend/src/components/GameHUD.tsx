import React, { useMemo } from 'react';
import type { PieceColor, Piece, PieceType, GameStatus, GameMode, AIDifficulty } from '../types/game';
import { PieceIcon } from './PieceIcon';
import { Volume2, VolumeX, RotateCcw, ArrowUpDown, BookOpen, Users, Bot, Globe } from 'lucide-react';

interface GameHUDProps {
  turn: PieceColor;
  status: GameStatus;
  inCheck: PieceColor | null;
  mode: GameMode;
  aiDifficulty: AIDifficulty;
  capturedWhite: Piece[];
  capturedBlack: Piece[];
  isMuted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onFlipBoard: () => void;
  onOpenRules: () => void;
  onOpenLobby: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  turn,
  status,
  inCheck,
  mode,
  aiDifficulty,
  capturedWhite,
  capturedBlack,
  isMuted,
  onToggleMute,
  onRestart,
  onUndo,
  canUndo,
  onFlipBoard,
  onOpenRules,
  onOpenLobby,
}) => {
  const groupedWhite = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of capturedWhite) {
      counts[p.type] = (counts[p.type] || 0) + 1;
    }
    return Object.entries(counts);
  }, [capturedWhite]);

  const groupedBlack = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of capturedBlack) {
      counts[p.type] = (counts[p.type] || 0) + 1;
    }
    return Object.entries(counts);
  }, [capturedBlack]);

  const getModeLabel = () => {
    switch (mode) {
      case 'pass_and_play':
        return 'Pass & Play';
      case 'vs_ai':
        return `Vs Bot (${aiDifficulty.toUpperCase()})`;
      case 'online':
        return 'Online Multiplayer';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'pass_and_play':
        return <Users className="w-4 h-4 text-[#d4af37]" />;
      case 'vs_ai':
        return <Bot className="w-4 h-4 text-emerald-400" />;
      case 'online':
        return <Globe className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 glass-panel rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLobby}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#241a12] border border-[#d4af37]/30 hover:border-[#d4af37] text-xs font-serif text-amber-200 transition-colors shadow"
          >
            {getModeIcon()}
            <span>{getModeLabel()}</span>
          </button>
          <span className="text-[11px] font-serif px-2 py-1 rounded bg-[#1e130b] border border-[#d4af37]/20 text-[#d4af37]">
            {turn === 'white' ? 'White Turn' : 'Black Turn'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRules}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#241a12]/80 hover:bg-[#322318] border border-[#d4af37]/20 text-xs text-amber-300 font-serif transition-colors"
            title="How to play Chaturanga"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Rulebook</span>
          </button>

          <button
            onClick={onFlipBoard}
            className="p-1.5 rounded-lg bg-[#241a12]/80 hover:bg-[#322318] border border-[#d4af37]/20 text-amber-300 transition-colors"
            title="Flip Board"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg bg-[#241a12]/80 hover:bg-[#322318] border border-[#d4af37]/20 text-amber-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo move"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-[#241a12]/80 hover:bg-[#322318] border border-[#d4af37]/20 text-amber-300 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onRestart}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-xs text-red-200 font-serif transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Captured Trays */}
      <div className="grid grid-cols-2 gap-3">
        {/* White Army Captured Trophies (Black's lost pieces) */}
        <div className="p-2.5 glass-panel rounded-xl flex items-center justify-between min-h-[46px]">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {capturedWhite.length === 0 ? (
              <span className="text-[11px] text-amber-100/30 italic font-serif">No captures</span>
            ) : (
              groupedWhite.map(([type, count]) => (
                <div key={type} className="flex items-center gap-0.5">
                  <PieceIcon type={type as PieceType} color="black" size={24} className="opacity-90 hover:opacity-100" />
                  {count > 1 && (
                    <span className="text-[10px] font-mono text-[#d4af37] font-semibold">×{count}</span>
                  )}
                </div>
              ))
            )}
          </div>
          <span className="text-[11px] font-mono text-[#d4af37]/80 font-bold ml-1">
            {capturedWhite.length}
          </span>
        </div>

        {/* Black Army Captured Trophies (White's lost pieces) */}
        <div className="p-2.5 glass-panel rounded-xl flex items-center justify-between min-h-[46px]">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {capturedBlack.length === 0 ? (
              <span className="text-[11px] text-amber-100/30 italic font-serif">No captures</span>
            ) : (
              groupedBlack.map(([type, count]) => (
                <div key={type} className="flex items-center gap-0.5">
                  <PieceIcon type={type as PieceType} color="white" size={24} className="opacity-90 hover:opacity-100" />
                  {count > 1 && (
                    <span className="text-[10px] font-mono text-[#d4af37] font-semibold">×{count}</span>
                  )}
                </div>
              ))
            )}
          </div>
          <span className="text-[11px] font-mono text-[#d4af37]/80 font-bold ml-1">
            {capturedBlack.length}
          </span>
        </div>
      </div>

      {/* Check & Game Over Alert Banner */}
      {status.type !== 'active' ? (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-600/30 via-[#d4af37]/40 to-amber-600/30 border border-[#d4af37] text-center shadow-lg">
          <div className="text-base font-serif font-bold text-amber-100 uppercase tracking-widest">
            {status.type === 'checkmate' && `👑 Checkmate! ${status.winner.toUpperCase()} IS VICTORIOUS!`}
            {status.type === 'bare_king' && `⚔️ Bare King Triumph! ${status.winner.toUpperCase()} CONQUERS!`}
            {status.type === 'stalemate' && `⚖️ Stalemate! Victory to the Enclosing Sovereign!`}
            {status.type === 'resignation' && `🏳️ Resignation! ${status.winner.toUpperCase()} WINS!`}
          </div>
          <p className="text-xs text-amber-200/80 mt-0.5">
            {status.type === 'bare_king'
              ? 'All defending forces fell, leaving only the solitary Raja on the Ashtāpada.'
              : 'The battle of minds reaches its fateful conclusion.'}
          </p>
        </div>
      ) : inCheck ? (
        <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/60 text-center animate-pulse shadow">
          <span className="text-xs font-serif font-bold text-red-200 tracking-wider">
            ⚠️ The {inCheck.toUpperCase()} Raja is under attack! (Check)
          </span>
        </div>
      ) : null}
    </div>
  );
};
