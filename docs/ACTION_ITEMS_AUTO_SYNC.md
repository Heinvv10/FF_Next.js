# Action Items Auto-Sync Setup

## Overview

Action items are automatically synced from Fireflies meetings every 6 hours using Vercel Cron Jobs.

## How It Works

1. **Vercel Cron** triggers `/api/cron/sync-action-items` every 6 hours
2. **Step 1**: Cron calls `/api/meetings?action=sync` to sync meetings from Fireflies API
3. **Step 2**: Cron calls `/api/action-items/extract-all` to extract action items
4. **Extract-all** finds meetings with action items in the database
5. **Parser** extracts action items from Fireflies text format
6. **Database** stores new items (skips already extracted)

**Critical**: The cron job does BOTH steps - first syncs meetings, then extracts action items.

## Schedule

**Cron Expression**: `0 */6 * * *`

Runs at:
- 00:00 UTC (02:00 SAST)
- 06:00 UTC (08:00 SAST)
- 12:00 UTC (14:00 SAST)
- 18:00 UTC (20:00 SAST)

## Configuration

### vercel.json
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-action-items",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Environment Variables (Optional)
```bash
# Add to Vercel environment variables for security
CRON_SECRET=your-random-secret-here
```

The cron endpoint will verify this secret in production to prevent unauthorized calls.

## API Endpoints

### 1. Extract All - `/api/action-items/extract-all`
**Method**: POST

Extracts action items from all meetings that have them.

**Response**:
```json
{
  "success": true,
  "data": {
    "total_meetings": 48,
    "extracted": 120,
    "skipped": 40,
    "errors": 1,
    "error_details": [...]
  },
  "message": "Extracted 120 action items from 47 meetings"
}
```

### 2. Cron Handler - `/api/cron/sync-action-items`
**Method**: POST (called by Vercel Cron)

Wrapper that calls extract-all endpoint.

**Headers** (production only):
```
Authorization: Bearer ${CRON_SECRET}
```

## Manual Sync

To manually trigger a sync:

```bash
# Using curl
curl -X POST https://fibreflow.app/api/action-items/extract-all

# Using the script (when server is running locally)
node scripts/extract-meeting-action-items.js
```

## Monitoring

### Check Cron Logs in Vercel

1. Go to Vercel Dashboard → Your Project
2. Click "Logs" tab
3. Filter by `/api/cron/sync-action-items`

### Check Extraction Results

```sql
-- Recently extracted items
SELECT
  COUNT(*) as total,
  DATE(created_at) as date
FROM meeting_action_items
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;

-- Items created in last 24 hours
SELECT COUNT(*) as new_items
FROM meeting_action_items
WHERE created_at > NOW() - INTERVAL '24 hours';
```

## Troubleshooting

### Cron Not Running

**Check Vercel Dashboard**:
- Project → Settings → Cron Jobs
- Verify cron is enabled
- Check last execution time

**Common Issues**:
- Cron jobs only work on production deployments
- Preview deployments don't run cron jobs
- Free tier has limits on cron frequency

### No New Items Extracted

**Possible Reasons**:
1. No new meetings since last sync
2. Meetings don't have action items
3. Action items already extracted (deduplication works)
4. Fireflies API key expired

**Check**:
```bash
# Count meetings without extracted items
SELECT COUNT(*) as unprocessed
FROM meetings m
WHERE m.summary->>'action_items' IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM meeting_action_items ai
  WHERE ai.meeting_id = m.id
);
```

### Extraction Errors

Check the error_details in the API response:
```json
{
  "error_details": [
    {
      "meeting_id": 123,
      "title": "Meeting Name",
      "error": "Error message"
    }
  ]
}
```

Common errors:
- Malformed action items text
- Missing participants data
- Database constraint violations

## Upgrading to Webhooks (Future)

When Fireflies webhook support is available:

1. Create webhook endpoint: `/api/webhooks/fireflies`
2. Register URL in Fireflies dashboard
3. Verify webhook signature
4. Extract action items immediately on meeting completion
5. Keep cron as fallback

**Benefits**:
- Real-time extraction (no 6-hour delay)
- Lower API usage
- Immediate user feedback

## Cost & Limits

### Vercel Cron (Hobby Plan)
- ✅ Included in hobby plan
- ✅ No additional cost
- ⚠️ Limited to certain intervals

### Vercel Cron (Pro Plan)
- ✅ More flexible schedules
- ✅ Higher execution limits
- ✅ Better monitoring

## Testing

### Test Extract-All Locally
```bash
# Start server
npm run build && PORT=3005 npm start

# In another terminal
curl -X POST http://localhost:3005/api/action-items/extract-all
```

### Test Cron Endpoint
```bash
# Without secret (development)
curl -X POST http://localhost:3005/api/cron/sync-action-items

# With secret (production simulation)
curl -X POST http://localhost:3005/api/cron/sync-action-items \
  -H "Authorization: Bearer your-secret"
```

## Performance

**Current Stats**:
- 48 meetings with action items
- ~666 total action items
- Extraction time: ~30 seconds
- Database queries: Efficient (uses WHERE EXISTS for deduplication)

**Scalability**:
- ✅ Works well up to 1000 meetings
- ⚠️ May need optimization beyond 5000 meetings
- 💡 Consider batching or incremental extraction for large datasets

## Security

1. **Cron Secret**: Prevents unauthorized cron calls
2. **Database**: All queries use parameterized statements
3. **Rate Limiting**: Vercel automatically rate limits API calls
4. **Deduplication**: Prevents duplicate action items

## Next Steps

- [ ] Add CRON_SECRET to Vercel environment variables
- [ ] Monitor first few cron executions
- [ ] Add Slack/email notifications for sync failures (optional)
- [ ] Implement webhook endpoint when Fireflies supports it
