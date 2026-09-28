import React from 'react';
import { RulesModal } from './RulesModal';
import { FriendsModal } from './FriendsModal';
import { LobbyModal } from './LobbyModal';
import type { GameMode, AIDifficulty, PieceColor } from '../types/game';
import type { FriendUser } from '../types/friends';

interface AppModalsProps {
  isRulesOpen: boolean;
  onCloseRules: () => void;
  isFriendsOpen: boolean;
  onCloseFriends: () => void;
  isLobbyOpen: boolean;
  onCloseLobby: () => void;
  mode: GameMode;
  aiDifficulty: AIDifficulty;
  onlineRoomId: string | null;
  onChallengeFriend?: (friend: FriendUser) => void;
  onSelectLocal: () => void;
  onSelectAI: (difficulty: AIDifficulty, color: PieceColor) => void;
  onSelectOnline: (roomId: string, playerName: string) => void;
  onFindMatch: () => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  isRulesOpen,
  onCloseRules,
  isFriendsOpen,
  onCloseFriends,
  isLobbyOpen,
  onCloseLobby,
  mode,
  aiDifficulty,
  onlineRoomId,
  onChallengeFriend,
  onSelectLocal,
  onSelectAI,
  onSelectOnline,
  onFindMatch,
}) => (
  <>
    <RulesModal isOpen={isRulesOpen} onClose={onCloseRules} />
    <FriendsModal
      isOpen={isFriendsOpen}
      onClose={onCloseFriends}
      onChallengeFriend={onChallengeFriend}
    />
    <LobbyModal
      isOpen={isLobbyOpen}
      currentMode={mode}
      currentDifficulty={aiDifficulty}
      initialRoomId={onlineRoomId}
      onClose={onCloseLobby}
      onSelectLocal={onSelectLocal}
      onSelectAI={onSelectAI}
      onSelectOnline={onSelectOnline}
      onFindMatch={onFindMatch}
    />
  </>
);
