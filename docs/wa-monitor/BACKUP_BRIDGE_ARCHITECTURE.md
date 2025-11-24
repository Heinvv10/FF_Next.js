# Backup WhatsApp Bridge Architecture

**Visual Guide to Dual-Bridge Setup**

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      WHATSAPP GROUPS (4)                        │
│                                                                 │
│  • Lawley (120363418298130331@g.us)                           │
│  • Mohadin (120363421532174586@g.us)                          │
│  • Velo Test (120363421664266245@g.us)                        │
│  • Mamelodi (120363408849234743@g.us)                         │
└────────┬──────────────────────────────────────────────┬────────┘
         │                                               │
         │  Both numbers in all groups                  │
         │                                               │
┌────────▼────────┐                            ┌────────▼────────┐
│  PRIMARY (064)  │                            │  BACKUP (082)   │
│  064 041 2391   │                            │  082 418 9511   │
│                 │                            │                 │
│  Port: 8080     │                            │  Port: 8082     │
│  Status: ACTIVE │                            │  Status: ACTIVE │
└────────┬────────┘                            └────────┬────────┘
         │                                               │
         │                                               │
┌────────▼───────────────────────┐      ┌───────────────▼────────┐
│  PRIMARY BRIDGE                │      │  BACKUP BRIDGE         │
│  /opt/velo-test-monitor/      │      │  /opt/whatsapp-bridge- │
│  services/whatsapp-bridge/    │      │  backup/               │
│                                │      │                        │
│  • Capture messages            │      │  • Capture messages    │
│  • Store in messages.db        │      │  • Store in backup     │
│  • Insert to Neon DB          │      │    messages.db         │
│  • bridge_source = 'primary'  │      │  • Insert to Neon DB   │
│                                │      │  • bridge_source =     │
│                                │      │    'backup'            │
└────────┬───────────────────────┘      └───────────┬────────────┘
         │                                           │
         └───────────────────┬───────────────────────┘
                             │
                  Both write to same database
                  First one wins (ON CONFLICT)
                             │
                ┌────────────▼────────────┐
                │   NEON POSTGRESQL       │
                │   (Cloud Database)      │
                │                         │
                │  qa_photo_reviews table │
                │  • drop_number (PK)    │
                │  • bridge_source       │
                │  • project             │
                │  • ... (12 QA steps)   │
                └────────────┬────────────┘
                             │
                ┌────────────▼────────────┐
                │  DROP MONITORS          │
                │  (Python Services)      │
                │                         │
                │  • wa-monitor-prod      │
                │  • wa-monitor-dev       │
                └────────────┬────────────┘
                             │
                ┌────────────▼────────────┐
                │  FIBREFLOW DASHBOARD    │
                │  https://app.          │
                │  fibreflow.app         │
                │                         │
                │  /wa-monitor page      │
                └─────────────────────────┘
```

---

## Detailed Component Architecture

### Primary Bridge (064 041 2391)

```
┌─────────────────────────────────────────────────────────────┐
│  PRIMARY WHATSAPP BRIDGE                                    │
│  Phone: 064 041 2391                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Service: whatsapp-bridge-prod                              │
│  Binary: /opt/velo-test-monitor/services/                  │
│          whatsapp-bridge/whatsapp-bridge                    │
│  Port: 8080                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  SQLite Databases (Primary)                         │  │
│  │  /opt/velo-test-monitor/services/whatsapp-bridge/  │  │
│  │  store/                                             │  │
│  │                                                      │  │
│  │  • messages.db    (WhatsApp messages)              │  │
│  │  • whatsapp.db    (Session data)                   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Log Files                                          │  │
│  │  /opt/velo-test-monitor/logs/                      │  │
│  │                                                      │  │
│  │  • whatsapp-bridge.log                             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  REST API Endpoints                                 │  │
│  │                                                      │  │
│  │  GET  http://localhost:8080/health                 │  │
│  │  POST http://localhost:8080/api/send               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Backup Bridge (082 418 9511)

