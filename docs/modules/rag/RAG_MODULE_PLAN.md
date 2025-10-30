# RAG Scoring Module - Separation Plan

**Date**: October 30, 2025
**Decision**: Extract RAG scoring as independent, reusable module
**Status**: Planned (Build after contractors rewrite)

---

## Overview

RAG (Red/Amber/Green) scoring is a **performance rating system** that should be a **separate, reusable module** instead of being embedded in contractors.

**Current Problem**: RAG fields mixed into contractors table, tightly coupled
**Solution**: Separate RAG module that can score ANY entity type

---

## Architecture: Before vs After

### ❌ Current (Bad) - Coupled to Contractors

```
contractors table
├── id
├── company_name
├── email
├── rag_overall        ← Scoring mixed with identity
├── rag_financial      ← Scoring mixed with identity
├── rag_compliance     ← Scoring mixed with identity
├── rag_performance    ← Scoring mixed with identity
└── rag_safety         ← Scoring mixed with identity

Problems:
- Can't reuse for projects, suppliers, staff
- Contractor CRUD bloated with scoring logic
- Changes to RAG affect contractors
- Testing requires contractor data
```

### ✅ New (Good) - Decoupled Module

```
contractors table          rag_scores table
├── id            ────────┬─── entity_id
├── company_name          │    entity_type = 'contractor'
├── email                 │    overall_score
└── status                │    financial_score
                          │    compliance_score
                          │    performance_score
                          │    safety_score
                          │    calculated_at
                          └─── valid_until

Benefits:
✅ Reusable for any entity type
✅ Independent development/testing
✅ Optional feature (turn on/off)
✅ Contractors module stays simple
```

---

## RAG Scoring Explained

### What is RAG?

**RAG** = **R**ed, **A**mber, **G**reen (traffic light system)

A performance rating that evaluates entities across multiple dimensions with weighted scoring.

### The 4 Dimensions

#### 1. Performance (30% weight) 🎯
- Completion Rate - Do they finish projects?
- Quality Score - Work quality rating
- Timeliness - On-time delivery
- Client Satisfaction - Customer feedback
- Project Complexity - Can they handle difficult jobs?

#### 2. Financial (25% weight) 💰
- Payment History - Pay subcontractors/suppliers on time?
- Financial Stability - Financially healthy?
- Credit Rating - Creditworthiness
- Revenue Consistency - Stable income?
- Budget Adherence - Stay within budgets?

#### 3. Reliability (25% weight) ⏰
- Attendance/Availability - Show up when needed?
- Response Time - Quick to respond?
- Commitment Level - Follow through?
- Compliance Record - Follow rules/regulations?
- Communication Rating - Good at communicating?

#### 4. Capabilities (20% weight) 🛠️
- Technical Skills - Team skill level
- Equipment Rating - Quality of equipment
- Team Experience - Years of experience
- Certification Level - Proper certifications?
- Specialization Depth - Expertise in domain

### Scoring Algorithm

```typescript
// Each dimension gets 0-100 score
const performanceScore = calculatePerformance(entity);
const financialScore = calculateFinancial(entity);
const reliabilityScore = calculateReliability(entity);
const capabilitiesScore = calculateCapabilities(entity);

// Weighted average
const overallScore =
  (performanceScore * 0.30) +
  (financialScore * 0.25) +
  (reliabilityScore * 0.25) +
  (capabilitiesScore * 0.20);

// Convert to RAG status
if (overallScore >= 80) return 'green';   // ✅ Excellent
if (overallScore >= 60) return 'amber';   // ⚠️ Acceptable
return 'red';                              // 🔴 Poor
```

---

## Database Schema

### Core RAG Table

