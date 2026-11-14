import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'solid' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'xl' | 'full';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', rounded = 'xl', loading, children, ...props }, ref) => {
    // Map compatible variants
    const isSolid = variant === 'primary' || variant === 'solid';
    const isOutline = variant === 'secondary' || variant === 'outline';

    return (
      <button
        ref={ref}
        disabled={loading || props.disabled}
        className={twMerge(
          clsx(
            "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98]",
            // Rounded shapes
            rounded === 'xl' ? "rounded-xl" : "rounded-full",
            // Variant styling
            isSolid && "bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 border border-transparent",
            isOutline && "border border-border bg-white text-text-primary hover:bg-app-bg hover:border-text-secondary/30",
            variant === 'ghost' && "bg-transparent text-text-secondary hover:bg-gray-100 hover:text-text-primary",
            variant === 'danger' && "bg-error text-white hover:bg-error-text border border-transparent shadow-sm",
            // Size styling
            size === 'sm' && "h-8 px-3 text-xs",
            size === 'md' && "h-10 px-4.5 text-sm",
            size === 'lg' && "h-12 px-6 text-base"
          ),
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
