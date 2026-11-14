import React from 'react';
import Image from 'next/image';
import { Compass } from 'lucide-react';
import { clsx } from 'clsx';

interface AuthShellProps {
  children: React.ReactNode;
  progressPercent?: number;
  maxWidth?: 'md' | 'lg' | 'xl';
}

const BACKGROUND_IMAGES = [
  '/login_background.png',
  '/kyoto.png',
  '/paris.png',
  '/swiss_alps.png',
  '/bali.png',
];

export const AuthShell: React.FC<AuthShellProps> = ({
  children,
  progressPercent,
  maxWidth = 'md'
}) => {
  const [activeIdx, setActiveIdx] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 10000); // 10s slide duration
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative overflow-hidden bg-[#1E1B4B] text-text-primary">
      {/* LAYER 1 — DESTINATION SLIDESHOW */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
        {BACKGROUND_IMAGES.map((src, index) => (
          <div
            key={src}
            className={clsx(
              "absolute inset-0 transition-opacity duration-1500 ease-in-out slideshow-slide",
              index === activeIdx ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            <Image 
              src={src} 
              alt="Travel destination background" 
              fill
              priority={index === 0 || index === 1}
              quality={95}
              sizes="100vw"
              className={clsx(
                "object-cover",
                index === activeIdx && "animate-slide-kenburns"
              )}
            />
          </div>
        ))}
      </div>

      {/* Twilight Indigo gradient overlays */}
      <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,rgba(30,27,75,0.15)_0%,rgba(30,27,75,0.5)_60%,rgba(30,27,75,0.75)_100%)] mix-blend-multiply pointer-events-none" />
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#1E1B4B]/80 via-transparent to-transparent pointer-events-none" />

      {/* Form Card */}
      <div 
        className={clsx(
          "w-full bg-[#FBF8F3] border border-border/40 rounded-2xl p-6 sm:p-10 md:p-12",
          "shadow-[0_2px_8px_rgba(36,34,46,0.08),0_24px_64px_rgba(46,42,92,0.25)] relative z-30",
          {
            'max-w-md': maxWidth === 'md',
            'max-w-lg': maxWidth === 'lg',
            'max-w-xl': maxWidth === 'xl',
          }
        )}
      >
        {/* Onboarding thin horizontal progress bar (if applicable) */}
        {progressPercent !== undefined && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 overflow-hidden rounded-t-2xl z-30">
            <div 
              className="bg-primary h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Passport Stamp Corner Mark */}
        <div className="absolute -top-7 -right-3 md:-top-9 md:-right-4 w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#FBF8F3] border-2 border-primary/20 flex items-center justify-center rotate-[15deg] shadow-[0_2px_10px_rgba(0,0,0,0.05)] select-none pointer-events-none z-10">
          <div className="w-11 h-11 md:w-13 md:h-13 rounded-full border border-dashed border-primary/30 flex items-center justify-center">
            <Compass className="w-6 h-6 text-primary/45" strokeWidth={1.75} />
          </div>
        </div>

        {/* Card Content */}
        {children}
      </div>
    </div>
  );
};
