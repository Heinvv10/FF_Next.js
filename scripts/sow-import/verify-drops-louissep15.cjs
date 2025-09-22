const { Client } = require('pg');
require('dotenv').config();

const PROJECT_ID = 'e2a61399-275a-4c44-8008-e9e42b7a3501'; // louissep15

async function verifyDropsImport() {
  console.log('🔍 VERIFYING DROPS IMPORT FOR louissep15');
  console.log('=' .repeat(60));

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // 1. Count total drops
  const countResult = await client.query(
    'SELECT COUNT(*) as count FROM sow_drops WHERE project_id = $1',
    [PROJECT_ID]
  );
  console.log(`\n📊 Total drops: ${countResult.rows[0].count}`);

  // 2. Get statistics
  const statsResult = await client.query(`
    SELECT
      COUNT(*) as total_drops,
      COUNT(DISTINCT pole_number) as unique_poles,
      COUNT(DISTINCT drop_number) as unique_drops,
      COUNT(CASE WHEN cable_length IS NOT NULL THEN 1 END) as with_length,
      COUNT(CASE WHEN cable_length IS NULL THEN 1 END) as without_length,
      SUM(CAST(cable_length AS NUMERIC)) as total_cable_length,
      AVG(CAST(cable_length AS NUMERIC)) as avg_cable_length,
      MIN(CAST(cable_length AS NUMERIC)) as min_length,
      MAX(CAST(cable_length AS NUMERIC)) as max_length,
      COUNT(DISTINCT status) as status_types
    FROM sow_drops
    WHERE project_id = $1
  `, [PROJECT_ID]);

  const stats = statsResult.rows[0];
  console.log('\n📈 Statistics:');
  console.log(`   Unique Drops: ${stats.unique_drops}`);
  console.log(`   Unique Poles Referenced: ${stats.unique_poles}`);
  console.log(`   With Cable Length: ${stats.with_length}`);
  console.log(`   Without Cable Length: ${stats.without_length}`);
  console.log(`   Total Cable Length: ${parseFloat(stats.total_cable_length || 0).toFixed(2)} meters`);
  console.log(`   Average Cable Length: ${parseFloat(stats.avg_cable_length || 0).toFixed(2)} meters`);
  console.log(`   Length Range: ${parseFloat(stats.min_length || 0).toFixed(2)} - ${parseFloat(stats.max_length || 0).toFixed(2)} meters`);
  console.log(`   Status Types: ${stats.status_types}`);

  // 3. Show status distribution
  const statusResult = await client.query(`
    SELECT status, COUNT(*) as count
    FROM sow_drops
    WHERE project_id = $1
    GROUP BY status
    ORDER BY count DESC
  `, [PROJECT_ID]);

  console.log('\n📊 Status Distribution:');
  console.table(statusResult.rows);

  // 4. Show cable type distribution
  const cableTypeResult = await client.query(`
    SELECT
      COALESCE(cable_type, 'Not Specified') as cable_type,
      COUNT(*) as count
    FROM sow_drops
    WHERE project_id = $1
    GROUP BY cable_type
    ORDER BY count DESC
    LIMIT 10
  `, [PROJECT_ID]);

  console.log('\n🔌 Cable Type Distribution (Top 10):');
  console.table(cableTypeResult.rows);

  // 5. Show sample drops
  const sampleResult = await client.query(`
    SELECT drop_number, pole_number, cable_length, status, start_point, end_point
    FROM sow_drops
    WHERE project_id = $1
    ORDER BY drop_number
    LIMIT 10
  `, [PROJECT_ID]);

  console.log('\n📋 Sample Drops (First 10):');
  console.table(sampleResult.rows.map(r => ({
    'Drop Number': r.drop_number,
    'Pole Number': r.pole_number || 'N/A',
    'Cable Length': r.cable_length ? `${parseFloat(r.cable_length).toFixed(2)}m` : 'N/A',
    'Status': r.status,
    'Start': r.start_point || 'N/A',
    'End': r.end_point || 'N/A'
  })));

  // 6. Check for duplicates
  const duplicateResult = await client.query(`
    SELECT drop_number, COUNT(*) as count
    FROM sow_drops
    WHERE project_id = $1
    GROUP BY drop_number
    HAVING COUNT(*) > 1
  `, [PROJECT_ID]);

  if (duplicateResult.rows.length > 0) {
    console.log('\n⚠️ WARNING: Duplicate drop numbers found:');
    console.table(duplicateResult.rows);
  } else {
    console.log('\n✅ No duplicate drop numbers found');
  }

  console.log('\n✅ VERIFICATION COMPLETE');
  console.log('=' .repeat(60));
  console.log(`Project: louissep15 (${PROJECT_ID})`);
  console.log(`Total Drops: ${countResult.rows[0].count}`);
  console.log('=' .repeat(60));

  await client.end();
}

verifyDropsImport().catch(console.error);