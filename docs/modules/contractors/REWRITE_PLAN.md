# Contractors Module - Full Rewrite Plan

**Date**: October 30, 2025
**Decision**: Full rewrite chosen over incremental refactoring
**Estimated Time**: 4-6 hours
**Status**: In Progress

---

## Why Full Rewrite?

### Problems with Current Architecture
1. **Death by a Thousand Routes** - Route conflicts, workaround endpoints (`/contractors-delete`)
2. **Service Layer Madness** - 6 layers of indirection to execute one delete
3. **Over-Engineering** - 40+ component files, complex onboarding, competing contexts
4. **Inconsistent API Responses** - Multiple formats requiring defensive `data.data || data`
5. **Production ≠ Local** - Different routing behavior, config issues

### Time Comparison
- **Incremental Refactor**: 12+ hours of risky migrations across 40 files
- **Clean Rewrite**: 4-6 hours to working MVP
- **Already Spent**: 1 full day fighting delete bugs

**Decision**: Rewrite is faster and cleaner.

---

## Architecture: New vs Old

### Old (Pages Router)
```
pages/api/contractors/
  ├── [contractorId].ts
  ├── [contractorId]-routes/ (workaround for conflicts)
  ├── delete/[id].ts (workaround endpoint)
  └── contractors-delete.ts (another workaround)

src/modules/contractors/
  ├── components/ (40+ files)
  ├── hooks/ (15+ files)
  └── types/

src/services/contractor/
  ├── contractorCrudService.ts
  ├── contractorApiService.ts
  ├── neonContractorService.ts
  ├── crud/
  └── ... (10+ service files)
```

**6 layers**: Component → contractorService → contractorCrudService → contractorApiService → API Route → neonContractorService → Database

### New (App Router)
```
app/
├── api/contractors/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/route.ts         # GET (one), PUT, DELETE
└── contractors/
    ├── page.tsx              # List (Server Component)
    ├── new/page.tsx          # Create
    └── [id]/
        ├── page.tsx          # View (Server Component)
        └── edit/page.tsx     # Edit

components/contractors/
├── ContractorForm.tsx        # Shared form
└── ContractorCard.tsx        # Display card

lib/
└── db.ts                     # Database wrapper (already exists)
```

**2 layers**: Component → API Route → Database

---

## Implementation Plan

### Phase 0: MVP Core (2 hours) ✅ STARTING NOW
**Goal**: Full CRUD with 8 fields, working delete

#### 8 Core Fields
```typescript
interface Contractor {
  id: string;
  companyName: string;
  registrationNumber: string;
  businessType: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
}
```

#### Tasks
- [ ] Create `app/api/contractors/route.ts` (GET all, POST create)
- [ ] Create `app/api/contractors/[id]/route.ts` (GET one, PUT, DELETE)
- [ ] Create `app/contractors/page.tsx` (list view)
- [ ] Create `components/contractors/ContractorCard.tsx`
- [ ] Create `components/contractors/DeleteButton.tsx`
- [ ] Test: Delete functionality works

**Acceptance Criteria**:
- ✅ GET /api/contractors returns all contractors
- ✅ POST /api/contractors creates new contractor
- ✅ GET /api/contractors/[id] returns single contractor
- ✅ PUT /api/contractors/[id] updates contractor
- ✅ DELETE /api/contractors/[id] deletes contractor (NO MORE 405!)
- ✅ List page displays contractors
- ✅ Delete button works from list page

---

### Phase 1: Forms & CRUD Pages (2 hours)
**Goal**: Complete UI for create/edit/view

#### Tasks
- [ ] Create `components/contractors/ContractorForm.tsx` (shared form)
- [ ] Create `app/contractors/new/page.tsx` (create page)
- [ ] Create `app/contractors/[id]/page.tsx` (view page)
- [ ] Create `app/contractors/[id]/edit/page.tsx` (edit page)
- [ ] Add form validation
- [ ] Add error handling

