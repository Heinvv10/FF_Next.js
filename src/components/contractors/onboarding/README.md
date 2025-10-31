# Contractor Onboarding Module

**Status**: ✅ Complete and Production Ready
**Date**: October 31, 2025
**Type**: Focused, contractor-specific onboarding workflow system

## Overview

A comprehensive contractor onboarding system with 5-stage workflow management, real-time progress tracking, and document verification. Built specifically for contractor onboarding (not generic).

## Architecture

### Service Layer
**Location**: `src/services/contractor/contractorOnboardingService.ts`

Manages all onboarding business logic:
- Stage initialization from template
- Progress calculation
- Stage updates with automatic timestamp management
- Onboarding completion

**Default Template** (5 stages, 14-day duration):
1. Company Registration - CIPC, company profile, tax clearance
2. Financial Documentation - Bank confirmation, VAT certificate
3. Insurance & Compliance - Liability insurance, workers comp, safety certs
4. Technical Qualifications - Technical certifications, references
5. Final Review - Management approval

### API Endpoints
**Location**: `pages/api/contractors/[contractorId]/onboarding/`

All endpoints use standardized `apiResponse` helper for consistency.

#### GET `/api/contractors/[contractorId]/onboarding/stages`
Returns all onboarding stages for a contractor. Auto-initializes if stages don't exist.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contractorId": 123,
      "stageName": "Company Registration",
      "stageOrder": 1,
      "status": "completed",
      "completionPercentage": 100,
      "requiredDocuments": ["cipc_registration", "company_profile", "tax_clearance"],
      "completedDocuments": ["cipc_registration", "company_profile", "tax_clearance"],
      "startedAt": "2025-10-20T10:00:00Z",
      "completedAt": "2025-10-21T15:00:00Z",
      "notes": "All documents verified"
    }
  ]
}
```

#### PUT `/api/contractors/[contractorId]/onboarding/stages/[stageId]`
Update a specific onboarding stage.

**Request Body**:
```json
{
  "status": "in_progress",
  "completionPercentage": 60,
  "completedDocuments": ["cipc_registration", "company_profile"],
  "notes": "Waiting for tax clearance"
}
```

**Auto-behaviors**:
- `status: "in_progress"` → Sets `startedAt` timestamp
- `status: "completed"` → Sets `completedAt` timestamp and `completionPercentage: 100`
- Updates contractor's overall `onboarding_progress` field

#### POST `/api/contractors/[contractorId]/onboarding/complete`
Mark contractor onboarding as complete.

**Validation**: All stages must be completed before allowing this action.

**Effects**:
- Sets contractor `onboarding_progress = 100`
- Sets `onboarding_completed_at` timestamp
- Changes contractor `status` from "pending" to "approved" (if pending)
- Marks all stages as completed

### UI Components
**Location**: `src/components/contractors/onboarding/`

#### `ContractorOnboardingProgress`
Visual progress summary with:
- Overall progress bar
- Status badge (Complete / In Progress / Not Started)
- Stage breakdown (completed/in progress/pending counts)
- Completion notification

#### `OnboardingStageCard`
Individual stage management with:
- Color-coded status (green=completed, blue=in progress, yellow=pending, gray=skipped)
- Document progress tracking
- Timestamp display (started, completed, due dates)
- Action buttons (Start Stage, Mark Complete, Skip, Add Notes)
- Inline notes editing

#### `ContractorOnboardingStages`
Main orchestrator component that:
- Fetches stages from API
- Calculates real-time progress
- Handles stage updates
- Manages "Complete Onboarding" workflow
- Error handling and loading states

## Database Schema

Uses existing `contractor_onboarding_stages` table:

```sql
CREATE TABLE contractor_onboarding_stages (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    completion_percentage INTEGER DEFAULT 0,
    required_documents JSONB DEFAULT '[]',
    completed_documents JSONB DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contractor_id, stage_name)
);
```

## Usage Example

### Adding to Contractor Detail Page

```tsx
import { ContractorOnboardingStages } from '@/components/contractors/onboarding';

export default function ContractorDetailPage({ contractorId }: { contractorId: string }) {
  return (
    <div>
      <h1>Contractor Details</h1>

      {/* Onboarding Section */}
      <section className="mt-6">
        <h2>Onboarding Progress</h2>
        <ContractorOnboardingStages contractorId={contractorId} />
      </section>
    </div>
  );
}
```

### Direct API Usage

```typescript
// Fetch stages
const response = await fetch(`/api/contractors/${contractorId}/onboarding/stages`);
const { data: stages } = await response.json();

