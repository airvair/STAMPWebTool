/**
 * Performance Optimizer
 * Utilities for optimizing STPA analysis performance
 */

import { 
  UnsafeControlAction, 
  Hazard,
  Loss,
  Requirement
} from '@/types/types';

// Type for decorator (removed - unused)

/**
 * Memoization decorator for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  }) as T;
}

/**
 * Debounce function for reducing frequency of expensive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for limiting operation frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;
  let lastResult: ReturnType<T>;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = fn(...args);
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  }) as T;
}

/**
 * Virtual scrolling for large lists
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export class VirtualScroller<T> {
  private items: T[] = [];
  private options: Required<VirtualScrollOptions>;
  
  constructor(items: T[], options: VirtualScrollOptions) {
    this.items = items;
    this.options = {
      overscan: 3,
      ...options
    };
  }
  
  getVisibleItems(scrollTop: number): {
    items: T[];
    startIndex: number;
    endIndex: number;
    totalHeight: number;
    offsetY: number;
  } {
    const { itemHeight, containerHeight, overscan } = this.options;
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      this.items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return {
      items: this.items.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex,
      totalHeight: this.items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }
  
  updateItems(items: T[]) {
    this.items = items;
  }
}

/**
 * Lazy loading manager for data
 */
export class LazyLoadManager<T> {
  private cache = new Map<string, T[]>();
  private loading = new Set<string>();
  private pageSize: number;
  
  constructor(pageSize: number = 50) {
    this.pageSize = pageSize;
  }
  
  async loadPage(
    key: string,
    page: number,
    loader: (offset: number, limit: number) => Promise<T[]>
  ): Promise<T[]> {
    const cacheKey = `${key}-${page}`;
    
    // Return cached data if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // Prevent duplicate requests
    if (this.loading.has(cacheKey)) {
      return [];
    }
    
    this.loading.add(cacheKey);
    
    try {
      const offset = page * this.pageSize;
      const data = await loader(offset, this.pageSize);
      this.cache.set(cacheKey, data);
      return data;
    } finally {
      this.loading.delete(cacheKey);
    }
  }
  
  clearCache(key?: string) {
    if (key) {
      // Clear specific key pages
      Array.from(this.cache.keys())
        .filter(k => k.startsWith(key))
        .forEach(k => this.cache.delete(k));
    } else {
      // Clear all
      this.cache.clear();
    }
  }
}

/**
 * Web Worker manager for heavy computations
 */
export class WorkerManager {
  private workers: Worker[] = [];
  private taskQueue: Array<{
    id: string;
    task: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private busyWorkers = new Set<Worker>();
  
  constructor(workerScript: string, poolSize: number = 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      worker.onmessage = this.handleWorkerMessage.bind(this);
      worker.onerror = this.handleWorkerError.bind(this);
      this.workers.push(worker);
    }
  }
  
  async runTask<T>(task: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const taskId = Math.random().toString(36).substr(2, 9);
      this.taskQueue.push({ id: taskId, task: { ...task, id: taskId }, resolve, reject });
      this.processQueue();
    });
  }
  
  private processQueue() {
    if (this.taskQueue.length === 0) return;
    
    const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));
    if (!availableWorker) return;
    
    const { task } = this.taskQueue.shift()!;
    this.busyWorkers.add(availableWorker);
    availableWorker.postMessage(task);
  }
  
  private handleWorkerMessage(event: MessageEvent) {
    const { id, result, error } = event.data;
    const worker = event.target as Worker;
    
    this.busyWorkers.delete(worker);
    
    const taskIndex = this.taskQueue.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
      const task = this.taskQueue.splice(taskIndex, 1)[0];
      if (error) {
        task.reject(error);
      } else {
        task.resolve(result);
      }
    }
    
    this.processQueue();
  }
  
  private handleWorkerError(event: ErrorEvent) {
    console.error('Worker error:', event);
  }
  
  terminate() {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.busyWorkers.clear();
  }
}

/**
 * Batch processor for reducing re-renders
 */
export class BatchProcessor<T> {
  private batch: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private processor: (items: T[]) => void;
  private delay: number;
  private maxBatchSize: number;
  
  constructor(
    processor: (items: T[]) => void,
    delay: number = 16, // ~60fps
    maxBatchSize: number = 100
  ) {
    this.processor = processor;
    this.delay = delay;
    this.maxBatchSize = maxBatchSize;
  }
  
  add(item: T) {
    this.batch.push(item);
    
    if (this.batch.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.delay);
    }
  }
  
  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.batch.length > 0) {
      const items = [...this.batch];
      this.batch = [];
      this.processor(items);
    }
  }
}

/**
 * Indexed data store for fast lookups
 */
export class IndexedDataStore<T extends { id: string }> {
  private data = new Map<string, T>();
  private indexes = new Map<string, Map<any, Set<string>>>();
  
  constructor(private indexFields: string[]) {
    this.indexFields.forEach(field => {
      this.indexes.set(field, new Map());
    });
  }
  
  add(item: T) {
    this.data.set(item.id, item);
    
    // Update indexes
    this.indexFields.forEach(field => {
      const value = (item as any)[field];
      if (value !== undefined) {
        const index = this.indexes.get(field)!;
        if (!index.has(value)) {
          index.set(value, new Set());
        }
        index.get(value)!.add(item.id);
      }
    });
  }
  
