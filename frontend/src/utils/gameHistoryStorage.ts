import type { GameRecord } from '../types/history';

const HISTORY_STORAGE_KEY = 'chaturanga_game_history';
const MAX_LOCAL_GAMES = 100;

export function getLocalGameHistory(): GameRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load local game history:', err);
    return [];
  }
}

export function saveLocalGame(game: GameRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalGameHistory();
    // Prevent exact duplicate game IDs
    const filtered = current.filter(g => g.id !== game.id);
    const updated = [game, ...filtered].slice(0, MAX_LOCAL_GAMES);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save local game to history:', err);
  }
}

export function clearLocalGameHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear local game history:', err);
  }
}

export function recordGameOutcome(params: {
  id?: string;
  mode: any;
  userColor: any;
  winner: any;
  endReason: string;
  opponentName: string;
  opponentRating?: number;
  moves: any[];
  ratingChange?: number | null;
  ratingAfter?: number | null;
  isRated?: boolean;
}): void {
  const result: 'win' | 'loss' | 'draw' =
    params.winner === 'draw'
      ? 'draw'
      : params.winner === params.userColor
      ? 'win'
      : 'loss';

  const record: GameRecord = {
    id: params.id || `game-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    mode: params.mode,
    playedAt: new Date().toISOString(),
    userColor: params.userColor,
    result,
    winner: params.winner,
    endReason: params.endReason,
    opponent: {
      id: 'opp',
      name: params.opponentName,
      rating: params.opponentRating,
    },
    ratingChange: params.ratingChange,
    ratingAfter: params.ratingAfter,
    moveCount: params.moves.length,
    moves: [...params.moves],
    isRated: params.isRated ?? (params.mode === 'online'),
  };

  saveLocalGame(record);
}

