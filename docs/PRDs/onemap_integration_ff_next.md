# PRD: 1Map GIS Integration - FF_Next Project

**Document Version:** 1.0
**Project:** FibreFlow Next.js (FF_Next)
**Database:** Neon PostgreSQL
**Connection String:** `postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-aged-poetry-a9bbd8e9-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require`
**Created:** 2026-01-07
**Status:** Draft - Awaiting Approval

---

## Executive Summary

Integrate 1Map GIS API installation data into FibreFlow Next.js using **hybrid caching architecture** (Neon PostgreSQL cache + on-demand API refresh). This enables real-time network topology validation, photo verification, comprehensive reporting, and dashboard analytics for all fiber installation projects.

### Business Value
- **Network Validation**: Compare planned network design vs actual installed infrastructure
- **Photo Verification**: AI-powered quality assurance of installation photos
- **Real-time Reporting**: Live dashboards showing installation progress across all sites
- **Cost Optimization**: Reduce field visits by 40% through better visibility
- **Data Centralization**: Single source of truth for installation data

### Success Metrics
- Sync 25,000+ installation records across 4 sites in <5 minutes
- Enable self-service site management (add new projects without code changes)
- Achieve <100ms query response time for cached data
- Support network topology validation with 10m GPS accuracy

---

## 1. Business Context

### 1.1 Problem Statement

**Current Pain Points:**
1. **Data Silos**: Installation data locked in 1Map, inaccessible to other systems
2. **Manual Processes**: Network topology validation requires manual GIS work
3. **Limited Visibility**: No real-time dashboard for installation progress
4. **Photo Verification**: Installation photos not integrated with QA pipeline
5. **Reporting Overhead**: Excel reports generated manually from 1Map exports

**Impact:**
- Project managers spend 8+ hours/week on manual reporting
- Network planners can't validate planned vs actual installations programmatically
- QA team has no automated photo verification workflow
- Executive dashboards show outdated data (weekly manual updates)

### 1.2 Proposed Solution

**Hybrid Caching Architecture:**
```
1Map API (Source of Truth)
    ↓ Scheduled/On-Demand Sync
Neon PostgreSQL (Local Cache)
    ↓ Fast Queries (<100ms)
FF_Next Application (Dashboard, Reports, Validation)
```

**Key Features:**
1. **Automated Sync**: Daily incremental syncs + on-demand refresh
2. **Self-Service Sites**: Add new projects via CLI without code changes
3. **Network Validation**: Spatial comparison of planned vs actual poles
4. **Photo Integration**: Link installation photos to QA pipeline
5. **Real-time Dashboards**: Live installation progress tracking

### 1.3 Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Initial Sync Time** | <5 min for 25K records | Lawley full sync |
| **Incremental Sync** | <2 min | Daily update runtime |
| **Query Performance** | <100ms p95 | Cached DR lookup |
| **Data Freshness** | <24 hours | Last sync timestamp |
| **Site Onboarding** | <5 min | CLI command to production |
| **Cost** | $0/month | Free tier PostgreSQL + 1Map API |

---

## 2. Technical Architecture

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    FF_Next Application                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │   Reports    │  │  Validation  │     │
│  │   (Next.js)  │  │   (Excel)    │  │   (Spatial)  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │  Neon PostgreSQL     │
                  │  onemap schema       │
                  │  - installations     │
                  │  - sync_log          │
                  │  - photo_downloads   │
                  │  - site_config       │
                  └──────────┬───────────┘
                             │
                             ▼ Sync Agent
                  ┌──────────────────────┐
                  │   1Map GIS API       │
                  │   Layer 5121         │
                  │   (Fibertime)        │
                  └──────────────────────┘
```

### 2.2 Data Flow

**1. Initial Full Sync:**
```
OneMapSyncAgent.sync_site_full('LAW')
  ↓
1Map API: GET /api/apps/app/getattributes (474 pages @ 50/page)
  ↓
Calculate checksums (MD5)
  ↓
Batch INSERT to onemap.installations (23,665 records)
  ↓
Log to onemap.sync_log
```

**2. Daily Incremental Sync:**
```
Cron: 2 AM daily
  ↓
OneMapSyncAgent.sync_site_incremental('LAW')
  ↓
Load existing checksums from DB
  ↓
Fetch all records from 1Map API
  ↓
Compare checksums (changed records only)
  ↓
Batch UPDATE changed records (~5% daily)
  ↓
Log to onemap.sync_log
```

**3. On-Demand Single DR Refresh:**
```
User: boss onemap sync --dr DR1734472
  ↓
1Map API: Search for DR1734472
  ↓
UPSERT to onemap.installations
  ↓
Return updated record
```

### 2.3 Database Schema

**Connection Details:**
- **Database**: `neondb`
- **Host**: `ep-aged-poetry-a9bbd8e9-pooler.gwc.azure.neon.tech`
- **User**: `neondb_owner`
- **SSL**: Required (`sslmode=require`)
- **Channel Binding**: Required

**Schema: `onemap`**

#### Data Model Hierarchy

The 1Map data follows a hierarchical structure reflecting the physical fiber network:

```
Site (Project)                       -- e.g., Lawley, Mohadin
  └── Section                        -- Geographic area within site
       └── PON                       -- Passive Optical Network splitter
            └── Pole                 -- Physical pole infrastructure
                 └── Installation    -- Customer home install (DR number = PRIMARY UID)
                      └── Transaction -- 1Map workflow stage (signup, pole permission, install)
