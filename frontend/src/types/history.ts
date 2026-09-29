import type { GameMode, Move, PieceColor } from './game';

export interface OpponentInfo {
  id: string;
  name: string;
  username?: string;
  picture?: string | null;
  rating?: number;
}

export interface GameRecord {
  id: string;
  category?: string;
  isRated?: boolean;
  mode: GameMode;
  playedAt: string;
  userColor: PieceColor;
  result: 'win' | 'loss' | 'draw';
  winner: PieceColor | 'draw' | null;
  endReason: string;
  opponent: OpponentInfo;
  ratingChange?: number | null;
  ratingAfter?: number | null;
  moveCount: number;
  moves?: Move[];
}

export interface GameHistoryStats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}
