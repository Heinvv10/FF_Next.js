# Contractors Module - Product Requirements Document (PRD)

**Version**: 1.0
**Date**: October 24, 2025
**Status**: Draft
**Module**: Contractors Management
**Type**: Brownfield Enhancement (Existing Module Improvement)

---

## 1. Executive Summary

### Purpose
This PRD defines improvements and enhancements for the existing Contractors module in FibreFlow Next.js application. The module already has a solid foundation (4/5 rating) but requires systematic improvements to achieve production excellence.

### Current State
- **Existing Features**: Full CRUD, teams, documents, onboarding, compliance, performance tracking
- **Foundation Assessment**: Completed October 24, 2025
- **Overall Grade**: ⭐⭐⭐⭐ (4/5) - Solid foundation with improvement opportunities

### Goals
1. Complete missing API functionality (teams/documents CRUD)
2. Improve test coverage from 20% to 80%+
3. Standardize API responses across all endpoints
4. Refactor large components and eliminate code duplication
5. Enhance documentation and maintainability

---

## 2. Background & Context

### Problem Statement
The contractors module is functional but has technical debt that impacts:
- **Developer productivity**: Missing API endpoints force workarounds
- **Code quality**: Inconsistent patterns across services
- **Maintainability**: Large components and duplicate code
- **Reliability**: Low test coverage increases regression risk
- **Onboarding**: Lack of architecture documentation slows new developers

### Why Now?
- Module is critical to fiber network operations
- Foundation is strong enough to build upon
- Technical debt is manageable if addressed systematically
- BMad methodology provides structured improvement process

### Success Criteria
- ✅ All API gaps filled (10 new endpoints)
- ✅ Test coverage >80% (API routes, services, components)
- ✅ All API responses standardized
- ✅ No components >300 lines
- ✅ Complete module architecture documentation
- ✅ Zero duplicate code in ContractorDetailSections

---

## 3. User Personas & Stakeholders

### Primary Users
1. **Operations Manager** - Manages contractor relationships, approvals, compliance
2. **Project Manager** - Assigns contractors to projects, tracks performance
3. **Finance Team** - Reviews financial details, payment terms, banking info
4. **Compliance Officer** - Monitors document expiry, certifications, safety

### Secondary Users
5. **System Administrator** - Approves documents, manages onboarding workflows
6. **Contractor** - Self-service portal for document uploads, team management

### Technical Stakeholders
7. **Developers** - Maintain and extend the contractors module
8. **QA Team** - Test contractor workflows and integrations

---

## 4. Functional Requirements

### FR1: Complete API CRUD Operations
**Priority**: P0 (Critical)

#### FR1.1: Team Management APIs
- **PUT** `/api/contractors/[contractorId]/teams/[teamId]` - Update team
- **DELETE** `/api/contractors/[contractorId]/teams/[teamId]` - Delete team
- **PATCH** `/api/contractors/[contractorId]/teams/[teamId]/availability` - Update availability

#### FR1.2: Document Management APIs
- **PUT** `/api/contractors/[contractorId]/documents/[docId]` - Update document
- **DELETE** `/api/contractors/[contractorId]/documents/[docId]` - Delete document
- **PATCH** `/api/contractors/[contractorId]/documents/[docId]/verify` - Verify document
- **PATCH** `/api/contractors/[contractorId]/documents/[docId]/status` - Update status

#### FR1.3: RAG Score Management APIs
- **PUT** `/api/contractors/[contractorId]/rag` - Update RAG scores
- **GET** `/api/contractors/[contractorId]/rag/history` - Get RAG history

#### FR1.4: Onboarding Management APIs
- **PUT** `/api/contractors/[contractorId]/onboarding/stages/[stageId]` - Update stage
- **POST** `/api/contractors/[contractorId]/onboarding/complete` - Complete onboarding

**Acceptance Criteria**:
- All endpoints follow RESTful conventions
- All endpoints use `apiResponse` helper from `lib/apiResponse.ts`
- All endpoints include input validation
- All endpoints have proper error handling
- All endpoints return consistent response format

---

### FR2: API Response Standardization
**Priority**: P0 (Critical)

#### Requirements
- All API routes use `apiResponse` helper exclusively
- Consistent response envelope: `{ success: boolean, data?: any, error?: object, meta: object }`
- Frontend services unwrap responses correctly (`data.data || data`)
- Error responses include `code`, `message`, `details`

