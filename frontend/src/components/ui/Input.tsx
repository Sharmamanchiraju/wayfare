import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, type = 'text', leftIcon, rightIcon, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full text-left">
        {label && (
          <label className="block text-sm font-semibold text-text-primary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-text-secondary pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={twMerge(
              clsx(
                "flex h-11 w-full rounded-xl border border-border bg-white py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
                leftIcon ? "pl-11" : "pl-4",
                isPassword || rightIcon ? "pr-11" : "pr-4",
                error ? "border-error focus:ring-error/25 focus:border-error" : ""
              ),
              className
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-text-secondary hover:text-text-primary focus:outline-none cursor-pointer flex items-center justify-center"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          ) : rightIcon ? (
            <div className="absolute right-3.5 text-text-secondary pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          ) : null}
        </div>
        {error && (
          <p className="mt-1.5 text-xs font-medium text-error">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
