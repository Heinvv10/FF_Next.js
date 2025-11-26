# SharePoint Documentation

This directory contains all documentation related to SharePoint integration and the ongoing project to replace SharePoint with a modern React-based system.

---

## 📁 Directory Contents

### Current Files

1. **`SHAREPOINT_REPLACEMENT_INVESTIGATION.md`**
   - Discovery document for replacing SharePoint with React system
   - Questions that need answers about current SharePoint structure
   - Proposed architecture for React replacement
   - Data migration strategy

---

## 🎯 Project Status

### Current Situation
- **SharePoint Role:** Company-wide master data repository (source of truth)
- **Problem:** Slow API, poor UX, limited functionality
- **Goal:** Replace with modern React + Neon DB system
- **Status:** Discovery phase - gathering requirements

### What Works Today
- ✅ **Neon → SharePoint Sync:** Daily sync at 8pm SAST (writes drop counts)
- ✅ **WA Monitor:** Drop data flows from WhatsApp → Neon → SharePoint
- ✅ **Email Notifications:** Sync success/failure alerts

### What Doesn't Work
- ❌ **SharePoint → Neon:** Microsoft Graph API too slow (504 timeouts)
- ❌ **User Experience:** Excel-based workflows are clunky
- ❌ **Real-time Updates:** Data only syncs once daily
- ❌ **Collaboration:** No concurrent editing, version control issues

---

## 🗂️ SharePoint Integration Overview

### Data Flow (Current)
```
WhatsApp Groups
    ↓
VPS Drop Monitor
    ↓
Neon Database (SOURCE OF TRUTH)
    ↓
SharePoint Sync (8pm nightly)
    ↓
SharePoint Excel Files (REPORTING DESTINATION)
    ↓
Power BI Dashboards (MD views)
```

### Key Principle
**Neon DB is the master database.** SharePoint is just a reporting/backup destination.

We do NOT read from SharePoint (API too slow). All data entry must happen in React → Neon.

---

## 📊 Known SharePoint Files

### 1. VF_Project_Tracker_Mohadin.xlsx
**Known Sheets:**
- `NeonDbase` - Daily drop counts per project (Date | Project | Total Drops)
- Other sheets: To be documented

**Purpose:** Project tracking and drop monitoring

**Users:**
- MD: Views Power BI dashboard
- Project managers: Update project info
- Finance: Pull data for billing
- QA team: Track drop completions

---

## 🚀 Replacement Strategy

### Phase 1: Discovery (Current)
- [ ] Document all SharePoint files and sheets
- [ ] Identify all data types and workflows
- [ ] Map who uploads/downloads what
- [ ] Understand Power BI dependencies
- [ ] Gather stakeholder requirements

### Phase 2: MVP Design
- [ ] Design Neon DB schema
- [ ] Build React UI for critical workflows
- [ ] Implement CSV/Excel import
- [ ] Build key reports
- [ ] Connect Power BI to Neon DB

### Phase 3: Migration
- [ ] Import historical data to Neon
- [ ] Run parallel systems (SharePoint + React)
- [ ] Train users on new system
- [ ] Validate data accuracy
- [ ] Cutover to React system

### Phase 4: Decommission
- [ ] Archive SharePoint data
- [ ] Update Power BI connections
- [ ] Remove SharePoint dependencies
- [ ] Monitor for issues

---

## 🔧 Technical Implementation

### Current Sync Implementation
**Files:**
- `pages/api/wa-monitor-sync-sharepoint.ts` - API endpoint
- `scripts/sync-wa-monitor-sharepoint.js` - Cron job script
- `scripts/migrations/add-sharepoint-sync-state.sql` - Database counter

**How it works:**
1. Query Neon DB for today's drop counts
2. Get next available row from `sharepoint_sync_state` table
3. Write data to SharePoint Excel (Date | Project | Count)
4. Update row counter in database
5. Send email notification

**Performance:**
- Duration: ~20 seconds (write-only, no reads)
- Reliability: 100% (since Nov 13, 2025 after fixing cache issue)
- Schedule: Runs nightly at 8pm SAST via cron

### Why We Don't Read from SharePoint
**Problem:** Microsoft Graph API times out when reading large Excel files
```
HTTP 504: Gateway Timeout
"We couldn't finish what you asked us to do because it was taking too long"
```

**Solution:** Never read from SharePoint. Build upload functionality in React instead.

---

## 📚 Related Modules

### WA Monitor Module
**Location:** `src/modules/wa-monitor/`

**Demonstrates the pattern:**
1. WhatsApp data → VPS monitor
2. VPS monitor → Neon DB (source of truth)
3. React dashboard reads from Neon (fast!)
4. Optional: Sync summary to SharePoint for reporting

**Key Lessons:**
- Keep all data in Neon DB
- Build React UI for viewing/editing
- Use SharePoint only for compatibility/backup
- Power BI can connect to Neon directly

---

## 🤝 Stakeholders

### To Be Documented
- [ ] Who are the key SharePoint users?
- [ ] Which departments depend on it?
- [ ] Who should be involved in replacement project?
- [ ] Who needs training on new system?

### Questions to Ask
1. What data do you upload to SharePoint?
2. What data do you download from SharePoint?
3. What reports do you generate?
4. What are your biggest pain points?
5. What features would make your work easier?

---

## 📖 Additional Resources

### In This Repository
- `/docs/wa-monitor/` - WA Monitor module docs (example architecture)
- `/docs/DATABASE_SYNC_PROJECT.md` - Database sync strategies
- `/src/modules/wa-monitor/` - Reference implementation

### External
- [Microsoft Graph API Docs](https://learn.microsoft.com/en-us/graph/api/overview)
- [Neon PostgreSQL Docs](https://neon.tech/docs/introduction)
- [Power BI Neon Connector](https://neon.tech/docs/guides/power-bi)

---

## 🆘 Support

### If SharePoint Sync Fails
1. Check logs: `ssh root@72.60.17.245 "tail -100 /var/log/wa-monitor-sharepoint-sync.log"`
2. Verify env vars: `grep SHAREPOINT /var/www/fibreflow/.env.production`
3. Test manually: `cd /var/www/fibreflow && node scripts/sync-wa-monitor-sharepoint.js`
4. See: `docs/wa-monitor/WA_MONITOR_SHAREPOINT_SYNC.md`

### If You Need to Access SharePoint
**⚠️ WARNING:** Reading from SharePoint is slow and often times out.

If you must:
```bash
node scripts/read-sharepoint-data.js
# Expect 504 errors for large files
```

---

**Last Updated:** November 26, 2025
**Status:** Discovery phase - gathering SharePoint structure information
**Next Action:** Document SharePoint files, sheets, and workflows
