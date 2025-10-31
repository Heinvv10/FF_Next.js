# Contractor Onboarding Module - Testing Guide

## Prerequisites
- Server running on port 3005
- At least one contractor exists in database (id=1)
- PostgreSQL database accessible

---

## Method 1: Test via API (curl/Postman)

### Step 1: Get Onboarding Stages (Auto-initializes if not exists)

```bash
curl -X GET http://localhost:3005/api/contractors/1/onboarding/stages
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contractorId": 1,
      "stageName": "Company Registration",
      "stageOrder": 1,
      "status": "pending",
      "completionPercentage": 0,
      "requiredDocuments": ["cipc_registration", "company_profile", "tax_clearance"],
      "completedDocuments": [],
      "notes": null,
      "createdAt": "2025-10-31T...",
      "updatedAt": "2025-10-31T..."
    },
    // ... 4 more stages
  ]
}
```

### Step 2: Start a Stage (Update to "in_progress")

```bash
curl -X PUT http://localhost:3005/api/contractors/1/onboarding/stages/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress", "notes": "Starting company registration"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "in_progress",
    "startedAt": "2025-10-31T...",
    "notes": "Starting company registration"
  },
  "message": "Stage updated successfully"
}
```

### Step 3: Complete a Stage

```bash
curl -X PUT http://localhost:3005/api/contractors/1/onboarding/stages/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "completedDocuments": ["cipc_registration", "company_profile", "tax_clearance"]}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "completed",
    "completionPercentage": 100,
    "completedAt": "2025-10-31T...",
    "completedDocuments": ["cipc_registration", "company_profile", "tax_clearance"]
  },
  "message": "Stage updated successfully"
}
```

### Step 4: Complete All Remaining Stages

Repeat Step 3 for stages 2, 3, 4, and 5.

### Step 5: Complete Onboarding

```bash
curl -X POST http://localhost:3005/api/contractors/1/onboarding/complete
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "contractor": { ... },
    "onboardingProgress": {
      "totalStages": 5,
      "completedStages": 5,
      "overallProgress": 100,
      "isComplete": true
    }
  },
  "message": "Onboarding completed successfully"
}
```

---

## Method 2: Test via Database (psql)

### Check if stages were created

```bash
psql "$DATABASE_URL" -c "SELECT id, contractor_id, stage_name, status, stage_order FROM contractor_onboarding_stages WHERE contractor_id = 1 ORDER BY stage_order;"
```

**Expected Output:**
```
 id | contractor_id |        stage_name          |  status  | stage_order
----+---------------+----------------------------+----------+-------------
  1 |             1 | Company Registration       | pending  |           1
  2 |             1 | Financial Documentation    | pending  |           2
  3 |             1 | Insurance & Compliance     | pending  |           3
  4 |             1 | Technical Qualifications   | pending  |           4
  5 |             1 | Final Review               | pending  |           5
```

### Check contractor's overall progress

```bash
psql "$DATABASE_URL" -c "SELECT id, company_name, onboarding_progress, onboarding_completed_at, status FROM contractors WHERE id = 1;"
```

---

## Method 3: Test via UI Components

### Option A: Create a Test Page

Create `/app/test-onboarding/page.tsx`:

```tsx
'use client';

import { ContractorOnboardingStages } from '@/components/contractors/onboarding';

export default function TestOnboardingPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Contractor Onboarding</h1>
      <ContractorOnboardingStages contractorId="1" />
    </div>
  );
}
```

Then visit: http://localhost:3005/test-onboarding

### Option B: Add to Existing Contractor Detail Page

Edit `/app/contractors/[id]/page.tsx` and add:

```tsx
import { ContractorOnboardingStages } from '@/components/contractors/onboarding';

export default async function ContractorDetailPage({ params }: { params: { id: string } }) {
  // ... existing code ...

  return (
    <div>
      {/* Existing contractor details */}

      {/* Add Onboarding Section */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">Onboarding Progress</h2>
        <ContractorOnboardingStages contractorId={params.id} />
      </section>
    </div>
  );
}
```

