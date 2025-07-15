import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface SidebarProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPulse?: boolean;
  segmentCount?: number;
}

export function SidebarProgressBar({
  progress,
  className,
  showPulse = false,
  segmentCount,
}: SidebarProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={cn("relative", className)}>
      {/* Background track (gray line) */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sidebar-border rounded-full" />
      
      {/* Progress fill container */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 overflow-hidden rounded-full">
        {/* Gradient fill - now fills from top to bottom */}
        <motion.div
          className="absolute left-0 top-0 w-full bg-gradient-to-b from-green-600 to-green-500 dark:from-green-500 dark:to-green-400"
          initial={false} // Prevent initial animation flash
          animate={{ height: `${clampedProgress}%` }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 25,
            duration: 0.5,
          }}
          style={{ transformOrigin: "top" }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-green-400/20 dark:bg-green-300/20 blur-sm" />
        </motion.div>
        
        {/* Pulse effect at current progress position */}
        <AnimatePresence>
          {showPulse && clampedProgress > 0 && (
            <motion.div
              className="absolute left-0 w-full bg-green-400 dark:bg-green-300"
              style={{ top: `${clampedProgress}%`, transform: 'translateY(-50%)' }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: [0, 8, 0],
                opacity: [0, 0.6, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1,
                times: [0, 0.5, 1],
                ease: "easeOut",
              }}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Segment markers (optional) */}
      {segmentCount && segmentCount > 1 && (
        <>
          {Array.from({ length: segmentCount - 1 }, (_, i) => (
            <div
              key={i}
              className="absolute left-0 w-0.5 h-px bg-sidebar-border/50"
              style={{ bottom: `${((i + 1) / segmentCount) * 100}%` }}
            />
          ))}
        </>
      )}
    </div>
  );
}

interface SidebarStepProgressProps {
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  className?: string;
}

export function SidebarStepProgress({
  totalSteps,
  completedSteps,
  currentStep: _currentStep,
  className,
}: SidebarStepProgressProps) {
  // Calculate progress percentage - fills to the current step position
  // If on step 0, fill to 20% (1/5), if on step 1, fill to 40% (2/5), etc.
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  // Show pulse when a new step is completed
  const [showPulse, setShowPulse] = React.useState(false);
  const previousCompletedSteps = React.useRef(completedSteps);
  
  React.useEffect(() => {
    if (completedSteps > previousCompletedSteps.current) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      previousCompletedSteps.current = completedSteps;
      return () => clearTimeout(timer);
    }
  }, [completedSteps]);
  
  return (
    <SidebarProgressBar
      progress={progress}
      showPulse={showPulse}
      segmentCount={totalSteps}
      className={className}
    />
  );
}

interface SidebarStepProgressAbsoluteProps {
  targetStepIndex: number;
  className?: string;
  containerSelector?: string;
}

export function SidebarStepProgressAbsolute({ 
  targetStepIndex, 
  className
}: SidebarStepProgressAbsoluteProps) {
  const [targetHeight, setTargetHeight] = React.useState(0);
  const progressRef = React.useRef<HTMLDivElement>(null);
  const [showPulse, setShowPulse] = React.useState(false);
  const previousStepIndex = React.useRef(targetStepIndex);
  const measurementTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const isAnimatingRef = React.useRef(false);
  
  // Debounced measurement function
  const measureTargetHeight = React.useCallback(() => {
    if (measurementTimeoutRef.current) {
      clearTimeout(measurementTimeoutRef.current);
    }
    
    measurementTimeoutRef.current = setTimeout(() => {
      if (!progressRef.current || targetStepIndex < 0 || isAnimatingRef.current) {
        if (targetStepIndex < 0) {
          setTargetHeight(0);
        }
        return;
      }
      
      // Find target element with additional validation
      const targetElement = document.querySelector(`[data-step-index="${targetStepIndex}"]`);
      
      if (!targetElement) {
        // Element might not be rendered yet, retry after a short delay
        setTimeout(() => measureTargetHeight(), 50);
        return;
      }
      
      // Check if element is visible and properly rendered
      const targetRect = targetElement.getBoundingClientRect();
      if (targetRect.height === 0) {
        // Element not fully rendered, retry
        setTimeout(() => measureTargetHeight(), 50);
        return;
      }
      
      const progressRect = progressRef.current.getBoundingClientRect();
      
      // Calculate position relative to the progress bar container
      const relativeBottom = targetRect.bottom - progressRect.top;
      const newHeight = Math.max(0, relativeBottom);
      
      // Only update if there's a meaningful change to prevent unnecessary animations
      setTargetHeight(prev => {
        const diff = Math.abs(newHeight - prev);
        return diff > 2 ? newHeight : prev; // 2px threshold to prevent jitter
      });
    }, 100); // 100ms debounce
  }, [targetStepIndex]);
  
  // Measure step positions
  React.useLayoutEffect(() => {
    // Reset animation flag
    isAnimatingRef.current = false;
    
    if (!progressRef.current || targetStepIndex < 0) {
      setTargetHeight(0);
      return;
    }
    
    // If step index is changing and we're navigating away from an expanded submenu,
    // add a small delay to allow DOM to settle
    const isNavigatingFromSubmenu = previousStepIndex.current !== targetStepIndex && 
                                   document.querySelector('.sortable-analysis-item[data-expanded="true"]');
    
    if (isNavigatingFromSubmenu) {
      // Set animation flag to prevent measurements during transition
      isAnimatingRef.current = true;
      setTimeout(() => {
        isAnimatingRef.current = false;
        measureTargetHeight();
      }, 150); // Wait for submenu collapse animation
    } else {
      measureTargetHeight();
    }
    
    // Show pulse when step changes
    if (targetStepIndex > previousStepIndex.current) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      previousStepIndex.current = targetStepIndex;
      return () => clearTimeout(timer);
    }
    
    previousStepIndex.current = targetStepIndex;
  }, [targetStepIndex, measureTargetHeight]);
  
  // Re-measure on window resize or when submenus expand/collapse
  React.useEffect(() => {
    const handleResize = () => {
      // Use debounced measurement instead of direct calculation
      measureTargetHeight();
    };
    
    // Debounced resize handler
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    // Optimized MutationObserver - only watch for relevant changes
    const observer = new MutationObserver((mutations) => {
      let shouldMeasure = false;
      
      for (const mutation of mutations) {
        // Only care about attribute changes that affect layout
        if (mutation.type === 'attributes') {
          const target = mutation.target as Element;
          if (mutation.attributeName === 'data-expanded' || 
              mutation.attributeName === 'class' ||
              (mutation.attributeName === 'style' && (target as HTMLElement).style?.height)) {
            shouldMeasure = true;
            break;
          }
        }
        // Or DOM structure changes in sidebar menu areas
        else if (mutation.type === 'childList') {
          const target = mutation.target as Element;
          if (target.closest('[data-sidebar="menu"]') || target.closest('[data-sidebar="menu-sub"]')) {
            shouldMeasure = true;
            break;
          }
        }
      }
      
      if (shouldMeasure && !isAnimatingRef.current) {
        handleResize();
      }
    });
    
    if (progressRef.current) {
      const container = document.querySelector('[data-sidebar="content"]') || 
                       progressRef.current.closest('.sidebar-content');
      if (container) {
        observer.observe(container, { 
          childList: true, 
          subtree: true, 
          attributes: true,
          attributeFilter: ['class', 'style', 'data-expanded']
        });
      }
    }
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
      observer.disconnect();
      if (measurementTimeoutRef.current) {
        clearTimeout(measurementTimeoutRef.current);
      }
    };
  }, [targetStepIndex, measureTargetHeight]);
  
  return (
    <div ref={progressRef} className={cn("absolute left-0 top-0 bottom-0", className)}>
      {/* Background track */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sidebar-border rounded-full" />
      
      {/* Progress fill to exact position */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 overflow-hidden rounded-full">
        <motion.div
          className="absolute left-0 top-0 w-full bg-gradient-to-b from-green-600 to-green-500 dark:from-green-500 dark:to-green-400"
          initial={false} // Prevent initial animation flash
          animate={{ 
            height: targetHeight > 0 ? targetHeight : 0,
            // Ensure animation always comes from current position, not from bottom
            originY: 0 
          }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 25,
            duration: 0.5,
          }}
          style={{ 
            height: targetHeight,
            transformOrigin: "top" // Ensure scaling happens from top
          }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-green-400/20 dark:bg-green-300/20 blur-sm" />
        </motion.div>
        
        {/* Pulse effect at current position */}
        <AnimatePresence>
          {showPulse && targetHeight > 0 && (
            <motion.div
              className="absolute left-0 w-full bg-green-400 dark:bg-green-300"
              style={{ top: targetHeight - 4, transform: 'translateY(-50%)' }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: [0, 8, 0],
                opacity: [0, 0.6, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1,
                times: [0, 0.5, 1],
                ease: "easeOut",
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}