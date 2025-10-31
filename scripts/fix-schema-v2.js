#!/usr/bin/env node

require('dotenv').config({ path: ['.env.production.local'] });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function fix() {
  console.log('🔧 Fixing schema - attempt 2...\n');

  try {
    // Add columns one by one
    console.log('1. Adding file_path column...');
    await sql`ALTER TABLE contractor_documents ADD COLUMN IF NOT EXISTS file_path TEXT`;
    console.log('   ✓ Done\n');

    console.log('2. Adding is_verified column...');
    await sql`ALTER TABLE contractor_documents ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`;
    console.log('   ✓ Done\n');

    console.log('3. Adding verification_notes column...');
    await sql`ALTER TABLE contractor_documents ADD COLUMN IF NOT EXISTS verification_notes TEXT`;
    console.log('   ✓ Done\n');

    console.log('4. Adding uploaded_by column...');
    await sql`ALTER TABLE contractor_documents ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(255) DEFAULT 'system'`;
    console.log('   ✓ Done\n');

    console.log('5. Adding status column...');
    await sql`ALTER TABLE contractor_documents ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'`;
    console.log('   ✓ Done\n');

    console.log('6. Copying verification_status to status...');
    await sql`UPDATE contractor_documents SET status = COALESCE(verification_status, 'pending') WHERE status IS NULL`;
    console.log('   ✓ Done\n');

    console.log('7. Syncing is_verified...');
    await sql`UPDATE contractor_documents SET is_verified = (status = 'approved')`;
    console.log('   ✓ Done\n');

    console.log('8. Setting file_path...');
    await sql`UPDATE contractor_documents SET file_path = COALESCE(file_path, 'contractors/' || contractor_id || '/' || file_name) WHERE file_path IS NULL`;
    console.log('   ✓ Done\n');

    console.log('✅ All done! Run: node scripts/list-all-columns.js to verify');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fix();
