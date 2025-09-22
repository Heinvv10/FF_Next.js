# Nokia Fibertime Velocity Import Report
*Generated: September 16, 2025*
*Project: louissep15*

## Import Summary

### Source File
- **Name**: Lawley Nokia Fibertime week ending template VELOCITY 15092025.xlsx
- **Size**: 12.59 MB
- **Week Ending**: September 15, 2025
- **Source System**: Nokia Fibertime Field App

### Import Statistics
- **Total Rows in Excel**: 20,119
- **Properties Processed**: 20,112
- **Import Status**: In Progress (Large dataset)
- **Database Table**: `nokia_velocity`

## Data Structure

### Key Fields Imported
| Field | Description | Example |
|-------|-------------|---------|
| property_id | Unique property identifier | 500491 |
| pole_number | Pole identifier | LAW.P.A453 |
| drop_number | Drop cable identifier | DR1740849 |
| status | Current installation status | "Pole Permission: Approved" |
| ont_barcode | ONT equipment barcode | Various |
| installation_date | Date of installation | 2025-09-15 |
| latitude/longitude | GPS coordinates | -26.370706, 27.811263 |

### Status Categories
1. **Survey Phase**
   - Survey Completed
   - Survey Pending

2. **Permission Phase**
   - Pole Permission: Approved
   - Pole Permission: Pending
   - Pole Permission: Rejected

3. **Installation Phase**
   - Home Sign Ups: Approved
   - Installation Scheduled
   - Installation: In Progress
   - Installation: Complete

4. **Activation Phase**
   - ONT Activated
   - Service Active

## Linking Analysis

### Pole Linking (Nokia ↔ SOW)
```sql
-- Linking method: Exact pole_number match
SELECT
  nv.pole_number as nokia_pole,
  sp.pole_number as sow_pole
FROM nokia_velocity nv
LEFT JOIN sow_poles sp
  ON nv.pole_number = sp.pole_number
WHERE nv.project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501'
```

**Expected Results:**
- Nokia poles use same format as SOW (LAW.P.XXXX)
- Direct matching possible
- High linking rate expected

### Drop Linking (Nokia ↔ SOW)
```sql
-- Linking method: Exact drop_number match
SELECT
  nv.drop_number as nokia_drop,
  sd.drop_number as sow_drop
FROM nokia_velocity nv
LEFT JOIN sow_drops sd
  ON nv.drop_number = sd.drop_number
WHERE nv.project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501'
```

**Expected Results:**
- Drop format: DRXXXXXXX
- Should match SOW drops exactly
- ~50% linking rate expected (based on SOW drop analysis)

### Property Linking (Nokia ↔ OneMap)
```sql
-- Linking method: property_id match
SELECT
  nv.property_id as nokia_property,
  op.property_id as onemap_property
FROM nokia_velocity nv
LEFT JOIN onemap_properties op
  ON nv.property_id = op.property_id
```

**Expected Results:**
- Property IDs should match
- Enables status comparison
- Full customer data linking

## Velocity Metrics

### Weekly Progress Tracking
The Nokia data provides weekly snapshots of installation progress:

| Metric | Description | Calculation |
|--------|-------------|------------|
| Survey Velocity | Properties surveyed per week | Count where status = 'Survey Completed' |
| Permission Velocity | Permissions obtained per week | Count where pole_permission_date in week |
| Installation Velocity | Installations completed per week | Count where installation_date in week |
| Activation Velocity | ONTs activated per week | Count where ont_barcode IS NOT NULL |

### Progress Funnel
```
Total Properties: 20,112
  ↓
Surveyed: TBD
  ↓
Permission Granted: TBD
  ↓
Installations Scheduled: TBD
  ↓
Installations Complete: TBD
  ↓
Service Active: TBD
```

## Grid View Integration

### New Nokia Tab Added
Location: `/sow/grid` → Nokia Velocity Tab

### Columns Available
- Property ID
- Nokia Status
- Pole Number (with SOW link indicator)
- Drop Number (with SOW link indicator)
- ONT Barcode
- Installation Date
- Days Since Update
- Progress Status

### Filtering Options
- By Status
- By Week
- By Progress Phase
- By Linking Status

### API Endpoint
```typescript
// GET /api/nokia/velocity?projectId={id}&weekEnding={date}
// Returns Nokia data with SOW/OneMap linking
```

## Import Process

### Script Location
`/scripts/import-nokia-velocity.js`

### How to Import
```bash
# Import Nokia Excel file
node scripts/import-nokia-velocity.js

# The script will:
# 1. Read Excel file from Downloads
# 2. Parse 1Map Field App sheet
# 3. Transform 117 columns to database format
# 4. Insert/Update nokia_velocity table
# 5. Calculate linking statistics
```

### Import Features
- **Batch Processing**: 500 records at a time
- **Upsert Logic**: Updates existing records
- **Week Tracking**: Maintains weekly snapshots
- **Error Handling**: Continues on individual errors

## Data Quality

### Known Issues
1. **Large Consent Text**: Legal consent text stored in full (very long)
2. **Duplicate Properties**: Some properties appear multiple times
3. **Date Formats**: Excel serial dates need conversion
4. **Status Variations**: Multiple status text formats

### Data Cleansing Applied
- Date conversion from Excel format
- Null handling for empty cells
- Status normalization
- GPS coordinate validation

## Usage Instructions

### For Project Managers
1. **Weekly Import Process**
   ```bash
   # Every Monday morning:
   # 1. Download latest Nokia Excel from email/portal
   # 2. Save to Downloads folder
   # 3. Run import script
   node scripts/import-nokia-velocity.js
   ```

2. **View Progress**
   - Navigate to `/sow/grid`
   - Select "Nokia Velocity" tab
   - Review progress metrics

3. **Generate Reports**
   ```bash
   node scripts/analyze-nokia-linking.js
   ```

### For Field Teams
1. **Check Installation Queue**
   - Filter by "Permission Granted" status
   - Sort by days_since_update
   - Prioritize oldest pending installs

2. **Verify Linking**
   - Check pole/drop matches with SOW
   - Validate property addresses
   - Confirm ONT assignments

## Next Steps

### Immediate Actions
1. ✅ Import script created
2. ✅ API endpoint configured
3. ✅ Documentation complete
4. ⏳ Import completion pending
5. ⏳ Linking verification pending

### Future Enhancements
1. **Automated Weekly Import**
   - Schedule cron job for Monday imports
   - Email notifications on completion

2. **Velocity Dashboard**
   - Week-over-week charts
   - Progress funnel visualization
   - Bottleneck identification

3. **Alert System**
   - Stalled installations (>7 days no update)
   - Permission rejections
   - Failed ONT activations

## Files Created

| File | Purpose |
|------|---------|
| `/scripts/import-nokia-velocity.js` | Import script |
| `/scripts/analyze-nokia-linking.js` | Linking analysis |
| `/pages/api/nokia/velocity.ts` | API endpoint |
| `/imports/nokia/NOKIA_VELOCITY_IMPORT.md` | Technical documentation |
| `/imports/nokia/NOKIA_IMPORT_REPORT.md` | This report |

## Support

For issues or questions:
1. Check import logs in console
2. Verify Excel file format matches expected structure
3. Run linking analysis for diagnostics
4. Review this documentation

---
*End of Nokia Import Report*