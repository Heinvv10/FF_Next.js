# QField Sync Module

## Overview

The QField Sync module provides bidirectional synchronization between QFieldCloud (GIS field data collection) and FibreFlow's fiber infrastructure database. This standalone module enables real-time syncing of fiber cable installations, pole data, and other field-collected information.

## Architecture

This module follows the "Lego Block" pattern - completely self-contained and modular:

```
src/modules/qfield-sync/
├── types/                      # TypeScript interfaces and types
│   └── qfield-sync.types.ts    # All type definitions
├── services/                   # Business logic and API services
│   ├── qfieldSyncService.ts    # Core sync logic
│   └── qfieldSyncApiService.ts # Frontend API client
├── config/                     # Configuration
│   └── sync-config.ts          # Sync settings and mappings
├── components/                 # React components
│   ├── QFieldSyncDashboard.tsx # Main dashboard
│   ├── ConnectionStatus.tsx    # Connection status cards
│   ├── SyncJobCard.tsx        # Active sync job display
│   ├── SyncStatsCard.tsx      # Statistics display
│   ├── ConflictResolver.tsx   # Conflict resolution UI
│   ├── SyncHistoryTable.tsx   # Historical sync jobs
│   ├── SyncConfigModal.tsx    # Settings modal
│   └── index.ts               # Component exports
├── hooks/                      # Custom React hooks
│   └── useQFieldSync.ts       # Main hook for sync operations
└── README.md                  # This file
```

## Features

### Real-time Synchronization
- Automatic syncing every 5 minutes (configurable)
- Manual sync on demand
- WebSocket support for real-time updates

### Bidirectional Sync
- QFieldCloud → FibreFlow: Import field data
- FibreFlow → QFieldCloud: Push planned routes
- Conflict detection and resolution

### Data Types Supported
- **Fiber Cables**: Cable routes, specifications, installation status
- **Poles**: Location data, height, material
- **Splice Closures**: Junction points, splice dates
- **Test Points**: OTDR test results, quality metrics

### Conflict Resolution
- Automatic conflict detection
- Manual resolution interface
- Audit trail of all resolutions

## API Endpoints

All endpoints use the flattened route pattern for Vercel compatibility:

```
GET  /api/qfield-sync-dashboard     # Get dashboard data
POST /api/qfield-sync-start         # Start sync job
GET  /api/qfield-sync-current       # Get current job status
GET  /api/qfield-sync-history       # Get sync history
POST /api/qfield-sync-cancel        # Cancel active sync
POST /api/qfield-sync-conflicts     # Resolve conflicts
GET  /api/qfield-sync-config        # Get configuration
PUT  /api/qfield-sync-config        # Update configuration
```

## Database Schema

### qfield_sync_jobs
```sql
CREATE TABLE qfield_sync_jobs (
  id UUID PRIMARY KEY,
  type VARCHAR(50),              -- fiber_cables, poles, etc.
  status VARCHAR(20),             -- syncing, completed, error
  direction VARCHAR(30),          -- qfield_to_fibreflow, etc.
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  records_processed INT,
  records_created INT,
  records_updated INT,
  records_failed INT,
  errors JSONB,
  duration_ms INT
);
```

### qfield_sync_conflicts
```sql
CREATE TABLE qfield_sync_conflicts (
  id UUID PRIMARY KEY,
  record_id VARCHAR(255),
  field VARCHAR(100),
  qfield_value JSONB,
  fibreflow_value JSONB,
  detected_at TIMESTAMP,
  resolution VARCHAR(20),
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(255)
);
```

## Configuration

### Environment Variables
```bash
# QFieldCloud Configuration
NEXT_PUBLIC_QFIELD_URL=https://qfield.fibreflow.app
NEXT_PUBLIC_QFIELD_PROJECT_ID=your_project_id
QFIELD_API_KEY=your_api_key

# Database
DATABASE_URL=postgresql://...
```

### Field Mapping
Configure field mappings in `config/sync-config.ts`:

