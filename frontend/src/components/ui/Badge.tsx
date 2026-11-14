import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 
    | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'accent'
    | 'confirmed' | 'pending' | 'cancelled' | 'recommended';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'primary', children, ...props }) => {
  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border transition-colors duration-200",
          // Primary/Recommended (Indigo)
          (variant === 'primary' || variant === 'recommended') && "bg-primary-50 text-primary border-primary-200",
          
          // Success/Confirmed/Accent (Teal/Green)
          (variant === 'success' || variant === 'confirmed' || variant === 'accent') && "bg-success-bg text-success-text border-success/30",
          
          // Warning/Pending (Amber)
          (variant === 'warning' || variant === 'pending') && "bg-pending-bg text-pending-text border-pending/30",
          
          // Error/Cancelled (Red)
          (variant === 'error' || variant === 'cancelled') && "bg-error-bg text-error-text border-error/30",
          
          // Info (Sky Blue)
          variant === 'info' && "bg-info-bg text-info-text border-info/30",
          
          // Secondary (Muted gray)
          variant === 'secondary' && "bg-gray-50 text-text-secondary border-border"
        ),
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
