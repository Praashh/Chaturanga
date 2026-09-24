import type { Piece, PieceColor, SquareCoord, Move, GameStatus } from './types';
import {
  createInitialBoard,
  executeMove,
  evaluateGameStatus,
  getLegalMoves,
} from './rules';

export class Board {
  public squares: (Piece | null)[][];
  public turn: PieceColor;
  public status: GameStatus;
  public moveHistory: Move[];

  constructor() {
    this.squares = createInitialBoard();
    this.turn = 'white';
    this.status = { type: 'ongoing' };
    this.moveHistory = [];
  }

  /**
   * Executes a move on the board, updates turn, and evaluates game status.
   */
  public makeMove(move: Move): { success: boolean; error?: string; status: GameStatus } {
    if (this.status.type !== 'ongoing') {
      return { success: false, error: 'Game is already completed', status: this.status };
    }

    const { from, to } = move;
    const piece = this.squares[from.row]?.[from.col];

    if (!piece) {
      return { success: false, error: 'No piece at source square', status: this.status };
    }

    if (piece.color !== this.turn) {
      return { success: false, error: `It is ${this.turn}'s turn`, status: this.status };
    }

    // Verify move is legal
    const legalMoves = getLegalMoves(this.squares, from);
    const isLegal = legalMoves.some((m) => m.col === to.col && m.row === to.row);
    if (!isLegal) {
      return { success: false, error: 'Illegal move', status: this.status };
    }

    const { newBoard, moveRecord } = executeMove(this.squares, from, to);
    this.squares = newBoard;
    this.moveHistory.push(moveRecord);

    const nextTurn: PieceColor = this.turn === 'white' ? 'black' : 'white';
    this.turn = nextTurn;

    // Evaluate game status (checkmate, bare_king, stalemate, or ongoing)
    this.status = evaluateGameStatus(this.squares, nextTurn);

    return { success: true, status: this.status };
  }
}
