-- AlterTable
ALTER TABLE "user" ADD COLUMN     "lastRatedGameAt" TIMESTAMP(3),
ADD COLUMN     "ratingDeviation" DOUBLE PRECISION NOT NULL DEFAULT 350.0,
ADD COLUMN     "ratingVersion" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "rating" SET DEFAULT 1500;

-- CreateTable
CREATE TABLE "game" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'standard',
    "isRated" BOOLEAN NOT NULL DEFAULT true,
    "whitePlayerId" TEXT,
    "blackPlayerId" TEXT,
    "winner" TEXT,
    "endReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "ratingProcessed" BOOLEAN NOT NULL DEFAULT false,
    "ratingProcessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_rating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'standard',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 1500.0,
    "ratingDeviation" DOUBLE PRECISION NOT NULL DEFAULT 350.0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "gamesDrawn" INTEGER NOT NULL DEFAULT 0,
    "gamesLost" INTEGER NOT NULL DEFAULT 0,
    "lastRatedGameAt" TIMESTAMP(3),
    "ratingSystem" TEXT NOT NULL DEFAULT 'glicko-1',
    "ratingVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_history" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'standard',
    "ratingBefore" DOUBLE PRECISION NOT NULL,
    "ratingAfter" DOUBLE PRECISION NOT NULL,
    "ratingChange" DOUBLE PRECISION NOT NULL,
    "ratingDeviationBefore" DOUBLE PRECISION NOT NULL,
    "ratingDeviationAfter" DOUBLE PRECISION NOT NULL,
    "result" DOUBLE PRECISION NOT NULL,
    "opponentUserId" TEXT,
    "opponentRatingBefore" DOUBLE PRECISION,
    "opponentRDBefore" DOUBLE PRECISION,
    "ratingSystem" TEXT NOT NULL DEFAULT 'glicko-1',
    "ratingVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_whitePlayerId_idx" ON "game"("whitePlayerId");

-- CreateIndex
CREATE INDEX "game_blackPlayerId_idx" ON "game"("blackPlayerId");

-- CreateIndex
CREATE INDEX "game_status_idx" ON "game"("status");

-- CreateIndex
CREATE INDEX "player_rating_category_rating_ratingDeviation_idx" ON "player_rating"("category", "rating" DESC, "ratingDeviation" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "player_rating_userId_category_key" ON "player_rating"("userId", "category");

-- CreateIndex
CREATE INDEX "rating_history_userId_createdAt_idx" ON "rating_history"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "rating_history_gameId_userId_key" ON "rating_history"("gameId", "userId");

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_whitePlayerId_fkey" FOREIGN KEY ("whitePlayerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_blackPlayerId_fkey" FOREIGN KEY ("blackPlayerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_rating" ADD CONSTRAINT "player_rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