```sql
CREATE TABLE rag_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic entity reference
  entity_type TEXT NOT NULL,        -- 'contractor', 'project', 'supplier', 'staff'
  entity_id UUID NOT NULL,

  -- Overall RAG score
  overall_score DECIMAL(5,2),       -- 0-100
  overall_status TEXT,              -- 'red', 'amber', 'green'

  -- Dimension scores
  performance_score DECIMAL(5,2),
  performance_status TEXT,
  financial_score DECIMAL(5,2),
  financial_status TEXT,
  reliability_score DECIMAL(5,2),
  reliability_status TEXT,
  capabilities_score DECIMAL(5,2),
  capabilities_status TEXT,

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,          -- Cache expiry
  calculation_method TEXT,          -- Algorithm version

  -- Indexes
  UNIQUE(entity_type, entity_id),
  CHECK(overall_score >= 0 AND overall_score <= 100)
);

CREATE INDEX idx_rag_entity ON rag_scores(entity_type, entity_id);
CREATE INDEX idx_rag_status ON rag_scores(entity_type, overall_status);
CREATE INDEX idx_rag_score ON rag_scores(entity_type, overall_score DESC);
```

### Score History (Optional - for trending)

```sql
CREATE TABLE rag_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  overall_score DECIMAL(5,2),
  performance_score DECIMAL(5,2),
  financial_score DECIMAL(5,2),
  reliability_score DECIMAL(5,2),
  capabilities_score DECIMAL(5,2),

  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Track what changed
  changed_from_score DECIMAL(5,2),
  change_reason TEXT
);

CREATE INDEX idx_rag_history ON rag_score_history(entity_type, entity_id, calculated_at DESC);
```

### Breakdown Details (Optional - for drill-down)

```sql
CREATE TABLE rag_score_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rag_score_id UUID REFERENCES rag_scores(id) ON DELETE CASCADE,

  dimension TEXT NOT NULL,          -- 'performance', 'financial', etc.
  metric_name TEXT NOT NULL,        -- 'completion_rate', 'payment_history', etc.
  metric_value DECIMAL(5,2),
  metric_weight DECIMAL(3,2),

  -- Contextual data
  data_points_count INTEGER,        -- How many data points used
  data_quality TEXT,                -- 'high', 'medium', 'low'
  notes TEXT
);
```

---

## Module Structure

```
src/modules/rag/
├── types/
│   ├── rag.types.ts              # RAG score interfaces
│   └── dimension.types.ts        # Dimension breakdowns
├── services/
│   ├── ragCalculator.ts          # Core scoring engine
│   ├── performanceScorer.ts      # Performance dimension
│   ├── financialScorer.ts        # Financial dimension
│   ├── reliabilityScorer.ts      # Reliability dimension
│   └── capabilitiesScorer.ts     # Capabilities dimension
├── components/
│   ├── RAGBadge.tsx              # Simple colored badge
│   ├── RAGScoreCard.tsx          # Detailed score card
│   ├── RAGDashboard.tsx          # Full dashboard
│   ├── RAGTrendChart.tsx         # Score history chart
│   └── RAGLeaderboard.tsx        # Entity rankings
├── hooks/
│   ├── useRAGScore.ts            # Fetch entity score
│   └── useRAGHistory.ts          # Fetch score trends
└── utils/
    ├── ragThresholds.ts          # Score -> Status mapping
    └── ragFormatters.ts          # Display helpers

app/api/rag/
├── route.ts                      # GET scores, POST calculate
├── [entityType]/
│   └── [entityId]/
│       ├── route.ts              # GET /api/rag/contractor/123
│       ├── history/route.ts      # GET score history
│       └── breakdown/route.ts    # GET detailed breakdown
└── leaderboard/route.ts          # GET top performers
```

---

## API Design

### Get Score for Entity