  remove(id: string) {
    const item = this.data.get(id);
    if (!item) return;
    
    this.data.delete(id);
    
    // Update indexes
    this.indexFields.forEach(field => {
      const value = (item as any)[field];
      if (value !== undefined) {
        const index = this.indexes.get(field)!;
        const ids = index.get(value);
        if (ids) {
          ids.delete(id);
          if (ids.size === 0) {
            index.delete(value);
          }
        }
      }
    });
  }
  
  get(id: string): T | undefined {
    return this.data.get(id);
  }
  
  findByIndex(field: string, value: any): T[] {
    const index = this.indexes.get(field);
    if (!index) return [];
    
    const ids = index.get(value);
    if (!ids) return [];
    
    return Array.from(ids).map(id => this.data.get(id)!).filter(Boolean);
  }
  
  getAll(): T[] {
    return Array.from(this.data.values());
  }
  
  clear() {
    this.data.clear();
    this.indexes.forEach(index => index.clear());
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private timers = new Map<string, number>();
  
  startTimer(name: string) {
    this.timers.set(name, performance.now());
  }
  
  endTimer(name: string) {
    const startTime = this.timers.get(name);
    if (!startTime) return;
    
    const duration = performance.now() - startTime;
    this.timers.delete(name);
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const durations = this.metrics.get(name)!;
    durations.push(duration);
    
    // Keep last 100 measurements
    if (durations.length > 100) {
      durations.shift();
    }
  }
  
  getMetrics(name: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const durations = this.metrics.get(name);
    if (!durations || durations.length === 0) return null;
    
    const sum = durations.reduce((a, b) => a + b, 0);
    
    return {
      avg: sum / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: durations.length
    };
  }
  
  getAllMetrics() {
    const results: Record<string, any> = {};
    
    this.metrics.forEach((_, name) => {
      results[name] = this.getMetrics(name);
    });
    
    return results;
  }
  
  clear(name?: string) {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

/**
 * React-specific performance optimizations
 */
export const ReactOptimizations = {
  /**
   * Shallow compare for React.memo
   */
  shallowEqual(prev: any, next: any): boolean {
    if (prev === next) return true;
    
    if (!prev || !next) return false;
    
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    return prevKeys.every(key => prev[key] === next[key]);
  },
  
  /**
   * Deep compare for complex objects
   */
  deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (a == null || b == null) return false;
    
    if (a.constructor !== b.constructor) return false;
    
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }
    
    if (typeof a === 'object' && typeof b === 'object') {
      const keys = Object.keys(a);
      if (keys.length !== Object.keys(b).length) return false;
      return keys.every(key => this.deepEqual(a[key], b[key]));
    }
    
    return false;
  },
  
  /**
   * Create selector for derived state
   */
  createSelector<T, R>(
    selector: (state: T) => R,
    equalityFn?: (a: any, b: any) => boolean
  ): (state: T) => R {
    let lastState: T;
    let lastResult: R;
    
    const compareFn = equalityFn || ((a: any, b: any) => {
      if (a === b) return true;
      if (!a || !b) return false;
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every(key => a[key] === b[key]);
    });
    
    return (state: T) => {
      if (!lastState || !compareFn(state, lastState)) {
        lastState = state;
        lastResult = selector(state);
      }
      
      return lastResult;
    };
  }
};

/**
 * Optimized STPA-specific operations
 */
export class STPAOptimizer {
  private ucaIndex: IndexedDataStore<UnsafeControlAction>;
  
  constructor() {
    this.ucaIndex = new IndexedDataStore(['controllerId', 'controlActionId']);
  }
  
  /**
   * Batch add UCAs
   */
  addUCAsBatch(ucas: UnsafeControlAction[]) {
    ucas.forEach(uca => this.ucaIndex.add(uca));
  }
  
  /**
   * Find UCAs by controller
   */
  findUCAsByController = memoize((controllerId: string): UnsafeControlAction[] => {
    return this.ucaIndex.findByIndex('controllerId', controllerId);
  })
  
  /**
   * Find UCAs by hazard
   */
  /**
   * Find UCAs by hazard
   */
  findUCAsByHazard = memoize((hazardId: string): UnsafeControlAction[] => {
    // Since hazardIds is an array, we need to find UCAs that include this hazard
    return this.ucaIndex.getAll().filter(uca => uca.hazardIds.includes(hazardId));
  })
  
  /**
   * Calculate traceability links efficiently
   */
  calculateTraceability = memoize((
    _losses: Loss[],
    hazards: Hazard[],
    ucas: UnsafeControlAction[],
    requirements: Requirement[]
  ) => {
    const links = new Map<string, Set<string>>();
    
    // Loss -> Hazard links
    hazards.forEach(hazard => {
      hazard.linkedLossIds?.forEach(lossId => {
        const key = `loss-${lossId}`;
        if (!links.has(key)) links.set(key, new Set());
        links.get(key)!.add(`hazard-${hazard.id}`);
      });
    });
    
    // Hazard -> UCA links
    ucas.forEach(uca => {
      uca.hazardIds?.forEach(hazardId => {
        const key = `hazard-${hazardId}`;
        if (!links.has(key)) links.set(key, new Set());
        links.get(key)!.add(`uca-${uca.id}`);
      });
    });
    
    // UCA -> Requirement links
    requirements.forEach(req => {
      req.ucaIds?.forEach(ucaId => {
        const key = `uca-${ucaId}`;
        if (!links.has(key)) links.set(key, new Set());
        links.get(key)!.add(`requirement-${req.id}`);
      });
    });
    
    return links;
  })
  
  /**
   * Clear caches
   */
  clearCaches() {
    this.ucaIndex.clear();
  }
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const stpaOptimizer = new STPAOptimizer();