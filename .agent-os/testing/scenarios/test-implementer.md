# Test Scenario: Implementer Agent

## Test Objective
Validate that the implementer agent can correctly plan implementation following FibreFlow standards WITHOUT actually implementing code.

## Test Scenario
**Feature**: Add "Export to CSV" button to existing Contractors list page

**Specification**:
```markdown
# CSV Export Feature for Contractors

## Requirements
- Add "Export to CSV" button to /contractors page (existing)
- Button should appear in top-right corner of contractors table
- On click, download CSV with columns: Name, Email, Phone, Status, Join Date
- Show loading spinner during export
- Show success toast notification on completion
- Handle errors with error toast

## Technical Details
- API Endpoint: /api/contractors-export (new)
- CSV generation: Use Papaparse library (already in package.json)
- Data source: Existing contractors table query
- Limit: 10,000 rows per export
```

## Expected Deliverables

### 1. Implementation Plan (WITHOUT ACTUAL CODE CHANGES)
The agent should produce a plan that includes:

- [ ] **Files to be created/modified** - List with file:line references
  - Example: "Modify app/contractors/page.tsx to add ExportButton component"
  - Example: "Create pages/api/contractors-export.ts"

- [ ] **Component breakdown** - What components needed
  - ExportButton component (where it goes, props)
  - Loading state handling
  - Toast notifications

- [ ] **API endpoint design**
  - Location: pages/api/contractors-export.ts
  - Method: GET
  - Response: CSV file with correct headers
  - Uses apiResponse helper for errors

- [ ] **Testing approach**
  - How to test locally
  - What to verify on dev.fibreflow.app
  - Edge cases to test

- [ ] **Deployment plan**
  - Build locally first
  - Deploy to dev
  - Get approval
  - Deploy to production

### 2. Alignment with FibreFlow Standards
The plan should demonstrate:

- [ ] **File size awareness** - Mentions keeping components <200 lines
- [ ] **Flattened API route** - Uses /api/contractors-export (NOT /api/contractors/[id]/export)
- [ ] **API standardization** - References using apiResponse helper
- [ ] **Testing on dev first** - Mentions dev.fibreflow.app testing
- [ ] **Documentation updates** - Mentions updating CHANGELOG.md, page logs
- [ ] **Direct SQL** - Plans to use Neon client with direct SQL query

### 3. Implementation Steps (High-Level)
The agent should outline:

1. Research phase (find similar exports in codebase)
2. Database query (SQL to fetch contractors)
3. API endpoint creation
4. UI component integration
5. Testing procedure
6. Deployment workflow

## Test Constraints
- **DO NOT create actual files** - Planning only
- **DO NOT modify existing code** - Analysis only
- **DO NOT deploy anything** - Workflow description only
- **Output location**: .agent-os/testing/sandbox/implementation-plan.md

## Evaluation Criteria

| Criterion | Weight | Pass/Fail |
|-----------|--------|-----------|
| Completeness (all steps covered) | 25% | |
| FibreFlow standards alignment | 25% | |
| Technical accuracy | 20% | |
| Deployment workflow understanding | 15% | |
| Testing approach | 15% | |

**Pass threshold**: 80% overall score

## Success Indicators
- ✅ Agent understands it should NOT implement code in test
- ✅ Agent produces comprehensive plan instead
- ✅ Plan follows FibreFlow patterns
- ✅ Plan includes all necessary steps
- ✅ Agent references correct files and patterns from codebase
