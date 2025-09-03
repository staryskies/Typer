// Performance optimization utilities

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;

  updateFPS(): number {
    this.frameCount++;
    const currentTime = Date.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
    
    return this.fps;
  }

  getFPS(): number {
    return this.fps;
  }
}

// Throttle function calls for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// Debounce function calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Object pool for reusing objects to reduce garbage collection
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }

  size(): number {
    return this.pool.length;
  }
}

// Batch operations for better performance
export class BatchProcessor<T> {
  private batch: T[] = [];
  private batchSize: number;
  private processFn: (items: T[]) => void;

  constructor(batchSize: number, processFn: (items: T[]) => void) {
    this.batchSize = batchSize;
    this.processFn = processFn;
  }

  add(item: T): void {
    this.batch.push(item);
    
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  flush(): void {
    if (this.batch.length > 0) {
      this.processFn([...this.batch]);
      this.batch.length = 0;
    }
  }
}

// Memory usage monitoring
export class MemoryMonitor {
  static getMemoryUsage(): { used: number; total: number } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize / 1024 / 1024, // MB
        total: memory.totalJSHeapSize / 1024 / 1024 // MB
      };
    }
    return null;
  }

  static logMemoryUsage(): void {
    const usage = this.getMemoryUsage();
    if (usage) {
      console.log(`Memory: ${usage.used.toFixed(2)}MB / ${usage.total.toFixed(2)}MB`);
    }
  }
}
