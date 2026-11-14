import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SidebarNavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  activeIcon?: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  icon: Icon,
  activeIcon: ActiveIcon,
  label,
  active = false,
  onClick,
  className,
  disabled = false,
  loading = false
}) => {
  const IconComponent = active && ActiveIcon ? ActiveIcon : Icon;

  return (
    <button
      type="button"
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={twMerge(
        clsx(
          "w-full flex items-center gap-3.5 py-3 px-4 text-sm font-semibold transition-all duration-300 ease-out cursor-pointer select-none rounded-xl relative group",
          active
            ? "text-text-primary bg-primary-50/40 font-bold"
            : "text-text-secondary hover:text-text-primary hover:bg-gray-100/50",
          (disabled || loading) && "opacity-50 cursor-not-allowed pointer-events-none"
        ),
        className
      )}
    >
      {/* Sunset Amber left accent bar */}
      <span
        className={clsx(
          "absolute left-0 top-3 bottom-3 w-1 rounded-r-md transition-all duration-300 ease-out",
          active ? "bg-primary opacity-100" : "bg-transparent opacity-0 group-hover:bg-primary/50 group-hover:opacity-100"
        )}
      />

      {loading ? (
        <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin shrink-0" />
      ) : (
        <IconComponent
          className={clsx(
            "w-5 h-5 shrink-0 transition-all duration-300 ease-out",
            active ? "text-primary fill-primary" : "text-text-secondary group-hover:text-text-primary"
          )}
        />
      )}

      <span className="truncate leading-none">
        {label}
      </span>
    </button>
  );
};