// Update stage
await fetch(`/api/contractors/${contractorId}/onboarding/stages/${stageId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'completed',
    notes: 'All documents verified and approved'
  })
});

// Complete onboarding
await fetch(`/api/contractors/${contractorId}/onboarding/complete`, {
  method: 'POST'
});
```

## Features

### ✅ Implemented

1. **5-Stage Workflow**
   - Company Registration
   - Financial Documentation
   - Insurance & Compliance
   - Technical Qualifications
   - Final Review

2. **Progress Tracking**
   - Real-time percentage calculation
   - Stage-by-stage breakdown
   - Document completion tracking

3. **Stage Management**
   - Start stage (pending → in_progress)
   - Complete stage (sets completion timestamp)
   - Skip stage (for optional stages)
   - Add/edit notes per stage

4. **Validation**
   - Prevents completing onboarding until all stages done
   - Verifies stage belongs to contractor before updates
   - Auto-calculates completion percentage

5. **Auto-Initialization**
   - Creates default stages when first accessed
   - No manual setup required

6. **Status Automation**
   - Auto-sets `startedAt` when moving to in_progress
   - Auto-sets `completedAt` when marking complete
   - Updates contractor overall progress automatically

## Key Design Decisions

### 1. Contractor-Specific (Not Generic)
Built exclusively for contractor onboarding. Not abstracted for suppliers, staff, etc. This allows:
- Focused requirements
- Simpler implementation
- Faster development
- Better performance

### 2. Database-First Approach
Uses existing `contractor_onboarding_stages` table instead of creating new generic tables. Leverages proven schema.

### 3. Auto-Initialization
Stages are automatically created from template on first access. No manual "Start Onboarding" action required.

### 4. Direct SQL Queries
API endpoints use direct Neon SQL queries instead of service layer abstractions. Follows existing patterns in the codebase.

### 5. Standardized API Responses
All endpoints use `apiResponse` helper for consistent response format across the application.

## Testing

### Manual Testing Checklist

1. **Stage Creation**
   - [ ] Access contractor onboarding for first time
   - [ ] Verify 5 stages are auto-created
   - [ ] Check all stages start with "pending" status

2. **Stage Progression**
   - [ ] Start a stage (pending → in_progress)
   - [ ] Verify `startedAt` timestamp is set
   - [ ] Complete a stage
   - [ ] Verify `completedAt` timestamp is set
   - [ ] Check completion percentage updates

3. **Progress Tracking**
   - [ ] Complete multiple stages
   - [ ] Verify overall progress bar updates
   - [ ] Check stage counts are accurate

4. **Notes Management**
   - [ ] Add notes to a stage
   - [ ] Edit existing notes
   - [ ] Verify notes persist

5. **Complete Onboarding**
   - [ ] Try completing with incomplete stages (should fail)
   - [ ] Complete all stages
   - [ ] Click "Complete Onboarding"
   - [ ] Verify contractor status changes to "approved"

### Unit Tests

Existing test suite: `/tests/api/contractors/`
- `onboarding-stages.test.ts` - GET stages endpoint
- `onboarding-stageId.test.ts` - PUT update stage endpoint
- `onboarding-complete.test.ts` - POST complete endpoint

## Troubleshooting

### Stages Not Appearing
**Issue**: No stages shown for contractor
**Solution**: Check if contractor exists in database. Stages are auto-initialized on first GET request.

### Cannot Complete Onboarding
**Issue**: "Complete Onboarding" button disabled or fails
**Solution**: Ensure all stages are marked as "completed". Check API response for validation error.

### Progress Not Updating
**Issue**: Progress bar doesn't reflect changes
**Solution**: Progress is calculated client-side. Ensure component re-fetches after stage updates.

### Wrong Contractor's Stages
**Issue**: Seeing another contractor's stages
**Solution**: Check `contractorId` prop is correct. API validates contractor ownership.

## Performance Considerations

- **Query Optimization**: Uses indexed `contractor_id` field
- **No N+1 Queries**: Single query fetches all stages
- **Minimal Payload**: Only essential fields in responses
- **Efficient Updates**: Updates single stage at a time
- **Auto-calculation**: Progress calculated server-side

## Future Enhancements (Not Implemented)

- Custom stage templates per contractor type
- Document upload integration per stage
- Stage approval workflow (assign to reviewers)
- Email notifications on stage completion
- Due date reminders
- Bulk stage updates
- Onboarding analytics dashboard

## Related Files

### Service Layer
- `src/services/contractor/contractorOnboardingService.ts`

### API Routes
- `pages/api/contractors/[contractorId]/onboarding/stages.ts`
- `pages/api/contractors/[contractorId]/onboarding/stages/[stageId].ts`
- `pages/api/contractors/[contractorId]/onboarding/complete.ts`

### Components
- `src/components/contractors/onboarding/ContractorOnboardingProgress.tsx`
- `src/components/contractors/onboarding/OnboardingStageCard.tsx`
- `src/components/contractors/onboarding/ContractorOnboardingStages.tsx`
- `src/components/contractors/onboarding/index.ts`

### Database
- `scripts/migrations/create-contractors-tables.sql` (schema)

### Tests
- `tests/api/contractors/onboarding-stages.test.ts`
- `tests/api/contractors/onboarding-stageId.test.ts`
- `tests/api/contractors/onboarding-complete.test.ts`

## Support

For questions or issues:
1. Check this README first
2. Review API error responses (use standardized format)
3. Check browser console for client-side errors
4. Verify database connection and schema
5. Check Vercel deployment logs for production issues

---

**Built with**: Next.js 14, TypeScript, Neon PostgreSQL, TailwindCSS
**Status**: Production Ready ✅
