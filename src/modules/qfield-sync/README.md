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