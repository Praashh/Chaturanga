export type PieceType = 'raja' | 'mantri' | 'gaja' | 'ashva' | 'ratha' | 'padati';

export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface SquareCoord {
  col: number; // 0 to 7 (a to h)
  row: number; // 0 to 7 (1 to 8)
}

export interface Move {
  from: SquareCoord;
  to: SquareCoord;
  piece: Piece;
  captured?: Piece;
  promotion?: PieceType;
  san: string; // Algebraic notation, e.g., 'Rxe4', 'Gg3', 'e3'
  timestamp: number;
}

export type AIDifficulty = 'novice' | 'warrior' | 'senapati';

export type GameMode = 'pass_and_play' | 'vs_ai' | 'online';

export type GameStatus =
  | { type: 'active' }
  | { type: 'checkmate'; winner: PieceColor }
  | { type: 'bare_king'; winner: PieceColor }
  | { type: 'stalemate' }
  | { type: 'resignation'; winner: PieceColor };

export interface GameState {
  board: (Piece | null)[][]; // board[row][col], row 0 is Rank 1, row 7 is Rank 8
  turn: PieceColor;
  status: GameStatus;
  moveHistory: Move[];
  capturedPieces: {
    white: Piece[]; // Pieces captured by White (i.e. Black's lost pieces)
    black: Piece[]; // Pieces captured by Black (i.e. White's lost pieces)
  };
  inCheck: PieceColor | null;
  lastMove: Move | null;
}

// Classical 16 marked squares on an Ashtāpada board
export const ASHTAPADA_MARKS: { col: number; row: number }[] = [
  // 4 corners
  { col: 0, row: 0 }, // a1
  { col: 7, row: 0 }, // h1
  { col: 0, row: 7 }, // a8
  { col: 7, row: 7 }, // h8
  // Central core
  { col: 3, row: 3 }, // d4
  { col: 4, row: 3 }, // e4
  { col: 3, row: 4 }, // d5
  { col: 4, row: 4 }, // e5
  // Interior diagonals
  { col: 2, row: 2 }, // c3
  { col: 5, row: 2 }, // f3
  { col: 2, row: 5 }, // c6
  { col: 5, row: 5 }, // f6
  // Royal gateways
  { col: 3, row: 0 }, // d1
  { col: 4, row: 0 }, // e1
  { col: 3, row: 7 }, // d8
  { col: 4, row: 7 }, // e8
];

export function isAshtapadaMark(col: number, row: number): boolean {
  return ASHTAPADA_MARKS.some(mark => mark.col === col && mark.row === row);
}

export function toAlgebraic(col: number, row: number): string {
  const colLetter = String.fromCharCode(97 + col); // 'a' + col
  const rowNumber = row + 1;
  return `${colLetter}${rowNumber}`;
}

export const PIECE_NAMES: Record<PieceType, { sanskrit: string; english: string; symbol: string; meaning: string }> = {
  raja: {
    sanskrit: 'Rāja (राजा)',
    english: 'King',
    symbol: '♔',
    meaning: 'Sovereign leader of the empire. Moves 1 step any direction.'
  },
  mantri: {
    sanskrit: 'Mantri (मन्त्री)',
    english: 'Counselor / Vizier',
    symbol: '♕',
    meaning: 'Royal advisor & general. Moves 1 step diagonally.'
  },
  gaja: {
    sanskrit: 'Gaja (गज)',
    english: 'War Elephant',
    symbol: '♗',
    meaning: 'Armored elephant division. Leaps 2 squares diagonally over pieces.'
  },
  ashva: {
    sanskrit: 'Ashva (अश्व)',
    english: 'Cavalry / Horse',
    symbol: '♘',
    meaning: 'Fast mobile horse cavalry. Moves in an L-shape leap.'
  },
  ratha: {
    sanskrit: 'Ratha (रथ)',
    english: 'Chariot',
    symbol: '♖',
    meaning: 'War chariot brigade. Sweeps horizontally and vertically.'
  },
  padati: {
    sanskrit: 'Padāti (पदाति)',
    english: 'Foot Soldier / Infantry',
    symbol: '♙',
    meaning: 'Frontline spearmen. Marches 1 step forward, attacks diagonally. Promotes to Mantri.'
  }
};
