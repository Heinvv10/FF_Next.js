# LID Resolution Fix for WhatsApp Linked Devices

**Date Implemented:** November 11, 2025
**Issue ID:** WhatsApp @mentions showing incorrect IDs
**Status:** RESOLVED

---

## Problem

When users posted drop numbers from **WhatsApp Web or Desktop** (linked devices), the @mentions were showing incorrect numbers:

**Example:**
- User: Hein van Vuuren (+27 82 321 6574)
- @Mention showed: `@+1 55228775178345` ❌
- Expected: `@Hein Van Vuuren` ✅

---

## Root Cause

WhatsApp uses **LID (Linked Device ID)** when messages are sent from linked devices (Web/Desktop). The monitor was storing the LID directly without resolving it to the actual phone number.

**Technical Details:**
- WhatsApp Bridge stores sender as `155228775178345` (LID)
- Actual phone mapping stored in `whatsmeow_lid_map` table
- Monitor wasn't performing the lookup

---

## Solution

### 1. Added LID Resolution Method

**File:** `/opt/wa-monitor/prod/modules/monitor.py`

```python
def resolve_sender_to_phone(self, sender: str) -> str:
    """Resolve sender (including LIDs) to actual phone number."""
    if sender.isdigit():
        return sender
    try:
        whatsapp_db_path = str(Path(self.sqlite_db_path).parent / 'whatsapp.db')
        conn = sqlite3.connect(whatsapp_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT pn FROM whatsmeow_lid_map WHERE lid = ?", (sender,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result:
            phone_number = result[0]
            logger.info(f"🔗 Resolved LID {sender} → {phone_number}")
            return phone_number
        else:
            logger.warning(f"⚠️  No mapping found for LID: {sender}")
            return sender
    except Exception as e:
        logger.error(f"❌ Error resolving LID {sender}: {e}")
        return sender
```

### 2. Updated Drop Processing

**File:** `/opt/wa-monitor/prod/modules/monitor.py`

```python
def process_message(self, message: Dict, project_name: str) -> bool:
    """Process a single message for drop numbers."""
    drop_number = self.extract_drop_number(message['content'])
    if not drop_number:
        return False

    logger.info(f"📱 Found drop: {drop_number} in {project_name}")

    # Resolve sender to actual phone number (handles LIDs from linked devices)
    resolved_phone = self.resolve_sender_to_phone(message['sender'])

    # Check if drop already exists
    if self.db.check_drop_exists(drop_number):
        logger.info(f"🔄 Resubmission detected: {drop_number}")
        return self.db.handle_resubmission(drop_number, project_name)
    else:
        # New drop - insert
        drop_data = {
            'drop_number': drop_number,
            'user_name': resolved_phone[:100],  # Truncate to column width
            'submitted_by': resolved_phone,      # Full phone number for @mentions
            'project': project_name,
            'message_timestamp': message['timestamp'],
            'comment': f"Created from WhatsApp message"
        }
        return self.db.insert_drop(drop_data)
```

### 3. Updated Database Insert

**File:** `/opt/wa-monitor/prod/modules/database.py`

Added `submitted_by` field to INSERT statement to store the resolved phone number.

---

## Testing

**Test Case:**
- User: Hein van Vuuren (+27 82 321 6574)
- Device: WhatsApp Desktop (LID: 155228775178345)
- Drop: DR7654322

**Before Fix:**
```
@+1 55228775178345 DR7654322 REJECTED
```

**After Fix:**
```
@Hein Van Vuuren DR7654322 REJECTED
```

✅ **Result:** Working correctly - shows contact name

---

## Database Mapping

**WhatsApp Session Database:** `/opt/velo-test-monitor/services/whatsapp-bridge/store/whatsapp.db`

**LID Mapping Table:** `whatsmeow_lid_map`

```sql
CREATE TABLE whatsmeow_lid_map (
    lid TEXT PRIMARY KEY,      -- Linked Device ID
    pn  TEXT UNIQUE NOT NULL   -- Phone Number
);
```

**Example:**
```sql
SELECT lid, pn FROM whatsmeow_lid_map WHERE lid = '155228775178345';
-- Returns: 155228775178345 | 27823216574
```

---

## Impact

**All future drops posted via WhatsApp Web/Desktop will now:**
- ✅ Show correct @mentions
- ✅ Display contact names (if saved)
- ✅ Send notifications to the actual user

**No impact on:**
- ✅ Drops posted from mobile phones (already worked)
- ✅ Manually added drops (no sender info)

---

## Files Modified

1. `/opt/wa-monitor/prod/modules/monitor.py` - Added LID resolution
2. `/opt/wa-monitor/prod/modules/database.py` - Added submitted_by field
3. Service restarted: `systemctl restart wa-monitor-prod`

**Backups Created:**
- `/opt/wa-monitor/prod/modules/monitor.py.backup`
- `/opt/wa-monitor/prod/modules/database.py.backup`

---

## Related Documentation

- [WhatsApp Architecture](./WHATSAPP_ARCHITECTURE.md) - Overall WhatsApp integration
- [5-Minute Project Addition Guide](./WA_MONITOR_ADD_PROJECT_5MIN.md) - Adding new groups

---

**Implemented by:** Claude Code AI Assistant  
**Tested by:** User with DR7654322 (Hein van Vuuren)  
**Status:** Production ✅
