# OneMap Import Process Documentation

## Overview
OneMap is a field data collection app used to capture real-time construction progress. Field teams use the OneMap app to record poles, drops, and fiber installations as they complete work on-site. This directory contains all documentation, scripts, and logs related to OneMap imports.

## Directory Structure
```
imports/onemap/
├── README.md           # This documentation
├── logs/              # Import logs with timestamps
├── scripts/           # Import scripts (linked from main scripts)
└── samples/           # Sample OneMap export files
```

## Import Process

### Step 1: Export from OneMap Field App
- Field teams export daily progress from OneMap app
- Format: Excel (.xlsx) or CSV
- Naming convention: `Lawley_DDMMYYYY.xlsx` (e.g., `Lawley_12092025.xlsx`)
- Contains real-time field data: poles installed, drops connected, fiber pulled

### Step 2: Data Validation
The import script validates:
- GPS coordinates within Lawley bounds (-26.35 to -26.15 lat, 28.20 to 28.40 lng)
- Maximum 12 drops per pole
- Expected poles per day: 50-500
- Field data integrity and completeness

### Step 3: Import to Neon Database
- Data is imported to `onemap_imports` table
- Linked to project via `project_id`
- Batch processing with change tracking
- Maintains audit trail of field progress

### Step 4: Display in Unified Grid
- Data accessible at `/sow/grid` (to be renamed to `/imports`)
- Combined view of SOW planning data and OneMap field actuals
- MUI DataGrid with sorting, filtering, export capabilities

## Available Scripts

### 1. Batch Import (FASTEST - RECOMMENDED)
```bash
node imports/onemap/batch-import.js
```
- **Speed**: ~304 records/second
- **Method**: PostgreSQL UNNEST bulk insert
- **Time**: 20k records in ~66 seconds
- **Features**: Progress bar with percentage

### 2. Final Import
```bash
node imports/onemap/final-import.js
```
- **Speed**: ~12 records/second
- **Method**: Individual INSERT statements
- **Features**: Better error handling per record

### 3. Simple Import
```bash
node imports/onemap/simple-import.js
```
- **Features**: Includes additional fields (pole GPS, installation dates)
- **Batch Size**: 100 records at a time

## Database Schema

### Primary Table: `onemap_properties`
Stores all OneMap field data in Neon PostgreSQL:

| Column | Type | Description |
|--------|------|-------------|
| property_id | text | Unique property identifier |
| onemap_nad_id | text | OneMap NAD identifier |
| status | text | Field status (e.g., "Home Installation: In Progress") |
| location_address | text | Physical address |
| latitude | numeric | Property GPS latitude |
| longitude | numeric | Property GPS longitude |
| pole_number | text | Associated pole number |
| drop_number | text | Associated drop cable number |
| contact_name | text | Contact first name |
| contact_surname | text | Contact surname |
| contact_number | text | Contact phone |
| created_at | timestamp | Import timestamp |

## API Endpoints

### GET `/api/onemap/properties`
**File**: `pages/api/onemap/properties.ts`
- Fetches OneMap field data with SOW linking
- Query param: `projectId` (required)
- Returns: JSON with data array and count
- Links to SOW tables via pole/drop numbers

### POST `/api/onemap/upload`
**File**: `pages/api/onemap/upload.ts`
- For future Excel file uploads (not yet implemented)

## Data Display in UI

### Location: Imports Data Grid
- **URL**: `http://localhost:PORT/sow/grid`
- **Component**: `src/modules/sow/ImportsDataGridPage.tsx`
- **Tab**: "OneMap Field (20,881)"

### Grid Features
1. **Columns Displayed**:
   - Property ID, OneMap ID
   - Address, GPS Coordinates
   - Pole/Drop Numbers
   - Field Status (color-coded)
   - Contact Details
   - SOW Linking Status

2. **Status Color Coding**:
   - 🟢 Green: Approved/Complete
   - 🔵 Blue: Installed
   - 🟡 Yellow: Survey
   - ⚪ Default: Other/Unknown

3. **SOW Linking**:
   - Shows "✓ Linked" when OneMap data matches SOW planning
   - Shows "Not Linked" for field work without SOW plans
   - Links via pole_number and drop_number fields

## Data Linking to SOW

### How Linking Works
The API performs LEFT JOINs to connect OneMap field data with SOW planning:

```sql
SELECT
  op.*,
  sp.pole_number as sow_pole_number,
  sd.drop_number as sow_drop_number
FROM onemap_properties op
LEFT JOIN sow_poles sp ON op.pole_number = sp.pole_number
  AND sp.project_id = ${projectId}
LEFT JOIN sow_drops sd ON op.drop_number = sd.drop_number
  AND sd.project_id = ${projectId}
```

### Link Analysis
- **Matched**: Field work that corresponds to planned SOW
- **Unmatched Field**: OneMap records without SOW planning
- **Missing Field**: SOW plans without field execution

## Import History

### September 16, 2025
- **File**: Lawley_12092025.xlsx
- **Project**: louissep15 (e2a61399-275a-4c44-8008-e9e42b7a3501)
- **Status**: ✅ Completed
- **Records Imported**: 20,881
- **Import Speed**: 304 records/second (batch import)
- **Notes**: Successfully imported using batch-import.js script

## Field Data vs SOW Data
- **SOW Data**: Planning data (what should be built)
  - Source: Design team exports
  - Contains: Planned poles, drops, fiber routes

- **OneMap Data**: Field actuals (what was built)
  - Source: Field team daily exports from OneMap app
  - Contains: Actual installations, GPS coordinates, completion status

## Notes
- OneMap data represents actual field progress
- Daily imports expected during active construction
- Data should be cross-referenced with SOW for variance analysis
- Field teams should export data at end of each work day