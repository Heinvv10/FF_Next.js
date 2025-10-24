# Contractors Module - Improvement Backlog

**Version**: 1.0
**Date**: October 24, 2025
**Status**: Active
**Total Stories**: 25 stories across 5 epics

---

## Backlog Overview

| **Epic** | **Priority** | **Stories** | **Est. Hours** | **Status** |
|----------|-------------|-------------|----------------|------------|
| Epic 1: API Completeness | P0 | 5 | 15-25h | Pending |
| Epic 2: Quality & Testing | P1 | 5 | 20-30h | Pending |
| Epic 3: Code Quality & Refactoring | P1 | 5 | 15-25h | Pending |
| Epic 4: Documentation | P2 | 5 | 10-15h | Pending |
| Epic 5: Performance & Optimization | P2 | 5 | 15-20h | Pending |
| **TOTAL** | - | **25** | **75-115h** | - |

---

## Epic 1: API Completeness (P0 - Critical)

**Goal**: Fill all API gaps to provide complete CRUD functionality
**Business Value**: Enables full contractor management without workarounds
**Dependencies**: None
**Estimated Effort**: 15-25 hours

---

### Story 1.1: Implement Team CRUD Endpoints

**Priority**: P0
**Epic**: API Completeness
**Points**: 3
**Estimated Time**: 3-5 hours

#### Description
Create missing API endpoints for updating and deleting contractor teams. Currently, teams can only be created and listed, but cannot be updated or deleted via API.

#### Acceptance Criteria
- [ ] **PUT** `/api/contractors/[contractorId]/teams/[teamId]` implemented
  - Updates team name, type, size, lead info, availability, etc.
  - Validates contractorId and teamId exist
  - Returns updated team with standardized response
- [ ] **DELETE** `/api/contractors/[contractorId]/teams/[teamId]` implemented
  - Soft delete (sets is_active = false) or hard delete based on query param
  - Validates team exists and belongs to contractor
  - Returns success confirmation
- [ ] **PATCH** `/api/contractors/[contractorId]/teams/[teamId]/availability` implemented
  - Quick endpoint to update just availability status
  - Validates availability value
- [ ] All endpoints use `apiResponse` helper
- [ ] All endpoints have input validation
- [ ] All endpoints have proper error handling (404, 400, 500)

#### Technical Notes
- Create new file: `pages/api/contractors/[contractorId]/teams/[teamId].ts`
- Use existing `neonContractorService.updateTeam()` and `deleteTeam()` methods
- Follow pattern from `pages/api/contractors/[contractorId].ts`

#### Files to Modify
- **Create**: `pages/api/contractors/[contractorId]/teams/[teamId].ts`
- **Update**: `src/services/contractor/neonContractorService.ts` (if methods missing)

#### Test Requirements
- Unit tests for API route handlers
- Test validation errors (invalid IDs, missing fields)
- Test 404 when team not found
- Test success cases

---

### Story 1.2: Implement Document CRUD Endpoints

**Priority**: P0
**Epic**: API Completeness
**Points**: 5
**Estimated Time**: 4-6 hours

#### Description
Create missing API endpoints for updating, deleting, and verifying contractor documents. The handlers exist (`handleDocumentUpdate`, `handleDocumentDelete`) but are not routed.

#### Acceptance Criteria
- [ ] **PUT** `/api/contractors/[contractorId]/documents/[docId]` implemented
  - Updates document metadata (name, type, expiry date, notes)
  - Cannot change file path (security)
  - Returns updated document
- [ ] **DELETE** `/api/contractors/[contractorId]/documents/[docId]` implemented
  - Hard delete from database (soft delete option?)
  - Validates document exists and belongs to contractor
  - Returns success confirmation
- [ ] **PATCH** `/api/contractors/[contractorId]/documents/[docId]/verify` implemented
  - Marks document as verified by current user
  - Sets verification timestamp and notes
  - Returns updated document
- [ ] **PATCH** `/api/contractors/[contractorId]/documents/[docId]/status` implemented
  - Updates document status (pending, approved, rejected, expired)
  - Requires rejection reason for rejected status
  - Returns updated document
- [ ] All endpoints use `apiResponse` helper
- [ ] All endpoints validate document types and statuses against allowed values

#### Technical Notes
- Create: `pages/api/contractors/[contractorId]/documents/[docId].ts`
- Route existing handlers from `documents.ts` (lines 139-196)
- Add verification logic to `neonContractorService`

