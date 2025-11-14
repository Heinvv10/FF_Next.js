# Mamelodi Validation - Code Changes

**File**: `/opt/wa-monitor/prod/modules/monitor.py`
**Lines Changed**: 2 (lines 290 and 308)
**Total Changes**: 2 words added, 3 words removed

---

## Change 1: Enable Validation (Line 290)

### BEFORE
```python
289    logger.info(f"📱 Found drop: {drop_number} in {project_name}")
290
291    # ✅ VALIDATION CHECK - MOHADIN & LAWLEY (other projects pass through)
292    if project_name in ['Mohadin', 'Lawley']:
293        if not self.validate_drop_number(drop_number, project_name):
```

### AFTER
```python
289    logger.info(f"📱 Found drop: {drop_number} in {project_name}")
290
291    # ✅ VALIDATION CHECK - MOHADIN, LAWLEY & MAMELODI (other projects pass through)
292    if project_name in ['Mohadin', 'Lawley', 'Mamelodi']:
293        if not self.validate_drop_number(drop_number, project_name):
```

**What Changed:**
- Comment: `MOHADIN & LAWLEY` → `MOHADIN, LAWLEY & MAMELODI`
- List: `['Mohadin', 'Lawley']` → `['Mohadin', 'Lawley', 'Mamelodi']`

---

## Change 2: Update Skip Message (Line 308)

### BEFORE
```python
306        logger.info(f"✅ VALIDATED: {drop_number} is valid for {project_name}")
307    else:
308        logger.debug(f"⏭️  SKIPPED VALIDATION: {drop_number} (Velo Test and Mamelodi pass through)")
309
310    # Resolve sender to actual phone number (handles LIDs from linked devices)
```

### AFTER
```python
306        logger.info(f"✅ VALIDATED: {drop_number} is valid for {project_name}")
307    else:
308        logger.debug(f"⏭️  SKIPPED VALIDATION: {drop_number} (Velo Test passes through)")
309
310    # Resolve sender to actual phone number (handles LIDs from linked devices)
```

**What Changed:**
- Message: `(Velo Test and Mamelodi pass through)` → `(Velo Test passes through)`
- Removed: "and Mamelodi" (3 words)

---

## Complete Context (Lines 280-320)

### AFTER Changes Applied

```python
280    def process_message(self, message: Dict, project_name: str, group_jid: str) -> bool:
281        """Process a single message for drop numbers with validation."""
282        drop_number = self.extract_drop_number(message['content'])
283
284        if not drop_number:
285            return False
286
287        logger.info(f"📱 Found drop: {drop_number} in {project_name}")
288
289        # ✅ VALIDATION CHECK - MOHADIN, LAWLEY & MAMELODI (other projects pass through)
290        if project_name in ['Mohadin', 'Lawley', 'Mamelodi']:
291            if not self.validate_drop_number(drop_number, project_name):
292                logger.warning(f"❌ INVALID DROP: {drop_number} not in valid list for {project_name}")
293                self.log_invalid_drop(drop_number, project_name, message['sender'], group_jid)
294
295                # Resolve sender to phone number (resolve LIDs)
296                sender_phone = self.resolve_sender_to_phone(message['sender'])
297
298                # Send direct WhatsApp message with @mention
299                reply_message = (
300                    f"❌ Invalid Drop Number\n\n"
301                    f"Drop {drop_number} is not in the valid list for {project_name}.\n\n"
302                    f"Please submit a valid drop number from the project plan."
303                )
304                self.send_whatsapp_direct_message(group_jid, sender_phone, reply_message)
305
306                return False
307            logger.info(f"✅ VALIDATED: {drop_number} is valid for {project_name}")
308        else:
309            logger.debug(f"⏭️  SKIPPED VALIDATION: {drop_number} (Velo Test passes through)")
310
311        # Resolve sender to actual phone number (handles LIDs from linked devices)
312        resolved_phone = self.resolve_sender_to_phone(message['sender'])
313
314        # Check if message contains resubmission keywords (Done, Updated, etc.)
315        has_keyword = self.has_resubmission_keyword(message['content'])
316
317        # Check if drop already exists
318        if self.db.check_drop_exists(drop_number):
319            if has_keyword:
320                logger.info(f"🔄 Resubmission with keyword detected: {drop_number}")
```

---

## Validation Flow After Changes

