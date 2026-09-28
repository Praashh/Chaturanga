import { useState, useEffect } from 'react';

interface UseMatchmakingSearchProps {
  isSearching: boolean;
  matchedOpponent?: unknown;
  playGameStart: () => void;
}

export function useMatchmakingSearch({
  isSearching,
  matchedOpponent,
  playGameStart,
}: UseMatchmakingSearchProps) {
  const [searchSeconds, setSearchSeconds] = useState<number>(0);
  const [isMatchJustFound, setIsMatchJustFound] = useState<boolean>(false);

  useEffect(() => {
    if (!isSearching) {
      setSearchSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setSearchSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSearching]);

  useEffect(() => {
    if (matchedOpponent) {
      setIsMatchJustFound(true);
      playGameStart();
      const timeout = setTimeout(() => {
        setIsMatchJustFound(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [matchedOpponent, playGameStart]);

  return { searchSeconds, isMatchJustFound };
}
