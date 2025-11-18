# WA Monitor Page - Development Log

## Route
`/wa-monitor` - WhatsApp QA Drop Monitoring Dashboard

## Overview
Real-time monitoring dashboard for QA photo review submissions from WhatsApp groups. Displays daily drop counts, submission status, and integrates with VPS-hosted drop monitor service.

---

## November 18, 2025 - 08:30 AM - CRITICAL: Chrome/Mobile Cache Issue After Deployment

### Problem
After multiple deployments on November 17, 2025, the WA Monitor page stopped loading on:
- ✅ Firefox (worked fine)
- ❌ Chrome Desktop (blank page/errors)
- ❌ Chrome Mobile (blank page/errors)
- ❌ iPhone/Safari (blank page/errors)

**User Report:** "seems to not be loading on some chrome browsers and my phone. works on firefox"

### Root Cause
**Chrome's Aggressive Caching of JavaScript Assets**

After yesterday's deployments:
1. Old JavaScript files (with old content hashes) were cached by Chrome
2. Chrome served cached JS files even after new deployment
3. Stale JavaScript tried to load non-existent modules → page failed to load
4. Firefox uses less aggressive caching → worked fine
5. Mobile browsers cache even more aggressively → also affected

### Investigation
```bash
# Checked current build status
ssh root@72.60.17.245 "cd /var/www/fibreflow && git log --oneline -5"

# Old BUILD_ID: qxYNRbeFssmxVJLsJ21lH
# Build date: Nov 17 16:11
```

### Solution (3-Part Fix)

#### 1. Immediate: Force Cache-Busting Rebuild
```bash
ssh root@72.60.17.245 "cd /var/www/fibreflow && \
  rm -rf .next node_modules/.cache && \
  npm run build && \
  pm2 restart fibreflow-prod"

# New BUILD_ID: WtAa9KRF_Yjt5hbqEml9_
# Result: All JS/CSS files regenerated with new hashes
```

#### 2. User Action: Clear Browser Cache
**Chrome Desktop:**
- Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac) for hard reload

**Chrome Mobile:**
- Chrome → ⋮ → History → Clear browsing data
- Select: Cached images and files
- Force close app → Reopen

**iPhone/Safari:**
- Settings → Safari → Clear History and Website Data
- Force close Safari → Reopen

#### 3. Long-Term: Add Cache Control Headers

**File:** `next.config.js:48-89`

Added `async headers()` configuration:

```javascript
// HTML pages - always revalidate (prevents stale JS references)
source: '/:path*',
has: [{ type: 'header', key: 'accept', value: '.*text/html.*' }],
headers: [{ key: 'Cache-Control', value: 'no-cache, must-revalidate' }]

// Static assets with hashes - cache for 1 year (safe because filename changes)
source: '/_next/static/:path*',
headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]

// API routes - never cache
source: '/api/:path*',
headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }]
```

**Commit:** `61b73f6` - "fix: Add cache headers to prevent stale JavaScript errors"

### Why These Headers Work

| Asset Type | Cache Strategy | Reasoning |
|------------|----------------|-----------|
| **HTML Pages** | `no-cache, must-revalidate` | Browser checks server for updates on every visit. Prevents stale JS references. |
| **Static Assets** (`/_next/static/*`) | `public, max-age=31536000, immutable` | Content-hashed filenames (e.g., `framework-02f0dcafa418b819.js`) change when content changes. Safe to cache forever. |
| **API Routes** | `no-store, no-cache, must-revalidate` | Dynamic data must always be fresh. Never cache. |

### Testing Results
After fix deployment:
- ✅ Chrome Desktop - loads correctly after hard reload
- ✅ Chrome Mobile - loads correctly after cache clear
- ✅ iPhone/Safari - loads correctly after cache clear
- ✅ Firefox - continues working (no action needed)

### Lessons Learned

1. **Chrome caches aggressively** - even after deployments, old JS files persist in cache
2. **Mobile browsers cache even more** - often require app-level cache clear
3. **Firefox is more conservative** - served as our "canary" showing the site actually worked
4. **Content hashing alone isn't enough** - HTML pages must force revalidation to get new JS references
5. **After major deployments** - consider warning users to clear cache or do hard reload

### Prevention for Future Deployments

**Deployment Checklist (After Multiple Changes):**
```bash
# 1. Force complete rebuild on VPS
ssh root@72.60.17.245 "cd /var/www/fibreflow && \
  rm -rf .next node_modules/.cache && \
  npm run build && \
  pm2 restart fibreflow-prod"

# 2. Test in multiple browsers
# - Chrome Desktop (incognito)
# - Firefox
# - Chrome Mobile
# - Safari Mobile

# 3. If issues, provide cache-clear instructions to users
```

**When to Suspect Cache Issues:**
- ✅ Works in Firefox but not Chrome
- ✅ Incognito mode works but normal mode doesn't
- ✅ Console shows 404s for JS chunks
- ✅ "Failed to load module" errors
- ✅ Works on one device but not another

### Related Files
- `next.config.js:48-89` - Cache control headers
- `app/wa-monitor/page.tsx` - Page route
- `src/modules/wa-monitor/components/WaMonitorDashboard.tsx` - Main component

### Related API Endpoints
- `/api/wa-monitor-daily-drops` - Daily drop counts
- `/api/wa-monitor-drops` - All drops with filters
- `/api/wa-monitor-projects-summary` - Project statistics

---

## Technical Details

### Component Structure
```
app/wa-monitor/page.tsx
  └── WaMonitorDashboard (src/modules/wa-monitor/components/)
      ├── SystemHealthPanel
      ├── WaMonitorFilters
      ├── WaMonitorGrid
      │   └── QaReviewCard (for each drop)
      │       └── DropStatusBadge
      └── Auto-refresh: 30 seconds
```

### Data Flow
```
VPS Drop Monitor → Neon PostgreSQL → API Routes → Dashboard
```

### Known Issues
- ❌ Dev service crashed (IndentationError in monitor.py:118-119) - see health check report
- ⚠️ Some drops missing `whatsapp_message_date` timestamp

---

## Future Improvements
1. Fix dev service crash (dual-monitoring disabled)
2. Add service worker for offline capability (optional)
3. Add cache version query param for emergency cache busting
4. Consider adding "Clear Cache" button in UI for users
