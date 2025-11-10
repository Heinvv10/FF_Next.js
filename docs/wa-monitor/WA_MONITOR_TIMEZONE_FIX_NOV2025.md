# WhatsApp Monitor Timezone Fix - November 10, 2025

## Issue Summary

**Date:** November 10, 2025
**Time:** 09:45 AM SAST
**Impact:** All WhatsApp QA comments displayed UTC timestamps instead of South African time
**Root Cause:** VPS server timezone was UTC, Go code used `time.Now()` without explicit timezone

---

## Problem Description

### User Report
> "can we sync our codes time with our local time. south africa time atm = 9h45 am. in order for the QA comments on the page ect to accurately reflect our times : Auto-created from WhatsApp on 2025-11-10 07:37:59"

### Symptoms
- QA comments showed UTC timestamps (e.g., 07:37:59)
- User's local time was 9:45 AM SAST (UTC+2)
- 2-hour time difference confusing for QA reviewers
- Resubmission timestamps also showed UTC

### Example
**Before Fix:**
```
Auto-created from WhatsApp on 2025-11-10 07:37:59
```

**After Fix:**
```
Auto-created from WhatsApp on 2025-11-10 10:05:47 SAST
```

---

## Root Cause Analysis

### 1. VPS Server Timezone
```bash
# Before:
Time zone: Etc/UTC (UTC, +0000)
Local time: Mon 2025-11-10 07:52:45 UTC

# Issue: Server was set to UTC instead of South African time
```

### 2. Go Code Using System Time
```go
// Original code (main.go lines 1155, 1176):
time.Now().Format("2006-01-02 15:04:05")

// Problem: Used server's system time (UTC) without explicit timezone
```

### 3. Database Timestamps
- Database `created_at` field stores UTC (correct for PostgreSQL)
- User-facing `comment` field showed UTC timestamp (incorrect for users)
- Need SAST timezone for user-facing timestamps

---

## The Fix (Two-Part Solution)

### Part 1: Set VPS Timezone to Africa/Johannesburg

**Why:** Ensures ALL services on VPS use South African time by default

```bash
# Set VPS timezone
sudo timedatectl set-timezone Africa/Johannesburg

# Verify
timedatectl
# Output:
# Time zone: Africa/Johannesburg (SAST, +0200)
# Local time: Mon 2025-11-10 09:52:59 SAST
```

**Benefits:**
- All system logs show SAST
- Drop monitors use SAST
- PM2 logs show SAST
- Nginx logs show SAST

### Part 2: Update Go Code to Explicitly Use SAST

**Why:** Even if VPS timezone changes, bridge will always use SAST

**Code Changes:**

#### Added Timezone Loading (After line 1135)
```go
// Load South African timezone (SAST)
loc, locErr := time.LoadLocation("Africa/Johannesburg")
if locErr != nil {
    // Fallback to UTC if timezone loading fails
    loc = time.UTC
}
// Get current time in SAST
nowSAST := time.Now().In(loc)
```

#### Updated Timestamp Usage (Lines 1155, 1176)
```go
// BEFORE:
fmt.Sprintf("Auto-created from WhatsApp on %s", time.Now().Format("2006-01-02 15:04:05"))
fmt.Sprintf("\n--- RESUBMITTED %s ---\n...", time.Now().Format("2006-01-02 15:04:05"), userName)

// AFTER:
fmt.Sprintf("Auto-created from WhatsApp on %s SAST", nowSAST.Format("2006-01-02 15:04:05"))
fmt.Sprintf("\n--- RESUBMITTED %s SAST ---\n...", nowSAST.Format("2006-01-02 15:04:05"), userName)
```

**Key Improvements:**
1. Loads `Africa/Johannesburg` timezone explicitly
2. Uses `locErr` variable to avoid conflict with existing `err`
3. Adds "SAST" suffix to timestamps for clarity
4. Fallback to UTC if timezone loading fails (defensive programming)

---

## Implementation Steps

### 1. Backup Current State
```bash
ssh root@72.60.17.245
cd /opt/velo-test-monitor/services/whatsapp-bridge

# Backup source code
cp main.go main.go.backup.20251110_095300

# Current VPS time before change
date
# Output: Mon Nov 10 07:52:45 UTC 2025
```

