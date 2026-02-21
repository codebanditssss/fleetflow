type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

export function cacheDeleteByPrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

export function clearAppCache(): void {
  cacheDeleteByPrefix("dashboard:");
  cacheDeleteByPrefix("analytics:");
  cacheDeleteByPrefix("drivers:");
}