**Acceptance Criteria**:
- ✅ Can create contractor via form
- ✅ Can view contractor details
- ✅ Can edit contractor
- ✅ Form validation works
- ✅ Error messages display properly

---

### Phase 2: Essential Features (1-2 hours)
**Goal**: Add features actually being used

#### Tasks
- [ ] Search/filter by name, email, status
- [ ] Status badges (pending/approved/rejected)
- [ ] Loading states
- [ ] Success/error toasts
- [ ] Pagination (if needed)

**Acceptance Criteria**:
- ✅ Can search contractors
- ✅ Can filter by status
- ✅ Visual feedback for all actions
- ✅ Responsive design works

---

### Phase 3: Extended Features (Add as Needed)
Build incrementally when actually needed:

#### Documents (if needed)
- `app/api/contractors/[id]/documents/route.ts`
- Document upload component
- Document list component

#### Teams (if needed)
- `app/api/contractors/[id]/teams/route.ts`
- Team management component

#### RAG Scoring (if needed)
- `app/api/contractors/[id]/rag/route.ts`
- RAG display component

#### Onboarding (if needed)
- Simplified to: pending → approved (no complex stages)

---

## Migration Strategy: Build in Parallel

### Step 1: Build New (Don't Touch Old)
```
app/                          ← New (App Router)
pages/                        ← Old (keep running)
```

No conflicts. Old code keeps working while building new.

### Step 2: Cutover When Ready
```bash
# Delete old
rm -rf pages/contractors
rm -rf pages/api/contractors
rm -rf src/modules/contractors
rm -rf src/services/contractor

# Keep new
app/contractors/
app/api/contractors/
components/contractors/
```

### Step 3: Git Backup
All old files preserved in git history:
```bash
git log --all --full-history -- pages/contractors/
git checkout <commit-hash> -- pages/contractors/  # If needed
```

---

## Technical Standards

### API Response Format (Consistent)
```typescript
// Success
{ data: { ...contractor } }

// Error
{ error: "Error message" }
```

### Database Access (Direct)
```typescript
import { db } from '@/lib/db';

const contractors = await db`SELECT * FROM contractors`;
```

No service layer. API routes talk directly to database.

### Server Components by Default
```typescript
// app/contractors/page.tsx
export default async function ContractorsPage() {
  const contractors = await db`SELECT * FROM contractors`;
  // No useState, no useEffect, no loading states
  return <div>...</div>;
}
```

### Client Components Only When Needed
```typescript
'use client';  // Only for interactivity (buttons, forms)

export function DeleteButton({ id }: { id: string }) {
  const handleDelete = async () => {
    await fetch(`/api/contractors/${id}`, { method: 'DELETE' });
  };
  return <button onClick={handleDelete}>Delete</button>;
}
```

---

## Success Metrics

### Technical
- ✅ Delete works (no 405 errors)
- ✅ All CRUD operations < 200ms
- ✅ No route conflicts
- ✅ Consistent API responses
- ✅ Files < 200 lines each

### Developer Experience
- ✅ Can find any file in < 10 seconds
- ✅ Can add new feature in < 30 minutes
- ✅ Can debug issue in < 5 minutes
- ✅ New dev onboarding < 30 minutes

---

## Database Schema (Already Exists)

