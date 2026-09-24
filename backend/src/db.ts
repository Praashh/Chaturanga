import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  username: string;
  onboarded: boolean;
  picture: string | null;
  rating: number;
  ratingDeviation?: number;
  gamesPlayed: number;
  gamesWon: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export interface FriendProfile {
  id: string;
  name: string;
  username: string;
  picture: string | null;
  rating: number;
  friendshipId?: string;
}

export interface FriendRequestRecord {
  id: number;
  senderId: string;
  receiverId: string;
  createdAt: Date | string;
  sender?: FriendProfile;
  receiver?: FriendProfile;
}

export type RelationshipStatus = 'self' | 'friend' | 'pending_sent' | 'pending_received' | 'none';

export interface UserSearchResult extends FriendProfile {
  relationshipStatus: RelationshipStatus;
  requestId?: number;
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

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  return await prisma.user.findUnique({
    where: { username: clean },
  });
}


export async function generateUniqueUsername(base: string): Promise<string> {
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 18) || 'warrior';

  let candidate = clean;
  let attempts = 0;

  while (attempts < 10) {
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;

    candidate = `${clean}_${Math.floor(100 + Math.random() * 900)}`;
    attempts++;
  }

  return `${clean}_${Date.now().toString().slice(-4)}`;
}

export async function upsertUser(data: {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  username?: string;
}): Promise<UserRecord> {
  // Check if user already exists by ID or by unique Email
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { id: data.id },
        { email: data.email },
      ],
    },
  });

  if (existingUser) {
    return await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        email: data.email,
        name: data.name,
        ...(data.picture !== undefined ? { picture: data.picture } : {}),
        ...(data.username ? { username: data.username.toLowerCase().trim() } : {}),
        lastLoginAt: new Date(),
      },
    });
  }

  // Create new user with assigned or generated username
  const initialUsername =
    data.username?.toLowerCase().trim() ||
    (await generateUniqueUsername(data.name || data.email.split('@')[0]!));

  const newUser = await prisma.user.create({
    data: {
      id: data.id,
      email: data.email,
      name: data.name,
      username: initialUsername,
      onboarded: false,
      picture: data.picture || null,
      rating: 1500,
      ratingDeviation: 350.0,
      gamesPlayed: 0,
      gamesWon: 0,
      lastLoginAt: new Date(),
    },
  });

  // Automatically initialize default category in player_rating
  await prisma.playerRating.upsert({
    where: { userId_category: { userId: newUser.id, category: 'standard' } },
    create: {
      userId: newUser.id,
      category: 'standard',
      rating: 1500.0,
      ratingDeviation: 350.0,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesDrawn: 0,
      gamesLost: 0,
      ratingSystem: 'glicko-1',
      ratingVersion: 1,
    },
    update: {},
  });

  return newUser;
}

export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<{ available: boolean; error?: string; cleanUsername?: string }> {
  const clean = username.trim().toLowerCase().replace(/^@/, '');

  if (clean.length < 3) {
    return { available: false, error: 'Username must be at least 3 characters' };
  }
  if (clean.length > 20) {
    return { available: false, error: 'Username cannot exceed 20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return {
      available: false,
      error: 'Username can only contain letters, numbers, and underscores',
    };
  }

  const existing = await prisma.user.findFirst({
    where: {
      username: { equals: clean, mode: 'insensitive' },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    return { available: false, error: 'This username is already claimed' };
  }

  return { available: true, cleanUsername: clean };
}

export async function completeUserOnboarding(
  userId: string,
  username: string
): Promise<{ success: boolean; user?: UserRecord; error?: string }> {
  const check = await isUsernameAvailable(username, userId);
  if (!check.available || !check.cleanUsername) {
    return { success: false, error: check.error || 'Invalid username' };
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        username: check.cleanUsername,
        onboarded: true,
      },
    });

    return { success: true, user: updated };
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return { success: false, error: 'This username was just claimed by another player' };
    }
    console.error('Failed to complete onboarding for user:', userId, err);
    return { success: false, error: 'Failed to complete onboarding' };
  }
}

/**
 * @deprecated Use `RatingService.settleGame()` instead.
 * Games must be settled with opponent context using Glicko-1.
 */
export async function updateUserStats(
  id: string,
  result: 'win' | 'loss' | 'draw'
): Promise<UserRecord | null> {
  console.warn(
    `[DEPRECATED] updateUserStats called for user ${id}. Use RatingService.settleGame instead.`
  );
  return await prisma.user.findUnique({ where: { id } });
}

export async function getFriends(userId: string): Promise<FriendProfile[]> {
  try {
    const friendships = await prisma.friendship.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
            rating: true,
          },
        },
      },
      orderBy: {
        friend: { name: 'asc' },
      },
    });

    return friendships.map((f) => ({
      ...f.friend,
      friendshipId: f.id,
    }));
  } catch (err) {
    console.error(`Failed to fetch friends for user ${userId}:`, err);
    throw err;
  }
}

