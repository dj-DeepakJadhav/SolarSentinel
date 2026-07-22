type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function takeRateLimit(key: string, now = Date.now(), limit = 8, windowMs = 60_000) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0, resetAt: current.resetAt };
  current.count += 1;
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export function clearRateLimitsForTest() {
  buckets.clear();
}
