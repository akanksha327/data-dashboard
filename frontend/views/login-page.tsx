'use client';

import React, { startTransition, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowRight, BarChart3, Eye, EyeOff, Moon, Sun } from 'lucide-react';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import {
  getAuthServerSnapshot,
  getAuthSnapshot,
  setAuth,
  subscribeToAuth,
} from '@/lib/auth';
import { useAppStore } from '@/lib/app-store';
import { cn } from '@/lib/utils';

type AuthView = 'login' | 'signup';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
});

const subscribeToHydration = () => () => {};

const accentByView: Record<AuthView, string> = {
  login: '#505081',
  signup: '#505081',
};

const transition = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>('login');
  const { initializeTheme, isDarkMode, toggleDarkMode } = useAppStore();
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const isAuthenticated = useSyncExternalStore(
    subscribeToAuth,
    getAuthSnapshot,
    getAuthServerSnapshot
  );

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace('/');
    }
  }, [hydrated, isAuthenticated, router]);

  const accent = accentByView[view];
  const authBackground = isDarkMode
    ? 'linear-gradient(135deg, #141318 0%, #1E1D23 45%, #2B2019 100%)'
    : '#F5F7FB';
  const overlayGradient = isDarkMode
    ? 'linear-gradient(120deg, rgba(255,255,255,0.08), rgba(255,255,255,0))'
    : 'none';

  if (!hydrated || isAuthenticated) {
    return (
      <div className={cn(manrope.className, 'grid h-screen w-screen place-items-center overflow-hidden bg-[#F5F7FB] dark:bg-[#141318]')}>
        <div
          className="h-9 w-9 rounded-full border-2 border-[#D9D4F6] border-t-transparent animate-spin"
          style={{ borderRightColor: accent, borderBottomColor: accent }}
        />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          manrope.className,
          'relative flex h-screen w-screen items-center justify-center overflow-hidden text-[#1C1C1C] dark:text-[#E8E6E1] lg:justify-end'
        )}
        style={{
          '--auth-accent': accent,
          background: authBackground,
        } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="pointer-events-auto absolute right-5 top-5 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-[#1F2937] shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-transparent dark:border-white/10 dark:bg-[#1E1D23]/85 dark:text-[#F8F7F4] dark:hover:bg-[#25242A]"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Background Visual Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Soft Depth Overlay */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              background: overlayGradient
            }}
          />

          {/* Extended Left Visual Area Container */}
          <div className="absolute left-0 top-0 h-full w-[50%] hidden lg:block overflow-hidden">
            {/* --- Spread Animated Elements --- */}

            {/* Top-Left Element: Floating Card */}
            <motion.div
              animate={{
                y: [0, -25, 0],
                x: [0, 15, 0],
                rotateX: [2, 6, 2],
                rotateY: [-4, -8, -4],
              }}
              transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
              className="absolute top-[15%] left-[10%] h-[120px] w-[180px] scale-[1.4] rounded-2xl border border-white/30 bg-white/20 p-4 shadow-[0_16px_32px_rgba(31,38,135,0.06)] backdrop-blur-md [perspective:1000px]"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="h-2 w-12 rounded-full bg-[#1C1C1C]/10" />
                <div className="h-4 w-4 rounded-full bg-white/50" />
              </div>
              <div className="mb-2 h-1.5 w-full rounded-full bg-white/40" />
              <div className="mb-4 h-1.5 w-4/5 rounded-full bg-white/40" />
              <div className="flex gap-1.5">
                <div className="h-8 w-full rounded-md bg-accent-purple/15" />
                <div className="h-8 w-full rounded-md bg-accent-slate/20" />
                <div className="h-8 w-full rounded-md bg-accent-purple/25" />
              </div>
            </motion.div>

            {/* Middle Element: Floating Card */}
            <motion.div
              animate={{
                y: [0, 30, 0],
                x: [0, -20, 0],
                rotateX: [-2, -6, -2],
                rotateY: [4, 8, 4],
              }}
              transition={{ duration: 14, ease: "easeInOut", repeat: Infinity, delay: 1 }}
              className="absolute top-[50%] left-[45%] h-[140px] w-[200px] scale-[1.4] rounded-2xl border border-white/30 bg-white/20 p-5 shadow-[0_16px_32px_rgba(31,38,135,0.06)] backdrop-blur-md [perspective:1000px] -translate-y-1/2 -translate-x-1/2"
            >
              <div className="flex items-center gap-3 mb-4">
                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/60 shadow-sm">
                   <div className="h-3 w-3 bg-accent-slate/50 rounded-sm" />
                 </div>
                 <div>
                   <div className="mb-1 h-2 w-16 rounded-full bg-[#1C1C1C]/20" />
                   <div className="h-1.5 w-10 rounded-full bg-[#1C1C1C]/10" />
                 </div>
              </div>
              <div className="flex items-end gap-2 h-14 w-full rounded-lg bg-white/20 p-2">
                <div className="w-full h-[40%] bg-accent-purple/30 rounded-t-sm" />
                <div className="w-full h-[70%] bg-accent-slate/40 rounded-t-sm" />
                <div className="w-full h-[50%] bg-accent-purple/50 rounded-t-sm" />
              </div>
            </motion.div>

          </div>

          {/* Faded Branding Overlaid */}
          <div className="absolute bottom-[6%] left-[6%] hidden lg:flex items-center gap-2.5 opacity-60 z-10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/60 shadow-sm ring-1 ring-black/5">
              <BarChart3 className="h-4 w-4" style={{ color: accent }} />
            </div>
            <span className="text-[14px] font-semibold tracking-tight text-[#1C1C1C] dark:text-[#E8E6E1]">DataLens</span>
          </div>
          </div>

        {/* Center / Right Login Form */}
        <div className="relative z-10 flex h-full w-full lg:w-[50%] items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[420px]"
          >
          {/* Logo on top for all screens now, since side branding is minimized */}
          <div className="mb-6 flex items-center justify-center gap-2.5 text-[#4B5563] dark:text-[#CFCBC3]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)] ring-1 ring-[#ECE8F5] dark:bg-[#25242A] dark:ring-white/10">
              <BarChart3 className="h-5 w-5" style={{ color: accent }} />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-semibold leading-tight text-[#1C1C1C] dark:text-[#F8F7F4]">DataLens</p>
              <p className="text-[11px] font-medium text-[#6B6B6B] dark:text-[#A1A1AA]">Turn data into clarity</p>
            </div>
          </div>

          <div className="rounded-[16px] border border-white/60 bg-[#ffffff] p-7 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-[#1E1D23] dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)] sm:p-8">
            <div>
              <h1 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-[#1C1C1C] dark:text-[#F8F7F4]">
                {view === 'login' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="mt-1.5 text-sm text-[#6B6B6B] dark:text-[#A1A1AA]">
                {view === 'login'
                  ? 'Use your DataLens workspace credentials.'
                  : 'Set up your DataLens workspace in a minute.'}
              </p>
            </div>

            <div className="mt-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={transition}
                >
                  {view === 'login' ? (
                    <LoginForm accent={accent} onSwitchToSignup={() => startTransition(() => setView('signup'))} />
                  ) : (
                    <SignupForm accent={accent} onSwitchToLogin={() => startTransition(() => setView('login'))} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}

function LoginForm({
  accent,
  onSwitchToSignup,
}: {
  accent: string;
  onSwitchToSignup: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }

    if (!password.trim()) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirection is now handled purely by AuthProvider!
    } catch (err: any) {
      console.error(err);
      setError('Invalid email or password.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-0">
        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
        />

        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          trailingAction={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="text-[#6B6B6B] hover:text-[#374151] dark:text-[#A1A1AA] dark:hover:text-[#E8E6E1]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <button type="button" className="text-[#6B6B6B] hover:text-[#374151] dark:text-[#A1A1AA] dark:hover:text-[#E8E6E1]">
          Forgot password?
        </button>
        <button type="button" onClick={onSwitchToSignup} className="font-medium hover:opacity-80" style={{ color: accent }}>
          Sign up
        </button>
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-[#B45376]">{error}</p> : null}

      <div className="mt-6">
        <SubmitButton accent={accent} loading={loading} label="Log in" loadingLabel="Signing in" />
      </div>
    </form>
  );
}

function SignupForm({
  accent,
  onSwitchToLogin,
}: {
  accent: string;
  onSwitchToLogin: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }

    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }

    if (!password.trim()) {
      setError('Create a password.');
      return;
    }

    if (password.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      localStorage.setItem('user_name', name);
      // Redirection is handled purely by AuthProvider!
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create account.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-0">
        <Field
          label="Name"
          value={name}
          onChange={setName}
          type="text"
          autoComplete="name"
          placeholder="Avery Morgan"
        />

        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
        />

        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Create a password"
          trailingAction={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="text-[#6B6B6B] hover:text-[#374151] dark:text-[#A1A1AA] dark:hover:text-[#E8E6E1]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <Field
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <p className="text-[#6B6B6B] dark:text-[#A1A1AA]">Already have an account?</p>
        <button type="button" onClick={onSwitchToLogin} className="font-medium hover:opacity-80" style={{ color: accent }}>
          Log in
        </button>
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-[#B45376]">{error}</p> : null}

      <div className="mt-6">
        <SubmitButton accent={accent} loading={loading} label="Create account" loadingLabel="Creating account" />
      </div>
    </form>
  );
}

function Field({
  autoComplete,
  label,
  onChange,
  placeholder,
  trailingAction,
  type,
  value,
}: {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  trailingAction?: React.ReactNode;
  type: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#1C1C1C] dark:text-[#F8F7F4]">{label}</span>
      <div className="relative">
        <input
          autoComplete={autoComplete}
          className="w-full box-border rounded-[10px] border border-[#ccc] bg-[#FAFAFA] px-[14px] py-[12px] text-sm text-[#1C1C1C] placeholder:text-[#9CA3AF] outline-none transition-[border-color,box-shadow] focus:border-accent-purple focus:shadow-[0_0_0_2px_rgba(80,80,129,0.15)] dark:border-white/10 dark:bg-[#25242A] dark:text-[#F8F7F4] dark:placeholder:text-[#6B7280] dark:focus:border-accent-purple dark:focus:bg-[#2C2B31]"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
          style={trailingAction ? { paddingRight: '40px' } : undefined}
        />
        {trailingAction ? (
          <div className="absolute right-[14px] top-1/2 -translate-y-1/2 flex items-center justify-center">
            {trailingAction}
          </div>
        ) : null}
      </div>
    </label>
  );
}

function SubmitButton({
  accent,
  label,
  loading,
  loadingLabel,
}: {
  accent: string;
  label: string;
  loading: boolean;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] text-sm font-semibold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 bg-[linear-gradient(135deg,#505081,#6B6BA8)] hover:bg-[linear-gradient(135deg,#3F3F66,#505081)]"
      style={{
        boxShadow: '0 4px 14px rgba(80, 80, 129, 0.25)',
      }}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-white/35 border-t-white animate-spin" />
          {loadingLabel}
        </span>
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
