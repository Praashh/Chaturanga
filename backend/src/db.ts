import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL!;

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  lastLoginAt?: Date | string;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  return await prisma.user.findUnique({
    where: { id },
  });
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export async function upsertUser(data: {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
}): Promise<UserRecord> {
  return await prisma.user.upsert({
    where: { id: data.id },
    update: {
      name: data.name,
      ...(data.picture !== undefined ? { picture: data.picture } : {}),
      lastLoginAt: new Date(),
    },
    create: {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture || null,
      rating: 1500,
      gamesPlayed: 0,
      gamesWon: 0,
      lastLoginAt: new Date(),
    },
  });
}

export async function updateUserStats(
  id: string,
  result: 'win' | 'loss' | 'draw'
): Promise<UserRecord | null> {
  const user = await getUserById(id);
  if (!user) return null;

  let ratingDelta = 0;
  if (result === 'win') ratingDelta = 15;
  else if (result === 'loss') ratingDelta = -15;

  const newRating = Math.max(100, user.rating + ratingDelta);
  const gamesPlayed = user.gamesPlayed + 1;
  const gamesWon = result === 'win' ? user.gamesWon + 1 : user.gamesWon;

  return await prisma.user.update({
    where: { id },
    data: {
      rating: newRating,
      gamesPlayed,
      gamesWon,
    },
  });
}

export { prisma as db };
