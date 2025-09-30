const { Pool } = require('pg');

// Create a pool instance for database connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Running DROPS Quality Control database migration...');

    // Read the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'migrations', '20250923_drops_quality_control.sql');
    const sqlQuery = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const result = await client.query(sqlQuery);

    console.log('✅ Migration completed successfully!');

    // Show some results
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('drops', 'checklist_items', 'drop_submissions', 'drop_reviews', 'quality_metrics')
      ORDER BY table_name;
    `);

    console.log('📊 Tables created:', tablesResult.rows.map(row => row.table_name).join(', '));

    // Show sample data
    const dropsResult = await client.query('SELECT COUNT(*) as count FROM drops;');
    console.log('📌 Sample drops created:', dropsResult.rows[0].count);

    const checklistResult = await client.query('SELECT COUNT(*) as count FROM checklist_items;');
    console.log('✅ Checklist items created:', checklistResult.rows[0].count);

    const submissionsResult = await client.query('SELECT COUNT(*) as count FROM drop_submissions;');
    console.log('📋 Sample submissions created:', submissionsResult.rows[0].count);

    const contractorsResult = await client.query('SELECT COUNT(*) as count FROM contractors;');
    console.log('👥 Sample contractors created:', contractorsResult.rows[0].count);

    console.log('\n🎉 DROPS Quality Control system database setup complete!');
    console.log('📝 14-Step Velocity Fibre Home Install Capture Checklist is ready!');
    console.log('🔧 Agent dashboard and contractor portal can now be implemented.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });