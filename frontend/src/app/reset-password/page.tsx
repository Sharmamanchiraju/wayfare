"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plane, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useResetPassword } from '@/hooks/useResetPassword';
import { Card, CardContent, Button, Input, Alert } from '@/components/ui';

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword, loading, error, success } = useResetPassword();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  
  const [strength, setStrength] = useState<{ score: number; label: string; color: string }>({
    score: 0,
    label: 'Weak',
    color: 'bg-red-semantic text-red-semantic'
  });

  useEffect(() => {
    if (password.length === 0) {
      setStrength({ score: 0, label: 'Weak', color: 'bg-slate-700 text-slate-400' });
      return;
    }

    if (password.length < 8) {
      setStrength({ score: 25, label: 'Weak', color: 'bg-red-semantic text-red-semantic' });
      return;
    }

    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);

    if (hasNumber && hasSpecial && hasUppercase) {
      setStrength({ score: 100, label: 'Strong', color: 'bg-accent text-accent' });
    } else if (hasNumber) {
      setStrength({ score: 75, label: 'Good', color: 'bg-blue-500 text-blue-500' });
    } else {
      setStrength({ score: 50, label: 'Fair', color: 'bg-amber-semantic text-amber-semantic' });
    }
  }, [password]);

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setMatchError("Passwords don't match");
    } else {
      setMatchError("");
    }
  }, [password, confirmPassword]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    } else if (success && redirectCountdown === 0) {
      router.push('/login');
    }
    return () => clearTimeout(timer);
  }, [success, redirectCountdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (matchError || strength.label === 'Weak') return;
    await resetPassword(token, password);
  };

  const isFormInvalid = !password || strength.label === 'Weak' || password !== confirmPassword;

  return (
    <Card className="border-[0.5px] border-card-border bg-card shadow-xl rounded-xl">
      <CardContent className="p-6 sm:p-8 space-y-5">
        
        <div className="text-center pb-2 select-none">
          <h3 className="text-2xl font-black text-foreground tracking-tight">
            Create New Password
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Choose a strong password to secure your account
          </p>
        </div>

        {error && (
          <div className="space-y-4">
            <Alert variant="error">
              {error}
            </Alert>
            {error.includes("expired") && (
              <div className="text-center select-none pt-2">
                <Link href="/forgot-password" className="text-sm text-accent font-bold hover:underline">
                  Request new verification link
                </Link>
              </div>
            )}
          </div>
        )}

        {success ? (
          <div className="space-y-3 select-none text-center">
            <Alert variant="success">
              Password reset successfully!
            </Alert>
            <p className="text-xs text-muted-foreground pt-2">
              Redirecting you to the login portal in <strong className="text-foreground font-bold">{redirectCountdown} seconds</strong>...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock size={15} />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pl-9.5 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                    <motion.div 
                      className={`h-full ${strength.color.split(' ')[0]} transition-all duration-300`} 
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span className={strength.color.split(' ')[1]}>{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock size={15} />
                </div>
                <Input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={matchError}
                  placeholder="Confirm new password"
                  className="pl-9.5 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="solid"
              loading={loading}
              disabled={isFormInvalid}
              className="w-full mt-4 justify-center gap-1.5 h-10 shadow-md shadow-accent/15 select-none font-bold disabled:opacity-50"
            >
              <span>Reset Password</span>
              <ArrowRight size={14} />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500 flex flex-col lg:flex-row relative overflow-hidden">
      
      {/* Left side (Hero) */}
      <section className="relative w-full lg:w-[60%] h-[30vh] lg:h-screen flex flex-col justify-between p-6 sm:p-10 select-none z-10">
        <div className="absolute inset-0 z-0">
          <Image
            src="/travel_hero_bg.png"
            alt="Travel background illustration"
            fill
            priority
            className="object-cover opacity-90 lg:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-blue-600/30 mix-blend-multiply"></div>
        </div>

        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-16 h-10 animate-plane-float opacity-80">
            <svg className="w-full h-full text-white/90 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l7 2.5z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-2.5 z-10">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md">
            <Plane size={18} className="text-blue-600 transform rotate-45" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none">TripPlanner AI</h1>
            <p className="text-xs text-white/80 font-bold uppercase tracking-widest mt-0.5">
              Travel Planner
            </p>
          </div>
        </div>

        <div className="my-auto max-w-xl z-10 text-white drop-shadow-sm text-left animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-none">
            Choose a New<br />Secure Password.
          </h2>
          <p className="text-sm sm:text-base text-white/95 font-medium max-w-md leading-relaxed mt-4">
            Protect your holiday itineraries and profile data by configuring a fresh set of login credentials.
          </p>
        </div>

        <div className="z-10 text-left bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 w-fit">
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>⭐⭐⭐⭐⭐</span>
            <span>Loved by 15,000+ travelers worldwide</span>
          </p>
        </div>
      </section>

      {/* Right side (Modal) */}
      <section className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-10 z-20 bg-slate-950/20 backdrop-blur-md lg:backdrop-blur-none lg:bg-transparent min-h-[60vh] lg:min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-sm"
        >
          <Suspense fallback={
            <Card className="border-[0.5px] border-card-border bg-card shadow-xl rounded-xl">
              <CardContent className="p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-muted border-t-accent rounded-full animate-spin" />
              </CardContent>
            </Card>
          }>
            <ResetPasswordFormContent />
          </Suspense>
        </motion.div>
      </section>

    </div>
  );
}
