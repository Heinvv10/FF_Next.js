# WA Monitor - Drop Number Validation System

**Implemented:** November 14, 2025
**Status:** ✅ PRODUCTION (Mohadin only)
**Version:** 1.0

---

## Overview

Real-time validation system that checks drop numbers submitted via WhatsApp against a master list from SharePoint before adding them to the database. Invalid drops are rejected with automatic WhatsApp replies to agents.

## Architecture

```
WhatsApp Message (DR Number)
    ↓
Drop Monitor (Python)
    ↓
Validate against Neon valid_drop_numbers table
    ↓
┌─────────────┬─────────────┐
│   VALID     │   INVALID   │
└─────────────┴─────────────┘
      ↓              ↓
  Process      Reject + Auto-Reply
      ↓              ↓
qa_photo_reviews   invalid_drop_submissions
      ↓              ↓
  Dashboard      Logged Only
```

---

## Database Tables

### 1. `valid_drop_numbers` (Validation Reference)

**Purpose:** Master list of valid drop numbers from SharePoint

```sql
CREATE TABLE valid_drop_numbers (
    drop_number VARCHAR(20) PRIMARY KEY,
    project VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    sync_source VARCHAR(100) DEFAULT 'sharepoint_hld_home',
    sync_timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_valid_drops_project ON valid_drop_numbers(project);
CREATE INDEX idx_valid_drops_lookup ON valid_drop_numbers(drop_number, project);
```

**Current Data:**
- **Mohadin:** 22,140 drops (DR1874110 → DR1856517)
- **Lawley:** Not loaded (validation disabled)
- **Velo Test:** Not loaded (validation disabled)
- **Mamelodi:** Not loaded (validation disabled)

**Query Performance:** ~20ms per lookup (indexed)

---

### 2. `invalid_drop_submissions` (Rejection Log)

**Purpose:** Track all rejected drop submissions for analysis

```sql
CREATE TABLE invalid_drop_submissions (
    id SERIAL PRIMARY KEY,
    drop_number VARCHAR(20),
    project VARCHAR(100),
    sender VARCHAR(50),
    group_jid VARCHAR(100),
    submitted_at TIMESTAMP DEFAULT NOW(),
    reason VARCHAR(100) DEFAULT 'not_in_valid_list'
);
```

**Auto-created** by monitor on first rejection.

---

## Validation Logic

### Current Behavior (v1.0)

**MOHADIN ONLY:**
```python
if project_name == 'Mohadin':
    # Validate against database
    if not validate_drop_number(drop_number, project_name):
        # REJECT
        log_invalid_drop()
        send_whatsapp_reply("❌ Invalid Drop Number...")
        return False  # Stop processing
    else:
        # ACCEPT
        process_normally()
```

**OTHER PROJECTS (Lawley, Velo Test, Mamelodi):**
```python
else:
    # Skip validation - accept all
    process_normally()
```

---

## WhatsApp Auto-Reply

### Implementation

Uses WhatsApp Bridge API on `localhost:8080`

```python
def send_whatsapp_reply(group_jid: str, message: str):
    POST http://localhost:8080/api/send
    {
        "recipient": "120363421532174586@g.us",
        "message": "❌ Invalid Drop Number\n\nDrop DR9999999 is not in the valid list for Mohadin.\n\nPlease submit a valid drop number from the project plan."
    }
```

**Response Time:** ~100-200ms

### Reply Message Format

```
❌ *Invalid Drop Number*

Drop {drop_number} is not in the valid list for {project_name}.

Please submit a valid drop number from the project plan.
```

---

## SharePoint Sync

### Sync Script

**Location:** `/home/louisdup/VF/Apps/FF_React/scripts/sync-mohadin-valid-drops.js`

**What it does:**
1. Authenticates with SharePoint using OAuth2
2. Resolves sharing URL to file ID
3. Reads column A (labels) from HLD_Home worksheet (A2:A22141)
4. Batch inserts to Neon (500 drops per batch)
5. Uses `ON CONFLICT DO UPDATE` for idempotency

**Usage:**
```bash
node scripts/sync-mohadin-valid-drops.js
```

**Performance:**
- 22,140 drops synced in ~45 seconds
- ~500 drops/second throughput