```typescript
GET /api/rag/contractor/abc-123

Response:
{
  data: {
    entityType: 'contractor',
    entityId: 'abc-123',
    overall: {
      score: 78,
      status: 'amber',
      rank: 15  // Out of all contractors
    },
    dimensions: {
      performance: { score: 85, status: 'green' },
      financial: { score: 72, status: 'amber' },
      reliability: { score: 68, status: 'amber' },
      capabilities: { score: 90, status: 'green' }
    },
    calculatedAt: '2025-10-30T10:00:00Z',
    validUntil: '2025-11-06T10:00:00Z'
  }
}
```

### Calculate/Recalculate Score

```typescript
POST /api/rag/contractor/abc-123/calculate

Response:
{
  data: {
    overall: { score: 78, status: 'amber' },
    previousScore: 75,
    change: +3,
    calculatedAt: '2025-10-30T10:05:00Z'
  }
}
```

### Get Leaderboard

```typescript
GET /api/rag/leaderboard?entityType=contractor&limit=10

Response:
{
  data: [
    {
      entityId: 'xyz-789',
      companyName: 'Top Performer Ltd',
      overallScore: 95,
      status: 'green',
      rank: 1
    },
    // ...
  ]
}
```

### Get Score History

```typescript
GET /api/rag/contractor/abc-123/history?days=90

Response:
{
  data: [
    { date: '2025-10-30', score: 78, status: 'amber' },
    { date: '2025-10-23', score: 75, status: 'amber' },
    { date: '2025-10-16', score: 72, status: 'amber' },
    // ...
  ]
}
```

---

## Integration Examples

### 1. Simple Badge (Anywhere)

```typescript
import { RAGBadge } from '@/modules/rag/components/RAGBadge';

<ContractorCard contractor={contractor}>
  <RAGBadge entityType="contractor" entityId={contractor.id} />
</ContractorCard>
```

### 2. Score Card (Detail View)

```typescript
import { RAGScoreCard } from '@/modules/rag/components/RAGScoreCard';

<ContractorView contractor={contractor}>
  <RAGScoreCard
    entityType="contractor"
    entityId={contractor.id}
    showBreakdown={true}
  />
</ContractorView>
```

### 3. Full Dashboard (Analytics Page)

```typescript
import { RAGDashboard } from '@/modules/rag/components/RAGDashboard';

<RAGDashboard
  entityType="contractor"
  showLeaderboard={true}
  showTrends={true}
/>
```

### 4. Using Hook (Custom Display)

```typescript
import { useRAGScore } from '@/modules/rag/hooks/useRAGScore';

function ContractorPerformance({ contractorId }) {
  const { score, loading } = useRAGScore('contractor', contractorId);

  if (loading) return <Spinner />;

  return (
    <div>
      Overall: {score.overall.status} ({score.overall.score}/100)
      Performance: {score.dimensions.performance.status}
      Financial: {score.dimensions.financial.status}
    </div>
  );
}
```

---

## Benefits of Separation

### 1. Reusability ✅
```typescript
// Score contractors
await rag.calculate('contractor', contractorId);

// Score projects
await rag.calculate('project', projectId);

// Score suppliers
await rag.calculate('supplier', supplierId);

// Score staff
await rag.calculate('staff', staffId);
```

### 2. Independent Development ✅
- Build contractors module NOW (4-6 hours)
- Build RAG module LATER when needed (1-2 days)
- No dependencies, no waiting

### 3. Optional Feature ✅
- Don't need RAG? Don't build it
- Need RAG? Turn it on whenever ready
- No impact on core modules

### 4. Easier Testing ✅
```typescript
// Test RAG calculations independently
test('calculates performance score', () => {
  const score = performanceScorer.calculate(mockData);
  expect(score).toBe(85);
});

// Mock RAG in contractor tests
jest.mock('@/modules/rag');
```

### 5. Performance ✅
```typescript
// Cache RAG scores separately
const score = await cache.get(`rag:contractor:${id}`)
  || await rag.calculate('contractor', id);

// Async recalculation (don't block CRUD)
await queue.add('recalculate-rag', { entityType, entityId });
```

---

## Implementation Timeline