#### Files to Modify
- **Create**: `pages/api/contractors/[contractorId]/documents/[docId].ts`
- **Update**: `pages/api/contractors/[contractorId]/documents.ts` (extract handlers)
- **Update**: `src/services/contractor/neonContractorService.ts`

#### Test Requirements
- API route tests for all 4 endpoints
- Test document type validation
- Test status transition rules
- Test verification workflow

---

### Story 1.3: Implement RAG Score Management Endpoints

**Priority**: P0
**Epic**: API Completeness
**Points**: 3
**Estimated Time**: 3-4 hours

#### Description
Create API endpoints for updating contractor RAG (Red-Amber-Green) scores and viewing score history. RAG scores are critical for contractor performance tracking.

#### Acceptance Criteria
- [ ] **PUT** `/api/contractors/[contractorId]/rag` implemented
  - Updates one or more RAG scores (overall, financial, compliance, performance, safety)
  - Validates RAG values ('red', 'amber', 'green')
  - Records change in contractor_rag_history table
  - Requires change reason
  - Returns updated contractor with new scores
- [ ] **GET** `/api/contractors/[contractorId]/rag/history` implemented
  - Returns RAG score change history for contractor
  - Includes score_type, old_score, new_score, change_reason, changed_at, changed_by
  - Ordered by changed_at DESC
  - Supports pagination (optional)
- [ ] All endpoints use `apiResponse` helper
- [ ] History endpoint supports filtering by score_type

#### Technical Notes
- Create: `pages/api/contractors/[contractorId]/rag.ts`
- Create: `pages/api/contractors/[contractorId]/rag/history.ts`
- Add methods to `neonContractorService`:
  - `updateRAGScore(contractorId, scores, reason, changedBy)`
  - `getRAGHistory(contractorId, filters?)`

#### Files to Modify
- **Create**: `pages/api/contractors/[contractorId]/rag.ts`
- **Create**: `pages/api/contractors/[contractorId]/rag/history.ts`
- **Update**: `src/services/contractor/neonContractorService.ts`

#### Test Requirements
- Test RAG score updates
- Test history recording
- Test validation (invalid RAG values)
- Test history retrieval and filtering

---

### Story 1.4: Implement Onboarding Management Endpoints

**Priority**: P0
**Epic**: API Completeness
**Points**: 4
**Estimated Time**: 3-5 hours

#### Description
Create API endpoints for managing contractor onboarding stages and completing onboarding process.

#### Acceptance Criteria
- [ ] **PUT** `/api/contractors/[contractorId]/onboarding/stages/[stageId]` implemented
  - Updates stage status (pending, in_progress, completed, skipped)
  - Updates completion_percentage
  - Tracks completed_documents
  - Returns updated stage
- [ ] **POST** `/api/contractors/[contractorId]/onboarding/complete` implemented
  - Validates all required stages are completed
  - Sets contractor onboarding_completed_at timestamp
  - Sets onboarding_progress to 100
  - Returns updated contractor
- [ ] **GET** `/api/contractors/[contractorId]/onboarding/stages` implemented
  - Lists all onboarding stages for contractor
  - Shows progress and status
  - Ordered by stage_order
- [ ] All endpoints use `apiResponse` helper
- [ ] Complete endpoint validates prerequisites

#### Technical Notes
- Create: `pages/api/contractors/[contractorId]/onboarding/stages/[stageId].ts`
- Create: `pages/api/contractors/[contractorId]/onboarding/complete.ts`
- Create: `pages/api/contractors/[contractorId]/onboarding/stages.ts`
- Add methods to onboarding service

#### Files to Modify
- **Create**: 3 new API route files (see above)
- **Update**: `src/services/contractor/contractorOnboardingService.ts`

#### Test Requirements
- Test stage updates
- Test completion validation (missing stages)
- Test completion success flow
- Test onboarding progress calculation

---

### Story 1.5: Standardize All API Responses

**Priority**: P0
**Epic**: API Completeness
**Points**: 3
**Estimated Time**: 2-4 hours

#### Description
Ensure ALL contractor API endpoints use the standardized `apiResponse` helper for consistent response format across the application.

#### Acceptance Criteria
- [ ] All API routes in `pages/api/contractors/` use `apiResponse` helper
- [ ] No endpoints return raw data (all wrapped in standard envelope)
- [ ] All success responses use appropriate methods:
  - `apiResponse.success()` for GET requests
  - `apiResponse.created()` for POST requests
  - `apiResponse.success()` for PUT/PATCH/DELETE requests
