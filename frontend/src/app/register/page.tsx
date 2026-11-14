"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRegister } from '@/hooks/useRegister';
import { Button, Input, Alert, AuthShell } from '@/components/ui';

export default function RegisterPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { registerUser, loading: registerPending, error: registerError } = useRegister();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);

  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Route to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !terms) return;

    const success = await registerUser(fullName, email, password);
    if (success) {
      // Route into the Onboarding (Travel Style) flow, not directly to the dashboard
      router.push('/onboarding');
    }
  };

  const isFormValid = 
    fullName.trim() !== '' && 
    email.trim() !== '' && 
    password.length >= 8 && 
    password === confirmPassword && 
    terms;

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
          Create Account
        </h1>
        <p className="text-sm text-text-secondary mt-1.5">
          Join TripPlanner and start exploring
        </p>
      </div>

      {/* Inline error banner on register failure */}
      {registerError && (
        <Alert 
          variant="error" 
          title="Failed to Register" 
          className="mb-5 shadow-xs border border-error/25 bg-error-bg text-error-text"
        >
          {registerError}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
        
        {/* Input: Full Name */}
        <Input
          label="Full Name"
          leftIcon={<User className="h-4.5 w-4.5" />}
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
          }}
          error={errors.fullName}
          placeholder="John Doe"
          required
        />

        {/* Input: Email */}
        <Input
          label="Email Address"
          leftIcon={<Mail className="h-4.5 w-4.5" />}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          placeholder="you@example.com"
          required
        />

        {/* Input: Password */}
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
          placeholder="At least 8 characters"
          required
        />

        {/* Input: Confirm Password */}
        <Input
          label="Confirm Password"
          leftIcon={<Lock className="h-4.5 w-4.5" />}
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          error={errors.confirmPassword}
          placeholder="Confirm password"
          required
        />

        {/* Checkbox: Terms & Conditions */}
        <div className="flex items-start pt-1">
          <div className="flex items-center h-5">
            <input
              id="terms-checkbox"
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/25 cursor-pointer accent-primary"
            />
          </div>
          <div className="ml-2.5 text-xs text-text-secondary select-none">
            <label htmlFor="terms-checkbox" className="font-medium cursor-pointer hover:text-text-primary transition-colors leading-normal">
              I agree to the <a href="#" className="text-primary hover:underline">Terms & Conditions</a>
            </label>
          </div>
        </div>

        {/* Full-width primary button "Create Account" */}
        <Button
          type="submit"
          variant="primary"
          loading={registerPending}
          disabled={!isFormValid}
          className="w-full h-11 mt-3.5 text-sm font-bold shadow-md shadow-primary-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Account
        </Button>
      </form>

      {/* Footer text centered */}
      <div className="mt-8 text-center text-sm font-medium text-text-secondary select-none">
        Already have an account?{' '}
        <Link 
          href="/login" 
          className="text-primary font-bold hover:text-primary-hover transition-colors"
        >
          Login
        </Link>
      </div>
    </AuthShell>
  );
}
