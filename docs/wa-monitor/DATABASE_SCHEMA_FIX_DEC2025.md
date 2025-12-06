# WA Monitor Database Schema Fix - December 2025

## 🔴 CRITICAL: UNIQUE Constraint Prevented Cross-Table Independence

**Fixed:** December 3, 2025
**Severity:** HIGH - Prevented drops from existing in both Marketing and QA tables
**Impact:** 4 drops affected (Nov 26 - Dec 2)
**Root Cause:** Database schema had UNIQUE constraint on `drop_number` alone

---

## Problem Summary

**User Requirement:**
> A drop posted to BOTH Marketing group AND Lawley group should appear in BOTH tables:
> - `marketing_activations` (Marketing submissions)
> - `qa_photo_reviews` (QA submissions for Lawley/Mohadin/Mamelodi)

**What Was Happening:**
When a drop was posted to Marketing group first, then to Lawley group:
1. Marketing submission → Stored in `marketing_activations` ✅
2. Lawley submission → Failed with constraint violation ❌
3. Error: `Key (drop_number)=(DR1752104) already exists.`

**Why It Failed:**
The `qa_photo_reviews` table had a UNIQUE constraint on `drop_number` column, preventing the same drop number from existing twice in the table (even for different projects).

---

## Root Cause Analysis

### Database Schema Issue

**Before Fix:**
```sql
-- qa_photo_reviews had TWO UNIQUE constraints:
CONSTRAINT qa_photo_reviews_drop_number_key UNIQUE (drop_number)  -- PROBLEMATIC!
CONSTRAINT qa_photo_reviews_drop_number_review_date_key UNIQUE (drop_number, review_date)
```

**The Problem:**
- The first constraint (`drop_number` alone) blocked drops from appearing multiple times
- This violated the business requirement that Marketing and QA tables are independent
- A drop posted to Marketing group could not later be posted to Lawley group

**Error Message in Logs:**
```
2025-12-02 11:29:01 - ERROR - Error inserting drop: duplicate key value violates unique constraint "qa_photo_reviews_drop_number_key"
DETAIL:  Key (drop_number)=(DR1733755) already exists.
```

---

## The Fix

### 1. Schema Change

**Dropped the problematic constraint:**
```sql
ALTER TABLE qa_photo_reviews DROP CONSTRAINT IF EXISTS qa_photo_reviews_drop_number_key;
```

**Remaining constraint (this is correct):**
```sql
CONSTRAINT qa_photo_reviews_drop_number_review_date_key UNIQUE (drop_number, review_date)
```

**Why this works:**
- Allows same drop_number with different review_dates (different submissions)
- Prevents true duplicates (same drop on same date)
- Enables cross-table independence (Marketing vs QA)

### 2. Fixed Affected Drops

**Manually inserted drops that failed due to constraint:**

| Drop Number | Marketing Time (SAST) | Lawley Time (SAST) | Status |
|-------------|----------------------|-------------------|--------|
| DR1752104 | Nov 26, 12:47 | Nov 26, 13:42 | ✅ Fixed |
| DR1733787 | Dec 1, 14:26 | Dec 1, 15:28 | ✅ Fixed |
| DR1733755 | Dec 2, 11:23 | Dec 2, 11:28 | ✅ Fixed |
| DR1733714 | Dec 2, 13:03 | Dec 2, 13:24 | ✅ Fixed |

**SQL used:**
```sql
-- Example: DR1752104
INSERT INTO qa_photo_reviews (
  drop_number, project, whatsapp_message_date,
  submitted_by, user_name, review_date, created_at, updated_at
) VALUES (
  'DR1752104', 'Lawley', '2025-11-26 11:42:54+00'::timestamptz,
  '27699411029', '27699411029', '2025-11-26'::date, NOW(), NOW()
);
```

---

## Verification

### All Affected Drops Now in Both Tables

```sql
SELECT
  drop_number,
  string_agg(DISTINCT source || ' (' || TO_CHAR(sast_time, 'Mon DD HH24:MI') || ')', ', ') as locations
FROM (
  SELECT drop_number, 'QA/' || project as source, whatsapp_message_date AT TIME ZONE 'Africa/Johannesburg' as sast_time
  FROM qa_photo_reviews
  WHERE drop_number IN ('DR1752104', 'DR1733787', 'DR1733755', 'DR1733714')

  UNION ALL

  SELECT drop_number, 'Marketing' as source, whatsapp_message_date AT TIME ZONE 'Africa/Johannesburg' as sast_time
  FROM marketing_activations
  WHERE drop_number IN ('DR1752104', 'DR1733787', 'DR1733755', 'DR1733714')
) combined
GROUP BY drop_number
ORDER BY drop_number;
```

