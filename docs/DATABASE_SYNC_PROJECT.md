# Database Sync Project - SharePoint to Neon

**Date:** 28 October 2025
**Status:** In Progress
**Related Project:** VelocityFibre_DataHub

---

## 📋 What's Happening

We're building an **automated sync system** that pulls data from SharePoint Excel worksheets into our Neon database.

**Location:** `/home/louisdup/VF/VelocityFibre_DataHub/`

---

## 🏗️ Architecture Decision: Clean Tables + Views

### **New Database Structure:**

```
SharePoint → Raw Tables (sharepoint_*) → Views (sow_*) → FF App APIs → React Pages
```

### **Key Points:**

1. **New raw tables** mirror SharePoint structure exactly
   - `sharepoint_hld_pole` (matches HLD_Pole worksheet)
   - `sharepoint_hld_home` (matches HLD_Home worksheet)
   - ... 19 tables total

2. **Compatibility views** translate for our app
   - View `sow_poles` maps `sharepoint_hld_pole` → existing format
   - View `sow_drops` maps `sharepoint_hld_home` → existing format

3. **Zero code changes needed in this app** ✅
   - APIs query views (not direct tables)
   - Views handle column name translation
   - React components unaffected

---

## ✅ Impact on FF React App

### **What Changes:**
- ❌ **NOTHING** in this codebase!

### **What Stays the Same:**
- ✅ All API routes (`/pages/api/*`)
- ✅ All React components
- ✅ All TypeScript interfaces
- ✅ All queries continue to work

### **How It Works:**

**Before:**
```typescript
// API queries table directly
const poles = await sql`SELECT * FROM sow_poles WHERE project_id = ${id}`;
```

**After:**
```typescript
// API queries view (looks identical!)
const poles = await sql`SELECT * FROM sow_poles WHERE project_id = ${id}`;
// ^ sow_poles is now a VIEW, not a table, but code doesn't change
```

---

## 📊 Data Flow

```
SharePoint Excel (Lawley.xlsx)
    ↓ [Automated Sync - Hourly]
Neon Database (Raw Tables)
    sharepoint_hld_pole
    sharepoint_tracker_pole
    ↓ [Database Views - Real-time]
Compatibility Layer
    sow_poles (view)
    ↓ [Existing APIs - No Changes]
FF React App
    /pages/api/sow/poles.ts
    /pages/api/poles/index.ts
    ↓ [No Changes]
React Components
    PoleTrackerDashboard
    PoleCaptureMobile
```

---

## 🔍 What Tables/Views Are Affected

### **Views Being Created (Compatibility Layer)**

| View Name | Source Table(s) | Purpose |
|-----------|----------------|---------|
| `sow_poles` | `sharepoint_hld_pole` + `sharepoint_tracker_pole` | Pole inventory & status |
| `sow_drops` | `sharepoint_hld_home` + `sharepoint_tracker_home` | Home drops & connections |
| `sow_fibre` | `sharepoint_jdw_exp` + `sharepoint_tracker_stringing` | Fiber segments |
| `sow_onemap_mapping` | `sharepoint_1map_pole` | OneMap cross-reference |

### **APIs That Use These (No Changes Required)**

```
/pages/api/sow/poles.ts          → Uses sow_poles view
/pages/api/poles/index.ts        → Uses sow_poles view
/pages/api/sow/drops.ts          → Uses sow_drops view
/pages/api/sow/fibre.ts          → Uses sow_fibre view
```

---

## 🎯 Why This Approach?

### **Benefits for FF App:**

1. ✅ **Zero code changes** - App continues working immediately
2. ✅ **Automated data updates** - No more manual Excel imports
3. ✅ **Real-time sync** - Data always current
4. ✅ **Better data quality** - Single source of truth (SharePoint)
5. ✅ **Easy rollback** - Keep old tables as backup during transition

### **Example Column Mapping (Transparent to App):**

SharePoint has: `label_1`, `lat`, `lon`
View translates to: `pole_number`, `latitude`, `longitude`
App receives: `pole_number`, `latitude`, `longitude` (as expected!)

---

## ⏱️ Timeline

- **28 Oct 2025:** Planning & architecture finalized
- **28-29 Oct:** Create database tables & views
- **29-30 Oct:** Build sync connectors
- **30-31 Oct:** Testing & validation
- **01 Nov:** Deploy to production

**Expected completion:** Early November 2025

---

## 🧪 Testing Required (For This App)

### **After Views Are Created:**

1. **Test API Endpoints:**
   ```bash
   # Test poles endpoint
   curl http://localhost:3000/api/sow/poles?projectId=<test-project-id>

   # Should return poles in expected format
   ```

2. **Test Pages:**
   - Pole Tracker Dashboard
   - Pole Capture Mobile
   - Any SOW-related pages

3. **Verify Data Format:**
   - Check TypeScript interfaces still match
   - Ensure no TypeScript errors
   - Validate field names in UI

### **Expected Result:**
Everything should work exactly as before - just with fresher data!

---

## 📁 Related Documentation

**Main Project Files:**
- `/home/louisdup/VF/VelocityFibre_DataHub/docs/IMPLEMENTATION_PLAN.md`
- `/home/louisdup/VF/VelocityFibre_DataHub/MAPPING_STRATEGY.md`
- `/home/louisdup/VF/VelocityFibre_DataHub/FF_APP_ANALYSIS.md`

**FF App Analysis:**
- Shows detailed impact analysis for this app
- Column mapping documentation
- API compatibility verification

---

## 🚨 What to Watch For

### **Potential Issues (Low Risk):**

1. **Data type mismatches**
   - View should cast types correctly
   - Monitor for null/undefined issues

2. **Missing fields**
   - If SharePoint doesn't have a field FF app expects
   - View can provide default values

3. **Performance**
   - Views add negligible overhead
   - Existing indexes still work

### **If Something Breaks:**

1. Check view definitions: `/home/louisdup/VF/VelocityFibre_DataHub/src/database/migrations/002_create_compatibility_views.sql`
2. Verify data in raw tables: `SELECT * FROM sharepoint_hld_pole LIMIT 5`
3. Test view output: `SELECT * FROM sow_poles LIMIT 5`
4. Rollback: Keep old tables as backup

---

## 👥 Team Notes

### **For Frontend Developers:**
- No changes required in React components
- APIs return same data format
- Test locally when views are deployed

### **For Backend Developers:**
- API routes unchanged
- Can optimize queries later if needed
- Views handle all translation

### **For DevOps:**
- Monitor sync job performance
- Watch database connection pool
- Alert on sync failures

---

## 📞 Questions?

**For database/sync questions:**
- Check DataHub project documentation
- Review implementation plan
- Contact backend team

**For FF app compatibility:**
- Test with views locally
- Verify TypeScript interfaces
- Check API responses

---

## 🔄 Change Log

| Date | Change | Impact on FF App |
|------|--------|------------------|
| 28 Oct 2025 | Architecture decision: Views approach | None - backward compatible |
| 28 Oct 2025 | Started creating raw tables | None - views not yet deployed |
| TBD | Deploy views to database | None expected - test first |

---

**Status:** ✅ Planning Complete - Implementation In Progress
**Risk to FF App:** Very Low (views ensure compatibility)
**Action Required:** Test after views deployed (late Oct 2025)

---

**Note:** This file documents the database sync project's relationship to the FF React app. For full project details, see the VelocityFibre_DataHub repository.