Then visit: http://localhost:3005/contractors/1

---

## Method 4: Browser DevTools Test

1. Open browser to http://localhost:3005
2. Open DevTools (F12) → Console tab
3. Paste these commands:

```javascript
// Test 1: Get stages
fetch('/api/contractors/1/onboarding/stages')
  .then(r => r.json())
  .then(d => console.log('Stages:', d));

// Test 2: Start first stage
fetch('/api/contractors/1/onboarding/stages/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'in_progress' })
})
  .then(r => r.json())
  .then(d => console.log('Updated:', d));

// Test 3: Check progress
fetch('/api/contractors/1/onboarding/stages')
  .then(r => r.json())
  .then(d => console.log('Progress:', {
    total: d.data.length,
    completed: d.data.filter(s => s.status === 'completed').length,
    inProgress: d.data.filter(s => s.status === 'in_progress').length
  }));
```

---

## Expected Behaviors

### Auto-Initialization
- First time accessing `/api/contractors/1/onboarding/stages` automatically creates 5 default stages
- All stages start with `status: "pending"` and `completionPercentage: 0`

### Status Transitions
- **pending** → **in_progress**: Sets `startedAt` timestamp
- **in_progress** → **completed**: Sets `completedAt` timestamp, sets `completionPercentage: 100`
- Any status → **skipped**: Marks stage as skipped (for optional stages)

### Automatic Updates
- When updating a stage, contractor's `onboarding_progress` field is automatically recalculated
- Progress percentage = (completedStages / totalStages) × 100

### Completion Validation
- Cannot complete onboarding until ALL stages have `status: "completed"`
- Completing onboarding sets `onboarding_completed_at` timestamp
- Contractor `status` changes from "pending" to "approved" (if it was pending)

---

## Troubleshooting

### Issue: 404 Not Found
**Solution**: Server might not have restarted. Run:
```bash
pkill -9 node
PORT=3005 npm start
```

### Issue: "Contractor not found"
**Solution**: Create a test contractor first:
```bash
psql "$DATABASE_URL" -c "INSERT INTO contractors (company_name, registration_number, contact_person, email, status) VALUES ('Test Company', 'REG001', 'John Doe', 'john@test.com', 'pending') RETURNING id;"
```

### Issue: "Cannot complete onboarding"
**Solution**: Ensure all 5 stages are marked as completed first:
```bash
psql "$DATABASE_URL" -c "UPDATE contractor_onboarding_stages SET status = 'completed', completion_percentage = 100, completed_at = NOW() WHERE contractor_id = 1;"
```

### Issue: Stages not showing in UI
**Solution**: Check browser console for errors. Verify:
1. API is returning JSON (not HTML 404)
2. `contractorId` prop is correct
3. Component is imported correctly

---

## Quick Start (Fastest Way)

```bash
# 1. Ensure server is running
pkill -9 node
PORT=3005 npm start &

# 2. Wait for server to start
sleep 5

# 3. Test API
curl http://localhost:3005/api/contractors/1/onboarding/stages | python3 -m json.tool

# 4. If JSON returned successfully, onboarding is working!
```

---

## Success Criteria

✅ GET `/api/contractors/1/onboarding/stages` returns 5 stages
✅ PUT `/api/contractors/1/onboarding/stages/1` updates stage successfully
✅ Updating stage changes contractor's `onboarding_progress`
✅ POST `/api/contractors/1/onboarding/complete` completes onboarding
✅ UI component displays progress bar and stage cards
✅ Stage cards show correct status colors (green/blue/yellow/gray)
✅ Action buttons work (Start Stage, Mark Complete, Add Notes)

---

**Ready to test!** Start with Method 1 (API testing) to verify backend, then move to Method 3 (UI testing) to see it in action.
