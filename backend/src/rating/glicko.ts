/**
 * Glicko-1 Rating System Implementation
 *
 * Implements Mark Glickman's Glicko rating system (1999).
 * Reference: http://www.glicko.net/glicko/glicko.pdf
 *
 * Key properties:
 * - Each player has a rating (R) and a rating deviation (RD).
 * - Higher RD signifies greater uncertainty (e.g. new or inactive players).
 * - Match outcomes update both R and RD deterministically.
 * - Standard scale: Initial Rating = 1500, Initial RD = 350.
 */

export interface PlayerRatingState {
  rating: number;
  ratingDeviation: number;
}

export interface MatchOpponentResult {
  opponentRating: number;
  opponentRatingDeviation: number;
  /**
   * Score: 1 = Win, 0.5 = Draw, 0 = Loss
   */
  score: number;
}

export interface GlickoMatchResult {
  player1: {
    ratingBefore: number;
    ratingAfter: number;
    ratingChange: number;
    ratingDeviationBefore: number;
    ratingDeviationAfter: number;
  };
  player2: {
    ratingBefore: number;
    ratingAfter: number;
    ratingChange: number;
    ratingDeviationBefore: number;
    ratingDeviationAfter: number;
  };
}

export const GLICKO_CONSTANTS = {
  DEFAULT_RATING: 1500,
  DEFAULT_RD: 350,
  MIN_RD: 30,
  MAX_RD: 350,
  // Constant governing uncertainty increase over time:
  // After ~365 days of inactivity, an established player's RD (50) returns to ~350.
  // c^2 = (350^2 - 50^2) / 365 => c approx 18.13 / sqrt(day)
  INACTIVITY_C: Math.sqrt((350 * 350 - 50 * 50) / 365),
} as const;

export const Q = Math.LN10 / 400; // ~0.005756462732485114

/**
 * Validates that rating and RD are finite and within physical bounds.
 */
export function validateRatingState(state: PlayerRatingState): void {
  if (
    typeof state.rating !== 'number' ||
    !Number.isFinite(state.rating) ||
    Number.isNaN(state.rating)
  ) {
    throw new Error(`Invalid rating value: ${state.rating}. Must be a finite number.`);
  }

  if (
    typeof state.ratingDeviation !== 'number' ||
    !Number.isFinite(state.ratingDeviation) ||
    Number.isNaN(state.ratingDeviation)
  ) {
    throw new Error(
      `Invalid ratingDeviation value: ${state.ratingDeviation}. Must be a finite number.`
    );
  }

  if (state.ratingDeviation <= 0) {
    throw new Error(
      `Invalid ratingDeviation value: ${state.ratingDeviation}. Must be strictly positive.`
    );
  }

  if (state.rating < 0 || state.rating > 10000) {
    throw new Error(
      `Rating value ${state.rating} is outside plausible range [0, 10000].`
    );
  }
}

/**
 * Validates score is 1, 0.5, or 0.
 */
export function validateScore(score: number): void {
  if (score !== 1 && score !== 0.5 && score !== 0) {
    throw new Error(
      `Invalid match score: ${score}. Must be 1 (win), 0.5 (draw), or 0 (loss).`
    );
  }
}

/**
 * Inactivity decay for Rating Deviation (Glicko Step 1).
 * Increases RD over time according to elapsed days:
 * RD' = min(sqrt(RD^2 + c^2 * elapsedDays), MAX_RD)
 */
export function decayRatingDeviation(
  currentRD: number,
  elapsedDays: number,
  c: number = GLICKO_CONSTANTS.INACTIVITY_C
): number {
  if (elapsedDays <= 0) return Math.min(Math.max(currentRD, GLICKO_CONSTANTS.MIN_RD), GLICKO_CONSTANTS.MAX_RD);
  const newRD = Math.sqrt(currentRD * currentRD + c * c * elapsedDays);
  return Math.min(newRD, GLICKO_CONSTANTS.MAX_RD);
}

/**
 * g(RD) attenuation function:
 * g(RD) = 1 / sqrt(1 + 3 * q^2 * RD^2 / pi^2)
 */
export function g(ratingDeviation: number): number {
  const rd = Math.max(ratingDeviation, 1);
  const factor = (3 * Q * Q * rd * rd) / (Math.PI * Math.PI);
  return 1 / Math.sqrt(1 + factor);
}

