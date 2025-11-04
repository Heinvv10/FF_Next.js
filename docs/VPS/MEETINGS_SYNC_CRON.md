# Meetings Auto-Sync Cron Job Setup

## Overview
Automated sync of Fireflies meeting transcripts to Neon database twice daily at:
- **11:00 AM SAST** (09:00 UTC)
- **05:00 PM SAST** (15:00 UTC)

## Prerequisites
1. VPS server running (72.60.17.245)
2. `CRON_SECRET` environment variable configured in `.env.production`
3. `FIREFLIES_API_KEY` environment variable configured

## Setup Instructions

### 1. Set Environment Variables

SSH into the VPS and add/verify these variables in `/var/www/fibreflow/.env.production`:

```bash
# SSH into VPS
sshpass -p 'VeloF@2025@@' ssh -o StrictHostKeyChecking=no root@72.60.17.245

# Edit environment file
nano /var/www/fibreflow/.env.production
```

Add these lines (generate a strong random secret):
```bash
CRON_SECRET=your-secure-random-secret-here
FIREFLIES_API_KEY=your-fireflies-api-key-here
```

**Generate secure CRON_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Install Cron Job

On the VPS server, edit the crontab:

```bash
crontab -e
```

Add these two lines:

```bash
# Sync Fireflies meetings at 11am SAST (9am UTC)
0 9 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://app.fibreflow.app/api/meetings-sync-cron >> /var/log/meetings-sync.log 2>&1

# Sync Fireflies meetings at 5pm SAST (3pm UTC)
0 15 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://app.fibreflow.app/api/meetings-sync-cron >> /var/log/meetings-sync.log 2>&1
```

**Replace `YOUR_CRON_SECRET`** with the actual secret from `.env.production`.

### 3. Verify Cron Job

Check cron is scheduled:
```bash
crontab -l
```

Check log file exists:
```bash
touch /var/log/meetings-sync.log
chmod 644 /var/log/meetings-sync.log
```

### 4. Test the Endpoint

Manual test from VPS:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://app.fibreflow.app/api/meetings-sync-cron
```

Expected response:
```json
{
  "success": true,
  "synced": 42,
  "timestamp": "2025-11-04T09:00:00.000Z",
  "message": "Synced 42 meetings from Fireflies"
}
```

## Monitoring

### View Sync Logs
```bash
tail -f /var/log/meetings-sync.log
```

### Check Last Sync Time
```bash
ls -lh /var/log/meetings-sync.log
```

### Manual Sync (Ad-hoc)
Users can trigger manual sync from the Meetings dashboard "Sync from Fireflies" button.

## Troubleshooting

### Cron not running
```bash
# Check cron service status
systemctl status cron

# Restart cron service
systemctl restart cron
```

### 401 Unauthorized Error
- Verify `CRON_SECRET` matches between `.env.production` and crontab
- Check environment variable is loaded (restart PM2 after .env changes):
  ```bash
  pm2 restart fibreflow
  ```

### 500 Server Error
- Check `FIREFLIES_API_KEY` is configured
- Review PM2 logs: `pm2 logs fibreflow`
- Check Neon database connection

### No meetings synced
- Verify Fireflies API key is valid
- Check Fireflies account has recent meetings
- Review API response in logs

## API Endpoint Details

**Endpoint:** `/api/meetings-sync-cron`
**Method:** `POST`
**Authentication:** Bearer token via `Authorization` header
**Rate Limit:** None (internal cron only)

**Security Features:**
- Protected by secret token
- Logs unauthorized attempts
- Only accepts POST requests
- Returns structured JSON responses

## Timezone Reference
- **SAST** (South Africa Standard Time) = UTC+2
- No daylight saving time adjustments needed
- Cron uses UTC times (always subtract 2 hours from SAST)

## File Locations

- **Cron Endpoint:** `/pages/api/meetings-sync-cron.ts`
- **Service Logic:** `/src/services/fireflies/firefliesService.ts`
- **Environment Vars:** `/var/www/fibreflow/.env.production`
- **Cron Logs:** `/var/log/meetings-sync.log`
- **PM2 Logs:** `pm2 logs fibreflow`

## Maintenance

### Restart After Code Changes
```bash
cd /var/www/fibreflow
git pull
npm run build
pm2 restart fibreflow
```

### Change Sync Times
Edit crontab and change the hour values:
```bash
crontab -e
# Change: 0 9 * * * (9am UTC = 11am SAST)
# Change: 0 15 * * * (3pm UTC = 5pm SAST)
```

### Disable Auto-Sync
```bash
crontab -e
# Comment out the lines with #
```