```
┌─────────────────────────────────────────────────────────────┐
│  BACKUP WHATSAPP BRIDGE                                     │
│  Phone: 082 418 9511                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Service: whatsapp-bridge-backup                            │
│  Binary: /opt/whatsapp-bridge-backup/whatsapp-bridge       │
│  Port: 8082                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  SQLite Databases (Backup)                          │  │
│  │  /opt/whatsapp-bridge-backup/store/                 │  │
│  │                                                      │  │
│  │  • messages.db    (WhatsApp messages - backup copy)│  │
│  │  • whatsapp.db    (Session data for 082)           │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Log Files                                          │  │
│  │  /opt/whatsapp-bridge-backup/logs/                  │  │
│  │                                                      │  │
│  │  • whatsapp-bridge-backup.log                       │  │
│  │    (Prefixed with [BACKUP] identifier)             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  REST API Endpoints                                 │  │
│  │                                                      │  │
│  │  GET  http://localhost:8082/health                 │  │
│  │  POST http://localhost:8082/api/send               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Normal Operation (Both Active)

```
WhatsApp Message: "DR1234567"
        │
        ├──────────────────────────────┐
        │                              │
        ▼                              ▼
┌───────────────┐              ┌───────────────┐
│ PRIMARY (064) │              │ BACKUP (082)  │
│ Receives @    │              │ Receives @    │
│ 08:00:00.100  │              │ 08:00:00.150  │
└───────┬───────┘              └───────┬───────┘
        │                              │
        │ Insert DR1234567            │ Insert DR1234567
        │ bridge_source='primary'     │ bridge_source='backup'
        │                              │
        ▼                              ▼
┌─────────────────────────────────────────────┐
│         NEON POSTGRESQL                     │
│                                             │
│  INSERT ... ON CONFLICT (drop_number)      │
│  DO NOTHING;                                │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ PRIMARY arrives first (100ms)        │  │
│  │ ✅ INSERT successful                 │  │
│  │ Row: DR1234567 | primary | ...      │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ BACKUP arrives second (150ms)        │  │
│  │ ⚠️ ON CONFLICT triggered             │  │
│  │ ❌ DO NOTHING (duplicate prevented)  │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
        │
        ▼
Result: One entry in database
        DR1234567 | primary | 08:00:00.100
```

**Key Points:**
- Both bridges capture the message
- Race condition: First to write wins
- Second INSERT silently ignored (ON CONFLICT)
- No duplicates in database
- `bridge_source` shows which won the race

---

## Data Flow: Primary Failure Scenario

```
Time: 08:00:00
State: PRIMARY is DOWN, BACKUP is UP

WhatsApp Message: "DR5555555"
        │
        │ Primary bridge offline ❌
        │ Message NOT captured by primary
        │
        ▼
┌───────────────┐
│ BACKUP (082)  │
│ Receives @    │
│ 08:00:01.000  │
└───────┬───────┘
        │
        │ Insert DR5555555
        │ bridge_source='backup'
        │
        ▼
┌─────────────────────────────────────────────┐
│         NEON POSTGRESQL                     │
│                                             │
│  INSERT ... ON CONFLICT (drop_number)      │
│  DO NOTHING;                                │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ BACKUP is only bridge writing        │  │
│  │ ✅ INSERT successful                 │  │
│  │ Row: DR5555555 | backup | ...        │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
        │
        ▼
Result: Message NOT LOST
        DR5555555 | backup | 08:00:01.000

