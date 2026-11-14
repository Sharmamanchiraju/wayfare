"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, Sparkles, Compass, TrendingUp, Check, Clock } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import ThreeDGlobe from './ThreeDGlobe';

// ─── Constants ───────────────────────────────────────────────────────────────
const PARTICLES = [
  { id:  1, x:  8, y: 16, s: 2,   d: 7.2, dl: 0.0, v: 1 },
  { id:  2, x: 18, y: 54, s: 2.5, d: 9.1, dl: 1.4, v: 2 },
  { id:  3, x: 28, y: 82, s: 1.5, d: 6.8, dl: 2.8, v: 1 },
  { id:  4, x: 38, y: 28, s: 2,   d: 8.4, dl: 0.6, v: 2 },
  { id:  5, x: 55, y: 70, s: 3,   d: 7.6, dl: 3.5, v: 1 },
  { id:  6, x: 64, y: 12, s: 1.5, d: 9.4, dl: 1.1, v: 2 },
  { id:  7, x: 72, y: 92, s: 2,   d: 6.2, dl: 4.2, v: 1 },
  { id:  8, x: 80, y: 46, s: 2.5, d: 8.8, dl: 0.9, v: 2 },
  { id:  9, x: 88, y: 68, s: 2,   d: 7.0, dl: 2.1, v: 1 },
  { id: 10, x: 92, y: 24, s: 1.5, d: 9.0, dl: 3.2, v: 2 },
  { id: 11, x: 45, y:  5, s: 2.5, d: 6.6, dl: 0.4, v: 1 },
  { id: 12, x:  4, y: 86, s: 2,   d: 8.2, dl: 4.7, v: 2 },
  { id: 13, x: 96, y: 56, s: 2,   d: 7.8, dl: 1.8, v: 1 },
];

const PINS = [
  { x: 10, y: 22, label: 'Tokyo',            color: '#10b981', delay: 0.4 },
  { x: 20, y: 35, label: 'Kyoto',            color: '#3b82f6', delay: 0.8 },
  { x: 82, y: 20, label: 'Paris',            color: '#10b981', delay: 1.2 },
  { x: 72, y: 50, label: 'SF',               color: '#f59e0b', delay: 1.6 },
  { x: 76, y: 60, label: 'LA',               color: '#a855f7', delay: 2.0 },
  { x: 30, y: 68, label: 'Local Crawl 🍜',   color: '#ec4899', delay: 2.4 },
];

