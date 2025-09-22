const { Client } = require('pg');
require('dotenv').config();

const PROJECT_ID = 'e2a61399-275a-4c44-8008-e9e42b7a3501'; // louissep15

async function verifyPolesImport() {
  console.log('🔍 VERIFYING POLES IMPORT FOR louissep15');
  console.log('=' .repeat(60));

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // 1. Count total poles
  const countResult = await client.query(
    'SELECT COUNT(*) as count FROM sow_poles WHERE project_id = $1',
    [PROJECT_ID]
  );
  console.log(`\n📊 Total poles: ${countResult.rows[0].count}`);

  // 2. Get statistics
  const statsResult = await client.query(`
    SELECT
      COUNT(*) as total_poles,
      COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coordinates,
      COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as without_coordinates,
      COUNT(DISTINCT status) as status_types,
      MIN(latitude) as min_lat,
      MAX(latitude) as max_lat,
      MIN(longitude) as min_lng,
      MAX(longitude) as max_lng
    FROM sow_poles
    WHERE project_id = $1
  `, [PROJECT_ID]);

  const stats = statsResult.rows[0];
  console.log('\n📈 Statistics:');
  console.log(`   With Coordinates: ${stats.with_coordinates}`);
  console.log(`   Without Coordinates: ${stats.without_coordinates}`);
  console.log(`   Status Types: ${stats.status_types}`);
  console.log(`   Latitude Range: ${parseFloat(stats.min_lat).toFixed(6)} to ${parseFloat(stats.max_lat).toFixed(6)}`);
  console.log(`   Longitude Range: ${parseFloat(stats.min_lng).toFixed(6)} to ${parseFloat(stats.max_lng).toFixed(6)}`);

  // 3. Show status distribution
  const statusResult = await client.query(`
    SELECT status, COUNT(*) as count
    FROM sow_poles
    WHERE project_id = $1
    GROUP BY status
    ORDER BY count DESC
  `, [PROJECT_ID]);

  console.log('\n📊 Status Distribution:');
  console.table(statusResult.rows);

  // 4. Show sample poles
  const sampleResult = await client.query(`
    SELECT pole_number, latitude, longitude, status
    FROM sow_poles
    WHERE project_id = $1
    ORDER BY pole_number
    LIMIT 10
  `, [PROJECT_ID]);

  console.log('\n📋 Sample Poles (First 10):');
  console.table(sampleResult.rows.map(r => ({
    'Pole Number': r.pole_number,
    'Latitude': r.latitude ? parseFloat(r.latitude).toFixed(6) : 'NULL',
    'Longitude': r.longitude ? parseFloat(r.longitude).toFixed(6) : 'NULL',
    'Status': r.status
  })));

  // 5. Check for duplicates
  const duplicateResult = await client.query(`
    SELECT pole_number, COUNT(*) as count
    FROM sow_poles
    WHERE project_id = $1
    GROUP BY pole_number
    HAVING COUNT(*) > 1
  `, [PROJECT_ID]);

  if (duplicateResult.rows.length > 0) {
    console.log('\n⚠️ WARNING: Duplicate pole numbers found:');
    console.table(duplicateResult.rows);
  } else {
    console.log('\n✅ No duplicate pole numbers found');
  }

  console.log('\n✅ VERIFICATION COMPLETE');
  console.log('=' .repeat(60));
  console.log(`Project: louissep15 (${PROJECT_ID})`);
  console.log(`Total Poles: ${countResult.rows[0].count}`);
  console.log('=' .repeat(60));

  await client.end();
}

verifyPolesImport().catch(console.error);