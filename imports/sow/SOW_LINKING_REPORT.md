# SOW Linking Verification Report
*Generated: September 16, 2025*

## Executive Summary
The SOW linking system is **partially implemented** as documented. The API endpoint exists at `/api/onemap/properties.ts:19-29` and correctly performs LEFT JOINs between OneMap field data and SOW planning data. However, testing with real data reveals a **critical issue**: No poles are currently linked between SOW and OneMap despite having data in both tables.

## Documentation vs Implementation Status

### ✅ Correctly Implemented
1. **API Endpoint** - `/api/onemap/properties.ts`
   - Uses LEFT JOIN as documented
   - Preserves all OneMap records
   - Filters by project_id correctly

2. **Table Structure** - All required columns exist:
   - `onemap_properties.pole_number`
   - `onemap_properties.drop_number`
   - `sow_poles.pole_number`
   - `sow_drops.drop_number`

### ❌ Critical Issues Found

#### Issue 1: Pole Number Format Mismatch
**Problem**: No poles are linking between SOW and OneMap
- **SOW Format**: `LAW.P.A001`, `LAW.P.A002`, etc.
- **OneMap Format**: `LAW.P.D524`, `LAW.P.B850`, etc.
- **Result**: 0% linking rate for poles

**Evidence from Database**:
```
SOW Poles (project: louissep15):
- LAW.P.A001 (exists in SOW)
- LAW.P.A002 (exists in SOW)

OneMap Properties:
- LAW.P.D524 (exists in field)
- LAW.P.B850 (exists in field)

Matches Found: NONE
```

#### Issue 2: Project Data Distribution
```
Project: Lawley (31c6184f-ad32-47ce-9930-25073574cdcd)
- SOW Poles: 0 (no data!)
- SOW Drops: 23,707
- OneMap Properties: 32,562 (shared across all projects)

Project: louissep15 (e2a61399-275a-4c44-8008-e9e42b7a3501)
- SOW Poles: 15,607 (has pole data)
- SOW Drops: 0
```

## Real Data Examples

### Example 1: Unlinked Pole (Field Work)
```json
OneMap Property: 515500
├─ Pole: LAW.P.D524
├─ Drop: DR1732150
├─ Status: "Home Sign Ups: Approved & Installation Scheduled"
├─ Location: 72 HLANGANANI STREET LAWLEY
└─ SOW Match: ❌ NONE - Shows as "Not Linked"
```

### Example 2: SOW Pole (Planning)
```json
SOW Pole: LAW.P.A001
├─ Project: louissep15
├─ Status: "Permission not granted"
├─ Location: (-26.378490, 27.808375)
├─ Owner: PlanNet
└─ OneMap Match: ❌ NONE - No field record exists
```

### Example 3: Drop Linking (Working Better)
```json
Drop: DR1737348
├─ SOW: Exists in Lawley project
├─ From Pole: LAW.P.A002
├─ To: LAW.ONT.DR1737348
├─ Length: 40m
└─ Status: Potentially linkable (needs verification)
```

## Linking Statistics

### Current State (Lawley Project)
- **Linked Poles**: 0 (0%)
- **Unlinked Field Work**: 32,562 properties with poles
- **Missing Field Work**: Cannot determine (no SOW poles in Lawley)

### Root Causes
1. **Naming Convention Mismatch**: SOW uses "A###" series, OneMap uses "D###", "B###" series
2. **Project Segregation**: Poles in one project, drops in another
3. **No Data Normalization**: Pole numbers not standardized before matching

## Recommendations

### Immediate Actions
1. **Verify Pole Naming Convention**
   - Check if LAW.P.A001 should match LAW.P.D524
   - Confirm with field teams on naming standards

2. **Data Cleanup Required**
   ```sql
   -- Check for pattern matches
   SELECT DISTINCT
     SUBSTRING(pole_number FROM 'LAW\.P\.([A-Z])') as prefix
   FROM sow_poles
   UNION
   SELECT DISTINCT
     SUBSTRING(pole_number FROM 'LAW\.P\.([A-Z])') as prefix
   FROM onemap_properties
   WHERE pole_number IS NOT NULL;
   ```

3. **Import Verification**
   - Re-run imports ensuring correct project_id
   - Verify pole number mapping logic

### Long-term Solutions
1. **Add Fuzzy Matching Logic**
   - Match on location (lat/lng proximity)
   - Use address matching as secondary key

2. **Data Validation Rules**
   - Enforce pole naming conventions
   - Add validation before import

3. **Manual Mapping Interface**
   - UI to manually link unmatched poles
   - Bulk correction tools

## Test Queries for Verification

```sql
-- Find potential matches by location proximity
SELECT
  op.pole_number as onemap_pole,
  sp.pole_number as sow_pole,
  op.latitude as op_lat,
  op.longitude as op_lng,
  sp.latitude as sp_lat,
  sp.longitude as sp_lng,
  SQRT(
    POWER(op.latitude - sp.latitude, 2) +
    POWER(op.longitude - sp.longitude, 2)
  ) * 111 as distance_km
FROM onemap_properties op
CROSS JOIN sow_poles sp
WHERE sp.project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501'
  AND op.latitude IS NOT NULL
  AND sp.latitude IS NOT NULL
  AND ABS(op.latitude - sp.latitude) < 0.001
  AND ABS(op.longitude - sp.longitude) < 0.001
ORDER BY distance_km
LIMIT 10;
```

## Conclusion
The SOW linking system is **architecturally sound** but **operationally broken** due to data inconsistencies. The LEFT JOIN logic in `/api/onemap/properties.ts:25-28` works correctly, but pole naming conventions prevent any actual linking from occurring. This requires immediate attention to enable project tracking functionality.