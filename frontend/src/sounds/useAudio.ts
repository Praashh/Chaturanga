import { useRef, useCallback, useState, useEffect } from 'react';
import { CHESS_SOUNDS, type SoundType, type SoundTheme } from './types';
import {
  synthShankha,
  synthGhanta,
  synthRajaMove,
  synthMantriMove,
  synthGajaPound,
  synthAshvaMove,
  synthRathaMove,
  synthBronzeClash,
} from './synthesizers';

export function useAudio() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('chaturanga_muted') === 'true';
  });

  const [soundTheme, setSoundTheme] = useState<SoundTheme>(() => {
    return (localStorage.getItem('chaturanga_sound_theme') as SoundTheme) || 'vedic';
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
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('chaturanga_muted', String(next));
      return next;
    });
  }, []);

  const toggleSoundTheme = useCallback(() => {
    setSoundTheme(prev => {
      const next = prev === 'vedic' ? 'classic' : 'vedic';
      localStorage.setItem('chaturanga_sound_theme', next);
      return next;
    });
  }, []);

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

  // Standard step sounds
  const playMove = useCallback(() => {
    playSound('move', 0.95);
  }, [playSound]);

  const playOpponentMove = useCallback(() => {
    playSound('opponentMove', 0.95);
  }, [playSound]);

  // Capture with bronze weapon clash in Vedic theme
  const playCapture = useCallback(() => {
    if (isMuted) return;
    if (soundTheme === 'vedic') {
      const ctx = getAudioContext();
      if (ctx) {
        synthBronzeClash(ctx);
      }
      playSound('capture', 0.85);
    } else {
      playSound('capture', 1.0);
    }
  }, [isMuted, soundTheme, getAudioContext, playSound]);

  // Check with sacred Ghanta bell
  const playCheck = useCallback(() => {
    if (isMuted) return;
    if (soundTheme === 'vedic') {
      const ctx = getAudioContext();
      if (ctx) {
        synthGhanta(ctx);
        return;
      }
    }
    playSound('check', 0.9);
  }, [isMuted, soundTheme, getAudioContext, playSound]);

  // Game start with sacred Shankha horn
  const playGameStart = useCallback(() => {
    if (isMuted) return;
    if (soundTheme === 'vedic') {
      const ctx = getAudioContext();
      if (ctx) {
        synthShankha(ctx, 'battle_start');
        return;
      }
    }
    playSound('gameStart', 0.9);
  }, [isMuted, soundTheme, getAudioContext, playSound]);

  // Game end with victory Shankha fanfare
  const playGameEnd = useCallback(() => {
    if (isMuted) return;
    if (soundTheme === 'vedic') {
      const ctx = getAudioContext();
      if (ctx) {
        synthShankha(ctx, 'victory');
        return;
      }
    }
    playSound('gameEnd', 0.95);
  }, [isMuted, soundTheme, getAudioContext, playSound]);

  // Piece-specific move sounds (Raja, Mantri, Gaja, Ashva, Ratha, Padati)
  const playPieceMove = useCallback(
    (pieceType: string, isOpponent = false) => {
      if (isMuted) return;

      if (soundTheme === 'classic') {
        if (isOpponent) playOpponentMove();
        else playMove();
        return;
      }

      const ctx = getAudioContext();
      if (!ctx) {
        if (isOpponent) playOpponentMove();
        else playMove();
        return;
      }

      switch (pieceType) {
        case 'raja':
          synthRajaMove(ctx);
          playSound('move', 0.6);
          break;
        case 'mantri':
          synthMantriMove(ctx);
          playSound('move', 0.6);
          break;
        case 'gaja':
          synthGajaPound(ctx);
          break;
        case 'ashva':
          synthAshvaMove(ctx);
          break;
        case 'ratha':
          synthRathaMove(ctx);
          playSound('move', 0.65);
          break;
        case 'padati':
        default:
          if (isOpponent) playOpponentMove();
          else playMove();
          break;
      }
    },
    [isMuted, soundTheme, getAudioContext, playOpponentMove, playMove, playSound]
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
