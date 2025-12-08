# WA Monitor Diagnostic Checklist

**Last Updated:** December 8, 2025

When investigating missing drops in the WA Monitor system, follow this checklist to avoid false diagnoses.

## ⚠️ CRITICAL: Don't Jump to Conclusions!

**Before assuming the WhatsApp monitoring system is broken:**

A missing individual drop number does NOT necessarily mean the system is down. The system could be working perfectly while individual drops are legitimately missing.

---

## Step-by-Step Diagnostic Process

### Step 1: Verify System is Currently Working ✅

**Check for recent drops to confirm system is operational:**

```sql
SELECT drop_number, project, created_at
FROM qa_photo_reviews
ORDER BY created_at DESC
LIMIT 10
```

**Expected result:**
- ✅ Recent drops (within last 24 hours) present → System IS working
- ❌ No recent drops (none in 24+ hours) → System MAY be down

**Example output:**
```
DR1855489 | Mohadin | 2025-12-08 10:08:12  ← Today's date
DR1855234 | Lawley  | 2025-12-08 09:45:23  ← Recent activity
```

If you see recent drops with today's date, **STOP** - the system is working.

---

### Step 2: Check Drops Around the Same Time Period 📅

**Search for drops on the same day as the missing drop:**

```sql
SELECT drop_number, review_date, user_name, created_at
FROM qa_photo_reviews
WHERE project = 'Lawley'
  AND DATE(review_date) = '2025-11-27'
ORDER BY created_at
```

**Expected result:**
- If you find 10+ drops on the same day → System was working that day
- If you find 0 drops on that day → System was potentially down

---

### Step 3: Look for Sequence Gaps 🔍

**Check for neighboring drop numbers to identify gaps:**

```sql
SELECT drop_number
FROM qa_photo_reviews
WHERE drop_number LIKE 'DR1733%'
ORDER BY drop_number
```

**Interpret the results:**

| Pattern | Diagnosis | Action |
|---------|-----------|--------|
| DR1733646 ✅, DR1733647 ❌, DR1733649 ✅ | System working, specific drop not posted | Manual add |
| DR1733646 ✅, DR1733647 ❌, DR1733648 ❌, DR1733649 ❌ | System working, multiple drops not posted | Investigate source |
| All DR1733xxx missing | System was down during that period | Check bridge logs |

**Key insight:** If drops immediately before AND after the missing drop exist, the system captured them successfully. The missing drop was never posted to WhatsApp.

---

### Step 4: Determine Root Cause 🎯

Based on the above checks:

#### Scenario A: System IS Working (Most Common)
**Evidence:**
- ✅ Recent drops from today exist
- ✅ Drops from the same day as missing drop exist
- ✅ Neighboring drop numbers exist (e.g., DR1733646, DR1733649)

**Root cause:**
- Contractor never posted the drop to WhatsApp
- Drop posted to wrong WhatsApp group
- Typo in drop number when posted
- Message deleted before monitor captured it

**Action:** Manually add the drop

---

#### Scenario B: System WAS Down (Rare)
**Evidence:**
- ❌ No drops for multiple days
- ❌ Large sequence gaps (10+ missing drops in a row)
- ❌ No drops around the reported date

**Root cause:**
- WhatsApp bridge disconnected
- Monitor script stopped
- Database connectivity issues

**Action:** Check bridge logs, restart services

---

## Manual Drop Addition

If diagnosis confirms the drop was never posted (Scenario A), manually add it:

```bash
node /home/louisdup/VF/Apps/FF_React/scripts/manually-add-drop.cjs
```

**Before running, edit the script to set:**
- `drop_number` - e.g., 'DR1733647'
- `review_date` - e.g., '2025-11-27'
- `project` - e.g., 'Lawley'
- `user_name` - If known, otherwise 'Manual Entry'

---

## Common Mistakes to Avoid ❌

### ❌ Mistake 1: Assuming System Failure Without Verification
**Wrong approach:**
```
User: "DR1733647 is missing"
You: "The WhatsApp bridge is down! Let me restart everything!"
```

**Correct approach:**
```
User: "DR1733647 is missing"
You: "Let me check if the system is working first..."
      → Check recent drops
      → Check drops from Nov 27
      → Check DR1733646 and DR1733649
You: "System is working. DR1733647 was never posted. I'll add it manually."
```

### ❌ Mistake 2: Not Checking Neighboring Drops
Missing one drop in a sequence of 50 drops captured that day means the specific drop was not posted, NOT that the system failed.

### ❌ Mistake 3: Ignoring Recent System Activity
If drops from today exist, the system is clearly working NOW. Don't restart services unnecessarily.

---

## Quick Reference Commands

### Check System Health
```sql
-- Recent activity (last 24 hours)
SELECT COUNT(*) as recent_drops
FROM qa_photo_reviews
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Find Missing Drops in Sequence
```sql
-- Identify gaps in drop numbers
WITH numbered_drops AS (
  SELECT
    drop_number,
    CAST(SUBSTRING(drop_number FROM 3) AS INTEGER) as drop_id
  FROM qa_photo_reviews
  WHERE drop_number LIKE 'DR%'
    AND project = 'Lawley'
    AND DATE(review_date) = '2025-11-27'
)
SELECT drop_id FROM generate_series(
  (SELECT MIN(drop_id) FROM numbered_drops),
  (SELECT MAX(drop_id) FROM numbered_drops)
) drop_id
WHERE drop_id NOT IN (SELECT drop_id FROM numbered_drops)
ORDER BY drop_id;
```

### Export Drops for Date Range (Debugging)
```sql
SELECT drop_number, review_date, user_name, created_at
FROM qa_photo_reviews
WHERE project = 'Lawley'
  AND review_date BETWEEN '2025-11-27' AND '2025-11-28'
ORDER BY drop_number;
```

---

## Escalation Criteria

**Only escalate to system-level investigation if:**
1. No drops captured in last 24+ hours
2. Large gaps (10+ consecutive missing drops)
3. All recent system health checks fail
4. Multiple users report missing drops from different time periods

**For single missing drops with healthy system metrics:** Manually add the drop and inform the user it was likely not posted to WhatsApp.

---

## Related Documentation

- **Main Documentation:** `/home/louisdup/VF/Apps/FF_React/CLAUDE.md` (lines 79-111)
- **Module README:** `/home/louisdup/VF/Apps/FF_React/src/modules/wa-monitor/README.md` (lines 289-335)
- **Database Reference:** `/home/louisdup/VF/Apps/FF_React/docs/DATABASE_TABLES.md`
- **Manual Add Script:** `/home/louisdup/VF/Apps/FF_React/scripts/manually-add-drop.cjs`

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2025-12-08 | Initial checklist created after DR1733647 incident | Claude Code |

---

**Remember:** A single missing drop with healthy system metrics = human error, not system failure! ✅
