# Mamelodi Validation - Documentation Index

**Created**: November 14, 2025
**Purpose**: Complete guide for adding Mamelodi to validation system

---

## Quick Navigation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[MAMELODI_VALIDATION_REPORT.md](MAMELODI_VALIDATION_REPORT.md)** | Executive summary and overview | 5 min |
| **[MAMELODI_VALIDATION_QUICK_START.md](MAMELODI_VALIDATION_QUICK_START.md)** | 15-minute implementation guide | 2 min |
| **[MAMELODI_CODE_CHANGES.md](MAMELODI_CODE_CHANGES.md)** | Side-by-side code comparison | 3 min |
| **[MAMELODI_VALIDATION_REVIEW.md](MAMELODI_VALIDATION_REVIEW.md)** | Detailed technical analysis | 10 min |

---

## Start Here

### 👉 If you want to implement NOW:
**Read**: [MAMELODI_VALIDATION_QUICK_START.md](MAMELODI_VALIDATION_QUICK_START.md)
- 15-minute implementation
- Step-by-step commands
- Copy-paste ready

### 👉 If you want to understand WHAT changed:
**Read**: [MAMELODI_CODE_CHANGES.md](MAMELODI_CODE_CHANGES.md)
- Exact code changes (2 lines)
- Before/after comparison
- Testing commands

### 👉 If you want the COMPLETE picture:
**Read**: [MAMELODI_VALIDATION_REPORT.md](MAMELODI_VALIDATION_REPORT.md)
- Executive summary
- Risk assessment
- Expected outcomes
- Documentation updates

### 👉 If you want DEEP technical details:
**Read**: [MAMELODI_VALIDATION_REVIEW.md](MAMELODI_VALIDATION_REVIEW.md)
- Complete code analysis
- Database schema
- Function verification
- Deployment steps

---

## Implementation Summary

### What You Need
1. **Mamelodi validation data** (from SharePoint)
2. **2 line changes** in monitor.py
3. **15 minutes** total time

### What You Get
- ✅ Real-time drop validation for Mamelodi
- ✅ Auto-rejection of invalid drops
- ✅ WhatsApp auto-replies to users
- ✅ Rejection audit trail in database

### Current Status
- ❌ **Mamelodi validation**: Disabled (no data loaded)
- ✅ **Mohadin validation**: Active (22,140 drops)
- ✅ **Lawley validation**: Active (23,707 drops)
- ⏭️ **Velo Test**: Validation disabled (intentional)

---

## Prerequisites Check

Before you start, verify:

```bash
# 1. Check current Mamelodi data (should be 0)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM valid_drop_numbers WHERE project = 'Mamelodi';"

# 2. Verify sync script template exists
ls -la /home/louisdup/VF/Apps/FF_React/scripts/sync-mohadin-valid-drops.js

# 3. Check VPS access
ssh root@72.60.17.245 "systemctl status wa-monitor-prod"

# 4. Verify monitor file exists
ssh root@72.60.17.245 "ls -la /opt/wa-monitor/prod/modules/monitor.py"
```

All checks should pass before proceeding.

---

## Quick Implementation

Copy-paste this entire block:

```bash
# Step 1: Create sync script
cd /home/louisdup/VF/Apps/FF_React/scripts
cp sync-mohadin-valid-drops.js sync-mamelodi-valid-drops.js

# Step 2: Edit configuration (manual step)
nano sync-mamelodi-valid-drops.js
# - Change PROJECT_NAME to 'Mamelodi'
# - Update SharePoint URL
# Save: Ctrl+O, Enter, Ctrl+X

# Step 3: Load data
node sync-mamelodi-valid-drops.js

# Step 4: Verify load
psql $DATABASE_URL -c "SELECT COUNT(*) FROM valid_drop_numbers WHERE project = 'Mamelodi';"

# Step 5: Update monitor code
ssh root@72.60.17.245
nano /opt/wa-monitor/prod/modules/monitor.py
# Line 290: Add 'Mamelodi' to ['Mohadin', 'Lawley']
# Line 308: Remove "and Mamelodi" from skip message
# Save: Ctrl+O, Enter, Ctrl+X

# Step 6: Restart service
/opt/wa-monitor/prod/restart-monitor.sh

# Step 7: Monitor
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep "Mamelodi"
```

**Done!** ✅

---

## Code Changes Required

### Change 1 (Line 290)
```python
# BEFORE
if project_name in ['Mohadin', 'Lawley']:

# AFTER
if project_name in ['Mohadin', 'Lawley', 'Mamelodi']:
```

### Change 2 (Line 308)
```python
# BEFORE
logger.debug(f"⏭️ SKIPPED VALIDATION: {drop_number} (Velo Test and Mamelodi pass through)")

# AFTER
logger.debug(f"⏭️ SKIPPED VALIDATION: {drop_number} (Velo Test passes through)")
```

---

## Testing

### Test 1: Valid Drop
```
Post to Mamelodi group: "DR1234567 done"
Expected: ✅ Accepted and inserted into database
```

### Test 2: Invalid Drop
```
Post to Mamelodi group: "DR9999999 complete"
Expected: ❌ Rejected with WhatsApp auto-reply
```

### Verify Rejections
```bash
psql $DATABASE_URL -c "
  SELECT * FROM invalid_drop_submissions
  WHERE project = 'Mamelodi'
  ORDER BY submitted_at DESC;
"
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
logger.debug(f"⏭️ SKIPPED VALIDATION: {drop_number} (Velo Test and Mamelodi pass through)")

# Save and restart
/opt/wa-monitor/prod/restart-monitor.sh
```

**Rollback time**: 2 minutes

---

## Support

### If Valid Drops Are Rejected
1. Check if drop is in database: `SELECT * FROM valid_drop_numbers WHERE drop_number = 'DRXXXXXXX'`
2. If not found, the drop is not in your loaded list
3. Re-sync SharePoint data

### If Invalid Drops Are Accepted
1. Check validation data loaded: `SELECT COUNT(*) FROM valid_drop_numbers WHERE project = 'Mamelodi'`
2. If count = 0, data was not loaded
3. Run sync script

### If Changes Don't Take Effect
1. Did you use the SAFE restart script? `/opt/wa-monitor/prod/restart-monitor.sh`
2. Python cache issue - use safe restart (NOT `systemctl restart`)
3. See `docs/wa-monitor/PYTHON_CACHE_ISSUE.md`

---

## Related Documentation

- **DROP_VALIDATION_SYSTEM.md** - Complete validation system guide
- **VALIDATION_QUICK_REFERENCE.md** - Validation status matrix
- **PYTHON_CACHE_ISSUE.md** - Why safe restart is required
- **WA_MONITOR_ADD_PROJECT_5MIN.md** - Adding new WhatsApp groups

---

## Document Versions

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 14, 2025 | Initial documentation created |

---

**Last Updated**: November 14, 2025
**Status**: Ready for implementation
**Estimated Time**: 15 minutes
**Risk Level**: Low
