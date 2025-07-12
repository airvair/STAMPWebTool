import React, { useState, useRef, useCallback } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Button } from './button';

interface HoldToDeleteButtonProps {
  onDelete: () => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  holdDuration?: number; // Duration in milliseconds, defaults to 3000
}

export const HoldToDeleteButton: React.FC<HoldToDeleteButtonProps> = ({
  onDelete,
  className = '',
  disabled = false,
  children,
  holdDuration = 3000,
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleStart = useCallback(() => {
    if (disabled) return;
    
    setIsHolding(true);
    setProgress(0);
    startTimeRef.current = Date.now();

    // Update progress every 16ms (~60fps) for smooth animation
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
      setProgress(newProgress);
    }, 16);

    // Complete action after hold duration
    timeoutRef.current = setTimeout(() => {
      clearTimers();
      setIsHolding(false);
      setProgress(0);
      onDelete();
    }, holdDuration);
  }, [disabled, holdDuration, onDelete, clearTimers]);

  const handleEnd = useCallback(() => {
    if (!isHolding) return;
    
    clearTimers();
    setIsHolding(false);
    setProgress(0);
  }, [isHolding, clearTimers]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`relative overflow-hidden transition-colors duration-200 ${
        isHolding 
          ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20' 
          : 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
      } ${className}`}
      disabled={disabled}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
    >
      {/* Progress fill background */}
      <div 
        className="absolute inset-0 bg-red-200 dark:bg-red-800/30 transition-transform duration-75 ease-linear origin-left"
        style={{ 
          transform: `scaleX(${progress / 100})`,
          transformOrigin: 'left center'
        }}
      />
      
      {/* Button content */}
      <div className="relative flex items-center gap-1.5">
        <TrashIcon className="w-4 h-4" />
        {children && <span>{children}</span>}
      </div>
    </Button>
  );
};

export default HoldToDeleteButton;