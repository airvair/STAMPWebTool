/**
 * Optimized State Management Hooks
 * Performance-optimized hooks for React components
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { debounce, throttle, BatchProcessor } from '@/utils/performance-optimizer';

/**
 * Hook for debounced state updates
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  const debouncedSetValue = useMemo(
    () => debounce((newValue: T) => setDebouncedValue(newValue), delay),
    [delay]
  );

  const updateValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      debouncedSetValue(newValue);
    },
    [debouncedSetValue]
  );

  return [value, debouncedValue, updateValue];
}

/**
 * Hook for throttled state updates
 */
export function useThrottledState<T>(
  initialValue: T,
  limit: number = 100
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);

  const throttledSetValue = useMemo(
    () => throttle((newValue: T) => setValue(newValue), limit),
    [limit]
  );

  return [value, throttledSetValue];
}

/**
 * Hook for batched state updates
 */
export function useBatchedState<T extends { id: string }>(
  initialItems: T[] = []
): {
  items: T[];
  addItem: (item: T) => void;
  addItems: (items: T[]) => void;
  updateItem: (id: string, updates: Partial<T>) => void;
  removeItem: (id: string) => void;
  flush: () => void;
} {
  const [items, setItems] = useState<T[]>(initialItems);
  const batchProcessorRef = useRef<BatchProcessor<{ type: string; payload: any }> | undefined>(
    undefined
  );

  useEffect(() => {
    batchProcessorRef.current = new BatchProcessor<{ type: string; payload: any }>(updates => {
      setItems(prevItems => {
        let newItems = [...prevItems];

        updates.forEach(update => {
          switch (update.type) {
            case 'add':
              newItems.push(update.payload);
              break;
            case 'addMultiple':
              newItems.push(...update.payload);
              break;
            case 'update': {
              const updateIndex = newItems.findIndex(item => item.id === update.payload.id);
              if (updateIndex !== -1) {
                newItems[updateIndex] = { ...newItems[updateIndex], ...update.payload.updates };
              }
              break;
            }
            case 'remove':
              newItems = newItems.filter(item => item.id !== update.payload);
              break;
          }
        });

        return newItems;
      });
    });

    return () => {
      batchProcessorRef.current?.flush();
    };
  }, []);

  const addItem = useCallback((item: T) => {
    batchProcessorRef.current?.add({ type: 'add', payload: item });
  }, []);

  const addItems = useCallback((items: T[]) => {
    batchProcessorRef.current?.add({ type: 'addMultiple', payload: items });
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    batchProcessorRef.current?.add({ type: 'update', payload: { id, updates } });
  }, []);

  const removeItem = useCallback((id: string) => {
    batchProcessorRef.current?.add({ type: 'remove', payload: id });
  }, []);

  const flush = useCallback(() => {
    batchProcessorRef.current?.flush();
  }, []);

  return {
    items,
    addItem,
    addItems,
    updateItem,
    removeItem,
    flush,
  };
}

/**
 * Hook for lazy-loaded data
 */
export function useLazyData<T>(
  loader: (page: number) => Promise<T[]>,
  pageSize: number = 50
): {
  data: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
} {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await loader(page);

      if (newData.length < pageSize) {
        setHasMore(false);
      }

      setData(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [loader, page, loading, hasMore, pageSize]);

  const reset = useCallback(() => {
    setData([]);
    setPage(0);
    setLoading(false);
    setError(null);
    setHasMore(true);
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
  };
}

/**
 * Hook for virtual scrolling
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
): {
  visibleItems: T[];
  totalHeight: number;
  offsetY: number;
  handleScroll: (scrollTop: number) => void;
} {
  const [scrollTop, setScrollTop] = useState(0);

  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      visibleItems: items.slice(startIndex, endIndex + 1),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, overscan, scrollTop]);

  const handleScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  };
}

/**
 * Hook for memoized selectors
 */
export function useSelector<T, R>(data: T, selector: (data: T) => R, deps: any[] = []): R {
  return useMemo(() => selector(data), [data, ...deps]);
}

/**
 * Hook for optimized callbacks
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(((...args: Parameters<T>) => callbackRef.current(...args)) as T, deps);
}

/**
 * Hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, options?.root, options?.rootMargin, options?.threshold]);

  return isIntersecting;
}

/**
 * Hook for performance monitoring
 */
export function usePerformance(componentName: string) {
  const renderCount = useRef(0);
  const renderStartTime = useRef<number | undefined>(undefined);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = renderStartTime.current ? performance.now() - renderStartTime.current : 0;

    if (process.env.NODE_ENV === 'development') {
      // Render performance measurement: render count and time
    }
  });

  renderStartTime.current = performance.now();

  return {
    renderCount: renderCount.current,
    measureTime: (operation: string, fn: () => void) => {
      const start = performance.now();
      fn();
      const duration = performance.now() - start;

      if (process.env.NODE_ENV === 'development') {
        // Operation performance measurement: operation name and duration
      }
    },
  };
}
