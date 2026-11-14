import React from 'react';
import { Compass } from 'lucide-react';
import { AuthShell } from './AuthShell';

export interface OnboardingStepShellProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  onNext: () => void;
  onSkip: () => void;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  title?: string;
  subtitle?: string;
}

export const OnboardingStepShell: React.FC<OnboardingStepShellProps> = ({
  currentStep,
  totalSteps,
  children,
  onNext,
  onSkip,
  nextDisabled = false,
  nextLoading = false,
  title = "Your Journey Begins Here",
  subtitle = "Plan better, travel smarter, create memories."
}) => {
  const progressPercent = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <AuthShell progressPercent={progressPercent} maxWidth="xl">
      {/* Brand logo lockup centered on all screens inside the card */}
      <div className="flex flex-col items-center justify-center gap-2 mb-8 select-none">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md text-white">
          <Compass className="w-5.5 h-5.5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-text-primary font-serif">TripPlanner</span>
        </div>
      </div>

      {/* Child step components */}
      {children}

      {/* Bottom Row Navigation Buttons */}
      <div className="flex justify-between items-center pt-8 border-t border-border/60 mt-8 select-none">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          Skip
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
          className="h-10 px-6 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold rounded-xl shadow-md shadow-primary-500/10 cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
        >
          {nextLoading && (
            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          <span>Next</span>
        </button>
      </div>
    </AuthShell>
  );
};
