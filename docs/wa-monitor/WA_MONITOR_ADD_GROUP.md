# How to Add a New WhatsApp Group to WA Monitor

**Date Created:** 2025-11-09
**Last Updated:** 2025-11-09

## Quick Reference

Adding a new WhatsApp group to the drop monitor is a 5-step process that takes ~5 minutes.

---

## Prerequisites

- ✅ WhatsApp bridge number (064 041 2391) must be a member of the new group
- ✅ SSH access to VPS: `ssh root@72.60.17.245`
- ✅ Group must have posted at least one message (to generate JID)

---

## Step-by-Step Guide

### Step 1: Find the Group JID (WhatsApp Group ID)

The Group JID is the unique identifier for the WhatsApp group (format: `XXXXXXXXXX@g.us`).

**Method 1: Check WhatsApp Bridge Logs (Easiest)**

```bash
# SSH into VPS
ssh root@72.60.17.245

# Post "TEST" or any message to the new group from your phone

# Check logs for the group JID
tail -50 /opt/velo-test-monitor/logs/whatsapp-bridge.log | grep "Chat="

# Look for output like:
# Chat=120363408849234743@g.us
# This is your Group JID ^^^
```

**Method 2: Search by Recent Activity**

```bash
# If you know approximately when a message was posted:
tail -200 /opt/velo-test-monitor/logs/whatsapp-bridge.log | grep "EVENT RECEIVED"
```

**Save the Group JID** - You'll need it for Step 2.

---

### Step 2: Edit Drop Monitor Configuration

```bash
# Open the Python script
nano /opt/velo-test-monitor/services/realtime_drop_monitor.py

# Find the PROJECTS dictionary (around line 43-60)
# Press Ctrl+W to search for: PROJECTS = {
```

**Add your new group** to the PROJECTS dictionary:

```python
PROJECTS = {
    'Lawley': {
        'group_jid': '120363418298130331@g.us',
        'project_name': 'Lawley',
        'group_description': 'Lawley Activation 3 group'
    },
    'Mohadin': {
        'group_jid': '120363421532174586@g.us',
        'project_name': 'Mohadin',
        'group_description': 'Mohadin Activations group'
    },
    'Velo Test': {
        'group_jid': '120363421664266245@g.us',
        'project_name': 'Velo Test',
        'group_description': 'Velo Test group'
    },
    'Mamelodi': {
        'group_jid': '120363408849234743@g.us',
        'project_name': 'Mamelodi',
        'group_description': 'Mamelodi POP1 Activations group'
    },
    'YourNewGroup': {  # <-- ADD NEW GROUP HERE
        'group_jid': 'YOUR_GROUP_JID_HERE@g.us',  # From Step 1
        'project_name': 'YourNewGroup',  # Short name for database
        'group_description': 'Descriptive name for logs'
    }
}
```

**Important:**
- `'group_jid'`: The JID from Step 1 (must end with `@g.us`)
- `'project_name'`: Short name (no spaces) - used in database `project` column
- `'group_description'`: Human-readable name for logs

**Save and exit:**
- Press `Ctrl+O` to save
- Press `Enter` to confirm
- Press `Ctrl+X` to exit

---

### Step 3: Test Script Syntax

**Before restarting, verify the script has no syntax errors:**

```bash
python3 -m py_compile /opt/velo-test-monitor/services/realtime_drop_monitor.py
```

**Expected output:**
- ✅ No output = Success!
- ❌ "SyntaxError" = Fix the error and try again

**Common errors:**
- Missing comma after previous group entry
- Missing quote marks
- Typo in `group_jid`, `project_name`, or `group_description`

---

### Step 4: Restart Drop Monitor Service

```bash
# Restart the service
systemctl restart drop-monitor

# Wait 3 seconds
sleep 3

# Check status
systemctl status drop-monitor

# Should show:
# Active: active (running)
```

**If status shows "failed":**
```bash
# Check error logs
tail -50 /opt/velo-test-monitor/logs/drop_monitor.log

# Fix the error and repeat Step 3-4
```

---

### Step 5: Verify New Group is Monitored

```bash
# Check logs for confirmation
tail -30 /opt/velo-test-monitor/logs/drop_monitor.log
```

**Look for your new group in the startup logs:**

```
🎯 MONITORING ALL CONFIGURED PROJECTS:
   • Lawley: 120363418298130331@g.us (Lawley Activation 3 group)
   • Velo Test: 120363421664266245@g.us (Velo Test group)
   • Mohadin: 120363421532174586@g.us (Mohadin Activations group)
   • Mamelodi: 120363408849234743@g.us (Mamelodi POP1 Activations group)
   • YourNewGroup: XXXXXXXXXX@g.us (Your group description)  <-- NEW
```

