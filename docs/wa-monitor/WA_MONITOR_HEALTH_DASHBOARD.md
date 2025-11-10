# WA Monitor System Health Dashboard

**Created:** November 10, 2025
**Status:** Planning Phase
**Purpose:** Real-time monitoring dashboard to verify all WA Monitor components are operational

## Overview

The WA Monitor system has multiple components that must work together:
1. WhatsApp Bridge (VPS) - Captures messages
2. Drop Monitor Services (VPS) - Processes messages and writes to database
3. Neon PostgreSQL Database - Stores drop data
4. Next.js API Endpoints - Serves data to frontend
5. Frontend Dashboard - Displays data

When drops stop appearing, it's unclear which component failed. This health dashboard will provide **real-time verification** of each component with no false positives.

## System Architecture

```
WhatsApp Groups
    ↓
WhatsApp Bridge (Go Process)
    ├─ SQLite: /opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db
    └─ Logs: /opt/velo-test-monitor/logs/whatsapp-bridge.log
    ↓
Drop Monitor Services (Python)
    ├─ Production: /opt/wa-monitor/prod/ (systemd: wa-monitor-prod)
    ├─ Development: /opt/wa-monitor/dev/ (systemd: wa-monitor-dev)
    └─ Logs: /opt/wa-monitor/{prod|dev}/logs/wa-monitor-{prod|dev}.log
    ↓
Neon PostgreSQL (Cloud)
    ├─ Table: qa_photo_reviews
    └─ Connection: ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech
    ↓
Next.js API Routes
    ├─ /api/wa-monitor-drops
    ├─ /api/wa-monitor-daily-drops
    └─ /api/wa-monitor-health (NEW)
    ↓
Frontend Dashboard
    └─ /wa-monitor (with health status panel)
```

## Health Checks Design

### 1. VPS Service Checks (via SSH)

**Check:** WhatsApp Bridge Process
```bash
ssh root@72.60.17.245 "ps aux | grep '[w]hatsapp-bridge'"
```
- ✅ Status: Process found → UP
- ❌ Status: Process not found → DOWN
- Info: PID, CPU%, Memory, Uptime

**Check:** Drop Monitor Production Service
```bash
ssh root@72.60.17.245 "systemctl is-active wa-monitor-prod"
```
- ✅ Status: "active" → UP
- ❌ Status: "inactive"/"failed" → DOWN
- Info: Service status, last restart time

**Check:** Drop Monitor Development Service
```bash
ssh root@72.60.17.245 "systemctl is-active wa-monitor-dev"
```
- ✅ Status: "active" → UP
- ❌ Status: "inactive"/"failed" → DOWN
- Info: Service status, last restart time

**Check:** Recent Log Activity
```bash
ssh root@72.60.17.245 "stat -c '%Y' /opt/wa-monitor/prod/logs/wa-monitor-prod.log"
```
- ✅ Status: Modified < 5 minutes ago → ACTIVE
- ⚠️ Status: Modified 5-30 minutes ago → STALE
- ❌ Status: Modified > 30 minutes ago → INACTIVE
- Info: Last modified timestamp

**Check:** Messages in WhatsApp SQLite
```bash
ssh root@72.60.17.245 "sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db 'SELECT COUNT(*) FROM messages WHERE timestamp > datetime(\"now\", \"-1 hour\");'"
```
- ✅ Status: Count > 0 → RECEIVING MESSAGES
- ⚠️ Status: Count = 0 → NO RECENT MESSAGES
- Info: Message count (last hour)

### 2. Database Health Checks (Direct SQL)

**Check:** Database Connection
```sql
SELECT 1;
```
- ✅ Status: Query succeeds → UP
- ❌ Status: Connection timeout/error → DOWN
- Info: Connection latency (ms)

**Check:** Table Exists
```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name = 'qa_photo_reviews';
```
- ✅ Status: Count = 1 → TABLE EXISTS
- ❌ Status: Count = 0 → TABLE MISSING
- Info: Table row count

**Check:** Recent Data Inserts
```sql
SELECT COUNT(*) FROM qa_photo_reviews
WHERE created_at > NOW() - INTERVAL '24 hours';
```
- ✅ Status: Count > 0 → RECEIVING DATA
- ⚠️ Status: Count = 0 → NO RECENT DATA
- Info: Drop count (24h), latest drop timestamp

**Check:** Data Quality
```sql
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN project IS NOT NULL THEN 1 END) as with_project,
  COUNT(CASE WHEN whatsapp_message_date IS NOT NULL THEN 1 END) as with_date
FROM qa_photo_reviews
WHERE created_at > NOW() - INTERVAL '1 hour';
```
- ✅ Status: All fields populated correctly → HEALTHY
- ⚠️ Status: Missing critical fields → DATA QUALITY ISSUE
- Info: Percentage of complete records

