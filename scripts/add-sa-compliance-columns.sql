-- SA Labour Law Compliance Fields Migration
-- Created: January 2026
-- Purpose: Add South African labour law compliance tracking to staff table
-- Based on: BCEA, LRA, UIF Act, COIDA

-- ============================================
-- Step 1: Add contract_type column if not exists
-- ============================================

-- First check if contract_type column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff' AND column_name = 'contract_type'
    ) THEN
        ALTER TABLE staff ADD COLUMN contract_type VARCHAR(30) DEFAULT 'permanent';
    END IF;
END $$;

-- Update constraint to allow SA-compliant values
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_contract_type_check;
ALTER TABLE staff ADD CONSTRAINT staff_contract_type_check
  CHECK (contract_type IN (
    -- SA-compliant values
    'permanent',
    'fixed_term',
    'part_time',
    'temporary',
    'independent_contractor',
    'intern',
    -- Legacy values for backward compatibility
    'contract',
    'freelance',
    'consultant'
  ));

-- ============================================
-- Step 2: UIF Compliance Columns
-- ============================================

ALTER TABLE staff ADD COLUMN IF NOT EXISTS uif_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_uif_status_check;
ALTER TABLE staff ADD CONSTRAINT staff_uif_status_check
  CHECK (uif_status IN ('registered', 'pending', 'exempt', 'not_applicable'));

ALTER TABLE staff ADD COLUMN IF NOT EXISTS uif_number VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS uif_registration_date DATE;

COMMENT ON COLUMN staff.uif_status IS 'UIF registration status per Unemployment Insurance Act';
COMMENT ON COLUMN staff.uif_number IS 'UIF reference number';

-- ============================================
-- Step 3: COIDA Compliance Columns
-- ============================================

ALTER TABLE staff ADD COLUMN IF NOT EXISTS coida_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_coida_status_check;
ALTER TABLE staff ADD CONSTRAINT staff_coida_status_check
  CHECK (coida_status IN ('covered', 'pending', 'not_applicable'));

COMMENT ON COLUMN staff.coida_status IS 'COIDA coverage status per Compensation for Occupational Injuries Act';

-- ============================================
-- Step 4: Tax Status Column
-- ============================================

ALTER TABLE staff ADD COLUMN IF NOT EXISTS tax_status VARCHAR(20) DEFAULT 'paye';
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_tax_status_check;
ALTER TABLE staff ADD CONSTRAINT staff_tax_status_check
  CHECK (tax_status IN ('paye', 'provisional', 'exempt'));

COMMENT ON COLUMN staff.tax_status IS 'Tax deduction method - PAYE for employees, provisional for contractors';

-- ============================================
-- Step 5: Probation Tracking Columns
-- ============================================

ALTER TABLE staff ADD COLUMN IF NOT EXISTS probation_status VARCHAR(20) DEFAULT 'not_applicable';
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_probation_status_check;
ALTER TABLE staff ADD CONSTRAINT staff_probation_status_check
  CHECK (probation_status IN ('in_probation', 'completed', 'extended', 'not_applicable'));

ALTER TABLE staff ADD COLUMN IF NOT EXISTS probation_start_date DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS probation_end_date DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS probation_extended BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS probation_extension_reason TEXT;

COMMENT ON COLUMN staff.probation_status IS 'Probation tracking per BCEA (max 6 months, extendable once)';
COMMENT ON COLUMN staff.probation_extended IS 'Whether probation has been extended (allowed once per BCEA)';

-- ============================================
-- Step 6: Notice Period Column
-- ============================================

ALTER TABLE staff ADD COLUMN IF NOT EXISTS notice_period VARCHAR(20) DEFAULT 'as_per_contract';
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_notice_period_check;
ALTER TABLE staff ADD CONSTRAINT staff_notice_period_check
  CHECK (notice_period IN ('1_week', '2_weeks', '4_weeks', 'as_per_contract', 'not_applicable'));

ALTER TABLE staff ADD COLUMN IF NOT EXISTS custom_notice_period_days INTEGER;

COMMENT ON COLUMN staff.notice_period IS 'Notice period per BCEA Section 37 based on service length';

-- ============================================
-- Step 7: Working Hours Columns
-- ============================================