**Affected Files**:
- `pages/api/contractors/index.ts`
- `pages/api/contractors/[contractorId].ts`
- `pages/api/contractors/[contractorId]/teams.ts`
- `pages/api/contractors/[contractorId]/documents.ts`
- `src/services/contractor/contractorApiService.ts`

**Acceptance Criteria**:
- Zero API responses return raw data (all use apiResponse)
- All frontend services handle wrapped responses
- Error responses follow error code enum
- No 405 errors due to response format issues

---

### FR3: Service Layer Consolidation
**Priority**: P1 (Important)

#### Requirements
- Merge `neonContractorService` and `contractorCrudService` into single service
- Extract complex filter logic to separate query builder
- Standardize service method signatures
- Add JSDoc comments to all service methods

**Target Structure**:
```
services/contractor/
├── contractorService.ts          - Main service (consolidated)
├── contractorQueryBuilder.ts     - SQL query builder
├── contractorApiService.ts       - Frontend API client
├── contractorTeamService.ts      - Team operations
├── contractorDocumentService.ts  - Document operations
├── contractorComplianceService.ts
├── contractorOnboardingService.ts
└── contractorImportService.ts
```

**Acceptance Criteria**:
- Single source of truth for contractor CRUD
- No duplicate code between services
- All services use consistent error handling
- Query builder handles all filter combinations

---

### FR4: Component Refactoring
**Priority**: P1 (Important)

#### FR4.1: Break Down Large Components
- Identify all components >300 lines
- Split into smaller, focused components
- Extract business logic to custom hooks
- Create reusable sub-components

#### FR4.2: Eliminate Duplicate Code
- Remove duplicate `ContractorDetailSections` directory
- Create single source of truth for detail sections
- Update all imports to use consolidated components

#### FR4.3: Improve Component Organization
- Ensure all components have proper TypeScript interfaces
- Add PropTypes or type definitions to all components
- Create index.ts exports for all component directories

**Acceptance Criteria**:
- No component exceeds 300 lines
- Zero duplicate directories
- All components have proper type definitions
- All business logic extracted to hooks

---

### FR5: Test Coverage Enhancement
**Priority**: P1 (Important)

#### FR5.1: API Route Tests
- Add tests for all contractor API endpoints
- Test success cases, validation errors, not found cases
- Test authorization/authentication (when implemented)
- Target: 100% API route coverage

#### FR5.2: Service Layer Tests
- Unit tests for neonContractorService methods
- Test SQL query generation
- Test error handling and edge cases
- Mock database calls appropriately
- Target: 90% service coverage

#### FR5.3: Component Tests
- Add React Testing Library tests for key components
- Test user interactions (form submissions, button clicks)
- Test conditional rendering
- Test error states and loading states
- Target: 70% component coverage

#### FR5.4: Integration Tests
- E2E tests for critical contractor workflows
- Test contractor creation → onboarding → approval flow
- Test team management workflow
- Test document upload → verification → expiry tracking
- Target: 5-10 critical path tests

**Acceptance Criteria**:
- Overall test coverage >80%
- All API routes have tests
- All critical user flows have E2E tests
- CI/CD pipeline runs all tests
- No flaky tests (all tests pass consistently)

---

### FR6: Documentation Enhancement
**Priority**: P2 (Enhancement)

#### FR6.1: Module Architecture Documentation
- Create `docs/modules/contractors/architecture.md`
- Document data flow (API → Service → Database)
- Document component hierarchy
- Document state management patterns
- Add Mermaid diagrams for visual clarity

#### FR6.2: API Documentation
- Generate OpenAPI/Swagger documentation
- Document all request/response schemas
- Include example requests and responses
- Document error codes and meanings

#### FR6.3: Component Documentation
- Add JSDoc comments to all components
- Document component props and usage
- Consider adding Storybook for component library
- Create component usage examples

**Acceptance Criteria**:
- Architecture diagram shows complete data flow
- All APIs documented in OpenAPI format
- All components have usage documentation
- New developers can onboard using docs alone

---

## 5. Non-Functional Requirements (NFRs)

### NFR1: Performance
- API response times <200ms (p95)
- List endpoints paginated (default 50 items)
- Database queries use proper indexes
- No N+1 query issues