```typescript
export const FIBER_CABLE_FIELD_MAPPING: FieldMapping[] = [
  { source: 'cable_id', target: 'cable_id', transform: 'none' },
  { source: 'cable_type', target: 'cable_type', transform: 'uppercase' },
  { source: 'geometry', target: 'route_map', transform: 'json' },
  // ... more mappings
];
```

## Usage

### Basic Usage
```tsx
import { QFieldSyncDashboard } from '@/modules/qfield-sync/components';

export default function QFieldSyncPage() {
  return <QFieldSyncDashboard />;
}
```

### Using the Hook
```tsx
import { useQFieldSync } from '@/modules/qfield-sync/hooks/useQFieldSync';

function MyComponent() {
  const {
    dashboardData,
    currentJob,
    startSync,
    cancelSync,
    resolveConflict,
  } = useQFieldSync();

  const handleSync = () => {
    startSync('fiber_cables', 'bidirectional');
  };

  // ... component logic
}
```

## Development

### Testing Connection
```bash
# Test QFieldCloud connection
curl http://localhost:3005/api/qfield-sync-dashboard

# Start a sync job
curl -X POST http://localhost:3005/api/qfield-sync-start \
  -H "Content-Type: application/json" \
  -d '{"type": "fiber_cables", "direction": "bidirectional"}'
```

### Database Setup
Run these commands to create the necessary tables:

```sql
-- Create sync jobs table
CREATE TABLE IF NOT EXISTS qfield_sync_jobs (
  -- See schema above
);

-- Create conflicts table
CREATE TABLE IF NOT EXISTS qfield_sync_conflicts (
  -- See schema above
);

-- Create indexes
CREATE INDEX idx_sync_jobs_status ON qfield_sync_jobs(status);
CREATE INDEX idx_sync_conflicts_resolution ON qfield_sync_conflicts(resolution);
```

## Monitoring

### Key Metrics
- Sync frequency and latency
- Records processed per sync
- Error rates by type
- Conflict resolution time

### Health Checks
```typescript
// Check system health
GET /api/qfield-sync-health

Response:
{
  status: 'healthy',
  qfieldConnection: true,
  databaseConnection: true,
  lastSync: '2024-01-15T10:30:00Z'
}
```

## Future Enhancements

1. **Real-time WebSocket sync** - Push changes immediately
2. **Bulk conflict resolution** - Resolve multiple conflicts at once
3. **Field mapping UI** - Configure mappings via interface
4. **Scheduled sync** - Cron-based scheduling
5. **Data validation rules** - Custom validation before sync
6. **Sync queue** - Handle large batches efficiently
7. **Mobile app integration** - Direct sync from QField app

---

## 🚧 PLANNED IMPLEMENTATION: Pole Audit → Fiber Stringing Sync

### Current Status (December 2025)

**What Works ✅:**
- QField sync can **read** pole audit survey data from QFieldCloud
- QField sync can **read** fiber cable data from QFieldCloud
- Comparison dashboards display data from both systems
- API endpoints operational: `/api/qfield-sync-poles`, `/api/qfield-sync-cables`

**What's Missing ❌:**
- Fiber stringing (`sow_fibre` table) is **NOT automatically updated** with pole audit survey data
- Sync is currently **read-only** for comparison purposes only
- Bidirectional sync methods are **stub implementations** (see `qfieldSyncService.ts:361-381`)

### Architecture Diagram

```
Field Technicians (QField App)
    ↓ Collect pole audit data
    ↓ (GPS, height, material, inspection results)
QFieldCloud PostgreSQL
    ↓
QField Sync Module (CURRENT STATE)
    ├── ✅ getQFieldPoles() - Fetch pole survey data
    ├── ✅ getQFieldCables() - Fetch fiber cable data
    ├── ✅ Compare & display data
    └── ❌ Update FibreFlow (NOT IMPLEMENTED)
        ↓
Fiber Stringing Dashboard (`/fiber-stringing`)
    └── Currently shows SOW import data only
    └── Not updated with field-verified pole locations
```

