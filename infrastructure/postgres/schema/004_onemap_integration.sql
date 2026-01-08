-- ============================================================================
-- 1Map GIS Integration Schema
-- Version: 1.0
-- Database: Neon PostgreSQL (hein-dev branch)
-- Created: 2026-01-07
-- ============================================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS onemap;

-- ============================================================================
-- Table 1: onemap.sites (Projects)
-- ============================================================================
CREATE TABLE IF NOT EXISTS onemap.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Site identification
    site_code VARCHAR(10) UNIQUE NOT NULL,    -- LAW, MOH, MAM, KWN
    site_name VARCHAR(100) NOT NULL,          -- "Lawley", "Mohadin"

    -- Link to existing projects table
    project_id UUID,                          -- FK to public.projects

    -- Sync configuration
    enabled BOOLEAN DEFAULT true,
    sync_interval VARCHAR(20) DEFAULT 'daily', -- daily, hourly, manual
    priority VARCHAR(20) DEFAULT 'standard',   -- high, standard, low

    -- Sync status
    last_full_sync TIMESTAMPTZ,
    last_incremental_sync TIMESTAMPTZ,
    total_installations INTEGER DEFAULT 0,

    -- Integration metadata
    project_mapping JSONB,                     -- Additional project mapping data

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial site data
INSERT INTO onemap.sites (site_code, site_name, project_id, enabled) VALUES
    ('LAW', 'Lawley', '4eb13426-b2a1-472d-9b3c-277082ae9b55', true),
    ('MOH', 'Mohadin', 'bf9a90db-e758-4c05-b999-694cd63c451f', true),
    ('MAM', 'Mamelodi', '7003dc06-9af7-4a7c-bc6c-a177d77784f2', true),
    ('KWN', 'Kwanokuthula', NULL, false)
ON CONFLICT (site_code) DO UPDATE SET
    site_name = EXCLUDED.site_name,
    project_id = EXCLUDED.project_id,
    updated_at = NOW();

-- ============================================================================
-- Table 2: onemap.sections (Geographic areas within a site)
-- ============================================================================
CREATE TABLE IF NOT EXISTS onemap.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent relationship
    site_id UUID REFERENCES onemap.sites(id) ON DELETE CASCADE,

    -- Section identification (from 1Map API)
    section_code VARCHAR(50) NOT NULL,        -- API field: 'section'
    section_name VARCHAR(100),

    -- Spatial data (for future PostGIS use)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    -- geom GEOMETRY(Polygon, 4326),          -- Uncomment when PostGIS enabled

    -- Sync metadata
    checksum VARCHAR(32),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (site_id, section_code)
);

CREATE INDEX IF NOT EXISTS idx_sections_site ON onemap.sections(site_id);
CREATE INDEX IF NOT EXISTS idx_sections_code ON onemap.sections(section_code);

-- ============================================================================
-- Table 3: onemap.pons (Passive Optical Network splitters)
-- ============================================================================
CREATE TABLE IF NOT EXISTS onemap.pons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent relationship
    section_id UUID REFERENCES onemap.sections(id) ON DELETE CASCADE,

    -- PON identification (from 1Map API)
    pon_code VARCHAR(50) NOT NULL,            -- API field: 'pon'
    pon_name VARCHAR(100),

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    -- geom GEOMETRY(Point, 4326),            -- Uncomment when PostGIS enabled

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

CREATE INDEX IF NOT EXISTS idx_pons_section ON onemap.pons(section_id);
CREATE INDEX IF NOT EXISTS idx_pons_code ON onemap.pons(pon_code);

-- ============================================================================
-- Table 4: onemap.poles (Physical pole infrastructure)
-- ============================================================================
CREATE TABLE IF NOT EXISTS onemap.poles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent relationship
    pon_id UUID REFERENCES onemap.pons(id) ON DELETE SET NULL,
    site_id UUID REFERENCES onemap.sites(id) ON DELETE CASCADE,

    -- Pole identification (from 1Map API)
    pole_number VARCHAR(50) NOT NULL,         -- API field: 'pole' (e.g., LAW.P.A453)

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    -- geom GEOMETRY(Point, 4326),            -- Uncomment when PostGIS enabled

    -- Metadata
    pole_type VARCHAR(50),                    -- Type of pole (if available)
    installation_count INTEGER DEFAULT 0,     -- DRs connected to this pole

    -- Sync metadata
    checksum VARCHAR(32),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (site_id, pole_number)
);

