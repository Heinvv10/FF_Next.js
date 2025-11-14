# WA Monitor - Mamelodi Validation Review

**Date**: November 14, 2025
**Task**: Add Mamelodi to validation system
**Status**: Ready for implementation

---

## 1. Current Validation System Analysis

### Current Code (Lines 280-310)

**File**: `/opt/wa-monitor/prod/modules/monitor.py`

```python
def process_message(self, message: Dict, project_name: str, group_jid: str) -> bool:
    """Process a single message for drop numbers with validation."""
    drop_number = self.extract_drop_number(message['content'])

    if not drop_number:
        return False

    logger.info(f"📱 Found drop: {drop_number} in {project_name}")

    # ✅ VALIDATION CHECK - MOHADIN & LAWLEY (other projects pass through)
    if project_name in ['Mohadin', 'Lawley']:
        if not self.validate_drop_number(drop_number, project_name):
            logger.warning(f"❌ INVALID DROP: {drop_number} not in valid list for {project_name}")
            self.log_invalid_drop(drop_number, project_name, message['sender'], group_jid)

            # Resolve sender to phone number (resolve LIDs)
            sender_phone = self.resolve_sender_to_phone(message['sender'])

            # Send direct WhatsApp message with @mention
            reply_message = (
                f"❌ Invalid Drop Number\n\n"
                f"Drop {drop_number} is not in the valid list for {project_name}.\n\n"
                f"Please submit a valid drop number from the project plan."
            )
            self.send_whatsapp_direct_message(group_jid, sender_phone, reply_message)

            return False
        logger.info(f"✅ VALIDATED: {drop_number} is valid for {project_name}")
    else:
        logger.debug(f"⏭️  SKIPPED VALIDATION: {drop_number} (Velo Test and Mamelodi pass through)")

    # ... rest of function continues ...
```

---

## 2. Supporting Functions

### Validation Function (Lines 163-181)

```python
def validate_drop_number(self, drop_number: str, project_name: str) -> bool:
    """Validate drop number against valid_drop_numbers table."""
    try:
        conn = self.db.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT 1 FROM valid_drop_numbers WHERE drop_number = %s AND project = %s LIMIT 1",
            (drop_number, project_name)
        )

        is_valid = cursor.fetchone() is not None

        cursor.close()
        conn.close()

        return is_valid

    except Exception as e:
        logger.error(f"❌ Error validating drop number: {e}")
        # On error, allow drop through (fail open to avoid data loss)
        return True
```

### Invalid Drop Logging (Lines 183-218)

```python
def log_invalid_drop(self, drop_number: str, project_name: str, sender: str, group_jid: str):
    """Log invalid drop to database for tracking."""
    try:
        conn = self.db.get_connection()
        cursor = conn.cursor()

        # Create table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS invalid_drop_submissions (
                id SERIAL PRIMARY KEY,
                drop_number VARCHAR(20),
                project VARCHAR(100),
                sender VARCHAR(50),
                group_jid VARCHAR(100),
                submitted_at TIMESTAMP DEFAULT NOW(),
                reason VARCHAR(100) DEFAULT 'not_in_valid_list'
            )
        """)

        # Insert rejection
        cursor.execute("""
            INSERT INTO invalid_drop_submissions (drop_number, project, sender, group_jid, reason)
            VALUES (%s, %s, %s, %s, 'not_in_valid_list')
        """, (drop_number, project_name, sender, group_jid))

        conn.commit()
        cursor.close()
        conn.close()

        logger.warning(f"🚫 REJECTED: {drop_number} (not in valid list for {project_name})")

    except Exception as e:
        logger.error(f"❌ Error logging invalid drop: {e}")
```

---

## 3. Database Status

### Current Validation Data

| Project | Valid Drops | Drop Range | Status |
|---------|-------------|------------|--------|
| **Mohadin** | 22,140 | DR1853300 - DR1875439 | ✅ Active |
| **Lawley** | 23,707 | DR1729500 - DR1753214 | ✅ Active |
| **Mamelodi** | 0 | N/A | ❌ No data |
| **Velo Test** | 0 | N/A | ⏭️ Validation disabled |

### Query Used
```sql
SELECT project, COUNT(*) as total_drops,
       MIN(drop_number) as first_drop,
       MAX(drop_number) as last_drop
FROM valid_drop_numbers
GROUP BY project
ORDER BY project;
```

---

## 4. Proposed Changes

### CHANGE 1: Update Validation Check (Line 290)

**CURRENT CODE:**
```python
    # ✅ VALIDATION CHECK - MOHADIN & LAWLEY (other projects pass through)
    if project_name in ['Mohadin', 'Lawley']:
```

**NEW CODE:**
```python
    # ✅ VALIDATION CHECK - MOHADIN, LAWLEY & MAMELODI (other projects pass through)
    if project_name in ['Mohadin', 'Lawley', 'Mamelodi']:
```

### CHANGE 2: Update Skip Log Message (Line 308)

**CURRENT CODE:**
```python
    else:
        logger.debug(f"⏭️  SKIPPED VALIDATION: {drop_number} (Velo Test and Mamelodi pass through)")
```

**NEW CODE:**
```python
    else:
        logger.debug(f"⏭️  SKIPPED VALIDATION: {drop_number} (Velo Test passes through)")
```

---

## 5. Implementation Steps

### Step 1: Load Mamelodi Validation Data
**BEFORE enabling validation, you MUST load Mamelodi drops into the database.**

