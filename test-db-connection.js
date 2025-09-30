require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL environment variable is not set');
      process.exit(1);
    }

    console.log('✓ DATABASE_URL found');
    
    const sql = neon(databaseUrl);
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    
    console.log('✅ Database connection successful!');
    console.log('Current time:', result[0].current_time);
    console.log('PostgreSQL version:', result[0].pg_version);
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();