export const CHESS_SOUNDS = {
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
export type SoundTheme = 'vedic' | 'classic';

export interface SoundManagerConfig {
  isMuted: boolean;
  soundTheme: SoundTheme;
}
