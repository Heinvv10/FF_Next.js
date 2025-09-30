#!/usr/bin/env tsx
// Direct migration runner for contractor file storage
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = neon(databaseUrl);

async function runContractorMigration() {
    console.log('Running contractor file storage migration...\n');

    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, 'sql', '008_contractor_file_storage.sql');
        const migrationContent = fs.readFileSync(migrationPath, 'utf-8');

        console.log('Executing migration...');

        // Split into statements and execute
        const statements = migrationContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                await sql.query(statement.trim());
                console.log('✓ Executed statement');
            }
        }

        console.log('\n✓ Contractor file storage migration completed successfully!');

        // Verify the table was created
        const result = await sql`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name = 'contractor_file_storage'
        `;

        if (result.length > 0) {
            console.log('✓ contractor_file_storage table created successfully');
        } else {
            console.log('⚠️ contractor_file_storage table may not have been created');
        }

    } catch (error) {
        console.error('✗ Migration failed:', error);
        throw error;
    }
}

// Main execution
async function main() {
    try {
        await runContractorMigration();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

main();