### NFR2: Security
- Input validation on all API endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention on frontend
- Authorization checks on sensitive operations

### NFR3: Reliability
- 99.9% uptime for contractor APIs
- Graceful error handling (no 500 errors for user input)
- Database transactions for multi-table operations
- Retry logic for transient failures

### NFR4: Maintainability
- Code follows project coding standards
- All functions <50 lines
- All files <300 lines
- Consistent naming conventions
- Comprehensive logging

### NFR5: Scalability
- APIs support filtering and pagination
- Database queries optimized for large datasets
- Frontend supports virtual scrolling for large lists
- Caching strategy for frequently accessed data

---

## 6. Epics & Stories Breakdown

### Epic 1: API Completeness (P0)
**Goal**: Fill all API gaps identified in assessment

**Stories**:
1. **Story 1.1**: Implement team CRUD endpoints (PUT, DELETE, PATCH)
2. **Story 1.2**: Implement document CRUD endpoints (PUT, DELETE, PATCH)
3. **Story 1.3**: Implement RAG score management endpoints
4. **Story 1.4**: Implement onboarding management endpoints
5. **Story 1.5**: Standardize all API responses to use apiResponse helper

**Estimated Effort**: 5 stories × 3-5 hours = 15-25 hours

---

### Epic 2: Quality & Testing (P1)
**Goal**: Achieve 80%+ test coverage across module

**Stories**:
1. **Story 2.1**: Add API route tests for all contractor endpoints
2. **Story 2.2**: Add service layer unit tests
3. **Story 2.3**: Add component tests for critical UI components
4. **Story 2.4**: Add E2E tests for contractor workflows
5. **Story 2.5**: Set up CI/CD test automation

**Estimated Effort**: 5 stories × 4-6 hours = 20-30 hours

---

### Epic 3: Code Quality & Refactoring (P1)
**Goal**: Eliminate technical debt and improve maintainability

**Stories**:
1. **Story 3.1**: Consolidate neonContractorService and contractorCrudService
2. **Story 3.2**: Extract query builder for complex filters
3. **Story 3.3**: Refactor components >300 lines
4. **Story 3.4**: Remove duplicate ContractorDetailSections code
5. **Story 3.5**: Add TypeScript strict mode and fix any issues

**Estimated Effort**: 5 stories × 3-5 hours = 15-25 hours

---

### Epic 4: Documentation (P2)
**Goal**: Comprehensive documentation for developers and users

**Stories**:
1. **Story 4.1**: Create module architecture documentation
2. **Story 4.2**: Generate OpenAPI/Swagger API documentation
3. **Story 4.3**: Add JSDoc comments to all services
4. **Story 4.4**: Add component usage documentation
5. **Story 4.5**: Create developer onboarding guide

**Estimated Effort**: 5 stories × 2-3 hours = 10-15 hours

---

### Epic 5: Performance & Optimization (P2)
**Goal**: Optimize for production scale

**Stories**:
1. **Story 5.1**: Add pagination to list endpoints
2. **Story 5.2**: Optimize database queries and add indexes
3. **Story 5.3**: Implement caching strategy
4. **Story 5.4**: Add virtual scrolling to large lists
5. **Story 5.5**: Performance testing and benchmarking

**Estimated Effort**: 5 stories × 3-4 hours = 15-20 hours

---

## 7. Technical Specifications

### Technology Stack
- **Backend**: Next.js 14+ API Routes (App Router)
- **Database**: Neon PostgreSQL (serverless)
- **Frontend**: React 18, TypeScript, TailwindCSS
- **Testing**: Vitest (unit), Playwright (E2E)
- **Validation**: Zod schemas
- **Logging**: Custom logger (`@/lib/logger`)

### Database Schema
- Uses existing schema: `scripts/migrations/create-contractors-tables.sql`
- No schema changes required for current improvements
- Future enhancements may require additional columns

### API Standards
- RESTful conventions
- Standard response format via `lib/apiResponse.ts`
- Error codes from error code enum
- JWT authentication (when auth is added)

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- File size limit: 300 lines
- Function size limit: 50 lines
- Test coverage: 80%+

---

## 8. Dependencies & Integrations

