/**
 * Room URL and Routing Utilities for Chaturanga
 */

export function getRoomIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // Check /game/:roomId
  const match = window.location.pathname.match(/^\/game\/([^/?#]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  // Fallback: ?room=:roomId
  const searchParams = new URLSearchParams(window.location.search);
  const queryRoom = searchParams.get('room');
  if (queryRoom) {
    return decodeURIComponent(queryRoom);
  }

  return null;
}

export function updateGameRoomUrl(roomId: string | null) {
  if (typeof window === 'undefined') return;

  const currentRoom = getRoomIdFromUrl();
  if (roomId) {
    if (currentRoom !== roomId) {
      const targetUrl = `/game/${encodeURIComponent(roomId)}`;
      window.history.pushState({ roomId }, '', targetUrl);
    }
  } else {
    if (window.location.pathname !== '/' || window.location.search) {
      window.history.pushState({}, '', '/');
    }
  }
}

export function getGameShareUrl(roomId: string): string {
  if (typeof window === 'undefined') return `/game/${roomId}`;
  return `${window.location.origin}/game/${encodeURIComponent(roomId)}`;
}

export function generateRoomId(): string {
  const adjectives = ['royal', 'vedic', 'brave', 'golden', 'solar', 'silent', 'swift', 'ancient'];
  const nouns = ['chaturanga', 'senapati', 'ashtapada', 'ashva', 'ratha', 'gaja', 'mantri'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const randCode = Math.random().toString(36).substring(2, 6);
  return `${adj}-${noun}-${randCode}`;
}
