"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plane, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useForgotPassword } from '@/hooks/useForgotPassword';
import { Card, CardContent, Button, Input, Alert } from '@/components/ui';

export default function ForgotPasswordPage() {
  const { sendResetLink, loading, error, success } = useForgotPassword();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success && countdown === 0) {
      setCountdown(60);
    }

    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [success, countdown]);

  const validateEmail = (val: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) {
      setEmailError('Email is required');
      return false;
    } else if (!regex.test(val)) {
      setEmailError('Invalid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;
    await sendResetLink(email);
  };

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
            Recover Your<br />Travel Access.
          </h2>
          <p className="text-sm sm:text-base text-white/95 font-medium max-w-md leading-relaxed mt-4">
            Forgot your key? Submit your registered email address and we'll instantly generate a tokenized password reset link.
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
          <Card className="border-[0.5px] border-card-border bg-card shadow-xl rounded-xl">
            <CardContent className="p-6 sm:p-8 space-y-5">
              
              <div className="text-center pb-2 select-none">
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  Reset Your Password
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your email to receive reset instructions
                </p>
              </div>

              {error && (
                <Alert variant="error">
                  {error}
                </Alert>
              )}

              {success ? (
                <div className="space-y-4">
                  <Alert variant="success">
                    Check your email for instructions
                  </Alert>
                  <p className="text-xs text-muted-foreground leading-relaxed text-center">
                    We sent a secure link to <strong className="text-foreground">{email}</strong>. 
                    {countdown > 0 ? (
                      <span className="block mt-2 font-bold text-accent">Resend link in {countdown}s</span>
                    ) : (
                      <button 
                        onClick={handleSubmit} 
                        className="block w-full text-center mt-2 text-accent font-bold hover:underline cursor-pointer"
                      >
                        Resend reset email
                      </button>
                    )}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <Mail size={15} />
                      </div>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={(e) => validateEmail(e.target.value)}
                        error={emailError}
                        placeholder="Enter your email"
                        className="pl-9.5 text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="solid"
                    loading={loading}
                    disabled={!email || !!emailError}
                    className="w-full mt-4 justify-center gap-1.5 h-10 shadow-md shadow-accent/15 select-none font-bold"
                  >
                    <span>Send Reset Link</span>
                    <ArrowRight size={14} />
                  </Button>
                </form>
              )}

              <div className="pt-4 border-t border-border/60 text-center select-none">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors">
                  <ArrowLeft size={13} /> Back to Login
                </Link>
              </div>

            </CardContent>
          </Card>
        </motion.div>
      </section>

    </div>
  );
}
