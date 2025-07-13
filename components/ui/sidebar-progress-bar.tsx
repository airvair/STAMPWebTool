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
          initial={{ height: '0%' }}
          animate={{ height: `${clampedProgress}%` }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            duration: 0.6,
          }}
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
  className,
  containerSelector = '[data-sidebar="menu-sub"]'
}: SidebarStepProgressAbsoluteProps) {
  const [targetHeight, setTargetHeight] = React.useState(0);
  const progressRef = React.useRef<HTMLDivElement>(null);
  const [showPulse, setShowPulse] = React.useState(false);
  const previousStepIndex = React.useRef(targetStepIndex);
  
  // Measure step positions
  React.useLayoutEffect(() => {
    if (!progressRef.current || targetStepIndex < 0) {
      setTargetHeight(0);
      return;
    }
    
    // Wait for next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (!progressRef.current) return;
      
      // Find all step elements in the document
      const targetElement = document.querySelector(`[data-step-index="${targetStepIndex}"]`);
      
      if (!targetElement) {
        console.warn(`No element found with data-step-index="${targetStepIndex}"`);
        return;
      }
      
      // Calculate position relative to the progress bar container
      const progressRect = progressRef.current.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      
      // Get the bottom of the target step relative to progress bar top
      const relativeBottom = targetRect.bottom - progressRect.top;
      setTargetHeight(Math.max(0, relativeBottom));
    });
    
    // Show pulse when step changes
    if (targetStepIndex > previousStepIndex.current) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      previousStepIndex.current = targetStepIndex;
      return () => clearTimeout(timer);
    }
  }, [targetStepIndex, containerSelector]);
  
  // Re-measure on window resize or when submenus expand/collapse
  React.useEffect(() => {
    const handleResize = () => {
      // Re-trigger measurement
      if (progressRef.current && targetStepIndex >= 0) {
        const targetElement = document.querySelector(`[data-step-index="${targetStepIndex}"]`);
        if (!targetElement) return;
        
        const progressRect = progressRef.current.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const relativeBottom = targetRect.bottom - progressRect.top;
        setTargetHeight(Math.max(0, relativeBottom));
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Use MutationObserver to detect DOM changes (like submenu expansion)
    const observer = new MutationObserver(handleResize);
    if (progressRef.current) {
      const container = document.querySelector('[data-sidebar="content"]') || 
                       progressRef.current.closest('.sidebar-content');
      if (container) {
        observer.observe(container, { 
          childList: true, 
          subtree: true, 
          attributes: true,
          attributeFilter: ['class', 'style']
        });
      }
    }
    
    // Trigger initial measurement
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [targetStepIndex]);
  
  return (
    <div ref={progressRef} className={cn("absolute left-0 top-0 bottom-0", className)}>
      {/* Background track */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sidebar-border rounded-full" />
      
      {/* Progress fill to exact position */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 overflow-hidden rounded-full">
        <motion.div
          className="absolute left-0 top-0 w-full bg-gradient-to-b from-green-600 to-green-500 dark:from-green-500 dark:to-green-400"
          initial={{ height: 0 }}
          animate={{ height: targetHeight > 0 ? targetHeight : 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            duration: 0.6,
          }}
          style={{ height: targetHeight }}
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