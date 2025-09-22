# SOW Import Documentation
*Last Updated: September 16, 2025*

## Overview
This directory contains all documentation and scripts related to Statement of Work (SOW) data imports for the louissep15 project. The SOW data represents the planned network infrastructure including poles, drops, and fiber segments.

## Import Files

### Original Excel Files (September 15, 2025)
Located in: Various locations (Downloads, project folders)

1. **Poles Data**
   - Filename: LAW_Poles.xlsx or similar
   - Records: 4,471 poles
   - Format: Excel with pole numbers, GPS coordinates, status

2. **Drops Data**
   - Filename: LAW_Drops.xlsx or similar
   - Records: 23,707 drops
   - Format: Excel with drop numbers, pole associations, cable lengths

3. **Fibre Data**
   - Filename: LAW_Fibre.xlsx or similar
   - Records: 681 segments
   - Format: Excel with segment IDs, start/end points, cable specs

## Import Scripts

### Main Import Scripts
Located in: `/scripts/sow-import/`

#### 1. Poles Import
```bash
# Script: run-import.cjs or import-poles-louissep15.cjs
node scripts/sow-import/run-import.cjs <project_id> <poles_file.xlsx>
```
- Uses pg library for reliability
- Batch processing (1000 records per batch)
- Handles duplicates with ON CONFLICT
- Performance: ~200 poles/second

#### 2. Drops Import
```bash
# Script: run-import-drops.cjs
node scripts/sow-import/run-import-drops.cjs <project_id> <drops_file.xlsx>
```
- Batch size: 500 records
- Links to poles via pole_number
- Maintains cable specifications

#### 3. Fibre Import
```bash
# Script: import-fibre-louissep15.cjs
node scripts/sow-import/import-fibre-louissep15.cjs
```
- Imports fiber segments
- Links start/end points
- Performance: ~260 segments/second

### Normalized Import (Enhanced)
```bash
# Script: run-import-normalized.cjs
node scripts/sow-import/run-import-normalized.cjs <project_id> <poles_file.xlsx>
```
- Creates normalized pole numbers
- Auto-generates mappings
- Stores in `sow_poles_normalized` table

## Database Schema

### sow_poles Table
```sql
CREATE TABLE sow_poles (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL,
  pole_number VARCHAR(255),
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  status VARCHAR(50),
  pole_type VARCHAR(100),
  height VARCHAR(50),
  owner VARCHAR(255),
  raw_data JSONB,
  UNIQUE(project_id, pole_number)
)
```

### sow_drops Table
```sql
CREATE TABLE sow_drops (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL,
  drop_number VARCHAR(255),
  pole_number VARCHAR(255),
  cable_type VARCHAR(100),
  cable_length VARCHAR(50),
  start_point VARCHAR(255),
  end_point VARCHAR(255),
  raw_data JSONB,
  UNIQUE(project_id, drop_number)
)
```

### sow_fibre Table
```sql
CREATE TABLE sow_fibre (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL,
  segment_id VARCHAR(255),
  start_point VARCHAR(255),
  end_point VARCHAR(255),
  cable_type VARCHAR(100),
  cable_length NUMERIC,
  raw_data JSONB,
  UNIQUE(project_id, segment_id)
)
```

## Import Results (louissep15)

### Summary Statistics
- **Poles**: 4,471 imported (100% success)
- **Drops**: 23,707 imported (100% success)
- **Fibre**: 681 segments imported (100% success)

### Linking Results
- **Pole Linking**: 100% linked to OneMap field data
- **Drop Linking**: 53.4% linked to OneMap field data
- **Remaining**: Planned but not yet installed

## Verification Scripts

### Check Import Status
```bash
# Verify poles
node scripts/sow-import/verify-poles-louissep15.cjs

# Verify drops
node scripts/sow-import/verify-drops-louissep15.cjs

# Verify fibre
node scripts/sow-import/verify-fibre-louissep15.cjs
```

### Sample Verification Query
```sql
-- Check poles import
SELECT COUNT(*) FROM sow_poles WHERE project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501';
-- Result: 4,471

-- Check drops import
SELECT COUNT(*) FROM sow_drops WHERE project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501';
-- Result: 23,707

-- Check fibre import
SELECT COUNT(*) FROM sow_fibre WHERE project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501';
-- Result: 681
```

## Import Process Workflow

### Step 1: Prepare Excel Files
1. Obtain SOW data from planning team
2. Verify Excel format and column names
3. Place in accessible location

### Step 2: Run Imports
```bash
# Import all SOW data
PROJECT_ID="e2a61399-275a-4c44-8008-e9e42b7a3501"

# 1. Import poles
node scripts/sow-import/run-import.cjs $PROJECT_ID LAW_Poles.xlsx

# 2. Import drops
node scripts/sow-import/run-import-drops.cjs $PROJECT_ID LAW_Drops.xlsx

# 3. Import fibre
node scripts/sow-import/import-fibre-louissep15.cjs
```

### Step 3: Verify Imports
```bash
# Run verification scripts
node scripts/sow-import/verify-poles-louissep15.cjs
node scripts/sow-import/verify-drops-louissep15.cjs
node scripts/sow-import/verify-fibre-louissep15.cjs
```

### Step 4: Run Linking
```bash
# Link with OneMap data
node scripts/reconcile-sow-linking.js

# Generate report
node scripts/louissep15-final-report.js
```

## Common Issues & Solutions

### Issue 1: Duplicate Key Errors
**Solution**: Use ON CONFLICT clause in INSERT statements

### Issue 2: Column Name Mismatches
**Solution**: Check multiple column name variations (label_1, Label_1, pole_number)

### Issue 3: Date Format Issues
**Solution**: Handle Excel serial dates with proper conversion

### Issue 4: Memory Issues with Large Files
**Solution**: Process in batches (500-1000 records)

## Best Practices

1. **Always Backup Before Import**
   ```sql
   -- Create backup table
   CREATE TABLE sow_poles_backup AS SELECT * FROM sow_poles;
   ```

2. **Clear Existing Data for Clean Import**
   ```sql
   DELETE FROM sow_poles WHERE project_id = 'project_id';
   ```

3. **Use Transactions for Safety**
   ```javascript
   await client.query('BEGIN');
   // ... import logic
   await client.query('COMMIT');
   ```

4. **Log Import Statistics**
   - Track import speed
   - Count successes/failures
   - Save raw data for debugging

## Files in This Directory

| File | Description |
|------|-------------|
| SOW_IMPORT_DOCUMENTATION.md | This file |
| SOW_IMPORT_PROCESS.md | Detailed import process |
| importlog.md | Historical import logs |
| sow-import-log-2025.md | 2025 import history |

## Related Documentation

- `/imports/SOW_LINKING_VERIFICATION.md` - Linking logic documentation
- `/imports/SOW_LINKING_FIX_SUMMARY.md` - Linking fixes applied
- `/imports/ACTUAL_DATA_ANALYSIS.md` - Data analysis results
- `/scripts/sow-import/` - All import scripts

## Support

For import issues:
1. Check Excel file format
2. Verify project ID
3. Review error logs
4. Check database connectivity
5. Ensure sufficient permissions

---
*End of SOW Import Documentation*