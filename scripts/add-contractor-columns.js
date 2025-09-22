#!/usr/bin/env node

/**
 * Standalone script to add missing columns to contractors table
 * Run with: node scripts/add-contractor-columns.js
 */

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function addContractorColumns() {
  console.log('🚀 Starting contractor columns migration...');

  const sql = neon(process.env.DATABASE_URL);

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    // Check if columns exist
    console.log('🔍 Checking existing columns...');
    const checkResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'contractors'
      AND column_name IN ('specializations', 'certifications')
    `;

    const existingColumns = checkResult.map(row => row.column_name);
    console.log('✅ Existing columns:', existingColumns);

    // Add missing columns
    const columnsToAdd = [];

    if (!existingColumns.includes('specializations')) {
      console.log('➕ Adding specializations column...');
      await sql`
        ALTER TABLE contractors
        ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'
      `;
      columnsToAdd.push('specializations');
      console.log('✅ Added specializations column');
    }

    if (!existingColumns.includes('certifications')) {
      console.log('➕ Adding certifications column...');
      await sql`
        ALTER TABLE contractors
        ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'
      `;
      columnsToAdd.push('certifications');
      console.log('✅ Added certifications column');
    }

    // Verify the columns were added
    if (columnsToAdd.length > 0) {
      console.log('🔍 Verifying columns were added...');
      const verifyResult = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'contractors'
        AND column_name IN ('specializations', 'certifications')
      `;

      const finalColumns = verifyResult.map(row => row.column_name);
      console.log('✅ Final columns:', finalColumns);

      console.log(`\n🎉 Migration completed successfully! Added columns: ${columnsToAdd.join(', ')}`);
    } else {
      console.log('✅ All required columns already exist');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
addContractorColumns();