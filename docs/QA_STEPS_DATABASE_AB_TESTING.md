# QA Steps Database & A/B Testing - Design Document

**Date**: 2025-12-24
**Status**: Proposed Enhancement
**Current**: Config File Approach
**Next**: Database with A/B Testing

---

## Table of Contents

1. [Current State (Config File)](#current-state-config-file)
2. [Proposed Database Approach](#proposed-database-approach)
3. [A/B Testing Capabilities](#ab-testing-capabilities)
4. [Implementation Plan](#implementation-plan)
5. [Use Cases & Examples](#use-cases--examples)
6. [Migration Path](#migration-path)

---

## Current State (Config File)

### How It Works

```
config/qa-evaluation-steps.json
    ↓
loadQASteps() reads file at startup
    ↓
QA_STEPS cached in memory
    ↓
VLM uses steps for evaluation
```

### Limitations

| Feature | Status | Impact |
|---------|--------|--------|
| **Update Speed** | ⚠️ Requires restart | ~30 seconds |
| **Instant Changes** | ❌ No | Manual restart needed |
| **Version History** | ⚠️ Git only | No built-in tracking |
| **A/B Testing** | ❌ No | Can't compare criteria |
| **Result Tracking** | ❌ No | Can't link steps to results |
| **Analytics** | ❌ No | No performance metrics |

---

## Proposed Database Approach

### Database Schema

```sql
-- QA Step Versions Table
CREATE TABLE qa_step_versions (
  id SERIAL PRIMARY KEY,
  version_name VARCHAR(100) NOT NULL,          -- e.g., "v1.0-baseline", "v1.1-stricter-lights"
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft',          -- draft, active, testing, archived
  is_default BOOLEAN DEFAULT false,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(version_name)
);

-- QA Steps Table
CREATE TABLE qa_steps (
  id SERIAL PRIMARY KEY,
  version_id INTEGER NOT NULL REFERENCES qa_step_versions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name VARCHAR(50) NOT NULL,
  step_label VARCHAR(100) NOT NULL,
  criteria TEXT NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0,              -- Step importance (for weighted scoring)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(version_id, step_number)
);

-- Evaluation Results Table (Enhanced)
CREATE TABLE foto_evaluations (
  id SERIAL PRIMARY KEY,
  dr_number VARCHAR(20) NOT NULL,
  version_id INTEGER REFERENCES qa_step_versions(id),  -- Links to QA version used
  overall_status VARCHAR(10) NOT NULL,
  average_score DECIMAL(3,1),
  total_steps INTEGER NOT NULL,
  passed_steps INTEGER NOT NULL,
  evaluation_date TIMESTAMP DEFAULT NOW(),
  evaluation_time_ms INTEGER,                   -- How long evaluation took
  model_name VARCHAR(100),                      -- e.g., "Qwen3-VL-8B-Instruct"
  batch_count INTEGER,
  photo_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step Results Table (Detailed)
CREATE TABLE foto_evaluation_step_results (
  id SERIAL PRIMARY KEY,
  evaluation_id INTEGER NOT NULL REFERENCES foto_evaluations(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name VARCHAR(50) NOT NULL,
  step_label VARCHAR(100) NOT NULL,
  passed BOOLEAN NOT NULL,
  score DECIMAL(3,1) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_evaluations_dr_number ON foto_evaluations(dr_number);
CREATE INDEX idx_evaluations_version ON foto_evaluations(version_id);
CREATE INDEX idx_evaluations_date ON foto_evaluations(evaluation_date);
CREATE INDEX idx_step_results_evaluation ON foto_evaluation_step_results(evaluation_id);
```

---

## A/B Testing Capabilities

### 1. **Run Tests**

Create multiple QA step versions and test them in parallel.

#### Example: Testing Stricter Criteria

```sql
-- Version A: Current (Baseline)
INSERT INTO qa_step_versions (version_name, description, status, is_default) VALUES
('v1.0-baseline', 'Current production criteria', 'active', true);

INSERT INTO qa_steps (version_id, step_number, step_name, step_label, criteria) VALUES
(1, 10, 'ont_lights_and_dr_label', 'Green Lights & DR Label',
 'ONT with green lights indicating successful connection AND DR number label clearly visible on device or nearby');

-- Version B: Stricter Lights Requirement
INSERT INTO qa_step_versions (version_name, description, status) VALUES
('v1.1-stricter-lights', 'Require both green AND red power lights', 'testing');

INSERT INTO qa_steps (version_id, step_number, step_name, step_label, criteria) VALUES
(2, 10, 'ont_lights_and_dr_label', 'Green & Red Lights + DR Label',
 'ONT with green connection lights AND red power light visible AND DR number label clearly visible on device or nearby');

-- Version C: Relaxed Cable Requirement
INSERT INTO qa_step_versions (version_name, description, status) VALUES
('v1.2-relaxed-cable', 'Make cable routing less strict', 'testing');

INSERT INTO qa_steps (version_id, step_number, step_name, step_label, criteria) VALUES
(3, 6, 'ont_back_and_barcode', 'ONT Back & Barcode',
 'Back of ONT showing cable connections OR ONT barcode/serial number clearly visible and readable');
```

#### Run Evaluations with Different Versions

```typescript
// Evaluate DR with Version A (baseline)
const resultA = await evaluateDR('DR1730550', { version_id: 1 });

// Evaluate same DR with Version B (stricter)
const resultB = await evaluateDR('DR1730550', { version_id: 2 });

// Evaluate same DR with Version C (relaxed)
const resultC = await evaluateDR('DR1730550', { version_id: 3 });
```

---

### 2. **Keep Track of Results**

All evaluations are stored with version references.

#### Query: Get All Evaluations for a DR

```sql
SELECT
  e.dr_number,
  v.version_name,
  v.description,
  e.overall_status,
  e.average_score,
  e.passed_steps,
  e.total_steps,
  e.evaluation_date
FROM foto_evaluations e
JOIN qa_step_versions v ON e.version_id = v.id
WHERE e.dr_number = 'DR1730550'
ORDER BY e.evaluation_date DESC;
```

**Result:**
```
dr_number  | version_name          | overall_status | average_score | passed_steps
-----------|-----------------------|----------------|---------------|-------------
DR1730550  | v1.2-relaxed-cable   | PASS           | 7.2           | 9/10
DR1730550  | v1.0-baseline        | FAIL           | 6.8           | 7/10
DR1730550  | v1.1-stricter-lights | FAIL           | 6.5           | 6/10
```

#### Query: Track Evaluation History Over Time

```sql
SELECT
  DATE(evaluation_date) as date,
  v.version_name,
  COUNT(*) as evaluations,
  AVG(average_score) as avg_score,
  SUM(CASE WHEN overall_status = 'PASS' THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as pass_rate
FROM foto_evaluations e
JOIN qa_step_versions v ON e.version_id = v.id
WHERE evaluation_date >= NOW() - INTERVAL '30 days'
GROUP BY DATE(evaluation_date), v.version_name
ORDER BY date DESC, version_name;
```

**Result:**
```
date       | version_name          | evaluations | avg_score | pass_rate
-----------|-----------------------|-------------|-----------|----------
2025-12-24 | v1.0-baseline        | 45          | 6.9       | 68.9%
2025-12-24 | v1.1-stricter-lights | 25          | 6.2       | 56.0%
2025-12-24 | v1.2-relaxed-cable   | 20          | 7.4       | 80.0%
```

---

### 3. **Compare Results**

Side-by-side comparison of different QA criteria performance.

#### Compare Step-by-Step Performance

```sql
WITH version_comparison AS (
  SELECT
    sr.step_number,
    sr.step_label,
    v.version_name,
    AVG(sr.score) as avg_score,
    SUM(CASE WHEN sr.passed THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as pass_rate,
    COUNT(*) as evaluations
  FROM foto_evaluation_step_results sr
  JOIN foto_evaluations e ON sr.evaluation_id = e.id
  JOIN qa_step_versions v ON e.version_id = v.id
  WHERE v.status = 'testing'
    AND e.evaluation_date >= NOW() - INTERVAL '7 days'
  GROUP BY sr.step_number, sr.step_label, v.version_name
)
SELECT
  step_number,
  step_label,
  MAX(CASE WHEN version_name = 'v1.0-baseline' THEN avg_score END) as v1_0_score,
  MAX(CASE WHEN version_name = 'v1.1-stricter-lights' THEN avg_score END) as v1_1_score,
  MAX(CASE WHEN version_name = 'v1.2-relaxed-cable' THEN avg_score END) as v1_2_score,
  MAX(CASE WHEN version_name = 'v1.0-baseline' THEN pass_rate END) as v1_0_pass_rate,
  MAX(CASE WHEN version_name = 'v1.1-stricter-lights' THEN pass_rate END) as v1_1_pass_rate,
  MAX(CASE WHEN version_name = 'v1.2-relaxed-cable' THEN pass_rate END) as v1_2_pass_rate
FROM version_comparison
GROUP BY step_number, step_label
ORDER BY step_number;
```

**Result:**
```
step | step_label              | v1.0 | v1.1 | v1.2 | v1.0_pass | v1.1_pass | v1.2_pass
-----|-------------------------|------|------|------|-----------|-----------|----------
1    | House Photo             | 8.2  | 8.2  | 8.2  | 85%       | 85%       | 85%
6    | ONT Back & Barcode      | 7.5  | 7.5  | 8.9  | 72%       | 72%       | 92%  ← Better!
10   | Green Lights & DR Label | 6.8  | 5.2  | 6.8  | 65%       | 48%       | 65%  ← Stricter failed more
```

**Analysis:**
- **v1.2-relaxed-cable**: Higher pass rate on Step 6 (92% vs 72%)
- **v1.1-stricter-lights**: Lower pass rate on Step 10 (48% vs 65%)
- **Recommendation**: Consider v1.2 for production (better balance)

---

## Implementation Plan

### Phase 1: Database Migration (Week 1)

**Tasks:**
1. ✅ Create database tables
2. ✅ Migrate config file to database (import as v1.0)
3. ✅ Create API endpoints for CRUD operations
4. ✅ Update `fotoVlmService.ts` to read from database
5. ✅ Test locally

**Deliverable:** Database-backed QA steps working in dev

---

### Phase 2: Admin UI (Week 2)

**Tasks:**
1. ✅ Create `/admin/qa-steps` page
2. ✅ List all versions
3. ✅ Create/edit/delete versions
4. ✅ Edit step criteria
5. ✅ Set active version
6. ✅ Clone version for testing

**Deliverable:** Web UI to manage QA steps

---

### Phase 3: A/B Testing Framework (Week 3)

**Tasks:**
1. ✅ Add version selection to evaluation API
2. ✅ Create comparison analytics dashboard
3. ✅ Add performance tracking (timing, scores)
4. ✅ Create reports for version comparison

**Deliverable:** Full A/B testing capabilities

---

### Phase 4: Advanced Features (Week 4)

**Tasks:**
1. ✅ Weighted scoring (some steps more important)
2. ✅ Step dependencies (Step 10 requires Step 6)
3. ✅ Auto-promotion (promote test version if performs better)
4. ✅ Rollback capability (revert to previous version)

**Deliverable:** Enterprise-grade QA management

---

## Use Cases & Examples

### Use Case 1: Test Stricter DR Label Requirement

**Scenario:** QA team wants to require DR label to be on ONT device (not just "nearby")

**Steps:**

1. **Clone Current Version**:
   ```sql
   -- Admin UI: Click "Clone v1.0" → Creates v1.1-draft
   ```

2. **Edit Step 10**:
   ```sql
   UPDATE qa_steps
   SET criteria = 'ONT with green lights AND DR number label affixed directly to ONT device (not on wall nearby)'
   WHERE version_id = (SELECT id FROM qa_step_versions WHERE version_name = 'v1.1-draft')
     AND step_number = 10;
   ```

3. **Set Status to Testing**:
   ```sql
   UPDATE qa_step_versions
   SET status = 'testing', description = 'Require DR label on ONT device only'
   WHERE version_name = 'v1.1-draft';
   ```

4. **Run Test Evaluations** (50 DRs):
   ```typescript
   for (const dr of testDRs) {
     // Baseline (v1.0)
     await evaluateDR(dr, { version_id: 1 });

     // Test (v1.1)
     await evaluateDR(dr, { version_id: 2 });
   }
   ```

5. **Compare Results**:
   ```sql
   -- SQL query to compare pass rates
   SELECT
     v.version_name,
     COUNT(*) as total,
     AVG(average_score) as avg_score,
     (SUM(CASE WHEN overall_status = 'PASS' THEN 1 ELSE 0 END)::FLOAT / COUNT(*))::NUMERIC(4,3) as pass_rate
   FROM foto_evaluations e
   JOIN qa_step_versions v ON e.version_id = v.id
   WHERE v.version_name IN ('v1.0-baseline', 'v1.1-draft')
   GROUP BY v.version_name;
   ```

   **Result:**
   ```
   version_name    | total | avg_score | pass_rate
   ----------------|-------|-----------|----------
   v1.0-baseline   | 50    | 6.9       | 0.680
   v1.1-draft      | 50    | 6.5       | 0.560
   ```

6. **Decision**: v1.1 is too strict (pass rate dropped 12%), keep v1.0

---

### Use Case 2: Optimize Cable Routing Criteria

**Scenario:** Field team says Step 6 fails too often, want to relax criteria

**A/B Test:**

```
Version A (Current): "Back of ONT showing cable connections AND barcode visible"
Version B (Test):    "Back of ONT showing cable connections OR barcode visible"
Version C (Test):    "Back of ONT with barcode visible (cable routing optional)"
```

**Results After 100 Evaluations:**

| Version | Avg Score | Pass Rate | Step 6 Pass Rate |
|---------|-----------|-----------|------------------|
| v1.0 (A) | 6.8 | 68% | 72% |
| v1.1 (B) | 7.2 | 75% | 88% ← Better |
| v1.2 (C) | 7.5 | 82% | 95% ← Too relaxed |

**Decision**: Promote v1.1 (balanced improvement)

---

### Use Case 3: Seasonal Adjustment

**Scenario:** Winter photos have worse lighting, temporarily relax photo quality requirements

**Steps:**

1. Clone current version → "v1.0-winter"
2. Adjust criteria for steps 1, 2, 5 (outdoor photos)
3. Set as active version for 3 months (Dec-Feb)
4. Auto-revert to standard version in March

**Tracking:**

```sql
-- Compare winter vs standard criteria performance
SELECT
  EXTRACT(MONTH FROM evaluation_date) as month,
  v.version_name,
  AVG(average_score) as avg_score,
  AVG(passed_steps::FLOAT / total_steps) as pass_rate
FROM foto_evaluations e
JOIN qa_step_versions v ON e.version_id = v.id
GROUP BY month, v.version_name
ORDER BY month;
```

---

## Migration Path

### Step 1: Export Config to SQL

```bash
# Run migration script
node scripts/migrate-config-to-db.js
```

**Script:**
```javascript
const config = require('../config/qa-evaluation-steps.json');

// Create initial version
await sql`
  INSERT INTO qa_step_versions (version_name, description, status, is_default)
  VALUES ('v1.0-from-config', 'Migrated from config file', 'active', true)
  RETURNING id
`;

// Insert steps
for (const step of config.steps) {
  await sql`
    INSERT INTO qa_steps (version_id, step_number, step_name, step_label, criteria)
    VALUES (${versionId}, ${step.step_number}, ${step.step_name}, ${step.step_label}, ${step.criteria})
  `;
}
```

### Step 2: Update Code

```typescript
// OLD: Load from config file
const QA_STEPS = loadQASteps();

// NEW: Load from database
async function getActiveQASteps() {
  const version = await sql`
    SELECT id FROM qa_step_versions
    WHERE is_default = true AND status = 'active'
    LIMIT 1
  `;

  const steps = await sql`
    SELECT step_number, step_name, step_label, criteria
    FROM qa_steps
    WHERE version_id = ${version[0].id}
    ORDER BY step_number ASC
  `;

  return steps;
}

// Use async version
const QA_STEPS = await getActiveQASteps();
```

### Step 3: Keep Config as Fallback

```typescript
async function loadQASteps() {
  try {
    // Try database first
    return await getActiveQASteps();
  } catch (error) {
    log.warn('Database unavailable, falling back to config file');
    // Fallback to config file
    return loadFromConfigFile();
  }
}
```

---

## Benefits Summary

| Feature | Config File | Database | Benefit |
|---------|-------------|----------|---------|
| **Update Speed** | 30s restart | Instant | 97% faster |
| **A/B Testing** | ❌ No | ✅ Yes | Data-driven decisions |
| **Version History** | Git only | Full audit trail | Compliance |
| **Result Tracking** | ❌ No | ✅ Yes | Performance metrics |
| **Comparison** | Manual | Automated SQL | Analytics |
| **Rollback** | Git revert | One click | Safety |
| **Multi-Team** | File conflicts | Concurrent edits | Collaboration |
| **Admin UI** | ❌ No | ✅ Yes | Non-technical users |

---

## Cost-Benefit Analysis

### Development Cost

| Phase | Time | Developer Days |
|-------|------|----------------|
| Database Schema | 2 hours | 0.25 |
| API Endpoints | 4 hours | 0.5 |
| Code Migration | 3 hours | 0.4 |
| Admin UI (Basic) | 8 hours | 1.0 |
| A/B Testing Framework | 6 hours | 0.75 |
| **Total** | **23 hours** | **~3 days** |

### ROI

**Time Saved Per Criteria Update:**
- Before (config): 5 minutes edit + 30s restart = 5.5 min
- After (database): Instant update = 0.5 min
- **Savings: 5 minutes per update**

**With 2 updates per week:**
- Savings: 10 min/week × 52 weeks = **520 minutes/year**
- = **8.6 hours saved per year**

**With A/B testing:**
- Better criteria = higher first-time pass rate
- 5% improvement in pass rate = fewer reworks
- **Estimated: 50+ hours saved in field rework per year**

---

## Next Steps

1. **Review this document** - Confirm requirements
2. **Approve implementation** - Get stakeholder buy-in
3. **Start Phase 1** - Database migration (~3 days)
4. **Test in dev** - Validate before production
5. **Deploy Phase 2** - Admin UI for ease of use
6. **Enable A/B testing** - Start optimizing criteria

---

## Questions?

Contact: Development Team
Document: `/docs/QA_STEPS_DATABASE_AB_TESTING.md`
Version: 1.0
Date: 2025-12-24