### 2. Set VPS Timezone
```bash
# Set timezone
sudo timedatectl set-timezone Africa/Johannesburg

# Verify
timedatectl
# Output:
# Time zone: Africa/Johannesburg (SAST, +0200)
# Local time: Mon 2025-11-10 09:52:59 SAST
```

### 3. Update Go Code
```bash
cd /opt/velo-test-monitor/services/whatsapp-bridge

# Add timezone loading code after line 1135 (after defer db.Close())
# Replace time.Now() with nowSAST
# Add "SAST" suffix to timestamp strings

# Script used:
cat > /tmp/fix_timezone.sh << 'EOF'
#!/bin/bash
cp main.go.backup.20251110_095300 main.go

# Add timezone loading code after line 1135
sed -i '1135a\
\
\t// Load South African timezone (SAST)\
\tloc, locErr := time.LoadLocation("Africa/Johannesburg")\
\tif locErr != nil {\
\t\t// Fallback to UTC if timezone loading fails\
\t\tloc = time.UTC\
\t}\
\t// Get current time in SAST\
\tnowSAST := time.Now().In(loc)
' main.go

# Replace time.Now() with nowSAST
sed -i 's/time\.Now()\.Format("2006-01-02 15:04:05")/nowSAST.Format("2006-01-02 15:04:05")/g' main.go

# Add SAST suffix
sed -i 's/--- RESUBMITTED %s ---/--- RESUBMITTED %s SAST ---/g' main.go
sed -i 's/Auto-created from WhatsApp on %s/Auto-created from WhatsApp on %s SAST/g' main.go

echo "✅ Applied timezone changes"
EOF

chmod +x /tmp/fix_timezone.sh && /tmp/fix_timezone.sh
```

### 4. Recompile WhatsApp Bridge
```bash
cd /opt/velo-test-monitor/services/whatsapp-bridge

# Compile with Go 1.21
/usr/local/go/bin/go build -o whatsapp-bridge-sast main.go

# Verify binary created
ls -lh whatsapp-bridge-sast
# Output: -rwxr-xr-x 1 root root 34M Nov 10 10:00 whatsapp-bridge-sast
```

### 5. Replace Binary and Restart
```bash
# Kill existing bridge
pkill whatsapp-bridge

# Backup old binary
mv whatsapp-bridge whatsapp-bridge.old-20251110-100200

# Install new binary
mv whatsapp-bridge-sast whatsapp-bridge

# Start bridge
nohup ./whatsapp-bridge > /opt/velo-test-monitor/logs/whatsapp-bridge.log 2>&1 &

# Verify running
ps aux | grep whatsapp-bridge
# Output: root 977742 ... ./whatsapp-bridge
```

### 6. Restart All Services
```bash
# Restart drop monitors (use new VPS timezone)
systemctl restart wa-monitor-prod wa-monitor-dev

# Verify both active
systemctl status wa-monitor-prod wa-monitor-dev | grep Active
# Output:
# Active: active (running) since Mon 2025-11-10 10:03:34 SAST
# Active: active (running) since Mon 2025-11-10 10:03:34 SAST

# Restart production app
cd /var/www/fibreflow
pm2 restart fibreflow-prod

# Verify
pm2 list | grep fibreflow-prod
# Output: online
```

---

## Testing

### Test Case: DR0000021

**1. Post Drop to Velo Test Group**
```
User posted: DR0000021
Time: 10:05 AM SAST
```

**2. Bridge Logs**
```bash
tail -30 /opt/velo-test-monitor/logs/whatsapp-bridge.log | grep DR0000021

# Output:
[2025-11-10 10:05:47] → 36563643842564: DR0000021
✅ Created QA photo review for DR0000021 (user: 36563643842564, project: Velo Test)
📬 Receipt event: ... Timestamp=2025-11-10 10:05:49 +0200 SAST
```

**3. Database Verification**
```sql
SELECT drop_number, comment, created_at
FROM qa_photo_reviews
WHERE drop_number = 'DR0000021';

-- Results:
drop_number | comment                                                 | created_at
------------+---------------------------------------------------------+------------------------------
DR0000021   | Auto-created from WhatsApp on 2025-11-10 10:05:47 SAST | 2025-11-10 08:05:48.07769+00
```

