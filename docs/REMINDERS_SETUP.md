# Daily Reminders System - Setup Guide

## Overview
The daily reminders system allows users to create personal reminders and receive them via email once per day.

## Architecture
- **Frontend**: Settings page at `/settings` → "Reminders" tab
- **Backend**:
  - API endpoints: `/api/reminders`, `/api/reminders-update`, `/api/reminders-delete`, `/api/reminder-preferences`
  - Database: `reminders` and `reminder_preferences` tables in Neon PostgreSQL
- **Email**: Resend API for sending daily reminder emails
- **Scheduling**: VPS cron job runs daily at 8 AM

## Setup Instructions

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create a new API key in the dashboard
3. Copy the API key (starts with `re_`)

**Pricing**: 3,000 free emails/month, then starting at $20/month

### 2. Add Environment Variables

#### VPS (Production)
```bash
# SSH into VPS
sshpass -p 'VeloF@2025@@' ssh -o StrictHostKeyChecking=no root@72.60.17.245

# Edit environment file
nano /var/www/fibreflow/.env.production

# Add this line:
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Save and exit (Ctrl+X, Y, Enter)
```

#### Vercel (Optional - for Vercel deployment)
1. Go to [vercel.com](https://vercel.com) → Your Project → Settings → Environment Variables
2. Add:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_xxxxxxxxxxxxx`
   - **Environments**: Production, Preview, Development
3. Click "Save"

### 3. Install Dependencies

```bash
# On VPS
cd /var/www/fibreflow
npm install resend dotenv
```

### 4. Run Database Migration

```bash
# On VPS or locally (both use same Neon database)
psql $DATABASE_URL -f scripts/migrations/create-reminders-tables.sql
```

**Verify tables created:**
```bash
psql $DATABASE_URL -c "\dt reminders*"
```

Expected output:
```
 reminder_preferences | table | ...
 reminders           | table | ...
```

### 5. Test the System

#### Test API Endpoints
```bash
# Build and start the server
cd /var/www/fibreflow
npm run build
PORT=3005 npm start

# In browser, go to:
# https://app.fibreflow.app/settings
# Click "Reminders" tab
# Create a test reminder
```

#### Test Email Sending (Manual)
```bash
cd /var/www/fibreflow
npx tsx scripts/cron/send-daily-reminders.ts
```

Expected output:
```
🚀 Starting daily reminders cron job...
📅 Date: 2025-01-15T08:00:00.000Z
👥 Found 1 users with pending reminders
  ✅ User user@example.com: Sent 3 reminders (ID: abc123)

📊 Summary:
  ✅ Success: 1
  ❌ Errors: 0
  📧 Total processed: 1
✅ Cron job completed
```

### 6. Set Up Cron Job

```bash
# Edit crontab
crontab -e

# Add this line (sends at 8 AM daily):
0 8 * * * cd /var/www/fibreflow && /usr/bin/npx tsx scripts/cron/send-daily-reminders.ts >> /var/log/reminders-cron.log 2>&1

# Save and exit

# Verify cron job is added:
crontab -l
```

### 7. Verify Cron is Working

```bash
# Check cron logs
tail -f /var/log/reminders-cron.log

# Force run manually to test
cd /var/www/fibreflow && npx tsx scripts/cron/send-daily-reminders.ts
```

## Usage

### For Users

1. Go to **Settings** → **Reminders** tab
2. Enable "Daily email reminders"
3. Set preferred send time (default: 8:00 AM)
4. Select timezone
5. Click "Add Reminder" to create reminders
6. Manage reminders:
   - ✅ Mark as completed
   - ❌ Dismiss
   - 🗑️ Delete

### Email Format

Users receive a single daily email containing:
- High priority reminders (red)
- Medium priority reminders (amber)
- Low priority reminders (blue)
- Due dates and descriptions

## Troubleshooting

### Emails Not Sending

**Check Resend API Key:**
```bash
# On VPS
echo $RESEND_API_KEY
# Should output: re_xxxxxxxxxxxxx

# If empty, add to .env.production
```

**Check Resend Dashboard:**
- Go to [resend.com/emails](https://resend.com/emails)
- Check for failed deliveries
- Verify domain authentication (optional but recommended)

**Check Cron Logs:**
```bash
tail -100 /var/log/reminders-cron.log
```

### Database Issues

**Tables don't exist:**
```bash
psql $DATABASE_URL -f scripts/migrations/create-reminders-tables.sql
```

**Test connection:**
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM reminders;"
```

### Cron Job Not Running

**Check cron service:**
```bash
systemctl status cron
```

**View system cron logs:**
```bash
journalctl -u cron | tail -50
```

**Test cron job manually:**
```bash
cd /var/www/fibreflow && npx tsx scripts/cron/send-daily-reminders.ts
```

## Cost Estimation

**Resend Free Tier (3,000 emails/month):**
- 10 users: 10 years free
- 50 users: 2 years free
- 100 users: 1 year free
- 500 users: 2 months free

**When to Upgrade:**
- More than 100 daily active users
- Need higher deliverability
- Want custom domain emails (e.g., reminders@yourdomain.com)

**Resend Pro ($20/month):**
- 50,000 emails/month
- Custom domains
- Better support

## Maintenance

### Monitor Usage
- Check Resend dashboard monthly for email count
- Review cron logs weekly: `/var/log/reminders-cron.log`

### Update Cron Schedule
```bash
crontab -e
# Change: 0 8 * * * (8 AM daily)
# To: 0 9 * * * (9 AM daily)
# Or: 0 8,18 * * * (8 AM and 6 PM)
```

### Disable Temporarily
```bash
crontab -e
# Add # at start: # 0 8 * * * ...
```

### Re-enable
```bash
crontab -e
# Remove #: 0 8 * * * ...
```

## Files Structure

```
FF_React/
├── scripts/
│   ├── migrations/
│   │   └── create-reminders-tables.sql
│   └── cron/
│       ├── send-daily-reminders.ts
│       └── README.md
├── src/
│   ├── components/
│   │   └── settings/
│   │       └── RemindersTab.tsx
│   ├── lib/
│   │   └── email/
│   │       ├── resendClient.ts
│   │       └── templates/
│   │           └── dailyReminder.ts
│   └── pages/
│       └── Settings.tsx
└── pages/
    └── api/
        ├── reminders.ts
        ├── reminders-update.ts
        ├── reminders-delete.ts
        └── reminder-preferences.ts
```

## Support

For issues:
1. Check this guide first
2. Review logs: `/var/log/reminders-cron.log`
3. Test manually: `npx tsx scripts/cron/send-daily-reminders.ts`
4. Check Resend dashboard for delivery issues
5. Verify database tables exist

## Future Enhancements

Potential improvements:
- [ ] SMS reminders via Twilio
- [ ] Push notifications (web push)
- [ ] Recurring reminders (daily/weekly)
- [ ] Reminder categories/tags
- [ ] Team shared reminders
- [ ] Reminder templates
- [ ] Snooze functionality
