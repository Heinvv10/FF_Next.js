# WhatsApp Bridge Fix - November 10, 2025

## Issue Summary

**Date:** November 10, 2025
**Duration:** Drops failed to insert from Nov 9, 1:17 PM to Nov 10, 7:34 AM
**Impact:** All new WhatsApp drops failed to be recorded in database
**Root Cause:** WhatsApp bridge recompiled with outdated source code referencing wrong column names

---

## Problem Description

### Symptoms
- User posted `DR0000020` to Velo Test WhatsApp group
- Drop did not appear in dashboard at https://app.fibreflow.app/wa-monitor
- WhatsApp bridge logs showed error:
  ```
  ❌ FAILED to create QA review for DR0000020:
  column "step_01_property_frontage" of relation "qa_photo_reviews" does not exist
  ```

### Timeline
- **Last successful drop:** Nov 9, 10:08 AM (DR0000017)
- **Bridge recompiled:** Nov 9, 1:17 PM (with wrong code)
- **Issue detected:** Nov 10, 6:56 AM (DR0000020 failed)
- **Issue resolved:** Nov 10, 7:34 AM (bridge fixed and restarted)

---

## Root Cause Analysis

### What Went Wrong

1. **Overcomplicated INSERT Statement**
   - WhatsApp bridge was trying to explicitly insert ALL 12 QA step columns
   - Example of broken code:
     ```sql
     INSERT INTO qa_photo_reviews (
       drop_number, review_date, user_name, project,
       step_01_property_frontage,        -- ❌ WRONG COLUMN NAME
       step_02_location_before_install,  -- ❌ WRONG COLUMN NAME
       step_03_outside_cable_span,       -- ❌ WRONG COLUMN NAME
       ... (14 total step columns)
     ) VALUES (
       $1, $2, $3, $4,
       FALSE, FALSE, FALSE, ... (14 FALSE values)
     )
     ```

2. **Database Has Different Column Names**
   - Actual database columns:
     - `step_01_house_photo`
     - `step_02_cable_from_pole`
     - `step_03_cable_entry_outside`
     - ... (12 total columns)

3. **Design Flaw**
   - The bridge should ONLY insert the drop number and let the database handle defaults
   - The 12 QA steps are filled in later by QA reviewers on the dashboard
   - Bridge was doing unnecessary work

---

## The Fix

### Simplified INSERT Statement

**Before (Broken - 14 columns):**
```sql
INSERT INTO qa_photo_reviews (
  drop_number, review_date, user_name, project,
  step_01_property_frontage, step_02_location_before_install,
  step_03_outside_cable_span, step_04_home_entry_outside,
  step_05_home_entry_inside, step_06_fibre_entry_to_ont,
  step_07_patched_labelled_drop, step_08_work_area_completion,
  step_09_ont_barcode_scan, step_10_ups_serial_number,
  step_11_powermeter_reading, step_12_powermeter_at_ont,
  step_13_active_broadband_light, step_14_customer_signature,
  outstanding_photos_loaded_to_1map, comment
) VALUES (
  $1, $2, $3, $4,
  FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE,
  $5
)
```

**After (Fixed - 5 columns):**
```sql
INSERT INTO qa_photo_reviews (
  drop_number, user_name, project, review_date, comment
) VALUES (
  $1, $2, $3, $4, $5
)
```

### Why This Works

**Database has DEFAULT values:**
```sql
-- All 12 step columns have DEFAULT false
step_01_house_photo          DEFAULT false
step_02_cable_from_pole      DEFAULT false
step_03_cable_entry_outside  DEFAULT false
... (9 more)

-- Other auto-filled columns
id           DEFAULT gen_random_uuid()
review_date  DEFAULT CURRENT_DATE
```

**Required columns (NOT NULL):**
1. `drop_number` ✅ Provided by bridge
2. `user_name` ✅ Provided by bridge

---

## Implementation Steps

### 1. Backed Up Original Code
```bash
cp /opt/velo-test-monitor/services/whatsapp-bridge/main.go \
   /opt/velo-test-monitor/services/whatsapp-bridge/main.go.backup.20251110_073000
```

### 2. Updated main.go
- **File:** `/opt/velo-test-monitor/services/whatsapp-bridge/main.go`
- **Lines changed:** 1165-1192 (replaced 28 lines with 10 lines)
- **Change:** Simplified INSERT statement to only required fields

