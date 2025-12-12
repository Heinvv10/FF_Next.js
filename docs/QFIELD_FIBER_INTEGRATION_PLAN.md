# QFieldCloud to FibreFlow Fiber-Stringing Integration Plan

## Executive Summary

This document outlines the integration possibilities between QFieldCloud (GIS field data collection) and FibreFlow's fiber-stringing module to enable automatic synchronization of field-collected fiber infrastructure data.

## Current System Overview

### FibreFlow Fiber-Stringing Module

**Database Table:** `sow_fibre`
**Key Fields:**
- `cable_id`: Unique identifier for cable segments
- `cable_type`, `cable_size`, `fiber_count`: Cable specifications
- `start_location`, `end_location`: String descriptions
- `start_latitude`, `start_longitude`, `end_latitude`, `end_longitude`: GPS coordinates
- `length`: Cable length in meters
- `installation_method`: How cable is installed
- `status`: Current status (pending/in_progress/completed)
- `installation_date`, `installed_by`: Installation tracking
- `splicing_complete`, `testing_complete`: Quality checkpoints
- `route_map`: JSONB field for detailed routing

**Current State:** Using mock data, awaiting real field data integration

### QFieldCloud Infrastructure

**Location:** VPS at srv1083126.hstgr.cloud (72.61.166.168)
**URL:** https://qfield.fibreflow.app
**Technology:**
- PostgreSQL 13 + PostGIS for spatial data
- QGIS project files for field data collection
- Mobile sync capabilities via QField app
- Layer-based georeferenced data

**Existing Sync Modules:**
- **Poles Sync Module** - Already extracting pole data (port 3001)
- **OES Sync Module** - Matching OES reports with field data

## Integration Architecture

### Data Flow Design

```
Field Technicians (QField App)
    ↓
QFieldCloud Server (72.61.166.168)
    ├── PostgreSQL/PostGIS Database
    │   └── Spatial Fiber Cable Layers
    ↓
Sync Service (New Module)
    ├── Extract fiber cable geometries
    ├── Process pole connections
    ├── Calculate cable lengths
    └── Transform to FibreFlow format
    ↓
FibreFlow Database (Neon PostgreSQL)
    └── sow_fibre table
    ↓
Fiber-Stringing Dashboard
```

## Integration Opportunities

### 1. Real-time Field Data Sync

**What:** Automatically sync fiber cable installations from QFieldCloud to FibreFlow as technicians complete field work.

**How:**
- Create a new sync module similar to the existing poles-sync
- Poll QFieldCloud database for new/updated fiber cable features
- Transform spatial data to FibreFlow's sow_fibre schema
- Update status based on field completion markers

**Benefits:**
- Eliminate manual data entry
- Real-time progress tracking
- Reduce data entry errors

### 2. Bi-directional Status Updates

**What:** Push planned routes from FibreFlow to QFieldCloud, pull completion status back.

**Data Mapping:**
```
QFieldCloud Layer Fields → FibreFlow sow_fibre
- feature_id → cable_id
- cable_type → cable_type
- start_pole_id → start_location (with pole lookup)
- end_pole_id → end_location (with pole lookup)
- geometry length → length
- installation_status → status
- installer_name → installed_by
- completion_date → installation_date
- splice_complete → splicing_complete
- test_results → testing_complete
- geometry → route_map (GeoJSON)
```

### 3. Automated Cable Length Calculation

**What:** Use PostGIS spatial functions to automatically calculate accurate cable lengths from GPS tracks.

**Implementation:**
```sql
-- Example PostGIS query for cable length
SELECT
    cable_id,
    ST_Length(ST_Transform(geometry, 32633)) as calculated_length_m,
    ST_AsGeoJSON(geometry) as route_geometry
FROM fiber_cables
WHERE updated_at > last_sync_timestamp;
```

### 4. Quality Assurance Integration

**What:** Sync field photos and test results from QField attachments to FibreFlow.

**Features:**
- Splice closure photos → store in Firebase Storage
- OTDR test results → update test_results JSONB
- Field notes → populate notes field

## Implementation Approach

### Phase 1: Read-Only Sync (2-3 weeks)

1. **Create Fiber Sync Service**
   - Deploy on QField VPS alongside poles-sync
   - Use PM2 process manager
   - Express.js API with Python sync scripts

2. **Database Connection**
   - Connect to QFieldCloud PostgreSQL (port 5433)
   - Query fiber cable layers
   - Transform to FibreFlow schema

3. **Initial Data Mapping**
   - Map QField layer attributes to sow_fibre columns
   - Handle coordinate transformations
   - Calculate lengths from geometries

### Phase 2: Full Integration (3-4 weeks)

4. **Bi-directional Sync**
   - Push planned routes to QFieldCloud
   - Create QGIS project templates
   - Handle conflict resolution

