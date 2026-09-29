import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GameRecord, GameHistoryStats } from '../types/history';
import { getLocalGameHistory } from '../utils/gameHistoryStorage';
import { getStoredSession } from '../utils/auth-session';
import { useAuth } from '../context/AuthContext';

const API_BASE = (import.meta.env.VITE_API_URL as string)?.replace(/\/$/, '') || '';

export type HistoryFilter = 'all' | 'online' | 'vs_ai' | 'pass_and_play';

interface UseGameHistoryProps {
  isOpen: boolean;
  isAuthenticated?: boolean;
}

export function useGameHistory({ isOpen }: UseGameHistoryProps) {
  const { token, isAuthenticated } = useAuth();
  const [onlineGames, setOnlineGames] = useState<GameRecord[]>([]);
  const [localGames, setLocalGames] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('all');

  // Load local games from localStorage
  const loadLocalGames = useCallback(() => {
    const list = getLocalGameHistory();
    setLocalGames(list);
  }, []);

  // Fetch online games from backend API
  const fetchOnlineGames = useCallback(async () => {
    const authToken = token || getStoredSession();
    if (!isAuthenticated || !authToken) {
      setOnlineGames([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/api/games/history?limit=50`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.games)) {
          setOnlineGames(data.games);
        }
      } else if (res.status !== 401 && res.status !== 404) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to fetch match history');
      }
    } catch (err: any) {
      console.error('Error fetching online match history:', err);
      setError('Could not connect to game chronicle service');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  // Load both when modal opens
  useEffect(() => {
    if (isOpen) {
      loadLocalGames();
      fetchOnlineGames();
    }
  }, [isOpen, loadLocalGames, fetchOnlineGames]);

  // Merge and deduplicate games: local games may contain move history for online games
  const allGames = useMemo(() => {
    const localMap = new Map<string, GameRecord>();
    for (const g of localGames) {
      localMap.set(g.id, g);
    }

    const merged: GameRecord[] = [];
    const seenIds = new Set<string>();

    // 1. Process online authoritative games
    for (const og of onlineGames) {
      seenIds.add(og.id);
      const localMatch = localMap.get(og.id);
      merged.push({
        ...og,
        moves: localMatch?.moves || og.moves,
        moveCount: localMatch?.moveCount ?? (og.moves ? og.moves.length : og.moveCount),
      });
    }

    // 2. Process local games (vs_ai, pass_and_play, and any unsynced online)
    for (const lg of localGames) {
      if (!seenIds.has(lg.id)) {
        seenIds.add(lg.id);
        merged.push(lg);
      }
    }

    // Sort descending by playedAt
    return merged.sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    );
  }, [onlineGames, localGames]);

  // Filtered games based on active filter tab
  const filteredGames = useMemo(() => {
    if (activeFilter === 'all') return allGames;
    return allGames.filter(g => g.mode === activeFilter);
  }, [allGames, activeFilter]);

  // Compute aggregate statistics
  const stats: GameHistoryStats = useMemo(() => {
    const total = allGames.length;
    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const g of allGames) {
      if (g.result === 'win') wins++;
      else if (g.result === 'loss') losses++;
      else draws++;
    }

    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    return {
      total,
      wins,
      losses,
      draws,
      winRate,
    };
  }, [allGames]);

  return {
    games: filteredGames,
    totalGamesCount: allGames.length,
    stats,
    isLoading,
    error,
    activeFilter,
    setActiveFilter,
    refreshHistory: () => {
      loadLocalGames();
      fetchOnlineGames();
    },
  };
}
