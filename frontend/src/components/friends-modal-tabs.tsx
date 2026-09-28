import React from 'react';
import {
  UserPlus,
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
import type { FriendUser, FriendRequestItem, UserSearchResult } from '../types/friends';
import { TabsContent } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface AlliesTabContentProps {
  friends: FriendUser[];
  filteredFriends: FriendUser[];
  friendFilter: string;
  setFriendFilter: (val: string) => void;
  isLoading: boolean;
  processingId: string | number | null;
  onChallengeFriend?: (friend: FriendUser) => void;
  onClose: () => void;
  onRemoveFriend: (friendId: string, name: string) => void;
  onNavigateToAdd: () => void;
}

export const AlliesTabContent: React.FC<AlliesTabContentProps> = ({
  friends,
  filteredFriends,
  friendFilter,
  setFriendFilter,
  isLoading,
  processingId,
  onChallengeFriend,
  onClose,
  onRemoveFriend,
  onNavigateToAdd,
}) => (
  <TabsContent value="friends" className="mt-0 space-y-3">
    {friends.length > 0 && (
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a857d]" />
        <Input
          type="text"
          value={friendFilter}
          onChange={e => setFriendFilter(e.target.value)}
          placeholder="Search allies by name or email..."
          className="pl-9 h-8 text-xs"
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
        <div className="w-10 h-10 rounded-full bg-[#201e1b] border border-[#2e2a24] flex items-center justify-center mb-3 text-[#8a857d]">
          <Shield className="w-5 h-5 text-[#8a857d]" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">No Allies Yet</h3>
        <p className="text-xs text-[#8a857d] max-w-xs mb-4">
          Send alliance requests to players or challenge adversaries to build your fellowship.
        </p>
        <Button
          onClick={onNavigateToAdd}
          variant="goldOutline"
          size="sm"
          className="gap-2"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Find Players to Add</span>
        </Button>
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
              <Avatar className="w-9 h-9 border border-[#d4af37]/60 bg-[#2a241c] shrink-0">
                {friend.picture && <AvatarImage src={friend.picture} alt={friend.name} />}
                <AvatarFallback className="bg-[#2a241c] text-xs font-semibold text-[#d4af37]">
                  {friend.name ? friend.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>

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
              <Button
                onClick={() => {
                  if (onChallengeFriend) {
                    onChallengeFriend(friend);
                    onClose();
                  }
                }}
                variant="goldOutline"
                size="sm"
                className="h-8 gap-1.5"
              >
                <Swords className="w-3.5 h-3.5 text-[#fcd34d]" />
                <span>Battle</span>
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemoveFriend(friend.id, friend.name)}
                disabled={processingId === friend.id}
                className="text-[#635f58] hover:text-red-300 hover:bg-red-950/50"
                title="Sever alliance"
                aria-label="Sever alliance"
              >
                {processingId === friend.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    )}
  </TabsContent>
);

interface TreatiesTabContentProps {
  incomingRequests: FriendRequestItem[];
  outgoingRequests: FriendRequestItem[];
  processingId: string | number | null;
  onAcceptRequest: (requestId: number) => void;
  onRejectRequest: (requestId: number) => void;
}

export const TreatiesTabContent: React.FC<TreatiesTabContentProps> = ({
  incomingRequests,
  outgoingRequests,
  processingId,
  onAcceptRequest,
  onRejectRequest,
}) => (
  <TabsContent value="requests" className="mt-0 space-y-5">
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
                <Avatar className="w-9 h-9 border border-[#d4af37]/60 bg-[#2a241c] shrink-0">
                  {req.sender?.picture && (
                    <AvatarImage src={req.sender.picture} alt={req.sender.name} />
                  )}
                  <AvatarFallback className="bg-[#2a241c] text-xs font-semibold text-[#d4af37]">
                    {req.sender?.name ? req.sender.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
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
                <Button
                  onClick={() => onAcceptRequest(req.id)}
                  disabled={processingId === req.id}
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 bg-emerald-950/60 border-emerald-600/50 hover:bg-emerald-900/60 text-emerald-300 font-semibold"
                >
                  {processingId === req.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Accept</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRejectRequest(req.id)}
                  disabled={processingId === req.id}
                  className="text-[#8a857d] hover:text-red-300 hover:bg-[#262421]"
                  title="Decline"
                  aria-label="Decline"
                >
                  <Check className="sr-only" />
                  <span>✕</span>
                </Button>
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
                <Avatar className="w-8 h-8 border border-[#3a352f] bg-[#22201d] shrink-0">
                  {req.receiver?.picture && (
                    <AvatarImage src={req.receiver.picture} alt={req.receiver.name} />
                  )}
                  <AvatarFallback className="bg-[#22201d] text-xs font-semibold text-[#baa994]">
                    {req.receiver?.name ? req.receiver.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-white text-xs truncate">
                    {req.receiver?.name}
                  </p>
                  <span className="text-[10px] text-amber-400/80 font-mono">
                    Awaiting reply...
                  </span>
                </div>
              </div>

              <Button
                onClick={() => onRejectRequest(req.id)}
                disabled={processingId === req.id}
                variant="secondary"
                size="sm"
                className="h-7 text-[11px] hover:bg-red-950/40 hover:text-red-300"
              >
                Cancel
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  </TabsContent>
);

interface FindPlayersTabContentProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchResults: UserSearchResult[];
  isSearching: boolean;
  processingId: string | number | null;
  onSendRequest: (target: string) => void;
  onAcceptRequest: (requestId: number) => void;
}

export const FindPlayersTabContent: React.FC<FindPlayersTabContentProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  processingId,
  onSendRequest,
  onAcceptRequest,
}) => (
  <TabsContent value="add" className="mt-0 space-y-4">
    <div className="space-y-2">
      <label htmlFor="player-search-input" className="text-xs font-semibold text-white block">
        Search by Player Name or Email
      </label>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a857d]" />
        <Input
          id="player-search-input"
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Enter name or email (e.g. warrior@gmail.com)..."
          className="pl-9 pr-9 h-9"
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
              <Avatar className="w-9 h-9 border border-[#d4af37]/60 bg-[#2a241c] shrink-0">
                {player.picture && (
                  <AvatarImage src={player.picture} alt={player.name} />
                )}
                <AvatarFallback className="bg-[#2a241c] text-xs font-semibold text-[#d4af37]">
                  {player.name ? player.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
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
                <Badge variant="emerald" className="gap-1 px-2.5 py-1 text-xs">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Allied</span>
                </Badge>
              ) : player.relationshipStatus === 'pending_sent' ? (
                <Badge variant="secondary" className="gap-1 px-2.5 py-1 text-xs text-amber-300 border-[#3d3832]">
                  <Clock className="w-3 h-3" />
                  <span>Pending</span>
                </Badge>
              ) : player.relationshipStatus === 'pending_received' ? (
                <Button
                  onClick={() =>
                    player.requestId && onAcceptRequest(player.requestId)
                  }
                  disabled={processingId === player.id}
                  variant="default"
                  size="sm"
                  className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-500 font-semibold"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept</span>
                </Button>
              ) : (
                <Button
                  onClick={() => onSendRequest(player.id)}
                  disabled={processingId === player.id}
                  variant="goldOutline"
                  size="sm"
                  className="h-8 gap-1.5"
                >
                  {processingId === player.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>Add Friend</span>
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </TabsContent>
);