✅ If you see your group listed, it's working!

---

### Step 6: Test with a Drop Number

**Post a test drop to the new group:**

1. Open WhatsApp
2. Go to your new group
3. Post: `DR99999999`
4. Wait 15 seconds (drop monitor scan interval)

**Check if it was detected:**

```bash
# Check drop monitor logs
tail -50 /opt/velo-test-monitor/logs/drop_monitor.log | grep "DR99999999"

# Expected output:
# 📱 Found 1 new messages since...
# 🎯 Found 1 drop numbers in new messages:
#    • DR99999999 - 2025-11-09 XX:XX:XX - XXXXXXX
```

**Check dashboard API:**

```bash
curl https://app.fibreflow.app/api/wa-monitor-daily-drops | jq .
```

**Expected:** Your new group should appear in the drops list.

---

## Update Documentation

After successfully adding the group, update these files:

### 1. CLAUDE.md

```bash
# Add to "Monitored Groups" section (around line 514)
- **YourGroupName**: XXXXXXXXXX@g.us (Group Description)
```

### 2. This File (Optional)

Add your group to the example in Step 2 for future reference.

### 3. CHANGELOG.md

Document what you added:

```markdown
## 2025-XX-XX - [UPDATE]: Added [GroupName] to WA Monitor

### What Was Done
Added new WhatsApp group to drop monitor.

**Group Details:**
- Name: GroupName
- JID: XXXXXXXXXX@g.us
- Description: ...

### Files Changed
- /opt/velo-test-monitor/services/realtime_drop_monitor.py (VPS)
- CLAUDE.md - Updated monitored groups list
```

---

## Troubleshooting

### Issue: Can't Find Group JID

**Solution:**
```bash
# List ALL groups the bridge can see
sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db \
  "SELECT DISTINCT chat_jid FROM messages WHERE chat_jid LIKE '%@g.us' ORDER BY rowid DESC LIMIT 20;"

# Or post a unique message like "FIND_MY_GROUP_12345" to the group
# Then search logs:
tail -100 /opt/velo-test-monitor/logs/whatsapp-bridge.log | grep "FIND_MY_GROUP"
```

### Issue: Drop Monitor Won't Start After Adding Group

**Solution:**
```bash
# Check for syntax errors
python3 -m py_compile /opt/velo-test-monitor/services/realtime_drop_monitor.py

# Check logs for specific error
tail -100 /opt/velo-test-monitor/logs/drop_monitor.log

# Common fixes:
# 1. Missing comma after previous group
# 2. Invalid Python indentation (use spaces, not tabs)
# 3. Typo in dictionary key names
```

### Issue: Group Added But Drops Not Detected

**Check:**
1. WhatsApp bridge is running: `ps aux | grep whatsapp-bridge`
2. Messages are being captured: `tail -f /opt/velo-test-monitor/logs/whatsapp-bridge.log`
3. Group JID is correct (check logs when you post a message)
4. Drop monitor is scanning: `tail -f /opt/velo-test-monitor/logs/drop_monitor.log`

---

## Quick Command Reference

```bash
# Find group JID
tail -50 /opt/velo-test-monitor/logs/whatsapp-bridge.log | grep "Chat="

# Edit configuration
nano /opt/velo-test-monitor/services/realtime_drop_monitor.py

# Test syntax
python3 -m py_compile /opt/velo-test-monitor/services/realtime_drop_monitor.py

# Restart service
systemctl restart drop-monitor

# Check status
systemctl status drop-monitor

# View logs
tail -f /opt/velo-test-monitor/logs/drop_monitor.log

# Test dashboard
curl https://app.fibreflow.app/api/wa-monitor-daily-drops | jq .
```

---

## Example: Adding Mamelodi Group (2025-11-09)

**What we did:**

1. Posted message to "Mamelodi POP1 Activations" group
2. Found JID in logs: `120363408849234743@g.us`
3. Added to PROJECTS dictionary:
   ```python
   'Mamelodi': {
       'group_jid': '120363408849234743@g.us',
       'project_name': 'Mamelodi',
       'group_description': 'Mamelodi POP1 Activations group'
   }
   ```
4. Tested syntax: ✅ OK
5. Restarted service: ✅ Active
6. Tested with DR99999999: ✅ Detected
7. Updated docs: ✅ Done

**Time taken:** 5 minutes

---

## Related Documentation

- **Main Guide:** CLAUDE.md - Lines 520-611 (Adding a New WhatsApp Group)
- **Database Setup:** docs/WA_MONITOR_DATABASE_SETUP.md
- **Changelog:** docs/CHANGELOG.md - 2025-11-09 entry
