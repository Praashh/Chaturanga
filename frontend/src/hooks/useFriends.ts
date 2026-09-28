import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type {
  FriendUser,
  FriendRequestItem,
  UserSearchResult,
} from '../types/friends';

const API_BASE = (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');

export function useFriends() {
  const { token, isAuthenticated } = useAuth();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/friends`, {
        credentials: 'include',
        headers: tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {},
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

  // Initial fetch and refresh when auth status changes
  useEffect(() => {
    if (isAuthenticated) {
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
  }, [isAuthenticated, fetchFriends]);

  const searchUsers = useCallback(
    async (query: string): Promise<UserSearchResult[]> => {
      if (!query.trim()) return [];
      try {
        const res = await fetch(
          `${API_BASE}/api/friends/search?q=${encodeURIComponent(query.trim())}`,
          {
            credentials: 'include',
            headers: tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {},
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
      try {
        const res = await fetch(`${API_BASE}/api/friends/request`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
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
      try {
        const res = await fetch(`${API_BASE}/api/friends/accept`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
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
      try {
        const res = await fetch(`${API_BASE}/api/friends/reject`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
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
      try {
        const res = await fetch(`${API_BASE}/api/friends/${encodeURIComponent(friendId)}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {},
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
        incomingRequests.some(r => r.senderId === userId || r.sender?.id === userId) ||
        outgoingRequests.some(r => r.receiverId === userId || r.receiver?.id === userId)
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