### Implementation Plan

#### Phase 1: Complete Sync Methods (1-2 weeks)

**Files to Modify:**
- `src/modules/qfield-sync/services/qfieldSyncService.ts`

**Tasks:**
1. **Implement `updateFibreFlowRecord()`** (currently line 373)
   - Accept cable_id and transformed data
   - Execute UPDATE query on `sow_fibre` table
   - Return success/failure status

2. **Implement `createFibreFlowRecord()`** (currently line 378)
   - Accept transformed cable data
   - Execute INSERT query on `sow_fibre` table
   - Handle duplicate key conflicts

3. **Implement `fetchFibreFlowRecord()`** (currently line 367)
   - Query `sow_fibre` by cable_id
   - Return existing record or null
   - Use Neon serverless client

#### Phase 2: Pole-to-Fiber Linking Logic (2-3 weeks)

**New Service:** `src/modules/qfield-sync/services/poleToFiberLinker.ts`

**Functionality:**
```typescript
class PoleToFiberLinker {
  // Match poles from QField audit with fiber segments in sow_fibre
  async linkPolestoFiberSegments(
    qfieldPoles: QFieldPole[],
    projectId: string
  ): Promise<LinkResult> {
    // 1. Query sow_fibre for segments in project
    const fiberSegments = await this.getFiberSegments(projectId);

    // 2. Match by pole_number in from_pole/to_pole fields
    const matches = this.matchPoleNumbers(qfieldPoles, fiberSegments);

    // 3. Update fiber segments with verified pole data:
    //    - GPS coordinates (if more accurate)
    //    - Installation status (verified/inspected)
    //    - Pole height/material (affects cable routing)
    //    - Inspection timestamp

    // 4. Return update summary
    return {
      matched: matches.length,
      updated: updatedSegments.length,
      conflicts: conflictingUpdates
    };
  }
}
```

**Field Mapping Strategy:**
```typescript
// Pole audit data → Fiber stringing updates
QFieldPole.inspection_data.verified → sow_fibre.status = 'verified'
QFieldPole.latitude/longitude → Update start/end coordinates
QFieldPole.height → sow_fibre.metadata.pole_height
QFieldPole.material → sow_fibre.metadata.pole_material
QFieldPole.updated_at → sow_fibre.field_verified_at (new column)
```

#### Phase 3: Conflict Resolution (1 week)

**Scenarios to Handle:**

1. **GPS Coordinate Conflicts**
   - SOW data: From planning/design
   - QField data: From actual field measurement
   - **Resolution:** QField wins (more accurate), flag as "field-corrected"

2. **Pole Number Mismatches**
   - Pole number in SOW doesn't exist in QField
   - **Resolution:** Create warning, require manual review

3. **Status Conflicts**
   - SOW: "planned"
   - QField: "installed and verified"
   - **Resolution:** QField wins, update timestamp

**UI Component:**
- Extend `ConflictResolver.tsx` to handle pole-fiber conflicts
- Show side-by-side comparison of SOW vs Field data
- Allow manual selection of correct value

#### Phase 4: Testing & Validation (1 week)

**Test Cases:**
1. Import SOW fiber data for test project
2. Collect pole audit data in QField
3. Trigger sync job
4. Verify:
   - Matching poles update fiber segments
   - GPS coordinates corrected
   - Status updated to "field-verified"
   - Conflicts logged for manual review
   - Fiber stringing dashboard shows updated data

**Success Criteria:**
- ✅ Fiber stringing dashboard displays field-verified pole locations
- ✅ Cable routing reflects actual pole positions from audit
- ✅ Installation status auto-updates based on field verification
- ✅ Conflicts handled gracefully with audit trail

### Database Schema Changes Needed

