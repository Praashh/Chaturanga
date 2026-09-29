import React from 'react';
import { RulesModal } from './RulesModal';
import { FriendsModal } from './FriendsModal';
import { LobbyModal } from './LobbyModal';
import { GameHistoryModal } from './GameHistoryModal';
import type { GameMode, AIDifficulty, PieceColor, Move } from '../types/game';
import type { FriendUser } from '../types/friends';

interface AppModalsProps {
  isRulesOpen: boolean;
  onCloseRules: () => void;
  isFriendsOpen: boolean;
  onCloseFriends: () => void;
  isLobbyOpen: boolean;
  onCloseLobby: () => void;
  isHistoryOpen: boolean;
  onCloseHistory: () => void;
  isAuthenticated: boolean;
  userId?: string;
  mode: GameMode;
  aiDifficulty: AIDifficulty;
  onlineRoomId: string | null;
  onChallengeFriend?: (friend: FriendUser) => void;
  onSelectLocal: () => void;
  onSelectAI: (difficulty: AIDifficulty, color: PieceColor) => void;
  onSelectOnline: (roomId: string, playerName: string) => void;
  onFindMatch: () => void;
  onLoadGameForReview?: (moves: Move[]) => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  isRulesOpen,
  onCloseRules,
  isFriendsOpen,
  onCloseFriends,
  isLobbyOpen,
  onCloseLobby,
  isHistoryOpen,
  onCloseHistory,
  isAuthenticated,
  userId,
  mode,
  aiDifficulty,
  onlineRoomId,
  onChallengeFriend,
  onSelectLocal,
  onSelectAI,
  onSelectOnline,
  onFindMatch,
  onLoadGameForReview,
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
    <GameHistoryModal
      isOpen={isHistoryOpen}
      onClose={onCloseHistory}
      isAuthenticated={isAuthenticated}
      userId={userId}
      onLoadGameForReview={onLoadGameForReview}
      onFindMatch={onFindMatch}
      onPlayAI={() => onSelectAI('warrior', 'white')}
    />
  </>
);

