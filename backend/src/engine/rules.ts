import type { Piece, PieceColor, PieceType, SquareCoord, Move, GameStatus } from './types';

export function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

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

  // White pieces (Row 0 = Rank 1, Row 1 = Rank 2)
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRank[col], color: 'white' };
    board[1][col] = { type: 'padati', color: 'white' };
  }

  // Black pieces (Row 6 = Rank 7, Row 7 = Rank 8)
  for (let col = 0; col < 8; col++) {
    board[6][col] = { type: 'padati', color: 'black' };
    board[7][col] = { type: backRank[col], color: 'black' };
  }

  return board;
}

export function cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function isWithinBounds(col: number, row: number): boolean {
  return col >= 0 && col < 8 && row >= 0 && row < 8;
}

export function findKing(board: (Piece | null)[][], color: PieceColor): SquareCoord | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'raja' && piece.color === color) {
        return { col: c, row: r };
      }
    }
  }
  return null;
}

export function getPseudoLegalMoves(
  board: (Piece | null)[][],
  from: SquareCoord
): SquareCoord[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const moves: SquareCoord[] = [];
  const { color, type } = piece;

  switch (type) {
    case 'raja': {
      // 1 step in any 8 directions
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];
      for (const [dr, dc] of directions) {
        const nr = from.row + dr;
        const nc = from.col + dc;
        if (isWithinBounds(nc, nr)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) {
            moves.push({ col: nc, row: nr });
          }
        }
      }
      break;
    }

    case 'mantri': {
      // 1 step diagonally (4 directions)
      const diagonals = [
        [-1, -1], [-1, 1],
        [1, -1],  [1, 1],
      ];
      for (const [dr, dc] of diagonals) {
        const nr = from.row + dr;
        const nc = from.col + dc;
        if (isWithinBounds(nc, nr)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) {
            moves.push({ col: nc, row: nr });
          }
        }
      }
      break;
    }

    case 'gaja': {
      // Exactly 2 squares diagonally, leaping over intervening square (Alfil leap)
      const leaps = [
        [-2, -2], [-2, 2],
        [2, -2],  [2, 2],
      ];
      for (const [dr, dc] of leaps) {
        const nr = from.row + dr;
        const nc = from.col + dc;
        if (isWithinBounds(nc, nr)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) {
            moves.push({ col: nc, row: nr });
          }
        }
      }
      break;
    }

    case 'ashva': {
      // Knight L-moves (8 combinations), leaping over pieces
      const knightMoves = [
        [-2, -1], [-2, 1],
        [-1, -2], [-1, 2],
        [1, -2],  [1, 2],
        [2, -1],  [2, 1],
      ];
      for (const [dr, dc] of knightMoves) {
        const nr = from.row + dr;
        const nc = from.col + dc;
        if (isWithinBounds(nc, nr)) {
          const target = board[nr][nc];
          if (!target || target.color !== color) {
            moves.push({ col: nc, row: nr });
          }
        }
      }
      break;
    }

    case 'ratha': {
      // Orthogonal rays (Rook moves)
      const rays = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
      ];
      for (const [dr, dc] of rays) {
        let nr = from.row + dr;
        let nc = from.col + dc;
        while (isWithinBounds(nc, nr)) {
          const target = board[nr][nc];
          if (!target) {
            moves.push({ col: nc, row: nr });
          } else {
            if (target.color !== color) {
              moves.push({ col: nc, row: nr });
            }
            break; // Ray blocked
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'padati': {
      // Pawns move 1 step forward; capture 1 step diagonally forward
      const forward = color === 'white' ? 1 : -1;

      // 1-step forward march (must be unoccupied)
      const marchRow = from.row + forward;
      if (isWithinBounds(from.col, marchRow)) {
        if (!board[marchRow][from.col]) {
          moves.push({ col: from.col, row: marchRow });
        }
      }

      // Diagonal captures (must contain enemy piece)
      for (const dc of [-1, 1]) {
        const capCol = from.col + dc;
        const capRow = from.row + forward;
        if (isWithinBounds(capCol, capRow)) {
          const target = board[capRow][capCol];
          if (target && target.color !== color) {
            moves.push({ col: capCol, row: capRow });
          }
        }
      }
      break;
    }
  }

  return moves;
}

export function isSquareAttacked(
  board: (Piece | null)[][],
  target: SquareCoord,
  attackerColor: PieceColor
): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === attackerColor) {
        const pseudoMoves = getPseudoLegalMoves(board, { col: c, row: r });
        if (pseudoMoves.some((m) => m.col === target.col && m.row === target.row)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isKingInCheck(board: (Piece | null)[][], color: PieceColor): boolean {
  const kingCoord = findKing(board, color);
  if (!kingCoord) return false;
  const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(board, kingCoord, opponentColor);
}

export function getLegalMoves(
  board: (Piece | null)[][],
  from: SquareCoord
): SquareCoord[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const pseudoMoves = getPseudoLegalMoves(board, from);
  const legalMoves: SquareCoord[] = [];

  for (const to of pseudoMoves) {
    const simBoard = cloneBoard(board);
    simBoard[to.row][to.col] = simBoard[from.row][from.col];
    simBoard[from.row][from.col] = null;

    if (!isKingInCheck(simBoard, piece.color)) {
      legalMoves.push(to);
    }
  }

  return legalMoves;
}

export function getAllLegalMoves(
  board: (Piece | null)[][],
  color: PieceColor
): { from: SquareCoord; to: SquareCoord }[] {
  const allMoves: { from: SquareCoord; to: SquareCoord }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, { col: c, row: r });
        for (const to of moves) {
          allMoves.push({ from: { col: c, row: r }, to });
        }
      }
    }
  }
  return allMoves;
}

