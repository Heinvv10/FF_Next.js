# SharePoint Replacement Investigation

**Date Started:** November 26, 2025
**Status:** Discovery Phase
**Goal:** Replace SharePoint Excel-based system with modern React application

---

## 🎯 Project Overview

### Current State
SharePoint is the **company-wide master data repository** that serves as the source of truth for:
- Multiple departments uploading/downloading data
- CSV and Excel file uploads
- MD pulling data for Power BI dashboards
- Cross-departmental data sharing

### Problem Statement
- **Slow API:** Microsoft Graph API times out when reading data (504 Gateway Timeout)
- **Limited functionality:** Excel sheets are not user-friendly for modern workflows
- **No real-time updates:** Data requires manual uploads/downloads
- **Poor user experience:** Requires SharePoint access, Excel knowledge
- **Difficult to maintain:** Version control issues, permission problems

### Vision
Replace SharePoint with a **modern React-based data management system** that:
- ✅ Fast database queries (Neon PostgreSQL - < 100ms)
- ✅ Real-time updates and collaboration
- ✅ Beautiful, intuitive UI
- ✅ Role-based permissions (Clerk authentication)
- ✅ Power BI integration (direct database connection or exports)
- ✅ Mobile-friendly
- ✅ API-first architecture (other systems can integrate)

---

## 📋 Discovery Questions

### A. SharePoint Structure

**Files and Sheets:**
- [ ] What Excel files exist in SharePoint? (List all)
- [ ] What sheets are in each file? (List all sheets per file)
- [ ] What is the primary/master tracker file?

**Known Files:**
1. `VF_Project_Tracker_Mohadin.xlsx`
   - `NeonDbase` sheet - Daily drop counts (Date | Project | Total Drops)
   - Other sheets: ???

---

### B. Data Types

**What data is stored in SharePoint?**
- [ ] Drop data (installation completions)?
- [ ] Project tracking (projects, timelines, budgets)?
- [ ] Contractor information (companies, teams, assignments)?
- [ ] Financial data (invoices, payments, costs)?
- [ ] Staff assignments (who works on what)?
- [ ] Equipment tracking (inventory, usage)?
- [ ] SOW data (Statement of Work details)?
- [ ] Other: _______________

---

### C. Data Flow - Uploads

**Who uploads data to SharePoint?**
- [ ] Field teams - What data? How often?
- [ ] QA team - What data? How often?
- [ ] Project managers - What data? How often?
- [ ] Finance team - What data? How often?
- [ ] Contractors - What data? How often?
- [ ] Other: _______________

**Upload Methods:**
- [ ] Manual CSV uploads?
- [ ] Manual Excel file uploads?
- [ ] Copy-paste from other systems?
- [ ] Automated scripts?
- [ ] Other: _______________

---

### D. Data Flow - Downloads

**Who reads/downloads from SharePoint?**
- [ ] Finance team - What do they extract?
- [ ] Project managers - What reports do they need?
- [ ] MD/Executive team - What metrics?
- [ ] Operations team - What data?
- [ ] Contractors - What do they access?
- [ ] Other departments: _______________

**Download Use Cases:**
- [ ] Generate reports?
- [ ] Billing/invoicing?
- [ ] Performance tracking?
- [ ] Compliance/auditing?
- [ ] Planning/forecasting?
- [ ] Other: _______________

---

### E. Power BI Integration

**Current Power BI Setup:**
- [ ] Which SharePoint sheets does Power BI connect to?
- [ ] What reports does the MD view?
- [ ] How often is Power BI refreshed? (Daily? Weekly?)
- [ ] What are the key metrics tracked?

**Power BI Reports/Dashboards:**
1. _______________
2. _______________
3. _______________

---

### F. Data Schemas

**For each sheet, document:**
- Sheet name: _______________
- Columns: _______________
- Purpose: _______________
- Who updates: _______________
- Who reads: _______________
- Update frequency: _______________

**Example:**
```
Sheet: "Projects"
Columns: Project Name | Client | Start Date | End Date | Status | Budget | Manager
Purpose: Master list of all active projects
Who updates: Project managers
Who reads: All departments, MD (Power BI)
Update frequency: Weekly
```

---

## 🏗️ Proposed React System Architecture

### Phase 1: Core Data Management
**Build React interfaces for:**
1. **Projects Module**
   - List view (table with filters)
   - Create/Edit forms
   - Project details page
   - Status tracking

2. **Drops Module**
   - Already exists in WA Monitor
   - Enhance with upload functionality
   - Add bulk import from CSV/Excel

3. **Contractors Module**
   - Already partially exists
   - Add team assignments
   - Add performance tracking

4. **Reports Module**
   - Daily/weekly/monthly reports
   - Export to CSV/PDF
   - Email scheduling

---

