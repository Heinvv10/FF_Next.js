# Resubmission Handler LID Bug

**Date Discovered:** November 12, 2025
**Issue ID:** DR470114 showing LID instead of phone number
**Root Cause:** Resubmission handler not using resolved phone number
**Status:** IDENTIFIED - Fix in progress

---

## Problem

When drops are **resubmitted** (posted again after initial creation), the @mentions show LID numbers instead of contact names.

**Example (DR470114):**
- User posted from WhatsApp Web (LID: 205106247139540)
- Monitor resolved: `LID 205106247139540 → 27837912771` ✅
- Database stored: `submitted_by = '205106247139540'` ❌
- Feedback showed: `@+20 5106247139540` ❌

---

## Root Cause Analysis

### The Bug

The monitor has **TWO code paths** for processing drops:

1. **New Drop Path** - Works correctly ✅
   - Calls `insert_drop(drop_data)`
   - Uses `resolved_phone` for `submitted_by` and `user_name`

2. **Resubmission Path** - **BROKEN** ❌
   - Calls `handle_resubmission(drop_number, project_name)`
   - Does NOT pass `resolved_phone` parameter
   - Does NOT update `submitted_by` or `user_name` fields
   - Original LID remains in database

### Code Flow

**File:** `/opt/wa-monitor/prod/modules/monitor.py`

```python
def process_message(self, message: Dict, project_name: str) -> bool:
    """Process a single message for drop numbers."""
    drop_number = self.extract_drop_number(message['content'])
    if not drop_number:
        return False

    logger.info(f"📱 Found drop: {drop_number} in {project_name}")

    # ✅ LID resolution works correctly
    resolved_phone = self.resolve_sender_to_phone(message['sender'])

    # Check if drop already exists
    if self.db.check_drop_exists(drop_number):
        logger.info(f"🔄 Resubmission detected: {drop_number}")

        # ❌ BUG HERE: Not passing resolved_phone!
        return self.db.handle_resubmission(drop_number, project_name)

    else:
        # ✅ New drops work correctly
        drop_data = {
            'drop_number': drop_number,
            'user_name': resolved_phone[:100],
            'submitted_by': resolved_phone,      # Correct!
            'project': project_name,
            'message_timestamp': message['timestamp'],
            'comment': f"Created from WhatsApp message"
        }
        return self.db.insert_drop(drop_data)
```

**File:** `/opt/wa-monitor/prod/modules/database.py`

```python
def handle_resubmission(self, drop_number: str, project: str) -> bool:
    """Handle drop resubmission - updates resubmitted flag."""
    try:
        conn = psycopg2.connect(self.db_url)
        cursor = conn.cursor()

        query = """
            UPDATE qa_photo_reviews
            SET
                resubmitted = true,
                updated_at = NOW()
            WHERE drop_number = ?
        """
        # ❌ BUG: Should also update submitted_by and user_name!
        cursor.execute(query, (drop_number,))

        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Error handling resubmission: {e}")
        return False
```

---

## Evidence

### Monitor Logs (DR470114)

```
2025-11-12 09:41:04,819 - INFO - 📱 Found drop: DR470114 in Mamelodi
2025-11-12 09:41:04,820 - INFO - 🔗 Resolved LID 205106247139540 → 27837912771  ✅ RESOLVED!
2025-11-12 09:41:05,119 - INFO - 🔄 Resubmission detected: DR470114             ← RESUBMISSION PATH
2025-11-12 09:41:05,453 - INFO - 🔄 Logged resubmission for DR470114
```

### Database State (Before Fix)

```sql
SELECT drop_number, submitted_by, user_name, LENGTH(submitted_by) as len
FROM qa_photo_reviews WHERE drop_number = 'DR470114';

-- Result:
drop_number | submitted_by    | user_name       | len
DR470114    | 205106247139540 | 205106247139540 | 15  ❌ LID stored!
```

### Database State (After Manual Fix)

```sql
-- Manual fix applied:
UPDATE qa_photo_reviews
SET user_name = '27837912771', submitted_by = '27837912771', updated_at = NOW()
WHERE drop_number = 'DR470114';

-- Result:
drop_number | submitted_by | user_name   | len
DR470114    | 27837912771  | 27837912771 | 11  ✅ Phone number!
```

---

## The Fix

### Step 1: Update monitor.py

**Change:** Pass `resolved_phone` to resubmission handler

