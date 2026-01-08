#!/usr/bin/env node
/**
 * Create OneMap schema on Neon database
 * Run: DATABASE_URL="..." node scripts/create-onemap-schema.js
 */

const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-aged-poetry-a9bbd8e9.gwc.azure.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

async function run() {
  console.log('Creating onemap schema and tables...\n');

  // 1. Create schema
  await sql`CREATE SCHEMA IF NOT EXISTS onemap`;
  console.log('✓ Schema onemap created');

  // 2. Sites table
  await sql`
    CREATE TABLE IF NOT EXISTS onemap.sites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_code VARCHAR(10) UNIQUE NOT NULL,
      site_name VARCHAR(100) NOT NULL,
      project_id UUID,
      enabled BOOLEAN DEFAULT true,
      sync_interval VARCHAR(20) DEFAULT 'daily',
      priority VARCHAR(20) DEFAULT 'standard',
      last_full_sync TIMESTAMPTZ,
      last_incremental_sync TIMESTAMPTZ,
      total_drops INTEGER DEFAULT 0,
      project_mapping JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓ onemap.sites');

  // 3. Sections table
  await sql`
    CREATE TABLE IF NOT EXISTS onemap.sections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id UUID REFERENCES onemap.sites(id) ON DELETE CASCADE,
      section_code VARCHAR(50) NOT NULL,
      section_name VARCHAR(100),
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      checksum VARCHAR(32),
      last_synced_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (site_id, section_code)
    )
  `;
  console.log('✓ onemap.sections');

  // 4. PONs table
  await sql`
    CREATE TABLE IF NOT EXISTS onemap.pons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id UUID REFERENCES onemap.sections(id) ON DELETE CASCADE,
      pon_code VARCHAR(50) NOT NULL,
      pon_name VARCHAR(100),
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      capacity INTEGER,
      active_connections INTEGER DEFAULT 0,
      checksum VARCHAR(32),
      last_synced_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (section_id, pon_code)
    )
  `;
  console.log('✓ onemap.pons');

  // 5. Poles table
  await sql`
    CREATE TABLE IF NOT EXISTS onemap.poles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pon_id UUID REFERENCES onemap.pons(id) ON DELETE SET NULL,
      site_id UUID REFERENCES onemap.sites(id) ON DELETE CASCADE,
      pole_number VARCHAR(50) NOT NULL,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      pole_type VARCHAR(50),
      drop_count INTEGER DEFAULT 0,
      checksum VARCHAR(32),
      last_synced_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (site_id, pole_number)
    )
  `;
  console.log('✓ onemap.poles');

  // 6. Installations table
  await sql`
    CREATE TABLE IF NOT EXISTS onemap.drops (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pole_id UUID REFERENCES onemap.poles(id) ON DELETE SET NULL,
      site_id UUID REFERENCES onemap.sites(id) ON DELETE CASCADE,
      dr_number VARCHAR(20) NOT NULL,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      address TEXT,
      current_status VARCHAR(100),
      current_stage VARCHAR(100),
      pole_number VARCHAR(50),
      section_code VARCHAR(50),
      pon_code VARCHAR(50),
      checksum VARCHAR(32),
      last_synced_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (site_id, dr_number)
    )
  `;
  console.log('✓ onemap.drops');

  // 7. Transactions table
  await sql`
    CREATE TABLE IF NOT EXISTS onemap.transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      installation_id UUID REFERENCES onemap.drops(id) ON DELETE CASCADE,
      transaction_id INTEGER NOT NULL,
      stage VARCHAR(100),
      status VARCHAR(100),
      onemap_created TIMESTAMPTZ,
      onemap_modified TIMESTAMPTZ,
      ph_prop JSONB, ph_sign1 JSONB, ph_sign2 JSONB, ph_wall JSONB,
      ph_powm1 JSONB, ph_powm2 JSONB, ph_drop JSONB, ph_conn1 JSONB,
      ph_hh1 JSONB, ph_hh2 JSONB, ph_hm_ln JSONB, ph_hm_en JSONB,
      ph_outs JSONB, ph_cbl_r JSONB, ph_bl JSONB, ph_after JSONB,
      raw_data JSONB,
      checksum VARCHAR(32),
      last_synced_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (installation_id, transaction_id)
    )
  `;
  console.log('✓ onemap.transactions');

  // 8. Sync log table
  await sql`
    CREATE TABLE IF NOT EXISTS onemap.sync_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sync_type VARCHAR(20) NOT NULL,
      site_code VARCHAR(10),
      dr_number VARCHAR(20),
      records_fetched INTEGER DEFAULT 0,
      records_created INTEGER DEFAULT 0,
      records_updated INTEGER DEFAULT 0,
      records_unchanged INTEGER DEFAULT 0,
      records_failed INTEGER DEFAULT 0,
      duration_seconds DECIMAL(10, 2),
      api_calls INTEGER DEFAULT 0,
      status VARCHAR(20) NOT NULL,
      error_message TEXT,
      error_details JSONB,
      started_at TIMESTAMPTZ NOT NULL,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓ onemap.sync_log');

  // 9. Photo downloads table
  await sql`
    CREATE TABLE IF NOT EXISTS onemap.photo_downloads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      transaction_id UUID REFERENCES onemap.transactions(id) ON DELETE CASCADE,
      photo_type VARCHAR(20) NOT NULL,
      attachment_id INTEGER,
      onemap_url TEXT,
      local_path TEXT,
      file_size INTEGER,
      file_hash VARCHAR(64),
      downloaded BOOLEAN DEFAULT false,
      download_attempted_at TIMESTAMPTZ,
      download_completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓ onemap.photo_downloads');

  // Create indexes
  console.log('\nCreating indexes...');

  await sql`CREATE INDEX IF NOT EXISTS idx_sections_site ON onemap.sections(site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sections_code ON onemap.sections(section_code)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pons_section ON onemap.pons(section_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pons_code ON onemap.pons(pon_code)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_poles_pon ON onemap.poles(pon_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_poles_site ON onemap.poles(site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_poles_number ON onemap.poles(pole_number)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_drops_dr ON onemap.drops(dr_number)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_drops_pole ON onemap.drops(pole_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_drops_site ON onemap.drops(site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_drops_status ON onemap.drops(current_status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_installation ON onemap.transactions(installation_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_id ON onemap.transactions(transaction_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sync_log_site ON onemap.sync_log(site_code)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sync_log_status ON onemap.sync_log(status)`;
  console.log('✓ Indexes created');

  // Insert initial sites
  console.log('\nInserting initial sites...');
  await sql`
    INSERT INTO onemap.sites (site_code, site_name, project_id, enabled) VALUES
      ('LAW', 'Lawley', '4eb13426-b2a1-472d-9b3c-277082ae9b55', true),
      ('MOH', 'Mohadin', 'bf9a90db-e758-4c05-b999-694cd63c451f', true),
      ('MAM', 'Mamelodi', '7003dc06-9af7-4a7c-bc6c-a177d77784f2', true),
      ('KWN', 'Kwanokuthula', NULL, false)
    ON CONFLICT (site_code) DO NOTHING
  `;
  console.log('✓ Initial sites inserted');

  // Verify
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'onemap' ORDER BY table_name
  `;
  console.log('\n✅ Schema created with', tables.length, 'tables:');
  tables.forEach(t => console.log('   -', t.table_name));

  const sites = await sql`SELECT site_code, site_name, enabled FROM onemap.sites ORDER BY site_code`;
  console.log('\n📍 Sites configured:');
  sites.forEach(s => console.log('  ', s.enabled ? '✓' : '○', s.site_code + ':', s.site_name));
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
