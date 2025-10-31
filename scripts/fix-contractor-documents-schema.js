#!/usr/bin/env node

/**
 * Fix contractor_documents table schema
 * Adds missing columns and renames verification_status to status
 */

require('dotenv').config({ path: ['.env.production.local', '.env.local', '.env.production', '.env'] });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function fixSchema() {
  console.log('🔧 Fixing contractor_documents table schema...');
  console.log('');

  try {
    // 1. Add missing columns
    console.log('Adding missing columns...');

    await sql.unsafe(`
      ALTER TABLE contractor_documents
      ADD COLUMN IF NOT EXISTS file_path TEXT,
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_notes TEXT,
      ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(255) DEFAULT 'system'
    `);
    console.log('✓ Added missing columns');

    // 2. Rename verification_status to status (if verification_status exists and status doesn't)
    console.log('Checking if column rename is needed...');

    const [statusCol] = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'contractor_documents' AND column_name = 'status'
    `;

    const [verificationStatusCol] = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'contractor_documents' AND column_name = 'verification_status'
    `;

    if (!statusCol && verificationStatusCol) {
      await sql.unsafe(`ALTER TABLE contractor_documents RENAME COLUMN verification_status TO status`);
      console.log('✓ Renamed verification_status to status');
    } else if (statusCol) {
      console.log('⊘ Column "status" already exists');
    }

    // 3. Sync is_verified with status
    console.log('Syncing is_verified column...');
    await sql.unsafe(`
      UPDATE contractor_documents
      SET is_verified = (status = 'approved')
      WHERE is_verified IS NULL OR is_verified = FALSE
    `);
    console.log('✓ Synced is_verified with status');

    // 4. Update file_path from storage_id if empty
    console.log('Updating file_path...');
    await sql.unsafe(`
      UPDATE contractor_documents
      SET file_path = COALESCE(file_path, 'contractors/' || contractor_id || '/' || file_name)
      WHERE file_path IS NULL
    `);
    console.log('✓ Updated file_path');

    console.log('');
    console.log('✅ Schema fix completed!');
    console.log('');
    console.log('Verify with: node scripts/check-table-schema.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

fixSchema();