```

**Key Concept - DR Number vs Transaction:**
- **DR Number**: The PRIMARY unique identifier for a physical customer installation location
- **Transaction**: Internal 1Map workflow stages - each DR can have MULTIPLE transactions as it progresses through signup → pole permission → installation → completion

---

**Table 1: `onemap.sites`** (Projects)
```sql
CREATE TABLE onemap.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Site identification
    site_code VARCHAR(10) UNIQUE NOT NULL,    -- LAW, MOH, MAM, KWN
    site_name VARCHAR(100) NOT NULL,          -- "Lawley", "Mohadin"

    -- Sync configuration
    enabled BOOLEAN DEFAULT true,
    sync_interval VARCHAR(20) DEFAULT 'daily', -- daily, hourly, manual
    priority VARCHAR(20) DEFAULT 'standard',   -- high, standard, low

    -- Sync status
    last_full_sync TIMESTAMPTZ,
    last_incremental_sync TIMESTAMPTZ,
    total_installations INTEGER DEFAULT 0,

    -- Integration
    project_mapping JSONB,                     -- Link to projects.json

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial data
INSERT INTO onemap.sites (site_code, site_name, enabled) VALUES
    ('LAW', 'Lawley', true),
    ('MOH', 'Mohadin', true),
    ('MAM', 'Mamelodi', true),
    ('KWN', 'Kwanokuthula', true);
```

---

**Table 2: `onemap.sections`** (Geographic areas within a site)
```sql
CREATE TABLE onemap.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent relationship
    site_id UUID REFERENCES onemap.sites(id) ON DELETE CASCADE,

    -- Section identification (from 1Map API)
    section_code VARCHAR(50) NOT NULL,        -- API field: 'section'
    section_name VARCHAR(100),

    -- Spatial data (optional - if section boundaries available)
    geom GEOMETRY(Polygon, 4326),

    -- Sync metadata
    checksum VARCHAR(32),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (site_id, section_code)
);

CREATE INDEX idx_sections_site ON onemap.sections(site_id);
CREATE INDEX idx_sections_code ON onemap.sections(section_code);
CREATE INDEX idx_sections_geom ON onemap.sections USING GIST(geom);
```

---

**Table 3: `onemap.pons`** (Passive Optical Network splitters)
```sql
CREATE TABLE onemap.pons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent relationship
    section_id UUID REFERENCES onemap.sections(id) ON DELETE CASCADE,

    -- PON identification (from 1Map API)
    pon_code VARCHAR(50) NOT NULL,            -- API field: 'pon'
    pon_name VARCHAR(100),

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geom GEOMETRY(Point, 4326),

    -- Capacity tracking
    capacity INTEGER,                          -- Max connections
    active_connections INTEGER DEFAULT 0,      -- Current connections

    -- Sync metadata
    checksum VARCHAR(32),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (section_id, pon_code)
);

CREATE INDEX idx_pons_section ON onemap.pons(section_id);
CREATE INDEX idx_pons_code ON onemap.pons(pon_code);
CREATE INDEX idx_pons_geom ON onemap.pons USING GIST(geom);
```

---

**Table 4: `onemap.poles`** (Physical pole infrastructure)
```sql
CREATE TABLE onemap.poles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent relationship
    pon_id UUID REFERENCES onemap.pons(id) ON DELETE SET NULL,

    -- Pole identification (from 1Map API)
    pole_number VARCHAR(50) UNIQUE NOT NULL,  -- API field: 'pole' (e.g., LAW-P-00123)

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geom GEOMETRY(Point, 4326),

    -- Metadata
    pole_type VARCHAR(50),                    -- Type of pole (if available)
    installation_count INTEGER DEFAULT 0,     -- DRs connected to this pole

    -- Sync metadata
    checksum VARCHAR(32),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_poles_pon ON onemap.poles(pon_id);
CREATE INDEX idx_poles_number ON onemap.poles(pole_number);
CREATE INDEX idx_poles_geom ON onemap.poles USING GIST(geom);
```

---

**Table 5: `onemap.installations`** (Customer home installs - DR = PRIMARY UID)
```sql
CREATE TABLE onemap.installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent relationship
    pole_id UUID REFERENCES onemap.poles(id) ON DELETE SET NULL,

    -- PRIMARY IDENTIFIER - DR Number is the UID for each customer location
    dr_number VARCHAR(20) UNIQUE NOT NULL,    -- API field: 'drp' (e.g., DR1734472)

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geom GEOMETRY(Point, 4326),
    address TEXT,

    -- Current status (latest from transactions)
    current_status VARCHAR(50),               -- "Installed", "Pending", etc.
    current_stage VARCHAR(100),               -- Latest workflow stage

    -- Sync metadata
    checksum VARCHAR(32),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_installations_dr ON onemap.installations(dr_number);
CREATE INDEX idx_installations_pole ON onemap.installations(pole_id);
CREATE INDEX idx_installations_status ON onemap.installations(current_status);
CREATE INDEX idx_installations_synced ON onemap.installations(last_synced_at DESC);
CREATE INDEX idx_installations_geom ON onemap.installations USING GIST(geom);
```

---

**Table 6: `onemap.transactions`** (1Map workflow stages - NOT physical properties)

Each DR can have MULTIPLE transactions as it moves through workflow stages:
- Home Sign Ups → Pole Permission → Home Installation → Completion

```sql
CREATE TABLE onemap.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent relationship
    installation_id UUID REFERENCES onemap.installations(id) ON DELETE CASCADE,

    -- 1Map internal identifier (prop_id in API response)
    transaction_id INTEGER NOT NULL,          -- API field: 'prop_id' (e.g., 391251)

    -- Workflow stage and status
    stage VARCHAR(100),                       -- "Home Sign Ups", "Pole Permission", "Installation"
    status VARCHAR(50),                       -- "Approved", "Pending", "Installed"

    -- 1Map timestamps
    onemap_created TIMESTAMPTZ,               -- API field: 'created'
    onemap_modified TIMESTAMPTZ,              -- API field: 'modified'

    -- 16 Photo fields (JSONB for flexibility)
    -- Each contains: {"attachment_id": 12345, "url": "https://..."}
    ph_prop JSONB,        -- Property photo
    ph_sign1 JSONB,       -- Customer signature 1
    ph_sign2 JSONB,       -- Customer signature 2
    ph_wall JSONB,        -- Wall mount photo
    ph_powm1 JSONB,       -- Power meter reading 1
    ph_powm2 JSONB,       -- Power meter reading 2
    ph_drop JSONB,        -- Drop cable photo
    ph_conn1 JSONB,       -- Connection photo 1
    ph_hh1 JSONB,         -- House/Home photo 1
    ph_hh2 JSONB,         -- House/Home photo 2
    ph_hm_ln JSONB,       -- Home line photo
    ph_hm_en JSONB,       -- Home entrance photo
    ph_outs JSONB,        -- Outside photo
    ph_cbl_r JSONB,       -- Cable routing photo
    ph_bl JSONB,          -- Building photo
    ph_after JSONB,       -- After installation photo

    -- Additional raw data from API (for future fields)
    raw_data JSONB,

    -- Sync metadata
    checksum VARCHAR(32),                     -- MD5 for change detection
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints - each transaction_id unique per installation
    UNIQUE (installation_id, transaction_id)
);

