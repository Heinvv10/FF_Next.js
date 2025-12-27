# QA Fix Request - Session 3

**Status**: REJECTED
**Date**: 2025-12-27 11:20:00 UTC
**QA Session**: 3
**Total Issues**: 4 (2 Critical, 2 Moderate)
**Estimated Fix Time**: 75 minutes

---

## Critical Issues to Fix

### 1. Next.js Build Failures - 9 Pages

**Problem**: Build fails with `Cannot read properties of null (reading 'useContext')`

**Affected Files** (9 pages):
```
app/(main)/ticketing/page.tsx
app/(main)/ticketing/escalations/page.tsx
app/(main)/ticketing/handover/page.tsx
app/(main)/ticketing/import/page.tsx
app/(main)/ticketing/risks/page.tsx
app/(main)/ticketing/sync/page.tsx
app/(main)/ticketing/tickets/page.tsx
app/(main)/ticketing/tickets/new/page.tsx
app/(main)/ticketing/tickets/[id]/page.tsx
```

**Required Fix**: Add this line after 'use client':
```typescript
export const dynamic = 'force-dynamic';
```

**Verification**: Run `npm run build` - should complete without errors

**Time**: 10 minutes

---

### 2. Database Not Configured

**Problem**: No .env file exists, migrations cannot be deployed

**Required Fix**:
1. Create .env file with DATABASE_URL
2. Deploy 4 migration files to Neon PostgreSQL

**Verification**:
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%ticket%';
-- Should return 12
```

**Time**: 15 minutes

---

## Moderate Issues (Recommended)

### 3. Component Test Failures - 34 Tests

**Problem**: Missing QueryClientProvider wrapper in tests

**Files**:
- src/modules/ticketing/__tests__/components/QContactSync.test.tsx (18 tests)
- src/modules/ticketing/__tests__/components/HandoverSnapshot.test.tsx (12 tests)
- src/modules/ticketing/__tests__/components/HandoverHistory.test.tsx (4 tests)

**Required Fix**: Add test wrapper with QueryClientProvider

**Time**: 30 minutes

---

### 4. File Upload Test Timeouts - 4 Tests

**Problem**: Tests calling real Firebase without mocks

**File**: src/modules/ticketing/__tests__/api/attachments.test.ts

**Required Fix**: Mock Firebase Storage methods (ref, uploadBytes, getDownloadURL)

**Time**: 20 minutes

---

## After Fixes

1. Commit with message: `fix: QA Session 3 - resolve build failures and test issues (qa-requested)`
2. Run verification:
   - `npm run build` (must succeed)
   - `npm test src/modules/ticketing` (should be 100% pass)
3. Signal ready for QA re-validation

---

**Next QA Session**: 4 (expected approval)
