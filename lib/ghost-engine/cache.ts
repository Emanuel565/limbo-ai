interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutos

export function getCached<T = any>(key: string): T | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
        memoryCache.delete(key);
        return null;
    }

    return entry.data as T;
}

export function setCached<T = any>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
    memoryCache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
    });
}

export function flushCache(): void {
    memoryCache.clear();
}

export function getCacheSize(): number {
    return memoryCache.size;
}
