# SOW Import Audit Log

**📊 For detailed 2025 imports, see: `/SOW/docs/sow-import-log-2025.md`**

## Import Record - 2025-09-15 (Drops Import for louissep15)

### Import Details
- **Date**: 2025-09-15
- **Time**: ~13:30 UTC
- **Project**: louissep15
- **Project ID**: e2a61399-275a-4c44-8008-e9e42b7a3501
- **Source File**: /home/louisdup/Downloads/Lawley Drops.xlsx
- **Records in Excel**: 23708

### Import Results ✅
- **Drops Successfully Imported**: 23707 (one duplicate merged)
- **Import Time**: 111.71 seconds
- **Processing Rate**: 212 drops/second
- **Batch Size Used**: 1000 records per batch
- **Total Batches**: 24

### Script Used
- **Script Location**: `/scripts/sow-import/run-import-drops.cjs`
- **Library**: pg (PostgreSQL client) - NOT @neondatabase/serverless
- **Method**: Dynamic placeholder generation with multi-value INSERT statements
- **Table**: sow_drops

### Data Quality
- **All drops have cable length**: ✅
- **Total Cable Length**: 919,145 meters (919.15 km)
- **Average Cable Length**: 38.77 meters
- **Unique Poles Referenced**: 2965
- **No duplicate drop numbers found**

### Verification Script
- **Location**: `/scripts/sow-import/verify-drops-louissep15.cjs`
- **Purpose**: Comprehensive verification with statistics and sample data

### UI Visibility
Data can be viewed at:
- `/sow` - SOW Dashboard
- `/sow/list` - SOW List page (Drops tab)
- API: `/api/sow/drops?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501`

---

## Import Record - 2025-09-15 (Poles Import for louissep15)

### Import Details
- **Date**: 2025-09-15
- **Time**: ~13:00 UTC
- **Project**: louissep15
- **Project ID**: e2a61399-275a-4c44-8008-e9e42b7a3501
- **Source File**: /home/louisdup/Downloads/Lawley Poles.xlsx
- **Records in Excel**: 4471

### Import Results ✅
- **Poles Successfully Imported**: 4471 (100% success rate)
- **Import Time**: 13.88 seconds
- **Processing Rate**: 322 poles/second
- **Batch Size Used**: 1000 records per batch
- **Total Batches**: 5

### Script Used
- **Script Location**: `/scripts/sow-import/run-import.cjs`
- **Based On**: Proven import method from Sep 3, 2025 import
- **Library**: pg (PostgreSQL client) - NOT @neondatabase/serverless
- **Method**: Dynamic placeholder generation with multi-value INSERT statements
- **Table**: sow_poles

### Data Quality
- **All poles have valid coordinates**: ✅
- **Latitude Range**: -26.405882 to -26.372889
- **Longitude Range**: 27.792007 to 27.833542
- **Status**: All poles marked as 'pending'
- **No duplicate pole numbers found**

### Verification Script
- **Location**: `/scripts/sow-import/verify-poles-louissep15.cjs`
- **Purpose**: Comprehensive verification with statistics and sample data

### UI Visibility
Data can be viewed at:
- `/sow` - SOW Dashboard
- `/sow/list` - SOW List page (Poles tab)
- API: `/api/sow/poles?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501`

---

## Import Record - 2025-09-15 (Fibre Import for louissep15)

### Import Details
- **Date**: 2025-09-15
- **Time**: ~12:40 UTC
- **Project**: louissep15
- **Project ID**: e2a61399-275a-4c44-8008-e9e42b7a3501
- **Source File**: /home/louisdup/Downloads/Fibre_Lawley.xlsx
- **Records in Excel**: 686 (681 unique after deduplication)

### Import Results ✅
- **Fibre Segments Successfully Imported**: 681 (100% success rate)
- **Total Cable Length**: 118,472 meters (118.47 km)
- **Import Time**: 2.62 seconds
- **Processing Rate**: 260 segments/second
- **Batch Size Used**: 500 records per batch
- **Total Batches**: 2

### Script Used
- **Script Location**: `/home/louisdup/VF/Apps/FF_React/scripts/sow-import/import-fibre-louissep15.cjs`
- **Based On**: Proven import method from `/scripts/sow-import/run-import-fibre.cjs`
- **Library**: pg (PostgreSQL client) - NOT @neondatabase/serverless
- **Method**: Dynamic placeholder generation with multi-value INSERT statements
- **Table**: sow_fibre

