#!/usr/bin/env tsx
// Simple migration to create contractor file storage table
import { neon } from '@neondatabase/serverless';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = neon(databaseUrl);

async function createContractorFileStorage() {
    console.log('Creating contractor file storage table...\n');

    try {
        // First check if contractor_documents table exists
        const contractorDocsCheck = await sql`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name = 'contractor_documents'
        `;

        if (contractorDocsCheck.length === 0) {
            console.log('⚠️ contractor_documents table does not exist, skipping migration');
            return;
        }

        console.log('✓ contractor_documents table found');

        // Create the file storage table without foreign key initially
        await sql`
            CREATE TABLE IF NOT EXISTS contractor_file_storage (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id INTEGER,
                file_data BYTEA NOT NULL,
                file_hash VARCHAR(64) NOT NULL,
                compression_type VARCHAR(20) DEFAULT 'none',
                original_size BIGINT NOT NULL,
                compressed_size BIGINT NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                CONSTRAINT chk_file_size_positive CHECK (original_size > 0),
                CONSTRAINT chk_compressed_size_positive CHECK (compressed_size > 0),
                CONSTRAINT chk_compression_type CHECK (compression_type IN ('none', 'gzip'))
            )
        `;

        console.log('✓ contractor_file_storage table created');

        // Add columns to contractor_documents if they don't exist
        await sql`
            ALTER TABLE contractor_documents
            ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20) DEFAULT 'firebase'
        `;

        await sql`
            ALTER TABLE contractor_documents
            ADD COLUMN IF NOT EXISTS storage_id UUID
        `;

        console.log('✓ contractor_documents table updated');

        // Create indexes
        await sql`
            CREATE INDEX IF NOT EXISTS idx_contractor_file_storage_document_id
            ON contractor_file_storage(document_id)
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_contractor_file_storage_file_hash
            ON contractor_file_storage(file_hash)
        `;

        console.log('✓ Indexes created');

        // Add foreign key constraints
        await sql`
            ALTER TABLE contractor_file_storage
            ADD CONSTRAINT fk_contractor_file_storage_document_id
            FOREIGN KEY (document_id) REFERENCES contractor_documents(id) ON DELETE CASCADE
        `;

        await sql`
            ALTER TABLE contractor_documents
            ADD CONSTRAINT fk_contractor_documents_storage_id
            FOREIGN KEY (storage_id) REFERENCES contractor_file_storage(id) ON DELETE SET NULL
        `;

        console.log('✓ Foreign key constraints added');

        console.log('\n✅ Contractor file storage migration completed successfully!');

        // Verify the tables
        const fileStorageCheck = await sql`
            SELECT table_name FROM information_schema.tables WHERE table_name = 'contractor_file_storage'
        `;

        const columnsCheck = await sql`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'contractor_documents'
            AND column_name IN ('storage_type', 'storage_id')
        `;

        console.log('\n📊 Migration Summary:');
        console.log(`- contractor_file_storage table: ${fileStorageCheck.length > 0 ? '✅ Created' : '❌ Failed'}`);
        console.log(`- New columns in contractor_documents: ${columnsCheck.length}/2`);

    } catch (error) {
        console.error('✗ Migration failed:', error);
        throw error;
    }
}

// Main execution
async function main() {
    try {
        await createContractorFileStorage();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

main();