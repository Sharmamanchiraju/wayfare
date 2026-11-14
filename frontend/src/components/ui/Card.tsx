import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl?: string;
  imageAlt?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, imageUrl, imageAlt = 'Card Image', children, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge(
        "rounded-2xl border border-border bg-white text-text-primary shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-200 hover:shadow-[0_4px_24px_-2px_rgba(0,0,0,0.08)]",
        className
      )}
      {...props}
    >
      {imageUrl && (
        <div className="w-full h-48 overflow-hidden relative">
          <img 
            src={imageUrl} 
            alt={imageAlt} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
          />
        </div>
      )}
      {children}
    </div>
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={twMerge("text-lg font-semibold leading-none tracking-tight text-text-primary", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={twMerge("text-sm text-text-secondary", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={twMerge("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge("flex items-center p-6 pt-0 border-t border-border mt-4", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";