**Result:**
```
 drop_number |                     locations
-------------+----------------------------------------------------
 DR1733714   | Marketing (Dec 02 13:03), QA/Lawley (Dec 02 13:24)
 DR1733755   | Marketing (Dec 02 11:23), QA/Lawley (Dec 02 11:28)
 DR1733787   | Marketing (Dec 01 14:26), QA/Lawley (Dec 01 15:28)
 DR1752104   | Marketing (Nov 26 12:47), QA/Lawley (Nov 26 13:42)
```

✅ **All drops now exist in BOTH tables as required**

---

## Technical Details

### Why This Happened

**Timeline:**
1. **Nov 26** - User posted DR1752104 to Marketing (12:47), then Lawley (13:42)
2. Monitor processed Marketing submission → Stored in `marketing_activations` ✅
3. Monitor processed Lawley submission → Hit UNIQUE constraint error ❌
4. Same issue occurred for DR1733787 (Dec 1), DR1733755 (Dec 2), DR1733714 (Dec 2)

**Code Behavior:**
```python
# In /opt/wa-monitor/prod/modules/database.py
def insert_drop(self, drop_data: Dict) -> bool:
    query = """
    INSERT INTO qa_photo_reviews (
        drop_number, project, whatsapp_message_date, ...
    ) VALUES (%s, %s, %s, ...)
    """
    # This failed when drop_number already existed due to UNIQUE constraint
```

**Error Handling:**
The monitor logged the error but continued processing other messages:
```
ERROR - Error inserting drop: duplicate key value violates unique constraint
```

### Why It Wasn't Caught Earlier

1. **Marketing groups are new** - Only added recently
2. **Drops rarely posted to both** - Most drops go to only one group
3. **Error was non-blocking** - Monitor continued running, just skipped the drop
4. **No alerts** - Constraint violations were logged but not monitored

---

## Business Logic Clarification

### Table Independence

**Marketing Activations (`marketing_activations`)**
- **Purpose:** Track marketing team's field activations
- **Groups:** Marketing Activations WhatsApp group
- **Validation:** None (accepts all drops)
- **Independence:** Completely separate from QA process

**QA Photo Reviews (`qa_photo_reviews`)**
- **Purpose:** Track QA photo review process for installation quality
- **Groups:** Lawley, Mohadin, Mamelodi, Velo Test
- **Validation:** Lawley/Mohadin validate against `valid_drop_numbers`, others accept all
- **Shared Space:** Lawley/Mohadin/Mamelodi share drop number space (prevent duplicates within these 3)

**Cross-Table Rule:**
A single drop CAN and SHOULD exist in both tables if:
- Posted to Marketing group (marketing activation)
- Posted to Lawley/Mohadin/Mamelodi group (QA photo review)

This is a **valid business scenario** - the same installation can have:
- Marketing activation record
- QA photo review record

### Monitor Logic

**Project-Aware Duplicate Detection:**
```python
# In /opt/wa-monitor/prod/modules/database.py (added Dec 1, 2025)
def check_drop_exists(self, drop_number: str, project: str) -> bool:
    """
    Check if drop already exists in database (project-aware).

    Business Rules:
    - Marketing Activations: Only checks within Marketing Activations
    - Lawley/Mohadin/Mamelodi: Checks across all 3 projects (shared drop space)
    """
    project_group = self._get_project_group(project)

    # Only checks qa_photo_reviews, NOT marketing_activations
    query = """
        SELECT id FROM qa_photo_reviews
        WHERE drop_number = %s AND project IN (%s)
    """
```

**Key Points:**
1. QA monitor only checks `qa_photo_reviews` (not `marketing_activations`)
2. Marketing monitor only checks `marketing_activations` (not `qa_photo_reviews`)
3. Each monitor is independent

---

## Monitor Code Status

### ✅ Code Already Fixed (Dec 1, 2025)

The monitor code was updated on Dec 1 to be project-aware:

**File:** `/opt/wa-monitor/prod/modules/database.py`
**Last Modified:** Dec 1, 2025

**Changes:**
- Added `project` parameter to `check_drop_exists()`
- Added `_get_project_group()` method for project grouping
- Updated resubmission logic to be project-aware

**The code fix alone wasn't enough** - the database schema constraint blocked it!

---

## Prevention

### What Changed

1. ✅ **Schema fixed** - Removed problematic UNIQUE constraint
2. ✅ **Code fixed** - Project-aware duplicate detection (already done Dec 1)
3. ✅ **Affected drops fixed** - Manually inserted 4 missing drops

