/**
 * Check table schemas
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check contractors table
    const contractors = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'contractors'
      AND column_name IN ('id', 'contractor_id')
      ORDER BY ordinal_position;
    `);

    console.log('CONTRACTORS TABLE:');
    console.table(contractors.rows);

    // Check projects table
    const projects = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'projects'
      AND column_name IN ('id', 'project_id')
      ORDER BY ordinal_position;
    `);

    console.log('\nPROJECTS TABLE:');
    console.table(projects.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