export async function getFriendRequests(userId: string): Promise<{
  incoming: FriendRequestRecord[];
  outgoing: FriendRequestRecord[];
}> {
  try {
    const profileSelect = {
      id: true,
      name: true,
      username: true,
      picture: true,
      rating: true,
    };

    const [incoming, outgoing] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { receiverId: userId },
        include: {
          sender: { select: profileSelect },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendRequest.findMany({
        where: { senderId: userId },
        include: {
          receiver: { select: profileSelect },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { incoming, outgoing };
  } catch (err) {
    console.error(`Failed to fetch friend requests for user ${userId}:`, err);
    throw err;
  }
}


export async function sendFriendRequest(
  senderId: string,
  targetIdentifier: string
): Promise<{ success: boolean; error?: string; autoAccepted?: boolean; request?: FriendRequestRecord }> {
  const cleanTarget = targetIdentifier.trim().replace(/^@/, '');
  if (!cleanTarget) {
    return { success: false, error: 'Target username, ID, or email is required' };
  }

  // Find target user by username (primary), email, or ID
  const receiver = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: cleanTarget, mode: 'insensitive' } },
        { email: { equals: cleanTarget, mode: 'insensitive' } },
        { id: cleanTarget },
      ],
    },
  });

  if (!receiver) {
    return { success: false, error: 'Player not found with that username or email' };
  }

  if (receiver.id === senderId) {
    return { success: false, error: 'Cannot add yourself as an ally' };
  }

  return await prisma.$transaction(async (tx) => {
    // Check if already friends
    const existingFriendship = await tx.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiver.id },
          { userId: receiver.id, friendId: senderId },
        ],
      },
    });

    if (existingFriendship) {
      return { success: false, error: 'You are already allies with this player' };
    }

    // Check if request already sent by us
    const existingRequest = await tx.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId,
          receiverId: receiver.id,
        },
      },
    });

    if (existingRequest) {
      return { success: false, error: 'Alliance request already sent' };
    }

    // Check if receiver already sent us a request -> Auto-accept atomically!
    const reverseRequest = await tx.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: receiver.id,
          receiverId: senderId,
        },
      },
    });

    if (reverseRequest) {
      // Create bidirectional friendship records safely
      await tx.friendship.createMany({
        data: [
          { userId: senderId, friendId: receiver.id },
          { userId: receiver.id, friendId: senderId },
        ],
        skipDuplicates: true,
      });

      // Clean up requests in both directions
      await tx.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId, receiverId: receiver.id },
            { senderId: receiver.id, receiverId: senderId },
          ],
        },
      });

      return { success: true, autoAccepted: true };
    }

    // Create new friend request
    const newRequest = await tx.friendRequest.create({
      data: {
        senderId,
        receiverId: receiver.id,
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            picture: true,
            rating: true,
            gamesPlayed: true,
            gamesWon: true,
          },
        },
      },
    });

    return {
      success: true,
      request: newRequest as FriendRequestRecord,
      autoAccepted: false,
    };
  });
}


export async function acceptFriendRequest(
  requestId: number,
  currentUserId: string
): Promise<{ success: boolean; error?: string }> {
  return await prisma.$transaction(async (tx) => {
    const request = await tx.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: 'Friend request not found or already accepted' };
    }

    if (request.receiverId !== currentUserId) {
      return { success: false, error: 'Unauthorized to accept this request' };
    }

    // Create bidirectional friendship entries
    await tx.friendship.createMany({
      data: [
        { userId: request.senderId, friendId: request.receiverId },
        { userId: request.receiverId, friendId: request.senderId },
      ],
      skipDuplicates: true,
    });

    // Delete both this request and any counter-request between the two users
    await tx.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: request.senderId, receiverId: request.receiverId },
          { senderId: request.receiverId, receiverId: request.senderId },
        ],
      },
    });

    return { success: true };
  });
}


export async function rejectFriendRequest(
  requestId: number,
  currentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.friendRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return { success: false, error: 'Friend request not found or already handled' };
      }

      // Can be cancelled by sender or declined by receiver
      if (request.receiverId !== currentUserId && request.senderId !== currentUserId) {
        return { success: false, error: 'Unauthorized to decline or cancel this request' };
      }

      await tx.friendRequest.delete({
        where: { id: requestId },
      });

      return { success: true };
    });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return { success: false, error: 'Friend request was already removed' };
    }
    console.error('Error rejecting friend request:', err);
    throw err;
  }
}


export async function removeFriend(
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    return { success: true };
  } catch (err) {
    console.error(`Error removing friend between ${userId} and ${friendId}:`, err);
    throw err;
  }
}


export async function searchUsers(
  currentUserId: string,
  query: string
): Promise<UserSearchResult[]> {
  const cleanQuery = query.trim().replace(/^@/, '');
  if (cleanQuery.length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      OR: [
        { username: { contains: cleanQuery, mode: 'insensitive' } },
        { name: { contains: cleanQuery, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      picture: true,
      rating: true,
      gamesPlayed: true,
      gamesWon: true,
    },
    take: 20,
  });

  if (users.length === 0) return [];

  const targetIds = users.map((u) => u.id);

  const [friendships, sentRequests, receivedRequests] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        userId: currentUserId,
        friendId: { in: targetIds },
      },
    }),
    prisma.friendRequest.findMany({
      where: {
        senderId: currentUserId,
        receiverId: { in: targetIds },
      },
    }),
    prisma.friendRequest.findMany({
      where: {
        senderId: { in: targetIds },
        receiverId: currentUserId,
      },
    }),
  ]);

  const friendSet = new Set(friendships.map((f) => f.friendId));
  const sentMap = new Map(sentRequests.map((r) => [r.receiverId, r.id]));
  const receivedMap = new Map(receivedRequests.map((r) => [r.senderId, r.id]));

  return users.map((u) => {
    let relationshipStatus: RelationshipStatus = 'none';
    let requestId: number | undefined;

    if (friendSet.has(u.id)) {
      relationshipStatus = 'friend';
    } else if (sentMap.has(u.id)) {
      relationshipStatus = 'pending_sent';
      requestId = sentMap.get(u.id);
    } else if (receivedMap.has(u.id)) {
      relationshipStatus = 'pending_received';
      requestId = receivedMap.get(u.id);
    }

    return {
      ...u,
      relationshipStatus,
      requestId,
    };
  });
}

export { prisma as db };