ALTER TABLE staff ADD COLUMN IF NOT EXISTS working_hours_category VARCHAR(20) DEFAULT 'full_time';
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_working_hours_category_check;
ALTER TABLE staff ADD CONSTRAINT staff_working_hours_category_check
  CHECK (working_hours_category IN ('full_time', 'part_time', 'shift_work', 'flexible', 'not_applicable'));

ALTER TABLE staff ADD COLUMN IF NOT EXISTS weekly_hours DECIMAL(4,1);
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_weekly_hours_check;
ALTER TABLE staff ADD CONSTRAINT staff_weekly_hours_check
  CHECK (weekly_hours IS NULL OR (weekly_hours >= 0 AND weekly_hours <= 45));

COMMENT ON COLUMN staff.weekly_hours IS 'Weekly working hours (max 45 per BCEA, <24 = part-time)';

-- ============================================
-- Step 8: Contract Dates
-- ============================================

-- contract_end_date might already exist as end_date, so we add renewal date
ALTER TABLE staff ADD COLUMN IF NOT EXISTS contract_renewal_date DATE;

COMMENT ON COLUMN staff.contract_renewal_date IS 'Date when fixed-term contract is due for renewal';

-- ============================================
-- Step 9: SA Identity Fields
-- ============================================

ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_number VARCHAR(13);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS work_permit_number VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS work_permit_expiry DATE;

COMMENT ON COLUMN staff.id_number IS 'South African ID number (13 digits)';
COMMENT ON COLUMN staff.work_permit_number IS 'Work permit number for foreign nationals';
COMMENT ON COLUMN staff.work_permit_expiry IS 'Work permit expiry date - requires renewal tracking';

-- ============================================
-- Step 10: Computed/Helper Column
-- ============================================

-- is_employee column - TRUE for all contract types except independent_contractor
-- Note: This is a regular column, not computed, for broader DB compatibility
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_employee BOOLEAN DEFAULT true;

-- ============================================
-- Step 11: Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_staff_contract_type ON staff(contract_type);
CREATE INDEX IF NOT EXISTS idx_staff_uif_status ON staff(uif_status);
CREATE INDEX IF NOT EXISTS idx_staff_probation_status ON staff(probation_status);
CREATE INDEX IF NOT EXISTS idx_staff_is_employee ON staff(is_employee);

-- Index for expiring probations (useful for dashboard alerts)
CREATE INDEX IF NOT EXISTS idx_staff_probation_end ON staff(probation_end_date)
  WHERE probation_status = 'in_probation';

-- Index for contract renewals (useful for dashboard alerts)
CREATE INDEX IF NOT EXISTS idx_staff_contract_renewal ON staff(contract_renewal_date)
  WHERE contract_type = 'fixed_term' AND contract_renewal_date IS NOT NULL;

-- Index for expiring work permits (useful for compliance alerts)
CREATE INDEX IF NOT EXISTS idx_staff_work_permit_expiry ON staff(work_permit_expiry)
  WHERE work_permit_expiry IS NOT NULL;

-- ============================================
-- Step 12: Update existing data
-- ============================================

-- Map legacy contract types to is_employee flag
UPDATE staff SET is_employee = true WHERE contract_type IN ('permanent', 'contract', 'temporary', 'intern', 'fixed_term', 'part_time');
UPDATE staff SET is_employee = false WHERE contract_type IN ('freelance', 'consultant', 'independent_contractor');

-- Set default compliance values based on is_employee
UPDATE staff SET
  uif_status = CASE WHEN is_employee THEN 'pending' ELSE 'not_applicable' END,
  coida_status = CASE WHEN is_employee THEN 'pending' ELSE 'not_applicable' END,
  tax_status = CASE WHEN is_employee THEN 'paye' ELSE 'provisional' END,
  notice_period = CASE WHEN is_employee THEN 'as_per_contract' ELSE 'not_applicable' END
WHERE uif_status IS NULL OR coida_status IS NULL OR tax_status IS NULL;

-- ============================================
-- Verification Query (run after migration)
-- ============================================

-- SELECT
--   column_name,
--   data_type,
--   is_nullable,
--   column_default
-- FROM information_schema.columns
-- WHERE table_name = 'staff'
--   AND column_name IN (
--     'contract_type', 'uif_status', 'uif_number', 'coida_status',
--     'tax_status', 'probation_status', 'probation_start_date',
--     'probation_end_date', 'notice_period', 'weekly_hours',
--     'is_employee', 'id_number', 'work_permit_number'
--   )
-- ORDER BY column_name;
