const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  try {
    console.log('🚀 Running DROPS Quality Control database migration...');

    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'migrations', '20250923_drops_quality_control.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute the full migration
    await pool.query(sql);

    console.log('✅ DROPS migration completed!');

    // Check what was created
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

    // Show sample data counts
    const counts = await pool.query(`
      SELECT 'drops_contractors' as table_name, COUNT(*) as count FROM drops_contractors
      UNION ALL
      SELECT 'checklist_items', COUNT(*) FROM checklist_items
      UNION ALL
      SELECT 'drop_submissions', COUNT(*) FROM drop_submissions
      UNION ALL
      SELECT 'drop_reviews', COUNT(*) FROM drop_reviews
      UNION ALL
      SELECT 'quality_metrics', COUNT(*) FROM quality_metrics`);

    console.log('📊 Sample data:');
    counts.rows.forEach(row => {
      console.log(`  ${row.table_name}: ${row.count} records`);
    });

    // Show drops with QC status
    const qcDrops = await pool.query(`
      SELECT drop_number, qc_status
      FROM drops
      WHERE qc_status IS NOT NULL
      ORDER BY drop_number
      LIMIT 5`);

    if (qcDrops.rows.length > 0) {
      console.log('📌 Drops with QC status:');
      qcDrops.rows.forEach(drop => {
        console.log(`  ${drop.drop_number}: ${drop.qc_status}`);
      });
    }

    console.log('🎉 DROPS Quality Control system is ready!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();