CREATE INDEX idx_transactions_installation ON onemap.transactions(installation_id);
CREATE INDEX idx_transactions_id ON onemap.transactions(transaction_id);
CREATE INDEX idx_transactions_stage ON onemap.transactions(stage);
CREATE INDEX idx_transactions_status ON onemap.transactions(status);
CREATE INDEX idx_transactions_synced ON onemap.transactions(last_synced_at DESC);
```

---

**Table 7: `onemap.sync_log`**
```sql
CREATE TABLE onemap.sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Sync metadata
    sync_type VARCHAR(20) NOT NULL,           -- full, incremental, single_dr
    site_code VARCHAR(10),                    -- LAW (null for single_dr)
    dr_number VARCHAR(20),                    -- DR1734472 (null for site syncs)

    -- Statistics
    records_fetched INTEGER,
    records_created INTEGER,
    records_updated INTEGER,
    records_unchanged INTEGER,
    records_failed INTEGER,

    -- Performance
    duration_seconds DECIMAL(10, 2),
    api_calls INTEGER,

    -- Results
    status VARCHAR(20) NOT NULL,              -- success, partial, failed
    error_message TEXT,
    error_details JSONB,

    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sync_log_site_code ON onemap.sync_log(site_code);
CREATE INDEX idx_sync_log_started_at ON onemap.sync_log(started_at DESC);
CREATE INDEX idx_sync_log_status ON onemap.sync_log(status);
```

**Table 8: `onemap.photo_downloads`** (Future Phase - Lazy Loading)
```sql
CREATE TABLE onemap.photo_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to transaction (photos are per-transaction, not per-installation)
    transaction_id UUID REFERENCES onemap.transactions(id) ON DELETE CASCADE,
    photo_type VARCHAR(20) NOT NULL,          -- ph_prop, ph_drop, etc.

    -- 1Map metadata
    attachment_id INTEGER,
    onemap_url TEXT,

    -- Local storage
    local_path TEXT,
    file_size INTEGER,
    file_hash VARCHAR(64),                    -- SHA256 for dedup

    -- Download status
    downloaded BOOLEAN DEFAULT false,
    download_attempted_at TIMESTAMPTZ,
    download_completed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photo_downloads_transaction ON onemap.photo_downloads(transaction_id);
CREATE INDEX idx_photo_downloads_hash ON onemap.photo_downloads(file_hash);
```

---

**Views:**

```sql
-- View 1: Full Installation Hierarchy (Site → Section → PON → Pole → DR)
CREATE VIEW onemap.v_installation_hierarchy AS
SELECT
    s.site_code,
    s.site_name,
    sec.section_code,
    sec.section_name,
    p.pon_code,
    pol.pole_number,
    i.dr_number,
    i.address,
    i.current_status,
    i.latitude,
    i.longitude,
    i.last_synced_at
FROM onemap.installations i
LEFT JOIN onemap.poles pol ON i.pole_id = pol.id
LEFT JOIN onemap.pons p ON pol.pon_id = p.id
LEFT JOIN onemap.sections sec ON p.section_id = sec.id
LEFT JOIN onemap.sites s ON sec.site_id = s.id
ORDER BY s.site_code, sec.section_code, p.pon_code, pol.pole_number, i.dr_number;

-- View 2: Installation with Transaction Photo Count
CREATE VIEW onemap.v_installations_with_photos AS
SELECT
    i.dr_number,
    i.address,
    i.current_status,
    i.current_stage,
    COUNT(t.id) as transaction_count,
    SUM(
        CASE WHEN t.ph_prop IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN t.ph_drop IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN t.ph_wall IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN t.ph_after IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN t.ph_powm1 IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN t.ph_powm2 IS NOT NULL THEN 1 ELSE 0 END
    ) as total_photo_count,
    MAX(t.onemap_modified) as latest_transaction_date
FROM onemap.installations i
LEFT JOIN onemap.transactions t ON t.installation_id = i.id
GROUP BY i.id, i.dr_number, i.address, i.current_status, i.current_stage;

-- View 3: Sync Statistics by Site
CREATE VIEW onemap.v_sync_stats AS
SELECT
    s.site_code,
    s.site_name,
    s.total_installations,
    s.last_full_sync,
    s.last_incremental_sync,
    COUNT(l.id) as total_syncs,
    SUM(CASE WHEN l.status = 'success' THEN 1 ELSE 0 END) as successful_syncs,
    AVG(l.duration_seconds) as avg_duration_seconds
FROM onemap.sites s
LEFT JOIN onemap.sync_log l ON l.site_code = s.site_code
GROUP BY s.id, s.site_code, s.site_name, s.total_installations,
         s.last_full_sync, s.last_incremental_sync;

-- View 4: Stale Installations (not synced in 48+ hours)
CREATE VIEW onemap.v_stale_installations AS
SELECT
    s.site_code,
    s.site_name,
    pol.pole_number,
    i.dr_number,
    i.current_status,
    i.last_synced_at
