# Performance Monitoring Setup

**Story 3.1:** Performance Monitoring & Analytics
**Status:** ✅ Complete
**Date:** 2025-10-27

## Overview

This document describes the performance monitoring and error tracking infrastructure implemented for FibreFlow. The system tracks Core Web Vitals, custom performance metrics, and errors with full context for debugging.

## What Was Implemented

### 1. Web Vitals Tracking (`src/lib/performance.ts`)

Tracks all Core Web Vitals metrics:
- **LCP** (Largest Contentful Paint) - Loading performance
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability
- **TTFB** (Time to First Byte) - Server response time
- **FCP** (First Contentful Paint) - Initial render
- **INP** (Interaction to Next Paint) - Responsiveness

**Features:**
- Automatic metric collection on every page
- Rating calculation (good/needs-improvement/poor)
- Integration with Next.js `reportWebVitals`
- Sends metrics to analytics endpoint
- Development mode logging

**Thresholds:**
```typescript
LCP:  Good ≤ 2.5s  | Poor > 4.0s
FID:  Good ≤ 100ms | Poor > 300ms
CLS:  Good ≤ 0.1   | Poor > 0.25
TTFB: Good ≤ 600ms | Poor > 1.5s
FCP:  Good ≤ 1.8s  | Poor > 3.0s
INP:  Good ≤ 200ms | Poor > 500ms
```

### 2. Error Tracking (`src/lib/errorTracking.ts`)

Comprehensive error tracking with context:
- Global error handler (uncaught errors)
- Unhandled promise rejection tracking
- React error boundary integration
- API error tracking
- Breadcrumb trail for debugging
- User context tracking

**Features:**
- Severity levels (fatal, error, warning, info, debug)
- Error sampling/rate limiting
- Fingerprinting for grouping
- Environment context capture
- User context tracking
- Breadcrumb trail (last 50 actions)

### 3. Analytics API Endpoints

**Web Vitals Endpoint:** `/api/analytics/web-vitals`
- Receives performance metrics from clients
- Validates metric data
- Stores/forwards to analytics service
- Currently logs to console (ready for integration)

**Errors Endpoint:** `/api/analytics/errors`
- Receives error events from clients
- Filters ignored errors
- Stores error context
- Triggers alerts for critical errors
- Currently logs to console (ready for integration)

### 4. Integration with App

**`pages/_app.tsx`** updated with:
- `reportWebVitals` export for Next.js
- Error tracking initialization
- Production-only tracking (development logging only)

## Usage

### Tracking Custom Performance Metrics

```typescript
import { performanceMetrics } from '@/lib/performance';

// Measure async operation
const data = await performanceMetrics.measureAsync('loadUserData', async () => {
  return await fetchUserData();
});

// Measure sync operation
const result = performanceMetrics.measureSync('calculateTotal', () => {
  return items.reduce((sum, item) => sum + item.price, 0);
});

// Manual marking
performanceMetrics.startMeasure('customOperation');
// ... do work ...
const duration = performanceMetrics.endMeasure('customOperation');
```

### Tracking Errors

```typescript
import {
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  captureAPIError,
} from '@/lib/errorTracking';

// Capture an exception
try {
  riskyOperation();
} catch (error) {
  captureException(error, {
    severity: 'error',
    tags: { operation: 'riskyOperation' },
    extra: { userId: user.id },
  });
}

// Capture a message
captureMessage('User completed onboarding', {
  severity: 'info',
  tags: { flow: 'onboarding' },
});

// Set user context
setUser({
  id: user.id,
  email: user.email,
  role: user.role,
});

// Add breadcrumb
addBreadcrumb({
  message: 'User clicked submit button',
  category: 'ui.click',
  level: 'info',
  data: { buttonId: 'submit-form' },
});

// Track API errors
fetch('/api/data')
  .catch((error) => {
    captureAPIError('/api/data', error, {
      method: 'GET',
      status: 500,
    });
  });
```

### Using in React Components

```typescript
import { captureReactError } from '@/lib/errorTracking';

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureReactError(error, errorInfo);
  }
}
```

### Wrapping Functions

```typescript
import { withErrorTracking } from '@/lib/errorTracking';

const fetchData = withErrorTracking(
  async (id: string) => {
    const response = await fetch(`/api/data/${id}`);
    return response.json();
  },
  {
    name: 'fetchData',
    tags: { module: 'data-fetching' },
  }
);
```

## Configuration

### Environment Variables

```bash
# Enable/disable tracking (automatically handled)
NODE_ENV=production  # Enables tracking
NODE_ENV=development # Logs only, no sending

# Optional: Sentry integration
SENTRY_DSN=your_sentry_dsn_here

# Optional: Custom analytics endpoint
NEXT_PUBLIC_ANALYTICS_ENDPOINT=/api/analytics
```

