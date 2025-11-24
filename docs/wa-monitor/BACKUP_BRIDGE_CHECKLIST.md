# WhatsApp Backup Bridge - Implementation Checklist

**Target Phone:** 082 418 9511
**VPS:** 72.60.17.245
**Estimated Time:** 2-3 hours

---

## Pre-Implementation (Do First)

- [ ] **Backup current system**
  ```bash
  ssh root@72.60.17.245
  cp -r /opt/velo-test-monitor/services/whatsapp-bridge /opt/velo-test-monitor/services/whatsapp-bridge.backup.$(date +%Y%m%d)
  ```

- [ ] **Verify phone 082 418 9511 is ready**
  - [ ] Phone is charged and accessible
  - [ ] WhatsApp is installed and updated
  - [ ] Can scan QR codes
  - [ ] Has stable internet connection

- [ ] **Document current state**
  ```bash
  ssh root@72.60.17.245
  systemctl status whatsapp-bridge > /tmp/pre-backup-status.txt
  ps aux | grep whatsapp >> /tmp/pre-backup-status.txt
  ```

---

## Phase 1: Install Backup Bridge (45 minutes)

### 1.1 Create Directory Structure
```bash
ssh root@72.60.17.245

# Create backup bridge directory
mkdir -p /opt/velo-test-monitor/services/whatsapp-bridge-backup/store
cd /opt/velo-test-monitor/services/whatsapp-bridge-backup

# Copy binary from primary
cp /opt/velo-test-monitor/services/whatsapp-bridge/whatsapp-bridge ./
chmod +x whatsapp-bridge
```
- [ ] Directory created
- [ ] Binary copied and executable

### 1.2 Create Configuration
```bash
# Create config (if primary uses one)
cat > config.yaml <<'EOF'
phone_number: "+27824189511"
db_path: "./store/messages-backup.db"
whatsapp_db_path: "./store/whatsapp-backup.db"
log_path: "/opt/velo-test-monitor/logs/whatsapp-bridge-backup.log"
EOF
```
- [ ] Config file created

### 1.3 Create Systemd Service
```bash
cat > /etc/systemd/system/whatsapp-bridge-backup.service <<'EOF'
[Unit]
Description=WhatsApp Bridge Backup (082 418 9511)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/velo-test-monitor/services/whatsapp-bridge-backup
ExecStart=/opt/velo-test-monitor/services/whatsapp-bridge-backup/whatsapp-bridge
Restart=always
RestartSec=10
Environment="WHATSAPP_PHONE=+27824189511"
Environment="DB_PATH=/opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db"
StandardOutput=append:/opt/velo-test-monitor/logs/whatsapp-bridge-backup.log
StandardError=append:/opt/velo-test-monitor/logs/whatsapp-bridge-backup-error.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
```
- [ ] Service file created
- [ ] Systemd reloaded

### 1.4 Initial Pairing (QR Code)
```bash
# Run manually to get QR code
cd /opt/velo-test-monitor/services/whatsapp-bridge-backup
./whatsapp-bridge
```

**ACTION REQUIRED:**
- [ ] QR code displayed in terminal
- [ ] Scanned QR with phone 082 418 9511 (WhatsApp > Linked Devices)
- [ ] Saw "Successfully authenticated" message
- [ ] Pressed Ctrl+C to stop

### 1.5 Start as Service
```bash
systemctl start whatsapp-bridge-backup
systemctl status whatsapp-bridge-backup
```
- [ ] Service started successfully
- [ ] Status shows "active (running)"

### 1.6 Verify Logs
```bash
tail -50 /opt/velo-test-monitor/logs/whatsapp-bridge-backup.log
```
- [ ] Logs show successful connection
- [ ] No error messages

---

## Phase 2: Add to WhatsApp Groups (30 minutes)

**Manual step - Use WhatsApp app:**