FROM onemap.installations i
LEFT JOIN onemap.poles pol ON i.pole_id = pol.id
LEFT JOIN onemap.pons p ON pol.pon_id = p.id
LEFT JOIN onemap.sections sec ON p.section_id = sec.id
LEFT JOIN onemap.sites s ON sec.site_id = s.id
WHERE i.last_synced_at < NOW() - INTERVAL '48 hours'
ORDER BY i.last_synced_at ASC;
```

---

## 3. API Integration

### 3.1 1Map API Documentation

**Base URL:** `https://www.1map.co.za`

**Authentication:** Session-based (cookies)
- Method: `POST /login`
- Content-Type: `application/x-www-form-urlencoded`
- Credentials: `ONEMAP_EMAIL`, `ONEMAP_PASSWORD` (from `.env`)
- Session Cookies: `connect.sid`, `csrfToken`
- Session Duration: ~2 hours

**Primary Endpoint:** Installation Search
- **URL**: `POST /api/apps/app/getattributes`
- **Content-Type**: `application/x-www-form-urlencoded; charset=UTF-8`

**Request Parameters:**
```python
{
    "ungeocoded": "false",
    "left": "0",              # Bounding box (not used for search)
    "bottom": "0",
    "right": "0",
    "top": "0",
    "selfilter": "",
    "action": "get",
    "email": "hein@velocityfibre.co.za",
    "layerid": "5121",        # Fibertime Installations
    "sort": "prop_id",
    "templateExpression": "",
    "q": "lawley",            # Search query (site code or DR number)
    "page": "1",
    "start": "0",             # (page - 1) * limit
    "limit": "50"             # Max 50 per page
}
```

**Response Structure:**
```json
{
    "success": true,
    "total_pages": 474,
    "current_page": 1,
    "result": [
        {
            "drp": "DR1734472",
            "pole": "LAW-P-00123",
            "site": "LAW",
            "latitude": "-26.123456",
            "longitude": "27.654321",
            "address": "123 Main Street, Lawley",
            "status": "Installed",
            "prop_id": 391251,
            "created": "2024-12-01T10:30:00Z",
            "modified": "2024-12-15T14:22:00Z",

            // Photo fields (URL format)
            "ph_prop": "https://www.1map.co.za/attachments/file/5121/391251/12345",
            "ph_drop": "https://www.1map.co.za/attachments/file/5121/391251/12346",
            "ph_wall": "https://www.1map.co.za/attachments/file/5121/391251/12347",
            // ... 13 more photo fields
        }
    ]
}
```

**Layer IDs:**
- `5121` - Fibertime Installations (PRIMARY)
- `5198` - Fibertime Poles (FUTURE)

### 3.2 Error Handling

**Authentication Errors:**
- **401 Unauthorized**: Session expired → Re-authenticate
- **403 Forbidden**: Invalid credentials → Alert user

**API Errors:**
- **429 Too Many Requests**: Rate limit → Exponential backoff (1s, 2s, 4s, 8s)
- **500 Server Error**: Retry up to 3 times
- **Network Timeout**: Retry with increased timeout

**Retry Strategy:**
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8)
)
async def search_installations(self, query: str):
    # Implementation
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Week 1) - **PRIORITY**

**Goal:** Basic sync for Lawley site with dynamic site management

**Tasks:**
1. **Database Setup**
   - Create `infrastructure/postgres/schema/004_onemap_integration.sql`
   - Run migration:
     ```bash
     psql 'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-aged-poetry-a9bbd8e9-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require' -f infrastructure/postgres/schema/004_onemap_integration.sql
     ```

2. **OneMapClient (API Layer)**
   - File: `lib/integrations/onemap_client.ts` (TypeScript for Next.js)
   - Methods:
     - `authenticate()` - Session-based login
     - `searchInstallations(query, page, limit)` - Fetch installations
     - `getSingleDR(drNumber)` - Get specific DR
     - `getAllInstallations(siteCode)` - Paginate all records
   - Features:
     - Retry logic with exponential backoff
     - Session management (re-auth on 401)
     - Progress tracking (tqdm-style)

3. **OneMapSyncAgent (Sync Orchestrator)**
   - File: `lib/integrations/onemap_sync_agent.ts`
   - Methods:
     - `syncSiteFull(siteCode)` - Complete site sync
     - `calculateChecksum(record)` - MD5 hashing
     - `processRecords(records)` - Batch INSERT/UPDATE
   - Database: Direct Neon PostgreSQL writes (Drizzle ORM)

4. **CLI Commands**
   - File: Update `package.json` scripts or create `scripts/onemap.ts`
   - Commands:
     ```bash
     npm run onemap:sync -- --site LAW --mode full
     npm run onemap:query -- --dr DR1734472
     npm run onemap:sites:list
     npm run onemap:sites:add -- --code XXX --name "Site Name"
     ```

**Deliverables:**
- ✅ Database schema deployed to Neon
- ✅ OneMapClient connects and authenticates
- ✅ Lawley site syncs 23,665 records in <5 minutes
- ✅ Data queryable via `SELECT * FROM onemap.installations WHERE site_code = 'LAW'`
- ✅ CLI commands functional
- ✅ Can add new sites dynamically without code changes

**Acceptance Criteria:**
```sql
-- Verify sync success (query via hierarchy view)
SELECT COUNT(*) FROM onemap.v_installation_hierarchy WHERE site_code = 'LAW';
-- Expected: ~23,665

-- Check sync log
SELECT * FROM onemap.sync_log ORDER BY started_at DESC LIMIT 1;
-- Expected: status = 'success', records_created = 23665

-- Verify sites
SELECT * FROM onemap.sites;
-- Expected: 4 rows (LAW, MOH, MAM, KWN)
```

---

### Phase 2: Incremental Sync (Week 2)

**Goal:** Efficient change detection and scheduled syncs

**Tasks:**
1. Implement `syncSiteIncremental(siteCode)` method
   - Load existing checksums from DB
   - Compare with API response
   - Process only changed records (~5% daily)

