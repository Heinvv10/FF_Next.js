# WA Monitor Page - Development Log

**Page:** `/wa-monitor`
**Component:** `src/modules/wa-monitor/components/WaMonitorDashboard.tsx`
**API Routes:** `/api/wa-monitor-*`

---

## November 26, 2025 - 6:30 PM SAST

### 🔴 CRITICAL: Fixed "Failed to send WhatsApp message" Error

**Problem:**
Feedback sending feature completely broken for all users. Clicking "Send Feedback" button resulted in:
- Browser error: `POST /api/wa-monitor-send-feedback 500 (Internal Server Error)`
- API response: `"Failed to send WhatsApp message - Not connected to WhatsApp"`
- Symptom appeared to be network timeout initially (2+ hours of debugging)

**Symptoms Observed:**
1. User reported issue (only 1 user initially, but affected ALL users)
2. Incognito mode also failed (ruled out browser cache)
3. API endpoints timing out with "Failed to fetch"
4. High ping latency to VPS (230ms from South Africa)

**Initial Diagnosis (WRONG):**
- Thought it was network timeout due to SA → Lithuania latency (230ms)
- Thought it was browser cache issue
- Spent time increasing API timeouts to 60 seconds

**Actual Root Cause:**
WhatsApp Bridge service (`whatsapp-bridge-prod`) **disconnected from WhatsApp servers**

**How We Found It:**
After ruling out network/cache issues, checked server-side logs:
```bash
tail -50 /opt/velo-test-monitor/logs/whatsapp-bridge.log | grep "not connected"
# Found: "Message sent false Not connected to WhatsApp"
```

**Solution:**
```bash
ssh root@72.60.17.245
systemctl restart whatsapp-bridge-prod
# Verified reconnection in logs: "✓ Connected to WhatsApp!"
```

**Files Changed:**

1. **`pages/api/wa-monitor-send-feedback.ts`** (Lines 103, 132, 196-202)
   - Added 60-second timeout for slow SA connections
   - Added Next.js API config: `maxDuration: 60`

2. **`src/components/layout/header/BreadcrumbNavigation.tsx`** (Lines 13-37)
   - Fixed breadcrumb navigation paths (removed `/app` prefix)

3. **`src/modules/wa-monitor/TROUBLESHOOTING.md`** (NEW FILE)
   - Comprehensive troubleshooting guide
   - Quick fix commands

4. **`CLAUDE.md`** (Lines 647-668)
   - Added "Common Issue" section with quick fix

**Time to Fix:** ~2.5 hours (mostly wrong diagnosis)
**Time to Fix (next time):** 5 minutes (just restart whatsapp-bridge-prod)

**Keywords for Search:**
- "Not connected to WhatsApp"
- "Failed to send WhatsApp message"
- "WhatsApp Bridge disconnected"
- "wa-monitor-send-feedback 500 error"

---

## December 11, 2024 - 3:00 PM

### 🔧 Fixed Double Header Display Issue

**Problem:**
WA Monitor page was displaying duplicate headers/navigation bars:
- Two instances of "Home > QA > WhatsApp Monitor" breadcrumbs
- Two title sections showing "WhatsApp Monitor"
- User reported seeing duplicate navigation text stacked on top of each other

**Root Cause:**
The wa-monitor directory had its own `layout.tsx` file at `/app/(main)/wa-monitor/layout.tsx` that was applying a second layout on top of the existing `(main)/layout.tsx`. This caused nested layouts:
1. First layout from `/app/(main)/layout.tsx` (AppRouterLayout with sidebar)
2. Second layout from `/app/(main)/wa-monitor/layout.tsx` (duplicate header without sidebar)

**Investigation Steps:**
1. Initially removed duplicate header from WaMonitorDashboard component (incorrect target)
2. Discovered conflicting route structure: `/app/wa-monitor` vs `/app/(main)/wa-monitor`
3. Found extra layout file in wa-monitor directory applying its own Header component

**Solution:**
```bash
# Remove the redundant layout file
rm /home/louisdup/VF/Apps/FF_React/app/(main)/wa-monitor/layout.tsx

# Clean rebuild to ensure no cached layouts
rm -rf .next
npm run build
pm2 restart fibreflow-prod
```

**Files Changed:**

1. **DELETED: `app/(main)/wa-monitor/layout.tsx`**
   - Removed entire file (67 lines)
   - This layout was redundant as `(main)/layout.tsx` already provides navigation

2. **`src/modules/wa-monitor/components/WaMonitorDashboard.tsx`** (Lines 268-297)
   - Removed duplicate "WA Monitor Dashboard" header section
   - Kept action buttons (Refresh, Export CSV)

3. **`src/components/layout/AppRouterLayout.tsx`** (Lines 88-100)
   - Updated breadcrumb logic for wa-monitor routes
   - Removed "WhatsApp Monitor" from breadcrumbs array to avoid duplication

**Prevention:**
- All pages under `app/(main)/` automatically get the AppRouterLayout
- Never add a `layout.tsx` file in subdirectories unless you need a completely different layout
- If a page needs no sidebar, use the `getLayout` pattern in Pages Router instead

**Time to Fix:** ~30 minutes
**Deployments:** Production and Development environments

**Keywords for Search:**
- "double header"
- "duplicate navigation"
- "duplicate breadcrumbs"
- "nested layouts"
- "wa-monitor header duplication"
