// Performance Cache for GATI Platform
// In-memory caching for frequently accessed data

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 100; // Maximum cache entries
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const dataCache = new DataCache();

// Auto-cleanup expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    dataCache.clearExpired();
  }, 60 * 1000);
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  nationalOverview: () => 'national-overview',
  stateAggregations: () => 'state-aggregations',
  stateDetail: (stateCode: string) => `state-${stateCode}`,
  stateTrends: (stateCode: string, days: number) => `trends-${stateCode}-${days}`,
  anomalies: () => 'anomalies',
  forecast: (state: string, metric: string, periods: number) => 
    `forecast-${state}-${metric}-${periods}`,
  patterns: (state: string) => `patterns-${state}`,
  riskAnalysis: (state?: string) => state ? `risk-${state}` : 'risk-all',
};

