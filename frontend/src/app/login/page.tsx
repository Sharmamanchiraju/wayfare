"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLogin } from '@/hooks/useLogin';
import { Button, Input, Alert, AuthShell } from '@/components/ui';

export default function LoginPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { loginUser, loading: loginPending, error: loginError } = useLogin();
  const router = useRouter();

  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  // Route to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const validateForm = () => {
    const newErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Email or phone number is required';
    } else if (identifier.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        newErrors.identifier = 'Please enter a valid email address';
      }
    } else {
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      // strip spaces, hyphens, and parentheses to validate phone numbers
      const sanitizedPhone = identifier.replace(/[\s-()]/g, '');
      if (!phoneRegex.test(sanitizedPhone)) {
        newErrors.identifier = 'Please enter a valid email or phone number';
      }
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Backend expects an email parameter. If identifier is email, pass it directly.
    // If it's a phone, it passes it anyway so the auth provider can handle it.
    const success = await loginUser(identifier, password);
    if (success) {
      router.push('/dashboard');
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 border-2 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-text-secondary text-xs tracking-wider uppercase font-bold">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthShell maxWidth="md">
      {/* Brand logo lockup centered on all screens inside the card */}
      <div className="flex flex-col items-center justify-center gap-2 mb-8 select-none">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md text-white">
          <Compass className="w-5.5 h-5.5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-text-primary font-serif">TripPlanner</span>
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary font-serif">
          Welcome Back!
        </h1>
        <p className="text-sm text-text-secondary mt-1.5">
          Sign in to continue your journey
        </p>
      </div>

      {/* Inline error banner on login failure */}
      {loginError && (
        <Alert 
          variant="error" 
          title="Failed to Sign In" 
          className="mb-5 shadow-xs border border-error/25 bg-error-bg text-error-text"
        >
          {loginError}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
        
        {/* Input: Email or Phone */}
        <Input
          label="Email or Phone"
          leftIcon={<Mail className="h-4.5 w-4.5" />}
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
          }}
          error={errors.identifier}
          placeholder="you@example.com"
          required
        />

        {/* Input: Password */}
        <div className="space-y-1">
          <Input
            label="Password"
            leftIcon={<Lock className="h-4.5 w-4.5" />}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            placeholder="Enter password"
            required
          />
          {/* Right-aligned "Forgot Password?" link */}
          <div className="flex justify-end pt-1">
            <Link 
              href="/forgot-password" 
              className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        {/* Full-width primary button "Login" */}
        <Button
          type="submit"
          variant="primary"
          loading={loginPending}
          className="w-full h-11 mt-2 text-sm font-bold shadow-md shadow-primary-500/10 cursor-pointer"
        >
          Login
        </Button>
      </form>

      {/* Divider "or continue with" */}
      <div className="relative my-7 select-none">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#FBF8F3] px-3.5 font-bold text-text-secondary/70 tracking-wider">
            or continue with
          </span>
        </div>
      </div>

      {/* Two secondary buttons side by side: Google and Apple */}
      <div className="grid grid-cols-2 gap-3.5 select-none">
        <Button
          type="button"
          variant="secondary"
          onClick={() => alert("Google login is a mock demonstration in this version.")}
          className="h-11 justify-center gap-2 hover:bg-gray-100/50 bg-[#FBF8F3] font-bold text-xs cursor-pointer border border-border shadow-xs"
        >
          <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Google</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => alert("Apple login is a mock demonstration in this version.")}
          className="h-11 justify-center gap-2 hover:bg-gray-100/50 bg-[#FBF8F3] font-bold text-xs cursor-pointer border border-border shadow-xs"
        >
          <svg className="h-4.5 w-4.5 shrink-0 fill-current text-text-primary" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.29-.58 2.95-1.39z"/>
          </svg>
          <span>Apple</span>
        </Button>
      </div>

      {/* Footer text centered */}
      <div className="mt-8 text-center text-sm font-medium text-text-secondary select-none">
        Don't have an account?{' '}
        <Link 
          href="/register" 
          className="text-primary font-bold hover:text-primary-hover transition-colors"
        >
          Sign up
        </Link>
      </div>
    </AuthShell>
  );
}
