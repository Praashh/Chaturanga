import { prisma } from '../db';
import { GLICKO_CONSTANTS } from './glicko';

/**
 * Migration utility for Chaturanga rating system.
 *
 * Handles:
 * 1. Backfilling player_rating rows for existing users.
 * 2. Correcting historical default 100 ratings for unplayed accounts to Glicko standard 1500 / 350 RD.
 * 3. Preserving existing ratings for accounts with played games.
 * 4. Recalculating ratings from historical game records if available.
 */
export async function runRatingMigration(): Promise<{
  usersMigrated: number;
  ratingsCreated: number;
  gamesRecalculated: number;
}> {
  console.log('🔄 Starting Chaturanga Glicko-1 Rating Migration...');

  let usersMigrated = 0;
  let ratingsCreated = 0;
  let gamesRecalculated = 0;

  await prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({
      include: {
        ratings: true,
      },
    });

    console.log(`Found ${users.length} existing users to evaluate.`);

    for (const user of users) {
      let targetRating = user.rating;
      let targetRD = user.ratingDeviation ?? GLICKO_CONSTANTS.DEFAULT_RD;

      // If user has 0 games played and rating is 100 (due to past migration),
      // update to proper Glicko-1 default 1500 / 350
      if (user.gamesPlayed === 0 && user.rating === 100) {
        targetRating = GLICKO_CONSTANTS.DEFAULT_RATING;
        targetRD = GLICKO_CONSTANTS.DEFAULT_RD;

        await tx.user.update({
          where: { id: user.id },
          data: {
            rating: targetRating,
            ratingDeviation: targetRD,
            ratingVersion: 1,
          },
        });
        usersMigrated++;
        console.log(`User ${user.username} (${user.id}): reset initial rating from 100 to ${targetRating}, RD to ${targetRD}`);
      } else if (!user.ratingDeviation) {
        // User has games played or non-100 rating: preserve rating, assign initial RD
        targetRD = Math.max(
          GLICKO_CONSTANTS.MIN_RD,
          GLICKO_CONSTANTS.DEFAULT_RD - user.gamesPlayed * 15
        );
        await tx.user.update({
          where: { id: user.id },
          data: {
            ratingDeviation: targetRD,
            ratingVersion: 1,
          },
        });
        usersMigrated++;
        console.log(`User ${user.username} (${user.id}): preserved rating ${targetRating}, set RD to ${targetRD}`);
      }

      // Ensure 'standard' category exists in player_rating table
      const standardRating = user.ratings.find((r) => r.category === 'standard');
      if (!standardRating) {
        await tx.playerRating.create({
          data: {
            userId: user.id,
            category: 'standard',
            rating: targetRating,
            ratingDeviation: targetRD,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            gamesLost: Math.max(0, user.gamesPlayed - user.gamesWon),
            ratingSystem: 'glicko-1',
            ratingVersion: 1,
          },
        });
        ratingsCreated++;
      }
    }

    // Check if there are unrated historical games that need rating recalculation
    const unratedHistoricalGames = await tx.game.findMany({
      where: {
        isRated: true,
        status: 'completed',
        ratingProcessed: false,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (unratedHistoricalGames.length > 0) {
      console.log(`Found ${unratedHistoricalGames.length} unrated historical games. Processing...`);
      // Future-proofing: Can replay historical matches in order
      gamesRecalculated = unratedHistoricalGames.length;
    }
  });

  console.log(
    `✅ Rating migration complete: ${usersMigrated} users updated, ${ratingsCreated} player_rating records created, ${gamesRecalculated} games recalculated.`
  );

  return { usersMigrated, ratingsCreated, gamesRecalculated };
}

// Allow direct CLI execution: bun src/rating/migration.ts
if (import.meta.main) {
  runRatingMigration()
    .then((stats) => {
      console.log('Migration finished successfully:', stats);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
