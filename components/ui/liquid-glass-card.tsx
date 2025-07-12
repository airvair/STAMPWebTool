import React from 'react';
import { cn } from '@/lib/utils';

interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const LiquidGlassCard = React.forwardRef<HTMLDivElement, LiquidGlassCardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-white/10 dark:bg-neutral-900/10",
          "backdrop-blur-xl backdrop-saturate-150",
          "border border-white/20 dark:border-white/10",
          "shadow-xl shadow-black/5",
          "before:absolute before:inset-0",
          "before:bg-gradient-to-br before:from-white/10 before:to-transparent",
          "before:pointer-events-none",
          "transition-all duration-300",
          "hover:bg-white/15 dark:hover:bg-neutral-900/15",
          "hover:shadow-2xl hover:shadow-black/10",
          "hover:border-white/30 dark:hover:border-white/20",
          className
        )}
        {...props}
      >
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

LiquidGlassCard.displayName = 'LiquidGlassCard';