// ─── Globe SVG ───────────────────────────────────────────────────────────────
function GlobeSVG() {
  return (
    <svg width="480" height="480" viewBox="0 0 540 540" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="lgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#10b981" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0"    />
        </radialGradient>
        <clipPath id="lgGlobeClip"><circle cx="270" cy="270" r="210" /></clipPath>
      </defs>
      <circle cx="270" cy="270" r="260" fill="url(#lgGlow)" />
      <circle cx="270" cy="270" r="210" className="fill-[var(--globe-bg)] [filter:var(--globe-blur)]" />
      <g clipPath="url(#lgGlobeClip)" opacity="0.05">
        {Array.from({ length: 10 }).map((_, row) =>
          Array.from({ length: 10 }).map((_, col) => {
            const gx = 65 + col * 46, gy = 65 + row * 46;
            const dx = gx - 270, dy = gy - 270;
            if (dx * dx + dy * dy > 210 * 210) return null;
            return <circle key={`${row}-${col}`} cx={gx} cy={gy} r="1.5" fill="white" />;
          })
        )}
      </g>
      <ellipse cx="270" cy="270" rx="210" ry="58"  stroke="white" strokeWidth="0.6" opacity="0.10" />
      <ellipse cx="270" cy="210" rx="183" ry="46"  stroke="white" strokeWidth="0.5" opacity="0.07" />
      <ellipse cx="270" cy="330" rx="183" ry="46"  stroke="white" strokeWidth="0.5" opacity="0.07" />
      <ellipse cx="270" cy="152" rx="130" ry="30"  stroke="white" strokeWidth="0.4" opacity="0.05" />
      <ellipse cx="270" cy="388" rx="130" ry="30"  stroke="white" strokeWidth="0.4" opacity="0.05" />
      <ellipse cx="270" cy="270" rx="210" ry="62" stroke="#10b981" strokeWidth="0.8"
        className="animate-meridian-1" style={{ transformOrigin: '270px 270px' }} />
      <ellipse cx="270" cy="270" rx="210" ry="62" stroke="#3b82f6" strokeWidth="0.7"
        className="animate-meridian-2" style={{ transformOrigin: '270px 270px' }} />
      <ellipse cx="270" cy="270" rx="210" ry="62" stroke="#a855f7" strokeWidth="0.6"
        className="animate-meridian-3" style={{ transformOrigin: '270px 270px' }} />
      <circle cx="270" cy="270" r="210" stroke="#10b981" strokeWidth="1" strokeDasharray="6 10" opacity="0.35" />
      {[
        { cx: 185, cy: 200, c: '#10b981' },
        { cx: 340, cy: 180, c: '#3b82f6' },
        { cx: 375, cy: 300, c: '#f59e0b' },
        { cx: 155, cy: 310, c: '#a855f7' },
        { cx: 270, cy: 145, c: '#ec4899' },
      ].map((dot, i) => (
        <g key={i}>
          <circle cx={dot.cx} cy={dot.cy} r="5" fill={dot.c} opacity="0.15"
            style={{ animation: `pin-ring 2.4s ease-out ${i * 0.4}s infinite` }} />
          <circle cx={dot.cx} cy={dot.cy} r="2.5" fill={dot.c} opacity="0.9"
            style={{ animation: `pin-inner 2.4s ease-in-out ${i * 0.4}s infinite` }} />
        </g>
      ))}
    </svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────
interface LoginHeroProps {
  prefersReducedMotion: boolean;
  blobX: any;
  blobY: any;
  globeX: any;
  globeY: any;
}

export default function LoginHero({
  prefersReducedMotion,
  blobX,
  blobY,
  globeX,
  globeY,
}: LoginHeroProps) {
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const available = !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setWebglAvailable(available);
    } catch (e) {
      setWebglAvailable(false);
    }
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      
      {/* ── CENTRAL GLOW BEHIND LOGIN FORM ──────────────────────────────── */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full w-[540px] h-[540px]"
        style={{
          background: 'radial-gradient(circle, var(--central-glow-color) 0%, transparent 68%)',
          filter: 'blur(50px)',
          opacity: 0.9,
          zIndex: 1,
        }}
      />

      {/* ── BLOBS & AMBIENT LIGHTING ────────────────────────────────────── */}
      <motion.div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ x: blobX, y: blobY }}>
        <div className="absolute animate-blob-1 will-change-transform"
          style={{ top: '-15%', left: '-10%', width: 600, height: 600,
            borderRadius: '60% 40% 50% 70% / 50% 60% 40% 70%',
            background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.11) 0%, transparent 70%)',
            filter: 'blur(60px)' }} />
        <div className="absolute animate-blob-2 will-change-transform"
          style={{ bottom: '-20%', right: '-10%', width: 650, height: 650,
            borderRadius: '40% 60% 70% 30% / 60% 40% 50% 60%',
            background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.10) 0%, transparent 70%)',
            filter: 'blur(70px)' }} />
        <div className="absolute animate-blob-3 will-change-transform"
          style={{ top: '30%', right: '15%', width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)',
            filter: 'blur(80px)' }} />
        <div className="absolute animate-beam will-change-transform"
          style={{ top: '50%', left: '50%', width: '200%', height: '3px',
            marginLeft: '-100%', marginTop: '-1.5px',
            background: 'linear-gradient(90deg, transparent 0%, #10b981 40%, #3b82f6 60%, transparent 100%)',
            transformOrigin: 'center center', opacity: 0.12 }} />
      </motion.div>

      {/* ── GLOBE ──────────────────────────────────────────────────────── */}
      <motion.div className="absolute pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ x: globeX, y: globeY }}>
        <div style={{ opacity: 'var(--globe-opacity)' }}>
          {webglAvailable === true ? (
            <ErrorBoundary fallback={<GlobeSVG />}>
              <ThreeDGlobe isDark={isDark} prefersReducedMotion={prefersReducedMotion} />
            </ErrorBoundary>
          ) : (
            <GlobeSVG />
          )}
        </div>
      </motion.div>

      {/* ── FLIGHT NETWORK PATHS ────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="route1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="var(--map-opacity-low)" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="var(--map-opacity-high)" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="var(--map-opacity-low)" />
            </linearGradient>
            <linearGradient id="route2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="var(--map-opacity-low)" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="var(--map-opacity-high)" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="var(--map-opacity-low)" />
            </linearGradient>
            <linearGradient id="route3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="var(--map-opacity-low)" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="var(--map-opacity-high)" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="var(--map-opacity-low)" />
            </linearGradient>
          </defs>

          {/* Path 1: Tokyo (10, 22) -> Paris (82, 20) [Flight Path] */}
          <path
            id="flight-path-1"
            d="M 10 22 Q 46 5 82 20"
            stroke="url(#route1)"
            strokeWidth="0.7"
            fill="none"
            className="animate-flight-path"
          />

          {/* Path 2: Tokyo (10, 22) -> Kyoto (20, 35) [Train Path] */}
          <path
            id="flight-path-2"
            d="M 10 22 Q 14 30 20 35"
            stroke="url(#route2)"
            strokeWidth="0.7"
            fill="none"
            className="animate-flight-path"
            style={{ animationDelay: '-0.7s' }}
          />

          {/* Path 3: SF (72, 50) -> LA (76, 60) [Car Path] */}
          <path
            id="flight-path-3"
            d="M 72 50 Q 73 56 76 60"
            stroke="url(#route3)"
            strokeWidth="0.7"
            fill="none"
            className="animate-flight-path"
            style={{ animationDelay: '-1.4s' }}
          />

          {/* VEHICLES TRAVERSING ROUTES */}
          {!prefersReducedMotion && (
            <>
              {/* Vehicle 1 (Plane) on Tokyo -> Paris [Flight Path 1] */}
              <g>
                <g transform="rotate(90) scale(0.045) translate(-11.5, -12)">
                  <path
                    d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
                    fill="#10b981"
                    className="drop-shadow-[0_2px_4px_rgba(16,185,129,0.5)]"
                  />
                </g>
                <animateMotion dur="14s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#flight-path-1" />
                </animateMotion>
              </g>

              {/* Vehicle 2 (Train profile) on Tokyo -> Kyoto [Train Path 2] */}
              <g>
                <g transform="scale(0.1)">
                  {/* Sleek bullet train silhouette pointing right */}
                  <path
                    d="M -8 -2 L 4 -2 C 6 -2 8 -0.5 8 1 L 8 2 L -8 2 Z"
                    fill="#3b82f6"
                    className="drop-shadow-[0_2px_4px_rgba(59,130,246,0.5)]"
                  />
                  <rect x="-7" y="-0.5" width="2" height="1.2" fill="var(--background)" opacity="0.6" />
                  <rect x="-4" y="-0.5" width="2" height="1.2" fill="var(--background)" opacity="0.6" />
                  <rect x="-1" y="-0.5" width="2" height="1.2" fill="var(--background)" opacity="0.6" />
                  <path d="M 2.5 -0.5 L 5.5 -0.5 L 6.5 1 L 2.5 1 Z" fill="var(--background)" opacity="0.8" />
                </g>
                <animateMotion dur="9s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#flight-path-2" />
                </animateMotion>
              </g>

              {/* Vehicle 3 (Car profile) on SF -> LA [Road-trip Path 3] */}
              <g>
                <g transform="scale(0.1) translate(0, -1)">
                  {/* Clean car silhouette pointing right */}
                  <path
                    d="M -6 1 C -6 -0.5 -4 -1.5 -2 -1.5 L 2 -1.5 C 3.5 -1.5 4.5 -0.5 5 1 L 7 1 C 7.5 1 8 1.5 8 2 L 8 3.5 L -8 3.5 L -8 2 C -8 1.5 -7.5 1 -7 1 Z"
                    fill="#f59e0b"
                    className="drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)]"
                  />
                  <circle cx="-3" cy="3.5" r="1.5" fill="var(--background)" />
                  <circle cx="3" cy="3.5" r="1.5" fill="var(--background)" />
                  <circle cx="-3" cy="3.5" r="0.6" fill="#f59e0b" />
                  <circle cx="3" cy="3.5" r="0.6" fill="#f59e0b" />
                </g>
                <animateMotion dur="7s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#flight-path-3" />
                </animateMotion>
              </g>
            </>
          )}
        </svg>
      </div>

      {/* ── PARTICLES ──────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }}>
        {PARTICLES.map(p => (
          <div key={p.id} className="absolute rounded-full"
            style={{
              left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s,
              background: p.id % 3 === 0 ? '#10b981' : p.id % 3 === 1 ? '#3b82f6' : '#a855f7',
              opacity: 0.5,
              animation: `${p.v === 1 ? 'particle-drift' : 'particle-drift-2'} ${p.d}s ease-in-out ${p.dl}s infinite`,
              willChange: 'transform, opacity',
            }} />
        ))}
      </div>

      {/* ── CITY MARKERS (PINS) ────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block" style={{ zIndex: 5 }}>
        {PINS.map((pin, i) => (
          <motion.div key={i} className="absolute flex flex-col items-center gap-1"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1 + pin.delay, type: 'spring', stiffness: 200 }}>
            <div className="relative">
              <div className="absolute rounded-full animate-pin-ring"
                style={{ width: 10, height: 10, top: -1, left: -1,
                  background: pin.color, opacity: 'var(--pin-ring-opacity)' as any, animationDelay: `${i * 0.5}s` }} />
              <div className="w-2 h-2 rounded-full animate-pin-inner"
                style={{ background: pin.color, boxShadow: `0 0 8px ${pin.color}60`, animationDelay: `${i * 0.5}s` }} />
            </div>
            <span className="hidden xl:block text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap tracking-wide backdrop-blur-sm"
              style={{ color: pin.color, background: `${pin.color}15`, border: `0.5px solid ${pin.color}30` }}>
              {pin.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ── TWO FLOATING AI TRAVEL CARDS ────────────────────────────────── */}
      {/* 1. Left Card: Itinerary Summary */}
      <motion.div 
        className="absolute hidden xl:flex left-8 top-[32%] z-10 animate-card-float-1 pointer-events-auto"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
      >
        <div className="flex flex-col gap-2.5 p-4 rounded-2xl w-[250px]"
          style={{
            backgroundColor: 'var(--badge-bg)',
            border: '1px solid var(--badge-border-emerald)',
            boxShadow: 'var(--badge-shadow)',
            backdropFilter: 'blur(16px)',
          }}>
          <div className="flex items-center justify-between border-b pb-2 border-emerald-500/10">
            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--badge-text-primary)' }}>
              <Compass size={14} className="text-emerald-500" />
              <span>Kyoto Itinerary Plan</span>
            </div>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 uppercase tracking-widest text-center">Day 3</span>
          </div>
          
          <div className="flex flex-col gap-2 text-[11px] font-semibold">
            <div className="flex items-center gap-2" style={{ color: 'var(--badge-text-secondary)' }}>
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check size={9} className="text-emerald-600" />
              </div>
              <span className="line-through opacity-70">09:00 Shinkansen Train to Kyoto</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: 'var(--badge-text-primary)' }}>
              <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center shrink-0 animate-pulse">
                <Clock size={9} className="text-accent" />
              </div>
              <span className="font-bold">12:30 Kinkaku-ji Temple</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: 'var(--badge-text-secondary)' }}>
              <div className="w-4 h-4 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              </div>
              <span>16:00 Gion District Walk</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Right Card: AI Recommendation Card */}
      <motion.div 
        className="absolute hidden xl:flex right-8 top-[36%] z-10 animate-card-float-3 pointer-events-auto"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 1.1 }}
      >
        <div className="flex flex-col gap-2.5 p-4 rounded-2xl w-[250px]"
          style={{
            backgroundColor: 'var(--badge-bg)',
            border: '1px solid var(--badge-border-amber)',
            boxShadow: 'var(--badge-shadow)',
            backdropFilter: 'blur(16px)',
          }}>
          <div className="flex items-center gap-2 border-b pb-2 border-amber-500/10">
            <Sparkles size={14} className="text-amber-500 animate-pulse" />
            <span className="text-xs font-bold" style={{ color: 'var(--badge-text-primary)' }}>AI Smart Recommendation</span>
          </div>

          <div className="flex flex-col gap-1.5 text-[11px] font-semibold">
            <span style={{ color: 'var(--badge-text-primary)' }}>SF to LA Scenic Drive</span>
            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
              <TrendingUp size={12} />
              <span>Optimal route: Pacific Coast Hwy</span>
            </div>
            <div className="mt-1 px-2.5 py-1 rounded bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300 font-bold border border-amber-500/10 w-fit">
              Est. driving time: 7.5h
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
