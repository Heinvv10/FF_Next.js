# API Performance & Caching Optimization

**Story 3.4:** API Performance & Caching
**Status:** ✅ Complete
**Date:** 2025-10-27

## Overview

This document describes the API performance optimizations implemented for FibreFlow. The optimizations focus on response compression, caching strategies, rate limiting, and reducing bandwidth usage.

## Performance Goals

| Metric | Target | Optimization |
|--------|--------|--------------|
| API response time (p95) | <250ms | Cache control, compression |
| Cache hit rate | >70% | Strategic cache headers |
| Bandwidth usage | -40% | Gzip/Brotli compression |
| Rate limit protection | 100% | Request throttling |

## What Was Implemented

### 1. Response Compression & Caching (`src/middleware/compression.ts`)

**Cache Control Headers:**
```typescript
import { setCacheHeaders, CachePresets } from '@/middleware/compression';

export default async function handler(req, res) {
  // Use preset cache configuration
  setCacheHeaders(res, CachePresets.short);

  // Or custom configuration
  setCacheHeaders(res, {
    maxAge: 15 * 60,              // 15 minutes browser cache
    sMaxAge: 5 * 60,              // 5 minutes CDN cache
    staleWhileRevalidate: 60,     // Serve stale for 60s while revalidating
    public: true,                 // Allow CDN caching
  });

  return res.json({ data: [...] });
}
```

**Cache Presets:**
- `noCache` - Always fetch fresh (auth endpoints, user-specific data)
- `short` - 5 min browser, 1 min CDN (frequently changing data)
- `medium` - 15 min browser, 5 min CDN (moderate change frequency)
- `long` - 1 hour browser, 15 min CDN (rarely changing data)
- `static` - 1 year, immutable (versioned assets)

**ETag Support:**
```typescript
import { setETag, checkFreshness } from '@/middleware/compression';

export default async function handler(req, res) {
  const data = await fetchData();
  const etag = setETag(res, data);

  // Check if client has fresh cache
  if (checkFreshness(req, etag)) {
    return res.status(304).end(); // Not Modified
  }

  return res.json(data);
}
```

**Combined Middleware:**
```typescript
import { withCacheAndCompression } from '@/middleware/compression';

const handler = async (req, res) => {
  const data = await fetchData();
  return res.json(data);
};

// Wrap with caching + compression
export default withCacheAndCompression(handler, CachePresets.medium);
```

### 2. Rate Limiting (`src/middleware/rateLimit.ts`)

**Basic Rate Limiting:**
```typescript
import { withRateLimit, RateLimitPresets } from '@/middleware/rateLimit';

const handler = async (req, res) => {
  // Your API logic
  return res.json({ success: true });
};

// Apply standard rate limit (100 req/min)
export default withRateLimit(handler, RateLimitPresets.standard);
```

**Rate Limit Presets:**
- `strict` - 10 requests per minute (expensive operations)
- `standard` - 100 requests per minute (normal APIs)
- `generous` - 1000 requests per minute (read-heavy endpoints)
- `auth` - 5 requests per 15 minutes (login, signup)
- `search` - 30 requests per minute (search endpoints)

**Custom Rate Limiting:**
```typescript
import { rateLimit } from '@/middleware/rateLimit';

const customLimit = rateLimit({
  windowMs: 5 * 60 * 1000,        // 5 minute window
  max: 20,                         // 20 requests per window
  message: 'Too many requests',
  statusCode: 429,
  skipSuccessfulRequests: false,   // Count all requests
  skipFailedRequests: true,        // Don't count errors
});

export default async function handler(req, res) {
  return customLimit(req, res, async () => {
    // Your API logic
    return res.json({ success: true });
  });
}
```

**Rate Limit Headers:**
All rate-limited endpoints return these headers:
```
X-RateLimit-Limit: 100          # Max requests per window
X-RateLimit-Remaining: 87       # Requests remaining
X-RateLimit-Reset: 2025-10-27T... # When limit resets
Retry-After: 42                 # Seconds until retry (if exceeded)
```

### 3. Sliding Window Rate Limiter

For more accurate rate limiting:

```typescript
import { SlidingWindowRateLimiter } from '@/middleware/rateLimit';

const limiter = new SlidingWindowRateLimiter();

export default async function handler(req, res) {
  const clientId = getClientId(req);
  const result = limiter.check(
    `api:${req.url}:${clientId}`,
    60 * 1000,  // 1 minute window
    100         // 100 requests max
  );

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    });
  }

  // Process request
  return res.json({ success: true });
}
```

## Usage Examples

### Example 1: Public API with Caching

