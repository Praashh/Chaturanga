import React, { useEffect, useState } from 'react';
import { Crown, ShieldAlert, Sparkles, Flower2 } from 'lucide-react';
import type { PieceColor, GameStatus } from '../types/game';

interface SanskritCombatBannerProps {
  inCheck: PieceColor | null;
  status: GameStatus;
  lastMoveIsPromotion?: boolean;
}

export const SanskritCombatBanner: React.FC<SanskritCombatBannerProps> = ({
  inCheck,
  status,
  lastMoveIsPromotion,
}) => {
  const [activeBanner, setActiveBanner] = useState<{
    sanskrit: string;
    transliteration: string;
    english: string;
    icon: React.ReactNode;
    colorTheme: 'gold' | 'amber' | 'emerald';
  } | null>(null);

  // Monitor game state changes for key milestones only (No routine move toasts)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (status.type === 'checkmate') {
      setActiveBanner({
        sanskrit: 'राजा-भङ्ग!',
        transliteration: 'RĀJA-BHANGA',
        english: `${status.winner === 'white' ? 'White' : 'Black'} Wins by Checkmate`,
        icon: <Crown className="w-4 h-4 text-amber-300" />,
        colorTheme: 'gold',
      });
      timer = setTimeout(() => setActiveBanner(null), 5000);
    } else if (status.type === 'bare_king') {
      setActiveBanner({
        sanskrit: 'निरासेन विजय!',
        transliteration: 'NIRASENA VIJAYA',
        english: 'Victory by Bare King (Borah)',
        icon: <Sparkles className="w-4 h-4 text-amber-300 animate-spin [animation-duration:3s]" />,
        colorTheme: 'gold',
      });
      timer = setTimeout(() => setActiveBanner(null), 5000);
    } else if (lastMoveIsPromotion) {
      setActiveBanner({
        sanskrit: 'मन्त्री-अभिषेक!',
        transliteration: 'MANTRI-ABHISHEKA',
        english: 'Foot Soldier Promoted to Mantri',
        icon: <Flower2 className="w-4 h-4 text-emerald-300 animate-pulse" />,
        colorTheme: 'emerald',
      });
      timer = setTimeout(() => setActiveBanner(null), 3000);
    } else if (inCheck && status.type === 'active') {
      setActiveBanner({
        sanskrit: 'निरुद्ध!',
        transliteration: 'NIRUDDHA',
        english: `${inCheck === 'white' ? 'White' : 'Black'} Raja in Check`,
        icon: <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />,
        colorTheme: 'amber',
      });
      timer = setTimeout(() => setActiveBanner(null), 2500);
    } else {
      setActiveBanner(null);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [inCheck, status, lastMoveIsPromotion]);

  if (!activeBanner) return null;

  const themeClasses = {
    gold: {
      bg: 'bg-gradient-to-r from-[#2a1d07]/95 via-[#3f2c0b]/95 to-[#2a1d07]/95',
      border: 'border-[#d4af37]',
      glow: 'shadow-[0_4px_20px_rgba(212,175,55,0.4)]',
      accent: 'text-[#fcd34d]',
    },
    amber: {
      bg: 'bg-gradient-to-r from-[#2e1505]/95 via-[#4a2408]/95 to-[#2e1505]/95',
      border: 'border-amber-500',
      glow: 'shadow-[0_4px_18px_rgba(245,158,11,0.35)]',
      accent: 'text-amber-300',
    },
    emerald: {
      bg: 'bg-gradient-to-r from-[#072414]/95 via-[#0e3b21]/95 to-[#072414]/95',
      border: 'border-emerald-500',
      glow: 'shadow-[0_4px_18px_rgba(16,185,129,0.35)]',
      accent: 'text-emerald-300',
    },
  }[activeBanner.colorTheme];

  return (
    <div className="w-full flex justify-center py-1 select-none pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200">
      <div
        className={`px-3 py-1 rounded-full border backdrop-blur-md flex items-center justify-center gap-2 ${themeClasses.bg} ${themeClasses.border} ${themeClasses.glow}`}
      >
        <div className="shrink-0">{activeBanner.icon}</div>
        <div className="flex items-center gap-1.5 font-serif font-black text-xs sm:text-sm text-white tracking-wide">
          <span>{activeBanner.sanskrit}</span>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#d4af37] uppercase opacity-90">
            • {activeBanner.transliteration}
          </span>
        </div>
        <span className="text-[11px] text-[#e3ded7] font-medium hidden sm:inline">
          — {activeBanner.english}
        </span>
      </div>
    </div>
  );
};

