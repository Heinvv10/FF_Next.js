// scripts/run-seed.ts
// Seed data runner using Neon serverless client
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config({ path: join(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

function splitSQLStatements(sqlContent: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let dollarQuoteDepth = 0;

  const lines = sqlContent.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('--')) {
      continue;
    }

    if (trimmedLine.includes('$$') || trimmedLine.includes('$function$')) {
      dollarQuoteDepth = dollarQuoteDepth === 0 ? 1 : 0;
    }

    currentStatement += line + '\n';

    if (trimmedLine.endsWith(';') && dollarQuoteDepth === 0) {
      const stmt = currentStatement.trim();
      if (stmt.length > 0 && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
      currentStatement = '';
    }
  }

  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

async function runSeed(seedFile: string) {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  FIBREFLOW TICKETING MODULE - SEED DATA');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`📦 Seed file: ${seedFile}\n`);

    const seedPath = join(process.cwd(), seedFile);
    const seedSQL = readFileSync(seedPath, 'utf-8');

    const statements = splitSQLStatements(seedSQL);

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;
    let currentTable = '';

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        await sql.query(statement);
        successCount++;

        if (statement.includes('INSERT INTO')) {
          const match = statement.match(/INSERT INTO\s+(\w+)/i);
          const tableName = match ? match[1] : 'unknown';

          if (tableName !== currentTable) {
            console.log(`  ✅ Seeding: ${tableName}`);
            currentTable = tableName;
          }
        }
      } catch (error: any) {
        errorCount++;

        if (!error.message.includes('duplicate key') && !error.message.includes('already exists')) {
          console.error(`  ❌ Error in statement ${i + 1}:`, error.message);
        }
      }
    }

    console.log('\n📊 Seed Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('\n✅ Seed data inserted successfully!\n');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

const seedFile = process.argv[2] || 'scripts/seeds/ticketing-seed.sql';
runSeed(seedFile);
