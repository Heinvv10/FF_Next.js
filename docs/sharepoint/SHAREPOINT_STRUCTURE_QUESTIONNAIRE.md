# SharePoint Structure Questionnaire

**Purpose:** Document the current SharePoint structure to design a proper React replacement.

**Instructions:** Please fill out this questionnaire as completely as possible. Screenshots are very helpful!

---

## 📂 Section 1: File Structure

### 1.1 What Excel files exist in SharePoint?

List all `.xlsx` files:

1. `VF_Project_Tracker_Mohadin.xlsx` ✅ (Known)
2. _______________
3. _______________
4. _______________
5. _______________

**[📷 Screenshot Request: SharePoint file list]**

---

## 📊 Section 2: File Details

### For each file, document the sheets:

---

### File 1: VF_Project_Tracker_Mohadin.xlsx

**Sheets in this file:**

1. **NeonDbase** ✅ (Known)
   - Columns: Date | Project | Total Drops
   - Purpose: Daily drop submission counts
   - Updated by: Automated sync (8pm nightly)
   - Read by: MD (Power BI), Project managers

2. **[Sheet Name]:** _______________
   - Columns: _______________
   - Purpose: _______________
   - Updated by: _______________
   - Read by: _______________

3. **[Sheet Name]:** _______________
   - Columns: _______________
   - Purpose: _______________
   - Updated by: _______________
   - Read by: _______________

**[📷 Screenshot Request: Sheet tabs at bottom of Excel]**
**[📷 Screenshot Request: One complete sheet showing all columns and sample data]**

---

### File 2: [File Name]

**Sheets in this file:**

1. **[Sheet Name]:** _______________
   - Columns: _______________
   - Purpose: _______________
   - Updated by: _______________
   - Read by: _______________

2. **[Sheet Name]:** _______________
   - Columns: _______________
   - Purpose: _______________
   - Updated by: _______________
   - Read by: _______________

**[📷 Screenshot Request: Sheet tabs and sample data]**

---

### File 3: [File Name]
*(Copy template above for additional files)*

---

## 👥 Section 3: User Roles & Workflows

### 3.1 Who uploads data to SharePoint?

| User/Team | What Data | How Often | Method (CSV/Excel/Manual) | Which Sheet |
|-----------|-----------|-----------|---------------------------|-------------|
| Field teams | _________ | _________ | _________________________ | ___________ |
| QA team | _________ | _________ | _________________________ | ___________ |
| Project managers | _________ | _________ | _________________________ | ___________ |
| Finance team | _________ | _________ | _________________________ | ___________ |
| Other: ______ | _________ | _________ | _________________________ | ___________ |

---

### 3.2 Who downloads/reads data from SharePoint?

| User/Team | What Data | How Often | Purpose | Which Sheet |
|-----------|-----------|-----------|---------|-------------|
| MD/Executive | ________ | ________ | Power BI dashboards | _________ |
| Finance | ________ | ________ | _______________ | _________ |
| Project managers | ________ | ________ | _______________ | _________ |
| Operations | ________ | ________ | _______________ | _________ |
| Other: ______ | ________ | ________ | _______________ | _________ |

---

### 3.3 What are the key workflows?

**Example:**
- Field teams upload drop completion CSV weekly
- QA team marks drops as "Approved" or "Rejected" in SharePoint
- Finance downloads approved drops for billing
- MD views Power BI dashboard connected to SharePoint

**Your workflows:**

**Workflow 1:** Upload drops data
1. _______________
2. _______________
3. _______________

**Workflow 2:** _______________
1. _______________
2. _______________
3. _______________

**Workflow 3:** _______________
1. _______________
2. _______________
3. _______________

---

## 📈 Section 4: Power BI Integration

### 4.1 Which sheets does Power BI connect to?

- [ ] `NeonDbase` sheet
- [ ] _______________
- [ ] _______________
- [ ] _______________

---

### 4.2 What Power BI dashboards/reports does the MD view?

1. **[Dashboard Name]:** _______________
   - Metrics shown: _______________
   - Data source: _______________ (which sheets)
   - Refresh frequency: _______________

2. **[Dashboard Name]:** _______________
   - Metrics shown: _______________
   - Data source: _______________
   - Refresh frequency: _______________

**[📷 Screenshot Request: Power BI dashboard (if possible)]**

---

### 4.3 What are the key metrics tracked in Power BI?

Examples: Total drops, completion rate, project status, budget vs actual, etc.

1. _______________
2. _______________
3. _______________
4. _______________
5. _______________

---

## 🗂️ Section 5: Data Types & Details

### 5.1 Check all data types stored in SharePoint:

- [ ] Drop data (installation completions)
- [ ] Project tracking (timelines, budgets, status)
- [ ] Contractor information (companies, teams)
- [ ] Financial data (invoices, payments, costs)
- [ ] Staff assignments (who works on what)
- [ ] Equipment tracking (inventory)
- [ ] SOW data (Statement of Work)
- [ ] Client information
- [ ] Procurement data
- [ ] Other: _______________

---

### 5.2 For each data type, what are the key fields?

**Example - Drop Data:**
```
Fields: Drop Number, Project, Date, Status, QA Result, Technician, Notes
Required fields: Drop Number, Project, Date
Unique identifier: Drop Number
```

**Drop Data:**
- Fields: _______________
- Required fields: _______________
- Unique identifier: _______________

**Project Data:**
- Fields: _______________
- Required fields: _______________
- Unique identifier: _______________

**Contractor Data:**
- Fields: _______________
- Required fields: _______________
- Unique identifier: _______________

*(Continue for other data types)*

---

## 😫 Section 6: Pain Points

### 6.1 What are the biggest problems with the current SharePoint system?

Examples: Slow to load, hard to find data, version conflicts, permission issues, etc.

1. _______________
2. _______________
3. _______________
4. _______________
5. _______________

---

### 6.2 What takes the most time in your daily workflow?

1. _______________
2. _______________
3. _______________

---

### 6.3 What errors or issues happen frequently?

1. _______________
2. _______________
3. _______________

---

## 🎯 Section 7: Wish List

### 7.1 What features would make your work easier?

Examples: Real-time updates, better search, mobile access, automated reports, etc.

1. _______________
2. _______________
3. _______________
4. _______________
5. _______________

---

### 7.2 What reports do you wish you could generate easily?

1. _______________
2. _______________
3. _______________

---

### 7.3 What would you like to automate?

1. _______________
2. _______________
3. _______________

---

## 🔗 Section 8: SharePoint Links

### 8.1 SharePoint Site URL
https://_______________

---

### 8.2 Direct links to key files

1. VF_Project_Tracker_Mohadin.xlsx: https://blitzfibre.sharepoint.com/:x:/s/Velocity_Manco/EYm7g0w6Y1dFgGB_m4YlBxgBeVJpoDXAYjdvK-ZfgHoOqA ✅ (Known)
2. _______________: https://_______________
3. _______________: https://_______________

---

## 📸 Section 9: Screenshots Checklist

Please provide screenshots of:

- [ ] SharePoint site home page (showing all files/folders)
- [ ] File list (all Excel files visible)
- [ ] Each Excel file opened (showing sheet tabs at bottom)
- [ ] Sample data from key sheets (showing all columns)
- [ ] Power BI dashboard (if accessible)
- [ ] Upload workflow (how you upload CSV/Excel)
- [ ] Download workflow (how you download reports)

**Screenshot naming convention:**
- `sharepoint_homepage.png`
- `file_list.png`
- `VF_Project_Tracker_sheets.png`
- `NeonDbase_sheet_sample.png`
- `powerbi_dashboard.png`

**Save screenshots to:** `docs/sharepoint/screenshots/`

---

## 🤝 Section 10: Stakeholders

### 10.1 Who should be involved in designing the replacement?

**Key users (must consult):**
1. _______________
2. _______________
3. _______________

**Power users (good to consult):**
1. _______________
2. _______________
3. _______________

**Approvers (must sign off):**
1. _______________
2. _______________

---

### 10.2 Who needs training on the new system?

- [ ] All staff (everyone)
- [ ] Management only
- [ ] Specific teams: _______________

---

### 10.3 Who can provide technical details about Power BI setup?

Name: _______________
Email: _______________

---

## ✅ Completion Status

**Sections Completed:**
- [ ] Section 1: File Structure
- [ ] Section 2: File Details
- [ ] Section 3: User Roles & Workflows
- [ ] Section 4: Power BI Integration
- [ ] Section 5: Data Types & Details
- [ ] Section 6: Pain Points
- [ ] Section 7: Wish List
- [ ] Section 8: SharePoint Links
- [ ] Section 9: Screenshots
- [ ] Section 10: Stakeholders

**Completed by:** _______________
**Date:** _______________
**Follow-up needed:** _______________

---

## 📧 Next Steps

Once completed, please:
1. Save this file with your responses
2. Upload screenshots to `docs/sharepoint/screenshots/`
3. Share with development team
4. Schedule follow-up meeting to review

**Questions?** Contact: _______________

---

**Document Version:** 1.0
**Created:** November 26, 2025
**Template maintained in:** `docs/sharepoint/SHAREPOINT_STRUCTURE_QUESTIONNAIRE.md`
