# Database Consolidation Documentation
**Date**: November 6, 2025
**Status**: ✅ COMPLETE

## Overview
FibreFlow app and WA Monitor service now share a single Neon PostgreSQL database.

## Consolidated Database

### Database Details
- **Name**: ep-dry-night-a9qyh4sj
- **Host**: ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech
- **Region**: Azure GWC (Global West Coast)
- **Connection URL**:
  ```
  postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require
  ```

### Tables in Database
**FibreFlow App Tables:**
- `contractors` - Contractor management
- `projects` - Project tracking
- `clients` - Client information
- `staff` - Staff management
- `sow_fibre` - Statement of Work fiber data
- `sow_poles` - SOW pole data
- `sow_drops` - SOW drop data
- And more...

**WA Monitor Tables:**
- `qa_photo_reviews` - QA review drops (553 records as of Nov 6, 2025)
- 12 QA step columns (step_01_house_photo through step_12_customer_signature)

## Configuration Files

### 1. FibreFlow App
**File**: `/home/louisdup/VF/Apps/FF_React/.env.production.local`
```bash
DATABASE_URL="postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require"
```

**Access**:
- App URL: http://localhost:3005
- WA Monitor Dashboard: http://localhost:3005/wa-monitor
- API Endpoint: http://localhost:3005/api/wa-monitor-drops

### 2. WA Monitor Service
**File**: `/home/louisdup/VF/deployments/railway/WA_monitor _Velo_Test/.env`
```bash
NEON_DATABASE_URL=postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Service Components**:
- WhatsApp Bridge (Port 8080)
- Backend API (Port 5000)
- Frontend (Port 3001)
- MCP Server (Port 3000)

## Migration Summary

### What Was Done (Nov 6, 2025)
1. ✅ Exported `qa_photo_reviews` table from old WA Monitor DB (ep-damp-credit)
2. ✅ Imported 553 QA records to FibreFlow DB (ep-dry-night)
3. ✅ Updated FibreFlow `.env.production.local` to point to ep-dry-night
4. ✅ Updated WA Monitor `.env` to point to ep-dry-night
5. ✅ Rebuilt and tested FibreFlow app
6. ✅ Verified both systems work with consolidated database

### Previous Setup (Before Nov 6, 2025)
- **FibreFlow App**: Used ep-dry-night (ep-dry-night-a9qyh4sj)
- **WA Monitor Service**: Used ep-damp-credit (ep-damp-credit-a857vku0)
- **Problem**: Data was split across two databases

## Verification

### Test Queries
```bash
# Count QA reviews
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM qa_photo_reviews;"
# Result: 553 records

# Count contractors
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM contractors;"
# Result: 20 records

# Recent drops
psql "$DATABASE_URL" -c "SELECT drop_number, project, created_at FROM qa_photo_reviews ORDER BY created_at DESC LIMIT 5;"
```

### API Tests
```bash
# WA Monitor API
curl http://localhost:3005/api/wa-monitor-drops | jq '.data | length'
# Expected: 553

# Contractors API
curl http://localhost:3005/api/contractors | jq '.data | length'
# Expected: 20
```

## Next Steps

### For WA Monitor Service
When WA Monitor services are restarted, they will now write to the FibreFlow database automatically:
```bash
cd /home/louisdup/VF/deployments/railway/WA_monitor\ _Velo_Test
# Restart services to pick up new database config
```

### Data Sync
- **Real-time**: New QA reviews from WA Monitor → FibreFlow DB
- **Dashboard**: FibreFlow WA Monitor dashboard shows live data
- **No manual sync needed**: Both systems write to same database

## Old Database (Deprecated)

### ep-damp-credit-a857vku0
- **Status**: ⚠️ DEPRECATED - DO NOT USE
- **Data**: Archived WA Monitor data (pre-Nov 6, 2025)
- **Action**: Can be deleted after verifying all data migrated
- **Verification**: Check WA Monitor dashboard shows recent Nov 6 data

## Support

### If WA Monitor Dashboard Shows Old Data
1. Verify `.env.production.local` points to ep-dry-night
2. Rebuild FibreFlow: `npm run build && PORT=3005 npm start`
3. Check API: `curl http://localhost:3005/api/wa-monitor-drops`

### If WA Monitor Service Not Writing
1. Verify WA Monitor `.env` points to ep-dry-night
2. Restart WA Monitor services
3. Test with new drop submission

## Record Count History
- **Nov 6, 2025 12:00 PM**: 553 QA reviews migrated
- **Nov 6, 2025 10:32 AM**: Last drop (DR1857010) from Mohadin project

---
**Document Version**: 1.0
**Last Updated**: November 6, 2025
**Maintained By**: FibreFlow Development Team