```sql
-- Table: contractors (already created)
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  registration_number TEXT,
  business_type TEXT,
  industry_category TEXT,
  years_in_business INTEGER,
  employee_count INTEGER,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  alternate_phone TEXT,
  physical_address TEXT,
  postal_address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  annual_turnover DECIMAL,
  credit_rating TEXT,
  payment_terms TEXT,
  bank_name TEXT,
  account_number TEXT,
  branch_code TEXT,
  specializations TEXT[],
  certifications TEXT[],
  status TEXT DEFAULT 'pending',
  compliance_status TEXT,
  is_active BOOLEAN DEFAULT false,
  notes TEXT,
  tags TEXT[],
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Using existing schema**. Start with 8 core fields, expand as needed.

---

## Timeline

### Day 1 (Today - Oct 30, 2025)
**2 hours**: Phase 0 - MVP Core
- API routes (GET, POST, PUT, DELETE)
- List page
- Test delete functionality ✅

### Day 2 (Oct 31, 2025)
**2 hours**: Phase 1 - Forms & CRUD Pages
- Create/Edit/View pages
- Shared form component
- Validation

### Day 3 (Nov 1, 2025)
**1-2 hours**: Phase 2 - Essential Features
- Search/filter
- Status badges
- Polish

### Optional: Extended Features
**As needed**: Phase 3
- Documents, teams, RAG, etc.
- Add incrementally when required

---

## Extensibility: Yes, It Scales

### Adding New Features (Example: Documents)

**Step 1**: Create API route (15 min)
```typescript
// app/api/contractors/[id]/documents/route.ts
export async function GET(req, { params }) {
  const docs = await db`
    SELECT * FROM contractor_documents
    WHERE contractor_id = ${params.id}
  `;
  return NextResponse.json({ data: docs });
}
```

**Step 2**: Add UI component (15 min)
```typescript
// components/contractors/DocumentsList.tsx
'use client';
export function DocumentsList({ contractorId }) {
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    fetch(`/api/contractors/${contractorId}/documents`)
      .then(r => r.json())
      .then(d => setDocs(d.data));
  }, [contractorId]);
  return <div>{docs.map(...)}</div>;
}
```

**Step 3**: Add to view page (5 min)
```typescript
// app/contractors/[id]/page.tsx
import { DocumentsList } from '@/components/contractors/DocumentsList';

export default async function ContractorPage({ params }) {
  return (
    <div>
      {/* existing contractor info */}
      <DocumentsList contractorId={params.id} />
    </div>
  );
}
```

**Total time**: 30 minutes per feature. Each feature is isolated.

---

## Lessons Learned

### From Old Architecture
1. **Over-abstraction hurts** - 6 layers made simple tasks complex
2. **Workarounds compound** - `/contractors-delete` is a symptom of deeper issues
3. **Test files in pages/** - Next.js treats them as routes (phantom endpoints)
4. **trailingSlash config** - Broke all API routes in production
5. **File/directory conflicts** - `[id].ts` vs `[id]/` caused routing issues

### For New Architecture
1. **Start simple** - 8 fields, not 30
2. **Add complexity when needed** - Not when imagined
3. **Flat structure** - Easy to find, easy to change
4. **Direct paths** - Component → API → Database
5. **Server Components** - Less client-side JavaScript, faster pages

---

## References

### Related Docs
- [Page Logs](../../page-logs/contractors.md) - Historical bug fixes
- [Pre-Rebuild Fixes](../../CONTRACTORS_PRE_REBUILD_FIXES.md) - Infrastructure fixes
- [Foundation Assessment](./foundation-assessment.md) - Current state analysis

### New Files (This Rewrite)
- API: `app/api/contractors/`
- Pages: `app/contractors/`
- Components: `components/contractors/`

### Old Files (Preserved in Git)
- API: `pages/api/contractors/`
- Pages: `pages/contractors/`
- Components: `src/modules/contractors/`
- Services: `src/services/contractor/`

---

## Status Tracking

| Phase | Status | Time Spent | Completed |
|-------|--------|------------|-----------|
| Phase 0: MVP Core | 🚀 In Progress | 0h | - |
| Phase 1: Forms & CRUD | ⏸️ Pending | - | - |
| Phase 2: Essential Features | ⏸️ Pending | - | - |
| Phase 3: Extended Features | ⏸️ Optional | - | - |

**Total Time**: Target 4-6 hours

---

**Decision Approved**: October 30, 2025
**Started**: October 30, 2025
**Next Review**: After Phase 0 completion
