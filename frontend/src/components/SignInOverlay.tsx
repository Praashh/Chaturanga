import React from 'react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { Card } from './ui/card';

interface SignInOverlayProps {
  onSignInClick: () => void;
}

export const SignInOverlay: React.FC<SignInOverlayProps> = ({ onSignInClick }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onSignInClick}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') onSignInClick();
    }}
    aria-label="Sign in to play backdrop"
    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/65 backdrop-blur-[2px] rounded cursor-pointer transition-opacity duration-300"
    title="Click to sign in with Google"
  >
    <Card
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#1c1a17]/95 border-[#3d3830] shadow-[0_20px_50px_rgba(0,0,0,0.85)] max-w-[280px] sm:max-w-[320px] animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="w-14 h-14 rounded-2xl bg-[#262421] border border-[#d4af37]/40 flex items-center justify-center p-2.5 shadow-inner mb-3">
        <img src="/logo.png" alt="Chaturanga Logo" className="w-full h-full object-contain" />
      </div>
      <h3 className="font-serif font-bold text-base sm:text-lg text-[#fcd34d] tracking-wide mb-1">
        Sign in to Play
      </h3>
      <p className="text-[11px] text-[#b5b0a8] mb-4 leading-relaxed">
        Sign in with Google to make moves, battle players, and track your rating.
      </p>
      <div className="w-full flex justify-center">
        <GoogleSignInButton
          type="standard"
          theme="filled_white"
          size="large"
          shape="pill"
          width={240}
        />
      </div>
    </Card>
  </div>
);