- [ ] **Lawley Activation 3** (120363418298130331@g.us)
  - Add 082 418 9511 to group
  - Send test message
  - Verify in backup bridge logs

- [ ] **Mohadin Activations** (120363421532174586@g.us)
  - Add 082 418 9511 to group
  - Send test message
  - Verify in backup bridge logs

- [ ] **Velo Test** (120363421664266245@g.us)
  - Add 082 418 9511 to group
  - Send test message
  - Verify in backup bridge logs

- [ ] **Mamelodi POP1 Activations** (120363408849234743@g.us)
  - Add 082 418 9511 to group
  - Send test message
  - Verify in backup bridge logs

### Verification Command
```bash
# Check backup bridge is receiving messages from all groups
tail -100 /opt/velo-test-monitor/logs/whatsapp-bridge-backup.log | grep "Chat="
```
- [ ] All 4 group JIDs appear in logs

---

## Phase 3: Install Health Monitor (30 minutes)

### 3.1 Create Health Monitor Script
```bash
# Copy script from BACKUP_BRIDGE_PLAN.md (Section: Failover Strategy > External Health Monitor Script)
nano /opt/velo-test-monitor/scripts/bridge-health-monitor.py
# Paste the Python script
chmod +x /opt/velo-test-monitor/scripts/bridge-health-monitor.py
```
- [ ] Script created and executable

### 3.2 Create Active Bridge Config
```bash
mkdir -p /opt/velo-test-monitor/config
echo "primary" > /opt/velo-test-monitor/config/active-bridge.txt
```
- [ ] Config directory created
- [ ] Active bridge file created (set to "primary")

### 3.3 Create Health Monitor Service
```bash
cat > /etc/systemd/system/bridge-health-monitor.service <<'EOF'
[Unit]
Description=WhatsApp Bridge Health Monitor
After=network.target whatsapp-bridge.service whatsapp-bridge-backup.service

[Service]
Type=simple
User=root
ExecStart=/usr/bin/python3 /opt/velo-test-monitor/scripts/bridge-health-monitor.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable bridge-health-monitor
systemctl start bridge-health-monitor
```
- [ ] Service created
- [ ] Service enabled (auto-start on boot)
- [ ] Service started

### 3.4 Verify Health Monitor
```bash
systemctl status bridge-health-monitor
tail -50 /opt/velo-test-monitor/logs/bridge-health-monitor.log
```
- [ ] Service running
- [ ] Logs show health checks executing
- [ ] No errors

---

## Phase 4: Update Drop Monitors (30 minutes)

### 4.1 Backup Current Monitor Code
```bash
cp /opt/wa-monitor/prod/modules/database.py /opt/wa-monitor/prod/modules/database.py.backup.$(date +%Y%m%d)
```
- [ ] Production code backed up

### 4.2 Add Bridge Selection Logic
Edit `/opt/wa-monitor/prod/modules/database.py`:

```python
def get_active_bridge_db():
    """Read which bridge is currently active"""
    try:
        with open('/opt/velo-test-monitor/config/active-bridge.txt', 'r') as f:
            bridge = f.read().strip()

        if bridge == "primary":
            return "/opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db"
        elif bridge == "backup":
            return "/opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db"
        else:
            return "/opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db"
    except FileNotFoundError:
        return "/opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db"
```

Update monitor to use this function:
```python
# In monitor.py, replace hardcoded database path with:
MESSAGES_DB_PATH = get_active_bridge_db()
```

- [ ] Code updated in production
- [ ] Code updated in development

### 4.3 Test in Development First
```bash
# Restart dev monitor
systemctl restart wa-monitor-dev

# Watch logs
tail -f /opt/wa-monitor/dev/logs/wa-monitor-dev.log
```
- [ ] Dev monitor restarted successfully
- [ ] Logs show it's using primary bridge
- [ ] No errors

