# WA Monitor Validation Module

## Status: 🚧 In Development

**Started**: 2025-11-24
**Target Completion**: TBD (after 10 successful runs)

---

## Overview

The WA Monitor validation module tests the entire WhatsApp photo review submission flow end-to-end, from message capture to dashboard display and SharePoint sync.

**What it validates:**
```
WhatsApp Message (Test Drop)
    ↓ [WhatsApp Bridge captures message]
SQLite Database (/opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db)
    ↓ [Monitor services (prod/dev) process message]
Neon PostgreSQL (qa_photo_reviews table)
    ↓ [API queries database]
FibreFlow Dashboard (/wa-monitor)
    ↓ [Nightly job syncs to SharePoint]
SharePoint (Drop validation records)
```

---

## Test Scenarios Covered

### ✅ Core Functionality
1. **VPS Services Health**
   - wa-monitor-prod service active
   - wa-monitor-dev service active
   - whatsapp-bridge process running

2. **Database Connectivity**
   - VPS → Neon PostgreSQL connection
   - App → Neon PostgreSQL connection
   - Query execution and response parsing

3. **Drop Submission Flow** (Happy Path)
   - Test drop appears in qa_photo_reviews table
   - API endpoint returns drop correctly
   - Dashboard displays drop
   - Drop count accurate by project

4. **API Response Standardization**
   - /api/wa-monitor-drops follows standard format
   - /api/wa-monitor-daily-drops follows standard format
   - Response includes `success`, `data`, `meta.timestamp`

### ✅ Edge Cases
5. **Resubmission Handling**
   - Same drop posted twice doesn't duplicate
   - Resubmission updates existing record
   - LID resolution works for resubmissions

6. **LID Resolution**
   - LID numbers resolved to phone numbers
   - `submitted_by` contains phone, not LID
   - `user_name` populated correctly

7. **Dual Service Monitoring (Velo Test)**
   - Both prod and dev process same message
   - No duplicate database entries
   - Services remain synchronized

8. **Incorrect Step Marking**
   - Text-based incorrect marking works
   - `incorrect_steps` JSONB array populated
   - `incorrect_comments` JSONB object populated
   - Feedback message formatted correctly

### ⚠️ Not Covered (Manual Testing Required)
- **SharePoint Sync**: Requires waiting for nightly 8pm job
- **WhatsApp Message Posting**: Requires posting to real WhatsApp group
- **Python Cache Clearing**: Requires introducing bug and verifying fix
- **Service Crash Recovery**: Requires intentionally crashing service

---

## Architecture Context

### System Components

**VPS Server (72.60.17.245):**
```
/opt/velo-test-monitor/
├── services/
│   └── whatsapp-bridge/
│       ├── store/
│       │   ├── messages.db (SQLite - message capture)
│       │   └── whatsapp.db (SQLite - LID mappings)
│       └── logs/whatsapp-bridge.log

/opt/wa-monitor/
├── prod/                          # Production monitor
│   ├── config/projects.yaml       # 4 projects
│   ├── modules/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── monitor.py
│   ├── logs/wa-monitor-prod.log
│   └── restart-monitor.sh         # ⚠️ ALWAYS use this (clears cache)
│
└── dev/                           # Development monitor
    ├── config/projects.yaml       # 1 project (Velo Test)
    ├── modules/ (same structure)
    └── logs/wa-monitor-dev.log
```

**Database (Neon PostgreSQL):**
```sql
-- Table: qa_photo_reviews
Key columns:
- drop_number (e.g., DR1751832)
- project (Lawley, Mohadin, Velo Test, Mamelodi)
- whatsapp_message_date (source of truth for daily counts)
- submitted_by (phone number, NOT LID)
- user_name (resolved contact name)
- incorrect_steps (JSONB array - ["step_01_house_photo"])
- incorrect_comments (JSONB object - {"step_01_house_photo": "Blurry"})
```

**FibreFlow App:**
```
/var/www/fibreflow/         # Production (master)
/var/www/fibreflow-dev/     # Development (develop)

API Endpoints:
- GET /api/wa-monitor-drops          # All drops with summary
- GET /api/wa-monitor-daily-drops    # Today's submissions by project
- POST /api/wa-monitor-sync-sharepoint  # Trigger SharePoint sync
```

### Known Issues History

**LID Resolution Bug (Nov 11-13, 2025):**
- **Problem**: Resubmissions showed LID numbers instead of phone numbers
- **Root Cause**: Python bytecode cache not cleared on service restart
- **Fix**: Updated code + used `/opt/wa-monitor/prod/restart-monitor.sh`
- **Validation**: Must verify `submitted_by` never contains LID format

**Database Configuration Mismatch (Nov 10, 2025):**
- **Problem**: Dashboard showed different data than monitor logs
- **Root Cause**: Different DATABASE_URL in dev environment
- **Fix**: Standardized to ep-dry-night-a9qyh4sj across all environments
- **Validation**: Must verify all environments use same database

**Incorrect Marking UI (Nov 23, 2025):**
- **Problem**: Button-based marking had disabled state issues
- **Solution**: Switched to text-based input (comma-separated)
- **Validation**: Must verify `incorrect_steps` and `incorrect_comments` populated correctly

