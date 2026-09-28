import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, X, Loader2, Sparkles, Swords, ShieldCheck, LogOut } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';

const API_BASE = (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');

interface WarriorAvatarHeaderProps {
  user: {
    picture?: string | null;
    name?: string;
  } | null;
}

const WarriorAvatarHeader: React.FC<WarriorAvatarHeaderProps> = ({ user }) => (
  <div className="text-center space-y-2 mb-6">
    <div className="relative inline-block">
      <Avatar className="w-20 h-20 border-2 border-[#d4af37] p-0.5 shadow-xl bg-[#26221c] mx-auto">
        {user?.picture && <AvatarImage src={user.picture} alt={user.name} />}
        <AvatarFallback className="bg-[#26221c] text-3xl font-serif text-[#d4af37]">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
        </AvatarFallback>
      </Avatar>
      <div className="absolute -bottom-1 -right-1 bg-[#1a1815] border border-[#d4af37] rounded-full p-1 text-[#fcd34d]" title="Verified Warrior">
        <ShieldCheck className="w-4 h-4" />
      </div>
    </div>

    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif">
      Claim Your Warrior Handle
    </h1>
    <p className="text-xs text-[#a39c91] max-w-xs mx-auto leading-relaxed">
      Welcome, <span className="text-white font-medium">{user?.name}</span>. Choose a unique handle to step onto the 64-square battlefield.
    </p>
  </div>
);

interface UsernameStatusIndicatorProps {
  isChecking: boolean;
  isAvailable: boolean | null;
}

const UsernameStatusIndicator: React.FC<UsernameStatusIndicatorProps> = ({ isChecking, isAvailable }) => {
  if (isChecking) {
    return <Loader2 className="w-4 h-4 text-[#d4af37] animate-spin" />;
  }
  if (isAvailable === true) {
    return (
      <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
        <Check className="w-3.5 h-3.5" />
      </div>
    );
  }
  if (isAvailable === false) {
    return (
      <div className="w-5 h-5 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400">
        <X className="w-3.5 h-3.5" />
      </div>
    );
  }
  return null;
};

interface UsernameSuggestionsChipsProps {
  suggestions: string[];
  current: string;
  onSelect: (val: string) => void;
}

const UsernameSuggestionsChips: React.FC<UsernameSuggestionsChipsProps> = ({
  suggestions,
  current,
  onSelect,
}) => {
  if (suggestions.length === 0) return null;
  return (
    <div className="space-y-1.5 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8a857d] block">
        Suggestions
      </span>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map(s => (
          <button
            type="button"
            key={s}
            onClick={() => onSelect(s)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${current === s
              ? 'bg-[#d4af37]/20 border border-[#d4af37] text-[#fcd34d] font-bold shadow-sm'
              : 'bg-[#201e1a] border border-[#2e2a22] text-[#b5b0a6] hover:border-[#4d4538] hover:text-white'
              }`}
          >
            @{s}
          </button>
        ))}
      </div>
    </div>
  );
};

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

    const randomNum1 = Math.floor(10 + Math.random() * 89);
    const randomNum2 = Math.floor(100 + Math.random() * 899);

    return [
      baseName,
      `${baseName}_${randomNum1}`,
      `${baseName}${randomNum2}`,
      `raja_${baseName}`.slice(0, 18),
      `senapati_${baseName}`.slice(0, 20),
    ];
  }, [user]);

  // Set initial suggestion
  useEffect(() => {
    if (user && !username) {
      const initial = user.username && user.username !== 'warrior'
        ? user.username
        : suggestions[0] || 'warrior';
      setUsername(initial);
    }
  }, [user, username, suggestions]);

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

    const controller = new AbortController();

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/check-username?username=${encodeURIComponent(clean)}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.available) {
          setIsAvailable(true);
          setStatusMessage('Username is available!');
        } else {
          setIsAvailable(false);
          setStatusMessage(data.error || 'This handle is already taken');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setIsAvailable(null);
          setStatusMessage('Error verifying username');
        }
      } finally {
        setIsChecking(false);
      }
    }, 280);

    return () => {
      controller.abort();
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

    try {
      const res = await completeOnboarding(clean);
      if (res.success) {
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
      }
    } finally {
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
        <Card className="rounded-3xl bg-[#171512]/95 border-[#332e26] shadow-2xl backdrop-blur-xl p-7 sm:p-8 text-[#e3ded7] relative overflow-hidden">
          {/* Top golden accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-80" />

          {/* Badge */}
          <div className="flex justify-center mb-4">
            <Badge variant="gold" className="gap-1.5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
              <Swords className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Ancient Ashtāpada Realm</span>
            </Badge>
          </div>

          <WarriorAvatarHeader user={user} />

          {/* Form */}
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username-input" className="block text-xs font-semibold uppercase tracking-wider text-[#b8b1a5]">
                  Player Username
                </Label>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-[#d4af37]">
                    @
                  </span>
                  <Input
                    id="username-input"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="warrior_handle"
                    maxLength={20}
                    autoComplete="off"
                    spellCheck="false"
                    autoFocus
                    className="pl-8 pr-10 py-3 h-11 font-mono text-sm bg-[#221f1a] border-[#3b362c]"
                  />

                  {/* Right Status Indicator Icon */}
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <UsernameStatusIndicator isChecking={isChecking} isAvailable={isAvailable} />
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

              <UsernameSuggestionsChips
                suggestions={suggestions}
                current={username}
                onSelect={setUsername}
              />

              {/* Submit Error */}
              {submitError && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs text-center font-medium">
                  {submitError}
                </div>
              )}

              {/* Enter Realm Button */}
              <Button
                type="submit"
                variant="gold"
                size="lg"
                disabled={!isAvailable || isChecking || isSubmitting}
                className="w-full h-12 text-sm tracking-wide gap-2 mt-2"
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
              </Button>
            </form>
          </CardContent>

          {/* Footer Sign-out Option */}
          <Separator className="mt-6 mb-4 bg-[#262421]" />
          <div className="text-center">
            <button
              type="button"
              onClick={logout}
              className="text-[11px] text-[#8a857d] hover:text-red-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out or use a different account</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
