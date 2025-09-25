/**
 * CacheManager.js
 * LRU Cache implementation for efficient song data management
 * Handles caching for 1300+ songs with memory limits
 */

export class CacheManager {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 20; // Max songs in memory
        this.maxMemory = options.maxMemory || 50 * 1024 * 1024; // 50MB limit
        this.cache = new Map();
        this.accessOrder = [];
        this.memoryUsage = 0;
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
    }

    /**
     * Get item from cache
     */
    get(key) {
        if (this.cache.has(key)) {
            // Move to end (most recently used)
            this.updateAccessOrder(key);
            this.stats.hits++;
            console.log(`📊 Cache HIT: ${key} (${this.stats.hits} hits)`);
            return this.cache.get(key);
        }

        this.stats.misses++;
        console.log(`📊 Cache MISS: ${key} (${this.stats.misses} misses)`);
        return null;
    }

    /**
     * Add item to cache with size tracking
     */
    set(key, value, size = null) {
        // Calculate size if not provided
        if (size === null) {
            size = this.calculateSize(value);
        }

        // Check if we need to evict items
        while (this.shouldEvict(size)) {
            this.evictLRU();
        }

        // Update or add item
        if (this.cache.has(key)) {
            const oldSize = this.cache.get(key)._cacheSize || 0;
            this.memoryUsage -= oldSize;
        }

        // Add metadata to value
        value._cacheSize = size;
        value._cachedAt = Date.now();

        this.cache.set(key, value);
        this.memoryUsage += size;
        this.updateAccessOrder(key);

        console.log(`✅ Cached: ${key} (${this.formatBytes(size)}) | Total: ${this.formatBytes(this.memoryUsage)}`);
        return value;
    }

    /**
     * Check if eviction is needed
     */
    shouldEvict(incomingSize) {
        return (
            this.cache.size >= this.maxSize ||
            this.memoryUsage + incomingSize > this.maxMemory
        );
    }

    /**
     * Evict least recently used item
     */
    evictLRU() {
        if (this.accessOrder.length === 0) return;

        const lruKey = this.accessOrder.shift();
        const item = this.cache.get(lruKey);

        if (item) {
            const size = item._cacheSize || 0;
            this.memoryUsage -= size;
            this.cache.delete(lruKey);
            this.stats.evictions++;

            console.log(`🗑️ Evicted: ${lruKey} (${this.formatBytes(size)}) | Evictions: ${this.stats.evictions}`);
        }
    }

    /**
     * Update access order for LRU
     */
    updateAccessOrder(key) {
        // Remove from current position
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        // Add to end (most recently used)
        this.accessOrder.push(key);
    }

    /**
     * Calculate size of object in bytes
     */
    calculateSize(obj) {
        const str = JSON.stringify(obj);
        return new Blob([str]).size;
    }

    /**
     * Clear entire cache
     */
    clear() {
        this.cache.clear();
        this.accessOrder = [];
        this.memoryUsage = 0;
        console.log('🧹 Cache cleared');
    }

    /**
     * Remove specific item
     */
    delete(key) {
        if (this.cache.has(key)) {
            const item = this.cache.get(key);
            const size = item._cacheSize || 0;
            this.memoryUsage -= size;
            this.cache.delete(key);

            const index = this.accessOrder.indexOf(key);
            if (index > -1) {
                this.accessOrder.splice(index, 1);
            }

            console.log(`🗑️ Deleted: ${key} (${this.formatBytes(size)})`);
            return true;
        }
        return false;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            memoryUsage: this.memoryUsage,
            maxMemory: this.maxMemory,
            memoryUsagePercent: ((this.memoryUsage / this.maxMemory) * 100).toFixed(2),
            hits: this.stats.hits,
            misses: this.stats.misses,
            evictions: this.stats.evictions,
            hitRate: `${hitRate}%`,
            items: Array.from(this.cache.keys())
        };
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Preload multiple items
     */
    async preload(items, loader) {
        console.log(`⏳ Preloading ${items.length} items...`);
        const results = [];

        for (const item of items) {
            if (!this.cache.has(item.key)) {
                try {
                    const data = await loader(item);
                    this.set(item.key, data);
                    results.push({ key: item.key, status: 'loaded' });
                } catch (error) {
                    results.push({ key: item.key, status: 'error', error });
                }
            } else {
                results.push({ key: item.key, status: 'cached' });
            }
        }

        console.log(`✅ Preload complete:`, results);
        return results;
    }

    /**
     * Get cache info for display
     */
    getInfo() {
        const stats = this.getStats();
        return {
            summary: `${stats.size}/${stats.maxSize} songs | ${this.formatBytes(stats.memoryUsage)}/${this.formatBytes(stats.maxMemory)} | Hit rate: ${stats.hitRate}`,
            details: stats
        };
    }
}

/**
 * WeakCache for temporary data
 * Automatically garbage collected when not in use
 */
export class WeakCache {
    constructor() {
        this.cache = new WeakMap();
        this.keys = new WeakSet();
    }

    set(key, value) {
        if (typeof key === 'object') {
            this.cache.set(key, value);
            this.keys.add(key);
            return true;
        }
        console.warn('WeakCache requires object keys');
        return false;
    }

    get(key) {
        return this.cache.get(key);
    }

    has(key) {
        return this.keys.has(key);
    }

    delete(key) {
        this.keys.delete(key);
        return this.cache.delete(key);
    }
}

/**
 * Create and export singleton cache instance
 */
export const songCache = new CacheManager({
    maxSize: 20,
    maxMemory: 50 * 1024 * 1024 // 50MB
});

export const tempCache = new WeakCache();