```python
# FROM:
return self.db.handle_resubmission(drop_number, project_name)

# TO:
return self.db.handle_resubmission(drop_number, project_name, resolved_phone)
```

### Step 2: Update database.py

**Change 1:** Add `resolved_phone` parameter to signature

```python
# FROM:
def handle_resubmission(self, drop_number: str, project: str) -> bool:

# TO:
def handle_resubmission(self, drop_number: str, project: str, resolved_phone: str) -> bool:
```

**Change 2:** Update SQL query to set `submitted_by` and `user_name`

```python
# FROM:
query = """
    UPDATE qa_photo_reviews
    SET
        resubmitted = true,
        updated_at = NOW()
    WHERE drop_number = ?
"""
cursor.execute(query, (drop_number,))

# TO:
query = """
    UPDATE qa_photo_reviews
    SET
        resubmitted = true,
        submitted_by = ?,
        user_name = ?,
        updated_at = NOW()
    WHERE drop_number = ?
"""
cursor.execute(query, (resolved_phone, resolved_phone[:100], drop_number))
```

### Step 3: Safe Restart

```bash
ssh root@72.60.17.245
/opt/wa-monitor/prod/restart-monitor.sh  # ✅ Clears cache automatically
```

---

## Testing

### Test Case 1: New Drop with LID
```
Expected: Creates drop with phone number (not LID)
Status: ✅ WORKS (already fixed)
```

### Test Case 2: Resubmission with LID
```
Expected: Updates submitted_by and user_name to phone number
Status: ❌ BROKEN - This is what we're fixing
```

### Verification Steps

1. **Trigger a resubmission:**
   - Post an existing drop number from WhatsApp Web/Desktop
   - Check monitor logs for LID resolution

2. **Check database:**
   ```sql
   SELECT drop_number, submitted_by, user_name, LENGTH(submitted_by) as len
   FROM qa_photo_reviews
   WHERE drop_number = 'DR<NUMBER>'
   AND LENGTH(submitted_by) > 11;  -- Should return 0 rows
   ```

3. **Test feedback:**
   - Send feedback for the resubmitted drop
   - Verify @mention shows contact name, not LID

---

## Impact

### Affected Scenarios

✅ **Working (Already Fixed):**
- New drops from WhatsApp mobile
- New drops from WhatsApp Web/Desktop

❌ **Broken (Needs Fix):**
- Resubmissions from WhatsApp Web/Desktop
- Resubmissions from WhatsApp mobile using LID

### Historical Data

All drops that were:
1. Created initially (first submission)
2. Then resubmitted from WhatsApp Web/Desktop

These drops will have LIDs in `submitted_by` field. Manual cleanup required:

```sql
-- Find affected drops
SELECT drop_number, submitted_by, LENGTH(submitted_by) as len
FROM qa_photo_reviews
WHERE resubmitted = true AND LENGTH(submitted_by) > 11;

-- Fix template (run for each affected drop):
-- 1. Look up LID in WhatsApp database:
SELECT lid, pn FROM whatsmeow_lid_map WHERE lid = '<LID_HERE>';

-- 2. Update database:
UPDATE qa_photo_reviews
SET user_name = '<PHONE_NUMBER>', submitted_by = '<PHONE_NUMBER>'
WHERE drop_number = '<DROP_NUMBER>';
```

---

## Prevention

### Code Review Checklist

When modifying drop processing:
- [ ] Does it handle both new drops AND resubmissions?
- [ ] Does it pass resolved phone number to BOTH code paths?
- [ ] Does it update submitted_by and user_name fields?
- [ ] Was safe restart script used after changes?

### Testing Checklist

After any monitor changes:
- [ ] Test new drop from mobile
- [ ] Test new drop from Web/Desktop (LID)
- [ ] Test resubmission from mobile
- [ ] Test resubmission from Web/Desktop (LID)
- [ ] Verify database has phone numbers (len = 11)
- [ ] Verify feedback shows contact names

---

## Related Documentation

- [Python Cache Issue](./PYTHON_CACHE_ISSUE.md) - Safe restart script
- [LID Resolution Fix](./LID_RESOLUTION_FIX.md) - Original LID fix (new drops only)
- [Fixes Nov 11, 2025](./FIXES_NOV11_2025.md) - Previous LID fixes

---

**Status:** Fix pending implementation
**Next Action:** Apply fix to production and test with resubmission
**Tracked By:** DR470114, DR1734242, and other resubmitted drops with LIDs
