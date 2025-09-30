-- Contractor Document Storage Migration
-- Migrate from Firebase Storage to Neon PostgreSQL dedicated file storage
-- Created: September 22, 2025
-- Purpose: Eliminate Firebase Storage dependency, reduce costs, simplify architecture

-- Step 1: Create dedicated file storage table
CREATE TABLE IF NOT EXISTS contractor_file_storage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id INTEGER NOT NULL REFERENCES contractor_documents(id) ON DELETE CASCADE,
    file_data BYTEA NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for integrity verification
    compression_type VARCHAR(20) DEFAULT 'none', -- 'none', 'gzip'
    original_size BIGINT NOT NULL,
    compressed_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500), -- For future compatibility
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_file_size_positive CHECK (original_size > 0),
    CONSTRAINT chk_compressed_size_positive CHECK (compressed_size > 0),
    CONSTRAINT chk_compression_type CHECK (compression_type IN ('none', 'gzip')),
    CONSTRAINT chk_mime_type_not_empty CHECK (mime_type <> '')
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_file_storage_document_id
    ON contractor_file_storage(document_id);

CREATE INDEX IF NOT EXISTS idx_contractor_file_storage_file_hash
    ON contractor_file_storage(file_hash);

CREATE INDEX IF NOT EXISTS idx_contractor_file_storage_created_at
    ON contractor_file_storage(created_at);

-- Step 3: Add migration tracking column to contractor_documents
ALTER TABLE contractor_documents
ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20) DEFAULT 'firebase';

-- Step 4: Create function for file integrity verification
CREATE OR REPLACE FUNCTION verify_contractor_file_integrity(file_id UUID)
RETURNS TABLE(is_valid BOOLEAN, file_hash VARCHAR(64), file_size BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (
            CASE
                WHEN fs.file_hash = encode(digest(fs.file_data, 'sha256'), 'hex')
                THEN true
                ELSE false
            END
        ) as is_valid,
        fs.file_hash,
        fs.compressed_size
    FROM contractor_file_storage fs
    WHERE fs.id = file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function for file compression (optional - for future use)
CREATE OR REPLACE FUNCTION compress_contractor_file(file_data BYTEA)
RETURNS TABLE(compressed_data BYTEA, compression_ratio FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pg_compress(file_data) as compressed_data,
        (LENGTH(pg_compress(file_data))::FLOAT / LENGTH(file_data)) as compression_ratio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create view for file storage statistics
CREATE OR REPLACE VIEW contractor_file_storage_stats AS
SELECT
    COUNT(*) as total_files,
    SUM(fs.original_size) as total_original_size,
    SUM(fs.compressed_size) as total_compressed_size,
    AVG(fs.original_size) as avg_file_size,
    MAX(fs.original_size) as max_file_size,
    MIN(fs.original_size) as min_file_size,
    COUNT(CASE WHEN fs.compression_type = 'gzip' THEN 1 END) as compressed_files,
    SUM(fs.original_size - fs.compressed_size) as space_saved
FROM contractor_file_storage fs;

-- Step 7: Grant permissions (adjust as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON contractor_file_storage TO authenticated_user;
GRANT SELECT, UPDATE ON contractor_file_storage_id_seq TO authenticated_user;
GRANT SELECT ON contractor_file_storage_stats TO authenticated_user;

-- Migration completion record
INSERT INTO schema_migrations (version, description)
VALUES (
    '20250922_contractor_file_storage',
    'Added dedicated file storage table for contractor documents, migrating from Firebase Storage to Neon PostgreSQL'
) ON CONFLICT (version) DO UPDATE
SET applied_at = NOW(), description = EXCLUDED.description;

-- Output migration results
SELECT
    'Migration completed successfully' as status,
    'contractor_file_storage table created' as table_name,
    CURRENT_TIMESTAMP as migration_time;