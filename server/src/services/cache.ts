/**
 * Simple in-memory cache implementation
 * In a production environment, this would be replaced with Redis or another distributed cache
 */

interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number = 60 * 5; // 5 minutes default TTL

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param options - Cache options
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const ttl = options.ttl !== undefined ? options.ttl : this.defaultTTL;
    const expiresAt = Date.now() + ttl * 1000;
    
    this.cache.set(key, {
      value,
      expiresAt
    });
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // Check if the item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }

  /**
   * Delete a value from the cache
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all values from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get a value from the cache or compute it if not found
   * @param key - Cache key
   * @param fn - Function to compute the value if not found
   * @param options - Cache options
   * @returns The cached or computed value
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    const value = await fn();
    this.set(key, value, options);
    return value;
  }

  /**
   * Get multiple values from the cache
   * @param keys - Cache keys
   * @returns Object with keys and their cached values
   */
  getMany<T>(keys: string[]): Record<string, T | undefined> {
    const result: Record<string, T | undefined> = {};
    
    for (const key of keys) {
      result[key] = this.get<T>(key);
    }
    
    return result;
  }

  /**
   * Set multiple values in the cache
   * @param items - Object with keys and values to cache
   * @param options - Cache options
   */
  setMany<T>(items: Record<string, T>, options: CacheOptions = {}): void {
    for (const [key, value] of Object.entries(items)) {
      this.set(key, value, options);
    }
  }

  /**
   * Delete multiple values from the cache
   * @param keys - Cache keys
   */
  deleteMany(keys: string[]): void {
    for (const key of keys) {
      this.delete(key);
    }
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key - Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Check if the item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get all keys in the cache
   * @returns Array of cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get the number of items in the cache
   * @returns Number of items
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired items from the cache
   * @returns Number of items removed
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }
}

// Create a singleton instance
export const cache = new MemoryCache();

// Schedule periodic cleanup
setInterval(() => {
  const removedCount = cache.cleanup();
  if (removedCount > 0) {
    console.log(`Cache cleanup: removed ${removedCount} expired items`);
  }
}, 60 * 1000); // Run every minute