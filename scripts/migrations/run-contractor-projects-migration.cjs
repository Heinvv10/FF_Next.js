/**
 * Run Contractor Projects Migration
 * Creates the contractor_projects table and related objects
 */

require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create-contractor-projects-table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('\nRunning migration...');
    await client.query(sql);

    console.log('✓ Migration completed successfully');

    // Verify table was created
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'contractor_projects'
      ORDER BY ordinal_position;
    `);

    console.log('\n✓ Table structure:');
    console.table(result.rows);

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

runMigration().catch(console.error);