```sql
-- Add field verification tracking to sow_fibre
ALTER TABLE sow_fibre ADD COLUMN IF NOT EXISTS field_verified BOOLEAN DEFAULT false;
ALTER TABLE sow_fibre ADD COLUMN IF NOT EXISTS field_verified_at TIMESTAMP;
ALTER TABLE sow_fibre ADD COLUMN IF NOT EXISTS qfield_pole_audit_id VARCHAR(255);
ALTER TABLE sow_fibre ADD COLUMN IF NOT EXISTS field_corrections JSONB;

-- Index for faster pole lookups
CREATE INDEX IF NOT EXISTS idx_sow_fibre_from_pole ON sow_fibre(from_pole);
CREATE INDEX IF NOT EXISTS idx_sow_fibre_to_pole ON sow_fibre(to_pole);
CREATE INDEX IF NOT EXISTS idx_sow_fibre_verification ON sow_fibre(field_verified, field_verified_at);
```

### API Endpoints to Add

```
POST /api/qfield-sync-poles-to-fiber   # Trigger pole audit → fiber sync
GET  /api/qfield-sync-verification      # Get verification status per segment
POST /api/qfield-sync-conflicts-resolve # Resolve pole-fiber conflicts
```

### Configuration

**New config file:** `src/modules/qfield-sync/config/pole-fiber-mapping.ts`

```typescript
export const POLE_FIBER_FIELD_MAPPING = {
  // When pole is verified, update fiber segment
  on_pole_verified: {
    update_fields: ['status', 'coordinates', 'metadata'],
    set_status: 'field-verified',
    priority: 'qfield_wins', // Field data overrides SOW
  },

  // GPS accuracy thresholds
  gps_accuracy: {
    accept_if_better_than_meters: 10, // Only update if QField GPS < 10m accuracy
    flag_if_difference_exceeds_meters: 50, // Create conflict if coordinates differ > 50m
  },

  // Conflict resolution rules
  conflict_resolution: {
    coordinates: 'qfield_wins',
    pole_height: 'qfield_wins',
    installation_status: 'qfield_wins',
    pole_number: 'manual_review', // Don't auto-change pole numbers
  }
};
```

### Documentation to Update

1. **This README** - Mark as "Implemented" when done
2. **`docs/QFIELD_FIBER_INTEGRATION_PLAN.md`** - Update with actual implementation
3. **`docs/DATABASE_TABLES.md`** - Add new `sow_fibre` columns
4. **`docs/page-logs/fiber-stringing.md`** - Document changes to dashboard

### Timeline Estimate

- **Phase 1:** 1-2 weeks (sync methods)
- **Phase 2:** 2-3 weeks (linking logic)
- **Phase 3:** 1 week (conflict resolution)
- **Phase 4:** 1 week (testing)

**Total:** 5-7 weeks for full implementation

### Priority

**Medium-High** - Valuable feature but not blocking current operations. SOW imports work fine, this would add field verification layer.

### Dependencies

- QFieldCloud database access (already configured)
- Neon PostgreSQL write access (already configured)
- Test project with both SOW data and QField pole audits

### Next Steps

1. Create GitHub issue to track implementation
2. Set up test project with sample data
3. Begin Phase 1 (implement sync methods)
4. Get user feedback on conflict resolution rules

---

**Status:** 🚧 **PLANNED - NOT YET IMPLEMENTED**
**Last Updated:** December 15, 2025
**Assigned To:** TBD
**Estimated Effort:** 5-7 weeks

---

## Troubleshooting

### Common Issues

**QFieldCloud Connection Failed**
- Verify API key is correct
- Check network connectivity to QFieldCloud server
- Ensure project ID exists

**Database Connection Failed**
- Verify DATABASE_URL is correct
- Check Neon PostgreSQL is accessible
- Ensure tables exist (run setup SQL)

**Sync Job Stuck**
- Check `/api/qfield-sync-current` for status
- Use cancel endpoint if needed
- Check logs for errors

**Conflicts Not Resolving**
- Verify both systems have latest data
- Check field mapping configuration
- Review conflict resolution logic

## Support

For issues or questions:
- Check module logs in browser console
- Review API response errors
- Contact QFieldCloud support for API issues
- Internal team for FibreFlow integration

## License

Internal use only - Part of FibreFlow application