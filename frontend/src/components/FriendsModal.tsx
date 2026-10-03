import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useFriends } from '../hooks/useFriends';
import type { FriendUser, UserSearchResult } from '../types/friends';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  AlliesTabContent,
  TreatiesTabContent,
  FindPlayersTabContent,
} from './friends-modal-tabs';

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
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [friendFilter, setFriendFilter] = useState('');

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

  const handleSendRequest = async (target: string) => {
    setProcessingId(target);
    const res = await sendRequest(target);
    setProcessingId(null);
    if (res.success) {
      toast.success(res.message || 'Alliance request dispatched!');
      setSearchResults(prev =>
        prev.map(u =>
          u.id === target || u.username === target || u.email === target
            ? { ...u, relationshipStatus: 'pending_sent' }
            : u
        )
      );
    } else {
      toast.error(res.error || 'Failed to dispatch request');
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    setProcessingId(requestId);
    const res = await acceptRequest(requestId);
    setProcessingId(null);
    if (res.success) {
      toast.success('Alliance forged! Player added to your allies.');
    } else {
      toast.error(res.error || 'Failed to accept treaty');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setProcessingId(requestId);
    const res = await rejectRequest(requestId);
    setProcessingId(null);
    if (res.success) {
      toast.info('Request removed.');
    } else {
      toast.error(res.error || 'Failed to decline');
    }
  };

  const handleRemoveFriend = async (friendId: string, name: string) => {
    if (!confirm(`Sever alliance with ${name}?`)) return;
    setProcessingId(friendId);
    const res = await removeFriend(friendId);
    setProcessingId(null);
    if (res.success) {
      toast.info(`Alliance with ${name} dissolved.`);
    } else {
      toast.error(res.error || 'Failed to dissolve alliance');
    }
  };

  const filteredFriends = friends.filter(
    f =>
      f.name.toLowerCase().includes(friendFilter.toLowerCase()) ||
      (f.username && f.username.toLowerCase().includes(friendFilter.toLowerCase())) ||
      (f.email && f.email.toLowerCase().includes(friendFilter.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-[#161512] border-[#2e2a24] text-[#e3ded7] flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <DialogHeader className="px-5 py-4 border-b border-[#262421] bg-[#1a1815] text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#262421] border border-[#d4af37]/40 flex items-center justify-center shadow-inner">
              <Crown className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm font-bold text-white tracking-wide font-serif">
                  Alliances & Friends
                </DialogTitle>
                {incomingCount > 0 && (
                  <Badge variant="gold" className="text-[10px] animate-pulse">
                    {incomingCount} New
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-[11px] text-[#8a857d]">
                Challenge allies and forge treaties on the Ashtāpada
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as TabType)}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="p-3 border-b border-[#262421] bg-[#12110e]">
            <TabsList className="grid grid-cols-3 w-full bg-[#1a1815] border border-[#2c2823] p-1">
              <TabsTrigger value="friends" className="gap-2 data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]">
                <Users className="w-3.5 h-3.5" />
                <span>Allies ({friendsCount})</span>
              </TabsTrigger>

              <TabsTrigger value="requests" className="gap-2 data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]">
                <Mail className="w-3.5 h-3.5" />
                <span>Requests{incomingCount > 0 ? ` (${incomingCount})` : ''}</span>
                {incomingCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </TabsTrigger>

              <TabsTrigger value="add" className="gap-2 data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Find Players</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content Body with ScrollArea */}
          <ScrollArea className="flex-1 max-h-[55vh]">
            <div className="p-4 text-xs">
              <AlliesTabContent
                friends={friends}
                filteredFriends={filteredFriends}
                friendFilter={friendFilter}
                setFriendFilter={setFriendFilter}
                isLoading={isLoading}
                processingId={processingId}
                onChallengeFriend={onChallengeFriend}
                onClose={onClose}
                onRemoveFriend={handleRemoveFriend}
                onNavigateToAdd={() => setActiveTab('add')}
              />

              <TreatiesTabContent
                incomingRequests={incomingRequests}
                outgoingRequests={outgoingRequests}
                processingId={processingId}
                onAcceptRequest={handleAcceptRequest}
                onRejectRequest={handleRejectRequest}
              />

              <FindPlayersTabContent
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
                isSearching={isSearching}
                processingId={processingId}
                onSendRequest={handleSendRequest}
                onAcceptRequest={handleAcceptRequest}
              />
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
