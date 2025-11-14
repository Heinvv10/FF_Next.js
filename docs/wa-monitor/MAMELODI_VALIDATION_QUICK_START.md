# Mamelodi Validation - Quick Start Guide

**Goal**: Enable drop number validation for Mamelodi (same as Mohadin/Lawley)

---

## Prerequisites

✅ Mamelodi WhatsApp group is monitored (Group JID: `120363408849234743@g.us`)
❌ Mamelodi validation data NOT loaded (0 drops in database)

---

## Quick Implementation (15 Minutes)

### 1️⃣ Load Validation Data (5 min)

```bash
# Create sync script
cd /home/louisdup/VF/Apps/FF_React/scripts
cp sync-mohadin-valid-drops.js sync-mamelodi-valid-drops.js

# Edit the script
nano sync-mamelodi-valid-drops.js
```

**Changes needed in script:**
- Line 10: Change `PROJECT_NAME = 'Mohadin'` → `PROJECT_NAME = 'Mamelodi'`
- Line 13-15: Update SharePoint credentials (if different list)
- Line 16: Update SharePoint list URL for Mamelodi

```bash
# Run sync
node sync-mamelodi-valid-drops.js

# Verify data loaded
psql $DATABASE_URL -c "SELECT COUNT(*) FROM valid_drop_numbers WHERE project = 'Mamelodi';"
# Should show count > 0
```

### 2️⃣ Update Monitor Code (2 min)

```bash
ssh root@72.60.17.245
nano /opt/wa-monitor/prod/modules/monitor.py
```

**Line 290 - Add Mamelodi to validation:**
```python
# BEFORE
if project_name in ['Mohadin', 'Lawley']:

# AFTER
if project_name in ['Mohadin', 'Lawley', 'Mamelodi']:
```

**Line 308 - Update skip message:**
```python
# BEFORE
logger.debug(f"⏭️  SKIPPED VALIDATION: {drop_number} (Velo Test and Mamelodi pass through)")

# AFTER
logger.debug(f"⏭️  SKIPPED VALIDATION: {drop_number} (Velo Test passes through)")
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### 3️⃣ Restart Monitor (1 min)

```bash
# CRITICAL: Use safe restart (clears Python cache)
/opt/wa-monitor/prod/restart-monitor.sh

# Verify running
systemctl status wa-monitor-prod
```

### 4️⃣ Test Validation (5 min)

```bash
# Watch logs
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep "Mamelodi"
```

**Test in WhatsApp:**
1. Post VALID drop (from your loaded list) → Should be accepted ✅
2. Post INVALID drop (e.g., `DR9999999`) → Should be rejected ❌ with auto-reply

**Verify rejections:**
```bash
psql $DATABASE_URL -c "SELECT * FROM invalid_drop_submissions WHERE project = 'Mamelodi' ORDER BY submitted_at DESC LIMIT 5;"
```

---

## Expected Results

### Valid Drop (e.g., DR1234567 from your list)
```
📱 Found drop: DR1234567 in Mamelodi
🔍 VALIDATING: DR1234567 for Mamelodi
✅ VALIDATED: DR1234567 is valid for Mamelodi
✅ Inserted new drop: DR1234567 (Mamelodi)
```

### Invalid Drop (e.g., DR9999999 not in list)
```
📱 Found drop: DR9999999 in Mamelodi
🔍 VALIDATING: DR9999999 for Mamelodi
❌ INVALID DROP: DR9999999 not in valid list for Mamelodi
🚫 REJECTED: DR9999999 (not in valid list for Mamelodi)
✅ Direct message (8081) sent to 27XXXXXXXXX
```

**User receives WhatsApp:**
```
❌ Invalid Drop Number

Drop DR9999999 is not in the valid list for Mamelodi.

Please submit a valid drop number from the project plan.
```

---

## Troubleshooting

### No data loaded?
```bash
# Check if sync script ran successfully
node scripts/sync-mamelodi-valid-drops.js

# Should show: "✅ Sync complete: X drops loaded"
```

### Valid drops being rejected?
```bash
# Check if drop is actually in database
psql $DATABASE_URL -c "SELECT * FROM valid_drop_numbers WHERE drop_number = 'DRXXXXXXX' AND project = 'Mamelodi';"

# If not found, the drop is not in your loaded list
```

### Changes not taking effect?
```bash
# Did you use the SAFE restart script?
/opt/wa-monitor/prod/restart-monitor.sh  # ✅ Clears cache

# NOT this:
systemctl restart wa-monitor-prod  # ❌ Keeps stale cache
```

---

## Rollback

If something goes wrong:

```bash
ssh root@72.60.17.245
nano /opt/wa-monitor/prod/modules/monitor.py

# Line 290: Remove 'Mamelodi'
if project_name in ['Mohadin', 'Lawley']:

# Line 308: Add back "and Mamelodi"
logger.debug(f"⏭️  SKIPPED VALIDATION: {drop_number} (Velo Test and Mamelodi pass through)")

# Restart
/opt/wa-monitor/prod/restart-monitor.sh
```

---

## Files Changed

1. **New file**: `/home/louisdup/VF/Apps/FF_React/scripts/sync-mamelodi-valid-drops.js`
2. **Updated**: `/opt/wa-monitor/prod/modules/monitor.py` (lines 290, 308)

---

## Next Steps After Implementation

1. **Monitor for 24 hours** - Watch for false positives/negatives
2. **Update CLAUDE.md** - Add Mamelodi to validation section
3. **Update VALIDATION_QUICK_REFERENCE.md** - Add Mamelodi status
4. **Document drop range** - Note first/last drop numbers loaded

---

**Created**: November 14, 2025
**Status**: Ready for implementation
**Time Required**: 15 minutes
**Risk Level**: Low (fail-open design, only affects Mamelodi)