### Phase 1: Contractors Module (NOW - 4-6 hours)
✅ Build clean contractors CRUD
✅ NO RAG fields or logic
✅ Simple, focused, working

### Phase 2: RAG Module (LATER - 1-2 days when needed)
**Day 1: Core Engine (4-6 hours)**
- [ ] Database schema (rag_scores table)
- [ ] Score calculation service
- [ ] Dimension calculators (performance, financial, reliability, capabilities)
- [ ] API routes (/api/rag/*)

**Day 2: UI Components (4-6 hours)**
- [ ] RAGBadge component (simple)
- [ ] RAGScoreCard component (detailed)
- [ ] RAGDashboard component (full analytics)
- [ ] RAGTrendChart component (history)
- [ ] RAGLeaderboard component (rankings)

**Day 2 cont: Integration (1-2 hours)**
- [ ] Add RAGBadge to contractor list
- [ ] Add RAGScoreCard to contractor detail view
- [ ] Create /analytics/rag page with full dashboard
- [ ] Test all integrations

### Phase 3: Enhancement (OPTIONAL - ongoing)
- [ ] Score history tracking
- [ ] Automated recalculation (cron jobs)
- [ ] Email alerts for status changes
- [ ] Detailed breakdown views
- [ ] Comparison tools
- [ ] Export/reporting

---

## Data Requirements

### To Calculate RAG Scores, You Need:

**Performance Dimension:**
- Project completion records
- Quality ratings/feedback
- Timeline adherence data
- Client satisfaction scores

**Financial Dimension:**
- Payment history records
- Financial statements
- Credit reports
- Budget vs actual data

**Reliability Dimension:**
- Attendance records
- Response time logs
- Compliance audit results
- Communication ratings

**Capabilities Dimension:**
- Team skill assessments
- Equipment inventory
- Certification records
- Training history

### If You Don't Have This Data Yet:
1. Build the module structure
2. Use placeholder scores or manual entry
3. Gradually add automated calculation as data becomes available

---

## Migration Strategy

### If Current Contractors Already Have RAG Data:

```sql
-- Step 1: Create new rag_scores table
CREATE TABLE rag_scores (...);

-- Step 2: Migrate existing RAG data
INSERT INTO rag_scores (entity_type, entity_id, overall_score, ...)
SELECT
  'contractor',
  id,
  rag_overall_score,
  ...
FROM contractors
WHERE rag_overall_score IS NOT NULL;

-- Step 3: After verification, drop old RAG columns
ALTER TABLE contractors
  DROP COLUMN rag_overall,
  DROP COLUMN rag_financial,
  DROP COLUMN rag_compliance,
  DROP COLUMN rag_performance,
  DROP COLUMN rag_safety;
```

---

## Success Metrics

### Technical KPIs
- **Calculation Time**: < 1 second per entity
- **Cache Hit Rate**: > 90% (don't recalculate unnecessarily)
- **API Response Time**: < 200ms for cached scores
- **Accuracy**: Scores match manual review 95%+

### Business KPIs
- **Adoption Rate**: % of entities with calculated scores
- **Score Distribution**: Balanced red/amber/green (not everyone green)
- **Trending Correlation**: Score changes correlate with actual performance
- **Decision Impact**: % of decisions influenced by RAG scores

---

## References

### Current Implementation (To Be Deprecated)
- `src/services/contractor/ragScoringService.ts`
- `src/modules/contractors/components/RAGDashboard.tsx`
- `src/types/contractor/base.types.ts` (RAG fields)

### Future Implementation (This Plan)
- `src/modules/rag/` (new module)
- `app/api/rag/` (new API routes)
- `docs/modules/rag/` (new documentation)

---

**Status**: ✅ Plan approved, implementation pending
**Next Steps**: Build contractors module first, then return to implement RAG
**Estimated Effort**: 1-2 days (8-16 hours) when ready to implement
