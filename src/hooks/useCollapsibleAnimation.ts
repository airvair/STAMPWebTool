import { useAnimate, AnimationScope, Easing } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface UseCollapsibleAnimationOptions {
  isOpen: boolean;
  duration?: number;
  ease?: Easing | Easing[];
}

export function useCollapsibleAnimation({
  isOpen,
  duration = 0.3,
  ease = [0.4, 0, 0.2, 1], // easeOut equivalent
}: UseCollapsibleAnimationOptions): [AnimationScope<any>, boolean] {
  const [scope, animate] = useAnimate();
  const [isAnimating, setIsAnimating] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const runAnimation = async () => {
      setIsAnimating(true);

      if (isOpen) {
        // Opening animation
        await animate(
          scope.current,
          {
            height: 'auto',
            opacity: 1,
            scale: 1,
          },
          {
            duration,
            ease,
            // Start from collapsed state
            from: {
              height: 0,
              opacity: 0,
              scale: 0.95,
            },
          }
        );
      } else {
        // Closing animation
        await animate(
          scope.current,
          {
            height: 0,
            opacity: 0,
            scale: 0.95,
          },
          {
            duration,
            ease,
          }
        );
      }

      setIsAnimating(false);
    };

    runAnimation();
  }, [isOpen, scope, animate, duration, ease]);

  return [scope, isAnimating];
}

// Hook for animating chevron rotation
export function useChevronAnimation(isOpen: boolean, duration = 0.2) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    animate(
      scope.current,
      {
        rotate: isOpen ? 90 : 0,
      },
      {
        duration,
        ease: 'easeOut',
      }
    );
  }, [isOpen, scope, animate, duration]);

  return scope;
}
