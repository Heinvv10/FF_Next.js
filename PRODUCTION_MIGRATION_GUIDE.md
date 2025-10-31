# Production Database Migration Guide

## Problem
Vercel production is missing database tables:
- `contractor_documents` (causes 500 error on document approval)
- `contractor_onboarding_stages` (causes 404 error on onboarding page)

## Solution: Run Migration on Production Database

### Option 1: Using Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI if not already installed
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Link to your project (if not already linked)
vercel link

# 4. Pull production environment variables
vercel env pull .env.production.local

# 5. Run the migration script
node scripts/run-onboarding-migration.js
```

The script will automatically use `DATABASE_URL` from `.env.production.local`

### Option 2: Direct Connection to Neon

```bash
# 1. Get your production DATABASE_URL from Vercel dashboard:
#    Project Settings → Environment Variables → DATABASE_URL

# 2. Set it temporarily (replace with your actual URL)
export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# 3. Run migration
node scripts/run-onboarding-migration.js
```

### Option 3: Manual SQL Execution

1. Go to your Neon dashboard: https://console.neon.tech
2. Select your production database
3. Open SQL Editor
4. Copy and paste the contents of `neon/migrations/create_contractor_onboarding_and_documents.sql`
5. Click "Run"

## What Gets Created

### Tables
1. **contractor_documents** (25 columns)
   - Document storage with verification workflow
   - Supports: upload, approval/rejection, expiry tracking
   - Columns: `is_verified`, `verified_by`, `verified_at`, `verification_notes`, `status`, `rejection_reason`

2. **contractor_onboarding_stages** (14 columns)
   - Multi-stage onboarding workflow
   - Tracks progress, required documents, timing
   - 5 default stages: Company Registration, Financial, Insurance, Technical, Final Review

3. **contractors table updates**
   - Adds `onboarding_progress` (INTEGER)
   - Adds `onboarding_completed_at` (TIMESTAMP)

## Verification

After running migration, test:

1. **Document approval**: https://fibreflow-nextjs.vercel.app/contractors/[id]
   - Upload a document
   - Click "Approve" - should work (no 500 error)

2. **Onboarding**: https://fibreflow-nextjs.vercel.app/contractors/[id]/onboarding
   - Should load 5 stages (no 404 error)
   - Click "Start Stage" - should work
   - Upload document - should track in stage

## Troubleshooting

### Migration fails with "already exists"
- This is fine! Tables already exist
- Check Neon dashboard to verify tables are present

### Migration fails with "permission denied"
- Ensure DATABASE_URL has write permissions
- Check you're connecting to the correct database

### Still getting 404/500 after migration
- Clear Vercel cache: `vercel --force`
- Verify tables exist in Neon dashboard
- Check Vercel deployment logs for errors

## Files
- Migration SQL: `neon/migrations/create_contractor_onboarding_and_documents.sql`
- Node.js script: `scripts/run-onboarding-migration.js`
- Bash script: `scripts/run-onboarding-migration.sh`