### 4.4 Deploy to Production
```bash
# Use safe restart script (clears Python cache)
/opt/wa-monitor/prod/restart-monitor.sh

# Watch logs
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log
```
- [ ] Production monitor restarted
- [ ] Logs show correct bridge usage
- [ ] Dashboard still updating: https://app.fibreflow.app/wa-monitor

---

## Phase 5: Testing (30 minutes)

### 5.1 Verify Normal Operation
```bash
# Check all services
systemctl status whatsapp-bridge whatsapp-bridge-backup bridge-health-monitor wa-monitor-prod wa-monitor-dev
```
- [ ] All services "active (running)"

### 5.2 Post Test Message
- [ ] Post test drop to Velo Test group
- [ ] Verify appears in dashboard within 30 seconds
- [ ] Check both databases have the message:
  ```bash
  # Primary
  sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db \
    "SELECT COUNT(*) FROM messages WHERE timestamp > strftime('%s', 'now', '-5 minutes');"

  # Backup
  sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db \
    "SELECT COUNT(*) FROM messages WHERE timestamp > strftime('%s', 'now', '-5 minutes');"
  ```
- [ ] Both databases show the test message

### 5.3 Test Failover (CRITICAL TEST)
```bash
# Stop primary bridge
systemctl stop whatsapp-bridge

# Watch health monitor (should detect failure within 2 minutes)
tail -f /opt/velo-test-monitor/logs/bridge-health-monitor.log
# Look for: "FAILOVER: Switching from PRIMARY to BACKUP bridge"

# Check active bridge file
cat /opt/velo-test-monitor/config/active-bridge.txt
# Should show: "backup"

# Post another test message to Velo Test
# Verify it still appears in dashboard
```
- [ ] Health monitor detected primary failure
- [ ] Automatically switched to backup
- [ ] Dashboard continues updating
- [ ] Test message processed successfully

### 5.4 Test Recovery
```bash
# Start primary bridge again
systemctl start whatsapp-bridge
systemctl status whatsapp-bridge

# Manual switchback (verify primary is healthy first)
echo "primary" > /opt/velo-test-monitor/config/active-bridge.txt

# Restart monitors to pick up change
/opt/wa-monitor/prod/restart-monitor.sh
systemctl restart wa-monitor-dev

# Post test message
# Verify dashboard updates
```
- [ ] Primary bridge restarted
- [ ] Manually switched back to primary
- [ ] Monitors using primary again
- [ ] Dashboard updating correctly

---

## Phase 6: Monitoring Setup (30 minutes)

### 6.1 Create Daily Health Check Script
```bash
cat > /opt/velo-test-monitor/scripts/daily-bridge-check.sh <<'EOF'
#!/bin/bash
# Daily health check for WhatsApp bridges

echo "=== WhatsApp Bridge Health Check - $(date) ==="

echo -e "\n1. Service Status:"
systemctl is-active whatsapp-bridge whatsapp-bridge-backup bridge-health-monitor

echo -e "\n2. Active Bridge:"
cat /opt/velo-test-monitor/config/active-bridge.txt

echo -e "\n3. Messages in last hour (Primary):"
sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db \
  "SELECT COUNT(*) FROM messages WHERE timestamp > strftime('%s', 'now', '-1 hour');"

echo -e "\n4. Messages in last hour (Backup):"
sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db \
  "SELECT COUNT(*) FROM messages WHERE timestamp > strftime('%s', 'now', '-1 hour');"

echo -e "\n5. Recent Failover Events:"
grep "FAILOVER" /opt/velo-test-monitor/logs/bridge-health-monitor.log | tail -5

echo -e "\n=== End Health Check ==="
EOF

chmod +x /opt/velo-test-monitor/scripts/daily-bridge-check.sh
```
- [ ] Health check script created

### 6.2 Test Health Check
```bash
/opt/velo-test-monitor/scripts/daily-bridge-check.sh
```
- [ ] Script runs without errors
- [ ] Output shows system status

