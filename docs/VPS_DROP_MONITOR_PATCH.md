# VPS Drop Monitor Patch Instructions
**Date**: 2025-11-06
**Purpose**: Add `whatsapp_message_date` tracking to drop monitor

## Changes Required

### File: `/opt/velo-test-monitor/services/realtime_drop_monitor.py`

### Change 1: Update `create_qa_photo_review` function signature (Line ~499)

**FROM:**
```python
def create_qa_photo_review(drop_number: str, contractor_name: str, project_name: str = 'Lawley', sender_phone: str = None, dry_run: bool = False) -> bool:
```

**TO:**
```python
def create_qa_photo_review(drop_number: str, contractor_name: str, project_name: str = 'Lawley', sender_phone: str = None, message_timestamp = None, dry_run: bool = False) -> bool:
```

### Change 2: Update INSERT columns (Line ~524)

**FROM:**
```python
        insert_query = """
        INSERT INTO qa_photo_reviews (
            drop_number,
            review_date,
            user_name,
            project,
            step_01_property_frontage, step_02_location_before_install,
```

**TO:**
```python
        insert_query = """
        INSERT INTO qa_photo_reviews (
            drop_number,
            review_date,
            user_name,
            project,
            whatsapp_message_date,
            step_01_property_frontage, step_02_location_before_install,
```

### Change 3: Update VALUES clause (Line ~540)

**FROM:**
```python
        ) VALUES (
            %s, CURRENT_DATE, %s, %s,
            FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE,
```

**TO:**
```python
        ) VALUES (
            %s, CURRENT_DATE, %s, %s, %s,
            FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE,
```

### Change 4: Update execute parameters (Line ~551)

**FROM:**
```python
        cursor.execute(insert_query, (
            drop_number,
            user_name,
            project_name,
            comment
        ))
```

**TO:**
```python
        cursor.execute(insert_query, (
            drop_number,
            user_name,
            project_name,
            message_timestamp if message_timestamp else datetime.now(),
            comment
        ))
```

### Change 5: Update function call in `insert_drop_numbers_to_neon` (Line ~613)

**FROM:**
```python
                create_qa_photo_review(
                    drop_info['drop_number'],
                    drop_info['contractor_name'],
                    drop_info.get('project_name', 'Unknown'),
                    dry_run=False
                )
```

**TO:**
```python
                create_qa_photo_review(
                    drop_info['drop_number'],
                    drop_info['contractor_name'],
                    drop_info.get('project_name', 'Unknown'),
                    drop_info.get('sender_phone'),
                    drop_info.get('timestamp'),
                    dry_run=False
                )
```

## Manual Application Steps

```bash
# 1. SSH to VPS
ssh root@72.60.17.245

# 2. Backup current script
cp /opt/velo-test-monitor/services/realtime_drop_monitor.py /opt/velo-test-monitor/services/realtime_drop_monitor.py.backup_20251106

# 3. Edit the file
nano /opt/velo-test-monitor/services/realtime_drop_monitor.py

# Make the 5 changes above

# 4. Stop the running process
kill -TERM [PID]  # Use the PID from: ps aux | grep realtime_drop_monitor

# 5. Restart the monitor
cd /opt/velo-test-monitor/services
nohup python3 realtime_drop_monitor.py --interval 15 >> /opt/velo-test-monitor/logs/drop_monitor.log 2>&1 &

# 6. Verify it's running
ps aux | grep realtime_drop_monitor
tail -f /opt/velo-test-monitor/logs/drop_monitor.log
```

## Verification

After applying and restarting:

```sql
-- Check that new drops have whatsapp_message_date set
SELECT drop_number, created_at, whatsapp_message_date
FROM qa_photo_reviews
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- The whatsapp_message_date should be close to (but potentially different from) created_at
```

## Rollback

If issues occur:
```bash
mv /opt/velo-test-monitor/services/realtime_drop_monitor.py.backup_20251106 /opt/velo-test-monitor/services/realtime_drop_monitor.py
# Restart the monitor
```