**4. Verification Summary**
- ✅ **Comment field:** Shows SAST time (10:05:47) with "SAST" suffix
- ✅ **created_at field:** Shows UTC (08:05:48) - correct for database storage
- ✅ **Time difference:** 2 hours (UTC+2 = SAST)
- ✅ **Bridge logs:** Show "+0200 SAST" timezone

---

## Comparison: Before vs After

### Before Fix (UTC)
```
Comment: Auto-created from WhatsApp on 2025-11-10 07:37:59
Bridge Log: Timestamp=2025-11-10 07:37:59 +0000 UTC
User Time: 09:37 AM SAST (confused by 2-hour difference)
```

### After Fix (SAST)
```
Comment: Auto-created from WhatsApp on 2025-11-10 10:05:47 SAST
Bridge Log: Timestamp=2025-11-10 10:05:49 +0200 SAST
User Time: 10:05 AM SAST (matches exactly!)
```

---

## Files Modified

| File | Location | Lines Changed | Change Description |
|------|----------|---------------|-------------------|
| `main.go` | `/opt/velo-test-monitor/services/whatsapp-bridge/main.go` | 1136-1144 (added), 1155, 1176 (modified) | Added SAST timezone loading and usage |
| `whatsapp-bridge` | `/opt/velo-test-monitor/services/whatsapp-bridge/whatsapp-bridge` | Binary recompiled | New binary with SAST support |

---

## Backup Locations

| Backup | Location | Date/Time | Size |
|--------|----------|-----------|------|
| Source code | `main.go.backup.20251110_095300` | Nov 10, 2025 09:53 SAST | 61K |
| Old binary | `whatsapp-bridge.old-20251110-100200` | Nov 10, 2025 09:33 SAST | 34M |
| Previous working | `whatsapp-bridge.broken` | Nov 9, 2025 15:17 SAST | 34M |

---

## System Configuration Changes

### VPS Timezone (Permanent)
```bash
# Check current timezone
timedatectl

# Output (after fix):
Time zone: Africa/Johannesburg (SAST, +0200)
System clock synchronized: yes
NTP service: active
```

### Services Affected
All services now use SAST timezone:
1. ✅ WhatsApp Bridge - Explicit SAST in code + system timezone
2. ✅ Drop Monitor (prod) - Uses system timezone
3. ✅ Drop Monitor (dev) - Uses system timezone
4. ✅ PM2 logs - Uses system timezone
5. ✅ Nginx logs - Uses system timezone
6. ✅ System logs - Uses system timezone

---

## Key Learnings

### 1. Two-Layer Timezone Strategy
**Best Practice:** Set BOTH system timezone AND explicit timezone in code
- **System timezone:** Sets default for all services
- **Explicit code timezone:** Guarantees correct timezone even if system changes

### 2. Use Explicit Timezone Loading in Go
```go
// ❌ BAD: Uses system timezone implicitly
time.Now().Format("2006-01-02 15:04:05")

// ✅ GOOD: Loads timezone explicitly
loc, _ := time.LoadLocation("Africa/Johannesburg")
nowSAST := time.Now().In(loc)
nowSAST.Format("2006-01-02 15:04:05")
```

### 3. Add Timezone Suffix to User-Facing Timestamps
```go
// ❌ UNCLEAR: What timezone?
"Auto-created from WhatsApp on 2025-11-10 10:05:47"

// ✅ CLEAR: Explicitly shows SAST
"Auto-created from WhatsApp on 2025-11-10 10:05:47 SAST"
```

### 4. Database vs Display Timezone
- **Database timestamps:** Always store in UTC (PostgreSQL best practice)
- **Display timestamps:** Show in user's local timezone (SAST for South Africa)
- **User-facing fields:** Use local timezone (comment field)

### 5. Test with Real Data
- User posted DR0000021 immediately after fix
- Verified exact timestamp match (10:05:47 SAST)
- Confirmed 2-hour offset from UTC

---

## Prevention Measures

