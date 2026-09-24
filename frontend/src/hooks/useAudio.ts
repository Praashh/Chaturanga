import { useRef, useCallback, useState, useEffect } from 'react';

const CHESS_SOUNDS = {
  move: '/sounds/move-self.mp3',
  opponentMove: '/sounds/move-opponent.mp3',
  capture: '/sounds/capture.mp3',
  check: '/sounds/move-check.mp3',
  gameStart: '/sounds/game-start.mp3',
  gameEnd: '/sounds/game-end.mp3',
  illegal: '/sounds/illegal.mp3',
  notify: '/sounds/notify.mp3',
  promote: '/sounds/promote.mp3',
  castle: '/sounds/castle.mp3',
  tenSeconds: '/sounds/tenseconds.mp3',
} as const;

export type SoundType = keyof typeof CHESS_SOUNDS;

export function useAudio() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('chaturanga_muted') === 'true';
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Map<SoundType, AudioBuffer>>(new Map());
  const audioElementsRef = useRef<Map<SoundType, HTMLAudioElement>>(new Map());
  const isLoadedRef = useRef(false);

  // Initialize AudioContext
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

  // Pre-load and decode authentic Chess.com audio assets
  const loadAudioBuffers = useCallback(async (ctx: AudioContext) => {
    if (isLoadedRef.current) return;
    isLoadedRef.current = true;

    const entries = Object.entries(CHESS_SOUNDS) as [SoundType, string][];
    await Promise.all(
      entries.map(async ([key, url]) => {
        try {
          const res = await fetch(url);
          const arrayBuf = await res.arrayBuffer();
          const decoded = await ctx.decodeAudioData(arrayBuf);
          buffersRef.current.set(key, decoded);
        } catch {
          // Preload HTMLAudioElement as resilient fallback
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

  // Unlock audio context and load sound buffers on first user interaction
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
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('chaturanga_muted', String(next));
      return next;
    });
  }, []);

  // Play decoded Chess.com sound with low-latency Web Audio API & HTML5 fallback
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

        // Resilient Fallback: HTMLAudioElement
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

  // Exact Chess.com action sounds
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
    playMove,
    playOpponentMove,
    playCapture,
    playCheck,
    playGameStart,
    playGameEnd,
    playVictory: playGameEnd, // Backwards compatibility for victory / game-over
    playIllegal,
    playNotify,
    playCastle,
    playPromote,
  };
}