### Internal Dependencies
- **Projects Module**: Contractors assigned to projects
- **Procurement Module**: Contractors may be suppliers
- **Authentication**: Clerk authentication (planned)
- **File Storage**: Document uploads (current: file paths only)

### External Dependencies
- **Neon Database**: PostgreSQL serverless
- **Vercel**: Deployment platform
- **Email Service**: Document expiry notifications (planned)
- **File Storage**: AWS S3 or Vercel Blob (planned)

---

## 9. Success Metrics & KPIs

### Technical Metrics
- **Test Coverage**: >80% (currently ~20%)
- **API Response Time**: <200ms p95
- **Build Time**: <2 minutes
- **Zero Critical Bugs**: No P0 bugs in production

### User Metrics
- **Time to Create Contractor**: <2 minutes
- **Document Upload Success Rate**: >99%
- **Onboarding Completion Rate**: >90%
- **User Error Rate**: <5%

### Code Quality Metrics
- **Code Duplication**: <5%
- **Average File Size**: <200 lines
- **Cyclomatic Complexity**: <10 per function
- **Technical Debt Ratio**: <5%

---

## 10. Timeline & Phases

### Phase 1: Critical Fixes (Week 1-2)
- Complete API gaps (Epic 1)
- Standardize API responses
- Fix highest priority bugs

### Phase 2: Quality & Testing (Week 3-4)
- Add comprehensive test coverage (Epic 2)
- Set up CI/CD automation
- Fix any issues found during testing

### Phase 3: Refactoring (Week 5-6)
- Service consolidation (Epic 3)
- Component refactoring
- Code cleanup

### Phase 4: Documentation & Polish (Week 7-8)
- Complete documentation (Epic 4)
- Performance optimization (Epic 5)
- Final review and release

**Total Estimated Timeline**: 8 weeks (part-time) or 4 weeks (full-time)

---

## 11. Risks & Mitigations

### Risk 1: Breaking Changes
**Impact**: High | **Probability**: Medium

**Mitigation**:
- Comprehensive test coverage before refactoring
- Feature flags for gradual rollout
- Maintain backward compatibility where possible

### Risk 2: Scope Creep
**Impact**: Medium | **Probability**: High

**Mitigation**:
- Strict adherence to PRD
- Defer new features to future iterations
- Regular stakeholder check-ins

### Risk 3: Integration Issues
**Impact**: Medium | **Probability**: Low

**Mitigation**:
- Integration tests for all module boundaries
- Thorough testing of project/contractor relationships
- Staged deployment

### Risk 4: Test Maintenance Burden
**Impact**: Low | **Probability**: Medium

**Mitigation**:
- Focus on meaningful tests (not 100% coverage)
- Avoid brittle tests (no implementation details)
- Regular test review and cleanup

---

## 12. Out of Scope

The following are explicitly **not included** in this iteration:

- ❌ Authentication/authorization implementation
- ❌ Real-time updates (WebSockets)
- ❌ File upload to cloud storage (S3/Blob)
- ❌ Email notification system
- ❌ Mobile app or responsive redesign
- ❌ Advanced analytics/reporting
- ❌ Contractor self-service portal
- ❌ Integration with external contractor databases
- ❌ Multi-language support
- ❌ Dark mode

These may be considered for future iterations.

---

## 13. Approval & Sign-off

**Prepared By**: Claude Assistant
**Date**: October 24, 2025
**Version**: 1.0 - Draft

**Review Status**: Pending stakeholder review

**Approvals Needed**:
- [ ] Product Owner
- [ ] Technical Lead
- [ ] QA Lead
- [ ] Operations Manager

---

## 14. Appendices

### Appendix A: Related Documents
- [Foundation Assessment](./foundation-assessment.md) - Oct 24, 2025
- [Improvement Backlog](./improvement-backlog.md) - Oct 24, 2025
- [Architecture Documentation](./architecture.md) - To be created
- [Page Logs](../../page-logs/contractors.md) - Historical issues and fixes

### Appendix B: Glossary
- **RAG Score**: Red-Amber-Green performance scoring system
- **Onboarding**: Contractor registration and approval process
- **Compliance**: Meeting regulatory and safety requirements
- **BMad**: Agile AI-driven planning and development methodology
- **P0/P1/P2**: Priority levels (0=Critical, 1=Important, 2=Enhancement)

---

**Document End**
