# Import Process Documentation

## Overview
This directory contains all documentation, scripts, and logs for the standardized import process after project creation.

## Import Workflow After Project Creation

### Step 1: SOW Data Import (Statement of Work)
After creating a new project, import the foundational SOW data in this order:

#### a. Fibre Cable Segments
- **Source**: Excel files from field surveys (e.g., Fibre_Lawley.xlsx)
- **Script**: `/scripts/sow-import/import-fibre-{project}.cjs`
- **Database Table**: `sow_fibre`
- **Verification**: `/scripts/sow-import/verify-fibre-{project}.cjs`
- **Log Location**: `/imports/logs/sow/fibre/`

#### b. Poles Infrastructure
- **Source**: Excel files with pole locations (e.g., Lawley Poles.xlsx)
- **Script**: `/scripts/sow-import/run-import.cjs`
- **Database Table**: `sow_poles`
- **Verification**: `/scripts/sow-import/verify-poles.cjs`
- **Log Location**: `/imports/logs/sow/poles/`

#### c. Drops (Customer Connections)
- **Source**: Excel files with drop cable data
- **Script**: `/scripts/sow-import/run-import-drops.cjs`
- **Database Table**: `sow_drops`
- **Verification**: `/scripts/sow-import/verify-drops.cjs`
- **Log Location**: `/imports/logs/sow/drops/`

### Step 2: Fiber Stringing Progress Data
**⚠️ PENDING - Awaiting QGIS exports from Jean**
- **Source**: QGIS (Geographic Information System)
- **Provider**: Jean
- **Expected Format**: GeoJSON, Shapefile, CSV, or KML export
- **Target Page**: `/fiber-stringing`
- **Database Table**: TBD (likely `fiber_stringing_progress`)
- **Script**: To be created once format confirmed
- **Notes**: This data will populate the Fiber Stringing Progress dashboard with geographic routing and installation progress

### Step 3: Field Installation Data
**⚠️ FUTURE - Not yet implemented**
- Installation progress
- Quality checks
- Team assignments

## Directory Structure
```
imports/
├── README.md (this file)
├── templates/           # Import script templates
├── logs/               # Import logs by category
│   ├── sow/
│   │   ├── fibre/
│   │   ├── poles/
│   │   └── drops/
│   └── field/
│       └── stringing/
├── scripts/            # Active import scripts
└── samples/            # Sample data files for testing
```

## Quick Reference

### Current Active Projects
| Project | ID | Date | Status |
|---------|-----|------|--------|
| louissep15 | e2a61399-275a-4c44-8008-e9e42b7a3501 | 2025-09-15 | ✅ Fibre, Poles & Drops imported |
| louisProjectTestWed | 7e7a6d88-8da1-4ac3-a16e-4b7a91e83439 | 2025-09-03 | ✅ Poles imported |

## API Access
See `/imports/API_ENDPOINTS.md` for complete API documentation to access the imported data.

Quick test:
```bash
# Get summary for louissep15
curl "http://localhost:3005/api/sow/summary?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501"
```

## See Also
- `/imports/API_ENDPOINTS.md` - Complete API endpoint documentation
- `/SOW/docs/importlog.md` - Historical import audit log
- `/SOW/docs/sow-import-log-2025.md` - Detailed 2025 import records
- `/scripts/sow-import/` - Import scripts directory