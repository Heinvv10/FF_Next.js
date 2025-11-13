# Python Bytecode Cache Issue - WA Monitor

## 🚨 CRITICAL: Always Use Safe Restart Script

**Date Discovered:** November 13, 2025
**Severity:** CRITICAL - Causes production code to run old buggy versions
**Status:** RESOLVED (with proper restart procedure)

---

## Problem Summary

**Python caches compiled bytecode** (`.pyc` files) in `__pycache__` directories. When you update `.py` source files and restart with `systemctl restart`, Python **continues using the old cached bytecode** instead of recompiling from the updated source.

**Result:** Your bug fixes don't actually run in production, even though the source code is updated.

---

## Real-World Impact (Nov 11-13, 2025)

### Timeline

**Nov 11 @ 12:29:** Fixed critical bugs in monitor code
- Changed ID tracking → timestamp tracking
- Updated drop pattern to support 6-8 digits
- **Restart method:** `systemctl restart wa-monitor-prod` ❌

**Nov 13 @ 07:00-10:00:** Monitor created drops with LIDs
- DR1111113 (Velo Test) - LID: 36563643842564
- DR1734381 (Lawley) - LID: 206798481035291
- DR1857337 (Mohadin) - LID: 3114472046639

**Nov 13 @ 10:08:** Finally restarted with safe script
- `/opt/wa-monitor/prod/restart-monitor.sh` ✅
- Cache cleared, bug fixes finally active

### Why It Happened

```python
# Source code (FIXED on Nov 11):
def handle_resubmission(self, drop_number, project, resolved_phone, message_timestamp):
    UPDATE ... SET submitted_by = %s, user_name = %s ...

# But Python ran THIS (from .pyc cache):
def handle_resubmission(self, drop_number, project):
    UPDATE ... SET submitted_by = [OLD_BUGGY_CODE] ...
```

---

## The Solution: Safe Restart Script

### ✅ ALWAYS Use This

```bash
ssh root@72.60.17.245
/opt/wa-monitor/prod/restart-monitor.sh
```

### ❌ NEVER Use This

```bash
systemctl restart wa-monitor-prod  # Keeps stale cache!
```

---

## Safe Restart Script Details

**Location:** `/opt/wa-monitor/prod/restart-monitor.sh`

**What It Does:**

```bash
#!/bin/bash
# Step 1: Clear Python cache
find $BASE_DIR -type d -name '__pycache__' -exec rm -rf {} +
find $BASE_DIR -name '*.pyc' -delete

# Step 2: Force recompile modules
python3 -m py_compile main.py
python3 -m py_compile modules/monitor.py
python3 -m py_compile modules/database.py
python3 -m py_compile modules/config.py

# Step 3: Restart service
systemctl restart wa-monitor-prod

# Step 4: Verify status
systemctl status wa-monitor-prod
tail -10 logs/wa-monitor-prod.log
```

---

## Development Workflow

### 1. Make Code Changes

```bash
# SSH to VPS
ssh root@72.60.17.245

# Edit files
vim /opt/wa-monitor/prod/modules/monitor.py
```

### 2. Deploy to Production

```bash
# ALWAYS use safe restart script
/opt/wa-monitor/prod/restart-monitor.sh
```

### 3. Verify Changes Took Effect

```bash
# Watch logs for expected behavior
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log

# Post test message to WhatsApp group
# Check database for correct data format
```

---

## Emergency Fix for Cached Code Issues

```bash
# 1. Stop service
systemctl stop wa-monitor-prod

# 2. Nuclear option - clear ALL Python cache
find /opt/wa-monitor/prod -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null
find /opt/wa-monitor/prod -name '*.pyc' -delete 2>/dev/null

# 3. Restart with safe script
/opt/wa-monitor/prod/restart-monitor.sh

# 4. Verify it's working
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log
```

---

## Testing Checklist After Restart

```bash
# 1. Check service is running
systemctl status wa-monitor-prod

# 2. Check cache is cleared
find /opt/wa-monitor/prod -name '*.pyc' | wc -l  # Should be 0

# 3. Watch logs for expected behavior
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log

# 4. Test with real message (post test drop to WhatsApp)

# 5. Verify in database
psql $DATABASE_URL -c "SELECT drop_number, submitted_by, LENGTH(submitted_by) FROM qa_photo_reviews ORDER BY created_at DESC LIMIT 1;"
# submitted_by should be 11 digits (phone), not 13-15 (LID)
```

---

## Summary

**Problem:** Python bytecode cache causes old buggy code to run after source updates.
**Solution:** Always use `/opt/wa-monitor/prod/restart-monitor.sh` which clears cache.
**Impact:** CRITICAL - Can cause production data corruption (LIDs in database).
**Status:** ✅ RESOLVED with proper restart procedure.
