"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  motion, AnimatePresence,
  useMotionValue, useSpring, useTransform,
} from 'framer-motion';
import {
  Plane, Mail, Lock, Eye, EyeOff, ArrowRight,
  Globe, Star, Sparkles, Shield, CheckCircle2, Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SocialLoginButtons from '@/components/SocialLoginButtons';
import DarkModeToggle from '@/components/DarkModeToggle';
import LoginHero from '@/components/LoginHero';
import { PROMPTS } from '@/constants/prompts';

// ─── Static data (avoids hydration mismatch) ────────────────────────────────


const STAT_CARDS = [
  {
    value: '100%', label: 'AI Powered', icon: Sparkles,
    cls: 'animate-card-float-1',
    pos: 'left-6 xl:left-12 top-[28%]',
    color: 'from-emerald-500/20 to-transparent',
    border: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    delay: 0.8,
  },
  {
    value: 'Global', label: 'Destinations', icon: Globe,
    cls: 'animate-card-float-2',
    pos: 'left-6 xl:left-12 bottom-[20%]',
    color: 'from-blue-500/20 to-transparent',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    delay: 1.1,
  },
  {
    value: 'Real-Time', label: 'Geocoding & Weather', icon: Shield,
    cls: 'animate-card-float-3',
    pos: 'right-6 xl:right-12 top-[32%]',
    color: 'from-amber-500/20 to-transparent',
    border: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    delay: 1.4,
  },
];


// ─── Main Page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { isAuthenticated, loading: authLoading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [error, setError]               = useState('');
  const [emailError, setEmailError]     = useState('');
  const [loading, setLoading]           = useState(false);
  const [focused, setFocused]           = useState<'email' | 'password' | null>(null);
  const [shimmer, setShimmer]           = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 35, damping: 18 });
  const springY = useSpring(mouseY, { stiffness: 35, damping: 18 });

  // Derived transforms for different parallax layers
  const blobX  = useTransform(springX, v => v * 0.4);
  const blobY  = useTransform(springY, v => v * 0.4);
  const globeX = useTransform(springX, v => v * -0.2);
  const globeY = useTransform(springY, v => v * -0.2);
  const cardX  = useTransform(springX, v => v * 0.06);
  const cardY  = useTransform(springY, v => v * 0.06);

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, authLoading, router]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(((clientX - left) / width  - 0.5) * 50);
    mouseY.set(((clientY - top)  / height - 0.5) * 40);
  };

  const validateEmail = (val: string) => {
    const r = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val)       { setEmailError('Email is required');                    return false; }
    if (!r.test(val)) { setEmailError('Please enter a valid email address'); return false; }
    setEmailError('');
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      let msg = 'Incorrect email or password. Please try again.';
      if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : err.response.data.detail[0]?.msg || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 border-2 border-border border-t-accent rounded-full animate-spin" />
          <p className="text-muted-foreground text-xs tracking-wider uppercase">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-background overflow-hidden relative flex items-center justify-center"
      onMouseMove={handleMouseMove}
    >
      <LoginHero
        prefersReducedMotion={prefersReducedMotion}
        blobX={blobX}
        blobY={blobY}
        globeX={globeX}
        globeY={globeY}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 5 — FLOATING STAT CARDS (glassmorphism, left & right)
      ══════════════════════════════════════════════════════════════════════ */}
      {STAT_CARDS.map((card, i) => (
        <motion.div
          key={i}
          className={`absolute hidden xl:flex ${card.pos} ${card.cls}`}
          style={{ zIndex: 6 }}
          initial={{ opacity: 0, x: i < 2 ? -24 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: card.delay, ease: 'easeOut' }}
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${card.border} backdrop-blur-md bg-card/40`}
            style={{
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-accent/10 ${card.iconColor}`}>
              <card.icon size={15} />
            </div>
            <div>
              <p className="text-base font-black text-foreground leading-none">{card.value}</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5 leading-none">{card.label}</p>
            </div>
          </div>
        </motion.div>
      ))}

      {/* ══════════════════════════════════════════════════════════════════════
          TOP NAV BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20">
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1,  y:   0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
            <Plane size={15} className="text-accent-foreground -rotate-45" />
          </div>
          <div>
            <span className="text-sm font-black text-foreground tracking-tight leading-none block">TripPlanner AI</span>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest leading-none">Travel Planner</span>
          </div>
        </motion.div>

        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1,  y:   0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <DarkModeToggle />
          <Link
            href="/register"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/10 transition-all"
          >
            Create account
          </Link>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CENTER CONTENT — AI PROMPT CHIPS + LOGIN CARD
      ══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-5 w-full max-w-sm mx-auto px-4"
        style={{ x: cardX, y: cardY }}
      >
        {/* AI prompt suggestion chips */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1,  y:  0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {PROMPTS.map((p, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1   }}
              transition={{ duration: 0.4, delay: 0.6 + p.delay }}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-card border border-border backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-accent/10 hover:border-accent/30 transition-all cursor-default select-none"
            >
              <Sparkles size={9} className="text-accent shrink-0" />
              {p.text}
            </motion.span>
          ))}
        </motion.div>

        {/* ── LOGIN CARD ─────────────────────────────────────────────────── */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1,  y:  0, scale: 1    }}
          transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="relative rounded-2xl overflow-hidden bg-card"
            style={{
              border:     '1px solid var(--border)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {/* Shimmer highlight at top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />

            <div className="p-7">
              {/* Card header */}
              <div className="text-center mb-6">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/30"
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Plane size={20} className="text-accent-foreground -rotate-45" />
                </motion.div>
                <h1 className="text-xl font-black text-foreground tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">Sign in to continue your journey</p>
              </div>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{    opacity: 0, height: 0,      marginBottom: 0  }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3.5 py-2.5 text-xs font-medium">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0 mt-0.5 flex-none">
                        <path fillRule="evenodd" d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-1A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM7.25 4.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5zm.75 7a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4" noValidate>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="lp-email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Email address
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-150 ${
                      focused === 'email' ? 'text-accent' : emailError ? 'text-red-semantic' : 'text-muted-foreground'
                    }`}>
                      <Mail size={14} />
                    </div>
                    <input
                      id="lp-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                      onBlur={() => { setFocused(null); validateEmail(email); }}
                      onFocus={() => setFocused('email')}
                      placeholder="you@example.com"
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all duration-150 text-foreground placeholder:text-muted-foreground bg-input ${
                        emailError
                          ? 'border-red-semantic ring-2 ring-red-semantic/15'
                          : focused === 'email'
                            ? 'border-accent ring-2 ring-accent/20 shadow-sm'
                            : 'border-border hover:border-accent/50'
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {emailError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y:  0 }}
                        exit={{    opacity: 0, y: -4 }}
                        className="text-xs text-red-500 font-medium flex items-center gap-1"
                      >
                        <span className="w-3 h-3 rounded-full bg-red-100 flex items-center justify-center text-xs font-black shrink-0">!</span>
                        {emailError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="lp-password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-xs text-accent font-semibold hover:text-accent/80 transition-colors">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-150 ${
                      focused === 'password' ? 'text-accent' : 'text-muted-foreground'
                    }`}>
                      <Lock size={14} />
                    </div>
                    <input
                      id="lp-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      placeholder="Enter your password"
                      className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-sm outline-none transition-all duration-150 text-foreground placeholder:text-muted-foreground bg-input ${
                        focused === 'password'
                          ? 'border-accent ring-2 ring-accent/20 shadow-sm'
                          : 'border-border hover:border-accent/50'
                      }`}
                    />
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </motion.button>
                  </div>
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2.5 cursor-pointer group w-fit select-none">
                  <div
                    onClick={() => setRememberMe(v => !v)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-none transition-all duration-150 ${
                      rememberMe ? 'bg-accent border-accent' : 'border-border bg-input group-hover:border-accent/50'
                    }`}
                  >
                    <AnimatePresence>
                      {rememberMe && (
                        <motion.svg
                          viewBox="0 0 10 8" fill="none"
                          className="w-2.5 h-2"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{    scale: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                    Remember me for 30 days
                  </span>
                </label>

                {/* Submit button */}
                <motion.button
                  id="lp-signin"
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.015 } : {}}
                  whileTap={!loading  ? { scale: 0.98  } : {}}
                  className="relative w-full h-10 rounded-lg bg-accent text-accent-foreground text-sm font-bold overflow-hidden flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-1 group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
                >
                  {/* Hover shimmer */}
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)' }} />

                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <motion.div
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                      >
                        <ArrowRight size={15} />
                      </motion.div>
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative mt-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-card text-xs text-muted-foreground font-medium">or continue with</span>
                </div>
              </div>

              {/* Social login */}
              <div className="mt-4">
                <SocialLoginButtons />
              </div>

              {/* Register link */}
              <p className="text-center text-sm text-muted-foreground mt-5">
                Don't have an account?{' '}
                <Link href="/register" className="text-accent font-bold hover:text-accent/80 transition-colors">
                  Create account →
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          {[
            { icon: Shield,       label: 'SSL Secured'    },
            { icon: CheckCircle2, label: 'No spam'        },
            { icon: Star,         label: 'GDPR compliant' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-1 text-muted-foreground">
              <b.icon size={10} />
              <span className="text-xs font-medium">{b.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom vignette */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-t from-background to-transparent"
        style={{ zIndex: 2 }}
      />
    </div>
  );
}
