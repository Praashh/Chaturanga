export interface FriendUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  picture: string | null;
  rating: number;
  gamesPlayed: number;
  gamesWon: number;
  friendshipId?: string;
}

export interface FriendRequestItem {
  id: number;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender?: FriendUser;
  receiver?: FriendUser;
}

export type RelationshipStatus = 'self' | 'friend' | 'pending_sent' | 'pending_received' | 'none';

export interface UserSearchResult extends FriendUser {
  relationshipStatus: RelationshipStatus;
  requestId?: number;
}