```
┌─────────────────────────────────────┐
│ Drop submitted to WhatsApp group    │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Monitor extracts drop number        │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Check project name                  │
└─────────────┬───────────────────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
   ┌─────────┐  ┌────────────┐
   │ Mohadin │  │ Velo Test  │
   │ Lawley  │  │ (skip)     │
   │ Mamelodi│  └────────────┘
   └────┬────┘
        │
        ▼
┌──────────────────────────────────────┐
│ Query valid_drop_numbers table       │
│ WHERE drop_number = ? AND project = ?│
└─────────────┬────────────────────────┘
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
   ┌─────────┐  ┌──────────┐
   │ FOUND   │  │ NOT FOUND│
   │ (valid) │  │ (invalid)│
   └────┬────┘  └────┬─────┘
        │            │
        ▼            ▼
   ┌─────────┐  ┌──────────────────────┐
   │ INSERT  │  │ 1. Log to DB         │
   │ TO DB   │  │ 2. Send WhatsApp     │
   │         │  │ 3. Reject (return)   │
   └─────────┘  └──────────────────────┘
```

---

## Testing Commands

### Before Deployment
```bash
# 1. Verify data loaded
psql $DATABASE_URL -c "SELECT COUNT(*) FROM valid_drop_numbers WHERE project = 'Mamelodi';"

# Should return count > 0, NOT 0
```

### After Deployment
```bash
# 2. Watch validation in action
ssh root@72.60.17.245
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep -E "(VALIDAT|Mamelodi)"
```

### Expected Log Output

**Valid Drop:**
```
[2025-11-14 10:30:45] 📱 Found drop: DR1234567 in Mamelodi
[2025-11-14 10:30:45] 🔍 VALIDATING: DR1234567 for Mamelodi
[2025-11-14 10:30:45] ✅ VALIDATED: DR1234567 is valid for Mamelodi
[2025-11-14 10:30:45] ✅ Inserted new drop: DR1234567 (Mamelodi)
```

**Invalid Drop:**
```
[2025-11-14 10:31:20] 📱 Found drop: DR9999999 in Mamelodi
[2025-11-14 10:31:20] 🔍 VALIDATING: DR9999999 for Mamelodi
[2025-11-14 10:31:20] ❌ INVALID DROP: DR9999999 not in valid list for Mamelodi
[2025-11-14 10:31:20] 🚫 REJECTED: DR9999999 (not in valid list for Mamelodi)
[2025-11-14 10:31:20] 🔗 Resolved LID abc123 → 27712345678
[2025-11-14 10:31:20] ✅ Direct message (8081) sent to 27712345678
```

---

## Deployment Checklist

- [ ] **Data Loaded**: Run `node scripts/sync-mamelodi-valid-drops.js`
- [ ] **Data Verified**: Count > 0 in `valid_drop_numbers` for Mamelodi
- [ ] **Line 290 Updated**: Added `'Mamelodi'` to list
- [ ] **Line 308 Updated**: Removed "and Mamelodi" from message
- [ ] **Safe Restart Used**: `/opt/wa-monitor/prod/restart-monitor.sh`
- [ ] **Service Running**: `systemctl status wa-monitor-prod` shows active
- [ ] **Logs Monitored**: Watching for first Mamelodi validations
- [ ] **Valid Test**: Posted valid drop, accepted
- [ ] **Invalid Test**: Posted invalid drop, rejected with reply
- [ ] **Rejections Logged**: Checked `invalid_drop_submissions` table

---

## Exact Commands for Deployment

```bash
# Step 1: Load data (LOCAL)
cd /home/louisdup/VF/Apps/FF_React
node scripts/sync-mamelodi-valid-drops.js

# Step 2: Verify data (LOCAL)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM valid_drop_numbers WHERE project = 'Mamelodi';"

# Step 3: SSH to VPS
ssh root@72.60.17.245

# Step 4: Edit monitor
nano /opt/wa-monitor/prod/modules/monitor.py
# - Line 290: Add 'Mamelodi'
# - Line 308: Remove "and Mamelodi"
# Save: Ctrl+O, Enter, Ctrl+X

# Step 5: Restart (SAFE)
/opt/wa-monitor/prod/restart-monitor.sh

# Step 6: Monitor
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep "Mamelodi"
```

---

**Created**: November 14, 2025
**Lines Changed**: 2
**Words Added**: 2
**Words Removed**: 3
**Risk**: Minimal (fail-open design)
**Testing**: Required before production
