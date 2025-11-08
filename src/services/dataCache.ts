/**
 * Data Caching Service
 * 
 * Implements stale-while-revalidate caching pattern to reduce
 * unnecessary Firestore reads and improve performance.
 * 
 * Features:
 * - Automatic cache invalidation after TTL
 * - Background revalidation
 * - Memory-efficient LRU cache
 * - Type-safe cache keys
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  revalidating: boolean;
}

type CacheKey = 
  | 'events'
  | 'reservations'
  | 'config'
  | 'pricing'
  | 'eventTypes'
  | 'merchandise'
  | 'vouchers'
  | 'waitlist'
  | string; // Allow dynamic keys like 'event-{id}'

class DataCacheService {
  private cache: Map<CacheKey, CacheEntry<any>> = new Map();
  private maxSize: number = 100; // Max cache entries
  
  // Default TTL values (in milliseconds)
  private readonly ttls = {
    events: 5 * 60 * 1000,        // 5 minutes
    reservations: 2 * 60 * 1000,  // 2 minutes
    config: 30 * 60 * 1000,       // 30 minutes
    pricing: 30 * 60 * 1000,      // 30 minutes
    eventTypes: 30 * 60 * 1000,   // 30 minutes
    merchandise: 15 * 60 * 1000,  // 15 minutes
    vouchers: 5 * 60 * 1000,      // 5 minutes
    waitlist: 2 * 60 * 1000,      // 2 minutes
    default: 5 * 60 * 1000,       // 5 minutes
  };

  constructor() {
    // Cleanup stale entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get data from cache or fetch using provided function
   * Implements stale-while-revalidate pattern
   */
  async get<T>(
    key: CacheKey,
    fetchFn: () => Promise<T>,
    options?: {
      ttl?: number;
      forceRefresh?: boolean;
    }
  ): Promise<T> {
    const ttl = options?.ttl || this.getTTL(key);
    
    // Force refresh bypasses cache
    if (options?.forceRefresh) {
      const data = await fetchFn();
      this.set(key, data, ttl);
      return data;
    }

    const cached = this.cache.get(key);
    const now = Date.now();

    // Cache hit - data is fresh
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data;
    }

    // Cache hit - data is stale but usable
    if (cached && !cached.revalidating) {
      // Return stale data immediately
      const staleData = cached.data;
      
      // Revalidate in background
      cached.revalidating = true;
      fetchFn()
        .then(freshData => {
          this.set(key, freshData, ttl);
        })
        .catch(error => {
          console.warn(`Cache revalidation failed for ${key}:`, error);
          cached.revalidating = false;
        });
      
      return staleData;
    }

    // Cache miss or revalidating - fetch fresh data
    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: CacheKey, data: T, ttl?: number): void {
    // Enforce max cache size (LRU)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.getTTL(key),
      revalidating: false,
    });
  }

  /**
   * Check if cache has valid (non-stale) data for key
   */
  has(key: CacheKey): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < cached.ttl;
  }

  /**
   * Get cached data without fetching (returns null if not found)
   */
  peek<T>(key: CacheKey): T | null {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  /**
   * Invalidate (remove) cache entry
   */
  invalidate(key: CacheKey): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate multiple cache entries by pattern
   */
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Get TTL for a cache key
   */
  private getTTL(key: CacheKey): number {
    // Check if key matches known type
    for (const [type, ttl] of Object.entries(this.ttls)) {
      if (key === type || key.startsWith(`${type}-`)) {
        return ttl;
      }
    }
    return this.ttls.default;
  }

  /**
   * Cleanup stale entries
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour - absolute max age
    
    for (const [key, entry] of this.cache.entries()) {
      // Remove entries older than 1 hour
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let fresh = 0;
    let stale = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp < entry.ttl) {
        fresh++;
      } else {
        stale++;
      }
    }

    return {
      totalEntries: this.cache.size,
      freshEntries: fresh,
      staleEntries: stale,
      maxSize: this.maxSize,
      utilizationPercent: Math.round((this.cache.size / this.maxSize) * 100),
    };
  }

  /**
   * Get all cache keys (for debugging)
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Prefetch data (load into cache without returning)
   */
  async prefetch<T>(key: CacheKey, fetchFn: () => Promise<T>): Promise<void> {
    if (!this.has(key)) {
      try {
        const data = await fetchFn();
        this.set(key, data);
      } catch (error) {
        console.warn(`Prefetch failed for ${key}:`, error);
      }
    }
  }

  /**
   * Warm up cache with multiple keys
   */
  async warmup(entries: Array<{ key: CacheKey; fetchFn: () => Promise<any> }>): Promise<void> {
    await Promise.all(
      entries.map(({ key, fetchFn }) => this.prefetch(key, fetchFn))
    );
  }
}

// Singleton instance
export const dataCache = new DataCacheService();

// Helper functions for common cache operations
export const cacheEvents = {
  get: <T>(fetchFn: () => Promise<T>) => dataCache.get('events', fetchFn),
  invalidate: () => dataCache.invalidate('events'),
};

export const cacheReservations = {
  get: <T>(fetchFn: () => Promise<T>) => dataCache.get('reservations', fetchFn),
  invalidate: () => dataCache.invalidate('reservations'),
};

export const cacheConfig = {
  get: <T>(fetchFn: () => Promise<T>) => dataCache.get('config', fetchFn),
  invalidate: () => dataCache.invalidate('config'),
};

export const cacheEvent = {
  get: <T>(eventId: string, fetchFn: () => Promise<T>) => 
    dataCache.get(`event-${eventId}`, fetchFn),
  invalidate: (eventId: string) => dataCache.invalidate(`event-${eventId}`),
};

export default dataCache;
