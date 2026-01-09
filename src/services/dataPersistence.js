const MEMORY_CACHE = new Map();

/**
 * multi-layered caching strategy:
 * L1: Memory (Instant)
 * L2: LocalStorage (Survives refresh)
 * L3: JSON Files (Long-term persistent storage)
 */
export const DataPersistenceService = {
    /**
     * Save data across all layers
     */
    async save(filename, data) {
        const cacheKey = `cache_${filename}`;
        const payload = {
            timestamp: Date.now(),
            data: data
        };

        // L1: Memory update
        MEMORY_CACHE.set(filename, payload);

        // L2: LocalStorage update
        try {
            localStorage.setItem(cacheKey, JSON.stringify(payload));
        } catch (e) {
            console.warn('LocalStorage save failed', e);
        }

        // L3: JSON File persistence (Background)
        try {
            await fetch(`/api/data/${filename}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload }),
            });
        } catch (error) {
            console.error(`Error persisting to JSON ${filename}:`, error);
        }

        return data;
    },

    /**
     * Load data from the fastest available layer
     */
    async load(filename) {
        const cacheKey = `cache_${filename}`;

        // Try L1: Memory
        if (MEMORY_CACHE.has(filename)) {
            return MEMORY_CACHE.get(filename).data;
        }

        // Try L2: LocalStorage
        try {
            const local = localStorage.getItem(cacheKey);
            if (local) {
                const parsed = JSON.parse(local);
                MEMORY_CACHE.set(filename, parsed); // Hydrate L1
                return parsed.data;
            }
        } catch (e) {
            console.warn('LocalStorage load failed', e);
        }

        // Try L3: JSON File
        try {
            const response = await fetch(`/api/data/${filename}`);
            if (response.ok) {
                const text = await response.text();
                const parsed = JSON.parse(text);

                // Hydrate L1 & L2
                const payload = parsed.timestamp ? parsed : { timestamp: Date.now(), data: parsed };
                MEMORY_CACHE.set(filename, payload);
                localStorage.setItem(cacheKey, JSON.stringify(payload));

                return payload.data;
            }
        } catch (error) {
            console.warn(`Fallback to API for ${filename}`);
        }

        return null;
    },

    /**
     * Check if the cache is older than specified minutes
     */
    isExpired(filename, minutes = 30) {
        const payload = MEMORY_CACHE.get(filename);
        if (!payload || !payload.timestamp) return true;

        const ageInMs = Date.now() - payload.timestamp;
        const expiryInMs = minutes * 60 * 1000;
        return ageInMs > expiryInMs;
    }
};
