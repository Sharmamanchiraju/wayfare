import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AvatarProps {
  src?: string;
  fallback: string;
  status?: 'online' | 'offline' | 'busy' | 'none';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  fallback,
  status = 'none',
  size = 'md',
  className
}) => {
  return (
    <div className={twMerge("relative inline-block select-none", className)}>
      {/* Circle Container */}
      <div
        className={clsx(
          "rounded-full bg-primary-50 border border-primary-200/50 flex items-center justify-center font-bold text-primary overflow-hidden",
          size === 'sm' && "w-8 h-8 text-xs",
          size === 'md' && "w-10 h-10 text-sm",
          size === 'lg' && "w-14 h-14 text-lg"
        )}
      >
        {src ? (
          <img src={src} alt={fallback} className="w-full h-full object-cover" />
        ) : (
          <span>{fallback}</span>
        )}
      </div>

      {/* Status indicator dot */}
      {status !== 'none' && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 rounded-full border-2 border-white ring-0 block",
            size === 'sm' && "w-2.5 h-2.5",
            size === 'md' && "w-3 h-3",
            size === 'lg' && "w-4 h-4",
            status === 'online' && "bg-success",
            status === 'busy' && "bg-pending",
            status === 'offline' && "bg-text-secondary"
          )}
        />
      )}
    </div>
  );
};
