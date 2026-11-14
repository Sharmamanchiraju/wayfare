import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'error' | 'warning' | 'success';
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({ className, variant = 'default', title, children, ...props }) => {
  const getIcon = () => {
    switch (variant) {
      case 'error':
        return <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-semantic" />;
      case 'warning':
        return <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-semantic" />;
      case 'success':
        return <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-green-semantic" />;
      default:
        return <Info className="h-4.5 w-4.5 shrink-0 text-accent" />;
    }
  };

  return (
    <div
      className={twMerge(
        clsx(
          "flex gap-3 rounded-lg p-4 border text-sm text-foreground",
          variant === 'default' && "bg-muted/50 border-border",
          variant === 'error' && "bg-red-semantic/10 border-red-semantic/20",
          variant === 'warning' && "bg-amber-semantic/10 border-amber-semantic/20",
          variant === 'success' && "bg-green-semantic/10 border-green-semantic/20"
        ),
        className
      )}
      {...props}
    >
      {getIcon()}
      <div className="flex-1 space-y-1 text-left">
        {title && <h5 className="font-semibold leading-none tracking-tight">{title}</h5>}
        {children && <div className="text-sm opacity-90">{children}</div>}
      </div>
    </div>
  );
};
