# Meetings Module

## Overview
The Meetings module integrates with Fireflies.ai to automatically sync meeting transcripts, summaries, and action items into FibreFlow.

## Features
- **Fireflies Integration**: Automatic sync of meeting transcripts and summaries
- **Manual Sync**: On-demand sync via dashboard button
- **Automated Sync**: Scheduled cron jobs (11am & 5pm SAST)
- **Meeting Details**: View transcripts, participants, action items, and summaries
- **Stats Dashboard**: Track meeting metrics and trends

## Architecture

### Components
```
src/modules/meetings/
├── types/
│   └── meeting.types.ts          # TypeScript interfaces
├── components/
│   ├── MeetingCard.tsx           # Individual meeting card
│   ├── MeetingsList.tsx          # List view of meetings
│   ├── MeetingDetailModal.tsx    # Full meeting details
│   ├── MeetingStatsCards.tsx     # Summary statistics
│   ├── MeetingsSidebar.tsx       # Upcoming meetings sidebar
│   └── forms/                    # Meeting form components
├── hooks/
│   └── useMeetingForm.ts         # Form state management
├── utils/
│   └── meetingUtils.ts           # Helper functions
└── MeetingsDashboard.tsx         # Main dashboard component
```

### API Endpoints
- **`GET /api/meetings`** - Fetch meetings from Neon database
- **`POST /api/meetings?action=sync`** - Manual sync from Fireflies (dashboard button)
- **`POST /api/meetings-sync-cron`** - Automated sync endpoint (protected)

### Services
- **`src/services/fireflies/firefliesService.ts`**
  - `fetchFirefliesTranscripts()` - Fetch from Fireflies API
  - `syncFirefliesToNeon()` - Sync transcripts to Neon database

## Auto-Sync Configuration

### Sync Schedule
Meetings are automatically synced from Fireflies twice daily:
- **11:00 AM SAST** (09:00 UTC)
- **05:00 PM SAST** (15:00 UTC)

### Implementation Details

**1. Cron Endpoint** (`pages/api/meetings-sync-cron.ts`)
- Protected by `CRON_SECRET` bearer token
- Fetches latest transcripts from Fireflies GraphQL API
- Upserts to Neon database (ON CONFLICT updates)
- Returns sync count and timestamp

**2. VPS Cron Job**
```bash
# Run at 9am UTC (11am SAST)
0 9 * * * curl -X POST -H "Authorization: Bearer [CRON_SECRET]" \
  https://app.fibreflow.app/api/meetings-sync-cron >> /var/log/meetings-sync.log 2>&1

# Run at 3pm UTC (5pm SAST)
0 15 * * * curl -X POST -H "Authorization: Bearer [CRON_SECRET]" \
  https://app.fibreflow.app/api/meetings-sync-cron >> /var/log/meetings-sync.log 2>&1
```

**3. Manual Sync Button** (Dashboard)
- Located in meetings dashboard header
- Triggers `POST /api/meetings?action=sync`
- Shows loading spinner and success/error message
- Auto-reloads meetings after successful sync

### Environment Variables
```bash
FIREFLIES_API_KEY=your-fireflies-api-key    # Fireflies GraphQL API key
CRON_SECRET=your-cron-secret                # Protect cron endpoint
DATABASE_URL=your-neon-connection-string    # Neon PostgreSQL
```

## Database Schema

### `meetings` Table
```sql
CREATE TABLE meetings (
  id SERIAL PRIMARY KEY,
  fireflies_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meeting_date TIMESTAMP NOT NULL,
  duration INTEGER,
  transcript_url TEXT,
  summary JSONB,                    -- Keywords, action items, outline
  participants JSONB,               -- Array of attendee objects
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Usage

### View Meetings
Navigate to `/meetings` to view the meetings dashboard.

### Manual Sync
Click the "Sync from Fireflies" button in the dashboard header to trigger an immediate sync.

### Monitor Auto-Sync
```bash
# SSH into VPS
ssh root@72.60.17.245

