const { Client } = require('pg');
require('dotenv').config();

async function verifyNeonData() {
  console.log('🔍 VERIFYING DATA DIRECTLY IN NEON DATABASE');
  console.log('=' .repeat(60));

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon Database');
    console.log('   Host:', process.env.DATABASE_URL.split('@')[1].split('/')[0]);
    console.log('   Database:', process.env.DATABASE_URL.split('/').pop().split('?')[0]);
    console.log('');

    // 1. Check if sow_fibre table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'sow_fibre'
      );
    `);
    console.log('📊 Table sow_fibre exists:', tableCheck.rows[0].exists);

    // 2. Count records for louissep15 project
    const PROJECT_ID = 'e2a61399-275a-4c44-8008-e9e42b7a3501';
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM sow_fibre WHERE project_id = $1',
      [PROJECT_ID]
    );
    console.log(`\n📈 Records for louissep15 project (${PROJECT_ID}):`);
    console.log(`   Total fibre segments: ${countResult.rows[0].count}`);

    // 3. Get import timestamp
    const timestampResult = await client.query(`
      SELECT
        MIN(created_at) as first_import,
        MAX(created_at) as last_import,
        MAX(updated_at) as last_update
      FROM sow_fibre
      WHERE project_id = $1
    `, [PROJECT_ID]);

    const timestamps = timestampResult.rows[0];
    console.log('\n⏰ Import Timestamps:');
    console.log(`   First record created: ${timestamps.first_import}`);
    console.log(`   Last record created: ${timestamps.last_import}`);
    console.log(`   Last update: ${timestamps.last_update}`);

    // 4. Show 5 sample records
    const sampleResult = await client.query(`
      SELECT
        segment_id,
        cable_size,
        layer,
        distance,
        status,
        contractor,
        created_at
      FROM sow_fibre
      WHERE project_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [PROJECT_ID]);

    console.log('\n📋 Sample Records (5 most recent):');
    console.table(sampleResult.rows.map(r => ({
      'Segment': r.segment_id.substring(0, 30),
      'Cable': r.cable_size,
      'Layer': r.layer,
      'Length': r.distance,
      'Status': r.status,
      'Contractor': r.contractor,
      'Created': new Date(r.created_at).toISOString()
    })));

    // 5. Summary statistics
    const statsResult = await client.query(`
      SELECT
        COUNT(DISTINCT cable_size) as cable_types,
        COUNT(DISTINCT contractor) as contractors,
        SUM(distance) as total_length,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned
      FROM sow_fibre
      WHERE project_id = $1
    `, [PROJECT_ID]);

    const stats = statsResult.rows[0];
    console.log('\n📊 Summary Statistics:');
    console.log(`   Cable Types: ${stats.cable_types}`);
    console.log(`   Contractors: ${stats.contractors}`);
    console.log(`   Total Length: ${parseFloat(stats.total_length).toFixed(2)} meters (${(parseFloat(stats.total_length) / 1000).toFixed(2)} km)`);
    console.log(`   Completed: ${stats.completed}`);
    console.log(`   Planned: ${stats.planned}`);

    console.log('\n✅ VERIFICATION COMPLETE - DATA CONFIRMED IN NEON DATABASE');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyNeonData().catch(console.error);