import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse rounded bg-gray-200 ${className}`} 
      style={{ animationDuration: '1.5s' }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-border bg-white p-5 rounded-2xl space-y-4 select-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
      <Skeleton className="h-44 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function TextSkeleton() {
  return (
    <div className="space-y-2.5">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-5/6" />
      <Skeleton className="h-3.5 w-2/3" />
    </div>
  );
}