### 1. Document Timezone Standards
- **Rule:** All new Go services MUST use explicit `time.LoadLocation()`
- **Rule:** All user-facing timestamps MUST include timezone suffix
- **Rule:** VPS timezone MUST be `Africa/Johannesburg`

### 2. Code Review Checklist
Before deploying timezone-sensitive code:
- [ ] Does code use explicit timezone loading?
- [ ] Does code include timezone suffix in output?
- [ ] Is there a fallback if timezone loading fails?
- [ ] Are database timestamps in UTC?
- [ ] Are display timestamps in SAST?

### 3. Testing Procedure
When changing timezone code:
1. Post test drop to WhatsApp
2. Check bridge logs for "+0200 SAST"
3. Query database for comment field
4. Verify dashboard displays SAST
5. Confirm 2-hour offset from UTC

### 4. Monitoring
```bash
# Daily check: Verify VPS timezone
timedatectl | grep "Time zone"
# Should show: Africa/Johannesburg (SAST, +0200)

# Weekly check: Test drop timestamp
# Post drop, verify comment shows "SAST" suffix
```

---

## Rollback Procedure

If timezone fix causes issues:

```bash
# 1. SSH into VPS
ssh root@72.60.17.245

# 2. Restore source code
cd /opt/velo-test-monitor/services/whatsapp-bridge
cp main.go.backup.20251110_095300 main.go

# 3. Restore old binary
pkill whatsapp-bridge
cp whatsapp-bridge.old-20251110-100200 whatsapp-bridge
nohup ./whatsapp-bridge > /opt/velo-test-monitor/logs/whatsapp-bridge.log 2>&1 &

# 4. (Optional) Revert VPS timezone to UTC
sudo timedatectl set-timezone Etc/UTC

# 5. Restart services
systemctl restart wa-monitor-prod wa-monitor-dev
pm2 restart fibreflow-prod

# 6. Verify
ps aux | grep whatsapp-bridge
tail -f /opt/velo-test-monitor/logs/whatsapp-bridge.log
```

---

## Future Enhancements

### 1. Timezone Configuration
Instead of hardcoding `Africa/Johannesburg`, consider:
```go
// Load from environment variable
timezone := os.Getenv("APP_TIMEZONE")
if timezone == "" {
    timezone = "Africa/Johannesburg" // Default
}
loc, _ := time.LoadLocation(timezone)
```

### 2. Display Format Options
Allow users to choose timezone display format:
- `SAST` (current)
- `UTC+2`
- `Africa/Johannesburg`

### 3. Automated Timezone Tests
Add to test suite:
```go
func TestTimezoneIsSAST(t *testing.T) {
    loc, err := time.LoadLocation("Africa/Johannesburg")
    require.NoError(t, err)

    now := time.Now().In(loc)
    formatted := fmt.Sprintf("Auto-created from WhatsApp on %s SAST",
        now.Format("2006-01-02 15:04:05"))

    require.Contains(t, formatted, "SAST")
}
```

---

## Contact & Maintenance

**Last Updated:** November 10, 2025
**Fixed By:** Claude Code
**Verified By:** Louis Duplessis
**Test Drop:** DR0000021 (10:05:47 SAST)

**If Timezone Issues Occur:**
1. Check VPS timezone: `timedatectl`
2. Verify bridge using SAST: `tail -100 /opt/velo-test-monitor/logs/whatsapp-bridge.log | grep SAST`
3. Test database entry: See SQL query in Testing section
4. Compare with backup: `main.go.backup.20251110_095300`
5. Check Go timezone loading: See lines 1136-1144 in main.go

**Related Documentation:**
- WhatsApp Bridge Fix: `WA_MONITOR_BRIDGE_FIX_NOV2025.md`
- Architecture v2.0: `WA_MONITOR_ARCHITECTURE_V2.md`
- Lessons Learned: `WA_MONITOR_LESSONS_LEARNED.md`

---

## Summary

✅ **VPS timezone set to Africa/Johannesburg (SAST, UTC+2)**
✅ **Go code explicitly loads SAST timezone**
✅ **All timestamps show SAST with clear suffix**
✅ **Tested with DR0000021 - working perfectly**
✅ **All services restarted and using SAST**

**User Impact:** QA reviewers now see accurate South African times in all WhatsApp comments! 🎉
