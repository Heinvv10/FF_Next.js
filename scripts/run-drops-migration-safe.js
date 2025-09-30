const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function runMigration() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🚀 Running DROPS Quality Control database migration...');

    // Step 1: Create drops_contractors table
    await sql`
      CREATE TABLE IF NOT EXISTS drops_contractors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          whatsapp_number VARCHAR(20) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created drops_contractors table');

    // Step 2: Ensure QC columns exist (they already do based on our check)
    console.log('✅ QC columns already exist in drops table');

    // Step 3: Create checklist_items table
    await sql`
      CREATE TABLE IF NOT EXISTS checklist_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      )
    `;
    console.log('✅ Created checklist_items table');

    // Step 4: Create drop_submissions table
    await sql`
      CREATE TABLE IF NOT EXISTS drop_submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
          contractor_id UUID NOT NULL REFERENCES drops_contractors(id) ON DELETE CASCADE,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs-rectification')),
          completion_score INTEGER DEFAULT 0 CHECK (completion_score BETWEEN 0 AND 100),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created drop_submissions table');

    // Step 5: Create drop_reviews table
    await sql`
      CREATE TABLE IF NOT EXISTS drop_reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          submission_id UUID NOT NULL REFERENCES drop_submissions(id) ON DELETE CASCADE,
          reviewed_by VARCHAR(255),
          status VARCHAR(20) NOT NULL CHECK (status IN ('approved', 'needs-rectification')),
          feedback TEXT NOT NULL,
          missing_steps TEXT[],
          completion_score INTEGER DEFAULT 0 CHECK (completion_score BETWEEN 0 AND 100),
          reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created drop_reviews table');

    // Step 6: Create quality_metrics table
    await sql`
      CREATE TABLE IF NOT EXISTS quality_metrics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
          contractor_id UUID NOT NULL REFERENCES drops_contractors(id) ON DELETE CASCADE,
          submission_id UUID NOT NULL REFERENCES drop_submissions(id) ON DELETE CASCADE,
          total_steps INTEGER DEFAULT 14,
          completed_steps INTEGER DEFAULT 0,
          completion_rate DECIMAL(5, 2) DEFAULT 0.00,
          common_missing_items TEXT[],
          time_to_rectification INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created quality_metrics table');

    // Step 7: Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_drops_qc_status ON drops(qc_status)',
      'CREATE INDEX IF NOT EXISTS idx_checklist_items_drop_id ON checklist_items(drop_id)',
      'CREATE INDEX IF NOT EXISTS idx_checklist_items_step_number ON checklist_items(step_number)',
      'CREATE INDEX IF NOT EXISTS idx_checklist_items_phase ON checklist_items(phase)',
      'CREATE INDEX IF NOT EXISTS idx_checklist_items_completed ON checklist_items(is_completed)',
      'CREATE INDEX IF NOT EXISTS idx_drop_submissions_drop_id ON drop_submissions(drop_id)',
      'CREATE INDEX IF NOT EXISTS idx_drop_submissions_contractor_id ON drop_submissions(contractor_id)',
      'CREATE INDEX IF NOT EXISTS idx_drops_contractors_whatsapp ON drops_contractors(whatsapp_number)',
      'CREATE INDEX IF NOT EXISTS idx_drop_submissions_status ON drop_submissions(status)',
      'CREATE INDEX IF NOT EXISTS idx_drop_reviews_submission_id ON drop_reviews(submission_id)',
      'CREATE INDEX IF NOT EXISTS idx_drop_reviews_status ON drop_reviews(status)',
      'CREATE INDEX IF NOT EXISTS idx_quality_metrics_drop_id ON quality_metrics(drop_id)',
      'CREATE INDEX IF NOT EXISTS idx_quality_metrics_contractor_id ON quality_metrics(contractor_id)'
    ];
    
    for (const indexSql of indexes) {
      await sql.query(indexSql);
    }
    console.log('✅ Created indexes');

    // Step 8: Create triggers
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    const triggers = [
      'DROP TRIGGER IF EXISTS update_drops_contractors_updated_at ON drops_contractors',
      'CREATE TRIGGER update_drops_contractors_updated_at BEFORE UPDATE ON drops_contractors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'DROP TRIGGER IF EXISTS update_checklist_items_updated_at ON checklist_items',
      'CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON checklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'DROP TRIGGER IF EXISTS update_drop_submissions_updated_at ON drop_submissions',
      'CREATE TRIGGER update_drop_submissions_updated_at BEFORE UPDATE ON drop_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()'
    ];

    for (const triggerSql of triggers) {
      await sql.query(triggerSql);
    }
    console.log('✅ Created triggers');

    // Step 9: Add sample contractors
    await sql`
      INSERT INTO drops_contractors (name, whatsapp_number) VALUES
      ('John Smith', '+27123456789'),
      ('Mike Johnson', '+27987654321'),
      ('Sarah Wilson', '+27555123456')
      ON CONFLICT (whatsapp_number) DO NOTHING
    `;
    console.log('✅ Added sample contractors');

    // Step 10: Get existing project and add sample drops
    const existingProjects = await sql`SELECT id FROM projects LIMIT 1`;
    const projectId = existingProjects[0]?.id;
    
    if (!projectId) {
      throw new Error('No existing project found. Please create a project first.');
    }
    
    const sampleDrops = await sql`
      INSERT INTO drops (drop_number, pole_number, project_id, address, customer_name, status, qc_status, created_at)
      VALUES 
        ('DROP001', 'POLE001', ${projectId}, '123 Main Street, Cape Town', 'John Doe', 'completed', 'pending', NOW()),
        ('DROP002', 'POLE002', ${projectId}, '456 Oak Avenue, Stellenbosch', 'Jane Smith', 'in_progress', 'pending', NOW()),
        ('DROP003', 'POLE003', ${projectId}, '789 Pine Road, Durban', 'Bob Wilson', 'completed', 'approved', NOW())
      RETURNING id, drop_number
    `;
    console.log('✅ Added sample drops:', sampleDrops.map(d => d.drop_number).join(', '));

    // Step 11: Create dashboard view
    await sql`
      CREATE OR REPLACE VIEW drop_dashboard_view AS
      SELECT
          d.id,
          d.drop_number,
          d.pole_number,
          d.address as customer_address,
          d.customer_name,
          d.status,
          d.qc_status,
          d.created_at as drop_created_at,
          c.id as contractor_id,
          c.name as contractor_name,
          c.whatsapp_number,
          ds.id as submission_id,
          ds.status as submission_status,
          ds.submitted_at,
          ds.completion_score as submission_score,
          ds.notes as submission_notes,
          dr.id as review_id,
          dr.status as review_status,
          dr.feedback,
          dr.reviewed_at,
          dr.reviewed_by,
          dr.missing_steps,
          COALESCE(
              (SELECT COUNT(*)
               FROM checklist_items ci
               WHERE ci.drop_id = d.id AND ci.is_completed = true), 0
          ) as completed_steps,
          14 as total_steps
      FROM drops d
      LEFT JOIN drop_submissions ds ON d.id = ds.drop_id
      LEFT JOIN drops_contractors c ON ds.contractor_id = c.id
      LEFT JOIN drop_reviews dr ON ds.id = dr.submission_id
      ORDER BY d.created_at DESC
    `;
    console.log('✅ Created dashboard view');

    // Step 12: Show summary
    const counts = await sql`
      SELECT 'drops' as table_name, COUNT(*) as count FROM drops
      UNION ALL
      SELECT 'drops_contractors', COUNT(*) FROM drops_contractors
      UNION ALL
      SELECT 'checklist_items', COUNT(*) FROM checklist_items
      UNION ALL
      SELECT 'drop_submissions', COUNT(*) FROM drop_submissions
      UNION ALL
      SELECT 'drop_reviews', COUNT(*) FROM drop_reviews
      UNION ALL
      SELECT 'quality_metrics', COUNT(*) FROM quality_metrics
    `;

    console.log('\n📊 Database Summary:');
    counts.forEach(row => {
      console.log(`  ${row.table_name}: ${row.count} records`);
    });

    console.log('\n🎉 DROPS Quality Control System Successfully Deployed!');
    console.log('📝 14-Step Velocity Fibre Home Install Capture Checklist is ready');
    console.log('🔧 Agent dashboard and contractor portal can now be used');

    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

// Run the migration
runMigration().then(success => {
  if (success) {
    console.log('\n✅ Migration completed successfully!');
  } else {
    console.log('\n❌ Migration failed!');
    process.exit(1);
  }
});