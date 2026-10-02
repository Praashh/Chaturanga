import { useRef, useCallback, useState, useEffect } from 'react';
import { CHESS_SOUNDS, type SoundType, type SoundTheme } from './types';

export function useAudio() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('chaturanga_muted') === 'true';
  });

  // Keep the soundTheme state for API compatibility, but it no longer affects behavior
  const [soundTheme, setSoundTheme] = useState<SoundTheme>(() => {
    return (localStorage.getItem('chaturanga_sound_theme') as SoundTheme) || 'classic';
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Map<SoundType, AudioBuffer>>(new Map());
  const audioElementsRef = useRef<Map<SoundType, HTMLAudioElement>>(new Map());
  const isLoadedRef = useRef(false);

  // Initialize or resume AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Pre-load audio buffers
  const loadAudioBuffers = useCallback(async (ctx: AudioContext) => {
    if (isLoadedRef.current) return;
    isLoadedRef.current = true;

    const entries = Object.entries(CHESS_SOUNDS) as [SoundType, string][];
    await Promise.all(
      entries.map(async ([key, url]) => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const arrayBuf = await res.arrayBuffer();
          const decoded = await ctx.decodeAudioData(arrayBuf);
          buffersRef.current.set(key, decoded);
        } catch {
          try {
            const fallbackAudio = new Audio(url);
            fallbackAudio.preload = 'auto';
            audioElementsRef.current.set(key, fallbackAudio);
          } catch {
            // Audio loading error handled gracefully
          }
        }
      })
    );
  }, []);

  // Unlock AudioContext on first user gesture
  useEffect(() => {
    const handleFirstTouch = () => {
      try {
        const ctx = getAudioContext();
        if (ctx) {
          loadAudioBuffers(ctx);
        }
      } catch {
        // Safe browser permission handling
      }
      window.removeEventListener('pointerdown', handleFirstTouch);
      window.removeEventListener('keydown', handleFirstTouch);
    };

    window.addEventListener('pointerdown', handleFirstTouch, { once: true });
    window.addEventListener('keydown', handleFirstTouch, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstTouch);
      window.removeEventListener('keydown', handleFirstTouch);
    };
  }, [getAudioContext, loadAudioBuffers]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const toggleSoundTheme = useCallback(() => {
    setSoundTheme(prev => (prev === 'vedic' ? 'classic' : 'vedic'));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('chaturanga_muted', String(isMuted));
    } catch {}
  }, [isMuted]);

  useEffect(() => {
    try {
      localStorage.setItem('chaturanga_sound_theme', soundTheme);
    } catch {}
  }, [soundTheme]);

  // Core sound playback with low-latency AudioBufferSource & HTML5 fallback
  const playSound = useCallback(
    (type: SoundType, volume = 1.0) => {
      if (isMuted) return;

      try {
        const ctx = getAudioContext();
        const buffer = buffersRef.current.get(type);

        if (ctx && buffer) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;

          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(volume, ctx.currentTime);

          source.connect(gainNode);
          gainNode.connect(ctx.destination);
          source.start(0);
          return;
        }

        let audioEl = audioElementsRef.current.get(type);
        if (!audioEl) {
          audioEl = new Audio(CHESS_SOUNDS[type]);
          audioElementsRef.current.set(type, audioEl);
        }
        audioEl.currentTime = 0;
        audioEl.volume = volume;
        audioEl.play().catch(() => {});
      } catch {
        // Safe audio playback handling
      }
    },
    [isMuted, getAudioContext]
  );

  // Standard clean chess sounds — no synthesizers
  const playMove = useCallback(() => {
    playSound('move', 0.95);
  }, [playSound]);

  const playOpponentMove = useCallback(() => {
    playSound('opponentMove', 0.95);
  }, [playSound]);

  const playCapture = useCallback(() => {
    playSound('capture', 1.0);
  }, [playSound]);

  const playCheck = useCallback(() => {
    playSound('check', 0.9);
  }, [playSound]);

  const playGameStart = useCallback(() => {
    playSound('gameStart', 0.9);
  }, [playSound]);

  const playGameEnd = useCallback(() => {
    playSound('gameEnd', 0.95);
  }, [playSound]);

  // Piece-specific move sounds — now just plays the standard move/opponent sound
  const playPieceMove = useCallback(
    (pieceType: string, isOpponent = false) => {
      if (isMuted) return;
      // All pieces use the same clean move sound
      void pieceType; // unused but kept for API compatibility
      if (isOpponent) playOpponentMove();
      else playMove();
    },
    [isMuted, playOpponentMove, playMove]
  );

  const playIllegal = useCallback(() => {
    playSound('illegal', 0.7);
  }, [playSound]);

  const playNotify = useCallback(() => {
    playSound('notify', 0.9);
  }, [playSound]);

  const playCastle = useCallback(() => {
    playSound('castle', 0.95);
  }, [playSound]);

  const playPromote = useCallback(() => {
    playSound('promote', 0.95);
  }, [playSound]);

  return {
    isMuted,
    toggleMute,
    soundTheme,
    toggleSoundTheme,
    playMove,
    playOpponentMove,
    playPieceMove,
    playCapture,
    playCheck,
    playGameStart,
    playGameEnd,
    playVictory: playGameEnd,
    playIllegal,
    playNotify,
    playCastle,
    playPromote,
  };
}
