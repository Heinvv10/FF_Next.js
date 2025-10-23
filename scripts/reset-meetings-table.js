// Drop and recreate meetings table
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

const sql = neon(process.env.DATABASE_URL);

async function resetMeetingsTable() {
  try {
    console.log('Dropping old meetings table...');
    await sql`DROP TABLE IF EXISTS meetings CASCADE`;

    console.log('Creating new meetings table...');
    const migration = fs.readFileSync('neon/migrations/create_meetings_table.sql', 'utf8');
    const statements = migration.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await sql`${sql.unsafe(statement)}`;
      }
    }

    console.log('✅ Meetings table reset successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetMeetingsTable();
