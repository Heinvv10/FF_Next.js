-- Fix LID Resubmissions in Database
-- Finds drops with LIDs (length > 11) and provides fix commands
-- Date: November 12, 2025
-- Issue: Resubmission handler not updating submitted_by with resolved phone

-- Step 1: Find all drops with LIDs (phone numbers should be 11 chars)
SELECT
    drop_number,
    submitted_by,
    user_name,
    LENGTH(submitted_by) as len,
    created_at,
    resubmitted,
    project
FROM qa_photo_reviews
WHERE
    submitted_by IS NOT NULL
    AND LENGTH(submitted_by) > 11  -- LIDs are longer than phone numbers
ORDER BY created_at DESC;

-- Expected output: List of drops that need fixing
-- For each drop, you need to:
-- 1. Look up the LID in WhatsApp database on VPS
-- 2. Update the drop with the correct phone number

-- Example fix workflow:
-- 1. SSH to VPS and look up LID:
--    ssh root@72.60.17.245
--    sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge/store/whatsapp.db \
--      "SELECT lid, pn FROM whatsmeow_lid_map WHERE lid = 'PASTE_LID_HERE';"
--
-- 2. Update database with phone number:
--    psql $DATABASE_URL -c "
--      UPDATE qa_photo_reviews
--      SET user_name = 'PHONE_NUMBER', submitted_by = 'PHONE_NUMBER', updated_at = NOW()
--      WHERE drop_number = 'DR_NUMBER';
--    "
