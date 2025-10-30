# Contractors Module - Feature Separation Analysis

**Date**: October 30, 2025
**Purpose**: Identify features that should be separate modules vs core contractor functionality

---

## Analysis Summary

Currently embedded in contractors:
1. ✅ **RAG Scoring** - Should be separate (CONFIRMED)
2. ✅ **Teams Management** - Should be separate
3. ✅ **Document Management** - Should be separate
4. ✅ **Onboarding Workflow** - Should be separate
5. ⚠️ **Compliance Tracking** - Hybrid (some core, some separate)
6. ❌ **Project Statistics** - Should stay (calculated fields)

---

## 1. RAG Scoring Module ✅ SEPARATE

**Current**: Mixed into contractors table
**Should Be**: Independent scoring module

See: `/docs/modules/rag/RAG_MODULE_PLAN.md`

**Separation Plan**: ✅ Complete

---

## 2. Teams Management Module ✅ SEPARATE

### Why Separate?

Teams are NOT contractor identity. They are:
- A **resource management** concern (who's available for projects)
- **Reusable** across modules (assign teams to projects, track team performance)
- **Complex enough** to warrant own module (members, skills, availability)

### Current Tables (Already Separated)

```sql
contractor_teams
├── id
├── contractor_id (FK)
├── team_name
├── team_type
├── specialization
├── skill_level
└── created_at

team_members
├── id
├── team_id (FK)
├── contractor_id (FK)
├── first_name
├── last_name
├── role
├── skills
└── certifications
```

### Proposed: Generic Teams Module

```sql
teams
├── id
├── entity_type          -- 'contractor', 'internal', 'partner'
├── entity_id            -- contractor_id, department_id, etc.
├── team_name
├── team_type
├── specialization
└── status

team_members
├── id
├── team_id (FK)
├── member_name
├── member_email
├── role
├── skills[]
├── certifications[]
└── availability_status
```

### Benefits of Separation

**Reusability:**
```typescript
// Assign contractor team to project
await teams.assignToProject('contractor-team-123', 'project-456');

// Assign internal team to project
await teams.assignToProject('internal-team-789', 'project-456');

// Get all teams on a project
const projectTeams = await teams.getByProject('project-456');
```

**Separation of Concerns:**
- Contractors module = WHO the contractor is (identity)
- Teams module = WHO works for them (resources)
- Projects module = WHERE teams are assigned (work)

**Independent Features:**
- Team scheduling/availability
- Skill matrix
- Team performance tracking
- Resource planning
- Capacity management

### Implementation Estimate

**Time**: 6-8 hours

**Structure:**
```
src/modules/teams/
├── types/team.types.ts
├── services/teamService.ts
├── components/
│   ├── TeamsList.tsx
│   ├── TeamCard.tsx
│   ├── TeamMemberForm.tsx
│   └── TeamAssignment.tsx
└── hooks/useTeams.ts

app/api/teams/
├── route.ts                    # GET, POST
├── [id]/route.ts              # GET, PUT, DELETE
└── [id]/members/route.ts      # Manage members
```

---

## 3. Document Management Module ✅ SEPARATE

### Why Separate?

Documents are NOT contractor identity. They are:
- A **compliance** concern (certifications, registrations)
- **Reusable** across modules (contractors, suppliers, projects, staff)
- **Complex** (versioning, approval workflows, expiry tracking)

### Current Tables (Already Separated)

```sql
contractor_documents
├── id
├── contractor_id (FK)
├── document_type
├── document_name
├── document_number
├── file_url
├── issue_date
├── expiry_date
├── status
└── verified_by

ALSO: Generic document system exists
├── documents
├── document_folders
├── document_shares
├── document_workflows
└── document_comments
```

### Proposed: Unified Document Management Module

**Two-tier system:**
1. **Entity Documents** (contractor_documents, supplier_documents) - Lightweight references
2. **Document Management System** (documents table) - Full document features

```sql
-- Lightweight entity documents
entity_documents
├── id
├── entity_type          -- 'contractor', 'supplier', 'project', 'staff'
├── entity_id
├── document_id (FK to documents table)
├── purpose              -- 'compliance', 'contract', 'certification', 'insurance'
├── is_required
├── expiry_date
└── compliance_status

-- Full document system (already exists)
documents
├── id
├── file_name
├── file_url
├── file_type
├── version
├── created_by
└── created_at
```

### Benefits of Separation

**Reusability:**
```typescript
// Attach document to contractor
await documents.attach('contractor', contractorId, documentId, {
  purpose: 'tax_clearance',
  expiryDate: '2026-12-31'
});

// Attach same document to supplier
await documents.attach('supplier', supplierId, documentId, {
  purpose: 'supplier_agreement'
});

// Get expiring documents across ALL entities
const expiring = await documents.getExpiring(30); // 30 days
```

**Features (Shared Across Entities):**
- Document upload/versioning
- Approval workflows
- Expiry tracking
- Document sharing
- Access logs
- Comments/annotations
- OCR/metadata extraction

### Implementation Estimate

**Time**: 8-12 hours (full-featured document system)

**Structure:**
```
src/modules/documents/
├── types/document.types.ts
├── services/
│   ├── documentService.ts
│   ├── documentStorage.ts      # Firebase Storage integration
│   └── documentOCR.ts          # Extract metadata
├── components/
│   ├── DocumentUpload.tsx
│   ├── DocumentViewer.tsx
│   ├── DocumentList.tsx
│   ├── ExpiryTracker.tsx
│   └── ApprovalWorkflow.tsx
└── hooks/
    ├── useDocuments.ts
    └── useDocumentUpload.ts

app/api/documents/
├── route.ts                    # GET, POST
├── [id]/route.ts              # GET, PUT, DELETE
├── [id]/versions/route.ts     # Version history
├── attach/route.ts            # Attach to entity
└── expiring/route.ts          # Get expiring docs
```

---

## 4. Onboarding Workflow Module ✅ SEPARATE

### Why Separate?

Onboarding is NOT contractor identity. It's:
- A **workflow/process** concern (multi-step approval)
- **Reusable** (suppliers, staff, partners all need onboarding)
- **Temporary** (only active during onboarding, then complete)

### Current Tables (Already Separated)

```sql
contractor_onboarding_stages
├── id
├── contractor_id (FK)
├── stage_name           -- 'registration', 'documents', 'verification', etc.
├── stage_order
├── status               -- 'pending', 'in_progress', 'completed', 'blocked'
├── completed_at
└── notes
```

### Proposed: Generic Onboarding Module

```sql
onboarding_workflows
├── id
├── entity_type          -- 'contractor', 'supplier', 'staff'
├── entity_id
├── workflow_template    -- 'contractor_basic', 'contractor_advanced', 'supplier_preferred'
├── overall_status
├── started_at
├── completed_at
└── created_by

onboarding_stages
├── id
├── workflow_id (FK)
├── stage_name
├── stage_order
├── status
├── required_documents   -- JSON array of required doc types
├── assigned_to          -- Who needs to review this stage
├── completed_at
├── completed_by
└── notes
```

### Benefits of Separation

**Reusability:**
```typescript
// Start contractor onboarding
await onboarding.start('contractor', contractorId, 'contractor_basic');

// Start supplier onboarding (same system)
await onboarding.start('supplier', supplierId, 'supplier_preferred');

// Custom workflow templates
await onboarding.createTemplate('contractor_express', [
  'registration',
  'tax_clearance'
]); // Fast-track for trusted contractors
```

**Workflow Features (Shared):**
- Stage progression
- Document requirements per stage
- Approval routing
- Email notifications
- Progress tracking
- Conditional stages (skip if criteria met)

### Implementation Estimate

**Time**: 6-8 hours

**Structure:**
```
src/modules/onboarding/
├── types/onboarding.types.ts
├── services/
│   ├── onboardingService.ts
│   └── workflowTemplates.ts
├── components/
│   ├── OnboardingWizard.tsx
│   ├── StageProgress.tsx
│   ├── StageCard.tsx
│   └── OnboardingDashboard.tsx
└── hooks/
    ├── useOnboarding.ts
    └── useOnboardingStage.ts

app/api/onboarding/
├── route.ts                    # Start workflow
├── [workflowId]/route.ts      # Get workflow status
├── [workflowId]/stages/route.ts        # Update stage
└── templates/route.ts         # Manage templates
```

---

## 5. Compliance Tracking ⚠️ HYBRID

### Why Hybrid?

Compliance has TWO aspects:

**Core (Stay in Contractors):**
- `status` field (pending/approved/suspended)
- `complianceStatus` field (compliant/non_compliant/under_review)
- Basic approval workflow

**Advanced (Separate Module):**
- Compliance requirements tracking
- Document expiry monitoring
- Audit trails
- Scheduled compliance reviews
- Multi-level approval workflows

### Recommendation

**Phase 1 (Contractors Rewrite):**
Keep basic compliance in contractors:
```typescript
interface Contractor {
  status: 'pending' | 'approved' | 'suspended';
  complianceStatus: 'compliant' | 'non_compliant' | 'under_review';
}
```

**Phase 2 (Later - IF Needed):**
Build advanced compliance module if you need:
- Regulatory requirement tracking
- Automated compliance checks
- Compliance scoring
- Audit management
- Multi-entity compliance (contractors + suppliers + internal)

---

## 6. Project Statistics ❌ STAY IN CONTRACTORS

### Why Stay?

These are **calculated/aggregated** fields, not separate entities:
```typescript
interface Contractor {
  totalProjects: number;        // COUNT(*) from projects
  completedProjects: number;    // COUNT(*) WHERE status = 'completed'
  activeProjects: number;       // COUNT(*) WHERE status = 'active'
  successRate: number;          // completedProjects / totalProjects
}
```

### How to Handle

**Option A: Calculated on-the-fly (Recommended)**
```typescript
// Don't store in contractors table
// Calculate when needed
const stats = await db`
  SELECT
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
    COUNT(*) FILTER (WHERE status = 'active') as active_projects
  FROM contractor_assignments
  WHERE contractor_id = ${contractorId}
`;
```

**Option B: Cached/denormalized (If performance needed)**
```sql
-- Separate table for performance
contractor_statistics
├── contractor_id (PK)
├── total_projects
├── completed_projects
├── active_projects
├── calculated_at
└── TRIGGER to update when projects change
```

---

## Summary: What to Separate

### ✅ Separate Immediately (Next Phase)

| Module | Priority | Effort | Reusability | Value |
|--------|----------|--------|-------------|-------|
| RAG Scoring | P1 | 1-2 days | High | High |
| Teams | P2 | 6-8 hrs | High | High |
| Documents | P1 | 8-12 hrs | Very High | Very High |
| Onboarding | P3 | 6-8 hrs | High | Medium |

### ⚠️ Decide Later

| Feature | Keep Basic Version | Build Advanced Later If Needed |
|---------|-------------------|-------------------------------|
| Compliance | ✅ status, complianceStatus fields | ⏳ Full compliance module |

### ❌ Keep in Contractors

| Field | Reason |
|-------|--------|
| Project Statistics | Calculated/aggregated, not entities |
| Notes | Core metadata |
| Tags | Core metadata |

---

## Contractors Core Module: Final Scope

After all separations, contractors module should ONLY contain:

### Core Identity Fields (18 fields)

```typescript
interface Contractor {
  id: string;

  // Company (5)
  companyName: string;
  registrationNumber: string;
  businessType: string;
  industryCategory: string;
  yearsInBusiness?: number;

  // Contact (4)
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone?: string;

  // Address (5)
  physicalAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;

  // Status (3)
  status: 'pending' | 'approved' | 'suspended';
  isActive: boolean;
  complianceStatus: 'compliant' | 'non_compliant' | 'under_review';

  // Professional (2)
  specializations?: string[];
  certifications?: string[];

  // Financial (3) - For payment purposes
  bankName?: string;
  accountNumber?: string;
  branchCode?: string;

  // Metadata (4)
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### What's Excluded

❌ RAG scoring → RAG module
❌ Teams → Teams module
❌ Documents → Documents module
❌ Onboarding progress → Onboarding module
❌ Project statistics → Calculated fields
❌ Performance scores → RAG module

---

## Implementation Roadmap

### Phase 0: Contractors Rewrite (NOW - 4-6 hours)
**Core CRUD only**
- 18 fields (identity, contact, status)
- Simple list/view/edit/create
- No teams, no documents, no RAG, no onboarding

### Phase 1: Documents Module (Week 2 - 8-12 hours)
**High priority, high reusability**
- Build generic document management
- Attach documents to contractors, suppliers, projects
- Expiry tracking
- Upload/storage integration

### Phase 2: RAG Scoring Module (Week 3 - 1-2 days)
**Performance analytics**
- Generic scoring engine
- Works for contractors, projects, suppliers
- Dashboard and leaderboards

### Phase 3: Teams Module (Week 4 - 6-8 hours)
**Resource management**
- Team/member CRUD
- Assignment to projects
- Skill tracking
- Availability management

### Phase 4: Onboarding Module (Week 5 - 6-8 hours)
**Workflow automation**
- Multi-stage workflows
- Document requirements
- Approval routing
- Templates for different entity types

---

## Benefits of This Approach

### 1. Faster Initial Development ⚡
- Contractors module: 4-6 hours (vs 20+ hours with everything)
- Get to production quickly
- Add features incrementally

### 2. Cleaner Architecture 🏗️
- Each module has ONE job
- No God objects
- Easy to understand

### 3. Better Reusability ♻️
- Documents work for contractors, suppliers, projects, staff
- RAG scoring works for any entity
- Teams can be internal or contractor-based
- Onboarding templates reusable

### 4. Independent Testing ✅
- Test contractors without documents
- Test RAG without contractors
- Mock interfaces between modules

### 5. Flexible Deployment 🚀
```typescript
// Start small
✅ Contractors only

// Add features as needed
✅ Contractors + Documents

// Full suite when ready
✅ Contractors + Documents + Teams + RAG + Onboarding
```

### 6. Team Scalability 👥
- Different developers can work on different modules
- No stepping on each other's toes
- Clear boundaries

---

## Decision Matrix: Keep vs Separate

| Feature | Data Complexity | Reusability | Current LOC | Recommendation |
|---------|----------------|-------------|-------------|----------------|
| RAG Scoring | High (4 dimensions) | Very High | 800+ | ✅ SEPARATE |
| Teams | Medium (2 tables) | High | 500+ | ✅ SEPARATE |
| Documents | High (5+ tables) | Very High | 1000+ | ✅ SEPARATE |
| Onboarding | Medium (2 tables) | High | 400+ | ✅ SEPARATE |
| Compliance (basic) | Low (2 fields) | Low | 50 | ❌ KEEP |
| Project Stats | Low (calculated) | Medium | 100 | ❌ KEEP (calculate) |
| Notes/Tags | Low (2 fields) | None | 20 | ❌ KEEP |

---

## Final Recommendation

**For Contractors Rewrite:**

### ✅ Include (Core Identity)
- Company info
- Contact info
- Address
- Bank details (for payments)
- Status (pending/approved/suspended)
- Basic compliance status
- Specializations/certifications
- Notes/tags

### ❌ Exclude (Build as Separate Modules)
- RAG scoring → `src/modules/rag/`
- Teams management → `src/modules/teams/`
- Document management → `src/modules/documents/`
- Onboarding workflow → `src/modules/onboarding/`
- Performance metrics → Part of RAG module
- Project statistics → Calculated on-demand

**Result**: Clean 4-6 hour rewrite for contractors, then build supporting modules incrementally.

---

**Date**: October 30, 2025
**Status**: ✅ Analysis complete, ready for implementation
**Next Step**: Build contractors core module (4-6 hours)
