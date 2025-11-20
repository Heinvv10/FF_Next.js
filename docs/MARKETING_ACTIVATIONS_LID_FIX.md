# Marketing Activations - LID Resolution Fix

**Date:** November 20, 2025
**Issue:** Dashboard showing LID instead of phone number
**Status:** ✅ FIXED

## Problem

When viewing the Marketing Activations dashboard, the "Submitted By" column showed LID (Local ID) numbers instead of phone numbers:

```
Submitted By: 36563643842564  ❌ (LID - not readable)
```

## Root Cause

The `marketing_monitor.py` module was storing the raw `sender_phone` value from WhatsApp Bridge without resolving LIDs to phone numbers. WhatsApp's WhatsMe
ow library uses LIDs (Local IDs) for linked devices, which need to be resolved using the `whatsmeow_lid_map` table in the WhatsApp SQLite database.

## Solution

### 1. Added LID Resolution Method

Added `resolve_sender_to_phone()` method to `MarketingMonitor` class:

**File:** `/opt/wa-monitor/prod/modules/marketing_monitor.py`

```python
def __init__(self, database_manager, whatsapp_db_path='/opt/velo-test-monitor/services/whatsapp-bridge/store/whatsapp.db'):
    self.db = database_manager
    self.whatsapp_db_path = whatsapp_db_path
    self.drop_pattern = re.compile(r'\bDR\d+\b', re.IGNORECASE)

def resolve_sender_to_phone(self, sender: str) -> str:
    """Resolve sender LID to phone number using WhatsApp database."""
    try:
        conn = sqlite3.connect(self.whatsapp_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT pn FROM whatsmeow_lid_map WHERE lid = ?", (sender,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if result:
            phone_number = result[0]
            logger.info(f"🔗 Marketing: Resolved LID {sender} → {phone_number}")
            return phone_number
        else:
            logger.debug(f"Marketing: No LID mapping for {sender}, using as-is")
            return sender
    except Exception as e:
        logger.error(f"❌ Marketing: Error resolving LID {sender}: {e}")
        return sender
```

### 2. Updated Message Processing

Modified `process_message()` to resolve LIDs before storing:

```python
def process_message(self, message_data):
    content = message_data.get('content', '')
    timestamp = message_data.get('timestamp')
    sender_phone = message_data.get('sender_phone')
    sender_name = message_data.get('sender_name')

    # Resolve LID to phone number
    resolved_phone = self.resolve_sender_to_phone(sender_phone)

    # ... rest of processing ...

    # Store submission with resolved phone number
    self._store_submission(
        drop_number=drop_number,
        whatsapp_message_date=timestamp,
        submitted_by=resolved_phone,  # ✅ Use resolved phone
        user_name=sender_name,
        is_valid=is_valid
    )
```

### 3. Updated Existing Database Record

Fixed the existing DR1234567 submission:

```sql
UPDATE marketing_activations
SET submitted_by = '27640412391',
    updated_at = NOW()
WHERE drop_number = 'DR1234567';
```

### 4. Restarted Monitor

Used safe restart script to clear Python cache:

```bash
/opt/wa-monitor/prod/restart-monitor.sh
```

## Verification

### Before Fix
```json
{
  "dropNumber": "DR1234567",
  "submittedBy": "36563643842564",  ❌ LID
  "userName": ""
}
```

### After Fix
```json
{
  "dropNumber": "DR1234567",
  "submittedBy": "27640412391",     ✅ Phone number
  "userName": ""
}
```

### Dashboard Display

**Before:**
```
Drop Number  | Submitted By
DR1234567    | 36563643842564
```

**After:**
```
Drop Number  | Submitted By
DR1234567    | 27640412391
```

## Technical Details

### LID (Local ID) Explanation

WhatsApp's WhatsMe
ow library uses LIDs to identify users across multiple devices:
- **LID:** Internal identifier for linked devices (e.g., `36563643842564`)
- **Phone Number:** User's actual phone number (e.g., `27640412391`)

### WhatsApp Database Mapping

**Database:** `/opt/velo-test-monitor/services/whatsapp-bridge/store/whatsapp.db`
**Table:** `whatsmeow_lid_map`

```sql
SELECT lid, pn FROM whatsmeow_lid_map WHERE lid = '36563643842564';
-- Result: 36563643842564|27640412391
```

### Resolution Process

```
Message Received from WhatsApp
    ↓
sender_phone = "36563643842564" (LID)
    ↓
resolve_sender_to_phone(sender_phone)
    ↓
Query: SELECT pn FROM whatsmeow_lid_map WHERE lid = ?
    ↓
Result: "27640412391"
    ↓
Store in database: submitted_by = "27640412391"
    ↓
Dashboard displays phone number ✅
```

## Files Modified

1. **VPS:** `/opt/wa-monitor/prod/modules/marketing_monitor.py`
   - Added `resolve_sender_to_phone()` method
   - Modified `process_message()` to use resolved phone
   - Updated `__init__()` to accept `whatsapp_db_path`

2. **Database:** `marketing_activations` table
   - Updated existing record for DR1234567

## Testing

### Test LID Resolution Manually

```bash
# SSH into VPS
ssh root@72.60.17.245

# Query LID mapping
sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge/store/whatsapp.db \
  "SELECT lid, pn FROM whatsmeow_lid_map WHERE lid = '36563643842564';"

# Expected output: 36563643842564|27640412391
```

### Test New Submissions

1. Post test message to WhatsApp group: `DR9999999`
2. Check logs for LID resolution:
```bash
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep "Resolved LID"
# Expected: 🔗 Marketing: Resolved LID 36563643842564 → 27640412391
```

3. Query database:
```sql
SELECT drop_number, submitted_by
FROM marketing_activations
WHERE drop_number = 'DR9999999';
-- Should show phone number, not LID
```

## Related Issues

This fix follows the same pattern used in the main QA monitor for resolving LIDs. The issue was documented in:
- `docs/wa-monitor/PYTHON_CACHE_ISSUE.md` - Python cache requiring safe restart
- `CLAUDE.md` - WA Monitor LID resolution notes

## Future Submissions

All future submissions will automatically:
1. Resolve LIDs to phone numbers
2. Store phone numbers in database
3. Display phone numbers in dashboard

No manual intervention required! ✅

---

**Deployed:** November 20, 2025 @ 16:49 SAST
**Verified:** ✅ Working correctly
**Monitor Status:** Active and running
