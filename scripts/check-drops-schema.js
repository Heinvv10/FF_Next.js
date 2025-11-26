import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NEON_DATABASE_URL);

async function checkSchema() {
  try {
    const result = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'drops'
      ORDER BY ordinal_position
    `;

    console.log('📋 Drops table schema:');
    result.forEach(col => {
      console.log(`  ${col.column_name} - ${col.data_type}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
