import 'server-only';

type Bucket = {
  tokens: number;
  lastRefill: number;
};

// In-memory rate-limit store. Note: not shared across Vercel serverless instances.
// For production scale, migrate to Redis (e.g. Upstash).
const ipBuckets = new Map<string, Bucket>();
const userBuckets = new Map<string, Bucket>();

let lastCleanupAt = 0;

function cleanupIdleBuckets(store: Map<string, Bucket>, windowMs: number): void {
  const now = Date.now();
  // Run cleanup at most once per minute to keep overhead tiny.
  if (now - lastCleanupAt < 60_000) return;
  lastCleanupAt = now;

  const idleThreshold = Math.max(windowMs * 2, 120_000);
  for (const [key, bucket] of store.entries()) {
    if (now - bucket.lastRefill > idleThreshold) {
      store.delete(key);
    }
  }
}

function getOrCreateBucket(store: Map<string, Bucket>, key: string, capacity: number, windowMs: number): Bucket {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing) {
    const bucket: Bucket = { tokens: capacity, lastRefill: now };
    store.set(key, bucket);
    return bucket;
  }
  const elapsed = now - existing.lastRefill;
  const refillRate = capacity / windowMs; // tokens per ms
  const tokensToAdd = elapsed * refillRate;
  existing.tokens = Math.min(capacity, existing.tokens + tokensToAdd);
  existing.lastRefill = now;

  return existing;
}

export function checkRateLimit(
  key: string,
  options: { capacity: number; windowMs: number; type?: 'ip' | 'user' } = { capacity: 10, windowMs: 60_000 },
): { allowed: boolean; retryAfterMs: number } {
  const store = options.type === 'user' ? userBuckets : ipBuckets;
  cleanupIdleBuckets(store, options.windowMs);

  const bucket = getOrCreateBucket(store, key, options.capacity, options.windowMs);
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  const refillRate = options.capacity / options.windowMs;
  const retryAfterMs = Math.ceil((1 - bucket.tokens) / refillRate);
  return { allowed: false, retryAfterMs };
}

/** Simple per-user sliding-window counter for chat round-trips. */
export function checkChatRateLimit(
  userId: string,
  ip: string,
): { allowed: boolean; retryAfterMs: number; reason?: string } {
  // User-level: 20 requests per minute
  const userLimit = checkRateLimit(userId, { capacity: 20, windowMs: 60_000, type: 'user' });
  if (!userLimit.allowed) {
    return { allowed: false, retryAfterMs: userLimit.retryAfterMs, reason: 'user_rate_limit' };
  }
  // IP-level: 40 requests per minute (catches unauthenticated/scripted abuse)
  const ipLimit = checkRateLimit(ip, { capacity: 40, windowMs: 60_000, type: 'ip' });
  if (!ipLimit.allowed) {
    return { allowed: false, retryAfterMs: ipLimit.retryAfterMs, reason: 'ip_rate_limit' };
  }
  return { allowed: true, retryAfterMs: 0 };
}
