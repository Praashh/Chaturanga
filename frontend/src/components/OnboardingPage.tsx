import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, X, Loader2, Sparkles, Swords, ShieldCheck, LogOut } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

interface OnboardingPageProps {
  onCompleted: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onCompleted }) => {
  const { user, token, completeOnboarding, logout } = useAuth();

  const [username, setUsername] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Generate smart suggestions based on user profile
  const suggestions = useMemo(() => {
    if (!user) return [];
    const baseName = (user.name || user.email.split('@')[0] || 'warrior')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 14);

    const emailPrefix = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 14);

    const list = [
      baseName,
      `${baseName}_in`,
      `${baseName}_7`,
      emailPrefix !== baseName ? emailPrefix : `raja_${baseName}`,
    ].filter((val, idx, arr) => val && arr.indexOf(val) === idx).slice(0, 4);

    return list;
  }, [user]);

  // Set initial default username suggestion
  useEffect(() => {
    if (user && !username) {
      const initial = user.username && user.username !== 'warrior'
        ? user.username
        : suggestions[0] || 'warrior';
      setUsername(initial);
    }
  }, [user, suggestions]);

  // Debounced live availability checker
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clean = username.trim().toLowerCase().replace(/^@/, '');

    if (!clean) {
      setIsChecking(false);
      setIsAvailable(null);
      setStatusMessage('');
      return;
    }

    if (clean.length < 3) {
      setIsChecking(false);
      setIsAvailable(false);
      setStatusMessage('Must be at least 3 characters');
      return;
    }

    if (clean.length > 20) {
      setIsChecking(false);
      setIsAvailable(false);
      setStatusMessage('Cannot exceed 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setIsChecking(false);
      setIsAvailable(false);
      setStatusMessage('Letters, numbers, and underscores only');
      return;
    }

    setIsChecking(true);
    setIsAvailable(null);
    setStatusMessage('Checking availability...');

    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/check-username?username=${encodeURIComponent(clean)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();

        if (data.available) {
          setIsAvailable(true);
          setStatusMessage('Username is available!');
        } else {
          setIsAvailable(false);
          setStatusMessage(data.error || 'This handle is already taken');
        }
      } catch {
        setIsAvailable(null);
        setStatusMessage('Error verifying username');
      } finally {
        setIsChecking(false);
      }
    }, 280);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [username, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean || !isAvailable || isChecking || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const res = await completeOnboarding(clean);
    if (res.success) {
      // Fire celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#fcd34d', '#ffffff', '#22c55e'],
        });
      } catch {
        // Ignore confetti error
      }

      setTimeout(() => {
        onCompleted();
      }, 500);
    } else {
      setSubmitError(res.error || 'Failed to assign username');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0c0a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.15),rgba(255,255,255,0))] flex flex-col items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Background Decorative Chess Board Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `repeating-conic-gradient(#fff 0% 25%, #000 0% 50%)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Main Container Card */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-3xl bg-[#171512]/95 border border-[#332e26] shadow-2xl backdrop-blur-xl p-7 sm:p-8 text-[#e3ded7] relative overflow-hidden">
          {/* Top golden accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-80" />

          {/* Badge */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#fcd34d] text-[11px] font-semibold tracking-wider uppercase">
              <Swords className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Ancient Ashtāpada Realm</span>
            </span>
          </div>

          {/* User Avatar + Welcome Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full border-2 border-[#d4af37] p-0.5 shadow-xl bg-[#26221c] mx-auto overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🥷</div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#1a1815] border border-[#d4af37] rounded-full p-1 text-[#fcd34d]" title="Verified Warrior">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Claim Your Warrior Handle
            </h1>
            <p className="text-xs text-[#a39c91] max-w-xs mx-auto leading-relaxed">
              Welcome, <span className="text-white font-medium">{user?.name}</span>. Choose a unique handle to step onto the 64-square battlefield.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username-input" className="block text-xs font-semibold uppercase tracking-wider text-[#b8b1a5]">
                Player Username
              </label>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-[#d4af37]">
                  @
                </span>
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="warrior_handle"
                  maxLength={20}
                  autoComplete="off"
                  spellCheck="false"
                  autoFocus
                  className="w-full pl-8 pr-10 py-3 rounded-xl bg-[#221f1a] border border-[#3b362c] text-white font-mono text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/50 transition-all placeholder:text-[#666055]"
                />

                {/* Right Status Indicator Icon */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {isChecking ? (
                    <Loader2 className="w-4 h-4 text-[#d4af37] animate-spin" />
                  ) : isAvailable === true ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : isAvailable === false ? (
                    <div className="w-5 h-5 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Status Message / Hint */}
              <div className="flex items-center justify-between text-[11px] px-1 min-h-[18px]">
                {statusMessage ? (
                  <span
                    className={
                      isAvailable === true
                        ? 'text-emerald-400 font-medium flex items-center gap-1'
                        : isAvailable === false
                        ? 'text-red-400 font-medium flex items-center gap-1'
                        : 'text-[#8a857d]'
                    }
                  >
                    {statusMessage}
                  </span>
                ) : (
                  <span className="text-[#8a857d]">3-20 characters (a-z, 0-9, _)</span>
                )}
                <span className="text-[#666055] font-mono">{username.replace(/^@/, '').length}/20</span>
              </div>
            </div>

            {/* Smart Suggestions Chips */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8a857d] block">
                  Suggestions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setUsername(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        username === s
                          ? 'bg-[#d4af37]/20 border border-[#d4af37] text-[#fcd34d] font-bold shadow-sm'
                          : 'bg-[#201e1a] border border-[#2e2a22] text-[#b5b0a6] hover:border-[#4d4538] hover:text-white'
                      }`}
                    >
                      @{s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Error */}
            {submitError && (
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs text-center font-medium">
                {submitError}
              </div>
            )}

            {/* Enter Realm Button */}
            <button
              type="submit"
              disabled={!isAvailable || isChecking || isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#fcd34d] to-[#c79a29] text-black font-bold text-sm tracking-wide shadow-lg shadow-[#d4af37]/15 hover:shadow-[#d4af37]/30 hover:brightness-105 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Entering the Realm...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Claim Handle & Enter the Realm</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Sign-out Option */}
          <div className="mt-6 pt-4 border-t border-[#262421] text-center">
            <button
              type="button"
              onClick={logout}
              className="text-[11px] text-[#8a857d] hover:text-red-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign out or use a different account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