2. Create scheduled sync script
   - File: `scripts/onemap_scheduled_sync.ts`
   - Cron: `0 2 * * *` (2 AM daily)
   - Load enabled sites from `onemap.sites` table
   - Run incremental sync for each

3. Add monitoring dashboard
   - Route: `/api/onemap/status`
   - Show sync health per site
   - Display last sync time, record count, errors

**Deliverables:**
- ✅ Incremental sync <2 minutes (vs 5 min full)
- ✅ All 4 sites syncing daily via cron
- ✅ Sync statistics visible in dashboard
- ✅ Email alerts on sync failures

---

### Phase 3: Dashboard Integration (Week 3)

**Goal:** Real-time installation tracking and photo integration

**Tasks:**
1. Create Next.js dashboard pages
   - Route: `/installations` - List all installations with filters
   - Route: `/installations/[dr]` - Single DR detail view
   - Route: `/sites/[code]` - Site-level statistics

2. Link to photo verification pipeline
   - Fetch photo URLs from `onemap.installations`
   - Display in QA dashboard
   - Enable lazy-load downloads

3. Add real-time sync status
   - WebSocket updates during sync operations
   - Progress bar showing records processed

**Deliverables:**
- ✅ Dashboard shows live installation data
- ✅ Photos visible in QA workflow
- ✅ Real-time sync progress visible

---

### Phase 4: Network Topology Validation (Week 4)

**Goal:** Compare planned vs actual infrastructure

**Tasks:**
1. Create validation API endpoint
   - Route: `/api/validation/topology`
   - Input: Site code, planned network GeoJSON
   - Output: Discrepancy report (missing poles, extra poles)

2. Spatial matching logic
   - PostGIS `ST_DWithin()` for 10m tolerance
   - Match planned poles to actual poles by GPS

3. Generate validation reports
   - Excel export with planned vs actual comparison
   - Highlight discrepancies

**Deliverables:**
- ✅ API accepts planned network data
- ✅ Spatial matching working (10m tolerance)
- ✅ Validation reports downloadable

---

### Phase 5: Reporting & Analytics (Week 5)

**Goal:** Comprehensive reports and executive dashboards

**Tasks:**
1. Excel report generation
   - Sheets: Summary, Installations, Photos, Sync History
   - Downloadable via `/api/reports/installations?site=LAW`

2. Executive dashboard
   - Route: `/dashboard/executive`
   - KPIs: Total installations, completion %, photos uploaded
   - Charts: Progress over time, site comparison

**Deliverables:**
- ✅ Daily Excel reports auto-generated
- ✅ Executive dashboard live
- ✅ PDF reports with maps (using Mapbox GL)

---

## 5. Data Mapping

### 5.1 Available Fields (1Map → Neon)

**Core Hierarchy Fields:**

| User Requirement | 1Map API Field | Neon Table | Neon Column | Data Type |
|------------------|----------------|------------|-------------|-----------|
| Site/Project | `site` | `sites` | `site_code` | VARCHAR(10) |
| Section (Zone) | `section` | `sections` | `section_code` | VARCHAR(50) |
| PON | `pon` | `pons` | `pon_code` | VARCHAR(50) |
| Pole Number | `pole` | `poles` | `pole_number` | VARCHAR(50) |
| Drop Number (PRIMARY UID) | `drp` | `installations` | `dr_number` | VARCHAR(20) |
| Transaction ID | `prop_id` | `transactions` | `transaction_id` | INTEGER |

**Installation Fields:**

| User Requirement | 1Map API Field | Neon Table | Neon Column | Data Type |
|------------------|----------------|------------|-------------|-----------|
| Device Location (Lat) | `latitude` | `installations` | `latitude` | DECIMAL(10,8) |
| Device Location (Lon) | `longitude` | `installations` | `longitude` | DECIMAL(11,8) |
| Address | `address` | `installations` | `address` | TEXT |
| Status | `status` | `transactions` | `status` | VARCHAR(50) |
| Stage | (derived) | `transactions` | `stage` | VARCHAR(100) |
| Created | `created` | `transactions` | `onemap_created` | TIMESTAMPTZ |
| Modified | `modified` | `transactions` | `onemap_modified` | TIMESTAMPTZ |

**Photo Fields (16 types - stored in `transactions` table):**

| Photo Type | 1Map API Field | Neon Column | Data Type |
|------------|----------------|-------------|-----------|
| Property Photo | `ph_prop` | `ph_prop` | JSONB |
| Customer Signature 1 | `ph_sign1` | `ph_sign1` | JSONB |
| Customer Signature 2 | `ph_sign2` | `ph_sign2` | JSONB |
| Wall Mount Photo | `ph_wall` | `ph_wall` | JSONB |
| Power Meter 1 | `ph_powm1` | `ph_powm1` | JSONB |
| Power Meter 2 | `ph_powm2` | `ph_powm2` | JSONB |
| Drop Cable | `ph_drop` | `ph_drop` | JSONB |
| Connection 1 | `ph_conn1` | `ph_conn1` | JSONB |
| House Photo 1 | `ph_hh1` | `ph_hh1` | JSONB |
| House Photo 2 | `ph_hh2` | `ph_hh2` | JSONB |
| Home Line | `ph_hm_ln` | `ph_hm_ln` | JSONB |
| Home Entrance | `ph_hm_en` | `ph_hm_en` | JSONB |
| Outside Photo | `ph_outs` | `ph_outs` | JSONB |
| Cable Routing | `ph_cbl_r` | `ph_cbl_r` | JSONB |
| Building Photo | `ph_bl` | `ph_bl` | JSONB |
| After Installation | `ph_after` | `ph_after` | JSONB |

**Photo JSONB Format:**
```json
{
  "attachment_id": 12345,
  "url": "https://www.1map.co.za/attachments/file/5121/391251/12345",
  "downloaded": false,
  "local_path": null
}
```

