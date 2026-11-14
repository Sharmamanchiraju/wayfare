"use client";

import { use, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Compass, Sparkles, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { AppShell, Card, Button } from '@/components/ui';
import { clsx } from 'clsx';

const GENERATION_STEPS = [
  "Analyzing your preferences",
  "Finding the best destinations",
  "Checking weather conditions",
  "Searching top activities",
  "Finding best accommodation",
  "Calculating budget",
  "Finalizing your itinerary"
];

export default function GeneratingPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tripId = parseInt(resolvedParams.id, 10);
  
  const { isAuthenticated, loading: authLoading, logout, user } = useAuth();
  const { sendMessage, trip } = useChat(tripId);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Loading steps simulation state
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<Array<'pending' | 'loading' | 'completed'>>(
    GENERATION_STEPS.map((_, idx) => (idx === 0 ? 'loading' : 'pending'))
  );
  
  const [isSent, setIsSent] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const hasTriggeredRef = useRef(false);

  // Parse parameters from query string
  const destination = searchParams.get('destination') || 'your destination';
  const days = searchParams.get('days') || '5';
  const budget = searchParams.get('budget') || '150,000';
  const groupType = searchParams.get('groupType') || 'couple';

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle plan generation trigger on backend
  const triggerGeneration = async () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    setIsSent(true);
    setErrorState(null);
    setActiveStepIndex(0);
    setStepStatuses(GENERATION_STEPS.map((_, idx) => (idx === 0 ? 'loading' : 'pending')));
    
    try {
      const promptText = `Yes, please! Generate the ${days}-day itinerary to ${destination} for a ${groupType} with budget ${budget}.`;
      await sendMessage(promptText);
    } catch (err: any) {
      console.error('Failed to trigger itinerary plan generation', err);
      setErrorState('Connection failed. Unable to reach the AI planner.');
      setIsSent(false);
      hasTriggeredRef.current = false;
    }
  };

  useEffect(() => {
    if (tripId && !isSent && !errorState && !hasTriggeredRef.current) {
      triggerGeneration();
    }
  }, [tripId, isSent, errorState]);

  // Simulate sequential steps on timer
  useEffect(() => {
    if (errorState) return;

    const stepDuration = 800; // time per step in ms
    const interval = setInterval(() => {
      setActiveStepIndex((prevIndex) => {
        if (prevIndex < GENERATION_STEPS.length) {
          const nextIndex = prevIndex + 1;
          
          setStepStatuses((prevStatuses) => {
            const nextStatuses = [...prevStatuses];
            // Mark current index as completed
            if (prevIndex < GENERATION_STEPS.length) {
              nextStatuses[prevIndex] = 'completed';
            }
            // Mark next index as loading
            if (nextIndex < GENERATION_STEPS.length) {
              nextStatuses[nextIndex] = 'loading';
            }
            return nextStatuses;
          });

          return nextIndex;
        } else {
          clearInterval(interval);
          return prevIndex;
        }
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [errorState]);

  // Handle redirection once all steps are completed successfully
  useEffect(() => {
    if (activeStepIndex >= GENERATION_STEPS.length && !errorState) {
      const timer = setTimeout(() => {
        router.push(`/trips/${tripId}/itinerary`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeStepIndex, errorState, tripId, router]);

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

  // Show "Almost there! ✨" trailing text when step index is near complete (5 or 6)
  const showAlmostThere = activeStepIndex >= 5 && activeStepIndex < GENERATION_STEPS.length;

  return (
    <AppShell
      activeItem="AI Assistant"
      userName={user?.username}
      userEmail={user?.email}
      onLogout={logout}
    >
      {/* Centered single-column loading box inside AppShell workspace */}
      <div className="max-w-xl mx-auto py-4 select-none">
        
        {errorState ? (
          /* Error State Panel */
          <Card className="p-8 md:p-10 shadow-sm border border-border bg-white rounded-2xl text-center space-y-6 animate-fade-in text-left">
            <div className="w-14 h-14 rounded-full bg-error-bg text-error flex items-center justify-center mx-auto border border-error/20">
              <AlertCircle className="w-7 h-7 text-error" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-text-primary">
                Generation Failed
              </h2>
              <p className="text-sm text-text-secondary">
                {errorState} Please try running the generation again.
              </p>
            </div>

            <Button
              onClick={triggerGeneration}
              variant="primary"
              className="w-full h-11 text-xs font-bold gap-2 cursor-pointer shadow-md shadow-primary-500/10 justify-center"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </Button>
          </Card>
        ) : (
          /* Loading State Panel */
          <Card className="p-8 md:p-10 shadow-sm border border-border bg-white rounded-2xl text-center space-y-8 animate-fade-in">
            
            {/* Illustration image container */}
            <div className="w-full max-w-[240px] aspect-square rounded-2xl overflow-hidden mx-auto border border-border bg-gray-50/50 shadow-2xs">
              <img 
                src="/generating_illustration.png" 
                alt="Traveler throwing a paper airplane with hot air balloons" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Header info */}
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-text-primary leading-tight">
                Creating your perfect trip...
              </h1>
              <p className="text-xs font-semibold text-text-secondary">
                This may take a few seconds
              </p>
            </div>

            {/* Simulated steps list checkmarks */}
            <div className="border border-border rounded-2xl p-5 bg-gray-50/40 text-left space-y-3.5">
              {GENERATION_STEPS.map((step, index) => {
                const status = stepStatuses[index];
                const isDone = status === 'completed';
                const isLoading = status === 'loading';
                const isPending = status === 'pending';

                return (
                  <div 
                    key={step}
                    className={clsx(
                      "flex items-center gap-3.5 text-xs transition-colors duration-300",
                      isDone ? "text-text-primary font-medium" : isLoading ? "text-primary font-bold animate-pulse" : "text-text-secondary/40"
                    )}
                  >
                    {/* Status circle badge */}
                    <div className={clsx(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300",
                      isDone 
                        ? "bg-success border-success text-white" 
                        : isLoading 
                        ? "border-primary text-primary" 
                        : "border-border text-transparent"
                    )}>
                      {isDone ? (
                        <Check className="w-3 h-3" strokeWidth={3} />
                      ) : isLoading ? (
                        <Loader2 className="w-3 h-3 text-primary animate-spin" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-border" />
                      )}
                    </div>
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>

            {/* Trailing progress notification */}
            <div className="h-6 flex items-center justify-center select-none">
              {showAlmostThere && (
                <p className="text-xs font-bold text-primary animate-bounce">
                  Almost there! ✨
                </p>
              )}
            </div>

          </Card>
        )}

      </div>
    </AppShell>
  );
}
