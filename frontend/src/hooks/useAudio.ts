import { useRef, useCallback, useState, useEffect } from 'react';

export function useAudio() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('chaturanga_muted') === 'true';
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const moveBufferRef = useRef<AudioBuffer | null>(null);
  const captureBufferRef = useRef<AudioBuffer | null>(null);
  const checkBufferRef = useRef<AudioBuffer | null>(null);
  const victoryBufferRef = useRef<AudioBuffer | null>(null);

  // Initialize AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Pre-render realistic acoustic wood sound buffers (Physical acoustic modeling)
  const buildAudioBuffers = useCallback((ctx: AudioContext) => {
    const sampleRate = ctx.sampleRate;

    // 1. Move Sound: Realistic crisp wooden chess piece tap on wood
    const moveDuration = 0.09;
    const moveBuf = ctx.createBuffer(1, Math.floor(sampleRate * moveDuration), sampleRate);
    const moveData = moveBuf.getChannelData(0);
    for (let i = 0; i < moveData.length; i++) {
      const t = i / sampleRate;
      // High-frequency friction transient (wood grain impact)
      const click = (Math.random() * 2 - 1) * Math.exp(-t * 220);
      // Hardwood resonant modes (380Hz, 820Hz, 1600Hz)
      const r1 = Math.sin(2 * Math.PI * 390 * t) * Math.exp(-t * 85);
      const r2 = Math.sin(2 * Math.PI * 840 * t) * 0.35 * Math.exp(-t * 120);
      const r3 = Math.sin(2 * Math.PI * 1620 * t) * 0.15 * Math.exp(-t * 180);
      const raw = click * 0.5 + r1 * 0.55 + r2 * 0.3 + r3 * 0.1;
      moveData[i] = Math.tanh(raw * 1.6) * 0.75;
    }
    moveBufferRef.current = moveBuf;

    // 2. Capture Sound: Deep, solid, punchy wood-on-wood strike
    const capDuration = 0.14;
    const capBuf = ctx.createBuffer(1, Math.floor(sampleRate * capDuration), sampleRate);
    const capData = capBuf.getChannelData(0);
    for (let i = 0; i < capData.length; i++) {
      const t = i / sampleRate;
      // Punchy impact click
      const click = (Math.random() * 2 - 1) * Math.exp(-t * 160);
      // Deeper resonant wood body (220Hz, 460Hz, 950Hz)
      const r1 = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 45);
      const r2 = Math.sin(2 * Math.PI * 460 * t) * 0.45 * Math.exp(-t * 75);
      const r3 = Math.sin(2 * Math.PI * 960 * t) * 0.2 * Math.exp(-t * 120);
      const raw = click * 0.65 + r1 * 0.7 + r2 * 0.4 + r3 * 0.15;
      capData[i] = Math.tanh(raw * 1.8) * 0.9;
    }
    captureBufferRef.current = capBuf;

    // 3. Check Alert: Elegant, subtle dual-tone chime (warm marimba bell)
    const checkDuration = 0.45;
    const checkBuf = ctx.createBuffer(1, Math.floor(sampleRate * checkDuration), sampleRate);
    const checkData = checkBuf.getChannelData(0);
    for (let i = 0; i < checkData.length; i++) {
      const t = i / sampleRate;
      // Warm chime tones (587Hz D5 + 880Hz A5) with soft harmonics
      const b1 = Math.sin(2 * Math.PI * 587.33 * t) * Math.exp(-t * 9);
      const b2 = Math.sin(2 * Math.PI * 880.0 * t) * 0.5 * Math.exp(-t * 11);
      const b3 = Math.sin(2 * Math.PI * 1760.0 * t) * 0.12 * Math.exp(-t * 18);
      checkData[i] = (b1 + b2 + b3) * 0.28;
    }
    checkBufferRef.current = checkBuf;

    // 4. Victory / Game Over: Elegant wooden chord resolution (G Major triad)
    const vicDuration = 0.8;
    const vicBuf = ctx.createBuffer(1, Math.floor(sampleRate * vicDuration), sampleRate);
    const vicData = vicBuf.getChannelData(0);
    const chordNotes = [392.0, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
    for (let i = 0; i < vicData.length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      chordNotes.forEach((freq, idx) => {
        const noteStart = idx * 0.07;
        if (t >= noteStart) {
          const noteT = t - noteStart;
          const fund = Math.sin(2 * Math.PI * freq * noteT) * Math.exp(-noteT * 5.5);
          const harm = Math.sin(2 * Math.PI * freq * 2 * noteT) * 0.2 * Math.exp(-noteT * 9);
          sample += (fund + harm) * 0.2;
        }
      });
      vicData[i] = Math.tanh(sample * 1.2) * 0.6;
    }
    victoryBufferRef.current = vicBuf;
  }, []);

  // Initialize sound on first user interaction
  useEffect(() => {
    const handleFirstTouch = () => {
      try {
        const ctx = getAudioContext();
        if (!moveBufferRef.current) {
          buildAudioBuffers(ctx);
        }
      } catch {
        // AudioContext browser permission safety
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
  }, [getAudioContext, buildAudioBuffers]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('chaturanga_muted', String(next));
      return next;
    });
  }, []);

  // Play pre-rendered buffer with subtle pitch randomization for organic realism
  const playBuffer = useCallback(
    (buf: AudioBuffer | null, baseVolume = 1.0, pitchVariation = 0.04) => {
      if (isMuted) return;
      try {
        const ctx = getAudioContext();
        if (!buf) {
          buildAudioBuffers(ctx);
        }
        const activeBuf = buf || moveBufferRef.current;
        if (!activeBuf) return;

        const source = ctx.createBufferSource();
        source.buffer = activeBuf;

        // Subtle realistic organic pitch variation (±4%)
        const detune = (Math.random() * 2 - 1) * pitchVariation;
        source.playbackRate.value = 1.0 + detune;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(baseVolume, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start();
      } catch {
        // Audio safety
      }
    },
    [isMuted, getAudioContext, buildAudioBuffers]
  );

  const playMove = useCallback(() => {
    playBuffer(moveBufferRef.current, 0.95, 0.05);
  }, [playBuffer]);

  const playCapture = useCallback(() => {
    playBuffer(captureBufferRef.current, 1.0, 0.04);
  }, [playBuffer]);

  const playCheck = useCallback(() => {
    playBuffer(checkBufferRef.current, 0.75, 0.0);
  }, [playBuffer]);

  const playVictory = useCallback(() => {
    playBuffer(victoryBufferRef.current, 0.85, 0.0);
  }, [playBuffer]);

  return {
    isMuted,
    toggleMute,
    playMove,
    playCapture,
    playCheck,
    playVictory,
  };
}