- [ ] All error responses use appropriate methods:
  - `apiResponse.notFound()` for 404s
  - `apiResponse.validationError()` for 400s
  - `apiResponse.internalError()` for 500s
- [ ] Frontend `contractorApiService` updated to unwrap responses
  - Uses `data.data || data` pattern
  - Handles errors consistently

#### Files to Modify
- `pages/api/contractors/index.ts`
- `pages/api/contractors/[contractorId].ts`
- `pages/api/contractors/[contractorId]/teams.ts`
- `pages/api/contractors/[contractorId]/documents.ts`
- `pages/api/contractors/health.ts`
- `src/services/contractor/contractorApiService.ts`

#### Technical Notes
- Import: `import { apiResponse } from '@/lib/apiResponse';`
- Replace all `res.status(200).json({ success: true, data: ... })` with `apiResponse.success(res, data)`
- See `CLAUDE.md` API Response Standards section for details

#### Test Requirements
- Verify all API responses have correct structure
- Test frontend services handle responses correctly
- Test error responses include proper error codes
- Integration tests for end-to-end flow

---

## Epic 2: Quality & Testing (P1 - Important)

**Goal**: Achieve 80%+ test coverage for reliability
**Business Value**: Reduces regressions, improves confidence in changes
**Dependencies**: Epic 1 (APIs should be complete before comprehensive testing)
**Estimated Effort**: 20-30 hours

---

### Story 2.1: Add API Route Tests

**Priority**: P1
**Epic**: Quality & Testing
**Points**: 5
**Estimated Time**: 5-7 hours

#### Description
Create comprehensive test coverage for all contractor API routes using Vitest and mock database calls.

#### Acceptance Criteria
- [ ] Tests for `/api/contractors` (GET, POST)
  - Test listing with filters
  - Test creation with valid data
  - Test validation errors
- [ ] Tests for `/api/contractors/[contractorId]` (GET, PUT, DELETE)
  - Test get by ID
  - Test update
  - Test delete (soft delete)
  - Test 404 cases
- [ ] Tests for `/api/contractors/[contractorId]/teams` (all endpoints)
- [ ] Tests for `/api/contractors/[contractorId]/documents` (all endpoints)
- [ ] Tests for RAG and onboarding endpoints
- [ ] Mock Neon database calls appropriately
- [ ] Test coverage for API routes: 100%

#### Technical Notes
- Create test files adjacent to API routes
- Use `vitest` test framework
- Mock `@neondatabase/serverless`
- Test HTTP methods, status codes, response formats

#### Files to Create
- `pages/api/contractors/index.test.ts`
- `pages/api/contractors/[contractorId].test.ts`
- `pages/api/contractors/[contractorId]/teams.test.ts`
- `pages/api/contractors/[contractorId]/documents.test.ts`
- Additional test files for new endpoints

---

### Story 2.2: Add Service Layer Unit Tests

**Priority**: P1
**Epic**: Quality & Testing
**Points**: 5
**Estimated Time**: 5-7 hours

#### Description
Add comprehensive unit tests for all contractor services, especially `neonContractorService`.

#### Acceptance Criteria
- [ ] Tests for `neonContractorService` methods
  - Test CRUD operations
  - Test query building with different filters
  - Test data mapping functions
  - Test error handling
- [ ] Tests for team service methods
- [ ] Tests for document service methods
- [ ] Tests for onboarding service methods
- [ ] Mock database calls with `vi.mock()`
- [ ] Test coverage for services: 90%+

#### Files to Create
- `src/services/contractor/neonContractorService.test.ts`
- `src/services/contractor/contractorTeamService.test.ts`
- `src/services/contractor/contractorOnboardingService.test.ts`
- Update existing: `src/services/contractor/contractorDocumentService.test.ts`

---

### Story 2.3: Add Component Tests

**Priority**: P1
**Epic**: Quality & Testing
**Points**: 5
**Estimated Time**: 6-8 hours

#### Description
Add React Testing Library tests for critical contractor components.

#### Acceptance Criteria
- [ ] Tests for ContractorView component
  - Test tabs rendering
  - Test data loading states
  - Test error states
- [ ] Tests for ContractorEdit component
  - Test form validation
  - Test form submission
  - Test error display
