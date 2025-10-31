#!/usr/bin/env node

/**
 * Check contractor_documents table schema
 */

require('dotenv').config({ path: ['.env.production.local', '.env.local', '.env.production', '.env'] });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
  console.log('🔍 Checking contractor_documents table schema...');
  console.log('');

  try {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'contractor_documents'
      ORDER BY ordinal_position
    `;

    console.log(`📊 Columns found: ${columns.length}`);
    console.log('');

    columns.forEach((col) => {
      console.log(`- ${col.column_name}`);
      console.log(`  Type: ${col.data_type}`);
      console.log(`  Nullable: ${col.is_nullable}`);
      if (col.column_default) {
        console.log(`  Default: ${col.column_default}`);
      }
      console.log('');
    });

    // Check for missing columns
    const requiredColumns = [
      'id', 'contractor_id', 'document_type', 'document_name',
      'file_name', 'file_path', 'file_url',
      'is_verified', 'verified_by', 'verified_at', 'verification_notes',
      'status', 'rejection_reason',
      'uploaded_by', 'created_at', 'updated_at'
    ];

    const existingColumnNames = columns.map(c => c.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumnNames.includes(col));

    if (missingColumns.length > 0) {
      console.log('⚠️  Missing columns:');
      missingColumns.forEach(col => console.log(`   - ${col}`));
      console.log('');
      console.log('💡 Run: node scripts/fix-contractor-documents-schema.js');
    } else {
      console.log('✅ All required columns exist');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
