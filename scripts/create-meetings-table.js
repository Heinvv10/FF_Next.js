// Run meetings table migration
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

const sql = neon(process.env.DATABASE_URL);

async function createMeetingsTable() {
  try {
    const migration = fs.readFileSync('neon/migrations/create_meetings_table.sql', 'utf8');
    // Split by semicolon and execute each statement
    const statements = migration.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await sql`${sql.unsafe(statement)}`;
      }
    }

    console.log('✅ Meetings table created successfully');
  } catch (error) {
    console.error('❌ Error creating meetings table:', error.message);
    process.exit(1);
  }
}

createMeetingsTable();
