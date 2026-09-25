import React from 'react';
import { Shield, BookOpen, Award, CheckCircle2 } from 'lucide-react';
import { PieceIcon } from './PieceIcon';
import type { PieceType } from '../types/game';
import { PIECE_NAMES } from '../types/game';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const piecesList: PieceType[] = ['raja', 'mantri', 'gaja', 'ashva', 'ratha', 'padati'];

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] p-0 gap-0 overflow-hidden bg-[#1a1815] border-[#262421] text-[#e3ded7] flex flex-col">
        {/* Modal Top Header */}
        <DialogHeader className="px-5 py-3.5 border-b border-[#262421] bg-[#161512] text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#262421] border border-[#3a352f] flex items-center justify-center text-sm shadow-inner">
              📖
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-white tracking-wide">
                Chaturanga Piece Guide & Rules
              </DialogTitle>
              <DialogDescription className="text-[11px] text-[#8a857d]">
                The ancient 6th-century ancestor of Chess (Ashtāpada rules)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="pieces" className="flex-1 flex flex-col min-h-0">
          {/* Tab Switcher */}
          <div className="px-5 py-2.5 border-b border-[#262421] bg-[#1a1815]">
            <TabsList className="grid grid-cols-3 w-full bg-[#201e1b] border border-[#2c2823] p-1">
              <TabsTrigger value="pieces" className="gap-2 data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]">
                <Shield className="w-3.5 h-3.5" />
                <span>Piece Movements</span>
              </TabsTrigger>
              <TabsTrigger value="rules" className="gap-2 data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Key Differences</span>
              </TabsTrigger>
              <TabsTrigger value="victory" className="gap-2 data-[state=active]:bg-[#2a2418] data-[state=active]:text-[#fcd34d]">
                <Award className="w-3.5 h-3.5" />
                <span>Victory Conditions</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Modal Content Body with ScrollArea */}
          <ScrollArea className="flex-1 max-h-[58vh]">
            <div className="p-5 text-xs">
              {/* TAB 1: PIECES */}
              <TabsContent value="pieces" className="mt-0 space-y-3">
                <div className="text-[11px] text-[#8a857d]">
                  The four classical limbs of the Indian military: Infantry (Padāti), Cavalry (Ashva), Elephantry (Gaja), and Chariotry (Ratha), commanded by the King and his Minister.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {piecesList.map((type, idx) => {
                    const info = PIECE_NAMES[type];
                    const isLightSquare = idx % 2 === 0;

                    return (
                      <div
                        key={type}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-[#201e1b] border border-[#2c2823] hover:border-[#3d3832] transition-colors"
                      >
                        {/* Chess Tile Piece Container */}
                        <div
                          className={`w-12 h-12 rounded flex items-center justify-center shrink-0 shadow-inner border border-[#3a352f]/40 ${
                            isLightSquare ? 'bg-[#ebd3aa]' : 'bg-[#b58863]'
                          }`}
                        >
                          <PieceIcon type={type} color="white" size={38} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-xs">
                              {info.english}
                            </span>
                            <span className="text-[10px] font-serif text-[#d4af37]">
                              {info.sanskrit.split(' ')[0]}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#b5b0a8] mt-0.5 leading-snug">
                            {info.meaning}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* TAB 2: RULES */}
              <TabsContent value="rules" className="mt-0 space-y-3">
                <div className="p-3.5 rounded-lg bg-[#201e1b] border border-[#2c2823]">
                  <h3 className="font-semibold text-white mb-2 text-xs">
                    How Chaturanga Differs from Modern Chess:
                  </h3>
                  <div className="space-y-2 text-[#b5b0a8] leading-relaxed">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Gaja (Elephant) Leaps 2 Squares:</strong> Moves exactly 2 squares diagonally, leaping over any intervening piece (friendly or enemy).
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Mantri (Counselor):</strong> Moves only 1 square diagonally. (No all-powerful Queen).
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">No Initial 2-Step Pawn Advance:</strong> Pawns (Padāti) always move forward 1 step. As a result, <em className="text-white">en passant</em> does not exist.
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">No Castling:</strong> Castling was invented much later in European chess history.
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Promotion:</strong> A pawn reaching the opposite 8th rank promotes into a <strong className="text-white">Mantri</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: VICTORY */}
              <TabsContent value="victory" className="mt-0 space-y-2.5">
                <div className="p-3.5 rounded-lg bg-[#201e1b] border border-[#2c2823]">
                  <div className="font-semibold text-white mb-1">1. Checkmate</div>
                  <p className="text-[#b5b0a8] leading-relaxed">
                    When the opposing Raja is attacked and cannot escape through movement, interception, or capture of the attacking piece.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#201e1b] border border-[#2c2823]">
                  <div className="font-semibold text-white mb-1">2. Bare King (Borah)</div>
                  <p className="text-[#b5b0a8] leading-relaxed">
                    In classical Indian rules, if you capture all of your opponent&apos;s army pieces so that only their solitary Raja remains, you immediately win the battle.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#201e1b] border border-[#2c2823]">
                  <div className="font-semibold text-white mb-1">3. Stalemate</div>
                  <p className="text-[#b5b0a8] leading-relaxed">
                    If the opponent has no legal moves and is not in check, classical rules award victory to the player who enclosed them.
                  </p>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Modal Bottom Footer */}
        <DialogFooter className="px-5 py-3 border-t border-[#262421] bg-[#161512] sm:justify-end">
          <Button
            onClick={onClose}
            variant="gold"
            size="sm"
          >
            Got it, return to battle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
