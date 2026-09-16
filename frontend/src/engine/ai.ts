import type { Piece, PieceColor, PieceType, SquareCoord } from '../types/game';
import { isAshtapadaMark } from '../types/game';
import {
  getAllLegalMoves,
  executeMove,
  isKingInCheck,
} from './rules';

const PIECE_VALUES: Record<PieceType, number> = {
  raja: 20000,
  ratha: 520,
  ashva: 320,
  mantri: 190,
  gaja: 160,
  padati: 100,
};

// Bonus for piece positioning
function getPositionalValue(piece: Piece, col: number, row: number): number {
  let score = 0;

  // Bonus for controlling sacred Ashtāpada marked squares
  if (isAshtapadaMark(col, row)) {
    score += 15;
  }

  // Center proximity bonus (files c, d, e, f and ranks 3, 4, 5, 6)
  const centerDist = Math.abs(col - 3.5) + Math.abs(row - 3.5);
  score += Math.max(0, 10 - centerDist * 2);

  if (piece.type === 'padati') {
    // Encourage marching forward towards promotion to Mantri
    const advance = piece.color === 'white' ? row : 7 - row;
    score += advance * 18;
  } else if (piece.type === 'ratha') {
    // Open files & ranks encouragement
    score += 5;
  } else if (piece.type === 'ashva') {
    // Knights thrive closer to center
    score += (4 - Math.abs(col - 3.5)) * 4;
  }

  return score;
}

/**
 * Static evaluation of board from perspective of `maximizingColor`
 */
export function evaluateBoard(
  board: (Piece | null)[][],
  maximizingColor: PieceColor
): number {
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseVal = PIECE_VALUES[piece.type];
      const posVal = getPositionalValue(piece, c, r);
      const totalVal = baseVal + posVal;

      if (piece.color === maximizingColor) {
        score += totalVal;
      } else {
        score -= totalVal;
      }
    }
  }

  // King check evaluation
  const opponentColor: PieceColor = maximizingColor === 'white' ? 'black' : 'white';
  if (isKingInCheck(board, opponentColor)) {
    score += 60;
  }
  if (isKingInCheck(board, maximizingColor)) {
    score -= 60;
  }

  return score;
}

/**
 * Minimax algorithm with Alpha-Beta pruning
 */
function minimax(
  board: (Piece | null)[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiColor: PieceColor
): number {
  const currentColor: PieceColor = isMaximizing
    ? aiColor
    : aiColor === 'white'
    ? 'black'
    : 'white';

  const legalMoves = getAllLegalMoves(board, currentColor);

  if (depth === 0 || legalMoves.length === 0) {
    if (legalMoves.length === 0) {
      const inCheck = isKingInCheck(board, currentColor);
      if (inCheck) {
        // Checkmated!
        return isMaximizing ? -15000 : 15000;
      } else {
        // Stalemate
        return 0;
      }
    }
    return evaluateBoard(board, aiColor);
  }

  // Move ordering heuristic: try captures first for deeper pruning
  legalMoves.sort((a, b) => {
    const targetA = board[a.to.row][a.to.col];
    const targetB = board[b.to.row][b.to.col];
    const valA = targetA ? PIECE_VALUES[targetA.type] : 0;
    const valB = targetB ? PIECE_VALUES[targetB.type] : 0;
    return valB - valA;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      const { newBoard } = executeMove(board, move.from, move.to);
      const evaluation = minimax(newBoard, depth - 1, alpha, beta, false, aiColor);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      const { newBoard } = executeMove(board, move.from, move.to);
      const evaluation = minimax(newBoard, depth - 1, alpha, beta, true, aiColor);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Finds best move for AI
 */
export function getBestMove(
  board: (Piece | null)[][],
  aiColor: PieceColor,
  difficulty: 'novice' | 'warrior' | 'senapati'
): { from: SquareCoord; to: SquareCoord } | null {
  const legalMoves = getAllLegalMoves(board, aiColor);
  if (legalMoves.length === 0) return null;

  // Novice level: occasionally chooses from top 3 or randomizes slightly
  if (difficulty === 'novice') {
    if (Math.random() < 0.4) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
  }

  const searchDepth = difficulty === 'novice' ? 1 : difficulty === 'warrior' ? 2 : 3;

  let bestMove: { from: SquareCoord; to: SquareCoord } = legalMoves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  // Prioritize captures for root ordering
  const sortedMoves = [...legalMoves].sort((a, b) => {
    const targetA = board[a.to.row][a.to.col];
    const targetB = board[b.to.row][b.to.col];
    const valA = targetA ? PIECE_VALUES[targetA.type] : 0;
    const valB = targetB ? PIECE_VALUES[targetB.type] : 0;
    return valB - valA;
  });

  for (const move of sortedMoves) {
    const { newBoard } = executeMove(board, move.from, move.to);
    const score = minimax(newBoard, searchDepth - 1, alpha, beta, false, aiColor);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    alpha = Math.max(alpha, bestScore);
  }

  return bestMove;
}