- [ ] Tests for TeamManagement component
- [ ] Tests for DocumentUploadCard component
- [ ] Tests for OnboardingWorkflow component
- [ ] Test coverage for components: 70%+

#### Files to Create
- `src/modules/contractors/components/ContractorView.test.tsx`
- `src/modules/contractors/components/ContractorEdit.test.tsx`
- `src/modules/contractors/components/teams/TeamManagement.test.tsx`
- Update existing component tests

---

### Story 2.4: Add E2E Tests for Critical Workflows

**Priority**: P1
**Epic**: Quality & Testing
**Points**: 5
**Estimated Time**: 4-6 hours

#### Description
Create Playwright E2E tests for critical contractor user journeys.

#### Acceptance Criteria
- [ ] Test: Create new contractor → Complete onboarding → Approve
  - Navigate to contractors page
  - Click "New Contractor"
  - Fill out form
  - Submit and verify creation
  - Complete onboarding stages
  - Approve contractor
  - Verify status change
- [ ] Test: Add team to contractor
- [ ] Test: Upload and verify document
- [ ] Test: Update RAG score
- [ ] All tests run in CI/CD pipeline
- [ ] Tests are stable (no flaky tests)

#### Files to Create
- `tests/e2e/contractors/contractor-workflow.spec.ts`
- `tests/e2e/contractors/team-management.spec.ts`
- `tests/e2e/contractors/document-management.spec.ts`

---

### Story 2.5: Set Up CI/CD Test Automation

**Priority**: P1
**Epic**: Quality & Testing
**Points**: 3
**Estimated Time**: 2-3 hours

#### Description
Configure GitHub Actions or Vercel to run all tests automatically on push and PR.

#### Acceptance Criteria
- [ ] Unit tests run on every push
- [ ] E2E tests run on PR
- [ ] Test coverage report generated
- [ ] PR blocked if tests fail
- [ ] Coverage thresholds enforced (80%)
- [ ] Fast feedback (<5 minutes for unit tests)

#### Files to Modify/Create
- `.github/workflows/test.yml` (if using GitHub Actions)
- `vitest.config.ts` - add coverage thresholds
- Update `package.json` scripts

---

## Epic 3: Code Quality & Refactoring (P1 - Important)

**Goal**: Eliminate technical debt and improve maintainability
**Business Value**: Faster feature development, easier onboarding
**Dependencies**: Epic 2 (need tests before refactoring)
**Estimated Effort**: 15-25 hours

---

### Story 3.1: Consolidate Contractor Services

**Priority**: P1
**Epic**: Code Quality & Refactoring
**Points**: 5
**Estimated Time**: 4-6 hours

#### Description
Merge `neonContractorService` and `contractorCrudService` to eliminate duplication and create single source of truth.

#### Acceptance Criteria
- [ ] Single `contractorService.ts` contains all CRUD operations
- [ ] No duplicate methods between services
- [ ] All imports updated to use consolidated service
- [ ] All tests pass after consolidation
- [ ] No breaking changes to API contracts

#### Files to Modify
- **Merge into**: `src/services/contractor/contractorService.ts`
- **Remove**: `src/services/contractor/contractorCrudService.ts` (if exists)
- **Update**: `src/services/contractor/neonContractorService.ts` → rename/consolidate
- **Update**: All files importing these services

---

### Story 3.2: Extract Query Builder for Complex Filters

**Priority**: P1
**Epic**: Code Quality & Refactoring
**Points**: 4
**Estimated Time**: 3-5 hours

#### Description
Extract complex SQL filter logic from `neonContractorService` into dedicated query builder.

#### Acceptance Criteria
- [ ] New `contractorQueryBuilder.ts` created
- [ ] Handles all filter combinations (status, compliance, RAG, search)
- [ ] Type-safe query building
- [ ] Supports dynamic WHERE clauses
- [ ] Supports pagination and sorting
- [ ] All existing queries refactored to use builder
- [ ] Unit tests for query builder

#### Files to Create
- `src/services/contractor/contractorQueryBuilder.ts`
- `src/services/contractor/contractorQueryBuilder.test.ts`

#### Files to Modify
- `src/services/contractor/contractorService.ts`

---

### Story 3.3: Refactor Large Components (>300 lines)

**Priority**: P1
**Epic**: Code Quality & Refactoring
**Points**: 5
**Estimated Time**: 5-8 hours

#### Description
Identify and break down all components exceeding 300 lines into smaller, focused components.

