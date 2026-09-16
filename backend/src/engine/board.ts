import type { Piece, PieceColor, PieceType, SquareCoord, Move, GameStatus } from './types';

export class Board {
  public squares: (Piece | null)[][];
  public turn: PieceColor;
  public status: GameStatus;
  public moveHistory: Move[];

  constructor() {
    this.squares = this.initBoard();
    this.turn = 'white';
    this.status = { type: 'ongoing' };
    this.moveHistory = [];
  }

  /**
   * Initializes the traditional Ashtāpada Chaturanga piece placement:
   * Rank 1: Ratha, Ashva, Gaja, Mantri, Raja, Gaja, Ashva, Ratha
   * Rank 2: 8 Padati
   * Rank 7: 8 Padati
   * Rank 8: Ratha, Ashva, Gaja, Mantri, Raja, Gaja, Ashva, Ratha
   */
  private initBoard(): (Piece | null)[][] {
    const backRank: PieceType[] = [
      'ratha',
      'ashva',
      'gaja',
      'mantri',
      'raja',
      'gaja',
      'ashva',
      'ratha',
    ];

    const createBackRank = (color: PieceColor): (Piece | null)[] =>
      backRank.map((type) => ({ type, color }));

    const createPawnRank = (color: PieceColor): (Piece | null)[] =>
      Array.from({ length: 8 }, () => ({ type: 'padati', color }));

    const createEmptyRank = (): (Piece | null)[] => Array(8).fill(null);

    return [
      createBackRank('white'), // Rank 1 (Row 0)
      createPawnRank('white'), // Rank 2 (Row 1)
      createEmptyRank(),       // Rank 3 (Row 2)
      createEmptyRank(),       // Rank 4 (Row 3)
      createEmptyRank(),       // Rank 5 (Row 4)
      createEmptyRank(),       // Rank 6 (Row 5)
      createPawnRank('black'), // Rank 7 (Row 6)
      createBackRank('black'), // Rank 8 (Row 7)
    ];
  }

  /**
   * Placeholder for legal move validation and state mutation.
   * Implement your custom Chaturanga rules here!
   */
  public makeMove(move: Move): { success: boolean; error?: string } {
    const fromRow = this.squares[move.from.row];
    const toRow = this.squares[move.to.row];

    if (!fromRow || !toRow) {
      return { success: false, error: 'Move coordinates out of bounds' };
    }

    const piece = fromRow[move.from.col];
    if (!piece) {
      return { success: false, error: 'No piece at source square' };
    }

    if (piece.color !== this.turn) {
      return { success: false, error: `It is ${this.turn}'s turn` };
    }

    // Move piece on board
    toRow[move.to.col] = piece;
    fromRow[move.from.col] = null;
    this.moveHistory.push(move);
    this.turn = this.turn === 'white' ? 'black' : 'white';

    return { success: true };
  }
}
