export type PieceType = 'raja' | 'mantri' | 'gaja' | 'ashva' | 'ratha' | 'padati';

export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface SquareCoord {
  col: number; // 0..7 (a..h)
  row: number; // 0..7 (1..8)
}

export interface Move {
  from: SquareCoord;
  to: SquareCoord;
  promotion?: PieceType;
}

export type GameStatus =
  | { type: 'ongoing' }
  | { type: 'checkmate'; winner: PieceColor }
  | { type: 'bare_king'; winner: PieceColor }
  | { type: 'stalemate' }
  | { type: 'resignation'; winner: PieceColor };
