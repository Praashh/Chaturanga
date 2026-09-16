import React, { useState } from 'react';
import { X, Shield, BookOpen, Award, CheckCircle2 } from 'lucide-react';
import { PieceIcon } from './PieceIcon';
import type { PieceType } from '../types/game';
import { PIECE_NAMES } from '../types/game';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pieces' | 'rules' | 'victory'>('pieces');

  if (!isOpen) return null;

  const piecesList: PieceType[] = ['raja', 'mantri', 'gaja', 'ashva', 'ratha', 'padati'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-xl bg-[#1a1815] border border-[#262421] shadow-2xl flex flex-col text-[#e3ded7]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#262421] bg-[#161512]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#262421] border border-[#3a352f] flex items-center justify-center text-sm">
              📖
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#ffffff] tracking-wide">
                Chaturanga Piece Guide & Rules
              </h2>
              <p className="text-[11px] text-[#8a857d]">
                The ancient 6th-century ancestor of Chess (Ashtāpada rules)
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

        {/* Tab Switcher matching the GamePanel style */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-[#262421] bg-[#1a1815] text-xs">
          <button
            onClick={() => setActiveTab('pieces')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'pieces'
                ? 'bg-[#1d4ed8] text-white font-medium shadow-sm'
                : 'hover:bg-[#262421] text-[#b5b0a8]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Piece Movements</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'rules'
                ? 'bg-[#1d4ed8] text-white font-medium shadow-sm'
                : 'hover:bg-[#262421] text-[#b5b0a8]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Key Differences</span>
          </button>

          <button
            onClick={() => setActiveTab('victory')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'victory'
                ? 'bg-[#1d4ed8] text-white font-medium shadow-sm'
                : 'hover:bg-[#262421] text-[#b5b0a8]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Victory Conditions</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* TAB 1: PIECES */}
          {activeTab === 'pieces' && (
            <div className="space-y-3">
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
                          <span className="font-semibold text-[#ffffff] text-xs">
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
            </div>
          )}

          {/* TAB 2: RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#201e1b] border border-[#2c2823]">
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
                      <strong className="text-white">No Initial 2-Step Pawn Advance:</strong> Pawns (Padati) always move forward 1 step. As a result, <em className="text-white">en passant</em> does not exist.
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
            </div>
          )}

          {/* TAB 3: VICTORY */}
          {activeTab === 'victory' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-[#201e1b] border border-[#2c2823]">
                <div className="font-semibold text-white mb-1">1. Checkmate</div>
                <p className="text-[#b5b0a8] leading-relaxed">
                  When the opposing Raja is attacked and cannot escape through movement, interception, or capture of the attacking piece.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#201e1b] border border-[#2c2823]">
                <div className="font-semibold text-white mb-1">2. Bare King (Borah)</div>
                <p className="text-[#b5b0a8] leading-relaxed">
                  In classical Indian rules, if you capture all of your opponent&apos;s army pieces so that only their solitary Raja remains, you immediately win the battle.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#201e1b] border border-[#2c2823]">
                <div className="font-semibold text-white mb-1">3. Stalemate</div>
                <p className="text-[#b5b0a8] leading-relaxed">
                  If the opponent has no legal moves and is not in check, classical rules award victory to the player who enclosed them.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-[#262421] bg-[#161512]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1d4ed8] hover:bg-[#2563eb] text-white font-medium text-xs transition-colors shadow"
          >
            Got it, return to game
          </button>
        </div>
      </div>
    </div>
  );
};
