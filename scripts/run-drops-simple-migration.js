const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

async function runSimpleMigration() {
  try {
    console.log('🚀 Running simple DROPS Quality Control database migration...');

    // Create drops_contractors table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drops_contractors (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL,
          whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add QC columns to existing drops table
    await pool.query(`
      ALTER TABLE drops
      ADD COLUMN IF NOT EXISTS qc_status VARCHAR(20) DEFAULT 'pending'
      CHECK (qc_status IN ('pending', 'approved', 'needs-rectification')),
      ADD COLUMN IF NOT EXISTS qc_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // Create checklist_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS checklist_items (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
          step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 14),
          step_name VARCHAR(100) NOT NULL,
          phase VARCHAR(50) NOT NULL CHECK (phase IN ('A', 'B', 'C', 'D', 'E')),
          is_completed BOOLEAN DEFAULT FALSE,
          photo_url TEXT,
          notes TEXT,
          barcode_scan TEXT,
          powermeter_reading DECIMAL(10, 2),
          customer_signature JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(drop_id, step_number)
      );
    `);

    // Create drop_submissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drop_submissions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
          contractor_id UUID NOT NULL REFERENCES drops_contractors(id) ON DELETE CASCADE,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs-rectification')),
          completion_score INTEGER DEFAULT 0 CHECK (completion_score BETWEEN 0 AND 100),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create drop_reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drop_reviews (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          submission_id UUID NOT NULL REFERENCES drop_submissions(id) ON DELETE CASCADE,
          reviewed_by VARCHAR(255),
          status VARCHAR(20) NOT NULL CHECK (status IN ('approved', 'needs-rectification')),
          feedback TEXT NOT NULL,
          missing_steps TEXT[],
          completion_score INTEGER DEFAULT 0 CHECK (completion_score BETWEEN 0 AND 100),
          reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create quality_metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quality_metrics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
          contractor_id UUID NOT NULL REFERENCES drops_contractors(id) ON DELETE CASCADE,
          submission_id UUID NOT NULL REFERENCES drop_submissions(id) ON DELETE CASCADE,
          total_steps INTEGER DEFAULT 14,
          completed_steps INTEGER DEFAULT 0,
          completion_rate DECIMAL(5, 2) DEFAULT 0.00,
          common_missing_items TEXT[],
          time_to_rectification INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert sample contractors
    await pool.query(`
      INSERT INTO drops_contractors (name, whatsapp_number) VALUES
      ('Test Contractor 1', '+1234567890'),
      ('Test Contractor 2', '+0987654321')
      ON CONFLICT (whatsapp_number) DO NOTHING;
    `);

    console.log('✅ DROPS Quality Control database schema created successfully!');

    // Verify tables were created
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (table_name LIKE 'drop%'
           OR table_name = 'drops_contractors'
           OR table_name = 'checklist_items'
           OR table_name = 'quality_metrics')
      ORDER BY table_name`);

    console.log('📋 Created tables:', tables.rows.map(r => r.table_name).join(', '));

    // Check drops table columns
    const dropsColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'drops'
      AND column_name IN ('qc_status', 'qc_updated_at')
      ORDER BY column_name`);

    if (dropsColumns.rows.length > 0) {
      console.log('✅ Added columns to drops table:', dropsColumns.rows.map(r => r.column_name).join(', '));
    }

    // Show contractors data
    const contractors = await pool.query('SELECT name, whatsapp_number FROM drops_contractors');
    console.log('👥 Sample contractors:', contractors.rows.length);

    console.log('🎉 DROPS Quality Control system is ready for development!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

runSimpleMigration();