import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface StatTileProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
  };
}

export const StatTile: React.FC<StatTileProps> = ({
  icon,
  label,
  value,
  className,
  trend
}) => {
  return (
    <div
      className={twMerge(
        "bg-white border border-border rounded-2xl p-5 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-[0_4px_24px_-2px_rgba(0,0,0,0.08)]",
        className
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {label}
          </p>
          <h3 className="text-2xl font-bold text-text-primary mt-1 tracking-tight truncate">
            {value}
          </h3>
        </div>
      </div>
      {trend && (
        <div
          className={clsx(
            "text-xs font-semibold px-2 py-1 rounded-full shrink-0",
            trend.isPositive ? "bg-success-bg text-success-text" : "bg-error-bg text-error-text"
          )}
        >
          {trend.isPositive ? '+' : ''}
          {trend.value}
        </div>
      )}
    </div>
  );
};
