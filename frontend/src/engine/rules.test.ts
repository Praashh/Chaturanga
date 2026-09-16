import { describe, it, expect } from 'bun:test';
import {
  createInitialBoard,
  getPseudoLegalMoves,
  getLegalMoves,
  executeMove,
  isKingInCheck,
  evaluateGameStatus,
  countArmyPieces,
} from './rules';
import { getBestMove } from './ai';

describe('Chaturanga Game Engine Rules', () => {
  it('initializes board with authentic pieces', () => {
    const board = createInitialBoard();
    // Rank 1: Ratha, Ashva, Gaja, Mantri, Raja, Gaja, Ashva, Ratha
    expect(board[0][0]?.type).toBe('ratha');
    expect(board[0][1]?.type).toBe('ashva');
    expect(board[0][2]?.type).toBe('gaja');
    expect(board[0][3]?.type).toBe('mantri');
    expect(board[0][4]?.type).toBe('raja');
    expect(board[0][5]?.type).toBe('gaja');
    expect(board[0][6]?.type).toBe('ashva');
    expect(board[0][7]?.type).toBe('ratha');

    // Rank 2: 8 Padatis
    for (let c = 0; c < 8; c++) {
      expect(board[1][c]?.type).toBe('padati');
      expect(board[1][c]?.color).toBe('white');
    }
  });

  it('verifies Gaja (Elephant) leaps 2 squares diagonally over obstacles', () => {
    const board = createInitialBoard();
    // In initial setup, Gaja is on c1 (col 2, row 0).
    // Surrounded by friendly pawns on row 1 and pieces on row 0.
    // Gaja leaps 2 squares diagonally: (row 0 + 2, col 2 ± 2) -> (row 2, col 0 = a3) and (row 2, col 4 = e3).
    const moves = getLegalMoves(board, { col: 2, row: 0 });
    expect(moves).toContainEqual({ col: 0, row: 2 });
    expect(moves).toContainEqual({ col: 4, row: 2 });
  });

  it('verifies Padati (Pawn) moves only 1 step forward (no 2-step advance)', () => {
    const board = createInitialBoard();
    // Pawn on e2 (col 4, row 1)
    const moves = getLegalMoves(board, { col: 4, row: 1 });
    expect(moves).toEqual([{ col: 4, row: 2 }]); // Only e3, NOT e4!
  });

  it('verifies Mantri (Counselor) moves only 1 step diagonally', () => {
    const board = createInitialBoard();
    // Clear d2 pawn to test Mantri moves
    board[1][3] = null;
    // Mantri is on d1 (col 3, row 0). Diagonals are (col 2, row 1) and (col 4, row 1), which have pawns.
    // Clear pawns around it
    board[1][2] = null;
    board[1][4] = null;
    const moves = getLegalMoves(board, { col: 3, row: 0 });
    expect(moves).toContainEqual({ col: 2, row: 1 });
    expect(moves).toContainEqual({ col: 4, row: 1 });
    expect(moves.length).toBe(2);
  });

  it('verifies Padati promotion to Mantri upon reaching 8th rank', () => {
    const board = createInitialBoard();
    // Place White pawn on e7 (col 4, row 6)
    board[6][4] = { type: 'padati', color: 'white' };
    board[7][4] = null; // empty e8 square

    const { newBoard, moveRecord } = executeMove(board, { col: 4, row: 6 }, { col: 4, row: 7 });
    expect(moveRecord.promotion).toBe('mantri');
    expect(newBoard[7][4]?.type).toBe('mantri');
    expect(newBoard[7][4]?.color).toBe('white');
  });

  it('verifies AI produces a valid legal move', () => {
    const board = createInitialBoard();
    const move = getBestMove(board, 'black', 'novice');
    expect(move).not.toBeNull();
    expect(move?.from).toBeDefined();
    expect(move?.to).toBeDefined();
  });
});