#### Acceptance Criteria
- [ ] Audit all components, identify those >300 lines
- [ ] Break down into sub-components
- [ ] Extract business logic to custom hooks
- [ ] Extract reusable UI elements
- [ ] All components <300 lines
- [ ] No loss of functionality
- [ ] All tests pass

#### Files to Audit
- Run: `find src/modules/contractors -name "*.tsx" -exec wc -l {} + | sort -n | tail -20`
- Likely candidates:
  - `src/modules/contractors/components/ContractorView.tsx`
  - `src/modules/contractors/components/ContractorEdit.tsx`
  - `src/modules/contractors/components/onboarding/EnhancedOnboardingWorkflow.tsx`

---

### Story 3.4: Remove Duplicate ContractorDetailSections

**Priority**: P1
**Epic**: Code Quality & Refactoring
**Points**: 3
**Estimated Time**: 2-3 hours

#### Description
Consolidate two `ContractorDetailSections` directories into single source of truth.

#### Acceptance Criteria
- [ ] Identify which version is canonical
- [ ] Migrate any unique functionality
- [ ] Delete duplicate directory
- [ ] Update all imports
- [ ] Verify all pages still work
- [ ] All tests pass

#### Files to Modify
- `src/modules/contractors/components/ContractorDetailSections/` (keep one)
- Update imports in consuming components

---

### Story 3.5: Enable TypeScript Strict Mode

**Priority**: P1
**Epic**: Code Quality & Refactoring
**Points**: 5
**Estimated Time**: 3-5 hours

#### Description
Enable TypeScript strict mode for contractors module and fix any type issues.

#### Acceptance Criteria
- [ ] `strict: true` in tsconfig.json (or per-file)
- [ ] All `any` types removed or justified
- [ ] All implicit type issues fixed
- [ ] All null/undefined handled properly
- [ ] No TypeScript errors in contractors module
- [ ] Build passes

#### Files to Modify
- `tsconfig.json` or create `src/modules/contractors/tsconfig.json`
- Various files to fix type issues

---

## Epic 4: Documentation (P2 - Enhancement)

**Goal**: Comprehensive documentation for developers and users
**Business Value**: Faster onboarding, self-service support
**Dependencies**: None (can run in parallel)
**Estimated Effort**: 10-15 hours

---

### Story 4.1: Create Module Architecture Documentation

**Priority**: P2
**Epic**: Documentation
**Points**: 3
**Estimated Time**: 2-3 hours

#### Description
Create comprehensive architecture documentation for contractors module.

#### Acceptance Criteria
- [ ] Document created: `docs/modules/contractors/architecture.md`
- [ ] Includes data flow diagram (API → Service → DB)
- [ ] Includes component hierarchy diagram
- [ ] Documents state management patterns
- [ ] Documents database schema overview
- [ ] Includes Mermaid diagrams for visual clarity
- [ ] Explains key design decisions

---

### Story 4.2: Generate OpenAPI/Swagger Documentation

**Priority**: P2
**Epic**: Documentation
**Points**: 4
**Estimated Time**: 3-4 hours

#### Description
Create OpenAPI 3.0 specification for all contractor API endpoints.

#### Acceptance Criteria
- [ ] OpenAPI spec file created: `docs/modules/contractors/api-spec.yaml`
- [ ] All endpoints documented
- [ ] Request/response schemas defined
- [ ] Error responses documented
- [ ] Example requests/responses included
- [ ] Swagger UI accessible at `/api-docs` (optional)

---

### Story 4.3: Add JSDoc Comments to Services

**Priority**: P2
**Epic**: Documentation
**Points**: 2
**Estimated Time**: 2-3 hours

#### Description
Add comprehensive JSDoc comments to all service methods.

#### Acceptance Criteria
- [ ] All public service methods have JSDoc comments
- [ ] Includes @param, @returns, @throws tags
- [ ] Includes usage examples
- [ ] TypeScript IntelliSense shows documentation

---

### Story 4.4: Add Component Usage Documentation

**Priority**: P2
**Epic**: Documentation
**Points**: 3
**Estimated Time**: 2-3 hours

#### Description
Document how to use key contractor components.

#### Acceptance Criteria
- [ ] Component usage guide created
- [ ] Includes prop descriptions
- [ ] Includes usage examples
- [ ] Documents common patterns
- [ ] Consider Storybook integration (optional)

---

### Story 4.5: Create Developer Onboarding Guide

