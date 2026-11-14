"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plane, Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, Button, Input, Alert } from '@/components/ui';

function VerifyEmailFormContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setVerifying(true);
      setError('');
      // Simulate API verification call
      const verifyToken = setTimeout(() => {
        setVerifying(false);
        if (token === 'expired' || token === 'invalid') {
          setError('Link expired or invalid');
        } else {
          setVerified(true);
        }
      }, 2000);

      return () => clearTimeout(verifyToken);
    }
  }, [token]);

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRequestSuccess(true);
    setLoading(false);
  };

  // State 1: Verifying active token
  if (verifying) {
    return (
      <Card className="w-full max-w-md border-[0.5px] border-card-border bg-card shadow-xl rounded-xl">
        <CardContent className="p-8 text-center space-y-4 select-none">
          <div className="w-10 h-10 border-2 border-muted border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">Verifying Email Address</h3>
          <p className="text-xs text-muted-foreground">
            Please wait while we check your token coordinates...
          </p>
        </CardContent>
      </Card>
    );
  }

  // State 2: Verification Successful
  if (verified) {
    return (
      <Card className="w-full max-w-md border-[0.5px] border-card-border bg-card shadow-xl rounded-xl">
        <CardContent className="p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-accent/15 border border-accent/25 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
            <CheckCircle2 size={32} />
          </div>
          
          <div className="space-y-1.5 select-none">
            <h3 className="text-2xl font-black text-foreground">Email verified! ✓</h3>
            <p className="text-xs text-muted-foreground">
              Your email coordinates have been successfully authorized.
            </p>
          </div>

          <Button
            onClick={() => router.push('/dashboard')}
            variant="solid"
            className="w-full h-10 justify-center font-bold"
          >
            <span>Continue to Dashboard</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // State 3: Verification Failed
  if (error) {
    return (
      <Card className="w-full max-w-md border-[0.5px] border-card-border bg-card shadow-xl rounded-xl">
        <CardContent className="p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-red-semantic/15 border border-red-semantic/25 rounded-full flex items-center justify-center mx-auto mb-4 text-red-semantic">
            <AlertCircle size={32} />
          </div>
          
          <div className="space-y-1.5 select-none">
            <h3 className="text-xl font-black text-foreground">Verification Failed</h3>
            <p className="text-xs text-muted-foreground">
              The verification {error.toLowerCase()}.
            </p>
          </div>

          {requestSuccess ? (
            <Alert variant="success">
              We sent a new verification link to your email.
            </Alert>
          ) : (
            <form onSubmit={handleRequestVerification} className="space-y-4 text-left">
              <div className="space-y-1.5">
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
                    placeholder="Enter your email"
                    className="pl-9.5 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="solid"
                loading={loading}
                className="w-full h-10 justify-center font-bold"
              >
                <span>Request New Verification Link</span>
              </Button>
            </form>
          )}

          <div className="pt-3 border-t border-border/60 select-none">
            <Link href="/login" className="text-xs text-accent font-bold hover:underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State 4: Default Verification Instructions (No token present)
  return (
    <Card className="w-full max-w-md border-[0.5px] border-card-border bg-card shadow-xl rounded-xl">
      <CardContent className="p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-blue-600/10 border border-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
          <Mail size={30} />
        </div>
        
        <div className="space-y-1.5 select-none">
          <h3 className="text-2xl font-black text-foreground tracking-tight">Verify Your Email</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We sent a verification link to your email. Check your inbox and click the link to confirm your account.
          </p>
        </div>

        <div className="pt-4 border-t border-border/60 select-none flex justify-center gap-4">
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors">
            Back to Login
          </Link>
          <span className="text-xs text-muted-foreground">|</span>
          <Link href="/register" className="text-xs text-accent font-semibold hover:opacity-85 transition-opacity">
            Register new account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Graphic elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[480px] h-[480px] bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      
      {/* Branding */}
      <div className="flex items-center gap-2 mb-8 select-none z-10">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md">
          <Plane size={18} className="text-blue-600 transform rotate-45" />
        </div>
        <h1 className="text-lg font-black text-white tracking-tight leading-none">TripPlanner AI</h1>
      </div>

      <div className="z-10 w-full flex justify-center">
        <Suspense fallback={
          <Card className="w-full max-w-md border-[0.5px] border-card-border bg-card shadow-xl rounded-xl">
            <CardContent className="p-8 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-muted border-t-accent rounded-full animate-spin" />
            </CardContent>
          </Card>
        }>
          <VerifyEmailFormContent />
        </Suspense>
      </div>
    </div>
  );
}
