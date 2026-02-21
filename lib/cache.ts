type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisCommand<T>(command: unknown[]): Promise<T | null> {
  if (!redisUrl || !redisToken) {
    return null;
  }
  const response = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }
  const json = (await response.json().catch(() => null)) as { result?: T } | null;
  return json?.result ?? null;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redisValue = await redisCommand<string>(["GET", key]);
  if (redisValue !== null) {
    try {
      return JSON.parse(redisValue) as T;
    } catch {
      return null;
    }
  }
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

export async function cacheSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
  await redisCommand(["SET", key, JSON.stringify(value), "EX", Math.ceil(ttlMs / 1000)]);
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

export async function cacheDeleteByPrefix(prefix: string): Promise<void> {
  const keys = await redisCommand<string[]>(["KEYS", `${prefix}*`]);
  if (keys && keys.length > 0) {
    await redisCommand(["DEL", ...keys]);
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

export async function clearAppCache(): Promise<void> {
  await Promise.all([
    cacheDeleteByPrefix("dashboard:"),
    cacheDeleteByPrefix("analytics:"),
    cacheDeleteByPrefix("drivers:")
  ]);
}
