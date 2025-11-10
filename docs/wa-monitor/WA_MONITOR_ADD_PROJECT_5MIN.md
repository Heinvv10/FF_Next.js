# How to Add a New WhatsApp Project to WA Monitor (5 Minutes)
**Version:** 2.0 - Refactored Architecture
**Last Updated:** November 9, 2025

## Overview
After the refactoring, adding a new WhatsApp group to the monitor is a **5-minute process** involving:
1. Edit YAML config file (2 min)
2. Restart service (1 min)
3. Verify it's working (2 min)

**Total Time: 5 minutes** (down from 4 hours!)

## Prerequisites
- WhatsApp group JID (e.g., `120363408849234743@g.us`)
- SSH access to VPS: `ssh root@72.60.17.245`
- Group name and description

## Finding the Group JID

If you don't have the group JID, post a test message to the group and check the WhatsApp bridge logs:

```bash
ssh root@72.60.17.245
tail -100 /opt/velo-test-monitor/logs/whatsapp-bridge.log | grep "Chat="
```

Look for lines like: `Chat=120363408849234743@g.us`

## Step 1: Edit Config File (2 minutes)

### Option A: Test in Dev First (Recommended)
```bash
ssh root@72.60.17.245
nano /opt/wa-monitor/dev/config/projects.yaml
```

Add your new project:
```yaml
projects:
  - name: Velo Test
    enabled: true
    group_jid: "120363421664266245@g.us"
    description: "Velo Test group"

  - name: NewProject  # ADD YOUR PROJECT HERE
    enabled: true
    group_jid: "XXXXXXXXXX@g.us"
    description: "NewProject description"
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### Option B: Add Directly to Production
```bash
ssh root@72.60.17.245
nano /opt/wa-monitor/prod/config/projects.yaml
```

Add your project following the same format as above.

## Step 2: Restart Service (1 minute)

### If you edited Dev:
```bash
systemctl restart wa-monitor-dev
systemctl status wa-monitor-dev
```

### If you edited Production:
```bash
systemctl restart wa-monitor-prod
systemctl status wa-monitor-prod
```

Look for: `Active: active (running)`

## Step 3: Verify Monitoring (2 minutes)

### Check Logs
```bash
# For dev
tail -30 /opt/wa-monitor/dev/logs/wa-monitor-dev.log

# For production
tail -30 /opt/wa-monitor/prod/logs/wa-monitor-prod.log
```

You should see:
```
2025-11-09 19:08:54,620 - INFO - 🎯 MONITORING 5 PROJECTS:
...
2025-11-09 19:08:54,623 - INFO -    • NewProject: XXXXXXXXXX@g.us
2025-11-09 19:08:54,623 - INFO - ✅ Drop monitor started (scan interval: 15s)
```

### Test with Real Drop
1. Post a test drop number to the WhatsApp group (e.g., `DR99999999`)
2. Wait 15 seconds (scan interval)
3. Check logs again:

```bash
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log
```

You should see:
```
2025-11-09 19:15:30,445 - INFO - 📱 Found drop: DR99999999 in NewProject
2025-11-09 19:15:30,745 - INFO - ✅ Created QA review for DR99999999
```

### Verify in Dashboard
Visit: https://app.fibreflow.app/wa-monitor

Your new drop should appear in the list.

## Step 4: Promote Dev to Production (If Testing in Dev)

Once verified in dev, copy the config to production:

```bash
# Copy the new project entry from dev to prod config
nano /opt/wa-monitor/prod/config/projects.yaml
# Add the same project entry

# Restart production
systemctl restart wa-monitor-prod
```

## Done! ✅

Your new project is now being monitored.

---

## Common Issues

### Issue: "Config file not found"
**Solution:** Check the path and ensure the file exists:
```bash
ls -l /opt/wa-monitor/prod/config/projects.yaml
```

### Issue: "Invalid group_jid format"
**Solution:** Ensure the group JID ends with `@g.us`:
```yaml
group_jid: "120363408849234743@g.us"  # ✅ Correct
group_jid: "120363408849234743"        # ❌ Wrong
```

### Issue: Service won't start
**Solution:** Check syntax with YAML validator:
```bash
python3 -c "import yaml; yaml.safe_load(open('/opt/wa-monitor/prod/config/projects.yaml'))"
```

If it shows errors, fix the YAML syntax (usually indentation or missing quotes).

### Issue: Not detecting drops
**Solution:**
1. Check WhatsApp bridge is running:
   ```bash
   ps aux | grep whatsapp-bridge
   ```
2. Verify SQLite database exists:
   ```bash
   ls -lh /opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db
   ```
3. Check the group JID is correct by posting a message and checking logs

---

## What Changed from v1.0 (Old System)

### Before (4 hours):
1. Edit Python script `realtime_drop_monitor.py` (line 43)
2. Edit database URL in script (line 70)
3. Edit SQLite path (line 71)
4. Edit resubmission handler Python (line 20)
5. Edit systemd service environment
6. Test Python syntax
7. Restart service
8. Debug errors for 3.5 hours
9. Update 3 more files

### After (5 minutes):
1. Edit `projects.yaml`
2. Restart service
3. Done!

---

## Architecture Changes

The new system uses:
- **Config-driven:** All projects defined in YAML (no code changes)
- **Modular:** Separate modules for config, database, monitoring
- **Env separation:** Separate prod/dev services for safe testing
- **Centralized:** All config in one place
- **Validated:** Automatic validation of config on startup

This is the power of refactoring! 🚀
