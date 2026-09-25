import React, { useState, useEffect } from 'react';
import { Users, Bot, Globe, Shuffle } from 'lucide-react';
import type { GameMode, AIDifficulty, PieceColor } from '../types/game';
import { generateRoomId } from '../utils/roomUrl';
import { useAuth } from '../context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface LobbyModalProps {
  isOpen: boolean;
  currentMode: GameMode;
  currentDifficulty: AIDifficulty;
  initialRoomId?: string | null;
  onClose: () => void;
  onSelectLocal: () => void;
  onSelectAI: (difficulty: AIDifficulty, playerColor: PieceColor) => void;
  onSelectOnline: (roomId: string, playerName: string) => void;
  onFindMatch?: () => void;
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
  onFindMatch,
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

  useEffect(() => {
    if (isOpen) {
      setSelectedTab(currentMode);
    }
  }, [isOpen, currentMode]);

  useEffect(() => {
    if (initialRoomId) {
      setRoomId(initialRoomId);
    }
  }, [initialRoomId]);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden bg-[#1a1815] border-[#262421] text-[#e3ded7] flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="px-5 py-3.5 border-b border-[#262421] bg-[#161512] text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#262421] border border-[#3a352f] flex items-center justify-center text-sm shadow-inner">
              ⚔️
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-white tracking-wide">
                Game Setup
              </DialogTitle>
              <DialogDescription className="text-[11px] text-[#8a857d]">
                Choose how you want to play Chaturanga
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Mode Tabs */}
        <Tabs
          value={selectedTab}
          onValueChange={v => setSelectedTab(v as GameMode)}
          className="flex-1 flex flex-col"
        >
          <div className="p-3 border-b border-[#262421] bg-[#1a1815]">
            <TabsList className="grid grid-cols-3 w-full bg-[#201e1b] border border-[#2c2823] p-1">
              <TabsTrigger value="pass_and_play" className="gap-1.5 data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]">
                <Users className="w-3.5 h-3.5" />
                <span>Pass & Play</span>
              </TabsTrigger>
              <TabsTrigger value="vs_ai" className="gap-1.5 data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]">
                <Bot className="w-3.5 h-3.5" />
                <span>Vs CPU</span>
              </TabsTrigger>
              <TabsTrigger value="online" className="gap-1.5 data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]">
                <Globe className="w-3.5 h-3.5" />
                <span>Online</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4 text-xs">
            {/* PASS AND PLAY */}
            <TabsContent value="pass_and_play" className="mt-0 space-y-3">
              <p className="text-[#b5b0a8] leading-relaxed">
                Take turns playing locally on the same device. White moves first, followed by Black.
              </p>
              <Button
                onClick={() => {
                  if (!isAuthenticated) {
                    promptGoogleSignIn();
                    return;
                  }
                  onSelectLocal();
                  onClose();
                }}
                variant="gold"
                className="w-full h-10 font-semibold"
              >
                Start Local Game
              </Button>
            </TabsContent>

            {/* VS AI */}
            <TabsContent value="vs_ai" className="mt-0 space-y-3.5">
              <div>
                <Label className="block text-[11px] text-[#8a857d] mb-1.5 font-medium">
                  Bot Strength
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['novice', 'warrior', 'senapati'] as AIDifficulty[]).map(diff => (
                    <Button
                      key={diff}
                      type="button"
                      variant={aiDiff === diff ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setAiDiff(diff)}
                      className={`capitalize h-8 text-xs ${
                        aiDiff === diff
                          ? 'bg-[#2a2418] text-[#fcd34d] border-[#d4af37]/50 font-semibold'
                          : 'bg-[#201e1b] border-[#2c2823] text-[#b5b0a8]'
                      }`}
                    >
                      {diff}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="block text-[11px] text-[#8a857d] mb-1.5 font-medium">
                  Your Pieces
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={aiColor === 'white' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setAiColor('white')}
                    className={`h-8 gap-2 text-xs ${
                      aiColor === 'white'
                        ? 'bg-[#2a2418] text-[#fcd34d] border-[#d4af37]/50 font-semibold'
                        : 'bg-[#201e1b] border-[#2c2823] text-[#b5b0a8]'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                    <span>White (First)</span>
                  </Button>

                  <Button
                    type="button"
                    variant={aiColor === 'black' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setAiColor('black')}
                    className={`h-8 gap-2 text-xs ${
                      aiColor === 'black'
                        ? 'bg-[#2a2418] text-[#fcd34d] border-[#d4af37]/50 font-semibold'
                        : 'bg-[#201e1b] border-[#2c2823] text-[#b5b0a8]'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-500" />
                    <span>Black</span>
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => {
                  if (!isAuthenticated) {
                    promptGoogleSignIn();
                    return;
                  }
                  onSelectAI(aiDiff, aiColor);
                  onClose();
                }}
                variant="gold"
                className="w-full h-10 font-semibold mt-2"
              >
                Play Against Bot
              </Button>
            </TabsContent>

            {/* ONLINE */}
            <TabsContent value="online" className="mt-0 space-y-3.5">
              {/* Quick Matchmaking Section */}
              <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#25221d] to-[#1e1c18] border border-[#3d372d] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <div>
                      <h4 className="text-xs font-semibold text-white">Quick Match</h4>
                      <p className="text-[10px] text-[#8a857d]">Automatically pair with any waiting player</p>
                    </div>
                  </div>
                  <Badge variant="emerald" className="font-medium text-[10px]">
                    1v1 Online
                  </Badge>
                </div>

                <Button
                  type="button"
                  variant="gold"
                  onClick={() => {
                    if (!isAuthenticated) {
                      promptGoogleSignIn();
                      return;
                    }
                    if (onFindMatch) {
                      onClose();
                      onFindMatch();
                    }
                  }}
                  className="w-full h-10 font-bold"
                >
                  <span>⚡</span>
                  <span>Find Match Now</span>
                </Button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-0.5">
                <Separator className="flex-1 bg-[#262421]" />
                <span className="text-[10px] font-semibold text-[#635f58] tracking-wider uppercase">or custom room</span>
                <Separator className="flex-1 bg-[#262421]" />
              </div>

              {/* Custom Private Room Section */}
              <div className="space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-[11px] text-[#8a857d] font-medium">
                      Room Code
                    </Label>
                    <button
                      type="button"
                      onClick={() => setRoomId(generateRoomId())}
                      className="flex items-center gap-1 text-[10px] text-[#d4af37] hover:text-[#fcd34d] transition-colors cursor-pointer"
                      title="Generate unique room code"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>Roll Random</span>
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value)}
                    className="font-mono"
                    placeholder="e.g. royal-chaturanga"
                  />
                </div>

                <div>
                  <Label className="block text-[11px] text-[#8a857d] mb-1 font-medium">
                    Your Display Name
                  </Label>
                  <Input
                    type="text"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="e.g. jaunty-player"
                  />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!isAuthenticated) {
                      promptGoogleSignIn();
                      return;
                    }
                    onSelectOnline(roomId, playerName);
                    onClose();
                  }}
                  className="w-full h-9 font-semibold border border-[#3a352f] hover:bg-[#322e29] mt-1"
                >
                  Join Private Room
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
