# SOW Import Log 2025

## September 15, 2025 - Fibre Import for louissep15

### Import Summary
- **Date**: September 15, 2025
- **Time**: 12:53:26 - 12:53:28 SAST (10:53 UTC)
- **Import Type**: Fibre Cable Segments
- **Duration**: 2.62 seconds
- **Success**: ✅ Complete

### File Details
- **Source File**: `/home/louisdup/Downloads/Fibre_Lawley.xlsx`
- **File Type**: Excel (.xlsx)
- **Total Rows in File**: 686 (681 unique after deduplication)

### Project Details
- **Project Name**: louissep15
- **Project ID**: `e2a61399-275a-4c44-8008-e9e42b7a3501`
- **Database**: Neon PostgreSQL
- **Host**: `ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech`
- **Table**: `sow_fibre`

### Import Results
- **Records Imported**: 681 fibre segments
- **Records Skipped**: 5 (duplicates)
- **Total Cable Length**: 118,472 meters (118.47 km)
- **Import Speed**: 260 segments/second
- **Batch Size**: 500 records per batch
- **Total Batches**: 2

### Data Breakdown
| Category | Details |
|----------|---------|
| **Cable Types** | 4 types total |
| - 24F | 676 segments |
| - 96F | 2 segments |
| - 144F | 2 segments |
| - 288F | 1 segment |
| **Layers** | 3 types total |
| - Distribution | 633 segments |
| - Secondary Feeder | 43 segments |
| - Primary Feeder | 5 segments |
| **Status** | |
| - Completed | 508 segments |
| - Planned | 173 segments |
| **Contractors** | |
| - Velocity | 467 segments |
| - Elevate | 41 segments |

### Scripts Used
- **Import Script**: `/scripts/sow-import/import-fibre-louissep15.cjs`
- **Verification Script**: `/scripts/sow-import/verify-fibre-louissep15.cjs`
- **Neon Verification**: `/scripts/sow-import/verify-neon-direct.cjs`
- **Method**: pg library with dynamic placeholder generation
- **Base Script**: `/scripts/sow-import/run-import-fibre.cjs`

### Verification Confirmed
- ✅ Data verified in Neon database
- ✅ 681 records present in `sow_fibre` table
- ✅ Timestamps confirmed: 2025-09-15 10:53:26 - 10:53:28 UTC
- ✅ Sample data validated

### UI Access Points
- `/sow` - SOW Dashboard
- `/fiber-stringing` - Fiber Stringing Dashboard
- `/sow/list` - SOW List page
- **API**: `GET /api/sow/fibre?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501`

### Sample Imported Data
```
LAW.PF.288F.AGG.POP.01-MH.A001 | 288F | Primary Feeder | 32m | Completed
LAW.PF.96F.MH.A001-MH.A109 | 96F | Primary Feeder | 3018m | Completed
LAW.PF.144F.MH.A001-MH.A064 | 144F | Primary Feeder | 3369m | Completed
LAW.DF.24F.MH.A184-P.D458 | 24F | Distribution | 759m | Completed
```

---

## September 3, 2025 - Poles Import for louisProjectTestWed

*See `/SOW/docs/importlog.md` for details*

---

## Import Process Notes

### Standard Import Workflow
1. Create project in UI
2. Note the project ID from database
3. Edit import script with project ID and file path
4. Run import script: `node scripts/sow-import/import-{type}-{project}.cjs`
5. Verify with: `node scripts/sow-import/verify-{type}-{project}.cjs`
6. Check UI pages to confirm visibility

### Important Technical Notes
- Always use `pg` library, NOT `@neondatabase/serverless` for batch imports
- Batch size: 1000 for poles, 500 for fibre/drops
- Use multi-value INSERT with ON CONFLICT for upserts
- Clear existing data before re-import to avoid duplicates
- Deduplicate by unique ID field before import

### Performance Benchmarks
- Poles: ~95 records/second
- Fibre: ~260 records/second
- Drops: ~150 records/second (estimated)