# WhatsApp Bridge Backup Plan - Dual-Bridge Architecture

**Date Created:** November 24, 2025
**Primary Bridge:** 064 041 2391 (Current)
**Backup Bridge:** 082 418 9511 (New)
**VPS Server:** 72.60.17.245 (Hostinger Lithuania)

## Table of Contents
1. [Current Architecture](#current-architecture)
2. [Dual-Bridge Architecture](#dual-bridge-architecture)
3. [Installation Steps](#installation-steps)
4. [Failover Strategy](#failover-strategy)
5. [Migration Plan](#migration-plan)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Rollback Procedures](#rollback-procedures)

---

## Current Architecture

### Primary Bridge Setup
```
Location: /opt/velo-test-monitor/services/whatsapp-bridge/
Service: whatsapp-bridge.service
Phone: 064 041 2391
Database: SQLite at /opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db
LID Map: /opt/velo-test-monitor/services/whatsapp-bridge/store/whatsapp.db
```

### Monitored Groups (4 Total)
| Project | Group JID | Description |
|---------|-----------|-------------|
| Lawley | 120363418298130331@g.us | Lawley Activation 3 |
| Mohadin | 120363421532174586@g.us | Mohadin Activations |
| Velo Test | 120363421664266245@g.us | Test group (dual-monitored prod/dev) |
| Mamelodi | 120363408849234743@g.us | Mamelodi POP1 Activations |

### Current Data Flow
```
WhatsApp Groups
    ↓
Primary Bridge (064 041 2391)
    ↓
SQLite Database (messages.db)
    ↓
Drop Monitor Services (Prod + Dev)
    ↓
Neon PostgreSQL (qa_photo_reviews)
    ↓
Dashboard (https://app.fibreflow.app/wa-monitor)
```

---

## Dual-Bridge Architecture

### Proposed Architecture
```
WhatsApp Groups (Same 4 groups, both bridges joined)
    ↓                               ↓
Primary Bridge              Backup Bridge
(064 041 2391)              (082 418 9511)
    ↓                               ↓
messages.db                 messages-backup.db
    ↓                               ↓
    └────────── Failover Logic ──────┘
                    ↓
        Drop Monitor Services (Prod + Dev)
                    ↓
        Neon PostgreSQL (qa_photo_reviews)
                    ↓
        Dashboard (https://app.fibreflow.app/wa-monitor)
```

### Design Principles
1. **Active-Passive Model**: Primary bridge handles all traffic, backup is ready but idle
2. **Automatic Failover**: Monitor detects primary failure, switches to backup within 60 seconds
3. **No Duplicate Processing**: Only one bridge is active source at a time
4. **Seamless Recovery**: When primary recovers, manual switchback after verification
5. **Shared Groups**: Both bridges join all 4 monitored groups

---

## Installation Steps

### Step 1: Setup Backup Bridge Directory
```bash
# SSH into VPS
ssh root@72.60.17.245

# Create backup bridge directory
mkdir -p /opt/velo-test-monitor/services/whatsapp-bridge-backup
cd /opt/velo-test-monitor/services/whatsapp-bridge-backup

# Copy current bridge code (assuming Go binary)
cp /opt/velo-test-monitor/services/whatsapp-bridge/whatsapp-bridge ./
chmod +x whatsapp-bridge

# Create separate store directory
mkdir -p store
```

### Step 2: Configure Backup Bridge
```bash
# Create config file (if primary bridge uses config.yaml)
cat > config.yaml <<'EOF'
# Backup WhatsApp Bridge Configuration
phone_number: "+27824189511"
db_path: "./store/messages-backup.db"
whatsapp_db_path: "./store/whatsapp-backup.db"
log_path: "/opt/velo-test-monitor/logs/whatsapp-bridge-backup.log"

# Same groups as primary
monitored_groups:
  - jid: "120363418298130331@g.us"
    name: "Lawley Activation 3"
  - jid: "120363421532174586@g.us"
    name: "Mohadin Activations"
  - jid: "120363421664266245@g.us"
    name: "Velo Test"
  - jid: "120363408849234743@g.us"
    name: "Mamelodi POP1 Activations"
EOF
```

### Step 3: Create Systemd Service
```bash
# Create backup bridge service
cat > /etc/systemd/system/whatsapp-bridge-backup.service <<'EOF'
[Unit]
Description=WhatsApp Bridge Backup Service (082 418 9511)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/velo-test-monitor/services/whatsapp-bridge-backup
ExecStart=/opt/velo-test-monitor/services/whatsapp-bridge-backup/whatsapp-bridge
Restart=always
RestartSec=10

# Environment variables
Environment="WHATSAPP_PHONE=+27824189511"
Environment="DB_PATH=/opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db"
Environment="WHATSAPP_DB_PATH=/opt/velo-test-monitor/services/whatsapp-bridge-backup/store/whatsapp-backup.db"

# Logging
StandardOutput=append:/opt/velo-test-monitor/logs/whatsapp-bridge-backup.log
StandardError=append:/opt/velo-test-monitor/logs/whatsapp-bridge-backup-error.log

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload
```

### Step 4: Initial Setup and QR Code Pairing
```bash
# DO NOT enable service yet (it will auto-start on boot)
# Start manually for initial QR code pairing
cd /opt/velo-test-monitor/services/whatsapp-bridge-backup
./whatsapp-bridge

# Expected output:
# QR Code will appear in terminal
# Scan with phone 082 418 9511 using WhatsApp > Linked Devices
# Wait for "Successfully authenticated" message
# Press Ctrl+C to stop

# After pairing successful, start as service
systemctl start whatsapp-bridge-backup
systemctl status whatsapp-bridge-backup
```

### Step 5: Add Backup Phone to WhatsApp Groups
```bash
# Manually add 082 418 9511 to all 4 groups:
# 1. Lawley Activation 3
# 2. Mohadin Activations
# 3. Velo Test
# 4. Mamelodi POP1 Activations

# Verify backup bridge is receiving messages
tail -f /opt/velo-test-monitor/logs/whatsapp-bridge-backup.log
# Should see messages from all groups
```

---

## Failover Strategy

### Automatic Failover Implementation

#### Option 1: Modify Drop Monitor (Recommended)
Update drop monitors to support dual database sources with automatic failover.

**Configuration Changes:**

Edit `/opt/wa-monitor/prod/config/projects.yaml`:
```yaml
# Database Sources
database:
  primary:
    type: "sqlite"
    path: "/opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db"
  backup:
    type: "sqlite"
    path: "/opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db"
  failover:
    enabled: true
    check_interval: 30  # seconds
    primary_timeout: 60  # seconds without messages = failure
    auto_switch: true
```

**Code Changes** (Pseudocode for /opt/wa-monitor/prod/modules/monitor.py):
```python
class BridgeFailoverManager:
    def __init__(self, config):
        self.primary_db = config['database']['primary']['path']
        self.backup_db = config['database']['backup']['path']
        self.active_db = self.primary_db  # Start with primary
        self.last_message_time = {}  # Track per-group
        self.failover_enabled = config['database']['failover']['enabled']
        self.check_interval = config['database']['failover']['check_interval']
        self.timeout = config['database']['failover']['primary_timeout']

    def check_health(self):
        """Check if primary bridge is alive (receiving messages)"""
        current_time = time.time()

        for group_jid in self.monitored_groups:
            last_msg = self.get_last_message_time(self.primary_db, group_jid)

            if last_msg:
                self.last_message_time[group_jid] = last_msg

            # Check if primary is stale
            if current_time - self.last_message_time.get(group_jid, 0) > self.timeout:
                logger.warning(f"Primary bridge timeout for {group_jid}")
                if self.failover_enabled and self.active_db == self.primary_db:
                    self.switch_to_backup()

    def switch_to_backup(self):
        """Switch to backup bridge"""
        logger.critical("FAILOVER: Switching from PRIMARY to BACKUP bridge")
        self.active_db = self.backup_db
        self.send_alert("WhatsApp Bridge Failover",
                       f"Switched to backup bridge (082 418 9511)")

    def switch_to_primary(self):
        """Manual switch back to primary (after recovery)"""
        logger.info("RECOVERY: Switching from BACKUP to PRIMARY bridge")
        self.active_db = self.primary_db
        self.send_alert("WhatsApp Bridge Recovery",
                       f"Switched back to primary bridge (064 041 2391)")

    def get_messages(self, group_jid, since_timestamp):
        """Get messages from active bridge"""
        return self.query_db(self.active_db, group_jid, since_timestamp)
```

#### Option 2: External Health Monitor Script
Create separate monitoring script that manages active bridge.

**Create `/opt/velo-test-monitor/scripts/bridge-health-monitor.py`:**
```python
#!/usr/bin/env python3
"""
WhatsApp Bridge Health Monitor & Failover Controller
Checks primary bridge health and manages failover to backup
"""

import time
import sqlite3
import logging
from datetime import datetime, timedelta

PRIMARY_DB = "/opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db"
BACKUP_DB = "/opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db"
ACTIVE_BRIDGE_FILE = "/opt/velo-test-monitor/config/active-bridge.txt"

MONITORED_GROUPS = [
    "120363418298130331@g.us",  # Lawley
    "120363421532174586@g.us",  # Mohadin
    "120363421664266245@g.us",  # Velo Test
    "120363408849234743@g.us",  # Mamelodi
]

PRIMARY_TIMEOUT = 120  # 2 minutes without messages = failure
CHECK_INTERVAL = 30    # Check every 30 seconds

def get_last_message_time(db_path, group_jid):
    """Query last message timestamp for group"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT MAX(timestamp)
            FROM messages
            WHERE chat = ?
        """, (group_jid,))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result and result[0] else None
    except Exception as e:
        logging.error(f"Database query failed for {db_path}: {e}")
        return None

def get_active_bridge():
    """Read current active bridge from config file"""
    try:
        with open(ACTIVE_BRIDGE_FILE, 'r') as f:
            return f.read().strip()  # "primary" or "backup"
    except FileNotFoundError:
        return "primary"  # Default to primary

def set_active_bridge(bridge_name):
    """Write active bridge to config file"""
    with open(ACTIVE_BRIDGE_FILE, 'w') as f:
        f.write(bridge_name)
    logging.info(f"Active bridge set to: {bridge_name}")

def send_alert(subject, message):
    """Send alert via email or webhook"""
    # TODO: Implement email/SMS/Slack notification
    logging.critical(f"ALERT: {subject} - {message}")

def main():
    logging.basicConfig(
        filename='/opt/velo-test-monitor/logs/bridge-health-monitor.log',
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

    logging.info("Bridge Health Monitor started")

    while True:
        try:
            active = get_active_bridge()
            current_time = time.time()

            if active == "primary":
                # Check primary health
                primary_healthy = False

                for group_jid in MONITORED_GROUPS:
                    last_msg = get_last_message_time(PRIMARY_DB, group_jid)
                    if last_msg and (current_time - last_msg) < PRIMARY_TIMEOUT:
                        primary_healthy = True
                        break

                if not primary_healthy:
                    logging.warning("Primary bridge unhealthy, failing over to backup")
                    set_active_bridge("backup")
                    send_alert(
                        "WhatsApp Bridge Failover",
                        "Primary bridge (064 041 2391) is down. Switched to backup (082 418 9511)"
                    )

            elif active == "backup":
                # Manual switchback only (require human verification)
                logging.info("Currently using backup bridge. Waiting for manual switchback.")

            time.sleep(CHECK_INTERVAL)

        except Exception as e:
            logging.error(f"Health monitor error: {e}")
            time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
```

**Create systemd service for health monitor:**
```bash
cat > /etc/systemd/system/bridge-health-monitor.service <<'EOF'
[Unit]
Description=WhatsApp Bridge Health Monitor & Failover
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

### Drop Monitor Integration
Both drop monitors must check `active-bridge.txt` to know which database to query:

**Update `/opt/wa-monitor/prod/modules/database.py`:**
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
            # Default to primary
            return "/opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db"
    except FileNotFoundError:
        return "/opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db"
```

---

## Migration Plan

### Scenario 1: Planned Migration (082 becomes primary)

**Timeline: 1-2 hours, outside business hours**

#### Phase 1: Preparation (Week before)
```bash
# 1. Ensure backup bridge is fully operational
systemctl status whatsapp-bridge-backup
tail -100 /opt/velo-test-monitor/logs/whatsapp-bridge-backup.log

# 2. Verify backup bridge is in all groups
# Check logs for messages from all 4 groups

# 3. Test backup database queries
sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db \
  "SELECT COUNT(*) FROM messages;"

# 4. Notify team of migration window
```

#### Phase 2: Switchover (30 minutes)
```bash
# 1. Switch active bridge
echo "backup" > /opt/velo-test-monitor/config/active-bridge.txt

# 2. Restart drop monitors to pick up new bridge
/opt/wa-monitor/prod/restart-monitor.sh
systemctl restart wa-monitor-dev

# 3. Verify monitors are using backup bridge
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log
# Look for: "Using bridge: backup" or similar log message

# 4. Post test message to Velo Test group
# Verify it appears in dashboard within 30 seconds
```

#### Phase 3: Decommission Primary (After 1 week of stable operation)
```bash
# 1. Remove 064 041 2391 from WhatsApp groups manually

# 2. Stop primary bridge service
systemctl stop whatsapp-bridge
systemctl disable whatsapp-bridge

# 3. Rename backup to primary
systemctl stop whatsapp-bridge-backup
mv /opt/velo-test-monitor/services/whatsapp-bridge /opt/velo-test-monitor/services/whatsapp-bridge-OLD
mv /opt/velo-test-monitor/services/whatsapp-bridge-backup /opt/velo-test-monitor/services/whatsapp-bridge

# 4. Update service file
sed -i 's/whatsapp-bridge-backup/whatsapp-bridge/g' /etc/systemd/system/whatsapp-bridge.service
systemctl daemon-reload

# 5. Update active bridge config
echo "primary" > /opt/velo-test-monitor/config/active-bridge.txt

# 6. Restart everything
systemctl start whatsapp-bridge
/opt/wa-monitor/prod/restart-monitor.sh
systemctl restart wa-monitor-dev
```

### Scenario 2: Emergency Failover (Primary fails)

**Automatic (if health monitor enabled):**
1. Health monitor detects primary failure (no messages for 2 minutes)
2. Automatically switches to backup bridge
3. Alert sent to admin
4. Drop monitors pick up change within next polling cycle (30 seconds)

**Manual (if health monitor not enabled):**
```bash
# 1. SSH into VPS
ssh root@72.60.17.245

# 2. Switch to backup
echo "backup" > /opt/velo-test-monitor/config/active-bridge.txt

# 3. Restart monitors
/opt/wa-monitor/prod/restart-monitor.sh
systemctl restart wa-monitor-dev

# 4. Verify dashboard is updating
curl https://app.fibreflow.app/api/wa-monitor-daily-drops | jq .
```

---

## Monitoring & Health Checks

### Daily Health Check Commands
```bash
# Check both bridges status
systemctl status whatsapp-bridge whatsapp-bridge-backup

# Check which bridge is active
cat /opt/velo-test-monitor/config/active-bridge.txt

# Check recent messages (primary)
sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db \
  "SELECT COUNT(*) FROM messages WHERE timestamp > strftime('%s', 'now', '-1 hour');"

# Check recent messages (backup)
sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db \
  "SELECT COUNT(*) FROM messages WHERE timestamp > strftime('%s', 'now', '-1 hour');"

# Compare message counts (should be identical if both are in groups)
echo "Primary bridge messages in last hour:"
sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db \
  "SELECT COUNT(*) FROM messages WHERE timestamp > strftime('%s', 'now', '-1 hour');"

echo "Backup bridge messages in last hour:"
sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db \
  "SELECT COUNT(*) FROM messages WHERE timestamp > strftime('%s', 'now', '-1 hour');"
```

### Alerting Setup
Configure alerts for:
1. **Bridge Down**: Either bridge service stops
2. **Failover Event**: Automatic switch to backup
3. **Message Mismatch**: Primary and backup receiving different message counts
4. **Database Error**: SQLite corruption or connection issues

**Example: Email alert script**
```bash
# /opt/velo-test-monitor/scripts/send-alert.sh
#!/bin/bash
SUBJECT="$1"
MESSAGE="$2"

# Send email via mailx or curl to webhook
echo "$MESSAGE" | mail -s "$SUBJECT" admin@velocityfibre.co.za

# Or send to Slack webhook
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"$SUBJECT: $MESSAGE\"}"
```

---

## Rollback Procedures

### If Backup Bridge Fails During Switchover
```bash
# Immediate rollback to primary
echo "primary" > /opt/velo-test-monitor/config/active-bridge.txt
/opt/wa-monitor/prod/restart-monitor.sh
systemctl restart wa-monitor-dev

# Verify dashboard is working
curl https://app.fibreflow.app/api/wa-monitor-daily-drops | jq .
```

### If Data Corruption Detected
```bash
# 1. Stop affected bridge
systemctl stop whatsapp-bridge-backup

# 2. Restore database from backup
cp /opt/velo-test-monitor/backups/messages-backup.db.YYYYMMDD \
   /opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db

# 3. Restart bridge
systemctl start whatsapp-bridge-backup

# 4. Verify integrity
sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db \
  "PRAGMA integrity_check;"
```

### Complete System Restore
```bash
# If both bridges fail, restore from Neon database
# (Neon has all processed drops in qa_photo_reviews table)

# 1. Stop all services
systemctl stop whatsapp-bridge whatsapp-bridge-backup wa-monitor-prod wa-monitor-dev

# 2. Rebuild databases from Neon
# (This is for reference only - drops are already in Neon)
psql $DATABASE_URL -c "SELECT * FROM qa_photo_reviews ORDER BY created_at DESC LIMIT 100;"

# 3. Restart primary bridge only
systemctl start whatsapp-bridge
echo "primary" > /opt/velo-test-monitor/config/active-bridge.txt

# 4. Restart monitors
/opt/wa-monitor/prod/restart-monitor.sh
systemctl start wa-monitor-dev

# 5. Manually re-pair backup bridge if needed
cd /opt/velo-test-monitor/services/whatsapp-bridge-backup
./whatsapp-bridge
# Scan QR code with 082 418 9511
# Ctrl+C after "Successfully authenticated"
systemctl start whatsapp-bridge-backup
```

---

## Configuration Summary

### File Locations
```
Primary Bridge:
  Binary: /opt/velo-test-monitor/services/whatsapp-bridge/whatsapp-bridge
  Config: /opt/velo-test-monitor/services/whatsapp-bridge/config.yaml
  Database: /opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db
  LID Map: /opt/velo-test-monitor/services/whatsapp-bridge/store/whatsapp.db
  Logs: /opt/velo-test-monitor/logs/whatsapp-bridge.log
  Service: /etc/systemd/system/whatsapp-bridge.service

Backup Bridge:
  Binary: /opt/velo-test-monitor/services/whatsapp-bridge-backup/whatsapp-bridge
  Config: /opt/velo-test-monitor/services/whatsapp-bridge-backup/config.yaml
  Database: /opt/velo-test-monitor/services/whatsapp-bridge-backup/store/messages-backup.db
  LID Map: /opt/velo-test-monitor/services/whatsapp-bridge-backup/store/whatsapp-backup.db
  Logs: /opt/velo-test-monitor/logs/whatsapp-bridge-backup.log
  Service: /etc/systemd/system/whatsapp-bridge-backup.service

Health Monitor:
  Script: /opt/velo-test-monitor/scripts/bridge-health-monitor.py
  Logs: /opt/velo-test-monitor/logs/bridge-health-monitor.log
  Service: /etc/systemd/system/bridge-health-monitor.service
  Active Bridge: /opt/velo-test-monitor/config/active-bridge.txt

Drop Monitors:
  Production: /opt/wa-monitor/prod/
  Development: /opt/wa-monitor/dev/
  Config: config/projects.yaml (both environments)
```

### Systemd Services
```bash
# Primary bridge
systemctl status whatsapp-bridge

# Backup bridge
systemctl status whatsapp-bridge-backup

# Health monitor
systemctl status bridge-health-monitor

# Drop monitors
systemctl status wa-monitor-prod wa-monitor-dev
```

---

## Testing Checklist

Before going live with dual-bridge setup:

- [ ] Backup bridge successfully paired with 082 418 9511
- [ ] Backup bridge added to all 4 WhatsApp groups
- [ ] Both bridges receiving messages (verify in logs)
- [ ] Health monitor running and logging correctly
- [ ] Failover test: Stop primary, verify auto-switch to backup
- [ ] Recovery test: Start primary, verify manual switchback works
- [ ] Dashboard continues updating during failover
- [ ] Alert system sends notifications on failover
- [ ] Drop monitors correctly read `active-bridge.txt`
- [ ] No duplicate entries in `qa_photo_reviews` table during switchover
- [ ] Message count parity between primary and backup databases

---

## Next Steps

1. **Review this plan** with team and get approval
2. **Schedule implementation window** (off-hours, low traffic)
3. **Prepare backup phone** (082 418 9511) - ensure it's charged and accessible
4. **Implement health monitor** script first (can run alongside current setup)
5. **Install backup bridge** following Step 1-5 above
6. **Test failover** in development environment (Velo Test group)
7. **Monitor for 1 week** before relying on automatic failover
8. **Document lessons learned** and update this guide

---

## Support & Troubleshooting

### Common Issues

**Issue: Backup bridge not receiving messages**
- Check if 082 418 9511 is in the WhatsApp group
- Verify service is running: `systemctl status whatsapp-bridge-backup`
- Check logs: `tail -100 /opt/velo-test-monitor/logs/whatsapp-bridge-backup.log`

**Issue: Failover not triggering**
- Check health monitor is running: `systemctl status bridge-health-monitor`
- Verify timeout settings in config
- Check health monitor logs: `tail -100 /opt/velo-test-monitor/logs/bridge-health-monitor.log`

**Issue: Duplicate drops in database**
- Both bridges are active simultaneously
- Check `active-bridge.txt` file
- Ensure drop monitors are reading correct bridge
- Add deduplication by `drop_number` in monitor code

**Issue: QR code pairing fails**
- Ensure phone has internet connection
- Check if phone number matches config
- Verify WhatsApp is installed and updated on 082 418 9511
- Try re-running bridge binary manually

### Emergency Contacts
- VPS Admin: [Your contact]
- WhatsApp Admin: [Contact who manages 064 041 2391 and 082 418 9511]
- Database Admin: [Neon database contact]

---

**Document Version:** 1.0
**Last Updated:** November 24, 2025
**Next Review:** After initial implementation