```typescript
// pages/api/contractors/public.ts
import { withCacheAndCompression, CachePresets } from '@/middleware/compression';
import { withRateLimit, RateLimitPresets } from '@/middleware/rateLimit';

const handler = async (req, res) => {
  const contractors = await fetchPublicContractors();
  return res.json({ data: contractors });
};

// Apply both caching and rate limiting
const cachedHandler = withCacheAndCompression(handler, CachePresets.medium);
export default withRateLimit(cachedHandler, RateLimitPresets.standard);
```

### Example 2: Authentication Endpoint with Strict Rate Limit

```typescript
// pages/api/auth/login.ts
import { withRateLimit, RateLimitPresets } from '@/middleware/rateLimit';
import { setCacheHeaders, CachePresets } from '@/middleware/compression';

const handler = async (req, res) => {
  // Never cache auth responses
  setCacheHeaders(res, CachePresets.noCache);

  // Authenticate user
  const result = await authenticate(req.body);
  return res.json(result);
};

// Strict rate limit for auth endpoints
export default withRateLimit(handler, RateLimitPresets.auth);
```

### Example 3: Search API with Conditional Caching

```typescript
// pages/api/contractors/search.ts
import { setCacheHeaders, CachePresets } from '@/middleware/compression';
import { withRateLimit, RateLimitPresets } from '@/middleware/rateLimit';
import { isCacheable } from '@/middleware/compression';

const handler = async (req, res) => {
  const { query } = req.query;
  const results = await searchContractors(query);

  // Only cache successful GET requests
  if (isCacheable(req, res)) {
    setCacheHeaders(res, CachePresets.short);
  }

  return res.json({ data: results });
};

export default withRateLimit(handler, RateLimitPresets.search);
```

### Example 4: ETag-based Conditional Requests

```typescript
// pages/api/contractors/[contractorId].ts
import { setETag, checkFreshness, setCacheHeaders } from '@/middleware/compression';

export default async function handler(req, res) {
  const { contractorId } = req.query;
  const contractor = await fetchContractor(contractorId);

  // Set cache headers
  setCacheHeaders(res, {
    maxAge: 5 * 60,     // 5 minutes
    public: false,      // Private (user-specific)
  });

  // Generate ETag and check freshness
  const etag = setETag(res, contractor);
  if (checkFreshness(req, etag)) {
    return res.status(304).end(); // Client has fresh cache
  }

  return res.json({ data: contractor });
}
```

### Example 5: Combining All Optimizations

```typescript
// pages/api/contractors/index.ts
import { withCacheAndCompression, CachePresets, setETag, checkFreshness } from '@/middleware/compression';
import { withRateLimit, RateLimitPresets } from '@/middleware/rateLimit';

const handler = async (req, res) => {
  // Fetch data
  const contractors = await fetchContractors();

  // ETag for conditional requests
  const etag = setETag(res, contractors);
  if (checkFreshness(req, etag)) {
    return res.status(304).end();
  }

  return res.json({ data: contractors });
};

// Apply all optimizations
const cachedHandler = withCacheAndCompression(handler, CachePresets.short);
export default withRateLimit(cachedHandler, RateLimitPresets.standard);
```

## Cache Strategy by Endpoint Type

### Public Read-Only Data (Long Cache)
**Examples:** Public contractor list, project info
```typescript
setCacheHeaders(res, CachePresets.long); // 1 hour browser, 15 min CDN
withRateLimit(handler, RateLimitPresets.generous);
```

### Frequently Updated Data (Short Cache)
**Examples:** Dashboard stats, recent activity
```typescript
setCacheHeaders(res, CachePresets.short); // 5 min browser, 1 min CDN
withRateLimit(handler, RateLimitPresets.standard);
```

### User-Specific Data (Private Cache)
**Examples:** User profile, notifications
```typescript
setCacheHeaders(res, {
  maxAge: 2 * 60,
  public: false,  // Private - don't cache on CDN
});
```

### Real-Time Data (No Cache)
**Examples:** Live updates, current status
```typescript
setCacheHeaders(res, CachePresets.noCache);
```

### Authentication Endpoints (No Cache, Strict Rate Limit)
**Examples:** Login, signup, password reset
```typescript
setCacheHeaders(res, CachePresets.noCache);
withRateLimit(handler, RateLimitPresets.auth); // 5 req per 15 min
```

### Search/Heavy Queries (Medium Cache, Search Rate Limit)
**Examples:** Search, filters, aggregations
```typescript
setCacheHeaders(res, CachePresets.medium); // 15 min browser, 5 min CDN
withRateLimit(handler, RateLimitPresets.search); // 30 req/min
```

## Compression

Next.js and Vercel automatically handle gzip/Brotli compression in production. The middleware includes:
- `Vary: Accept-Encoding` header for proper caching
- Compression preference detection
- Content-Type checking for compressible types

**Automatically Compressed:**
- `application/json`
- `application/javascript`
- `text/html`, `text/css`, `text/plain`
- `text/xml`, `application/xml`

**Not Compressed:**
- Images (JPEG, PNG, WebP - already compressed)
- Videos
- Binary files
- Small responses (<1KB - overhead not worth it)