CREATE INDEX IF NOT EXISTS idx_poles_pon ON onemap.poles(pon_id);
CREATE INDEX IF NOT EXISTS idx_poles_site ON onemap.poles(site_id);
CREATE INDEX IF NOT EXISTS idx_poles_number ON onemap.poles(pole_number);

-- ============================================================================
-- Table 5: onemap.installations (Customer home installs - DR = PRIMARY UID)
-- ============================================================================
CREATE TABLE IF NOT EXISTS onemap.installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent relationships
    pole_id UUID REFERENCES onemap.poles(id) ON DELETE SET NULL,
    site_id UUID REFERENCES onemap.sites(id) ON DELETE CASCADE,

    -- PRIMARY IDENTIFIER - DR Number is the UID for each customer location
    dr_number VARCHAR(20) NOT NULL,           -- API field: 'drp' (e.g., DR1734472)

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    -- geom GEOMETRY(Point, 4326),            -- Uncomment when PostGIS enabled
    address TEXT,

    -- Current status (latest from transactions)
    current_status VARCHAR(100),              -- "Installed", "Pending", etc.
    current_stage VARCHAR(100),               -- Latest workflow stage

    -- Denormalized for fast queries
    pole_number VARCHAR(50),                  -- Copied from pole for quick access
    section_code VARCHAR(50),
    pon_code VARCHAR(50),

    -- Sync metadata
    checksum VARCHAR(32),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (site_id, dr_number)
);

CREATE INDEX IF NOT EXISTS idx_installations_dr ON onemap.installations(dr_number);
CREATE INDEX IF NOT EXISTS idx_installations_pole ON onemap.installations(pole_id);
CREATE INDEX IF NOT EXISTS idx_installations_site ON onemap.installations(site_id);
CREATE INDEX IF NOT EXISTS idx_installations_status ON onemap.installations(current_status);
CREATE INDEX IF NOT EXISTS idx_installations_synced ON onemap.installations(last_synced_at DESC);

-- ============================================================================
-- Table 6: onemap.transactions (1Map workflow stages)
-- ============================================================================
CREATE TABLE IF NOT EXISTS onemap.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent relationship
    installation_id UUID REFERENCES onemap.installations(id) ON DELETE CASCADE,

    -- 1Map internal identifier (prop_id in API response)
    transaction_id INTEGER NOT NULL,          -- API field: 'prop_id' (e.g., 391251)

    -- Workflow stage and status
    stage VARCHAR(100),                       -- "Home Sign Ups", "Pole Permission", "Installation"
    status VARCHAR(100),                      -- "Approved", "Pending", "Installed"

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

CREATE INDEX IF NOT EXISTS idx_transactions_installation ON onemap.transactions(installation_id);
CREATE INDEX IF NOT EXISTS idx_transactions_id ON onemap.transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stage ON onemap.transactions(stage);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON onemap.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_synced ON onemap.transactions(last_synced_at DESC);

-- ============================================================================
-- Table 7: onemap.sync_log
-- ============================================================================
CREATE TABLE IF NOT EXISTS onemap.sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Sync metadata
    sync_type VARCHAR(20) NOT NULL,           -- full, incremental, single_dr
    site_code VARCHAR(10),                    -- LAW (null for single_dr)
    dr_number VARCHAR(20),                    -- DR1734472 (null for site syncs)

    -- Statistics
    records_fetched INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_unchanged INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    -- Performance
    duration_seconds DECIMAL(10, 2),
    api_calls INTEGER DEFAULT 0,

    -- Results
    status VARCHAR(20) NOT NULL,              -- success, partial, failed
    error_message TEXT,
    error_details JSONB,

    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_site_code ON onemap.sync_log(site_code);
CREATE INDEX IF NOT EXISTS idx_sync_log_started_at ON onemap.sync_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON onemap.sync_log(status);

