import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Check } from 'lucide-react';

export interface ProgressStepperProps {
  steps: string[];
  currentStep: number; // 0-indexed
  className?: string;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStep,
  className
}) => {
  return (
    <div className={twMerge("w-full py-4", className)}>
      {/* Top absolute bar indicator */}
      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-6.5">
        <div 
          className="bg-primary h-full transition-all duration-500 ease-out" 
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step nodes with lines */}
      <div className="flex justify-between items-center relative w-full px-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div 
              key={index} 
              className={clsx(
                "flex flex-col items-center flex-1 relative",
                index === 0 ? "items-start" : index === steps.length - 1 ? "items-end" : "items-center"
              )}
            >
              {/* Node Icon */}
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 z-10 shadow-sm border",
                  isCompleted 
                    ? "bg-primary text-white border-primary" 
                    : isActive 
                    ? "bg-white text-primary border-primary ring-4 ring-primary/10" 
                    : "bg-white text-text-secondary border-border"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </div>

              {/* Node Label */}
              <span
                className={clsx(
                  "text-xs mt-2.5 font-bold tracking-tight whitespace-nowrap",
                  isActive ? "text-primary" : isCompleted ? "text-text-primary" : "text-text-secondary"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
