import React, { useState } from 'react';
import {
  History,
  Trophy,
  ShieldAlert,
  Minus,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Sparkles,
  Loader2,
  Zap,
  Bot,
} from 'lucide-react';
import type { GameRecord } from '../types/history';
import type { Move } from '../types/game';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from './ui/dialog';
import { CustomModalHeader } from './CustomModalHeader';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useGameHistory, type HistoryFilter } from '../hooks/useGameHistory';

interface GameHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  userId?: string;
  onLoadGameForReview?: (moves: Move[]) => void;
  onFindMatch?: () => void;
  onPlayAI?: () => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Recent';
  }
}

function formatEndReason(reason: string): string {
  const clean = reason.toLowerCase();
  if (clean === 'checkmate') return 'Checkmate (Śatranja)';
  if (clean === 'bare_king') return 'Bare King (Chaturaji)';
  if (clean === 'resignation') return 'Resignation (Tyāga)';
  if (clean === 'stalemate') return 'Stalemate (Stambhana)';
  if (clean === 'abandoned') return 'Abandoned / Resigned';
  if (clean === 'timeout') return 'Time Expired';
  return reason.charAt(0).toUpperCase() + reason.slice(1);
}

export const GameHistoryModal: React.FC<GameHistoryModalProps> = ({
  isOpen,
  onClose,
  isAuthenticated,
  userId,
  onLoadGameForReview,
  onFindMatch,
  onPlayAI,
}) => {
  const {
    games,
    totalGamesCount,
    stats,
    isLoading,
    activeFilter,
    setActiveFilter,
  } = useGameHistory({
    isAuthenticated,
    userId,
    isOpen,
  });

  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  const toggleExpand = (gameId: string) => {
    setExpandedGameId(prev => (prev === gameId ? null : gameId));
  };

  const handleReviewGame = (game: GameRecord) => {
    if (game.moves && game.moves.length > 0 && onLoadGameForReview) {
      onLoadGameForReview(game.moves);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-[#161512] border-[#2c2823] text-[#e3ded7] flex flex-col shadow-2xl">
        {/* Header */}
        <CustomModalHeader
          icon="📜"
          title="Battle History & Chronicles"
          description="Itihāsa — Archived records, combat stats, and move analysis"
        />

        {/* Stats Quick Overview */}
        <div className="grid grid-cols-4 gap-2 p-3 sm:p-4 bg-[#1a1815] border-b border-[#262421]">
          <div className="p-2 sm:p-2.5 rounded-lg bg-[#201e1b] border border-[#28241e] flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-[#8a857d] uppercase tracking-wider font-semibold">Battles</span>
            <span className="font-mono font-bold text-base sm:text-lg text-white mt-0.5">{stats.total}</span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-[#201e1b] border border-[#28241e] flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
              <Trophy className="w-3 h-3 shrink-0" />
              <span>Victories</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono font-bold text-base sm:text-lg text-emerald-400">{stats.wins}</span>
              {stats.total > 0 && (
                <span className="text-[10px] text-[#8a857d] font-mono">({stats.winRate}%)</span>
              )}
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-[#201e1b] border border-[#28241e] flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-[10px] text-rose-400 uppercase tracking-wider font-semibold">
              <ShieldAlert className="w-3 h-3 shrink-0" />
              <span>Defeats</span>
            </div>
            <span className="font-mono font-bold text-base sm:text-lg text-rose-400 mt-0.5">{stats.losses}</span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-[#201e1b] border border-[#28241e] flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-[10px] text-[#8a857d] uppercase tracking-wider font-semibold">
              <Minus className="w-3 h-3 shrink-0" />
              <span>Draws</span>
            </div>
            <span className="font-mono font-bold text-base sm:text-lg text-[#b5b0a8] mt-0.5">{stats.draws}</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b border-[#262421] bg-[#1a1815] flex items-center justify-between gap-2">
          <Tabs
            value={activeFilter}
            onValueChange={v => setActiveFilter(v as HistoryFilter)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-4 w-full bg-[#201e1b] border border-[#2c2823] p-1 h-9">
              <TabsTrigger
                value="all"
                className="text-xs data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]"
              >
                All ({totalGamesCount})
              </TabsTrigger>
              <TabsTrigger
                value="online"
                className="text-xs data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]"
              >
                Online
              </TabsTrigger>
              <TabsTrigger
                value="vs_ai"
                className="text-xs data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]"
              >
                vs CPU
              </TabsTrigger>
              <TabsTrigger
                value="pass_and_play"
                className="text-xs data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]"
              >
                Local
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Games List ScrollArea */}
        <ScrollArea className="flex-1 max-h-[56vh] min-h-[280px] p-3 sm:p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#8a857d] gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-[#d4af37]" />
              <span className="text-xs font-mono">Unrolling battlefield scrolls...</span>
            </div>
          ) : games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#201e1b] border border-[#3a352f] flex items-center justify-center mb-3 text-[#d4af37]">
                <History className="w-7 h-7 opacity-70" />
              </div>
              <h4 className="font-serif font-bold text-white text-base">No Battles in this Chronicle</h4>
              <p className="text-xs text-[#8a857d] max-w-sm mt-1 leading-relaxed">
                {activeFilter === 'all'
                  ? 'No combat history recorded yet. Enter the battlefield against AI or challenge players online to begin your saga.'
                  : `No ${activeFilter.replace('_', ' ')} battles recorded yet.`}
              </p>

              <div className="flex items-center gap-2 mt-5">
                {onPlayAI && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      onPlayAI();
                      onClose();
                    }}
                    className="text-xs gap-1.5 h-8 border border-[#3a352f]"
                  >
                    <Bot className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Play vs Computer</span>
                  </Button>
                )}
                {onFindMatch && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onFindMatch();
                      onClose();
                    }}
                    className="text-xs gap-1.5 h-8 bg-[#d4af37] text-black hover:bg-[#fcd34d] font-semibold"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Find Online Match</span>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {games.map(game => {
                const isWin = game.result === 'win';
                const isLoss = game.result === 'loss';
                const isExpanded = expandedGameId === game.id;
                const hasMoves = game.moves && game.moves.length > 0;

                return (
                  <div
                    key={game.id}
                    className={`rounded-xl border transition-all ${
                      isWin
                        ? 'bg-[#18211b]/80 border-emerald-900/40 hover:border-emerald-700/60'
                        : isLoss
                        ? 'bg-[#221717]/80 border-rose-950/40 hover:border-rose-800/60'
                        : 'bg-[#1c1a17]/80 border-[#2e2a24] hover:border-[#3d3832]'
                    } overflow-hidden shadow-sm`}
                  >
                    {/* Game Summary Row */}
                    <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Outcome Badge & Players info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Result Badge */}
                        <div
                          className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 border font-mono font-bold text-center ${
                            isWin
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                              : isLoss
                              ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                              : 'bg-[#262421] border-[#3e3931] text-[#b5b0a8]'
                          }`}
                        >
                          <span className="text-[10px] tracking-wider uppercase font-semibold">
                            {isWin ? 'WIN' : isLoss ? 'LOSS' : 'DRAW'}
                          </span>
                          {game.ratingChange !== null && game.ratingChange !== undefined && (
                            <span className="text-[11px]">
                              {game.ratingChange > 0 ? `+${game.ratingChange}` : game.ratingChange}
                            </span>
                          )}
                        </div>

                        {/* Player / Opponent Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs sm:text-sm truncate">
                              vs {game.opponent.name}
                            </span>
                            {game.opponent.username && (
                              <span className="text-[10px] text-[#8a857d] font-mono hidden sm:inline">
                                @{game.opponent.username}
                              </span>
                            )}
                            {game.opponent.rating && (
                              <Badge variant="mono" className="text-[9px] px-1 py-0 h-4">
                                {game.opponent.rating}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8a857d]">
                            <span className="flex items-center gap-1">
                              <span
                                className={`w-2 h-2 rounded-full inline-block ${
                                  game.userColor === 'white'
                                    ? 'bg-[#ebd3aa] border border-stone-600'
                                    : 'bg-stone-900 border border-stone-500'
                                }`}
                              />
                              <span>Played as {game.userColor === 'white' ? 'White' : 'Black'}</span>
                            </span>
                            <span>•</span>
                            <span className="text-[#b5b0a8] truncate">
                              {formatEndReason(game.endReason)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Meta & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#262421]">
                        <div className="flex flex-col sm:items-end text-left sm:text-right">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-wider text-[#d4af37] border-[#d4af37]/30 bg-[#251f15]"
                            >
                              {game.mode === 'online'
                                ? game.isRated
                                  ? 'Online Rated'
                                  : 'Online Casual'
                                : game.mode === 'vs_ai'
                                ? 'vs Computer'
                                : 'Pass & Play'}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-[#8a857d] font-mono mt-0.5">
                            {game.moveCount > 0 ? `${game.moveCount} moves • ` : ''}
                            {formatRelativeTime(game.playedAt)}
                          </span>
                        </div>

                        {/* Actions: Review / Toggle */}
                        <div className="flex items-center gap-1">
                          {hasMoves && onLoadGameForReview && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReviewGame(game)}
                              className="h-7 px-2 text-[11px] text-[#d4af37] hover:bg-[#2a2418] hover:text-[#fcd34d] gap-1"
                              title="Replay entire match on the main board"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Replay</span>
                            </Button>
                          )}

                          {hasMoves && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleExpand(game.id)}
                              className="h-7 w-7 p-0 text-[#8a857d] hover:text-white hover:bg-[#201e1b]"
                              title={isExpanded ? 'Hide move log' : 'View moves'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Move Analysis Tray */}
                    {isExpanded && hasMoves && (
                      <div className="p-3 bg-[#131210] border-t border-[#262421] text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-[11px] text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            Move Chronology ({game.moves!.length} moves)
                          </span>
                          {onLoadGameForReview && (
                            <button
                              type="button"
                              onClick={() => handleReviewGame(game)}
                              className="text-[11px] text-[#fcd34d] hover:underline flex items-center gap-1 font-mono cursor-pointer"
                            >
                              <Play className="w-3 h-3" />
                              Load Interactive Replay
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[11px] max-h-36 overflow-y-auto p-2 rounded bg-[#1a1815] border border-[#262421]">
                          {game.moves!.map((m, idx) => {
                            const moveNumber = Math.floor(idx / 2) + 1;
                            const isWhiteMove = idx % 2 === 0;

                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#23201b]"
                              >
                                {isWhiteMove && (
                                  <span className="text-[#635f58] w-5 text-right">{moveNumber}.</span>
                                )}
                                <span className={isWhiteMove ? 'text-[#e8e2d8]' : 'text-[#a8a29e]'}>
                                  {m.san}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-3 bg-[#1a1815] border-t border-[#262421] flex sm:justify-between items-center w-full">
          <div className="text-[11px] text-[#8a857d] font-mono hidden sm:block">
            {stats.total > 0 && `Chronicle updated • ${stats.total} total games`}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={onClose}
            className="text-xs h-8 px-4"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
