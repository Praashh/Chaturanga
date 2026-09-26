import React, { useState, useEffect, useRef } from 'react';
import { X, Swords, Timer, Bot, CheckCircle2, Zap, Crown, User as UserIcon } from 'lucide-react';

export interface MatchedOpponentData {
  roomId: string;
  color: 'white' | 'black';
  opponentName: string;
  opponentId?: string | null;
  opponentRating?: number;
  opponentPicture?: string | null;
}

interface MatchmakingModalProps {
  isOpen: boolean;
  onCancel: () => void;
  playerName: string;
  rating?: number;
  picture?: string | null;
  matchedOpponent?: MatchedOpponentData | null;
  onMatchComplete?: () => void;
  onPlayBot?: () => void;
  playGameStartSound?: () => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onCancel,
  playerName,
  rating = 1500,
  picture,
  matchedOpponent,
  onMatchComplete,
  onPlayBot,
  playGameStartSound,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [countdown, setCountdown] = useState(2);
  const soundPlayedRef = useRef(false);

  // Reset timer on open/close
  useEffect(() => {
    if (!isOpen) {
      setSeconds(0);
      setCountdown(2);
      soundPlayedRef.current = false;
      return;
    }

    if (matchedOpponent) return;

    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, matchedOpponent]);

  // Handle Match Found transition countdown and sound
  useEffect(() => {
    if (matchedOpponent && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      if (playGameStartSound) {
        playGameStartSound();
      }

      setCountdown(2);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimeout(() => {
              onMatchComplete?.();
            }, 300);
            return 0;
          }
          return prev - 1;
        });
      }, 900);

      return () => clearInterval(timer);
    }
  }, [matchedOpponent, playGameStartSound, onMatchComplete]);

  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Expanding Chess.com style rating bracket
  const bracket = Math.min(300, 40 + Math.floor(seconds / 3) * 30);
  const minRating = Math.max(100, rating - bracket);
  const maxRating = rating + bracket;
  const ratingSpreadPercent = Math.min(100, 25 + (seconds / 15) * 75);

  const isMatched = !!matchedOpponent;
  const myAssignedColor = matchedOpponent?.color ?? 'white';
  const opponentColor = myAssignedColor === 'white' ? 'black' : 'white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md rounded-2xl bg-[#181614] border border-[#302b24] shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-6 flex flex-col items-center text-center text-[#e3ded7] overflow-hidden">
        
        {/* Subtle decorative glowing background accent */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isMatched ? 'bg-emerald-500/20' : 'bg-[#d4af37]/15'
          }`}
        />

        {/* Close / Cancel corner button (only shown when searching) */}
        {!isMatched && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8a857d] hover:text-white hover:bg-[#262421] transition-colors"
            title="Cancel search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Top Game Format Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#24201b] border border-[#38332a] text-[11px] font-medium text-[#c4b9a9] tracking-wide mb-3">
          <span className="text-[#d4af37]">⚔️</span>
          <span>Chaturanga 1v1</span>
          <span className="text-[#686259]">•</span>
          <span className="text-amber-400/90 font-semibold">Classical Ashtāpada</span>
        </div>

        {/* ----------------- STATE 1: SEARCHING ----------------- */}
        {!isMatched ? (
          <>
            {/* Clean Matchmaking Radar Indicator */}
            <div className="relative w-24 h-24 flex items-center justify-center my-4">
              <div className="absolute inset-0 rounded-full border border-[#3e3527]" />
              <div className="absolute inset-3 rounded-full border border-[#d4af37]/30" />
              <div className="w-14 h-14 rounded-full bg-[#1e1b17] border border-[#d4af37]/60 flex items-center justify-center shadow-lg">
                <Swords className="w-6 h-6 text-[#d4af37]" />
              </div>
            </div>

            {/* Title & Status */}
            <h3 className="font-serif font-bold text-xl text-white tracking-wide mt-1">
              Finding Opponent...
            </h3>
            <p className="text-xs text-[#9c9589] mt-1 max-w-xs">
              Matching with a player of equal prowess across the realm.
            </p>

            {/* Expanding Dynamic Rating Bracket */}
            <div className="w-full mt-4 p-3 rounded-xl bg-[#201d18] border border-[#302a22]">
              <div className="flex items-center justify-between text-[11px] font-medium text-[#baa994] mb-1.5">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#d4af37]" />
                  <span>Target Range</span>
                </span>
                <span className="font-mono text-amber-300 font-semibold">
                  {minRating} – {maxRating}
                </span>
              </div>

              {/* Dynamic Range Bar */}
              <div className="w-full h-1.5 rounded-full bg-[#2a2620] overflow-hidden relative">
                <div
                  className="h-full bg-[#d4af37] rounded-full transition-all duration-700"
                  style={{ width: `${ratingSpreadPercent}%`, margin: '0 auto' }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#787268] mt-1.5 font-mono">
                <span>Min: {minRating}</span>
                <span className="text-[#a89f91]">Your Rating: {rating}</span>
                <span>Max: {maxRating}</span>
              </div>
            </div>

            {/* Elapsed Timer & Queue Info */}
            <div className="w-full mt-3 flex items-center justify-between px-2 text-xs text-[#8c8477]">
              <div className="flex items-center gap-1.5 font-mono text-[#fcd34d]">
                <Timer className="w-3.5 h-3.5" />
                <span className="font-semibold">{formatTime(seconds)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Queue Active (Avg: &lt;10s)</span>
              </div>
            </div>

            {/* Current Player Card Badge */}
            <div className="w-full mt-4 p-2.5 rounded-xl bg-[#221f1a] border border-[#2e2922] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full border border-[#d4af37]/40 bg-[#2b251d] overflow-hidden flex items-center justify-center text-sm shrink-0">
                  {picture ? (
                    <img src={picture} alt={playerName} className="w-full h-full object-cover" />
                  ) : (
                    <Crown className="w-5 h-5 text-[#fcd34d]" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white truncate max-w-[140px]">
                    {playerName}
                  </p>
                  <p className="text-[10px] text-[#918a80]">Rating: {rating}</p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[10px] font-mono text-[#fcd34d]">
                Searching
              </span>
            </div>

            {/* Option to Play AI if waiting */}
            {onPlayBot && (
              <button
                onClick={onPlayBot}
                className="w-full mt-3 py-2 px-3 rounded-xl bg-[#24201a] hover:bg-[#2e2920] border border-[#3a3328] hover:border-[#d4af37]/40 text-[#c8bfae] hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-amber-400" />
                <span>Don't want to wait? Play Computer</span>
              </button>
            )}

            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="w-full mt-3 py-2.5 rounded-xl bg-[#26221c] hover:bg-red-950/40 text-[#baa994] hover:text-red-300 border border-[#363026] hover:border-red-800/50 text-xs font-semibold transition-all duration-150 cursor-pointer shadow active:scale-98"
            >
              Cancel Search
            </button>
          </>
        ) : (
          /* ----------------- STATE 2: MATCH FOUND (CHESS.COM REVEAL) ----------------- */
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-200">
            {/* Top Match Found Banner */}
            <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs tracking-wider uppercase mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Match Found</span>
            </div>

            <h3 className="font-serif font-extrabold text-2xl text-white tracking-wide mb-1">
              Battle Commencing
            </h3>
            <p className="text-xs text-[#a39c90] mb-5">
              Opponent matched! Prepare your opening strategy.
            </p>

            {/* Side-by-Side VS Matchup Presentation */}
            <div className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#221e18] border border-[#383126] shadow-inner">
              {/* Left Side: You */}
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-2 border-amber-400/80 bg-[#2c261e] overflow-hidden flex items-center justify-center shadow-lg">
                    {picture ? (
                      <img src={picture} alt={playerName} className="w-full h-full object-cover" />
                    ) : (
                      <Crown className="w-7 h-7 text-[#fcd34d]" />
                    )}
                  </div>
                  {/* Assigned Color Badge */}
                  <span
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border border-black/40 flex items-center justify-center text-xs shadow ${
                      myAssignedColor === 'white' ? 'bg-[#f4efe6] text-black font-bold' : 'bg-[#181614] text-white font-bold'
                    }`}
                    title={myAssignedColor === 'white' ? 'Playing White (Moves First)' : 'Playing Black'}
                  >
                    {myAssignedColor === 'white' ? '⚪' : '⚫'}
                  </span>
                </div>
                <p className="text-xs font-bold text-white mt-2 truncate max-w-[100px]">
                  {playerName}
                </p>
                <p className="text-[10px] text-[#968f84] font-mono">Rating: {rating}</p>
                <span className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-[#2d271f] text-amber-300">
                  {myAssignedColor === 'white' ? 'White • 1st Move' : 'Black'}
                </span>
              </div>

              {/* Center: Classical VS Badge */}
              <div className="flex flex-col items-center justify-center px-1">
                <div className="w-8 h-8 rounded-full bg-[#2a241b] border border-[#d4af37]/50 flex items-center justify-center text-[#fcd34d] font-serif font-bold text-xs shadow-inner">
                  VS
                </div>
              </div>

              {/* Right Side: Opponent */}
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-2 border-[#544d41] bg-[#2a251e] overflow-hidden flex items-center justify-center shadow-lg">
                    {matchedOpponent.opponentPicture ? (
                      <img
                        src={matchedOpponent.opponentPicture}
                        alt={matchedOpponent.opponentName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-7 h-7 text-[#baa994]" />
                    )}
                  </div>
                  {/* Assigned Color Badge */}
                  <span
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border border-black/40 flex items-center justify-center text-xs shadow ${
                      opponentColor === 'white' ? 'bg-[#f4efe6] text-black font-bold' : 'bg-[#181614] text-white font-bold'
                    }`}
                    title={opponentColor === 'white' ? 'Playing White (Moves First)' : 'Playing Black'}
                  >
                    {opponentColor === 'white' ? '⚪' : '⚫'}
                  </span>
                </div>
                <p className="text-xs font-bold text-white mt-2 truncate max-w-[100px]">
                  {matchedOpponent.opponentName}
                </p>
                <p className="text-[10px] text-[#968f84] font-mono">
                  Rating: {matchedOpponent.opponentRating || 1500}
                </p>
                <span className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-[#2d271f] text-[#c2b7a7]">
                  {opponentColor === 'white' ? 'White • 1st Move' : 'Black'}
                </span>
              </div>
            </div>

            {/* Countdown / Arena Entry Progress Bar */}
            <div className="w-full mt-5">
              <div className="flex items-center justify-between text-xs text-[#aba396] mb-1.5">
                <span>Entering arena...</span>
                <span className="font-mono font-bold text-amber-400">{countdown}s</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#26211a] overflow-hidden p-0.5 border border-[#3b3428]">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(10, (3 - countdown) * 35)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
