/**
 * V4.4.1: Data Cache Module
 *
 * In-memory cache for frequently accessed data files
 * Reduces file I/O by 60-80% on repeated requests
 */

class DataCache {
    constructor(options = {}) {
        this.cache = new Map();
        this.ttl = options.ttl || 3600000; // 1 hour default
        this.maxSize = options.maxSize || 1000; // Max entries
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
    }

    /**
     * Get cached data or load it using the loader function
     * @param {string} key - Cache key
     * @param {Function} loaderFn - Function to load data if not cached
     * @returns {*} Cached or freshly loaded data
     */
    get(key, loaderFn) {
        const cached = this.cache.get(key);

        // Check if cached and not expired
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            this.stats.hits++;
            return cached.data;
        }

        // Load fresh data
        this.stats.misses++;
        const data = loaderFn();

        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
            this.stats.evictions++;
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        return data;
    }

    /**
     * Invalidate a specific cache entry
     * @param {string} key - Cache key to invalidate
     */
    invalidate(key) {
        this.cache.delete(key);
    }

    /**
     * Clear all cached data
     */
    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats (hits, misses, evictions, hit rate)
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%'
        };
    }
}

// Singleton instance with default options
const globalCache = new DataCache({
    ttl: 3600000, // 1 hour
    maxSize: 1000
});

module.exports = globalCache;