### Phase 2: Data Import/Export
**Build upload functionality:**
1. **CSV/Excel Import**
   - Drag-and-drop interface
   - Preview before import
   - Validation and error handling
   - Duplicate detection

2. **Bulk Operations**
   - Update multiple records
   - Delete with confirmation
   - Merge duplicate data

3. **Export Options**
   - CSV export (any data table)
   - Excel export with formatting
   - PDF reports
   - JSON API (for other systems)

---

### Phase 3: Power BI Integration
**Options:**

**Option A: Direct Database Connection** (Recommended)
- Power BI connects directly to Neon PostgreSQL
- Faster than SharePoint (no Excel file bottleneck)
- Real-time data (no sync delays)
- Easier to maintain

**Option B: Scheduled Exports**
- FibreFlow exports data to CSV/Excel nightly
- Upload to SharePoint or S3
- Power BI reads from exported file
- Similar to current workflow

**Option C: React Dashboards** (Long-term)
- Build dashboards in FibreFlow
- Replace Power BI entirely
- More control, better UX
- Fully integrated

---

### Phase 4: Advanced Features
1. **Real-time Collaboration**
   - Multiple users editing simultaneously
   - Change history/audit log
   - Comments and notes

2. **Workflow Automation**
   - Auto-approve drop completions
   - Send alerts for missing data
   - Generate reports automatically

3. **Role-Based Permissions**
   - Finance sees financial data only
   - Field teams see their projects only
   - Managers see everything
   - Configurable access control

---

## 📊 Data Migration Strategy

### Step 1: Inventory
- [ ] Document all SharePoint sheets
- [ ] Export current data to CSV
- [ ] Analyze data quality issues

### Step 2: Database Schema Design
- [ ] Create Neon DB tables for each sheet
- [ ] Define relationships between tables
- [ ] Add indexes for performance
- [ ] Write migration scripts

### Step 3: Data Import
- [ ] Import historical data to Neon
- [ ] Validate data integrity
- [ ] Test queries and reports

### Step 4: Parallel Operation
- [ ] Run both systems simultaneously
- [ ] Users test new React system
- [ ] Keep SharePoint as backup
- [ ] Iterate based on feedback

### Step 5: Cutover
- [ ] Train users on new system
- [ ] Migrate all workflows
- [ ] Archive SharePoint data
- [ ] Decommission old system

---

## 🎯 Success Metrics

**Performance:**
- [ ] Page load < 2 seconds
- [ ] Query response < 500ms
- [ ] Support 50+ concurrent users

**User Adoption:**
- [ ] 100% of departments using React system
- [ ] < 5 support tickets per week
- [ ] Positive user feedback

**Business Impact:**
- [ ] 50% reduction in time spent on data entry
- [ ] Real-time data availability (vs 8pm sync)
- [ ] Faster decision-making (instant reports)

---

## 🚀 Next Steps

### Immediate Actions Required:
1. **Document SharePoint structure**
   - Screenshot file/folder structure
   - List all Excel files and sheets
   - Export sample data from key sheets

2. **Identify stakeholders**
   - Who are the power users?
   - Who should be involved in design?
   - Who needs training?

3. **Define MVP scope**
   - Which sheets/data are most critical?
   - What's the minimum viable replacement?
   - What can be phase 2?

### Meeting Agenda:
- [ ] Review SharePoint with key users
- [ ] Document current workflows
- [ ] Gather pain points and requirements
- [ ] Prioritize features for MVP
- [ ] Set timeline and milestones

---

## 📝 Notes

### Current SharePoint → Neon Sync Status
- **Neon → SharePoint:** ✅ Working (nightly at 8pm SAST)
- **SharePoint → Neon:** ❌ Not implemented (API too slow)
- **Philosophy:** Neon DB is source of truth, SharePoint is just a report destination

### Technical Constraints
- Microsoft Graph API is too slow for reading large Excel files (504 timeouts)
- Cannot use SharePoint as a data source (read-only destination only)
- Must build upload functionality in React (don't pull from SharePoint)

### Key Decisions Made
1. ✅ Neon PostgreSQL as master database (not SharePoint)
2. ✅ React UI for all data entry/viewing
3. ✅ Power BI connects to Neon directly (not SharePoint)
4. ⏳ Keep SharePoint sync as backup/archive (decision pending)

---

## 📚 Related Documentation

- `docs/sharepoint/` - This directory (all SharePoint-related docs)
- `docs/wa-monitor/WA_MONITOR_SHAREPOINT_SYNC.md` - Current sync implementation
- `docs/DATABASE_SYNC_PROJECT.md` - Database synchronization architecture
- `src/modules/wa-monitor/` - WA Monitor module (example of React → Neon → SharePoint flow)

---

**Last Updated:** November 26, 2025
**Status:** Awaiting SharePoint structure documentation and stakeholder input
**Next Action:** Document SharePoint files/sheets and gather requirements
