# Vercel Routing Fix - Contractors Module

**Date:** October 30, 2025
**Status:** ✅ RESOLVED
**Module:** Contractors

---

## 🚨 The Problem

**Symptom:** 405 Method Not Allowed errors on `/api/contractors/[id]` endpoint when deployed to Vercel

**Error:**
```
Failed to load resource: the server responded with a status of 405 ()
api/contractors/497ab848-670f-414b-a20d-fa6c56768185
```

**Context:**
- Dynamic routes like `/api/contractors/[id]` return 405 for ALL HTTP methods (GET, PUT, DELETE) on Vercel
- Same code works perfectly on localhost
- Affects both App Router and Pages Router dynamic API routes
- Specific to this project/Vercel deployment (platform bug or configuration issue)

---

## ❌ What DIDN'T Work

Multiple attempts were made over a full day:

### Attempt 1: Route Segment Config
```typescript
// app/api/contractors/[id]/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```
**Result:** Still 405 ❌

### Attempt 2: Update vercel.json
```json
{
  "functions": {
    "app/api/**/*.ts": { "maxDuration": 30 },
    "app/api/**/*.js": { "maxDuration": 30 }
  }
}
```
**Result:** Still 405 ❌

### Attempt 3: Switch to Pages Router
Created `pages/api/contractors/[id].ts` with full GET/PUT/DELETE handlers
**Result:** Still 405 ❌

### Attempt 4: Soft Delete with PUT
Changed delete logic to use PUT method instead of DELETE
**Result:** Still 405 (even PUT failed!) ❌

### Attempt 5: Clear Vercel Build Cache
Redeployed without cache
**Result:** Still 405 ❌

---

## ✅ The Solution: Flat Endpoint Pattern

**What Worked:** Use flat API routes instead of dynamic `[id]` parameters

### Implementation

#### 1. Create Flat Endpoint
**File:** `pages/api/contractors-update.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, ...updates } = req.body;  // ID in BODY, not URL

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing ID' });
    }

    const [existing] = await sql`SELECT id FROM contractors WHERE id = ${id}`;
    if (!existing) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    const [updated] = await sql`
      UPDATE contractors
      SET
        status = COALESCE(${updates.status}, status),
        is_active = COALESCE(${updates.isActive !== undefined ? updates.isActive : null}, is_active),
        -- ... other fields
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return res.status(200).json({ data: mapDbToContractor(updated) });
  } catch (error: any) {
    console.error('Error updating contractor:', error);
    return res.status(500).json({ error: 'Failed to update contractor' });
  }
}
```

#### 2. Update Frontend
**File:** `src/components/contractors/ContractorsList.tsx`

**Before (didn't work):**
```typescript
const response = await fetch(`/api/contractors/${id}`, {
  method: 'PUT',
  body: JSON.stringify({ isActive: false, status: 'suspended' }),
});
```

**After (works!):**
```typescript
const response = await fetch('/api/contractors-update', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id,                    // ID in body, not URL
    isActive: false,
    status: 'suspended'
  }),
});
```

---

## 📋 Pattern Reference

### Use This Pattern For:
- ✅ UPDATE: `/api/contractors-update` (POST with id in body)
- ✅ DELETE: `/api/contractors-delete` (POST with id in body)
- ✅ Any contractor-specific operation that needs an ID

### Keep Dynamic Routes For:
- ✅ LIST: `/api/contractors` (GET all, POST create)
- ✅ Non-contractor endpoints that don't have this Vercel issue

### Template for Future Flat Endpoints

```typescript
// pages/api/contractors-{operation}.ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {  // or 'PUT', 'DELETE', etc.
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, ...data } = req.body;  // Extract ID from body

  // Validate ID
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing ID' });
  }

  // Perform operation with id
  // ...
}
```

### Frontend Pattern

```typescript
// Pass ID in body, not URL
const response = await fetch('/api/contractors-{operation}', {
  method: 'POST',  // or 'PUT'
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: contractorId,
    ...otherData
  }),
});
```

---

## 🎯 Key Lessons

1. **Vercel has route-specific issues** - Not all dynamic routes work reliably
2. **Localhost ≠ Production** - Always test on Vercel before considering it fixed
3. **Flat endpoints > Dynamic routes** - When in doubt, use flat endpoints for this project
4. **Pattern proven twice** - Both `/api/contractors-delete` and `/api/contractors-update` work
5. **Don't fight the platform** - Workaround is faster than debugging Vercel internals

---

## 🔍 Related Files

### Working Endpoints
- `pages/api/contractors-update.ts` - Update contractor (flat endpoint) ✅
- `pages/api/contractors-delete.ts` - Delete contractor (flat endpoint) ✅
- `app/api/contractors/route.ts` - List/Create (no [id], works fine) ✅

### Broken Endpoints (DO NOT USE)
- ~~`app/api/contractors/[id]/route.ts`~~ - Removed, returns 405 ❌
- ~~`pages/api/contractors/[id].ts`~~ - Returns 405 on Vercel ❌

### Frontend Components
- `src/components/contractors/ContractorsList.tsx` - Uses flat endpoints
- `src/components/contractors/ContractorForm.tsx` - Form component

### Documentation
- `docs/modules/contractors/REWRITE_PLAN.md` - Module rewrite plan
- `docs/modules/contractors/CLEANUP_SUMMARY.md` - Cleanup summary
- `docs/modules/contractors/VERCEL_ROUTING_FIX.md` - This file

---

## 🚀 Deploy Commands

```bash
# Build locally
npm run build

# Commit and push
git add -A
git commit -m "fix: use flat endpoint for Vercel compatibility"
git push origin master

# Vercel auto-deploys from master
# Monitor: https://vercel.com/team-vogeq-uvb-bbv4-phafhy65-hy78/fibreflow-nextjs
```

---

## ✅ Verification

**Production URL:** https://fibreflow.app/contractors

**Test Steps:**
1. Navigate to contractors list
2. Click trash icon on any contractor
3. Confirm suspension
4. ✅ Should see success message (not 405 error)
5. ✅ Contractor should disappear from list

**Success Indicator:**
```
✅ Contractor suspended successfully
✅ Network tab shows: POST /api/contractors-update → 200 OK
```

---

**Last Updated:** October 30, 2025
**Tested By:** Louis
**Status:** Working in production ✅
