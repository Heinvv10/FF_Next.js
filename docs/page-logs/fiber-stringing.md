# Fiber Stringing Page Log

## Page Overview
**Path**: `/fiber-stringing`
**Purpose**: Track fiber cable installation progress across network sections
**Status**: ⚠️ Using mock data - awaiting real data source

---

## September 15, 2025 - Data Source Investigation

### Issue
Page shows all zeros despite having 681 fibre segments imported in database

### Investigation Results
- **Root Cause**: Page uses hardcoded mock data instead of real API
- **Location**: `/src/modules/projects/fiber-stringing/FiberStringingDashboard/hooks/useFiberStringingDashboard.ts:29`
- **Comment in code**: `// Load fiber sections - TODO: Replace with actual API call`

### Data Mismatch
The page expects different data structure than what SOW fibre import provides:

**Current SOW Fibre Data** (from import):
- `segment_id` - e.g., "LAW.PF.288F.AGG.POP.01-MH.A001"
- `cable_size` - e.g., "288F"
- `layer` - e.g., "Primary Feeder"
- `distance` - length in meters
- `contractor` - e.g., "Velocity"
- `status` - completed/planned

**Fiber Stringing Page Expects**:
- `sectionName` - descriptive name
- `fromPole` / `toPole` - start/end points
- `progress` - percentage complete (0-100)
- `team` - assigned team
- `startDate` / `completionDate` - timeline data

### Resolution Plan
**This page requires different data source** - Data will come from QGIS exports provided by Jean

### Action Items
- [ ] Await QGIS export format specification from Jean
- [ ] Create import process for QGIS fiber stringing data
- [ ] Create new database table for progress tracking
- [ ] Connect page to real API once data available

---

## Data Sources

### Current (Not Connected)
- **SOW Fibre Data**: `/api/sow/fibre` - Infrastructure planning data
- **Table**: `sow_fibre` - Contains cable segments but not installation progress

### Future (Pending from Jean)
- **Source**: QGIS (Geographic Information System)
- **Provider**: Jean
- **Expected Format**: TBD (likely GeoJSON, Shapefile, or CSV export from QGIS)
- **Expected Data**: Installation progress, geographic routes, team assignments, completion percentages
- **Target Table**: TBD (likely `fiber_stringing_progress`)

---

## Technical Notes

### Mock Data Location
```typescript
// File: useFiberStringingDashboard.ts
// Lines: 30-81
// Contains hardcoded mock sections
```

### API Endpoint (Future)
```typescript
// TODO: Create endpoint
// GET /api/fiber-stringing/progress?projectId={ID}
```

### Transform Requirements
If connecting to SOW data (temporary solution):
1. Parse segment_id to extract from/to points
2. Calculate progress from status field
3. Map contractor to team
4. Use created_at for start date

---

## Related Documentation
- `/imports/SOW_IMPORT_PROCESS.md` - Import process documentation
- `/imports/README.md` - Import overview
- `/SOW/docs/sow-import-log-2025.md` - Import logs

---

## Status Summary
⚠️ **Page Status**: Functional but showing mock data
📊 **Data Status**: SOW data imported but incompatible structure
🔄 **Next Steps**: Awaiting Juan's data source specification