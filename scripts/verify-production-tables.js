#!/usr/bin/env node

/**
 * Verify Production Database Tables
 * Checks if contractor_documents and contractor_onboarding_stages tables exist
 */

require('dotenv').config({ path: ['.env.production.local', '.env.local', '.env.production', '.env'] });
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function verifyTables() {
  console.log('🔍 Verifying production database tables...');
  console.log('');

  try {
    // Check contractor_documents table
    const [docsTable] = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_name = 'contractor_documents'
    `;

    // Check contractor_onboarding_stages table
    const [stagesTable] = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_name = 'contractor_onboarding_stages'
    `;

    // Check contractors columns
    const [progressCol] = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'contractors' AND column_name = 'onboarding_progress'
    `;

    const [completedCol] = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'contractors' AND column_name = 'onboarding_completed_at'
    `;

    console.log('📊 Table Status:');
    console.log('');
    console.log(`  contractor_documents table: ${docsTable.count > 0 ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  contractor_onboarding_stages table: ${stagesTable.count > 0 ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  contractors.onboarding_progress column: ${progressCol.count > 0 ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  contractors.onboarding_completed_at column: ${completedCol.count > 0 ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log('');

    if (docsTable.count > 0 && stagesTable.count > 0) {
      console.log('✅ All tables exist! Migration was successful.');
      console.log('');
      console.log('Test URLs:');
      console.log('  Document approval: https://fibreflow-nextjs.vercel.app/contractors/9ff731e1-eceb-40bb-8d9c-37635dc576b2');
      console.log('  Onboarding page: https://fibreflow-nextjs.vercel.app/contractors/9ff731e1-eceb-40bb-8d9c-37635dc576b2/onboarding');
    } else {
      console.log('❌ Some tables are missing. Run migration again:');
      console.log('   node scripts/run-onboarding-migration.js');
    }

  } catch (error) {
    console.error('❌ Error verifying tables:', error.message);
    process.exit(1);
  }
}

verifyTables();