## Rate Limiting Storage

### Current Implementation (In-Memory)
- Uses in-memory Map for rate limit tracking
- Automatic cleanup every 60 seconds
- Suitable for single-server deployments

### Production Recommendation (Redis)
For multi-server production deployments, use Redis:

```typescript
// Example with Redis (not implemented yet)
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export class RedisRateLimitStore {
  async increment(key: string, windowMs: number) {
    const now = Date.now();
    const multi = redis.multi();

    multi.zadd(key, now, `${now}-${Math.random()}`);
    multi.zremrangebyscore(key, 0, now - windowMs);
    multi.zcard(key);
    multi.expire(key, Math.ceil(windowMs / 1000));

    const results = await multi.exec();
    return { count: results[2][1] };
  }
}
```

## Performance Monitoring

### Cache Hit Rate
```typescript
// Track in your analytics
const cacheHit = req.headers['if-none-match'] && res.statusCode === 304;
trackMetric('api.cache.hit', cacheHit ? 1 : 0);
```

### Rate Limit Statistics
```typescript
import { getRateLimitStats } from '@/middleware/rateLimit';

// Get current rate limit store size
const stats = getRateLimitStats();
console.log(`Active rate limit entries: ${stats.size}`);
```

### Response Time
```typescript
const start = Date.now();
await handler(req, res);
const duration = Date.now() - start;
trackMetric('api.response_time', duration);
```

## Expected Performance Improvements

**Before Optimization:**
- API response time: 400-600ms (p95)
- No caching (100% cache miss)
- No rate limiting (vulnerable to abuse)
- Full JSON responses every time

**After Optimization:**
- API response time: <250ms (p95) - 38-58% faster
- Cache hit rate: >70% (ETag + Cache-Control)
- Rate limiting: Prevents abuse, ensures fair usage
- 304 Not Modified responses when possible

**Bandwidth Savings:**
- Gzip compression: ~70% reduction for JSON
- 304 responses: 100% bandwidth saving
- Combined: ~40-60% total bandwidth reduction

## Best Practices

### 1. Cache Appropriately

✅ **DO:**
```typescript
// Cache stable, public data
setCacheHeaders(res, CachePresets.long);

// Use ETags for conditional requests
setETag(res, data);

// Cache privately for user-specific data
setCacheHeaders(res, { maxAge: 300, public: false });
```

❌ **DON'T:**
```typescript
// Don't cache sensitive data publicly
setCacheHeaders(res, { maxAge: 3600, public: true }); // User data!

// Don't cache real-time data
setCacheHeaders(res, CachePresets.long); // For live updates!
```

### 2. Rate Limit Appropriately

✅ **DO:**
```typescript
// Strict limits for auth
withRateLimit(authHandler, RateLimitPresets.auth);

// Standard for normal APIs
withRateLimit(handler, RateLimitPresets.standard);

// Generous for read-heavy
withRateLimit(publicHandler, RateLimitPresets.generous);
```

❌ **DON'T:**
```typescript
// Don't over-restrict
withRateLimit(publicReadHandler, { max: 5 }); // Too strict!

// Don't forget to limit expensive operations
export default expensiveSearchHandler; // No rate limit!
```

### 3. Combine Optimizations

✅ **DO:**
```typescript
// Stack middleware for best results
const optimized = withCacheAndCompression(
  withRateLimit(handler, RateLimitPresets.standard),
  CachePresets.short
);
```

## Troubleshooting

### Cache Not Working

1. Check `Cache-Control` header in response
2. Verify browser/CDN respects cache headers
3. Check for `Vary: Accept-Encoding` header
4. Test with `If-None-Match` header

### Rate Limit Not Triggering

1. Check client ID extraction (IP or user ID)
2. Verify rate limit window and max values
3. Check for `X-RateLimit-*` headers in response
4. Test with rapid requests

### Poor API Performance

1. Check database queries (Story 3.2 optimizations)
2. Verify cache hit rate (should be >70%)
3. Check response compression
4. Monitor with Story 3.1 performance tracking

## Next Steps

- ✅ Story 3.1: Performance Monitoring & Analytics
- ✅ Story 3.2: Database Query Optimization
- ✅ Story 3.3: Frontend Performance Optimization
- ✅ Story 3.4: API Performance & Caching
- 📋 Story 3.5: Monitoring Dashboard & Alerts

## Files Created

**Middleware:**
- `src/middleware/compression.ts` - Response compression and caching (225 lines)
- `src/middleware/rateLimit.ts` - Rate limiting with in-memory store (298 lines)

**Documentation:**
- `docs/performance/api-optimization.md` - This document

## References

- [HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [ETag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
- [Rate Limiting Best Practices](https://www.ietf.org/archive/id/draft-ietf-httpapi-ratelimit-headers-06.html)
