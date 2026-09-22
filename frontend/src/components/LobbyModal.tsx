import React, { useState, useEffect } from 'react';
import { X, Users, Bot, Globe, Shuffle } from 'lucide-react';
import type { GameMode, AIDifficulty, PieceColor } from '../types/game';
import { generateRoomId } from '../utils/roomUrl';
import { useAuth } from '../context/AuthContext';

interface LobbyModalProps {
  isOpen: boolean;
  currentMode: GameMode;
  currentDifficulty: AIDifficulty;
  initialRoomId?: string | null;
  onClose: () => void;
  onSelectLocal: () => void;
  onSelectAI: (difficulty: AIDifficulty, playerColor: PieceColor) => void;
  onSelectOnline: (roomId: string, playerName: string) => void;
}

export const LobbyModal: React.FC<LobbyModalProps> = ({
  isOpen,
  currentMode,
  currentDifficulty,
  initialRoomId,
  onClose,
  onSelectLocal,
  onSelectAI,
  onSelectOnline,
}) => {
  const { user, isAuthenticated, promptGoogleSignIn } = useAuth();
  const [selectedTab, setSelectedTab] = useState<GameMode>(currentMode);
  const [aiDiff, setAiDiff] = useState<AIDifficulty>(currentDifficulty);
  const [aiColor, setAiColor] = useState<PieceColor>('white');
  const [roomId, setRoomId] = useState<string>(() => initialRoomId || generateRoomId());
  const [playerName, setPlayerName] = useState<string>(() => user?.name || 'Player');

  useEffect(() => {
    if (user?.name) {
      setPlayerName(user.name);
    }
  }, [user?.name]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-[#1a1815] border border-[#262421] shadow-2xl flex flex-col text-[#e3ded7]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#262421] bg-[#161512]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#262421] border border-[#3a352f] flex items-center justify-center text-sm">
              ⚔️
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#ffffff] tracking-wide">
                Game Setup
              </h2>
              <p className="text-[11px] text-[#8a857d]">
                Choose how you want to play Chaturanga
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#262421] text-[#8a857d] hover:text-[#ffffff] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-3 border-b border-[#262421] bg-[#1a1815] text-xs">
          <button
            onClick={() => setSelectedTab('pass_and_play')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition-colors ${selectedTab === 'pass_and_play'
                ? 'bg-[#1d4ed8] text-white font-medium shadow-sm'
                : 'hover:bg-[#262421] text-[#b5b0a8]'
              }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pass & Play</span>
          </button>

          <button
            onClick={() => setSelectedTab('vs_ai')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition-colors ${selectedTab === 'vs_ai'
                ? 'bg-[#1d4ed8] text-white font-medium shadow-sm'
                : 'hover:bg-[#262421] text-[#b5b0a8]'
              }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Vs CPU</span>
          </button>

          <button
            onClick={() => setSelectedTab('online')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition-colors ${selectedTab === 'online'
                ? 'bg-[#1d4ed8] text-white font-medium shadow-sm'
                : 'hover:bg-[#262421] text-[#b5b0a8]'
              }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Online</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {selectedTab === 'pass_and_play' && (
            <div className="space-y-3">
              <p className="text-[#b5b0a8] leading-relaxed">
                Take turns playing locally on the same device. White moves first, followed by Black.
              </p>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    promptGoogleSignIn();
                    return;
                  }
                  onSelectLocal();
                  onClose();
                }}
                className="w-full py-2.5 rounded-lg bg-[#1d4ed8] hover:bg-[#2563eb] text-white font-semibold transition-colors shadow"
              >
                Start Local Game
              </button>
            </div>
          )}

          {selectedTab === 'vs_ai' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] text-[#8a857d] mb-1.5 font-medium">
                  Bot Strength
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['novice', 'warrior', 'senapati'] as AIDifficulty[]).map(diff => (
                    <button
                      key={diff}
                      onClick={() => setAiDiff(diff)}
                      className={`py-1.5 px-2 rounded-md border text-xs capitalize transition-colors ${aiDiff === diff
                          ? 'bg-[#262421] border-[#1d4ed8] text-white font-medium'
                          : 'bg-[#201e1b] border-[#2c2823] text-[#b5b0a8]'
                        }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#8a857d] mb-1.5 font-medium">
                  Your Pieces
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAiColor('white')}
                    className={`py-1.5 px-3 rounded-md border text-xs flex items-center justify-center gap-2 transition-colors ${aiColor === 'white'
                        ? 'bg-[#262421] border-[#1d4ed8] text-white font-medium'
                        : 'bg-[#201e1b] border-[#2c2823] text-[#b5b0a8]'
                      }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span>White (First)</span>
                  </button>

                  <button
                    onClick={() => setAiColor('black')}
                    className={`py-1.5 px-3 rounded-md border text-xs flex items-center justify-center gap-2 transition-colors ${aiColor === 'black'
                        ? 'bg-[#262421] border-[#1d4ed8] text-white font-medium'
                        : 'bg-[#201e1b] border-[#2c2823] text-[#b5b0a8]'
                      }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-500" />
                    <span>Black</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    promptGoogleSignIn();
                    return;
                  }
                  onSelectAI(aiDiff, aiColor);
                  onClose();
                }}
                className="w-full py-2.5 rounded-lg bg-[#1d4ed8] hover:bg-[#2563eb] text-white font-semibold transition-colors shadow mt-2"
              >
                Play Against Bot
              </button>
            </div>
          )}

          {selectedTab === 'online' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-[#8a857d] font-medium">
                    Room Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setRoomId(generateRoomId())}
                    className="flex items-center gap-1 text-[10px] text-[#d4af37] hover:text-[#fcd34d] transition-colors"
                    title="Generate unique room code"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Roll Random</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-[#201e1b] border border-[#2c2823] text-white font-mono text-xs focus:outline-none focus:border-[#1d4ed8]"
                  placeholder="e.g. royal-chaturanga"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#8a857d] mb-1 font-medium">
                  Your Display Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-[#201e1b] border border-[#2c2823] text-white text-xs focus:outline-none focus:border-[#1d4ed8]"
                  placeholder="e.g. jaunty-player"
                />
              </div>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    promptGoogleSignIn();
                    return;
                  }
                  onSelectOnline(roomId, playerName);
                  onClose();
                }}
                className="w-full py-2.5 rounded-lg bg-[#1d4ed8] hover:bg-[#2563eb] text-white font-semibold transition-colors shadow mt-2"
              >
                Connect to Room
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