5. **Real-time Updates**
   - WebSocket or polling mechanism
   - Status change notifications
   - Progress dashboard updates

6. **Photo/Document Sync**
   - Extract QField attachments
   - Upload to Firebase Storage
   - Link to fiber segments

## Technical Requirements

### QFieldCloud Project Setup

1. **Create Fiber Infrastructure Project**
   - Design QGIS project with fiber cable layers
   - Define attribute schemas matching FibreFlow needs
   - Set up offline editing capabilities

2. **Layer Configuration**
```
Fiber_Cables (LineString)
- cable_id (text, primary key)
- cable_type (text, domain list)
- cable_size (integer)
- start_pole (text, foreign key)
- end_pole (text, foreign key)
- status (text, domain: planned/in_progress/completed)
- installed_by (text)
- installation_date (date)
- notes (text)
```

3. **Related Layers**
```
Poles (Point) - Already exists
Splice_Closures (Point)
Test_Points (Point)
```

### Sync Module Development

**Technology Stack:**
- Node.js/Express for API
- Python for data processing
- node-cron for scheduling
- pg library for PostgreSQL

**Configuration:**
```javascript
// config/fiber-sync.js
module.exports = {
  qfieldcloud: {
    host: 'srv1083126.hstgr.cloud',
    port: 5433,
    database: 'qfieldcloud_db',
    project: 'fiber_infrastructure'
  },
  fibreflow: {
    url: process.env.DATABASE_URL,
    syncInterval: '*/5 * * * *', // Every 5 minutes
  },
  mapping: {
    statusMap: {
      'field_complete': 'completed',
      'field_progress': 'in_progress',
      'field_planned': 'pending'
    }
  }
};
```

## Deployment Plan

### Infrastructure Setup

1. **Deploy on QField VPS**
   ```bash
   cd /home/ubuntu
   git clone fiber-sync-module
   npm install
   pm2 start fiber-sync --name fiber-sync
   pm2 save
   ```

2. **Configure Nginx**
   ```nginx
   location /api/fiber-sync {
     proxy_pass http://localhost:3002;
   }
   ```

3. **Database Access**
   - Grant read access to QFieldCloud DB
   - Set up connection pooling
   - Configure SSL certificates

## Monitoring & Maintenance

### Key Metrics
- Sync frequency and latency
- Records processed per sync
- Error rates and types
- Data quality scores

### Logging
```javascript
// Log sync operations
logger.info('Fiber sync started', {
  timestamp: new Date(),
  project: 'fiber_infrastructure',
  mode: 'incremental'
});
```

### Error Handling
- Duplicate cable_id conflicts
- Geometry validation errors
- Network connectivity issues
- Data transformation failures

## Security Considerations

1. **Authentication**
   - API key for QFieldCloud access
   - Encrypted database connections
   - Rate limiting on sync endpoints

2. **Data Validation**
   - Sanitize all input data
   - Validate geometries before processing
   - Check foreign key constraints

3. **Access Control**
   - Read-only access to QFieldCloud
   - Restricted write access to FibreFlow
   - Audit trail for all syncs

## Success Metrics

### Immediate Benefits
- ✅ Eliminate 2-4 hours daily manual data entry
- ✅ Real-time visibility of field progress
- ✅ Reduce data entry errors by 90%
- ✅ GPS-accurate cable lengths

### Long-term Value
- Complete digital twin of fiber infrastructure
- Historical installation tracking
- Predictive maintenance capabilities
- Integration with other field tools

## Next Steps

1. **Validation** (Week 1)
   - Confirm QFieldCloud project structure
   - Verify database schemas
   - Test data access permissions

2. **Prototype** (Week 2-3)
   - Build basic sync script
   - Test with sample data
   - Validate data transformations

3. **Production** (Week 4-5)
   - Deploy sync module
   - Configure monitoring
   - Train field teams

4. **Enhancement** (Ongoing)
   - Add real-time notifications
   - Implement conflict resolution
   - Expand to other infrastructure types

## Conclusion

The integration between QFieldCloud and FibreFlow's fiber-stringing module is technically feasible and will provide significant operational benefits. The existing infrastructure (QFieldCloud deployment and sync modules) provides a solid foundation for implementation. The phased approach allows for quick wins while building toward a comprehensive solution.

## Resources

- QFieldCloud API: https://docs.qfield.org/reference/qfieldcloud/api/
- PostGIS Documentation: https://postgis.net/docs/
- FibreFlow API: Internal documentation
- PM2 Process Manager: https://pm2.keymetrics.io/

## Contact

For questions about this integration:
- QFieldCloud VPS: Use `@qfield-agent` in Claude Code
- FibreFlow Development: Internal team
- Field Operations: Project managers