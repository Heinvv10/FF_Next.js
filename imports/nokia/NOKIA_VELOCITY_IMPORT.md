# Nokia Fibertime Velocity Data Import Documentation
*Created: September 16, 2025*

## Overview
The Nokia Fibertime Velocity report is a comprehensive weekly progress tracking system that captures field installation data, permissions, and customer information. This document describes the import process, data structure, and integration with existing SOW and OneMap data.

## Source File Information
- **Filename**: `Lawley Nokia Fibertime week ending template VELOCITY 15092025.xlsx`
- **Size**: 12.59 MB
- **Week Ending**: September 15, 2025
- **Total Records**: ~20,000 properties with installation progress

## Excel File Structure

### Sheet 1: OLT Report
- **Rows**: 1,180
- **Purpose**: Optical Line Terminal configuration data
- **Key Fields**: Network equipment status and configurations

### Sheet 2: 1Map Field App (PRIMARY DATA)
- **Rows**: 20,119
- **Columns**: 117
- **Purpose**: Main field installation tracking data
- **Key Fields**:
  - Property ID
  - Pole Number (e.g., LAW.P.A453)
  - Drop Number (e.g., DR1740849)
  - Installation Status
  - GPS Coordinates
  - Customer Information
  - ONT Barcodes
  - Installation Dates

### Sheet 3: Planning
- **Rows**: 23,710
- **Purpose**: Planning reference data

## Database Schema

### Table: `nokia_velocity`
Created to store Nokia field installation progress data with the following structure:

```sql
CREATE TABLE nokia_velocity (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL,
  property_id VARCHAR(100),
  onemap_nad_id VARCHAR(100),
  job_id VARCHAR(100),
  status VARCHAR(255),

  -- Location Data
  site VARCHAR(50),
  location_address TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  pole_number VARCHAR(100),
  drop_number VARCHAR(100),

  -- Permission Tracking
  pole_permission_status VARCHAR(255),
  pole_permission_date TIMESTAMP,
  pole_permission_agent VARCHAR(255),

  -- Customer Data
  contact_name VARCHAR(255),
  contact_surname VARCHAR(255),
  contact_number VARCHAR(100),
  email_address VARCHAR(255),

  -- Installation Data
  ont_barcode VARCHAR(255),
  ont_activation_code VARCHAR(255),
  dome_joint_number VARCHAR(100),
  drop_cable_length NUMERIC,
  installer_name VARCHAR(255),
  installation_date TIMESTAMP,

  -- Metadata
  week_ending DATE,
  import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(project_id, property_id, week_ending)
)
```

## Import Process

### 1. Data Extraction
```javascript
// Script: /scripts/import-nokia-velocity.js
// Reads Excel file and extracts 1Map Field App sheet
// Maps 117 columns to database fields
// Handles date conversions from Excel serial format
```

### 2. Data Transformation
- Property IDs mapped to match OneMap format
- Pole numbers normalized (e.g., LAW.P.A453)
- Drop numbers extracted and formatted
- GPS coordinates validated and converted
- Status fields standardized

### 3. Batch Import
- Processes in batches of 500 records
- Uses UPSERT (INSERT ... ON CONFLICT)
- Updates existing records with latest status
- Maintains weekly snapshots

## Linking Strategy

### Pole Number Linking
```sql
-- Link Nokia data with SOW poles
SELECT
  nv.property_id,
  nv.pole_number as nokia_pole,
  sp.pole_number as sow_pole,
  nv.status as nokia_status
FROM nokia_velocity nv
LEFT JOIN sow_poles sp
  ON nv.pole_number = sp.pole_number
WHERE nv.project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501'
```

### Drop Number Linking
```sql
-- Link Nokia data with SOW drops
SELECT
  nv.property_id,
  nv.drop_number as nokia_drop,
  sd.drop_number as sow_drop,
  nv.installation_date
FROM nokia_velocity nv
LEFT JOIN sow_drops sd
  ON nv.drop_number = sd.drop_number
WHERE nv.project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501'
```

### Property Linking with OneMap
```sql
-- Link Nokia data with OneMap properties
SELECT
  nv.property_id,
  op.property_id as onemap_property,
  nv.ont_barcode,
  op.drop_number
FROM nokia_velocity nv
LEFT JOIN onemap_properties op
  ON nv.property_id = op.property_id
WHERE nv.project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501'
```

## Status Tracking

### Installation Progress States
1. **Survey Completed**: Initial site survey done
2. **Pole Permission: Approved**: Permission granted to install pole
3. **Home Sign Ups: Approved**: Customer signed up for service
4. **Installation Scheduled**: Installation date set
5. **Installation Complete**: ONT installed and activated
6. **Sales: Completed**: Service sold to customer

### Weekly Velocity Metrics
- Total properties surveyed
- Pole permissions obtained
- Installations completed
- ONTs activated
- Week-over-week progress

## Grid View Integration

### New Columns Added
- **Nokia Status**: Current installation status from Nokia
- **ONT Barcode**: Equipment tracking number
- **Installation Date**: When installation completed
- **Pole Permission**: Permission status
- **Velocity Week**: Week of data snapshot

### API Endpoint Enhancement
```typescript
// /pages/api/nokia/velocity.ts
export async function getNokiaVelocityData(projectId: string) {
  return sql`
    SELECT
      nv.*,
      sp.pole_number as sow_pole_match,
      sd.drop_number as sow_drop_match
    FROM nokia_velocity nv
    LEFT JOIN sow_poles sp ON nv.pole_number = sp.pole_number
    LEFT JOIN sow_drops sd ON nv.drop_number = sd.drop_number
    WHERE nv.project_id = ${projectId}
    ORDER BY nv.property_id
  `;
}
```

## Key Findings

### Data Quality
- **20,112** properties with Nokia tracking data
- **~4,000** poles referenced in Nokia data
- **~12,000** drops with installation progress
- **Multiple status updates** per property showing progress

### Linking Success
- Pole numbers match SOW format exactly
- Drop numbers align with SOW drops
- Property IDs compatible with OneMap
- GPS coordinates available for validation

## Usage Instructions

### Import New Weekly Data
```bash
# Run weekly import
node scripts/import-nokia-velocity.js

# Verify import
node scripts/verify-nokia-import.js
```

### View in Grid
1. Navigate to `/sow/grid`
2. Select "Nokia Velocity" tab
3. Filter by status or week
4. Export velocity reports

### Generate Weekly Reports
```bash
# Generate velocity report
node scripts/generate-velocity-report.js --week=2025-09-15
```

## Maintenance

### Weekly Updates
- Import new Nokia Excel file each Monday
- Compare week-over-week progress
- Identify bottlenecks in installation process
- Track velocity trends

### Data Retention
- Keep 12 weeks of velocity snapshots
- Archive older data to separate tables
- Maintain linking relationships

## Troubleshooting

### Common Issues
1. **Excel format changes**: Update column mappings in import script
2. **Duplicate imports**: Use UPSERT to handle re-imports
3. **Missing links**: Check pole/drop number formats
4. **Date parsing**: Handle Excel serial dates correctly

## Success Metrics
- ✅ 20,000+ properties imported
- ✅ Pole and drop linking functional
- ✅ Weekly velocity tracking enabled
- ✅ Grid view integration complete
- ✅ Status progression tracked