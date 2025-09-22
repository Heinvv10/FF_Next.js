const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
  try {
    // Get column names for each table
    console.log('=== SOW TABLE SCHEMAS ===\n');

    console.log('1. sow_poles columns:');
    const polesSchema = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'sow_poles'
      ORDER BY ordinal_position
    `;
    polesSchema.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));

    console.log('\n2. sow_drops columns:');
    const dropsSchema = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'sow_drops'
      ORDER BY ordinal_position
    `;
    dropsSchema.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));

    console.log('\n3. onemap_properties columns:');
    const oneMapSchema = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'onemap_properties'
      ORDER BY ordinal_position
    `;
    oneMapSchema.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));

    // Get sample data
    console.log('\n=== SAMPLE DATA ===\n');

    console.log('Sample SOW Pole:');
    const [samplePole] = await sql`
      SELECT * FROM sow_poles LIMIT 1
    `;
    if (samplePole) {
      console.log(JSON.stringify(samplePole, null, 2));
    } else {
      console.log('  No poles found');
    }

    console.log('\nSample SOW Drop:');
    const [sampleDrop] = await sql`
      SELECT * FROM sow_drops LIMIT 1
    `;
    if (sampleDrop) {
      console.log(JSON.stringify(sampleDrop, null, 2));
    }

    console.log('\nSample OneMap Property:');
    const [sampleOneMap] = await sql`
      SELECT * FROM onemap_properties LIMIT 1
    `;
    if (sampleOneMap) {
      console.log(JSON.stringify(sampleOneMap, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();