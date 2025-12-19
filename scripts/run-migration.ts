// scripts/run-migration.ts
// Migration runner using Neon serverless client with smart SQL parsing
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Smart SQL statement splitter that handles function bodies
function splitSQLStatements(sqlContent: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let dollarQuoteDepth = 0;

  const lines = sqlContent.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip pure comment lines
    if (trimmedLine.startsWith('--')) {
      continue;
    }

    // Track dollar-quoted strings (used in function bodies)
    if (trimmedLine.includes('$$') || trimmedLine.includes('$function$')) {
      dollarQuoteDepth = dollarQuoteDepth === 0 ? 1 : 0;
    }

    currentStatement += line + '\n';

    // Split on semicolon only if not inside a dollar-quoted section
    if (trimmedLine.endsWith(';') && dollarQuoteDepth === 0) {
      const stmt = currentStatement.trim();
      if (stmt.length > 0 && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
      currentStatement = '';
    }
  }

  // Add any remaining statement
  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

async function runMigration(migrationFile: string) {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  FIBREFLOW TICKETING MODULE - DATABASE MIGRATION');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`📦 Migration file: ${migrationFile}\n`);

    const migrationPath = join(process.cwd(), migrationFile);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    const statements = splitSQLStatements(migrationSQL);

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        // Use neonConfig.fetchConnectionCache to bypass template requirement
        await sql.query(statement);
        successCount++;

        // Log major operations
        if (statement.includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
          const tableName = match ? match[1] : 'unknown';
          console.log(`  ✅ Created table: ${tableName}`);
        } else if (statement.includes('CREATE TRIGGER')) {
          const match = statement.match(/CREATE\s+(?:OR REPLACE\s+)?TRIGGER\s+(\w+)/i);
          const triggerName = match ? match[1] : 'unknown';
          console.log(`  ✅ Created trigger: ${triggerName}`);
        } else if (statement.includes('CREATE INDEX')) {
          const match = statement.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
          const indexName = match ? match[1] : 'unknown';
          console.log(`  ✅ Created index: ${indexName}`);
        } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
          const match = statement.match(/FUNCTION\s+(\w+)\s*\(/i);
          const funcName = match ? match[1] : 'unknown';
          console.log(`  ✅ Created function: ${funcName}`);
        }
      } catch (error: any) {
        errorCount++;
        console.error(`  ❌ Error in statement ${i + 1}:`, error.message);

        // Don't exit on "already exists" errors (allows re-running migration)
        if (!error.message.includes('already exists')) {
          console.error(`     Statement preview: ${statement.substring(0, 100)}...`);
          throw error;
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('\n✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
const migrationFile = process.argv[2] || 'neon/migrations/20251218_create_ticketing_tables.sql';
runMigration(migrationFile);