-- ============================================================================
-- Table 8: onemap.photo_downloads (Lazy Loading - Future Phase)
-- ============================================================================
CREATE TABLE IF NOT EXISTS onemap.photo_downloads (
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

CREATE INDEX IF NOT EXISTS idx_photo_downloads_transaction ON onemap.photo_downloads(transaction_id);
CREATE INDEX IF NOT EXISTS idx_photo_downloads_hash ON onemap.photo_downloads(file_hash);

-- ============================================================================
-- Views
-- ============================================================================

-- View 1: Full Installation Hierarchy (Site → Section → PON → Pole → DR)
CREATE OR REPLACE VIEW onemap.v_installation_hierarchy AS
SELECT
    s.site_code,
    s.site_name,
    i.section_code,
    i.pon_code,
    i.pole_number,
    i.dr_number,
    i.address,
    i.current_status,
    i.current_stage,
    i.latitude,
    i.longitude,
    i.last_synced_at
FROM onemap.installations i
JOIN onemap.sites s ON i.site_id = s.id
ORDER BY s.site_code, i.section_code, i.pon_code, i.pole_number, i.dr_number;

-- View 2: Installation with Transaction Photo Count
CREATE OR REPLACE VIEW onemap.v_installations_with_photos AS
SELECT
    s.site_code,
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
JOIN onemap.sites s ON i.site_id = s.id
LEFT JOIN onemap.transactions t ON t.installation_id = i.id
GROUP BY s.site_code, i.id, i.dr_number, i.address, i.current_status, i.current_stage;

-- View 3: Sync Statistics by Site
CREATE OR REPLACE VIEW onemap.v_sync_stats AS
SELECT
    s.site_code,
    s.site_name,
    s.total_installations,
    s.last_full_sync,
    s.last_incremental_sync,
    s.enabled,
    COUNT(l.id) as total_syncs,
    SUM(CASE WHEN l.status = 'success' THEN 1 ELSE 0 END) as successful_syncs,
    AVG(l.duration_seconds) as avg_duration_seconds
FROM onemap.sites s
LEFT JOIN onemap.sync_log l ON l.site_code = s.site_code
GROUP BY s.id, s.site_code, s.site_name, s.total_installations,
         s.last_full_sync, s.last_incremental_sync, s.enabled;

-- View 4: Stale Installations (not synced in 48+ hours)
CREATE OR REPLACE VIEW onemap.v_stale_installations AS
SELECT
    s.site_code,
    s.site_name,
    i.pole_number,
    i.dr_number,
    i.current_status,
    i.last_synced_at,
    EXTRACT(EPOCH FROM (NOW() - i.last_synced_at)) / 3600 as hours_since_sync
FROM onemap.installations i
JOIN onemap.sites s ON i.site_id = s.id
WHERE i.last_synced_at < NOW() - INTERVAL '48 hours'
ORDER BY i.last_synced_at ASC;

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to update site installation count
CREATE OR REPLACE FUNCTION onemap.update_site_installation_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE onemap.sites
    SET total_installations = (
        SELECT COUNT(*) FROM onemap.installations WHERE site_id = COALESCE(NEW.site_id, OLD.site_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.site_id, OLD.site_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update installation count
DROP TRIGGER IF EXISTS trg_update_site_count ON onemap.installations;
CREATE TRIGGER trg_update_site_count
AFTER INSERT OR DELETE ON onemap.installations
FOR EACH ROW EXECUTE FUNCTION onemap.update_site_installation_count();

-- Function to update pole installation count
CREATE OR REPLACE FUNCTION onemap.update_pole_installation_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pole_id IS NOT NULL THEN
        UPDATE onemap.poles
        SET installation_count = (
            SELECT COUNT(*) FROM onemap.installations WHERE pole_id = NEW.pole_id
        ),
        updated_at = NOW()
        WHERE id = NEW.pole_id;
    END IF;

    IF OLD.pole_id IS NOT NULL AND OLD.pole_id != COALESCE(NEW.pole_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
        UPDATE onemap.poles
        SET installation_count = (
            SELECT COUNT(*) FROM onemap.installations WHERE pole_id = OLD.pole_id
        ),
        updated_at = NOW()
        WHERE id = OLD.pole_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update pole count
DROP TRIGGER IF EXISTS trg_update_pole_count ON onemap.installations;
CREATE TRIGGER trg_update_pole_count
AFTER INSERT OR UPDATE OF pole_id OR DELETE ON onemap.installations
FOR EACH ROW EXECUTE FUNCTION onemap.update_pole_installation_count();

-- ============================================================================
-- Grants (if needed for app user)
-- ============================================================================
-- GRANT USAGE ON SCHEMA onemap TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA onemap TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA onemap TO app_user;

-- ============================================================================
-- Migration complete
-- ============================================================================