### 5.2 Missing Fields (Not in 1Map)

These fields are **NOT available** in 1Map API and will be left empty:
- Stand Numbers
- House Number
- Primary House vs Backyard Dwelling
- Nokia ONT Activation Code
- ONT activation light level
- Cable lengths (data only - photos available)
- Power meter readings (data only - photos available)
- Mini-UPS serial numbers
- Relevant comments/notes
- Dome Joint Numbers
- Backyard identifiers

**Note:** Sections and PONs ARE available in the 1Map API and are mapped to `onemap.sections` and `onemap.pons` tables.

**User Decision:** Leave missing fields empty for now (focus on 1Map-available fields only)

---

## 6. File Structure

### 6.1 New Files

```
ff_next/
├── lib/
│   └── integrations/
│       ├── onemap_client.ts           # 1Map API client
│       ├── onemap_sync_agent.ts       # Sync orchestrator
│       └── onemap_types.ts            # TypeScript types
│
├── app/
│   ├── installations/
│   │   ├── page.tsx                   # List view
│   │   └── [dr]/
│   │       └── page.tsx               # Detail view
│   │
│   ├── sites/
│   │   └── [code]/
│   │       └── page.tsx               # Site statistics
│   │
│   └── api/
│       ├── onemap/
│       │   ├── sync/route.ts          # Trigger sync
│       │   ├── query/route.ts         # Query installations
│       │   └── status/route.ts        # Sync status
│       │
│       └── validation/
│           └── topology/route.ts      # Network validation
│
├── infrastructure/
│   └── postgres/
│       └── schema/
│           └── 004_onemap_integration.sql
│
└── scripts/
    ├── onemap.ts                      # CLI commands
    └── onemap_scheduled_sync.ts       # Cron job
```

### 6.2 Modified Files

```
ff_next/
├── package.json                       # Add CLI scripts
├── .env.local                         # Add 1Map credentials
└── drizzle/
    └── schema/
        └── onemap.ts                  # Drizzle ORM schema
```

---

## 7. CLI Commands Reference

### 7.1 Sync Operations

```bash
# Full sync for specific site
npm run onemap:sync -- --site LAW --mode full

# Incremental sync (changed records only)
npm run onemap:sync -- --site LAW --mode incremental

# Sync single DR
npm run onemap:sync -- --dr DR1734472

# Sync all enabled sites
npm run onemap:sync -- --all-sites

# Refresh site (force full sync)
npm run onemap:refresh -- --site LAW
```

### 7.2 Query Operations

```bash
# Query specific DR
npm run onemap:query -- --dr DR1734472

# Query site installations (paginated)
npm run onemap:query -- --site LAW --limit 10 --page 2

# Export to JSON
npm run onemap:export -- --site LAW --output lawley_installations.json
```

### 7.3 Site Management (Dynamic)

```bash
# List all configured sites
npm run onemap:sites:list

# Add new site
npm run onemap:sites:add -- --code XXX --name "New Site Name"

# Enable site for sync
npm run onemap:sites:enable -- --code LAW

# Disable site (stop auto-sync)
npm run onemap:sites:disable -- --code LAW

# Configure site sync interval
npm run onemap:sites:config -- --code LAW --interval daily

# Remove site
npm run onemap:sites:remove -- --code XXX

# Auto-discover sites from 1Map API
npm run onemap:sites:discover
```

### 7.4 Status & Monitoring

```bash
# Show sync status for all sites
npm run onemap:status

# Show sync status for specific site
npm run onemap:status -- --site LAW

# Show sync history (last 10 syncs)
npm run onemap:history -- --limit 10

# Validate data integrity
npm run onemap:validate -- --site LAW
```

---

## 8. Security & Configuration

### 8.1 Environment Variables

**File:** `.env.local`

```bash
# 1Map API Credentials
ONEMAP_EMAIL=hein@velocityfibre.co.za
ONEMAP_PASSWORD=VeloF@2025
ONEMAP_BASE_URL=https://www.1map.co.za

# Neon PostgreSQL Connection
DATABASE_URL=postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-aged-poetry-a9bbd8e9-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require

# Sync Configuration
ONEMAP_SYNC_INTERVAL=daily
ONEMAP_SYNC_BATCH_SIZE=500
ONEMAP_SYNC_MAX_RETRIES=3
```

### 8.2 Security Best Practices

1. **Never Commit Credentials**
   - Add `.env.local` to `.gitignore`
   - Use environment variables only
   - Rotate credentials quarterly

2. **Database Connection Security**
   - Always use `sslmode=require`
   - Use connection pooling (Neon handles this)
   - Limit database user permissions

3. **API Rate Limiting**
   - Implement exponential backoff
   - Track API call count in `sync_log`
   - Alert if approaching limits

4. **Audit Logging**
   - Log all sync operations to `onemap.sync_log`
   - Track who triggered manual syncs
   - Monitor for unusual patterns

---

## 9. Performance Requirements

### 9.1 Performance Targets

| Operation | Target | Max Acceptable | Measurement |
|-----------|--------|----------------|-------------|
| **Full Sync (Lawley 23K)** | <5 min | <10 min | Wall clock time |
| **Incremental Sync** | <2 min | <5 min | Wall clock time |
| **Single DR Refresh** | <2 sec | <5 sec | API + DB time |
| **Query Cached DR** | <100 ms | <500 ms | p95 latency |
| **Dashboard Load** | <1 sec | <3 sec | First contentful paint |
| **Pagination (50 records)** | <200 ms | <1 sec | API response time |

### 9.2 Optimization Strategies

**1. Connection Pooling**
```typescript
// Use Neon's built-in pooler
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000
});
```

**2. Batch Processing**
```typescript
// Insert records in batches of 500
const BATCH_SIZE = 500;
for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const batch = records.slice(i, i + BATCH_SIZE);
  await db.insert(installations).values(batch);
}
```

