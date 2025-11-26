import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NEON_DATABASE_URL);

async function verifySchema() {
  console.log('🔍 Verifying qa_photo_reviews table schema...\n');

  try {
    // Check table exists and get column info
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'qa_photo_reviews'
      ORDER BY ordinal_position
    `;

    if (columns.length === 0) {
      console.log('❌ Table qa_photo_reviews does NOT exist!');
      return;
    }

    console.log('✅ Table qa_photo_reviews EXISTS\n');
    console.log('📋 Columns:');
    columns.forEach(col => {
      console.log(`  ${col.column_name.padEnd(35)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Verify key columns from documentation
    const keyColumns = [
      'drop_number',
      'project',
      'completed_photos',
      'outstanding_photos',
      'step_01_house_photo',
      'step_12_customer_signature'
    ];

    console.log('\n🔑 Verifying key columns:');
    const foundColumns = new Set(columns.map(c => c.column_name));
    let allFound = true;

    keyColumns.forEach(col => {
      if (foundColumns.has(col)) {
        console.log(`  ✅ ${col}`);
      } else {
        console.log(`  ❌ ${col} - MISSING!`);
        allFound = false;
      }
    });

    if (allFound) {
      console.log('\n✅ All documented columns verified!');
    } else {
      console.log('\n❌ WARNING: Some documented columns are missing!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifySchema();
