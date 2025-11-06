/**
 * Check projects table columns
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `);

    console.log('PROJECTS TABLE COLUMNS:');
    console.table(result.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkColumns();
