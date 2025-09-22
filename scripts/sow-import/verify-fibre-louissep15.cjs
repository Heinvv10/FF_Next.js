const { Client } = require('pg');
require('dotenv').config();

const PROJECT_ID = 'e2a61399-275a-4c44-8008-e9e42b7a3501'; // louissep15

async function verifyFibreImport() {
  console.log('🔍 VERIFYING FIBRE IMPORT FOR louissep15');
  console.log('=' .repeat(60));

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // 1. Count total segments
  const countResult = await client.query(
    'SELECT COUNT(*) as count FROM sow_fibre WHERE project_id = $1',
    [PROJECT_ID]
  );
  console.log(`\n📊 Total fibre segments: ${countResult.rows[0].count}`);

  // 2. Get statistics
  const statsResult = await client.query(`
    SELECT
      COUNT(*) as total_segments,
      COUNT(DISTINCT cable_size) as cable_types,
      COUNT(DISTINCT layer) as layer_types,
      COUNT(DISTINCT contractor) as contractors,
      SUM(distance) as total_length,
      AVG(distance) as avg_length,
      MIN(distance) as min_length,
      MAX(distance) as max_length,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned
    FROM sow_fibre
    WHERE project_id = $1
  `, [PROJECT_ID]);

  const stats = statsResult.rows[0];
  console.log('\n📈 Statistics:');
  console.log(`   Cable Types: ${stats.cable_types}`);
  console.log(`   Layer Types: ${stats.layer_types}`);
  console.log(`   Contractors: ${stats.contractors}`);
  console.log(`   Total Length: ${parseFloat(stats.total_length).toFixed(2)} meters`);
  console.log(`   Average Length: ${parseFloat(stats.avg_length).toFixed(2)} meters`);
  console.log(`   Min/Max Length: ${parseFloat(stats.min_length).toFixed(2)} / ${parseFloat(stats.max_length).toFixed(2)} meters`);
  console.log(`   Status: ${stats.completed} completed, ${stats.planned} planned`);

  // 3. Show cable types distribution
  const cableTypesResult = await client.query(`
    SELECT cable_size, COUNT(*) as count, SUM(distance) as total_length
    FROM sow_fibre
    WHERE project_id = $1
    GROUP BY cable_size
    ORDER BY count DESC
  `, [PROJECT_ID]);

  console.log('\n📦 Cable Types Distribution:');
  console.table(cableTypesResult.rows.map(r => ({
    'Cable Size': r.cable_size,
    'Count': r.count,
    'Total Length (m)': parseFloat(r.total_length).toFixed(2)
  })));

  // 4. Show layer distribution
  const layerResult = await client.query(`
    SELECT layer, COUNT(*) as count, SUM(distance) as total_length
    FROM sow_fibre
    WHERE project_id = $1
    GROUP BY layer
    ORDER BY count DESC
  `, [PROJECT_ID]);

  console.log('\n🔗 Layer Distribution:');
  console.table(layerResult.rows.map(r => ({
    'Layer': r.layer,
    'Count': r.count,
    'Total Length (m)': parseFloat(r.total_length).toFixed(2)
  })));

  // 5. Show contractors
  const contractorResult = await client.query(`
    SELECT contractor, COUNT(*) as count, SUM(distance) as total_length
    FROM sow_fibre
    WHERE project_id = $1 AND contractor IS NOT NULL
    GROUP BY contractor
    ORDER BY count DESC
  `, [PROJECT_ID]);

  console.log('\n👷 Contractors:');
  console.table(contractorResult.rows.map(r => ({
    'Contractor': r.contractor,
    'Segments': r.count,
    'Total Length (m)': parseFloat(r.total_length).toFixed(2)
  })));

  // 6. Show sample segments
  const sampleResult = await client.query(`
    SELECT segment_id, cable_size, layer, distance, status
    FROM sow_fibre
    WHERE project_id = $1
    ORDER BY distance DESC
    LIMIT 10
  `, [PROJECT_ID]);

  console.log('\n📋 Top 10 Longest Segments:');
  console.table(sampleResult.rows.map(r => ({
    'Segment ID': r.segment_id,
    'Cable': r.cable_size,
    'Layer': r.layer,
    'Length (m)': parseFloat(r.distance).toFixed(2),
    'Status': r.status
  })));

  console.log('\n✅ VERIFICATION COMPLETE');
  console.log('=' .repeat(60));
  console.log(`Project: louissep15 (${PROJECT_ID})`);
  console.log(`Total Segments: ${countResult.rows[0].count}`);
  console.log(`Total Cable Length: ${parseFloat(stats.total_length).toFixed(2)} meters (${(parseFloat(stats.total_length) / 1000).toFixed(2)} km)`);
  console.log('=' .repeat(60));

  await client.end();
}

verifyFibreImport().catch(console.error);