### Performance Thresholds

Edit `src/lib/performance.ts` to adjust thresholds:

```typescript
export const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  // ...
};
```

### Error Sampling

Configure error sampling rate in `pages/_app.tsx`:

```typescript
initErrorTracking({
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: 1.0, // 100% of errors (adjust for high-traffic apps)
});
```

## Integration Options

### Vercel Analytics

Already integrated via Next.js:
- Web Vitals automatically sent to Vercel
- View in Vercel Dashboard → Analytics
- No additional configuration needed

### Sentry

To integrate with Sentry:

```bash
npm install @sentry/nextjs
```

Update `pages/api/analytics/errors.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

function storeError(error: ErrorEvent): void {
  Sentry.captureException(new Error(error.message), {
    level: error.severity,
    tags: error.context.tags,
    extra: error.context.extra,
    user: error.context.user,
  });
}
```

### Custom Database Storage

To store metrics in database, update endpoints:

```typescript
// In pages/api/analytics/web-vitals.ts
async function storeMetric(metric: WebVitalsMetric): Promise<void> {
  await db.query(
    `INSERT INTO web_vitals (name, value, rating, pathname, timestamp)
     VALUES ($1, $2, $3, $4, $5)`,
    [metric.name, metric.value, metric.rating, metric.pathname, metric.timestamp]
  );
}

// In pages/api/analytics/errors.ts
async function storeError(error: ErrorEvent): Promise<void> {
  await db.query(
    `INSERT INTO error_events (message, severity, stack, pathname, context)
     VALUES ($1, $2, $3, $4, $5)`,
    [error.message, error.severity, error.stack, error.context.page?.pathname, JSON.stringify(error.context)]
  );
}
```

## Monitoring in Production

### Vercel Dashboard

1. Go to Vercel Dashboard → Your Project → Analytics
2. View real-time Web Vitals
3. Filter by page, device, location
4. Export data for analysis

### Custom Dashboard (Future)

Story 3.5 will implement:
- Custom ops dashboard
- Real-time metrics visualization
- Error tracking interface
- Alert configuration
- SLA tracking

## Performance Impact

The monitoring system is designed to have minimal impact:

- **Web Vitals**: Uses native browser APIs (zero overhead)
- **Error Tracking**: ~2KB gzipped JavaScript
- **API Calls**: Fire-and-forget with `keepalive: true`
- **Sampling**: Configurable to reduce load (default: 100%)

## Testing

### Development Mode

In development, metrics and errors are logged to console:

```bash
npm run build && PORT=3005 npm start

# Open browser console to see:
[Performance] LCP: 1500ms (good)
[Error Tracking] Captured: {...}
```

### Production Mode

In production, data is sent to endpoints:

```bash
# Check Vercel Analytics
https://vercel.com/your-project/analytics

# Check API logs
vercel logs --follow
```

## Troubleshooting

### Metrics Not Appearing

**Problem:** Web Vitals not showing in Vercel
**Solution:**
- Ensure `reportWebVitals` is exported from `pages/_app.tsx`
- Check Vercel Analytics is enabled for your project
- Wait 5-10 minutes for data to appear

### Errors Not Being Tracked

**Problem:** Errors not captured
**Solution:**
- Check error tracking is initialized in `_app.tsx`
- Verify `NODE_ENV === 'production'` or adjust config
- Check browser console for initialization message
- Verify `/api/analytics/errors` endpoint is accessible

### High Error Volume

**Problem:** Too many errors being tracked
**Solution:**
- Reduce sample rate: `sampleRate: 0.1` (10%)
- Add more ignored error patterns in `shouldIgnoreError()`
- Filter by severity: only track `error` and `fatal`

## Next Steps

- ✅ Story 3.1: Performance Monitoring & Analytics (Complete)
- 🚧 Story 3.2: Database Query Optimization
- 📋 Story 3.3: Frontend Performance Optimization
- 📋 Story 3.4: API Performance & Caching
- 📋 Story 3.5: Monitoring Dashboard & Alerts

## Files Created

- `src/lib/performance.ts` - Web Vitals tracking
- `src/lib/errorTracking.ts` - Error tracking
- `pages/api/analytics/web-vitals.ts` - Web Vitals endpoint
- `pages/api/analytics/errors.ts` - Errors endpoint
- `docs/performance/monitoring-setup.md` - This documentation

## References

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Analytics](https://nextjs.org/analytics)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Sentry Documentation](https://docs.sentry.io/)
