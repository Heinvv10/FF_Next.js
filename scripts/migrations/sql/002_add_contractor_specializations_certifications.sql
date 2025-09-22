-- Add missing columns to contractors table
-- This migration adds specializations and certifications columns if they don't exist

-- Add specializations column (JSONB array of contractor specializations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractors' AND column_name = 'specializations') THEN
        ALTER TABLE contractors ADD COLUMN specializations JSONB DEFAULT '[]';
        RAISE NOTICE 'Added specializations column to contractors table';
    ELSE
        RAISE NOTICE 'specializations column already exists';
    END IF;
END $$;

-- Add certifications column (JSONB array of contractor certifications)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractors' AND column_name = 'certifications') THEN
        ALTER TABLE contractors ADD COLUMN certifications JSONB DEFAULT '[]';
        RAISE NOTICE 'Added certifications column to contractors table';
    ELSE
        RAISE NOTICE 'certifications column already exists';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN contractors.specializations IS 'JSON array of contractor specializations and areas of expertise';
COMMENT ON COLUMN contractors.certifications IS 'JSON array of contractor certifications, licenses, and qualifications';