/**
 * Expected score E given player's rating R, opponent's rating R_opp and opponent's RD:
 * E = 1 / (1 + 10^(-g(RD_opp) * (R - R_opp) / 400))
 */
export function expectedScore(
  playerRating: number,
  opponentRating: number,
  opponentRD: number
): number {
  const gVal = g(opponentRD);
  const exponent = (-gVal * (playerRating - opponentRating)) / 400;
  return 1 / (1 + Math.pow(10, exponent));
}

/**
 * Calculates updated rating and RD for a single player against one or more opponents.
 * Implements Glicko-1 Step 2 and Step 3.
 */
export function calculateGlickoPeriod(
  player: PlayerRatingState,
  results: MatchOpponentResult[]
): PlayerRatingState {
  validateRatingState(player);

  if (results.length === 0) {
    return { ...player };
  }

  const R = player.rating;
  const RD = Math.min(Math.max(player.ratingDeviation, GLICKO_CONSTANTS.MIN_RD), GLICKO_CONSTANTS.MAX_RD);

  let dSquaredInv = 0;
  let scoreSum = 0;

  for (const m of results) {
    validateScore(m.score);
    validateRatingState({
      rating: m.opponentRating,
      ratingDeviation: m.opponentRatingDeviation,
    });

    const gOpp = g(m.opponentRatingDeviation);
    const E = expectedScore(R, m.opponentRating, m.opponentRatingDeviation);

    dSquaredInv += Q * Q * gOpp * gOpp * E * (1 - E);
    scoreSum += gOpp * (m.score - E);
  }

  if (dSquaredInv <= 0) {
    return { ...player };
  }

  const denom = (1 / (RD * RD)) + dSquaredInv;
  const newR = R + (Q / denom) * scoreSum;
  const newRD = Math.sqrt(1 / denom);

  return {
    rating: Math.round(newR * 100) / 100,
    ratingDeviation: Math.min(
      Math.max(Math.round(newRD * 100) / 100, GLICKO_CONSTANTS.MIN_RD),
      GLICKO_CONSTANTS.MAX_RD
    ),
  };
}

/**
 * Calculates updated ratings and deviations for both participants of a single match.
 *
 * @param player1 Rating and RD of Player 1
 * @param player2 Rating and RD of Player 2
 * @param player1Score Score for Player 1: 1 (win), 0.5 (draw), 0 (loss)
 * @param elapsedDays1 Optional elapsed days since player 1's last game (for RD decay)
 * @param elapsedDays2 Optional elapsed days since player 2's last game (for RD decay)
 */
export function calculateGlickoMatch(
  player1: PlayerRatingState,
  player2: PlayerRatingState,
  player1Score: number,
  elapsedDays1: number = 0,
  elapsedDays2: number = 0
): GlickoMatchResult {
  validateRatingState(player1);
  validateRatingState(player2);
  validateScore(player1Score);

  const player2Score = 1 - player1Score;

  // Apply inactivity decay if applicable
  const p1EffectiveRD = decayRatingDeviation(player1.ratingDeviation, elapsedDays1);
  const p2EffectiveRD = decayRatingDeviation(player2.ratingDeviation, elapsedDays2);

  // Calculate new state for Player 1
  const p1Updated = calculateGlickoPeriod(
    { rating: player1.rating, ratingDeviation: p1EffectiveRD },
    [
      {
        opponentRating: player2.rating,
        opponentRatingDeviation: p2EffectiveRD,
        score: player1Score,
      },
    ]
  );

  // Calculate new state for Player 2
  const p2Updated = calculateGlickoPeriod(
    { rating: player2.rating, ratingDeviation: p2EffectiveRD },
    [
      {
        opponentRating: player1.rating,
        opponentRatingDeviation: p1EffectiveRD,
        score: player2Score,
      },
    ]
  );

  return {
    player1: {
      ratingBefore: player1.rating,
      ratingAfter: p1Updated.rating,
      ratingChange: Math.round((p1Updated.rating - player1.rating) * 100) / 100,
      ratingDeviationBefore: player1.ratingDeviation,
      ratingDeviationAfter: p1Updated.ratingDeviation,
    },
    player2: {
      ratingBefore: player2.rating,
      ratingAfter: p2Updated.rating,
      ratingChange: Math.round((p2Updated.rating - player2.rating) * 100) / 100,
      ratingDeviationBefore: player2.ratingDeviation,
      ratingDeviationAfter: p2Updated.ratingDeviation,
    },
  };
}