### 3. API Endpoint Checks (HTTP Requests)

**Check:** GET /api/wa-monitor-drops
```javascript
const start = Date.now();
const response = await fetch('/api/wa-monitor-drops');
const latency = Date.now() - start;
```
- ✅ Status: 200 OK + latency < 2s → UP
- ⚠️ Status: 200 OK + latency > 2s → SLOW
- ❌ Status: 500/timeout → DOWN
- Info: Response time, status code, data count

**Check:** GET /api/wa-monitor-daily-drops
```javascript
const start = Date.now();
const response = await fetch('/api/wa-monitor-daily-drops');
const latency = Date.now() - start;
```
- ✅ Status: 200 OK + latency < 2s → UP
- ⚠️ Status: 200 OK + latency > 2s → SLOW
- ❌ Status: 500/timeout → DOWN
- Info: Response time, today's drop count

**Check:** POST /api/wa-monitor-drops/[id] (Update)
```javascript
// Test update with dummy data (no actual change)
const response = await fetch('/api/wa-monitor-drops/test-id', {
  method: 'PATCH',
  body: JSON.stringify({ comment: 'Health check' })
});
```
- ✅ Status: Valid response structure → UP
- ❌ Status: Error/malformed response → DOWN
- Info: Response time, success/failure

### 4. End-to-End Data Flow Check

**Check:** Full Pipeline Verification
1. Check WhatsApp Bridge has recent messages (SQLite)
2. Check Drop Monitor processed recent messages (log timestamp)
3. Check Database has recent inserts (PostgreSQL)
4. Check API returns recent data (HTTP)

- ✅ Status: All steps verified → PIPELINE HEALTHY
- ⚠️ Status: Data flowing but delayed → PROCESSING SLOW
- ❌ Status: Pipeline broken at step X → PIPELINE BROKEN AT [COMPONENT]
- Info: End-to-end latency, bottleneck location

