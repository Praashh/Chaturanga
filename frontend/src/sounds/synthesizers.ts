/**
 * Procedural Web Audio synthesizers for authentic Ancient Indian instruments
 * and distinct chess piece acoustic movement signatures.
 */

// 📯 Sacred Shankha (War Conch) Horn Synthesizer
export function synthShankha(
  ctx: AudioContext,
  mode: 'battle_start' | 'victory' = 'battle_start'
): void {
  const now = ctx.currentTime;
  const duration = mode === 'victory' ? 2.8 : 2.0;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.45, now + 0.35);
  masterGain.gain.setValueAtTime(0.45, now + duration * 0.65);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(540, now);
  filter.Q.setValueAtTime(3.8, now);

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();

  const baseFreq = mode === 'victory' ? 240 : 215;

  osc1.type = 'sawtooth';
  osc2.type = 'triangle';
  osc3.type = 'sine';

  osc1.frequency.setValueAtTime(baseFreq * 0.96, now);
  osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.04, now + 0.4);
  osc1.frequency.linearRampToValueAtTime(baseFreq, now + duration * 0.7);

  osc2.frequency.setValueAtTime(baseFreq * 2 * 0.96, now);
  osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2 * 1.04, now + 0.4);
  osc2.frequency.linearRampToValueAtTime(baseFreq * 2, now + duration * 0.7);

  osc3.frequency.setValueAtTime(baseFreq * 3 * 0.98, now);
  osc3.frequency.linearRampToValueAtTime(baseFreq * 3, now + duration * 0.5);

  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  vibrato.frequency.value = 5.2;
  vibratoGain.gain.value = 3.5;
  vibrato.connect(osc1.frequency);
  vibrato.connect(osc2.frequency);

  const oscGain1 = ctx.createGain();
  const oscGain2 = ctx.createGain();
  const oscGain3 = ctx.createGain();

  oscGain1.gain.value = 0.5;
  oscGain2.gain.value = 0.6;
  oscGain3.gain.value = 0.25;

  osc1.connect(oscGain1);
  osc2.connect(oscGain2);
  osc3.connect(oscGain3);

  oscGain1.connect(filter);
  oscGain2.connect(filter);
  oscGain3.connect(filter);

  filter.connect(masterGain);
  masterGain.connect(ctx.destination);

  vibrato.start(now);
  osc1.start(now);
  osc2.start(now);
  osc3.start(now);

  vibrato.stop(now + duration);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
  osc3.stop(now + duration);

  if (mode === 'victory') {
    const oscHigh = ctx.createOscillator();
    const highGain = ctx.createGain();
    oscHigh.type = 'triangle';
    oscHigh.frequency.setValueAtTime(baseFreq * 1.5, now + 0.4);
    highGain.gain.setValueAtTime(0, now + 0.4);
    highGain.gain.linearRampToValueAtTime(0.35, now + 0.7);
    highGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscHigh.connect(highGain);
    highGain.connect(filter);
    oscHigh.start(now + 0.4);
    oscHigh.stop(now + duration);
  }
}

// 🔔 Sacred Ghanta (Temple Bell / Singing Bowl) for Check (Niruddha)
export function synthGhanta(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const freqs = [528, 1056, 1584, 2112];
  const gains = [0.35, 0.18, 0.10, 0.04];
  const decays = [2.2, 1.4, 0.9, 0.5];

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(gains[idx], now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + decays[idx]);
  });
}

// 👑 Raja (King) Sovereign Step Chime
export function synthRajaMove(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'triangle';
  osc2.type = 'sine';

  osc1.frequency.setValueAtTime(310, now);
  osc2.frequency.setValueAtTime(465, now);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.45);
  osc2.stop(now + 0.45);
}

// 📜 Mantri (Counselor / Vizier) Mystic Advisor Chime
export function synthMantriMove(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(580, now);
  osc.frequency.exponentialRampToValueAtTime(720, now + 0.18);

  gain.gain.setValueAtTime(0.28, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.32);
}

// 🐘 Gaja (War Elephant) Heavy Dundubhi War Drum Thud
export function synthGajaPound(ctx: AudioContext): void {
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(42, now + 0.32);

  gain.gain.setValueAtTime(0.7, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  const bufferSize = Math.floor(ctx.sampleRate * 0.05);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.35, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  whiteNoise.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  osc.connect(gain);
  gain.connect(ctx.destination);

  whiteNoise.start(now);
  osc.start(now);
  osc.stop(now + 0.45);
}

// 🐎 Ashva (Cavalry Horse) Galloping Hoofbeat
export function synthAshvaMove(ctx: AudioContext): void {
  const now = ctx.currentTime;

  [
    { time: now, freq: 380, vol: 0.35, len: 0.05 },
    { time: now + 0.07, freq: 440, vol: 0.4, len: 0.06 },
  ].forEach(tap => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(tap.freq, tap.time);
    osc.frequency.exponentialRampToValueAtTime(tap.freq * 0.7, tap.time + tap.len);

    gain.gain.setValueAtTime(tap.vol, tap.time);
    gain.gain.exponentialRampToValueAtTime(0.001, tap.time + tap.len);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(tap.time);
    osc.stop(tap.time + tap.len);
  });
}

// 🛞 Ratha (War Chariot) Rolling Heavy Wooden Axle Rumble
export function synthRathaMove(ctx: AudioContext): void {
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(115, now);
  osc.frequency.linearRampToValueAtTime(90, now + 0.32);

  gain.gain.setValueAtTime(0.42, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.35);
}

// ⚔️ Bronze Weapon Strike on Capture
export function synthBronzeClash(ctx: AudioContext): void {
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'triangle';
  osc2.type = 'sawtooth';

  osc1.frequency.setValueAtTime(1650, now);
  osc2.frequency.setValueAtTime(2480, now);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.22);
  osc2.stop(now + 0.22);
}