### Monitoring

**Add to monitoring:**
- Check for constraint violation errors in monitor logs
- Alert if `duplicate key value` appears in logs
- Monitor drop counts: Marketing vs QA table

**Query to check for issues:**
```sql
-- Find drops in marketing_activations that should be in qa_photo_reviews
-- (posted to both groups but only in one table)
SELECT m.drop_number, m.whatsapp_message_date
FROM marketing_activations m
WHERE DATE(m.whatsapp_message_date) >= CURRENT_DATE - INTERVAL '7 days'
  AND NOT EXISTS (
    SELECT 1 FROM qa_photo_reviews q
    WHERE q.drop_number = m.drop_number
  )
LIMIT 10;
```

### Testing

**Test scenario:**
1. Post drop DR_TEST123 to Marketing group
2. Wait for processing (check `marketing_activations`)
3. Post same drop DR_TEST123 to Lawley group
4. Wait for processing (check `qa_photo_reviews`)
5. Verify drop exists in BOTH tables

**Expected result:**
- No constraint errors in logs
- Drop appears in both tables with different timestamps

---

## Files Modified

### Database Schema
- **Table:** `qa_photo_reviews`
- **Constraint Dropped:** `qa_photo_reviews_drop_number_key`
- **Date:** December 3, 2025

### Monitor Code (Already Fixed Dec 1)
- **File:** `/opt/wa-monitor/prod/modules/database.py`
- **Changes:** Project-aware duplicate detection
- **Date:** December 1, 2025

### Documentation
- **This file:** `docs/wa-monitor/DATABASE_SCHEMA_FIX_DEC2025.md`
- **Updated:** CLAUDE.md (reference to this fix)

---

## Commands Reference

### Check Schema
```sql
-- View remaining constraints
SELECT con.conname, con.contype, array_agg(a.attname) AS columns
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
LEFT JOIN pg_attribute a ON a.attnum = ANY(con.conkey) AND a.attrelid = rel.oid
WHERE rel.relname = 'qa_photo_reviews' AND con.contype = 'u'
GROUP BY con.conname, con.contype;
```

### Check Drop Locations
```sql
-- Find a specific drop in both tables
SELECT 'qa_photo_reviews' as table, drop_number, project, whatsapp_message_date
FROM qa_photo_reviews WHERE drop_number = 'DR1752104'
UNION ALL
SELECT 'marketing_activations' as table, drop_number, 'Marketing' as project, whatsapp_message_date
FROM marketing_activations WHERE drop_number = 'DR1752104';
```

### Check for Missing Drops
```sql
-- Drops posted to both groups but only in one table
SELECT m.drop_number,
       m.whatsapp_message_date AT TIME ZONE 'Africa/Johannesburg' as marketing_time,
       q.whatsapp_message_date AT TIME ZONE 'Africa/Johannesburg' as qa_time
FROM marketing_activations m
FULL OUTER JOIN qa_photo_reviews q ON m.drop_number = q.drop_number
WHERE m.drop_number IS NOT NULL AND q.drop_number IS NULL
   OR m.drop_number IS NULL AND q.drop_number IS NOT NULL;
```

---

## Keywords for Search

Search these terms to find this doc quickly:
- "UNIQUE constraint qa_photo_reviews"
- "duplicate key value violates unique constraint"
- "DR1752104 missing from qa_photo_reviews"
- "Drop posted to both groups not appearing"
- "Marketing and Lawley drop independence"
- "qa_photo_reviews_drop_number_key"
- "Cross-table independence fix"
- "Drop appears in Marketing but not QA table"

---

## Lessons Learned

1. **Schema constraints can block business logic** - Code was correct, schema wasn't
2. **Test cross-table scenarios** - Most tests only checked single-table operations
3. **Monitor constraint errors** - These were logged but not alerted
4. **Document schema decisions** - The UNIQUE constraint wasn't documented
5. **Business requirements override technical assumptions** - "One drop, one record" seemed logical but was wrong

---

## Related Issues

- **Nov 26, 2025** - DR1752104 posted to both groups, only appeared in Marketing
- **Dec 1, 2025** - Monitor code updated for project-aware logic
- **Dec 2, 2025** - DR1733755, DR1733714 hit same constraint issue
- **Dec 3, 2025** - Root cause identified: Database schema constraint
- **Dec 3, 2025** - Schema fixed, affected drops manually inserted

---

**Status:** ✅ RESOLVED
**Verified:** All 4 affected drops now in both tables
**Monitor:** Running without constraint errors
**Next Steps:** Add monitoring for constraint violations