**3. Parallel API Calls**
```typescript
// Fetch multiple pages in parallel (max 5 concurrent)
const pagePromises = Array.from({ length: totalPages }, (_, i) =>
  fetchPage(i + 1)
);
const results = await Promise.all(pagePromises);
```

**4. Checksum-Based Change Detection**
```typescript
import crypto from 'crypto';

function calculateChecksum(record: any): string {
  const json = JSON.stringify(record, Object.keys(record).sort());
  return crypto.createHash('md5').update(json).digest('hex');
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

**File:** `lib/integrations/__tests__/onemap_client.test.ts`

```typescript
describe('OneMapClient', () => {
  test('authenticates successfully', async () => {
    const client = new OneMapClient(email, password);
    const result = await client.authenticate();
    expect(result).toBe(true);
  });

  test('searches installations', async () => {
    const result = await client.searchInstallations('lawley');
    expect(result.success).toBe(true);
    expect(result.result.length).toBeGreaterThan(0);
  });

  test('handles authentication failure', async () => {
    const client = new OneMapClient('invalid@example.com', 'wrong');
    await expect(client.authenticate()).rejects.toThrow();
  });
});
```

### 10.2 Integration Tests

**File:** `lib/integrations/__tests__/onemap_sync_agent.test.ts`

```typescript
describe('OneMapSyncAgent', () => {
  test('syncs site successfully', async () => {
    const agent = new OneMapSyncAgent();
    const result = await agent.syncSiteFull('LAW');

    expect(result.status).toBe('success');
    expect(result.recordsCreated).toBeGreaterThan(20000);
  });

  test('detects changed records', async () => {
    // Run initial sync
    await agent.syncSiteFull('LAW');

    // Run incremental sync
    const result = await agent.syncSiteIncremental('LAW');

    expect(result.recordsUnchanged).toBeGreaterThan(result.recordsUpdated);
  });
});
```

### 10.3 End-to-End Tests

**File:** `e2e/onemap.spec.ts` (Playwright)

```typescript
test('displays installations on dashboard', async ({ page }) => {
  await page.goto('/installations');

  // Check table renders
  await expect(page.locator('table')).toBeVisible();

  // Filter by site
  await page.selectOption('select[name="site"]', 'LAW');

  // Verify results
  const rows = await page.locator('tbody tr').count();
  expect(rows).toBeGreaterThan(0);
});

test('triggers manual sync', async ({ page }) => {
  await page.goto('/admin/sync');

  // Click sync button
  await page.click('button:has-text("Sync LAW")');

  // Wait for success message
  await expect(page.locator('.toast-success')).toBeVisible();
});
```

---

## 11. Monitoring & Alerts

### 11.1 Metrics to Track

**Sync Performance:**
- Sync duration (per site)
- Records processed per second
- API calls per sync
- Success rate (%)

**Data Quality:**
- Records with missing GPS coordinates
- Records with 0 photos
- Stale installations (>48 hours)

**System Health:**
- Database connection pool usage
- API error rate
- Memory usage during sync

### 11.2 Alert Conditions

**Critical Alerts:**
- ❌ Sync failed 3 times in a row → Email + Slack
- ❌ Database connection lost → Email + Slack
- ❌ API returns 403 Forbidden → Email (credentials expired)

**Warning Alerts:**
- ⚠️ Sync duration >10 minutes → Email
- ⚠️ Stale installations >500 records → Email
- ⚠️ API error rate >10% → Email

**Info Alerts:**
- ℹ️ Daily sync completed → Slack only
- ℹ️ New site added → Slack only

---

## 12. Cost Analysis

### 12.1 Infrastructure Costs

| Component | Provider | Cost | Notes |
|-----------|----------|------|-------|
| **Database** | Neon PostgreSQL | $0/month | Free tier (3 GB storage) |
| **API Calls** | 1Map GIS | $0/month | Included in Fibertime subscription |
| **Hosting** | Vercel | $0/month | Hobby tier (Next.js) |
| **Total** | | **$0/month** | **FREE** |

### 12.2 Scaling Considerations

**At 100K installations (4x current):**
- Database: Still within free tier (< 1 GB data)
- API Calls: Still free (1Map unlimited)
- Hosting: May need Vercel Pro ($20/month)

**At 1M installations (40x current):**
- Database: Neon Scale ($20/month for 10 GB)
- API Calls: Still free
- Hosting: Vercel Pro ($20/month)
- **Total: $40/month**

---

## 13. Risk Mitigation

### 13.1 Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **1Map API downtime** | Medium | High | Cache data locally, 48-hour grace period |
| **Session expires mid-sync** | Medium | Medium | Auto re-authenticate on 401 |
| **Database connection lost** | Low | High | Connection pooling + retry logic |
| **Data inconsistency** | Low | High | Checksum validation + audit logs |
| **Performance degradation** | Medium | Medium | Batch processing + pagination |

### 13.2 Rollback Plan

If critical issues arise during deployment:

1. **Immediate Rollback**
   ```sql
   DROP SCHEMA onemap CASCADE;
   ```

2. **Restore from Backup**
   - Neon provides point-in-time recovery (PITR)
   - Rollback to pre-migration state

3. **Communication**
   - Notify stakeholders via email
   - Document issues in post-mortem

---

## 14. Success Metrics (KPIs)

### 14.1 Phase 1 Success Metrics

**Technical KPIs:**
- ✅ Lawley site syncs in <5 minutes
- ✅ 23,665+ records inserted successfully
- ✅ Zero critical errors during sync
- ✅ CLI commands respond in <2 seconds

**Business KPIs:**
- ✅ Project managers access installation data via dashboard
- ✅ Data freshness <24 hours
- ✅ Site onboarding time <5 minutes

### 14.2 Phase 5 Success Metrics (End of Implementation)

**Technical KPIs:**
- ✅ All 4 sites syncing daily without intervention
- ✅ Incremental sync <2 minutes
- ✅ 99.9% uptime for sync operations
- ✅ <100ms query response time (p95)

**Business KPIs:**
- ✅ Reporting time reduced by 80% (8 hours → 1.6 hours/week)
- ✅ Network validation automated (0 manual GIS work)
- ✅ Photo verification integrated with QA pipeline
- ✅ Executive dashboards updated real-time

---

## 15. Dependencies

### 15.1 Technical Dependencies

**Runtime:**
- Node.js 18+
- Next.js 14+
- TypeScript 5+
- Drizzle ORM
- PostgreSQL 15+ (Neon)

**Development:**
- Vitest (unit tests)
- Playwright (E2E tests)
- ESLint + Prettier

**External Services:**
- 1Map GIS API (https://www.1map.co.za)
- Neon PostgreSQL (https://neon.tech)

### 15.2 Team Dependencies

**Required Access:**
- 1Map account credentials
- Neon database admin access
- Vercel deployment access (for production)

**Knowledge Required:**
- TypeScript/Next.js development
- PostgreSQL + Drizzle ORM
- RESTful API integration
- PostGIS spatial queries

---

## 16. Acceptance Criteria

### 16.1 Phase 1 Acceptance Criteria

**Database:**
- [ ] Schema deployed to Neon PostgreSQL
- [ ] All 4 tables created with correct indexes
- [ ] Initial site configuration populated (4 sites)
- [ ] Views created and returning data

**API Integration:**
- [ ] OneMapClient authenticates successfully
- [ ] Can fetch installations for Lawley site
- [ ] Session re-authentication works on 401
- [ ] Retry logic handles transient errors

**Sync Agent:**
- [ ] Full sync completes in <5 minutes for Lawley
- [ ] 23,665+ records inserted to database
- [ ] Checksums calculated correctly
- [ ] Sync log records all operations

**CLI:**
- [ ] `npm run onemap:sync -- --site LAW --mode full` works
- [ ] `npm run onemap:query -- --dr DR1734472` works
- [ ] `npm run onemap:sites:list` shows 4 sites
- [ ] `npm run onemap:sites:add` creates new site in DB

**Data Validation:**
- [ ] SQL query returns 23,665 records for Lawley
- [ ] GPS coordinates populated (latitude, longitude)
- [ ] Photo URLs stored in JSONB format
- [ ] No duplicate records (unique constraint enforced)

---

## 17. Appendix

### 17.1 Example Queries

**Query 1: Get all installations for Lawley**
```sql
SELECT
    dr_number,
    pole_number,
    latitude,
    longitude,
    status,
    (ph_prop IS NOT NULL)::int +
    (ph_drop IS NOT NULL)::int +
    (ph_wall IS NOT NULL)::int as photo_count