┌─────────────────────────────────────────────┐
│  FAILOVER MONITOR (Optional)                │
│  Detects primary failure                    │
│  Sends alert notification                   │
└─────────────────────────────────────────────┘
```

**Key Points:**
- Backup continues operating independently
- No message loss during primary outage
- Database tracks which bridge captured message
- Failover monitor can trigger automatic recovery

---

## Failover Strategies

### Strategy 1: Automatic Failover (Recommended)

```
┌────────────────────────────────────────────────────┐
│  FAILOVER MONITOR SERVICE                          │
│  /opt/whatsapp-bridge-backup/failover-monitor.sh  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Every 60 seconds:                                 │
│                                                    │
│  1. Check Primary Health                           │
│     curl http://localhost:8080/health             │
│                                                    │
│  2. Check Backup Health                            │
│     curl http://localhost:8082/health             │
│                                                    │
│  3. If Primary DOWN and Backup UP:                 │
│     • Update monitor configs                       │
│     • Restart drop monitors                        │
│     • Send alert                                   │
│                                                    │
│  4. If Primary UP again:                           │
│     • Switch monitors back to primary              │
│     • Log recovery                                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Flow:**
```
Primary Fails (8080 unresponsive)
        │
        ▼
┌────────────────────────┐
│ Failover Monitor       │
│ Detects failure        │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Update Config          │
│ /opt/wa-monitor/prod/  │
│ config/bridge.yaml     │
│                        │
│ messages_db:           │
│ /opt/whatsapp-bridge-  │
│ backup/store/          │
│ messages.db            │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Restart Monitors       │
│ • wa-monitor-prod      │
│ • wa-monitor-dev       │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Monitors now read from │
│ BACKUP database        │
│ (automatic switch)     │
└────────────────────────┘
```

---

### Strategy 2: Manual Failover

**User-initiated switch:**

```bash
# Stop primary
systemctl stop whatsapp-bridge-prod

# Update monitor config
sed -i 's|/opt/velo-test-monitor/services/whatsapp-bridge|/opt/whatsapp-bridge-backup|g' \
  /opt/wa-monitor/prod/config/bridge.yaml

# Restart monitors
systemctl restart wa-monitor-prod
systemctl restart wa-monitor-dev

# Verify backup is active
curl http://localhost:8082/health
```

---

## Port Allocation

```
┌─────────────────────────────────────────┐
│  PORT ALLOCATION ON VPS                 │
├─────────────────────────────────────────┤
│                                         │
│  8080  →  PRIMARY Bridge (064)         │
│  8081  →  WhatsApp Sender (071)        │
│  8082  →  BACKUP Bridge (082) ⭐ NEW   │
│                                         │
│  3005  →  FibreFlow App (Production)   │
│  3006  →  FibreFlow App (Development)  │
│                                         │
└─────────────────────────────────────────┘
```

**Why 8082?**
- Avoids conflict with primary (8080)
- Avoids conflict with sender (8081)
- Easy to remember (next in sequence)
- No conflict with app ports (3005/3006)

---

## Database Deduplication Strategy

### Without bridge_source Column (❌ Problem)

```sql
-- Both bridges insert with identical data
INSERT INTO qa_photo_reviews (drop_number, user_name, project)
VALUES ('DR1234567', 'John', 'Lawley');

-- Result: DUPLICATE KEY error or two entries!
```

### With bridge_source Column (✅ Solution)

```sql
-- Primary bridge
INSERT INTO qa_photo_reviews (
  drop_number, user_name, project, bridge_source
)
VALUES ('DR1234567', 'John', 'Lawley', 'primary')
ON CONFLICT (drop_number) DO NOTHING;

-- Backup bridge (50ms later)
INSERT INTO qa_photo_reviews (
  drop_number, user_name, project, bridge_source
)
VALUES ('DR1234567', 'John', 'Lawley', 'backup')
ON CONFLICT (drop_number) DO NOTHING;  -- ✅ Prevented

-- Result: Only ONE entry exists
SELECT * FROM qa_photo_reviews WHERE drop_number = 'DR1234567';
-- DR1234567 | John | Lawley | primary | 2025-11-24 08:00:00
```

**Benefits:**
- No duplicates
- Track which bridge captured message (reliability analysis)
- Race condition handled gracefully
- Database enforces uniqueness

---

## Service Dependencies

