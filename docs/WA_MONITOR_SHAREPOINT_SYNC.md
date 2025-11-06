# WA Monitor SharePoint Sync Documentation

## Overview
Automated daily synchronization of WA Monitor drop counts to SharePoint (NeonDbase sheet) with email notifications.

## Schedule
- **Sync Time**: 8:00pm SAST daily (20:00 SAST / 18:00 UTC)
- **Watchdog Check**: 8:30pm SAST daily (20:30 SAST / 18:30 UTC)

## Email Notifications
Sent to: **ai@velocityfibre.co.za**

### Email Types

1. **✅ Success**
   - All projects synced successfully
   - Shows: succeeded/failed/total counts
   - Includes: sync duration

2. **⚠️ Partial Success**
   - Some projects failed to sync
   - Shows: which projects failed
   - Includes: error details

3. **❌ Failure**
   - Sync completely failed
   - Shows: error message
   - Includes: troubleshooting info

4. **🚨 Watchdog Alert** (8:30pm)
   - Sent if sync hasn't completed by 8:30pm
   - Indicates: missing or stuck sync

## Cron Jobs

```bash
# Main sync (8pm SAST)
0 18 * * * cd /var/www/fibreflow && /usr/bin/node scripts/sync-wa-monitor-sharepoint.js >> /var/log/wa-monitor-sharepoint-sync.log 2>&1

# Watchdog check (8:30pm SAST)
30 18 * * * cd /var/www/fibreflow && /usr/bin/node scripts/check-sharepoint-sync-completion.js >> /var/log/wa-monitor-sharepoint-watchdog.log 2>&1
```

## Log Files

```bash
# Sync logs
/var/log/wa-monitor-sharepoint-sync.log

# Watchdog logs
/var/log/wa-monitor-sharepoint-watchdog.log
```

## Monitoring

### View Logs
```bash
# Sync logs (tail)
tail -f /var/log/wa-monitor-sharepoint-sync.log

# Watchdog logs
tail -f /var/log/wa-monitor-sharepoint-watchdog.log

# Last 50 lines
tail -50 /var/log/wa-monitor-sharepoint-sync.log
```

### Check Cron Status
```bash
# List all cron jobs
crontab -l

# Check if cron is running
systemctl status cron
```

### Manual Testing
```bash
# Test sync script
cd /var/www/fibreflow && node scripts/sync-wa-monitor-sharepoint.js

# Test watchdog script
cd /var/www/fibreflow && node scripts/check-sharepoint-sync-completion.js
```

## Features

### Retry Logic
- **3 retry attempts** per row
- **Exponential backoff**: 2s → 4s → 8s
- **30-second timeout** per request
- Individual row failures don't block others

### Rate Limiting
- **1-second delay** between project writes
- Reduces Microsoft Graph API load
- Prevents throttling

### SharePoint Integration
- **Sheet**: NeonDbase
- **Columns**:
  - A: Date (YYYY-MM-DD)
  - B: Project name
  - C: Total drops submitted

## Troubleshooting

### No Email Received
1. Check RESEND_API_KEY in `/var/www/fibreflow/.env.production`
2. Check sync logs for errors
3. Verify email domain (alerts@mail.fibreflow.app)

### Sync Failures
1. Check Microsoft Graph API credentials
2. Verify SharePoint permissions
3. Check network connectivity
4. Review retry logs in output

### Watchdog Alerts
1. Check if main sync cron is running
2. Verify cron job schedule (18:00 UTC = 20:00 SAST)
3. Check server time: `date`

## Environment Variables

Required in `/var/www/fibreflow/.env.production`:

```bash
# SharePoint
SHAREPOINT_TENANT_ID=...
SHAREPOINT_CLIENT_ID=...
SHAREPOINT_CLIENT_SECRET=...
SHAREPOINT_SITE_ID=...
SHAREPOINT_DRIVE_ID=...
SHAREPOINT_FILE_ID=...
SHAREPOINT_WORKSHEET_NAME=NeonDbase

# Email
RESEND_API_KEY=re_...
```

## Dashboard
View live data: https://app.fibreflow.app/wa-monitor

## Support
For issues, check:
1. Log files first
2. Email inbox (ai@velocityfibre.co.za)
3. Cron job status
4. Environment variables

---

**Last Updated**: November 6, 2025
**Version**: 1.0.0