## Dashboard UI Design

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│  WA Monitor System Health                    [🔄 Refresh]      │
│  Last checked: 2 seconds ago                 Auto-refresh: 30s │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🟢 ALL SYSTEMS OPERATIONAL                                     │
│                                                                 │
│  VPS Services                                                   │
│  ├─ ✅ WhatsApp Bridge           UP        (Active 2s ago)     │
│  ├─ ✅ Drop Monitor Prod         UP        (Active 5s ago)     │
│  └─ ✅ Drop Monitor Dev          UP        (Active 3s ago)     │
│                                                                 │
│  Database                                                       │
│  ├─ ✅ Neon PostgreSQL           UP        (124ms latency)     │
│  ├─ ✅ Table Access              OK        (2,847 total rows)  │
│  └─ ✅ Recent Activity           OK        (27 drops today)    │
│                                                                 │
│  API Endpoints                                                  │
│  ├─ ✅ /wa-monitor-drops         UP        (89ms)              │
│  ├─ ✅ /wa-monitor-daily-drops   UP        (76ms)              │
│  └─ ✅ Update Operations         UP        (112ms)             │
│                                                                 │
│  Data Pipeline                                                  │
│  └─ ✅ End-to-End Flow           HEALTHY   (avg 2.3s latency)  │
│                                                                 │
│  Last 24 Hours                                                  │
│  └─ 📊 27 drops processed  •  100% success rate               │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│  [View Detailed Logs]  [Historical Uptime]  [Export Report]   │
└────────────────────────────────────────────────────────────────┘
```

### Failure State Example

```
┌────────────────────────────────────────────────────────────────┐
│  WA Monitor System Health                    [🔄 Refresh]      │
│  Last checked: 5 seconds ago                 Auto-refresh: 30s │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔴 SYSTEM DEGRADED - 1 CRITICAL ISSUE                         │
│                                                                 │
│  VPS Services                                                   │
│  ├─ ❌ WhatsApp Bridge           DOWN                          │
│  │   └─ Error: Process not found (ps aux | grep whatsapp...)   │
│  │      Last seen: 2 hours ago                                 │
│  │      📋 Action: SSH to VPS and restart bridge               │
│  │                                                              │
│  ├─ ⚠️  Drop Monitor Prod         STALE     (Last log: 45m)   │
│  │   └─ Warning: No recent log activity                        │
│  │      May be stuck waiting for WhatsApp Bridge               │
│  │                                                              │
│  └─ ✅ Drop Monitor Dev          UP        (Active 3s ago)     │
│                                                                 │
│  Database                                                       │
│  └─ ✅ All checks passing                                       │
│                                                                 │
│  📊 Impact: No new drops received for 2 hours                  │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│  [🚨 Send Alert]  [📖 View Runbook]  [🔧 Quick Fix Guide]     │
└────────────────────────────────────────────────────────────────┘
```

## Component Design

### Backend API: `/api/wa-monitor-health`

**File:** `pages/api/wa-monitor-health.ts`

**Method:** GET

**Response Format:**
```typescript
{
  success: true,
  data: {
    overall_status: "healthy" | "degraded" | "down",
    timestamp: "2025-11-10T06:45:00Z",
    checks: {
      vps: {
        whatsapp_bridge: { status: "up", details: {...} },
        drop_monitor_prod: { status: "up", details: {...} },
        drop_monitor_dev: { status: "up", details: {...} },
        log_activity: { status: "active", details: {...} }
      },
      database: {
        connection: { status: "up", latency_ms: 124, details: {...} },
        table_exists: { status: "ok", row_count: 2847 },
        recent_data: { status: "ok", count_24h: 27, latest_timestamp: "..." }
      },
      api: {
        get_drops: { status: "up", latency_ms: 89, details: {...} },
        get_daily_drops: { status: "up", latency_ms: 76, details: {...} },
        update_drop: { status: "up", latency_ms: 112, details: {...} }
      },
      pipeline: {
        end_to_end: { status: "healthy", latency_s: 2.3, bottleneck: null }
      }
    }
  }
}
```

### Frontend Component: `<SystemHealthPanel />`

**File:** `src/modules/wa-monitor/components/SystemHealthPanel.tsx`

**Props:**
```typescript
interface SystemHealthPanelProps {
  autoRefresh?: boolean;      // Default: true
  refreshInterval?: number;   // Default: 30000ms (30s)
  compact?: boolean;          // Show compact view
}
```

**Features:**
- Auto-refresh every 30 seconds
- Manual refresh button
- Expandable sections for detailed error info
- Status indicators: 🟢 UP, 🟡 DEGRADED, 🔴 DOWN
- Response time metrics
- Last checked timestamp
- Historical uptime percentage (optional)

## Implementation Plan

### Phase 1: Backend Health Check API
1. Create `/api/wa-monitor-health` endpoint
2. Implement SSH-based VPS checks (using sshpass)
3. Implement database health queries
4. Implement API endpoint checks (self-test)
5. Aggregate results into single response

### Phase 2: Frontend Health Dashboard
1. Create `SystemHealthPanel.tsx` component
2. Implement status indicators (colored badges)
3. Implement auto-refresh logic
4. Add expandable error details
5. Style with Material-UI

### Phase 3: Integration
1. Add health panel to `/wa-monitor` page (collapsible)
2. Add health indicator to sidebar/header (small badge)
3. Optional: Email/Slack alerts on critical failures

### Phase 4: Testing
1. Test all health checks return correct status
2. Simulate failures (stop services, break DB connection)
3. Verify no false positives
4. Performance test (ensure health check doesn't slow down page)

## Security Considerations

1. **VPS Credentials**: Health check API will use SSH with password authentication
   - Password stored in environment variable (VPS_SSH_PASSWORD)
   - Only accessible to authenticated users

2. **Rate Limiting**: Health check endpoint should be rate-limited
   - Max 1 request per 5 seconds per user
   - Prevents DoS via expensive SSH commands

3. **Sensitive Data**: Don't expose sensitive info in error messages
   - No database passwords in responses
   - No SSH credentials in logs

4. **User Access**: Limit health dashboard access
   - Only admin users can view detailed health info
   - Regular users see simplified status badge

## Success Metrics

1. **Accuracy**: 100% correlation between health check status and actual system state
2. **No False Positives**: Health check should never report "down" when system is working
3. **No False Negatives**: Health check should catch all real failures
4. **Performance**: Health check completes in < 5 seconds
5. **Reliability**: Health check itself doesn't fail (retry logic for transient errors)

## Future Enhancements

1. **Historical Uptime Tracking**: Store health check results over time
2. **Alerting**: Send email/Slack when critical component fails
3. **Automated Recovery**: Auto-restart failed services when detected
4. **Performance Graphs**: Visualize API latency and throughput over time
5. **Mobile App**: Push notifications for critical failures

## References

- WA Monitor Architecture: `docs/wa-monitor/WA_MONITOR_ARCHITECTURE_V2.md`
- VPS Deployment: `docs/VPS/DEPLOYMENT.md`
- Database Setup: `docs/wa-monitor/WA_MONITOR_DATABASE_SETUP.md`
- Reliability Improvements: `docs/wa-monitor/RELIABILITY_IMPROVEMENTS.md`

---

**Next Steps:**
1. Review and approve this design
2. Create GitHub issue/task for implementation
3. Start with Phase 1: Backend health check API
4. Deploy to dev environment first, test thoroughly
5. Deploy to production after verification