```
┌────────────────────────────────────────────┐
│  SYSTEMD SERVICE DEPENDENCY TREE           │
└────────────────────────────────────────────┘

network.target
    │
    ├─────────────────────────┬───────────────┐
    │                         │               │
    ▼                         ▼               ▼
whatsapp-bridge-prod   whatsapp-sender   whatsapp-bridge-backup ⭐
    │                         │               │
    │                         │               │
    └─────────┬───────────────┴───────────────┘
              │
              ▼
    wa-monitor-prod (reads from primary or backup)
              │
              ▼
    wa-monitor-dev (reads from primary or backup)
              │
              ▼
    fibreflow-prod (displays data from Neon DB)


Optional:
    ▼
bridge-failover-monitor (monitors primary & backup)
```

**Key Relationships:**
- Monitors depend on at least ONE bridge being up
- App doesn't directly depend on bridges (uses database)
- Failover monitor watches both bridges

---

## File System Layout

```
/opt/
├── velo-test-monitor/
│   ├── services/
│   │   └── whatsapp-bridge/          ← PRIMARY BRIDGE
│   │       ├── main.go
│   │       ├── whatsapp-bridge       (binary)
│   │       └── store/
│   │           ├── messages.db       ← Primary messages
│   │           └── whatsapp.db       ← Primary session (064)
│   └── logs/
│       └── whatsapp-bridge.log
│
├── whatsapp-bridge-backup/           ← BACKUP BRIDGE ⭐ NEW
│   ├── main.go
│   ├── whatsapp-bridge               (binary)
│   ├── store/
│   │   ├── messages.db               ← Backup messages
│   │   └── whatsapp.db               ← Backup session (082)
│   └── logs/
│       └── whatsapp-bridge-backup.log
│
├── whatsapp-sender/                   ← SENDER (071)
│   ├── main.go
│   ├── sender
│   ├── store/
│   │   └── whatsapp.db               ← Sender session (071)
│   └── logs/
│       └── sender.log
│
└── wa-monitor/
    ├── prod/                          ← PRODUCTION MONITOR
    │   ├── config/
    │   │   └── projects.yaml
    │   └── logs/
    │       └── wa-monitor-prod.log
    └── dev/                           ← DEVELOPMENT MONITOR
        ├── config/
        │   └── projects.yaml
        └── logs/
            └── wa-monitor-dev.log


/etc/systemd/system/
├── whatsapp-bridge-prod.service       ← Primary bridge
├── whatsapp-bridge-backup.service     ← Backup bridge ⭐ NEW
├── whatsapp-sender.service            ← Sender (071)
├── wa-monitor-prod.service            ← Prod monitor
├── wa-monitor-dev.service             ← Dev monitor
└── bridge-failover-monitor.service    ← Failover monitor ⭐ NEW
```

---

## Health Monitoring

```
┌────────────────────────────────────────────────────────┐
│  HEALTH CHECK SCRIPT                                   │
│  /opt/whatsapp-bridge-backup/health-check.sh          │
└────────────────────────────────────────────────────────┘
        │
        ├───────────────────────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│  PRIMARY BRIDGE  │              │  BACKUP BRIDGE   │
│  Port 8080       │              │  Port 8082       │
└────────┬─────────┘              └────────┬─────────┘
         │                                  │
         │ curl /health                     │ curl /health
         │                                  │
         ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│  Response:       │              │  Response:       │
│  {               │              │  {               │
│    "status":"ok" │              │    "status":"ok" │
│    "connected":  │              │    "connected":  │
│     true         │              │     true         │
│  }               │              │  }               │
└──────────────────┘              └──────────────────┘
         │                                  │
         └──────────────┬───────────────────┘
                        │
                        ▼
            ┌──────────────────────┐
            │  HEALTH SUMMARY      │
            │                      │
            │  ✅ PRIMARY: ONLINE  │
            │  ✅ BACKUP: ONLINE   │
            │                      │
            │  Overall: REDUNDANT  │
            └──────────────────────┘
```

---

## Capacity Planning

### Resource Usage

