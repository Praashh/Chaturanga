export interface FriendRequestUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  picture: string | null;
  rating: number;
}

export interface FriendUser extends FriendRequestUser {
  gamesPlayed: number;
  gamesWon: number;
}

export interface FriendRequestItem {
  id: number;
  senderId?: string;
  receiverId?: string;
  createdAt?: string;
  sender?: FriendRequestUser;
  receiver?: FriendRequestUser;
}

export type RelationshipStatus = 'self' | 'friend' | 'pending_sent' | 'pending_received' | 'none';

export interface UserSearchResult {
  id: string;
  name: string;
  username: string;
  email?: string;
  picture: string | null;
  rating: number;
  gamesPlayed: number;
  relationshipStatus: RelationshipStatus;
  requestId?: number;
}