# View sync logs
tail -f /var/log/meetings-sync.log

# Check cron schedule
crontab -l
```

### Test Cron Endpoint
```bash
curl -X POST \
  -H "Authorization: Bearer [CRON_SECRET]" \
  https://app.fibreflow.app/api/meetings-sync-cron
```

Expected response:
```json
{
  "success": true,
  "synced": 50,
  "timestamp": "2025-11-04T09:00:00.000Z",
  "message": "Synced 50 meetings from Fireflies"
}
```

## Fireflies.ai Integration

### GraphQL API
The module uses Fireflies GraphQL API to fetch transcripts:

```graphql
query {
  transcripts {
    id
    title
    date
    duration
    transcript_url
    summary {
      keywords
      action_items
      outline
    }
    meeting_attendees {
      name
      email
      displayName
    }
  }
}
```

### API Endpoint
- **URL**: `https://api.fireflies.ai/graphql`
- **Authentication**: Bearer token in Authorization header
- **Rate Limits**: As per Fireflies plan

## Troubleshooting

### "FIREFLIES_API_KEY not configured" Error ⚠️ COMMON ISSUE

**Symptoms**: Sync button shows error: `✗ Sync failed: FIREFLIES_API_KEY not configured`

**Root Cause**: API key is in `.env.local` but missing from VPS `.env.production`

**Fix**:
```bash
# 1. SSH into VPS and add API key
ssh root@72.60.17.245
nano /var/www/fibreflow/.env.production

# 2. Add this line:
FIREFLIES_API_KEY=894886b5-b232-4319-95c7-1296782e9ea6

# 3. Save and restart app
pm2 restart fibreflow-prod

# 4. Verify it works
curl -s "https://app.fibreflow.app/api/meetings?action=sync" -X POST
```

**Prevention**: Always ensure local `.env.local` and VPS `.env.production` have matching keys.

**Reference**: `docs/page-logs/meetings.md` - December 5, 2025 entry

### No meetings syncing
1. Verify `FIREFLIES_API_KEY` is valid
2. Check Fireflies account has recent meetings
3. Review PM2 logs: `pm2 logs fibreflow`
4. Test manual sync from dashboard

### Cron not running
```bash
# Check cron service
systemctl status cron

# Restart cron
systemctl restart cron
```

### 401 Unauthorized errors
- Verify `CRON_SECRET` matches in `.env.production` and crontab
- Restart PM2 after env changes: `pm2 restart fibreflow --update-env`

### View detailed logs
```bash
# Application logs
pm2 logs fibreflow

# Cron logs
tail -f /var/log/meetings-sync.log

# System cron logs
grep CRON /var/log/syslog
```

## Development

### Local Development
```bash
# Start development server
npm run build && PORT=3005 npm start

# Access meetings dashboard
http://localhost:3005/meetings
```

### Testing Sync
```bash
# Manual trigger via API
curl -X POST http://localhost:3005/api/meetings?action=sync
```

## Deployment

When deploying changes to the meetings module:

```bash
# VPS deployment
cd /var/www/fibreflow
git pull
npm ci
npm run build
pm2 restart fibreflow --update-env
```

## Related Documentation
- **VPS Cron Setup**: `/docs/VPS/MEETINGS_SYNC_CRON.md`
- **VPS Deployment**: `/docs/VPS/DEPLOYMENT.md`
- **Page Logs**: `/docs/page-logs/meetings.md`
- **Fireflies Service**: `/src/services/fireflies/firefliesService.ts`

## Module History

### November 4, 2025
- Added automated sync via VPS cron jobs (11am & 5pm SAST)
- Implemented manual sync button in dashboard
- Created protected cron endpoint with bearer token authentication
- Documented complete sync architecture and monitoring

### Previous
- Initial Fireflies integration
- Meeting dashboard and detail views
- Stats cards and list components
