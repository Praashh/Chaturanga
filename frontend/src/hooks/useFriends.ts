import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type {
  FriendUser,
  FriendRequestItem,
  UserSearchResult,
} from '../types/friends';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export function useFriends() {
  const { token, isAuthenticated } = useAuth();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const tokenRef = useRef(token);
  tokenRef.current = token;

  const fetchFriends = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const res = await fetch(`${API_BASE}/api/friends`, {
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setIncomingRequests(data.incoming || []);
        setOutgoingRequests(data.outgoing || []);
        setError(null);
      } else if (res.status !== 401) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to fetch friends');
      }
    } catch (err: any) {
      console.error('Error fetching friends:', err);
    }
  }, []);

  // Initial fetch and refresh when auth token changes
  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoading(true);
      fetchFriends().finally(() => setIsLoading(false));

      // Periodic check for incoming requests (every 20s)
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchFriends();
        }
      }, 20000);

      return () => clearInterval(interval);
    } else {
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
    }
  }, [isAuthenticated, token, fetchFriends]);

  const searchUsers = useCallback(
    async (query: string): Promise<UserSearchResult[]> => {
      if (!tokenRef.current || !query.trim()) return [];
      try {
        const res = await fetch(
          `${API_BASE}/api/friends/search?q=${encodeURIComponent(query.trim())}`,
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          return data.users || [];
        }
        return [];
      } catch (err) {
        console.error('Error searching players:', err);
        return [];
      }
    },
    []
  );

  const sendRequest = useCallback(
    async (targetIdOrEmail: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      if (!tokenRef.current) {
        return { success: false, error: 'Must be signed in' };
      }
      try {
        const res = await fetch(`${API_BASE}/api/friends/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenRef.current}`,
          },
          body: JSON.stringify({ target: targetIdOrEmail }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          await fetchFriends();
          return { success: true, message: data.message };
        } else {
          return { success: false, error: data.error || 'Failed to send request' };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Connection error' };
      }
    },
    [fetchFriends]
  );

  const acceptRequest = useCallback(
    async (requestId: number): Promise<{ success: boolean; error?: string }> => {
      if (!tokenRef.current) {
        return { success: false, error: 'Must be signed in' };
      }
      try {
        const res = await fetch(`${API_BASE}/api/friends/accept`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenRef.current}`,
          },
          body: JSON.stringify({ requestId }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          await fetchFriends();
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Failed to accept request' };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Connection error' };
      }
    },
    [fetchFriends]
  );

  const rejectRequest = useCallback(
    async (requestId: number): Promise<{ success: boolean; error?: string }> => {
      if (!tokenRef.current) {
        return { success: false, error: 'Must be signed in' };
      }
      try {
        const res = await fetch(`${API_BASE}/api/friends/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenRef.current}`,
          },
          body: JSON.stringify({ requestId }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          await fetchFriends();
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Failed to decline request' };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Connection error' };
      }
    },
    [fetchFriends]
  );

  const removeFriend = useCallback(
    async (friendId: string): Promise<{ success: boolean; error?: string }> => {
      if (!tokenRef.current) {
        return { success: false, error: 'Must be signed in' };
      }
      try {
        const res = await fetch(`${API_BASE}/api/friends/${encodeURIComponent(friendId)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        });

        const data = await res.json();
        if (res.ok && data.success) {
          await fetchFriends();
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Failed to remove friend' };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Connection error' };
      }
    },
    [fetchFriends]
  );

  const isFriend = useCallback(
    (userId: string) => {
      return friends.some(f => f.id === userId);
    },
    [friends]
  );

  const hasPendingRequest = useCallback(
    (userId: string) => {
      return (
        incomingRequests.some(r => r.senderId === userId) ||
        outgoingRequests.some(r => r.receiverId === userId)
      );
    },
    [incomingRequests, outgoingRequests]
  );

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    friendsCount: friends.length,
    incomingCount: incomingRequests.length,
    isLoading,
    error,
    fetchFriends,
    searchUsers,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    isFriend,
    hasPendingRequest,
  };
}