### Data Breakdown
- **Cable Types**: 4 types (24F: 676, 96F: 2, 144F: 2, 288F: 1)
- **Layers**: Distribution (633), Secondary Feeder (43), Primary Feeder (5)
- **Status**: 508 completed, 173 planned
- **Contractors**: Velocity (467 segments), Elevate (41 segments)

### Verification Script
- **Location**: `/home/louisdup/VF/Apps/FF_React/scripts/sow-import/verify-fibre-louissep15.cjs`
- **Purpose**: Comprehensive verification with statistics and sample data

### UI Visibility
Data can be viewed at:
- `/sow` - SOW Dashboard
- `/fiber-stringing` - Fiber Stringing Dashboard
- `/sow/list` - SOW List page
- API: `/api/sow/fibre?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501`

---

## Import Record - 2025-09-03

### Import Details
- **Date**: 2025-09-03
- **Time**: ~06:30 UTC  
- **Project**: louisProjectTestWed
- **Project ID**: 7e7a6d88-8da1-4ac3-a16e-4b7a91e83439
- **Source File**: /home/louisdup/Downloads/Lawley Poles.xlsx
- **Records in Excel**: 4471

### Import Results ✅
- **Poles Successfully Imported**: 4471 (100% success rate)
- **Skipped Records**: 0
- **Import Time**: 47.05 seconds
- **Processing Rate**: 95 poles/second
- **Batch Size Used**: 1000 records per batch
- **Total Batches**: 5

### Script Used
- **Script Location**: `/scripts/sow-import/run-import.cjs`
- **Method**: Fast batch import using proven GitHub implementation
- **Library**: pg (PostgreSQL client) - NOT @neondatabase/serverless
- **Approach**: Dynamic placeholder generation with multi-value INSERT statements
- **Implementation Reference**: https://github.com/VelocityFibre/FibreFlow_Firebase/tree/master/scripts/sow-import

### Database Configuration
- **Database**: Neon PostgreSQL (Serverless)
- **Connection String**: Uses DATABASE_URL from environment
- **Host**: ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech
- **SSL**: Required

### Technical Details
```javascript
// Batch processing pattern used:
INSERT INTO sow_poles (columns...) 
VALUES (row1), (row2), ..., (rowN)
ON CONFLICT (project_id, pole_number) DO UPDATE SET ...
```

### Key Improvements from Previous Attempts
1. **Used pg library** instead of @neondatabase/serverless
2. **Dynamic placeholder generation** for parameterized queries
3. **Batch size of 1000** for optimal performance
4. **Cleared existing data** before import to ensure fresh data
5. **Multi-value INSERT** statements instead of UNNEST

### Data Verification
- Initial poles in database: 1571
- After clearing and re-import: 4471
- All pole numbers are unique (no duplicates)
- Sample verified poles:
  - LAW.P.B353: (-26.38207620, 27.79685608)
  - LAW.P.A003: (-26.37840496, 27.80890143)
  - LAW.P.A004: (-26.37834830, 27.80927691)

### Performance Metrics
- Batch 1: 1000 poles @ 118/sec
- Batch 2: 2000 poles @ 106/sec  
- Batch 3: 3000 poles @ 101/sec
- Batch 4: 4000 poles @ 97/sec
- Batch 5: 4471 poles @ 95/sec

### Files Created/Modified
1. `/scripts/sow-import/run-import.cjs` - Working import script
2. `/scripts/sow-import/fast-batch-import.js` - Downloaded from GitHub
3. `/verify-import.cjs` - Database verification script
4. `/api/sow/poles.js` - Updated but reverted to working version

### Lessons Learned
1. The @neondatabase/serverless library has limitations with batch operations
2. The pg library with dynamic placeholders is more reliable for large batch inserts
3. Previous implementation (from GitHub) was superior and should be maintained
4. Always clear existing data when doing full re-imports to avoid confusion

### Next Steps
- Use this same approach for drops and fibre imports
- Consider implementing progress tracking in the UI
- Add error recovery for partial imports
- Document the working approach for future reference