**Priority**: P2
**Epic**: Documentation
**Points**: 3
**Estimated Time**: 2-3 hours

#### Description
Create guide for new developers working on contractors module.

#### Acceptance Criteria
- [ ] Document: `docs/modules/contractors/developer-guide.md`
- [ ] Explains module structure
- [ ] Walks through common tasks
- [ ] Links to relevant documentation
- [ ] Includes troubleshooting tips

---

## Epic 5: Performance & Optimization (P2 - Enhancement)

**Goal**: Optimize for production scale
**Business Value**: Better user experience at scale
**Dependencies**: Epic 1 (need complete APIs)
**Estimated Effort**: 15-20 hours

---

### Story 5.1: Add Pagination to List Endpoints

**Priority**: P2
**Epic**: Performance & Optimization
**Points**: 4
**Estimated Time**: 3-4 hours

#### Description
Implement cursor-based or offset pagination for contractor list endpoints.

#### Acceptance Criteria
- [ ] `/api/contractors` supports pagination
  - Query params: `limit` (default 50), `offset` or `cursor`
  - Response includes: `data`, `pagination` (total, hasNext, hasPrev)
- [ ] Frontend implements infinite scroll or pagination controls
- [ ] Performance tested with 10,000+ records

---

### Story 5.2: Optimize Database Queries

**Priority**: P2
**Epic**: Performance & Optimization
**Points**: 4
**Estimated Time**: 3-4 hours

#### Description
Analyze and optimize slow database queries.

#### Acceptance Criteria
- [ ] Query performance analyzed (EXPLAIN ANALYZE)
- [ ] Missing indexes identified and added
- [ ] N+1 queries eliminated
- [ ] All queries <100ms (p95)

---

### Story 5.3: Implement Caching Strategy

**Priority**: P2
**Epic**: Performance & Optimization
**Points**: 4
**Estimated Time**: 4-5 hours

#### Description
Implement caching for frequently accessed contractor data.

#### Acceptance Criteria
- [ ] Cache contractor lists (Redis or in-memory)
- [ ] Cache contractor details
- [ ] Cache invalidation on updates
- [ ] Cache hit rate >70%

---

### Story 5.4: Add Virtual Scrolling to Large Lists

**Priority**: P2
**Epic**: Performance & Optimization
**Points**: 3
**Estimated Time**: 3-4 hours

#### Description
Implement virtual scrolling for contractor lists to handle thousands of records.

#### Acceptance Criteria
- [ ] Contractor list uses virtual scrolling (react-window or similar)
- [ ] Smooth scrolling with 1000+ items
- [ ] Initial render <500ms

---

### Story 5.5: Performance Testing & Benchmarking

**Priority**: P2
**Epic**: Performance & Optimization
**Points**: 3
**Estimated Time**: 2-3 hours

#### Description
Establish performance baselines and run load tests.

#### Acceptance Criteria
- [ ] Load tests created (Artillery or k6)
- [ ] Performance baselines documented
- [ ] Performance monitoring in place
- [ ] P95 response times documented

---

## Backlog Management

### How to Use This Backlog

1. **Review and Prioritize**: Review backlog weekly, adjust priorities based on business needs
2. **Sprint Planning**: Select stories for upcoming sprint based on priority and capacity
3. **Story Refinement**: Refine stories 1 sprint ahead (add details, clarify acceptance criteria)
4. **Track Progress**: Update story status as work progresses
5. **Retrospective**: Review completed stories, update estimates for future planning

### Story Status Values
- **Pending**: Not yet started
- **In Progress**: Currently being worked on
- **In Review**: Code complete, awaiting review
- **Testing**: In QA testing
- **Done**: Completed and deployed
- **Blocked**: Blocked by dependency or issue

### Story Points Guide
- **1 point**: <2 hours (trivial)
- **2 points**: 2-3 hours (simple)
- **3 points**: 3-5 hours (moderate)
- **4 points**: 5-7 hours (complex)
- **5 points**: 7+ hours (very complex, consider splitting)

---

## Next Steps

1. **Install BMad**: Run `npx bmad-method install` if not already done
2. **Start with Epic 1**: Begin with highest priority stories (API Completeness)
3. **Use BMad Workflow**: Follow SM → Dev → QA cycle for each story
4. **Track Progress**: Update this backlog as stories are completed
5. **Iterate**: After each epic, retrospect and adjust plan

---

**Document End**
