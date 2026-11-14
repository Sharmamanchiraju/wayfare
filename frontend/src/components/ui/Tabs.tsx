import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'pill'
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1",
          variant === 'pill' ? "bg-gray-100/70 p-1.5 rounded-xl border border-gray-200/50" : "border-b border-border w-full"
        ),
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              "px-4.5 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer select-none",
              variant === 'pill'
                ? clsx(
                    "rounded-lg",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-gray-200/30"
                  )
                : clsx(
                    "border-b-2 px-1 pb-3 -mb-1",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  )
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