### 3. Installed Go on VPS
```bash
cd /tmp
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
/usr/local/go/bin/go version  # go version go1.21.0 linux/amd64
```

### 4. Recompiled Bridge
```bash
cd /opt/velo-test-monitor/services/whatsapp-bridge
/usr/local/go/bin/go build -o whatsapp-bridge-new main.go
```

### 5. Replaced Binary
```bash
pkill whatsapp-bridge
mv whatsapp-bridge whatsapp-bridge.broken
mv whatsapp-bridge-new whatsapp-bridge
nohup ./whatsapp-bridge > /opt/velo-test-monitor/logs/whatsapp-bridge.log 2>&1 &
```

### 6. Verified Running
```bash
ps aux | grep whatsapp-bridge
tail -f /opt/velo-test-monitor/logs/whatsapp-bridge.log
# ✓ Connected to WhatsApp! Type 'help' for commands.
```

---

## Testing

### Test Case: Insert DR0000020
```sql
-- Bridge now inserts:
INSERT INTO qa_photo_reviews (
  drop_number, user_name, project, review_date, comment
) VALUES (
  'DR0000020',
  'Agent Name',
  'Velo Test',
  '2025-11-10',
  'Auto-created from WhatsApp on 2025-11-10 07:35:00'
)

-- Database auto-fills:
-- id                          = [random UUID]
-- step_01_house_photo         = false
-- step_02_cable_from_pole     = false
-- ... (all 12 steps)          = false
-- created_at                  = NOW()
-- updated_at                  = NOW()
```

---

## Prevention Measures

### 1. Source Code Management
- **Problem:** No version control for WhatsApp bridge
- **Solution:** Create Git repository for bridge code
  ```bash
  cd /opt/velo-test-monitor/services/whatsapp-bridge
  git init
  git add main.go
  git commit -m "Baseline: Simplified INSERT statement"
  ```

### 2. Documentation
- **Problem:** No documentation of correct INSERT statement
- **Solution:** This document + updated ARCHITECTURE_V2.md

### 3. Testing Before Deployment
- **Problem:** Bridge recompiled without testing
- **Solution:** Always test INSERT against database before deploying:
  ```bash
  # Test minimal INSERT works
  psql $DATABASE_URL -c "
    INSERT INTO qa_photo_reviews (drop_number, user_name, project)
    VALUES ('DR_TEST', 'Test', 'Velo Test')
    RETURNING drop_number, step_01_house_photo;
  "
  # Should return: DR_TEST | f
  ```

### 4. Monitoring
- **Problem:** Issue took 21 hours to detect
- **Solution:** Add alert if no drops inserted in 1 hour

---

## Key Learnings

1. **Keep It Simple**
   - The bridge should ONLY monitor WhatsApp and insert drop numbers
   - Don't try to fill in QA checklist data (that's the dashboard's job)

2. **Trust Database Defaults**
   - If columns have defaults, use them
   - Don't explicitly set values the database can auto-fill

3. **Version Control Everything**
   - Even compiled binaries need source control
   - Document what version is deployed

4. **Test After Every Compilation**
   - Never deploy without testing INSERT statement
   - Use a test drop number first

---

## Files Modified

| File | Location | Change |
|------|----------|--------|
| `main.go` | `/opt/velo-test-monitor/services/whatsapp-bridge/main.go` | Lines 1165-1192: Simplified INSERT |
| `whatsapp-bridge` | `/opt/velo-test-monitor/services/whatsapp-bridge/whatsapp-bridge` | Binary recompiled |

---

## Backup Locations

| Backup | Location | Date |
|--------|----------|------|
| Original source | `main.go.backup.20251110_073000` | Nov 10, 2025 |
| Broken binary | `whatsapp-bridge.broken` | Nov 9, 2025 (1:17 PM) |
| Previous working | `whatsapp-bridge.fixed` | Nov 9, 2025 (1:05 PM) |

---

## Contact & Maintenance

**Last Updated:** November 10, 2025
**Fixed By:** Claude Code
**Verified By:** Louis Duplessis

**If Bridge Fails Again:**
1. Check logs: `tail -100 /opt/velo-test-monitor/logs/whatsapp-bridge.log`
2. Test database INSERT manually (see Prevention Measures #3)
3. Compare `main.go` with backup: `main.go.backup.20251110_073000`
4. Verify bridge is running: `ps aux | grep whatsapp-bridge`
5. Check database defaults exist: See SQL in Root Cause Analysis section
