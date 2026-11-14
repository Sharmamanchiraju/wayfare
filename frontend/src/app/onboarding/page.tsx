"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Compass, Heart, Users, User, Smile, Sparkles 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePersonas } from '@/hooks/usePersonas';
import { OnboardingStepShell } from '@/components/ui';
import { clsx } from 'clsx';

const STYLE_CARDS = [
  { id: 'adventure', label: 'Adventure', desc: 'Explore the thrill', icon: Compass },
  { id: 'relaxation', label: 'Relaxation', desc: 'Relax and unwind', icon: Heart },
  { id: 'family', label: 'Family', desc: 'Fun for everyone', icon: Users },
  { id: 'solo', label: 'Solo', desc: 'Just you & the world', icon: User },
  { id: 'couple', label: 'Couple', desc: 'Romantic getaways', icon: Smile },
  { id: 'luxury', label: 'Luxury', desc: 'Travel in style', icon: Sparkles }
];

export default function OnboardingPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { createPersona } = usePersonas();
  const router = useRouter();

  // Multi-select state for travel style cards
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Protect page: Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) => 
      prev.includes(id) 
        ? prev.filter((item) => item !== id) 
        : [...prev, id]
    );
  };

  const handleNext = async () => {
    if (selectedStyles.length === 0) return;
    
    setSaving(true);
    try {
      const travelStyleString = selectedStyles.join(', ');
      const name = `${user?.username || 'My'} Travel Profile`;
      
      // Save style preferences to user's first persona profile
      await createPersona.mutateAsync({
        name,
        travel_style: travelStyleString,
        budget_min: 100,
        budget_max: 500,
        description: `Created during onboarding step. Prefers styles: ${travelStyleString}.`
      });

      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to save onboarding travel style preferences', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Skip routes straight to Dashboard without saving preferences
    router.push('/dashboard');
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
    <OnboardingStepShell
      currentStep={1}
      totalSteps={1}
      onNext={handleNext}
      onSkip={handleSkip}
      nextDisabled={selectedStyles.length === 0}
      nextLoading={saving}
    >
      <div className="space-y-6">
        
        {/* Step Headings */}
        <div className="text-center select-none mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary font-serif">
            Tell us about your travel style
          </h2>
          <p className="text-sm text-text-secondary mt-2 leading-normal">
            This helps us personalize your experience
          </p>
        </div>

        {/* 2x3 Grid of Selectable Style Cards */}
        <div className="grid grid-cols-2 gap-4">
          {STYLE_CARDS.map((style) => {
            const isSelected = selectedStyles.includes(style.id);
            const Icon = style.icon;

            return (
              <button
                key={style.id}
                type="button"
                onClick={() => toggleStyle(style.id)}
                className={clsx(
                  "w-full text-left p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 select-none",
                  isSelected
                    ? "border-primary bg-primary-50/40 ring-1 ring-primary/30"
                    : "border-border bg-white hover:border-text-secondary/30 hover:bg-gray-50/50"
                )}
              >
                <div
                  className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200",
                    isSelected ? "bg-primary text-white" : "bg-gray-100 text-text-secondary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={clsx(
                    "text-sm font-semibold tracking-tight leading-snug transition-colors duration-200",
                    isSelected ? "text-primary" : "text-text-primary"
                  )}>
                    {style.label}
                  </h4>
                  <p className="text-xs text-text-secondary mt-1 leading-normal truncate">
                    {style.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </OnboardingStepShell>
  );
}