### 6.3 Schedule Daily Cron Job
```bash
# Add to crontab
crontab -e

# Add line:
0 8 * * * /opt/velo-test-monitor/scripts/daily-bridge-check.sh | mail -s "WhatsApp Bridge Health Report" admin@velocityfibre.co.za
```
- [ ] Cron job added (runs daily at 8am)

---

## Post-Implementation (Do After)

### Documentation Updates
- [ ] Update CLAUDE.md with backup bridge info
- [ ] Add backup bridge to monitored systems list
- [ ] Document failover procedures in runbook

### Monitoring Dashboard
- [ ] Add backup bridge status to monitoring dashboard
- [ ] Set up alerts for failover events
- [ ] Create Grafana dashboard (if applicable)

### Team Training
- [ ] Train team on failover procedures
- [ ] Document manual switchover process
- [ ] Create emergency contact list

---

## Success Criteria

- [ ] ✅ Both bridges running and receiving messages
- [ ] ✅ Health monitor active and logging
- [ ] ✅ Automatic failover tested and working
- [ ] ✅ Dashboard continues updating during failover
- [ ] ✅ No duplicate entries in database
- [ ] ✅ Manual switchback tested and working
- [ ] ✅ Daily health checks scheduled
- [ ] ✅ Team trained on new system

---

## Rollback Plan (If Something Goes Wrong)

```bash
# EMERGENCY: Disable backup bridge and revert to primary only

# 1. Stop backup bridge and health monitor
systemctl stop whatsapp-bridge-backup bridge-health-monitor
systemctl disable whatsapp-bridge-backup bridge-health-monitor

# 2. Ensure primary is active
echo "primary" > /opt/velo-test-monitor/config/active-bridge.txt

# 3. Restore original monitor code
cp /opt/wa-monitor/prod/modules/database.py.backup.YYYYMMDD \
   /opt/wa-monitor/prod/modules/database.py

# 4. Restart monitors
/opt/wa-monitor/prod/restart-monitor.sh
systemctl restart wa-monitor-dev

# 5. Verify dashboard is working
curl https://app.fibreflow.app/api/wa-monitor-daily-drops | jq .
```

---

## Troubleshooting

### Backup bridge not receiving messages
```bash
# Check service
systemctl status whatsapp-bridge-backup

# Check logs
tail -100 /opt/velo-test-monitor/logs/whatsapp-bridge-backup.log

# Verify phone is linked
# Open WhatsApp on 082 418 9511 > Linked Devices
# Should see "WhatsApp Bridge Backup"

# Re-pair if needed
systemctl stop whatsapp-bridge-backup
cd /opt/velo-test-monitor/services/whatsapp-bridge-backup
./whatsapp-bridge
# Scan QR code
# Ctrl+C after success
systemctl start whatsapp-bridge-backup
```

### Failover not triggering
```bash
# Check health monitor
systemctl status bridge-health-monitor

# Check logs
tail -100 /opt/velo-test-monitor/logs/bridge-health-monitor.log

# Verify timeout settings
grep "PRIMARY_TIMEOUT" /opt/velo-test-monitor/scripts/bridge-health-monitor.py

# Manual failover
echo "backup" > /opt/velo-test-monitor/config/active-bridge.txt
/opt/wa-monitor/prod/restart-monitor.sh
systemctl restart wa-monitor-dev
```

### Dashboard not updating after failover
```bash
# Check monitors are using correct bridge
tail -50 /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep -i bridge

# Check active bridge file
cat /opt/velo-test-monitor/config/active-bridge.txt

# Restart monitors
/opt/wa-monitor/prod/restart-monitor.sh
systemctl restart wa-monitor-dev

# Test API endpoint
curl https://app.fibreflow.app/api/wa-monitor-daily-drops | jq .
```

---

**Checklist Version:** 1.0
**Date Created:** November 24, 2025
**Estimated Total Time:** 2-3 hours
**Complexity:** Medium
**Risk Level:** Low (can rollback quickly)
