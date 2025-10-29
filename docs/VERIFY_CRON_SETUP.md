# How to Verify Cron Setup is Working

## Quick Test Script

Run this to check if all endpoints are deployed:

```bash
node scripts/test-cron-flow.js
```

**Expected Output:**
```
✅ All endpoints are accessible!
📋 Summary:
   - Cron endpoint: ✅ Deployed
   - Meetings endpoint: ✅ Working
   - Extract endpoint: ✅ Deployed
   - Action items: ✅ Tracking
```

## Manual Verification Steps

### 1. Check Deployment Status in Vercel Dashboard

**URL**: https://vercel.com/velofibre/fibreflow-nextjs

**Check**:
- Latest commit is deployed
- Build status is "Ready" (not "Error")
- Look for commits: `52e10bd` and `0de103d`

### 2. Verify Cron Job is Configured

**Vercel Dashboard** → Your Project → **Settings** → **Cron Jobs**

You should see:
```
Path: /api/cron/sync-action-items
Schedule: 0 */6 * * *
Status: Active
```

### 3. Test Endpoints Manually

#### Test Meetings Sync
```bash
curl -X POST "https://fibreflow.app/api/meetings?action=sync"
```

**Expected**:
```json
{
  "success": true,
  "synced": 48,
  "message": "Synced 48 meetings from Fireflies"
}
```

#### Test Extract All
```bash
curl -X POST https://fibreflow.app/api/action-items/extract-all
```

**Expected**:
```json
{
  "success": true,
  "data": {
    "total_meetings": 48,
    "extracted": 0,
    "skipped": 666,
    "errors": 0
  }
}
```
(Skipped = already extracted, this is correct!)

#### Test Cron Endpoint
```bash
curl -X POST https://fibreflow.app/api/cron/sync-action-items
```

**Expected**:
```json
{
  "success": true,
  "message": "Full sync completed successfully",
  "data": {
    "meetings": {...},
    "action_items": {...}
  }
}
```

### 4. Check Cron Execution Logs

**Vercel Dashboard** → Your Project → **Logs**

Filter by: `/api/cron/sync-action-items`

**Look for:**
- `[Cron] Starting scheduled sync...`
- `[Cron] Step 1: Syncing meetings from Fireflies...`
- `[Cron] Synced X meetings from Fireflies`
- `[Cron] Step 2: Extracting action items...`
- `[Cron] Sync complete`

### 5. Verify Data is Being Created

**Check database:**
```sql
-- Recent meetings
SELECT COUNT(*), MAX(created_at) as latest
FROM meetings;

-- Recent action items
SELECT COUNT(*), MAX(created_at) as latest
FROM meeting_action_items;

-- Items created in last 24 hours
SELECT COUNT(*) as new_items
FROM meeting_action_items
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### 6. Check Next Cron Execution Time

**Vercel Dashboard** → Your Project → **Cron Jobs** → Click on your cron

You'll see:
- Last execution time
- Next execution time
- Execution history

## Troubleshooting

### Cron Endpoint Returns 404

**Problem**: Latest commit not deployed

**Solution**:
1. Check Vercel dashboard for build errors
2. If build failed, check error logs
3. Fix build errors and push again
4. Wait for successful deployment

### Cron Not Running

**Problem**: Cron jobs only work on production

**Check**:
- Is your domain configured? (fibreflow.app)
- Is the deployment on production (not preview)?
- Is vercel.json in the root with cron config?

### No New Data After Cron Runs

**Check**:
1. **Fireflies API Key**: Is it valid?
   ```bash
   # Check if env var is set in Vercel
   # Dashboard → Settings → Environment Variables
   FIREFLIES_API_KEY=...
   ```

2. **Are there new meetings?**
   - Log into Fireflies.ai
   - Check if new meetings exist

3. **Deduplication working?**
   - Cron skips already-extracted items
   - This is normal behavior!

### Test Cron Manually (For Debugging)

```bash
# Trigger the cron endpoint manually
curl -X POST https://fibreflow.app/api/cron/sync-action-items \
  -H "Content-Type: application/json"
```

Watch for:
- HTTP 200 = Success
- HTTP 500 = Internal error (check logs)
- HTTP 401 = CRON_SECRET mismatch

## Expected Behavior

### First Cron Run (Initial Setup)
- Syncs 48 meetings from Fireflies
- Extracts 666 action items
- Takes ~30-60 seconds

### Subsequent Cron Runs
- Syncs 0-5 new meetings (depends on meeting frequency)
- Extracts 0-50 new action items
- Takes ~10-20 seconds
- Most items skipped (already extracted)

### Cron Schedule
Runs at:
- 00:00 UTC (02:00 SAST)
- 06:00 UTC (08:00 SAST)
- 12:00 UTC (14:00 SAST)
- 18:00 UTC (20:00 SAST)

## Success Indicators

✅ **Working Correctly When:**
1. Cron shows as "Active" in Vercel
2. Logs show successful executions every 6 hours
3. New meetings appear in database
4. New action items extracted from new meetings
5. No errors in Vercel logs
6. Action items pages show updated data

## Quick Verification Checklist

- [ ] Run `node scripts/test-cron-flow.js` - All checks pass
- [ ] Check Vercel dashboard - Cron job configured
- [ ] Check Vercel logs - Recent successful execution
- [ ] Check database - New items in last 24 hours
- [ ] Test manual trigger - Endpoint responds 200
- [ ] Check Fireflies - API key valid

## Need Help?

If cron isn't working after following this guide:

1. Check Vercel logs for specific error messages
2. Verify FIREFLIES_API_KEY is set correctly
3. Test endpoints individually (meetings sync, extract-all)
4. Check if build deployed successfully
5. Verify vercel.json has cron configuration
