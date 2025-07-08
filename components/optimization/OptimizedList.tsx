/**
 * Optimized List Component
 * Virtual scrolling list with performance optimizations
 */

import React, { useRef, useCallback, memo } from 'react';
import { useVirtualScroll } from '@/hooks/useOptimizedState';

interface OptimizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  height?: number | string;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

function OptimizedListInner<T>({
  items,
  itemHeight,
  renderItem,
  keyExtractor,
  className = '',
  height = 400,
  overscan = 3,
  onEndReached,
  endReachedThreshold = 0.8
}: OptimizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerHeight = typeof height === 'number' ? height : 400;
  
  const { visibleItems, totalHeight, offsetY, handleScroll } = useVirtualScroll(
    items,
    itemHeight,
    containerHeight,
    overscan
  );
  
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const scrollHeight = e.currentTarget.scrollHeight;
    const clientHeight = e.currentTarget.clientHeight;
    
    handleScroll(scrollTop);
    
    // Check if we've scrolled near the end
    if (onEndReached && scrollTop + clientHeight >= scrollHeight * endReachedThreshold) {
      onEndReached();
    }
  }, [handleScroll, onEndReached, endReachedThreshold]);
  
  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={keyExtractor(item, index)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export memoized component
export const OptimizedList = memo(OptimizedListInner) as typeof OptimizedListInner;

/**
 * Optimized Grid Component
 * Virtual scrolling grid with performance optimizations
 */
interface OptimizedGridProps<T> {
  items: T[];
  columns: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  height?: number | string;
  gap?: number;
}

function OptimizedGridInner<T>({
  items,
  columns,
  itemHeight,
  renderItem,
  keyExtractor,
  className = '',
  height = 400,
  gap = 16
}: OptimizedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowHeight = itemHeight + gap;
  const rows = Math.ceil(items.length / columns);
  const containerHeight = typeof height === 'number' ? height : 400;
  
  // Group items into rows
  const itemRows = React.useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      result.push(items.slice(i, i + columns));
    }
    return result;
  }, [items, columns]);
  
  const { visibleItems, totalHeight, offsetY, handleScroll } = useVirtualScroll(
    itemRows,
    rowHeight,
    containerHeight,
    3
  );
  
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    handleScroll(e.currentTarget.scrollTop);
  }, [handleScroll]);
  
  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
                marginBottom: `${gap}px`
              }}
            >
              {row.map((item, colIndex) => {
                const index = rowIndex * columns + colIndex;
                return (
                  <div
                    key={keyExtractor(item, index)}
                    style={{ height: itemHeight }}
                  >
                    {renderItem(item, index)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const OptimizedGrid = memo(OptimizedGridInner) as typeof OptimizedGridInner;

/**
 * Lazy Load Wrapper Component
 */
interface LazyLoadWrapperProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}

export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = memo(({
  children,
  placeholder = <div className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />,
  rootMargin = '100px',
  threshold = 0.1,
  className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [rootMargin, threshold]);
  
  return (
    <div ref={ref} className={className}>
      {isVisible ? children : placeholder}
    </div>
  );
});