**Source Data:**
- **File:** VF_Project_Tracker_Mohadin
- **Sheet:** HLD_Home
- **Range:** A2:A22141
- **SharePoint URL:** `https://blitzfibre.sharepoint.com/:x:/s/Velocity_Manco/EYm7g0w6Y1dFgGB_m4YlBxgBeVJpoDXAYjdvK-ZfgHoOqA`

---

## Deployment

### Files Modified

**1. Drop Monitor** (`/opt/wa-monitor/prod/modules/monitor.py`)

Changes:
- Added `validate_drop_number()` method
- Added `log_invalid_drop()` method
- Added `send_whatsapp_reply()` method
- Modified `process_message()` to validate Mohadin drops
- Added `http.client` import

**2. Database**

New tables:
- `valid_drop_numbers` (created manually via psql)
- `invalid_drop_submissions` (auto-created by monitor)

### Deployment Commands

```bash
# 1. Sync validation data (one-time per project)
node scripts/sync-mohadin-valid-drops.js

# 2. Deploy updated monitor
scp scripts/monitor-with-validation.py root@72.60.17.245:/tmp/monitor.py
ssh root@72.60.17.245
cp /tmp/monitor.py /opt/wa-monitor/prod/modules/monitor.py
/opt/wa-monitor/prod/restart-monitor.sh  # ALWAYS use safe restart!
```

---

## Monitoring & Verification

### Check Validation Data

```bash
# Count valid drops per project
psql $DATABASE_URL -c "SELECT project, COUNT(*) FROM valid_drop_numbers GROUP BY project;"

# Check specific drop
psql $DATABASE_URL -c "SELECT * FROM valid_drop_numbers WHERE drop_number = 'DR1874110';"
```

### Monitor Rejections

```bash
# View recent rejections
psql $DATABASE_URL -c "
  SELECT drop_number, project, sender, submitted_at
  FROM invalid_drop_submissions
  ORDER BY submitted_at DESC
  LIMIT 10;
"

# Count rejections by project
psql $DATABASE_URL -c "
  SELECT project, COUNT(*) as rejection_count
  FROM invalid_drop_submissions
  GROUP BY project;
"
```

### Live Logs

```bash
# Watch validation in real-time
ssh root@72.60.17.245 "tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep -E 'VALID|INVALID|reply'"
```

**Expected log output:**
```
📱 Found drop: DR1874110 in Mohadin
✅ VALIDATED: DR1874110 is valid for Mohadin
✅ Created QA review for DR1874110

📱 Found drop: DR9999999 in Mohadin
❌ INVALID DROP: DR9999999 not in valid list for Mohadin
🚫 REJECTED: DR9999999 (not in valid list for Mohadin)
✅ WhatsApp reply sent to 120363421532174586@g.us
```

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Validation lookup | ~20ms | Indexed query to Neon |
| WhatsApp reply | ~100-200ms | HTTP call to bridge API |
| Total overhead | ~200-300ms | Per drop (acceptable) |
| Sync throughput | ~500 drops/sec | SharePoint → Neon |
| Database size | ~2-5 MB | 22,140 drops × 100 bytes |

---

## Testing

### Test Valid Drop

**Post to Mohadin group:**
```
DR1874110
```

**Expected result:**
- ✅ Processes silently
- ✅ Appears on dashboard at https://app.fibreflow.app/wa-monitor
- ✅ No WhatsApp reply
- ✅ Log shows: "✅ VALIDATED: DR1874110"

### Test Invalid Drop

**Post to Mohadin group:**
```
DR9999999
```

**Expected result:**
- ❌ Rejected (not added to database)
- ❌ Does NOT appear on dashboard
- 📱 WhatsApp group receives auto-reply within 15 seconds
- ✅ Log shows: "❌ INVALID DROP" and "✅ WhatsApp reply sent"
- ✅ Rejection logged to `invalid_drop_submissions`

---

## Adding Validation to Other Projects

### Steps to Enable for Lawley/Velo Test/Mamelodi

**1. Get SharePoint Data:**
```bash
# Create new sync script (copy from sync-mohadin-valid-drops.js)
# Update:
# - SHARING_URL
# - Range (e.g., A2:A30000)
# - Project name in INSERT statement

node scripts/sync-lawley-valid-drops.js
```