FROM onemap.installations
WHERE site_code = 'LAW'
ORDER BY last_synced_at DESC
LIMIT 100;
```

**Query 2: Find installations missing GPS coordinates**
```sql
SELECT dr_number, site_code, address
FROM onemap.installations
WHERE latitude IS NULL OR longitude IS NULL;
```

**Query 3: Get sync statistics by site**
```sql
SELECT * FROM onemap.v_sync_stats
ORDER BY total_installations DESC;
```

**Query 4: Find stale installations**
```sql
SELECT * FROM onemap.v_stale_installations
WHERE stale_count > 100;
```

### 17.2 Troubleshooting Guide

**Issue:** Sync takes >10 minutes

**Diagnosis:**
```sql
SELECT
    sync_type,
    site_code,
    records_fetched,
    duration_seconds,
    api_calls
FROM onemap.sync_log
WHERE started_at >= NOW() - INTERVAL '24 hours'
ORDER BY duration_seconds DESC
LIMIT 10;
```

**Solution:**
- Check network latency to 1Map API
- Increase batch size (500 → 1000)
- Reduce concurrent API calls (5 → 3)

---

**Issue:** Authentication fails with 401

**Diagnosis:**
```bash
curl -X POST https://www.1map.co.za/login \
  -d "email=hein@velocityfibre.co.za" \
  -d "password=VeloF@2025" \
  -v
```

**Solution:**
- Verify credentials in `.env.local`
- Check if 1Map account is active
- Confirm IP not blocked by 1Map

---

**Issue:** Duplicate records inserted

**Diagnosis:**
```sql
SELECT
    dr_number,
    property_id,
    site_code,
    COUNT(*)
FROM onemap.installations
GROUP BY dr_number, property_id, site_code
HAVING COUNT(*) > 1;
```

**Solution:**
- Unique constraint should prevent this
- If constraint missing, run:
  ```sql
  ALTER TABLE onemap.installations
  ADD CONSTRAINT unique_dr_property_site
  UNIQUE (dr_number, property_id, site_code);
  ```

---

### 17.3 Glossary

| Term | Definition |
|------|------------|
| **DR Number** | Drop Record Number - Unique identifier for customer installation (e.g., DR1734472) |
| **Property ID** | Transaction ID in 1Map representing a specific installation stage |
| **Site Code** | 3-letter abbreviation for project site (LAW = Lawley) |
| **Pole Number** | Unique identifier for physical pole (e.g., LAW-P-00123) |
| **Layer ID** | 1Map GIS layer identifier (5121 = Fibertime Installations) |
| **Checksum** | MD5 hash of record for change detection |
| **JSONB** | PostgreSQL binary JSON data type (efficient storage + queries) |
| **PostGIS** | PostgreSQL extension for spatial/geographic data |
| **SRID 4326** | Spatial Reference System for WGS84 (GPS coordinates) |

---

## 18. Sign-Off

### 18.1 Approval Required From

- [ ] **Project Manager**: Hein van Vuuren
- [ ] **Technical Lead**: [Name]
- [ ] **Database Admin**: [Name]
- [ ] **QA Lead**: [Name]

### 18.2 Review History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-07 | Claude Code | Initial draft - FF_Next integration with Neon PostgreSQL |

---

**END OF PRD**

**Next Step:** Review and approve this PRD, then proceed with Phase 1 implementation.
