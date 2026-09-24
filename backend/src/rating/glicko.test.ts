import { describe, expect, it } from 'bun:test';
import {
  calculateGlickoMatch,
  calculateGlickoPeriod,
  decayRatingDeviation,
  expectedScore,
  g,
  validateRatingState,
  GLICKO_CONSTANTS,
} from './glicko';

describe('Glicko-1 Mathematics Engine', () => {
  // Test 1: Equal ratings, win
  it('Test 1: Equal ratings, win (1500 vs 1500) -> winner increases, loser decreases', () => {
    const result = calculateGlickoMatch(
      { rating: 1500, ratingDeviation: 350 },
      { rating: 1500, ratingDeviation: 350 },
      1 // Player 1 wins
    );

    expect(result.player1.ratingAfter).toBeGreaterThan(1500);
    expect(result.player2.ratingAfter).toBeLessThan(1500);
    expect(result.player1.ratingChange).toBeGreaterThan(0);
    expect(result.player2.ratingChange).toBeLessThan(0);
    expect(result.player1.ratingDeviationAfter).toBeLessThan(350);
    expect(result.player2.ratingDeviationAfter).toBeLessThan(350);
    expect(Number.isFinite(result.player1.ratingAfter)).toBe(true);
    expect(Number.isFinite(result.player2.ratingAfter)).toBe(true);
  });

  // Test 2: Equal ratings, draw
  it('Test 2: Equal ratings, draw (1500 vs 1500) -> ratings remain approx symmetric with negligible change', () => {
    const result = calculateGlickoMatch(
      { rating: 1500, ratingDeviation: 350 },
      { rating: 1500, ratingDeviation: 350 },
      0.5 // Draw
    );

    expect(result.player1.ratingAfter).toBe(1500);
    expect(result.player2.ratingAfter).toBe(1500);
    expect(result.player1.ratingChange).toBe(0);
    expect(result.player2.ratingChange).toBe(0);
    // Even on draw, information was gained, so RD decreases
    expect(result.player1.ratingDeviationAfter).toBeLessThan(350);
    expect(result.player2.ratingDeviationAfter).toBeLessThan(350);
  });

  // Test 3: Underdog wins
  it('Test 3: Underdog wins (1200 vs 1800) -> underdog gains substantially more than favorite would', () => {
    const underdogMatch = calculateGlickoMatch(
      { rating: 1200, ratingDeviation: 100 },
      { rating: 1800, ratingDeviation: 100 },
      1 // Underdog wins
    );

    const favoriteMatch = calculateGlickoMatch(
      { rating: 1800, ratingDeviation: 100 },
      { rating: 1200, ratingDeviation: 100 },
      1 // Favorite wins
    );

    // Underdog gain should be far larger than favorite gain
    expect(underdogMatch.player1.ratingChange).toBeGreaterThan(favoriteMatch.player1.ratingChange * 5);
    // Favorite loss should be substantial
    expect(underdogMatch.player2.ratingChange).toBeLessThan(-20);
  });

  // Test 4: Favorite wins
  it('Test 4: Favorite wins (1800 vs 1200) -> favorite gains relatively little', () => {
    const result = calculateGlickoMatch(
      { rating: 1800, ratingDeviation: 100 },
      { rating: 1200, ratingDeviation: 100 },
      1 // Favorite wins
    );

    expect(result.player1.ratingChange).toBeGreaterThan(0);
    expect(result.player1.ratingChange).toBeLessThan(10); // Very modest gain
    expect(result.player2.ratingChange).toBeLessThan(0);
    expect(Math.abs(result.player2.ratingChange)).toBeLessThan(10);
  });

  // Test 5: Underdog draw
  it('Test 5: Underdog draw (1200 vs 1800) -> lower-rated moves UP, higher-rated moves DOWN', () => {
    const result = calculateGlickoMatch(
      { rating: 1200, ratingDeviation: 100 },
      { rating: 1800, ratingDeviation: 100 },
      0.5 // Draw
    );

    expect(result.player1.ratingAfter).toBeGreaterThan(1200);
    expect(result.player1.ratingChange).toBeGreaterThan(0); // Underdog gained
    expect(result.player2.ratingAfter).toBeLessThan(1800);
    expect(result.player2.ratingChange).toBeLessThan(0); // Favorite lost
  });

  // Test 6: Rating deviation (provisional vs established)
  it('Test 6: High RD causes larger movement, Low RD causes smaller movement', () => {
    const provisional = calculateGlickoMatch(
      { rating: 1500, ratingDeviation: 350 }, // Provisional
      { rating: 1500, ratingDeviation: 100 },
      1
    );

    const established = calculateGlickoMatch(
      { rating: 1500, ratingDeviation: 50 }, // Established
      { rating: 1500, ratingDeviation: 100 },
      1
    );

    expect(provisional.player1.ratingChange).toBeGreaterThan(established.player1.ratingChange * 5);
  });

  // Reference Validation against Mark Glickman's published test vector
  it('Reference Validation: Matches Mark Glickman (1999) published example calculations', () => {
    // In Glickman's paper:
    // Player: R = 1500, RD = 200
    // Opponent 1: R = 1400, RD = 30, score = 1 (win)
    // Opponent 2: R = 1550, RD = 100, score = 0 (loss)
    // Opponent 3: R = 1700, RD = 300, score = 0 (loss)
    // Expected from Glickman (1999):
    // g(RD_1) = 0.9955, E_1 = 0.6395 (approx 0.64)
    // g(RD_2) = 0.9531, E_2 = 0.4318 (approx 0.43)
    // g(RD_3) = 0.7242, E_3 = 0.3028 (approx 0.30)
    // Updated R = 1464.11 (rounds to 1464)
    // Updated RD = 151.4 (rounds to 151)

    const g1 = g(30);
    const g2 = g(100);
    const g3 = g(300);

    expect(Math.round(g1 * 10000) / 10000).toBe(0.9955);
    expect(Math.round(g2 * 10000) / 10000).toBe(0.9531);
    expect(Math.round(g3 * 10000) / 10000).toBe(0.7242);

    const e1 = expectedScore(1500, 1400, 30);
    const e2 = expectedScore(1500, 1550, 100);
    const e3 = expectedScore(1500, 1700, 300);

    expect(Math.round(e1 * 100) / 100).toBe(0.64);
    expect(Math.round(e2 * 100) / 100).toBe(0.43);
    expect(Math.round(e3 * 100) / 100).toBe(0.30);

    const updated = calculateGlickoPeriod(
      { rating: 1500, ratingDeviation: 200 },
      [
        { opponentRating: 1400, opponentRatingDeviation: 30, score: 1 },
        { opponentRating: 1550, opponentRatingDeviation: 100, score: 0 },
        { opponentRating: 1700, opponentRatingDeviation: 300, score: 0 },
      ]
    );

    // Glickman's published values: R = 1464, RD = 151.4
    expect(Math.round(updated.rating)).toBe(1464);
    expect(updated.ratingDeviation).toBe(151.4);
  });

  // Property-based & numeric boundary tests
  describe('Boundary and Property-based Tests', () => {
    it('always produces finite rating and RD', () => {
      const extremeRatings = [1, 100, 500, 1500, 2500, 3000, 5000];
      const extremeRDs = [30, 50, 100, 200, 350];

      for (const r1 of extremeRatings) {
        for (const r2 of extremeRatings) {
          for (const rd1 of extremeRDs) {
            for (const rd2 of extremeRDs) {
              const res = calculateGlickoMatch(
                { rating: r1, ratingDeviation: rd1 },
                { rating: r2, ratingDeviation: rd2 },
                1
              );
              expect(Number.isFinite(res.player1.ratingAfter)).toBe(true);
              expect(Number.isFinite(res.player1.ratingDeviationAfter)).toBe(true);
              expect(Number.isFinite(res.player2.ratingAfter)).toBe(true);
              expect(Number.isFinite(res.player2.ratingDeviationAfter)).toBe(true);
              expect(res.player1.ratingDeviationAfter).toBeGreaterThanOrEqual(GLICKO_CONSTANTS.MIN_RD);
              expect(res.player1.ratingDeviationAfter).toBeLessThanOrEqual(GLICKO_CONSTANTS.MAX_RD);
            }
          }
        }
      }
    });

    it('rejects invalid inputs safely', () => {
      expect(() =>
        validateRatingState({ rating: NaN, ratingDeviation: 100 })
      ).toThrow();
      expect(() =>
        validateRatingState({ rating: Infinity, ratingDeviation: 100 })
      ).toThrow();
      expect(() =>
        validateRatingState({ rating: 1500, ratingDeviation: -10 })
      ).toThrow();
      expect(() =>
        validateRatingState({ rating: 1500, ratingDeviation: 0 })
      ).toThrow();
      expect(() =>
        calculateGlickoMatch(
          { rating: 1500, ratingDeviation: 100 },
          { rating: 1500, ratingDeviation: 100 },
          0.75 // Invalid score
        )
      ).toThrow();
    });

    it('inactivity decay increases RD up to MAX_RD', () => {
      const startRD = 50;
      const decayed30Days = decayRatingDeviation(startRD, 30);
      expect(decayed30Days).toBeGreaterThan(startRD);

      const decayed1000Days = decayRatingDeviation(startRD, 1000);
      expect(decayed1000Days).toBe(GLICKO_CONSTANTS.MAX_RD);

      const decayed0Days = decayRatingDeviation(startRD, 0);
      expect(decayed0Days).toBe(startRD);
    });
  });
});