**2. Update Monitor Logic:**

Edit `/opt/wa-monitor/prod/modules/monitor.py`:

```python
# Change from:
if project_name == 'Mohadin':

# To:
if project_name in ['Mohadin', 'Lawley', 'Velo Test', 'Mamelodi']:
```

**3. Deploy:**
```bash
/opt/wa-monitor/prod/restart-monitor.sh
```

**Done!** Validation now active for all projects.

---

## Troubleshooting

### Issue: Auto-reply not sent

**Check:**
```bash
# 1. Is WhatsApp bridge running?
ssh root@72.60.17.245 "ss -tlnp | grep 8080"

# 2. Check bridge logs
ssh root@72.60.17.245 "tail -50 /opt/velo-test-monitor/logs/whatsapp-bridge.log"

# 3. Test bridge API manually
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -d '{"recipient":"120363421532174586@g.us","message":"Test"}'
```

### Issue: Valid drop rejected

**Check:**
```bash
# 1. Is drop in validation table?
psql $DATABASE_URL -c "SELECT * FROM valid_drop_numbers WHERE drop_number = 'DR1234567';"

# 2. Check project name matches exactly
psql $DATABASE_URL -c "SELECT DISTINCT project FROM valid_drop_numbers;"

# 3. Check monitor logs for validation query
ssh root@72.60.17.245 "tail -100 /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep DR1234567"
```

### Issue: Stale validation data

**Re-sync from SharePoint:**
```bash
# This REPLACES all data (TRUNCATE + INSERT)
node scripts/sync-mohadin-valid-drops.js

# Verify count matches SharePoint
psql $DATABASE_URL -c "SELECT COUNT(*) FROM valid_drop_numbers WHERE project = 'Mohadin';"
```

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review rejection logs for patterns
- Check for systematic invalid submissions

**Monthly:**
- Verify validation data is up-to-date
- Re-sync if project plan has changed

**On Project Changes:**
- Re-run sync script when new drops are added to SharePoint
- Verify new drops appear in validation table

### Monitoring Queries

```sql
-- Rejection rate by project
SELECT
    project,
    COUNT(*) as rejections,
    DATE(submitted_at) as date
FROM invalid_drop_submissions
GROUP BY project, DATE(submitted_at)
ORDER BY date DESC, project;

-- Most common invalid drops
SELECT
    drop_number,
    COUNT(*) as attempts,
    MAX(submitted_at) as last_attempt
FROM invalid_drop_submissions
GROUP BY drop_number
ORDER BY attempts DESC
LIMIT 10;

-- Agents with most rejections
SELECT
    sender,
    COUNT(*) as rejections
FROM invalid_drop_submissions
GROUP BY sender
ORDER BY rejections DESC
LIMIT 10;
```

---

## Future Enhancements

**Planned (Not Implemented):**

1. **Scheduled Sync** - Auto-sync validation data nightly from SharePoint
2. **Validation Dashboard** - UI to view rejection statistics
3. **Custom Reply Messages** - Different messages per project
4. **Fuzzy Matching** - Suggest similar valid drops (e.g., DR1234 → "Did you mean DR1234567?")
5. **Bulk Validation API** - Endpoint to validate multiple drops at once
6. **Validation Bypass** - Admin override for emergency drops

---

## References

- **Main Architecture:** `docs/wa-monitor/WA_MONITOR_ARCHITECTURE_V2.md`
- **SharePoint Sync:** `docs/wa-monitor/WA_MONITOR_SHAREPOINT_SYNC.md`
- **WhatsApp Integration:** `docs/wa-monitor/WA_MONITOR_WHATSAPP_INTEGRATION.md`
- **Python Cache Issue:** `docs/wa-monitor/PYTHON_CACHE_ISSUE.md` (⚠️ Always use safe restart!)

---

## Change Log

**v1.0 - November 14, 2025**
- ✅ Initial implementation
- ✅ Mohadin validation active (22,140 drops)
- ✅ WhatsApp auto-reply for rejections
- ✅ Rejection logging to database
- ✅ ~20ms validation performance
- ⏭️ Other projects pass-through (no validation)

---

**Questions?** See main WA Monitor docs or check `CLAUDE.md` for system overview.