```
┌─────────────────────────────────────────────────┐
│  RESOURCE REQUIREMENTS PER BRIDGE               │
├─────────────────────────────────────────────────┤
│                                                 │
│  CPU:      ~2-5% (idle)                        │
│           ~10-20% (active message processing)   │
│                                                 │
│  Memory:   ~50-100 MB (resident)               │
│           ~150 MB (with buffers)                │
│                                                 │
│  Disk:     ~30 MB (binary)                     │
│           ~10-50 MB (messages.db growth/day)   │
│           ~5 MB (whatsapp.db)                  │
│                                                 │
│  Network:  ~100 KB/s (WebSocket keep-alive)    │
│           ~500 KB/s (message receiving)         │
│                                                 │
└─────────────────────────────────────────────────┘

Total for Dual-Bridge Setup:
• CPU: ~10% (both idle) to ~40% (both active)
• Memory: ~300 MB total
• Disk: ~60 MB binaries + ~20-100 MB messages/day
• Network: Minimal (mostly keep-alive)
```

**VPS Requirements:**
- Minimum: 2 CPU cores, 2 GB RAM, 20 GB disk
- Recommended: 4 CPU cores, 4 GB RAM, 40 GB disk
- Current VPS should handle dual setup easily

---

## Security Considerations

```
┌────────────────────────────────────────────────┐
│  SECURITY ASPECTS                              │
├────────────────────────────────────────────────┤
│                                                │
│  1. WhatsApp Session Isolation                 │
│     ✅ Each bridge has own whatsapp.db         │
│     ✅ No session conflicts                    │
│     ✅ Independent authentication              │
│                                                │
│  2. Database Security                          │
│     ✅ Neon PostgreSQL with SSL               │
│     ✅ Connection pooling                      │
│     ✅ Credentials in environment vars         │
│                                                │
│  3. API Endpoints                              │
│     ⚠️ localhost only (8080, 8082)           │
│     ⚠️ No external access                     │
│     ⚠️ No authentication (internal only)      │
│                                                │
│  4. File Permissions                           │
│     ✅ SQLite databases: 600 (root only)      │
│     ✅ Binaries: 755 (executable)             │
│     ✅ Logs: 644 (readable)                   │
│                                                │
│  5. Phone Numbers                              │
│     ⚠️ Keep backup number secure              │
│     ⚠️ Document who has access                │
│     ⚠️ Regular security audits                │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Maintenance Windows

```
┌────────────────────────────────────────────────┐
│  ZERO-DOWNTIME MAINTENANCE                     │
├────────────────────────────────────────────────┤
│                                                │
│  Scenario: Update primary bridge code          │
│                                                │
│  Step 1: Backup takes over                     │
│    • Primary still running                     │
│    • Backup captures all messages              │
│                                                │
│  Step 2: Update primary                        │
│    • Stop primary                              │
│    • Update code                               │
│    • Recompile                                 │
│    • Test locally                              │
│                                                │
│  Step 3: Restart primary                       │
│    • Start primary                             │
│    • Verify health                             │
│    • Both bridges now active                   │
│                                                │
│  Result: ZERO MESSAGE LOSS                     │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Summary

**Key Architecture Benefits:**

✅ **Redundancy**: Dual bridges prevent single point of failure
✅ **Zero Downtime**: Messages captured even if one bridge fails
✅ **No Data Loss**: Database deduplication prevents duplicates
✅ **Easy Failover**: Automatic or manual switch between bridges
✅ **Independent Testing**: Test backup without affecting primary
✅ **Flexibility**: Easy to swap primary/backup roles
✅ **Monitoring**: Health checks and failover detection
✅ **Scalability**: Can add more bridges if needed

**Trade-offs:**

⚠️ **Resource Usage**: ~2x CPU, memory, disk (acceptable)
⚠️ **Complexity**: More services to manage (mitigated by automation)
⚠️ **Configuration**: Need to maintain two bridge configs (Git helps)

**Overall**: The benefits far outweigh the trade-offs for production reliability.

---

**Document Version:** 1.0
**Last Updated:** November 24, 2025
**Architecture Type:** High-Availability Dual-Bridge
**Status:** Production Ready
