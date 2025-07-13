import * as React from 'react';
import { motion, AnimatePresence, Easing } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedCollapsibleProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
  ease?: Easing | Easing[];
  staggerChildren?: number;
  disableAnimation?: boolean;
}

export function AnimatedCollapsible({
  isOpen,
  children,
  className,
  duration = 0.3,
  ease = [0.4, 0, 0.2, 1], // easeOut equivalent
  staggerChildren = 0.05,
  disableAnimation = false,
}: AnimatedCollapsibleProps) {
  // Check for reduced motion preference and drag state
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDragging = typeof window !== 'undefined' && document.body.classList.contains('sortable-dragging');
  const shouldDisableAnimation = prefersReducedMotion || disableAnimation || isDragging;
  const animationDuration = shouldDisableAnimation ? 0.05 : duration;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{
            height: 0,
            opacity: 0,
          }}
          animate={{
            height: 'auto',
            opacity: 1,
          }}
          exit={{
            height: 0,
            opacity: 0,
          }}
          transition={{
            height: {
              duration: animationDuration,
              ease,
            },
            opacity: {
              duration: animationDuration * 0.8,
              ease,
            },
          }}
          className={cn('overflow-hidden', className)}
          style={{ willChange: 'height, opacity' }}
        >
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: {
                transition: {
                  staggerChildren: shouldDisableAnimation ? 0 : staggerChildren,
                  delayChildren: shouldDisableAnimation ? 0 : animationDuration * 0.2,
                },
              },
              closed: {
                transition: {
                  staggerChildren: shouldDisableAnimation ? 0 : staggerChildren * 0.5,
                  staggerDirection: -1,
                },
              },
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Animated item for use inside AnimatedCollapsible
export function AnimatedCollapsibleItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDragging = typeof window !== 'undefined' && document.body.classList.contains('sortable-dragging');
  
  // Disable motion for draggable items or during drag operations
  const isDraggableItem = typeof window !== 'undefined' && 
    (children as any)?.props?.className?.includes?.('analysis-item');
  
  const shouldDisableMotion = isDraggableItem || isDragging;
  
  if (shouldDisableMotion) {
    // Return plain div for draggable items to avoid motion conflicts
    return (
      <div className={className} style={{ pointerEvents: 'auto' }}>
        {children}
      </div>
    );
  }
  
  return (
    <motion.div
      variants={{
        open: {
          y: 0,
          opacity: 1,
          scale: 1,
        },
        closed: {
          y: prefersReducedMotion ? 0 : -10,
          opacity: 0,
          scale: prefersReducedMotion ? 1 : 0.95,
        },
      }}
      transition={{
        duration: prefersReducedMotion ? 0.05 : 0.2,
        ease: [0.4, 0, 0.2, 1], // easeOut equivalent
      }}
      className={className}
      style={{ pointerEvents: 'auto' }}
    >
      {children}
    </motion.div>
  );
}

// Animated chevron component
export function AnimatedChevron({ isOpen, className }: { isOpen: boolean; className?: string }) {
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return (
    <motion.div
      animate={{ rotate: isOpen ? 90 : 0 }}
      transition={{ 
        duration: prefersReducedMotion ? 0.05 : 0.2, 
        ease: [0.4, 0, 0.2, 1] // easeOut equivalent
      }}
      className={className}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
      >
        <path
          d="M4.5 3L7.5 6L4.5 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}