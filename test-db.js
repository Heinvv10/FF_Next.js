require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found');
    return;
  }
  
  console.log('Database URL prefix:', process.env.DATABASE_URL.substring(0, 30) + '...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT 1 as test, current_database() as db, current_user as user`;
    console.log('✅ Database connection successful!');
    console.log('Result:', result[0]);
    
    // Test if projects table exists
    try {
      const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
      console.log('Available tables:', tables.map(t => t.table_name));
    } catch (error) {
      console.log('Could not list tables:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  }
}

testConnection();