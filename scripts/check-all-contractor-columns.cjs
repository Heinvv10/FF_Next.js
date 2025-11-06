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
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'contractors'
      ORDER BY ordinal_position;
    `);

    console.log('CONTRACTORS TABLE COLUMNS:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkColumns();
