import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ChipSelectorProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ChipSelector: React.FC<ChipSelectorProps> = ({
  icon,
  label,
  description,
  selected = false,
  onClick,
  className
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={twMerge(
        clsx(
          "w-full text-left p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 select-none",
          selected
            ? "border-primary bg-primary-50/40 ring-1 ring-primary/30"
            : "border-border bg-white hover:border-text-secondary/30 hover:bg-gray-50/50"
        ),
        className
      )}
    >
      {icon && (
        <div
          className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200",
            selected ? "bg-primary text-white" : "bg-gray-100 text-text-secondary"
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className={clsx(
          "text-sm font-semibold tracking-tight leading-snug transition-colors duration-200",
          selected ? "text-primary" : "text-text-primary"
        )}>
          {label}
        </h4>
        {description && (
          <p className="text-xs text-text-secondary mt-1 leading-normal">
            {description}
          </p>
        )}
      </div>
    </button>
  );
};