```bash
# Check if sync script exists for Mamelodi
ls -la /home/louisdup/VF/Apps/FF_React/scripts/sync-*-valid-drops.js

# If not, create sync-mamelodi-valid-drops.js based on:
# /home/louisdup/VF/Apps/FF_React/scripts/sync-mohadin-valid-drops.js
```

**Required Data:**
- SharePoint list with valid Mamelodi drop numbers
- Drop range (e.g., DR1234567 - DR1245678)
- Estimated count (for verification)

### Step 2: Verify Data Load
```bash
# After sync, verify Mamelodi data
psql $DATABASE_URL -c "
  SELECT COUNT(*) as total,
         MIN(drop_number) as first_drop,
         MAX(drop_number) as last_drop
  FROM valid_drop_numbers
  WHERE project = 'Mamelodi';
"
```

### Step 3: Update Monitor Code
```bash
ssh root@72.60.17.245

# Edit monitor.py
nano /opt/wa-monitor/prod/modules/monitor.py

# Make two changes:
# 1. Line 290: Add 'Mamelodi' to validation list
# 2. Line 308: Remove "and Mamelodi" from skip message

# Save changes (Ctrl+O, Ctrl+X)
```

### Step 4: Deploy with Safe Restart
```bash
# CRITICAL: Use safe restart script (clears Python cache)
/opt/wa-monitor/prod/restart-monitor.sh

# Verify service started
systemctl status wa-monitor-prod

# Watch logs for validation
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep -E "(VALID|Mamelodi)"
```

### Step 5: Test Validation
```bash
# Post test drops to Mamelodi WhatsApp group:
# 1. Valid drop (from loaded list) - should be accepted
# 2. Invalid drop (not in list) - should be rejected with auto-reply

# Monitor validation in real-time
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep "Mamelodi"
```

### Step 6: Verify Rejections
```bash
# Check if rejections are logged
psql $DATABASE_URL -c "
  SELECT * FROM invalid_drop_submissions
  WHERE project = 'Mamelodi'
  ORDER BY submitted_at DESC
  LIMIT 10;
"
```

---

## 6. Testing Checklist

- [ ] **Data Loaded**: Mamelodi valid drops in database
- [ ] **Count Verified**: Drop count matches expectation
- [ ] **Code Updated**: Lines 290 & 308 changed
- [ ] **Service Restarted**: Used safe restart script
- [ ] **Valid Drop Test**: Valid drop accepted and inserted
- [ ] **Invalid Drop Test**: Invalid drop rejected with auto-reply
- [ ] **Rejection Logged**: Invalid drop in invalid_drop_submissions table
- [ ] **No False Positives**: All valid drops being accepted
- [ ] **No False Negatives**: All invalid drops being rejected

---

## 7. Rollback Plan

If validation causes issues:

```bash
# SSH to VPS
ssh root@72.60.17.245

# Edit monitor.py
nano /opt/wa-monitor/prod/modules/monitor.py

# Revert Line 290 to:
if project_name in ['Mohadin', 'Lawley']:

# Revert Line 308 to:
logger.debug(f"⏭️  SKIPPED VALIDATION: {drop_number} (Velo Test and Mamelodi pass through)")

# Restart (safe)
/opt/wa-monitor/prod/restart-monitor.sh
```

---

## 8. Performance Impact

**Expected Overhead per Mamelodi Drop:**
- Validation query: ~20ms
- Rejection logging (if invalid): ~50ms
- Auto-reply (if invalid): ~100-200ms
- **Total**: ~300ms per invalid drop, ~20ms per valid drop

**No Impact on Other Projects:**
- Mohadin: Already validated (no change)
- Lawley: Already validated (no change)
- Velo Test: Still passes through (no validation)

---

## 9. Summary

### Current State
- ✅ Mohadin: 22,140 valid drops loaded, validation active
- ✅ Lawley: 23,707 valid drops loaded, validation active
- ❌ Mamelodi: No validation data, validation disabled
- ⏭️ Velo Test: Validation disabled (intentional)

### Required Before Enabling
1. **Load Mamelodi validation data** (create sync script)
2. **Verify data load** (count and range check)
3. **Update code** (2 lines: 290 & 308)
4. **Test thoroughly** (valid + invalid drops)

### Code Changes Summary
- **Line 290**: Add `'Mamelodi'` to validation list
- **Line 308**: Remove "and Mamelodi" from skip message
- **Total Lines Changed**: 2
- **Risk Level**: Low (only affects Mamelodi, fail-open design)

---

## 10. Next Actions

**PRIORITY 1: Load Validation Data**
```bash
# Create sync script for Mamelodi
cd /home/louisdup/VF/Apps/FF_React/scripts
cp sync-mohadin-valid-drops.js sync-mamelodi-valid-drops.js

# Update script:
# 1. Change SharePoint list URL
# 2. Change project name to 'Mamelodi'
# 3. Run sync

node sync-mamelodi-valid-drops.js
```

**PRIORITY 2: Enable Validation**
```bash
# Only after data is loaded and verified!
ssh root@72.60.17.245
nano /opt/wa-monitor/prod/modules/monitor.py
# Make changes
/opt/wa-monitor/prod/restart-monitor.sh
```

**PRIORITY 3: Monitor and Verify**
```bash
# Watch for first Mamelodi validations
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep "Mamelodi"
```

---

**Document Created**: November 14, 2025
**Ready for Implementation**: ✅ Yes (pending data load)
**Estimated Time**: 15 minutes (5 min data load + 5 min code change + 5 min testing)