---

## Test Data

### Test Projects
```yaml
# Monitored projects (from config/projects.yaml)
- Lawley:    120363418298130331@g.us
- Mohadin:   120363421532174586@g.us
- Velo Test: 120363421664266245@g.us  # Monitored by BOTH prod and dev
- Mamelodi:  120363408849234743@g.us
```

### Test Drops
```
Use existing production drops for verification:
- DR1734338 (Lawley)
- DR1857337 (Mohadin)
- DR1111113 (Velo Test)

Or query recent drops:
SELECT drop_number, project, whatsapp_message_date
FROM qa_photo_reviews
ORDER BY whatsapp_message_date DESC
LIMIT 10;
```

---

## Pass/Fail Criteria

### Service Health
```
✅ PASS:
- wa-monitor-prod: systemctl is-active = "active"
- wa-monitor-dev: systemctl is-active = "active"
- whatsapp-bridge: ps aux shows process running

❌ FAIL:
- Any service inactive/failed
- whatsapp-bridge process not found
```

### Database Connectivity
```
✅ PASS:
- psql command exit code = 0
- Query returns valid result
- Connection time < 5 seconds

❌ FAIL:
- Connection timeout
- Authentication failed
- Query error
```

### Drop Submission Flow
```
✅ PASS:
- Drop found in qa_photo_reviews table
- API returns drop with correct drop_number
- submitted_by is phone number (11 digits)
- whatsapp_message_date populated
- incorrect_steps/incorrect_comments are valid JSONB

❌ FAIL:
- Drop not found in database
- API returns error
- submitted_by contains LID format (>11 chars)
- JSONB fields are NULL or invalid
```

### API Response Format
```
✅ PASS:
- Response has { success: true, data: {...}, meta: { timestamp: "..." } }
- Status code 200
- Response time < 2 seconds

❌ FAIL:
- Response missing required fields
- success: false
- Status code 4xx/5xx
```

---

## Dependencies

### External Services
- **VPS**: 72.60.17.245 (must be reachable)
- **Neon PostgreSQL**: ep-dry-night-a9qyh4sj (must be online)
- **Production App**: app.fibreflow.app (must be deployed and healthy)

### Credentials Required
- VPS SSH: root@72.60.17.245 (password in approved commands)
- Database: Connection string in DATABASE_URL
- No WhatsApp credentials needed (read-only validation)

### Tools Required
- sshpass (VPS access)
- psql (database queries)
- curl (API testing)
- jq (JSON parsing)

---

## Performance Expectations

### Target Metrics
- **Duration**: 3-5 minutes (acceptable: up to 10 minutes)
- **Pass Rate**: > 95% after optimization
- **Consistency**: Same results on 10 consecutive runs
- **False Positives**: 0 in last 5 runs
- **False Negatives**: 0 in last 5 runs

### Current Metrics
*Will be populated after initial runs*

---

## Known Limitations

### Cannot Test (Requires Manual Intervention)
1. **SharePoint Sync**
   - Runs at 8pm SAST nightly
   - Validation would require waiting 24+ hours
   - Manual testing: Check SharePoint next morning

2. **WhatsApp Message Capture**
   - Requires posting to real WhatsApp group
   - Cannot automate WhatsApp posting via API
   - Manual testing: Post test drop and verify capture

3. **Python Cache Bug Reproduction**
   - Requires intentionally introducing bug
   - Requires not using safe restart script
   - Manual testing: Deploy buggy code, verify cache issue

4. **Service Crash Recovery**
   - Requires intentionally crashing service
   - May disrupt production monitoring
   - Manual testing: In dev environment only

### Validation Scope
This validation tests the **data flow** from existing drops, not the **message capture** from WhatsApp groups. It assumes:
- WhatsApp Bridge is working correctly
- Messages are being captured in SQLite
- Monitor services are processing messages

---

## Development Log

### 2025-11-24 - Initial Setup
- Created validation module structure
- Documented test scenarios
- Defined pass/fail criteria
- Ready to create validation command

---

## Next Steps

1. [ ] Create `/validate-wa-monitor` command in `.agent-os/commands/`
2. [ ] Run initial test (Run 1)
3. [ ] Document results in `results/2025-11-24-run-1.md`
4. [ ] Identify and fix false positives/negatives
5. [ ] Run 10 times total with optimization between runs
6. [ ] Certify as production-ready
7. [ ] Update status to ✅ Production Ready

---

## Questions / Decisions Needed

- **Test drop creation**: Use existing drops or create test drops programmatically?
- **SharePoint validation**: Accept limitation or add manual verification step?
- **Error injection**: Test error handling by intentionally causing failures?
- **Performance threshold**: What's acceptable validation duration? (Currently: 3-5 min target)

---

## References

- Implementation Guide: `docs/validation/IMPLEMENTATION_GUIDE.md`
- WA Monitor Documentation: `CLAUDE.md` (WhatsApp Monitor section)
- Service Restart Script: `/opt/wa-monitor/prod/restart-monitor.sh`
- Database Schema: Query `\d qa_photo_reviews` in psql