export function countArmyPieces(board: (Piece | null)[][], color: PieceColor): number {
  let count = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color && piece.type !== 'raja') {
        count++;
      }
    }
  }
  return count;
}

export function evaluateGameStatus(
  board: (Piece | null)[][],
  turn: PieceColor
): GameStatus {
  const opponent: PieceColor = turn === 'white' ? 'black' : 'white';

  // 1. Bare King rule
  const turnArmy = countArmyPieces(board, turn);
  const opponentArmy = countArmyPieces(board, opponent);

  if (opponentArmy === 0 && turnArmy > 0) {
    return { type: 'bare_king', winner: turn };
  }
  if (turnArmy === 0 && opponentArmy > 0) {
    return { type: 'bare_king', winner: opponent };
  }

  // 2. Legal moves check
  const legalMoves = getAllLegalMoves(board, turn);
  const inCheck = isKingInCheck(board, turn);

  if (legalMoves.length === 0) {
    if (inCheck) {
      return { type: 'checkmate', winner: opponent };
    } else {
      return { type: 'stalemate' };
    }
  }

  return { type: 'ongoing' };
}

export function executeMove(
  board: (Piece | null)[][],
  from: SquareCoord,
  to: SquareCoord
): {
  newBoard: (Piece | null)[][];
  moveRecord: Move;
} {
  const piece = board[from.row][from.col]!;
  const newBoard = cloneBoard(board);

  let promotion: PieceType | undefined;
  let finalPiece = { ...piece };

  // Check Padati promotion: White promotes on row 7, Black on row 0
  if (piece.type === 'padati') {
    if ((piece.color === 'white' && to.row === 7) || (piece.color === 'black' && to.row === 0)) {
      promotion = 'mantri';
      finalPiece = { type: 'mantri', color: piece.color };
    }
  }

  newBoard[to.row][to.col] = finalPiece;
  newBoard[from.row][from.col] = null;

  const moveRecord: Move = {
    from,
    to,
    promotion,
  };

  return { newBoard, moveRecord };
}
