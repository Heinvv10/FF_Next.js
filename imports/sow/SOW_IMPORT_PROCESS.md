# SOW Import Process - Detailed Guide

## Step 1: SOW Data Import (After Project Creation)

### Prerequisites
1. Create project via UI (`/projects/new`)
2. Note the project ID from database
3. Ensure you have the Excel source files

---

## 1a. Fibre Cable Import

### Source Files
- **Location**: `/home/louisdup/Downloads/`
- **Example**: `Fibre_Lawley.xlsx`
- **Format**: Excel with columns:
  - `label` - Segment ID (e.g., "LAW.PF.288F.AGG.POP.01-MH.A001")
  - `cable size` - Cable type (e.g., "288F", "96F", "144F", "24F")
  - `layer` - Network layer (Primary Feeder, Secondary Feeder, Distribution)
  - `length` - Distance in meters
  - `pon_no` - PON number
  - `zone_no` - Zone number
  - `String Com` - String completed length
  - `Date Comp` - Completion date
  - `Contractor` - Contractor name (Velocity, Elevate, etc.)
  - `Complete` - Status (Yes/No)

### Import Script
```bash
# Edit script to set PROJECT_ID and file path
vi /scripts/sow-import/import-fibre-{projectname}.cjs

# Run import
node /scripts/sow-import/import-fibre-{projectname}.cjs
```

### Database Details
- **Table**: `sow_fibre`
- **Key Fields**:
  - `project_id` - Links to project
  - `segment_id` - Unique segment identifier
  - `cable_size` - Cable specification
  - `distance` - Length in meters
  - `status` - completed/planned
  - `contractor` - Assigned contractor

### Verification
```bash
# Run verification script
node /scripts/sow-import/verify-fibre-{projectname}.cjs

# Check in database
node /scripts/sow-import/verify-neon-direct.cjs
```

### Import Log Example
```
Date: 2025-09-15
Project: louissep15 (e2a61399-275a-4c44-8008-e9e42b7a3501)
File: Fibre_Lawley.xlsx
Records: 681 imported (686 in file, 5 duplicates removed)
Total Length: 118.47 km
Performance: 260 segments/second
```

---

## 1b. Poles Infrastructure Import

### Source Files
- **Location**: `/home/louisdup/Downloads/`
- **Example**: `Lawley Poles.xlsx`
- **Format**: Excel with columns:
  - `label_1` - Pole number
  - `lat`/`latitude` - Latitude coordinate
  - `lon`/`longitude` - Longitude coordinate
  - `type` - Pole type
  - `height` - Pole height
  - `status` - Installation status

### Import Script
```bash
# Edit script for project
vi /scripts/sow-import/run-import.cjs

# Run import
node /scripts/sow-import/run-import.cjs
```

### Database Details
- **Table**: `sow_poles`
- **Key Fields**:
  - `project_id` - Links to project
  - `pole_number` - Unique pole ID
  - `latitude`, `longitude` - GPS coordinates
  - `status` - planned/installed/active

### Import Log Example
```
Date: 2025-09-03
Project: louisProjectTestWed
Records: 4471 poles
Performance: 95 poles/second
```

---

## 1c. Drops (Customer Connections) Import

### Source Files
- **Location**: `/home/louisdup/Downloads/`
- **Example**: `Lawley Drops.xlsx`
- **Format**: Excel with columns:
  - Drop ID
  - Pole number (reference)
  - Customer address
  - Cable type
  - Distance

### Import Script
```bash
# Edit script for project
vi /scripts/sow-import/run-import-drops.cjs

# Run import
node /scripts/sow-import/run-import-drops.cjs
```

### Database Details
- **Table**: `sow_drops`
- **Key Fields**:
  - `project_id` - Links to project
  - `drop_id` - Unique drop identifier
  - `pole_id` - References sow_poles
  - `address` - Customer location
  - `status` - planned/installed

---

## Technical Notes

### Import Method
- **Library**: `pg` (PostgreSQL client)
- **NOT**: `@neondatabase/serverless` (has batch limitations)
- **Approach**: Multi-value INSERT with ON CONFLICT
- **Batch Size**: 1000 for poles, 500 for fibre/drops

### Performance Benchmarks
| Data Type | Records/Second | Batch Size |
|-----------|---------------|------------|
| Poles | ~95/sec | 1000 |
| Fibre | ~260/sec | 500 |
| Drops | ~150/sec | 500 |

### Common Issues & Solutions
1. **Duplicate Records**: Use ON CONFLICT to handle
2. **Memory Issues**: Reduce batch size
3. **Connection Timeout**: Use connection pooling
4. **Data Validation**: Pre-process with deduplication

---

## UI Visibility

### Where to View Imported SOW Data
1. **SOW Dashboard**: `/sow`
2. **SOW List**: `/sow/list`
3. **API Endpoints**:
   - GET `/api/sow/fibre?projectId={ID}`
   - GET `/api/sow/poles?projectId={ID}`
   - GET `/api/sow/drops?projectId={ID}`

### Pages Not Yet Connected
- `/fiber-stringing` - Awaiting Juan's data (different data source)

---

## Import Checklist

- [ ] Project created in UI
- [ ] Project ID noted
- [ ] Source Excel files ready
- [ ] Import script edited with correct PROJECT_ID
- [ ] Import script executed
- [ ] Verification script run
- [ ] Database checked
- [ ] Import logged in `/imports/logs/`
- [ ] UI pages verified

---

## File Locations Reference

### Scripts
- `/scripts/sow-import/` - All import scripts
- `/scripts/sow-import/import-fibre-{project}.cjs` - Fibre import
- `/scripts/sow-import/run-import.cjs` - Poles import
- `/scripts/sow-import/run-import-drops.cjs` - Drops import

### Logs
- `/imports/logs/sow/fibre/` - Fibre import logs
- `/imports/logs/sow/poles/` - Poles import logs
- `/imports/logs/sow/drops/` - Drops import logs
- `/SOW/docs/sow-import-log-2025.md` - Detailed 2025 log

### Source Data
- `/home/louisdup/Downloads/` - Excel source files

---

## Next Steps - Pending Data

### Fiber Stringing Progress (From Jean via QGIS)
- **Status**: ⚠️ AWAITING DATA
- **Source**: QGIS (Geographic Information System) exports
- **Provider**: Jean
- **Target Page**: `/fiber-stringing`
- **Expected Format**:
  - GeoJSON (geographic features with properties)
  - Shapefile (.shp with .dbf, .shx files)
  - CSV export with coordinates
  - KML/KMZ (Google Earth format)
- **Expected Fields**:
  - Geographic routes/paths
  - Section progress percentages
  - Team assignments
  - Installation dates
  - Completion status
  - Coordinate data (lat/lng)
- **Action**: Create import script once QGIS export format is confirmed