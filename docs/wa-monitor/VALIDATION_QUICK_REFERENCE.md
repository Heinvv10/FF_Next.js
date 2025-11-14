# WA Monitor Drop Validation - Quick Reference

**Version:** 1.0 | **Status:** ✅ PRODUCTION | **Updated:** Nov 14, 2025

---

## What It Does

✅ Validates drop numbers against SharePoint master list
✅ Auto-rejects invalid drops with WhatsApp replies
✅ Logs all rejections for analysis
✅ ~20ms validation per drop (fast!)

---

## Current Status

| Project | Validation | Valid Drops | Status |
|---------|-----------|-------------|--------|
| **Mohadin** | ✅ Active | 22,140 drops | DR1874110 → DR1856517 |
| Lawley | ⏭️ Disabled | N/A | All drops accepted |
| Velo Test | ⏭️ Disabled | N/A | All drops accepted |
| Mamelodi | ⏭️ Disabled | N/A | All drops accepted |

---

## Quick Commands

### Check Validation Data
```bash
# Count valid drops per project
psql $DATABASE_URL -c "SELECT project, COUNT(*) FROM valid_drop_numbers GROUP BY project;"

# Check if specific drop is valid
psql $DATABASE_URL -c "SELECT * FROM valid_drop_numbers WHERE drop_number = 'DR1874110';"
```

### View Rejections
```bash
# Last 10 rejections
psql $DATABASE_URL -c "SELECT drop_number, project, submitted_at FROM invalid_drop_submissions ORDER BY submitted_at DESC LIMIT 10;"

# Rejection count by project
psql $DATABASE_URL -c "SELECT project, COUNT(*) FROM invalid_drop_submissions GROUP BY project;"
```

### Watch Live
```bash
# Monitor validation in real-time
ssh root@72.60.17.245 "tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep -E 'VALID|INVALID'"
```

### Re-Sync Validation Data
```bash
# Re-sync Mohadin drops from SharePoint
node scripts/sync-mohadin-valid-drops.js
```

---

## Testing

### Test Valid Drop (Mohadin)
```
Post to group: DR1874110
```
**Expected:** ✅ Processes silently, appears on dashboard

### Test Invalid Drop (Mohadin)
```
Post to group: DR9999999
```
**Expected:** ❌ Rejected + auto-reply in WhatsApp

---

## Files & Locations

| Item | Location |
|------|----------|
| **Full Documentation** | `docs/wa-monitor/DROP_VALIDATION_SYSTEM.md` |
| **Sync Script** | `scripts/sync-mohadin-valid-drops.js` |
| **Monitor Code** | `/opt/wa-monitor/prod/modules/monitor.py` (VPS) |
| **Validation Table** | `valid_drop_numbers` (Neon) |
| **Rejection Log** | `invalid_drop_submissions` (Neon) |

---

## Common Tasks

### Add Validation to Another Project

**1. Create sync script:**
```bash
# Copy and modify
cp scripts/sync-mohadin-valid-drops.js scripts/sync-lawley-valid-drops.js

# Edit:
# - SHARING_URL (SharePoint file)
# - Range (e.g., A2:A30000)
# - Project name ('Mohadin' → 'Lawley')
```

**2. Run sync:**
```bash
node scripts/sync-lawley-valid-drops.js
```

**3. Enable in monitor:**
```python
# Edit /opt/wa-monitor/prod/modules/monitor.py line 268:
if project_name in ['Mohadin', 'Lawley']:  # Add 'Lawley'
```

**4. Deploy:**
```bash
scp scripts/monitor-with-validation.py root@72.60.17.245:/tmp/monitor.py
ssh root@72.60.17.245 "cp /tmp/monitor.py /opt/wa-monitor/prod/modules/monitor.py && /opt/wa-monitor/prod/restart-monitor.sh"
```

---

## Troubleshooting

### Auto-reply not working?
```bash
# Check WhatsApp bridge
ssh root@72.60.17.245 "ss -tlnp | grep 8080"

# Test bridge manually
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -d '{"recipient":"120363421532174586@g.us","message":"Test"}'
```

### Valid drop rejected?
```bash
# Check if drop exists in table
psql $DATABASE_URL -c "SELECT * FROM valid_drop_numbers WHERE drop_number = 'DR1234567';"

# Check project name matches
psql $DATABASE_URL -c "SELECT DISTINCT project FROM valid_drop_numbers;"
```

### Need to update validation data?
```bash
# Re-run sync script (replaces all data)
node scripts/sync-mohadin-valid-drops.js
```

---

## Performance

- **Validation:** ~20ms per drop
- **Auto-reply:** ~100-200ms per rejection
- **Sync Speed:** ~500 drops/second
- **Database Size:** ~2-5 MB (22k drops)

---

## Auto-Reply Message

```
❌ *Invalid Drop Number*

Drop {drop_number} is not in the valid list for {project}.

Please submit a valid drop number from the project plan.
```

---

**Full Documentation:** See `docs/wa-monitor/DROP_VALIDATION_SYSTEM.md`
**Main Config:** See `CLAUDE.md` - WA Monitor section
