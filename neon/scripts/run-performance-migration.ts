/**
 * Run Performance Optimization Migration
 * Story 3.2: Database Query Optimization
 *
 * Applies database indexes for improved query performance
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const sql = neon(process.env.DATABASE_URL || '');

async function runMigration() {
  console.log('🚀 Running Performance Optimization Migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/performance/001_add_contractor_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Loaded migration: 001_add_contractor_indexes.sql');
    console.log('📦 Applying indexes...\n');

    // Execute migration
    await sql.unsafe(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify indexes were created
    console.log('🔍 Verifying indexes...\n');

    const indexes = await sql`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (
          indexname LIKE 'idx_contractors%'
          OR indexname LIKE 'idx_contractor_%'
          OR indexname LIKE 'idx_projects%'
          OR indexname LIKE 'idx_clients%'
        )
      ORDER BY tablename, indexname
    `;

    console.log(`Found ${indexes.length} performance indexes:\n`);

    // Group by table
    const byTable: Record<string, typeof indexes> = {};
    indexes.forEach((idx) => {
      if (!byTable[idx.tablename]) {
        byTable[idx.tablename] = [];
      }
      byTable[idx.tablename].push(idx);
    });

    // Display grouped
    Object.keys(byTable).sort().forEach((table) => {
      console.log(`📊 ${table}:`);
      byTable[table].forEach((idx) => {
        console.log(`   - ${idx.indexname}`);
      });
      console.log('');
    });

    // Show table statistics
    console.log('📈 Table Statistics:\n');

    const stats = await sql`
      SELECT
        schemaname,
        relname as tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
        AND relname IN ('contractors', 'contractor_teams', 'contractor_documents',
                        'contractor_rag_history', 'contractor_onboarding_stages',
                        'projects', 'clients')
      ORDER BY relname
    `;

    stats.forEach((stat) => {
      console.log(`${stat.tablename}:`);
      console.log(`  Live rows: ${stat.live_tuples}`);
      console.log(`  Dead rows: ${stat.dead_tuples}`);
      console.log(`  Last analyze: ${stat.last_autoanalyze || stat.last_analyze || 'Never'}`);
      console.log('');
    });

    console.log('✅ Migration verification complete!\n');

    console.log('💡 Next Steps:');
    console.log('1. Test query performance in development');
    console.log('2. Monitor index usage with pg_stat_user_indexes');
    console.log('3. Deploy to production');
    console.log('4. Monitor performance improvements\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
