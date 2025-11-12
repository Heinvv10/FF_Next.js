# Python Bytecode Cache Issue - WA Monitor

**Date:** November 12, 2025
**Issue:** Python using stale .pyc cache causes old buggy code to run
**Status:** SOLVED with safe restart script ✅

---

## The Recurring LID Problem

### Symptoms

After fixing the LID resolution bug in `monitor.py`, drops were still being stored with LIDs instead of phone numbers:

```
DR1111112: submitted_by = '36563643842564' (LID - WRONG)
Should be: submitted_by = '27640412391' (phone number - CORRECT)
```

**Monitor logs showed resolution working:**
```
🔗 Resolved LID 36563643842564 → 27640412391
```

But database had the LID stored, not the phone number.

---

## Root Cause: Python Bytecode Caching

### How Python Works

Python compiles `.py` source files to `.pyc` bytecode for faster loading:

```
/opt/wa-monitor/prod/modules/
├── monitor.py              ← Source code (what we edit)
└── __pycache__/
    └── monitor.cpython-312.pyc  ← Compiled bytecode (what Python runs)
```

### The Problem

**When we updated `monitor.py`:**
1. ✅ Source file updated with fix (removed `if sender.isdigit()`)
2. ✅ Service restarted with `systemctl restart wa-monitor-prod`
3. ❌ Python saw existing `.pyc` file and used it (OLD CODE!)
4. ❌ New source code ignored

**Timeline of failures:**
- Nov 11, 14:08 - Fixed LID bug, restarted service
- Nov 11, 14:08-16:26 - Drops still stored with LIDs (using cached old code)
- Nov 11, 16:26 - Cleared cache, restarted again
- Nov 11, 16:26-19:44 - Worked correctly
- Nov 12, 07:07 - Added regex fix, restarted
- Nov 12, 07:11 - DR1111112 stored with LID (cache problem AGAIN!)

---

## The Permanent Fix

### Safe Restart Script

**Location:** `/opt/wa-monitor/prod/restart-monitor.sh`

**What it does:**
1. Clears all Python bytecode cache
2. Forces recompilation of all modules
3. Restarts the service
4. Shows status and recent logs

**Usage:**
```bash
ssh root@72.60.17.245
/opt/wa-monitor/prod/restart-monitor.sh
```

**Script contents:**
```bash
#!/bin/bash
# Clears Python cache and safely restarts monitor

# Clear cache
find /opt/wa-monitor/prod -type d -name '__pycache__' -exec rm -rf {} +
find /opt/wa-monitor/prod -name '*.pyc' -delete

# Force recompile
python3 -m py_compile /opt/wa-monitor/prod/main.py
python3 -m py_compile /opt/wa-monitor/prod/modules/*.py

# Restart service
systemctl restart wa-monitor-prod
```

---

## When to Use the Safe Restart Script

### ALWAYS Use When:
1. **Updating monitor.py** - Any code changes to the monitor
2. **After git pull** - Pulling new code from repository
3. **Debugging LID issues** - If drops store LIDs instead of phone numbers
4. **Service behaving strangely** - Unexpected behavior after code changes

### Command Reference:

```bash
# Safe restart (clears cache automatically)
/opt/wa-monitor/prod/restart-monitor.sh

# NEVER use plain systemctl restart (keeps stale cache)
systemctl restart wa-monitor-prod  # ❌ DON'T USE THIS
```

---

## How to Verify Fix is Working

### 1. Check Running Code

```bash
python3 << 'EOF'
import sys
sys.path.insert(0, '/opt/wa-monitor/prod/modules')
import monitor
import inspect
print(inspect.getsource(monitor.DropMonitor.resolve_sender_to_phone))
EOF
```

**Look for:**
- ✅ NO `if sender.isdigit():` check
- ✅ ALWAYS queries LID map first

### 2. Check New Drops

```sql
-- After a new drop is posted
SELECT drop_number, submitted_by, LENGTH(submitted_by) as len
FROM qa_photo_reviews
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

**Expected:**
- ✅ `len = 11` (phone number)
- ❌ `len > 11` (LID - indicates cache problem)

### 3. Check Monitor Logs

```bash
tail -50 /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep "Resolved LID"
```

**Should see:**
```
🔗 Resolved LID 36563643842564 → 27640412391
```

### 4. Check Cache Timestamp

```bash
ls -la /opt/wa-monitor/prod/modules/__pycache__/monitor.cpython-312.pyc
```

**Cache should be NEWER than last code update**

---

## Fix Existing LID Records

When drops are stored with LIDs, fix them manually:

```bash
# 1. Find LIDs in database
psql $DATABASE_URL -c "
SELECT drop_number, submitted_by, LENGTH(submitted_by) as len
FROM qa_photo_reviews
WHERE submitted_by IS NOT NULL AND LENGTH(submitted_by) > 11;
"

# 2. Look up phone numbers on VPS
ssh root@72.60.17.245
sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge/store/whatsapp.db \
  "SELECT lid, pn FROM whatsmeow_lid_map WHERE lid = 'PASTE_LID_HERE';"

# 3. Update database
psql $DATABASE_URL -c "
UPDATE qa_photo_reviews
SET user_name = 'PHONE_NUMBER', submitted_by = 'PHONE_NUMBER'
WHERE submitted_by = 'LID_HERE';
"
```

---

## Prevention Checklist

When making ANY code changes to WA Monitor:

- [ ] 1. Make code changes to `/opt/wa-monitor/prod/modules/*.py`
- [ ] 2. Run safe restart script: `/opt/wa-monitor/prod/restart-monitor.sh`
- [ ] 3. Check logs show service started
- [ ] 4. Verify with test drop (check submitted_by is phone number)
- [ ] 5. Never use plain `systemctl restart`

---

## Technical Details

### Python Import System

Python checks timestamps to decide whether to recompile:

```python
# Python's decision process
if .pyc exists:
    if .pyc newer than .py:
        use .pyc  # ← PROBLEM if .py was updated but timestamp unchanged
    else:
        recompile .py → .pyc
else:
    compile .py → .pyc
```

### Why Timestamp Matters

Our fixes used `sed` or text editors that don't always update file timestamps correctly:

```bash
# This might not update timestamp
sed -i 's/old/new/' monitor.py

# Force timestamp update
touch monitor.py
```

### Our Solution

Safe restart script:
1. **Deletes all .pyc** files (forces recompile)
2. **Explicitly compiles** with `python3 -m py_compile` (guaranteed fresh)
3. **Restarts service** to load new code

---

## Historical Fixes

### November 11, 2025
- **14:08** - Fixed LID resolution bug (removed `if sender.isdigit()`)
- **14:10-16:26** - Drops still stored with LIDs (cache issue)
- **16:26** - Cleared cache manually, fixed
- **Total affected:** 11 drops with LIDs

### November 12, 2025
- **07:06** - Added regex pattern fix (accept space in DR numbers)
- **07:07** - Restarted WITHOUT clearing cache
- **07:11** - DR1111112 stored with LID (cache problem again!)
- **07:33** - Created safe restart script
- **SOLUTION:** Always use `/opt/wa-monitor/prod/restart-monitor.sh`

---

## Related Documentation

- [LID Resolution Fix](./LID_RESOLUTION_FIX.md) - Original LID bug fix
- [VPS Deployment](../VPS/DEPLOYMENT.md) - VPS setup and services
- [WA Monitor Fixes](./FIXES_NOV11_2025.md) - All Nov 11 fixes

---

**REMEMBER:** Always use the safe restart script!

```bash
/opt/wa-monitor/prod/restart-monitor.sh
```

**End of Document**
