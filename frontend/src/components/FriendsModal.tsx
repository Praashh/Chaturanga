import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  Mail,
  Swords,
  Trash2,
  Check,
  Search,
  Trophy,
  Loader2,
  Clock,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useFriends } from '../hooks/useFriends';
import type { FriendUser, UserSearchResult } from '../types/friends';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeFriend?: (friend: FriendUser) => void;
}

type TabType = 'friends' | 'requests' | 'add';

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  onChallengeFriend,
}) => {
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    friendsCount,
    incomingCount,
    isLoading,
    searchUsers,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [friendFilter, setFriendFilter] = useState('');

  // Clear feedback after 4 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  // Debounced search for players
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  if (!isOpen) return null;

  const handleSendRequest = async (target: string) => {
    setProcessingId(target);
    const res = await sendRequest(target);
    setProcessingId(null);
    if (res.success) {
      setActionFeedback({
        type: 'success',
        text: res.message || 'Alliance request dispatched!',
      });
      // Update local search results state
      setSearchResults(prev =>
        prev.map(u =>
          u.id === target || u.username === target || u.email === target
            ? { ...u, relationshipStatus: 'pending_sent' }
            : u
        )
      );
    } else {
      setActionFeedback({
        type: 'error',
        text: res.error || 'Failed to dispatch request',
      });
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    setProcessingId(requestId);
    const res = await acceptRequest(requestId);
    setProcessingId(null);
    if (res.success) {
      setActionFeedback({
        type: 'success',
        text: 'Alliance forged! Player added to your allies.',
      });
    } else {
      setActionFeedback({
        type: 'error',
        text: res.error || 'Failed to accept treaty',
      });
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setProcessingId(requestId);
    const res = await rejectRequest(requestId);
    setProcessingId(null);
    if (res.success) {
      setActionFeedback({
        type: 'success',
        text: 'Request removed.',
      });
    } else {
      setActionFeedback({
        type: 'error',
        text: res.error || 'Failed to decline',
      });
    }
  };

  const handleRemoveFriend = async (friendId: string, name: string) => {
    if (!confirm(`Sever alliance with ${name}?`)) return;
    setProcessingId(friendId);
    const res = await removeFriend(friendId);
    setProcessingId(null);
    if (res.success) {
      setActionFeedback({
        type: 'success',
        text: `Alliance with ${name} dissolved.`,
      });
    } else {
      setActionFeedback({
        type: 'error',
        text: res.error || 'Failed to dissolve alliance',
      });
    }
  };

  const filteredFriends = friends.filter(
    f =>
      f.name.toLowerCase().includes(friendFilter.toLowerCase()) ||
      (f.username && f.username.toLowerCase().includes(friendFilter.toLowerCase())) ||
      (f.email && f.email.toLowerCase().includes(friendFilter.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#161512] border border-[#2e2a24] shadow-2xl flex flex-col text-[#e3ded7] max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262421] bg-[#1a1815]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#262421] border border-[#d4af37]/40 flex items-center justify-center text-base shadow-inner">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide font-serif">
                  Alliances & Friends
                </h2>
                {incomingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    {incomingCount} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8a857d]">
                Challenge allies and forge treaties on the Ashtāpada
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#262421] text-[#8a857d] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action feedback toast */}
        {actionFeedback && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b transition-all ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300'
                : 'bg-red-950/60 border-red-800/40 text-red-300'
            }`}
          >
            <span>{actionFeedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{actionFeedback.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-[#262421] bg-[#12110e] text-xs font-medium">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center justify-center gap-2 py-3 transition-colors relative cursor-pointer ${
              activeTab === 'friends'
                ? 'text-[#fcd34d] font-semibold bg-[#1a1815]'
                : 'text-[#8a857d] hover:text-[#e3ded7] hover:bg-[#161512]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Allies ({friendsCount})</span>
            {activeTab === 'friends' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center justify-center gap-2 py-3 transition-colors relative cursor-pointer ${
              activeTab === 'requests'
                ? 'text-[#fcd34d] font-semibold bg-[#1a1815]'
                : 'text-[#8a857d] hover:text-[#e3ded7] hover:bg-[#161512]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Requests</span>
            {incomingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
            {activeTab === 'requests' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center justify-center gap-2 py-3 transition-colors relative cursor-pointer ${
              activeTab === 'add'
                ? 'text-[#fcd34d] font-semibold bg-[#1a1815]'
                : 'text-[#8a857d] hover:text-[#e3ded7] hover:bg-[#161512]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Find Players</span>
            {activeTab === 'add' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]" />
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[320px] max-h-[500px]">
          {/* TAB 1: ALLIES LIST */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {friends.length > 0 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a857d]" />
                  <input
                    type="text"
                    value={friendFilter}
                    onChange={e => setFriendFilter(e.target.value)}
                    placeholder="Search allies by name or email..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#201e1b] border border-[#2e2a24] text-xs text-white placeholder-[#635f58] focus:outline-none focus:border-[#d4af37]/60"
                  />
                </div>
              )}

              {isLoading && friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#8a857d]">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#d4af37]" />
                  <span className="text-xs">Gathering your allies...</span>
                </div>
              ) : friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#201e1b] border border-[#2e2a24] flex items-center justify-center text-xl mb-3 text-[#8a857d]">
                    🛡️
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">No Allies Yet</h3>
                  <p className="text-xs text-[#8a857d] max-w-xs mb-4">
                    Send alliance requests to players or challenge adversaries to build your fellowship.
                  </p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-4 py-2 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fcd34d] hover:bg-[#d4af37]/30 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Find Players to Add</span>
                  </button>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8a857d]">
                  No allies match "{friendFilter}"
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFriends.map(friend => (
                    <div
                      key={friend.id}
                      className="p-3 rounded-xl bg-[#201e1b] border border-[#2c2823] hover:border-[#3d3832] transition-colors flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full border border-[#d4af37]/60 bg-[#2a241c] overflow-hidden flex items-center justify-center shrink-0">
                          {friend.picture ? (
                            <img
                              src={friend.picture}
                              alt={friend.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm">🥷</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-white text-xs truncate">
                            {friend.username ? `@${friend.username}` : friend.name}
                          </p>
                          {friend.username && (
                            <p className="text-[10px] text-[#8a857d] font-sans truncate">
                              {friend.name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-[#8a857d] font-mono mt-0.5">
                            <span className="text-[#fcd34d] flex items-center gap-1 font-bold">
                              <Trophy className="w-2.5 h-2.5" /> {friend.rating}
                            </span>
                            <span>•</span>
                            <span>{friend.gamesWon}W / {friend.gamesPlayed}G</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            if (onChallengeFriend) {
                              onChallengeFriend(friend);
                              onClose();
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600/30 to-[#d4af37]/30 border border-[#d4af37]/50 hover:border-[#d4af37] text-[#fef08a] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          title="Challenge friend to an online game"
                        >
                          <Swords className="w-3.5 h-3.5 text-[#fcd34d]" />
                          <span>Battle</span>
                        </button>

                        <button
                          onClick={() => handleRemoveFriend(friend.id, friend.name)}
                          disabled={processingId === friend.id}
                          className="p-1.5 rounded-lg hover:bg-red-950/50 hover:text-red-300 text-[#635f58] transition-colors cursor-pointer"
                          title="Sever alliance"
                        >
                          {processingId === friend.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS (INCOMING & OUTGOING) */}
          {activeTab === 'requests' && (
            <div className="space-y-5">
              {/* Incoming Requests */}
              <div>
                <h4 className="text-[11px] font-semibold text-[#8a857d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-[#d4af37]" />
                  <span>Incoming Treaties ({incomingRequests.length})</span>
                </h4>

                {incomingRequests.length === 0 ? (
                  <p className="text-xs text-[#635f58] italic py-2 pl-1">
                    No pending incoming alliance requests.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {incomingRequests.map(req => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl bg-[#201e1b] border border-[#2e2a24] flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full border border-[#d4af37]/60 bg-[#2a241c] overflow-hidden flex items-center justify-center shrink-0">
                            {req.sender?.picture ? (
                              <img
                                src={req.sender.picture}
                                alt={req.sender.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs">🥷</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-xs truncate">
                              {req.sender?.name}
                            </p>
                            <p className="text-[10px] text-[#8a857d] font-mono">
                              Rating: {req.sender?.rating || 100}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            disabled={processingId === req.id}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-600/50 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {processingId === req.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Accept</span>
                          </button>

                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={processingId === req.id}
                            className="p-1.5 rounded-lg hover:bg-[#262421] text-[#8a857d] hover:text-red-300 transition-colors cursor-pointer"
                            title="Decline"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Requests */}
              <div className="pt-3 border-t border-[#262421]">
                <h4 className="text-[11px] font-semibold text-[#8a857d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#8a857d]" />
                  <span>Pending Outgoing ({outgoingRequests.length})</span>
                </h4>

                {outgoingRequests.length === 0 ? (
                  <p className="text-xs text-[#635f58] italic py-2 pl-1">
                    No outgoing requests awaiting response.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {outgoingRequests.map(req => (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-xl bg-[#1c1a17] border border-[#262421] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full border border-[#3a352f] bg-[#22201d] overflow-hidden flex items-center justify-center shrink-0">
                            {req.receiver?.picture ? (
                              <img
                                src={req.receiver.picture}
                                alt={req.receiver.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs">🥷</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-white text-xs truncate">
                              {req.receiver?.name}
                            </p>
                            <span className="text-[10px] text-amber-400/80 font-mono">
                              Awaiting reply...
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          disabled={processingId === req.id}
                          className="px-2 py-1 rounded bg-[#262421] hover:bg-red-950/40 hover:text-red-300 text-[11px] text-[#8a857d] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FIND & ADD PLAYERS */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white block">
                  Search by Player Name or Email
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a857d]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Enter name or email (e.g. warrior@gmail.com)..."
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#201e1b] border border-[#2e2a24] text-xs text-white placeholder-[#635f58] focus:outline-none focus:border-[#d4af37]"
                    autoFocus
                  />
                  {isSearching && (
                    <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#d4af37] animate-spin" />
                  )}
                </div>
              </div>

              {/* Search Results */}
              <div className="space-y-2 pt-1">
                {searchQuery.trim() === '' ? (
                  <div className="text-center py-8 text-xs text-[#8a857d]">
                    <UserPlus className="w-8 h-8 text-[#3a352f] mx-auto mb-2" />
                    <span>Type a player's name or email to search the realm.</span>
                  </div>
                ) : searchResults.length === 0 && !isSearching ? (
                  <div className="text-center py-8 text-xs text-[#8a857d]">
                    No players found matching "{searchQuery}".
                  </div>
                ) : (
                  searchResults.map(player => (
                    <div
                      key={player.id}
                      className="p-3 rounded-xl bg-[#201e1b] border border-[#2c2823] flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full border border-[#d4af37]/60 bg-[#2a241c] overflow-hidden flex items-center justify-center shrink-0">
                          {player.picture ? (
                            <img
                              src={player.picture}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm">🥷</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-xs truncate">
                            {player.username ? `@${player.username}` : player.name}
                          </p>
                          {player.username && (
                            <p className="text-[10px] text-[#8a857d] font-sans truncate">
                              {player.name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-[#8a857d] font-mono mt-0.5">
                            <span className="text-[#fcd34d] flex items-center gap-1 font-bold">
                              <Trophy className="w-2.5 h-2.5" /> {player.rating}
                            </span>
                            <span>•</span>
                            <span>{player.gamesPlayed} games played</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {player.relationshipStatus === 'friend' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-xs font-medium">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Allied</span>
                          </span>
                        ) : player.relationshipStatus === 'pending_sent' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#262421] border border-[#3d3832] text-amber-300 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        ) : player.relationshipStatus === 'pending_received' ? (
                          <button
                            onClick={() =>
                              player.requestId && handleAcceptRequest(player.requestId)
                            }
                            disabled={processingId === player.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(player.id)}
                            disabled={processingId === player.id}
                            className="px-3 py-1.5 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/50 hover:bg-[#d4af37]/30 text-[#fcd34d] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {processingId === player.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserPlus className="w-3.5 h-3.5" />
                            )}
                            <span>Add Friend</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
