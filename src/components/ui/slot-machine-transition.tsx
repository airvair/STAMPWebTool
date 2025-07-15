import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface SlotMachineTransitionProps {
  children: React.ReactNode;
  isAnimating: boolean;
  direction?: 'up' | 'down';
  duration?: number;
  className?: string;
}

export const SlotMachineTransition: React.FC<SlotMachineTransitionProps> = ({
  children,
  isAnimating,
  direction = 'up',
  duration = 600,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isAnimating) {
      setAnimationClass(direction === 'up' ? 'slot-machine-up' : 'slot-machine-down');
      
      const timer = setTimeout(() => {
        setAnimationClass('');
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isAnimating, direction, duration]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        animationClass,
        className
      )}
      style={{
        '--slot-duration': `${duration}ms`
      } as React.CSSProperties}
    >
      <div className="slot-machine-content">
        {children}
      </div>
    </div>
  );
};

export default SlotMachineTransition;