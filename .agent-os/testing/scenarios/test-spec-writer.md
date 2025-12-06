# Test Scenario: Spec Writer Agent

## Test Objective
Validate that the spec-writer agent can create a comprehensive, implementable specification following FibreFlow standards.

## Test Scenario
**Feature**: Simple notification system for contractor status updates

**User Requirement**:
"We need a way to notify admins when a contractor's status changes from Active to Inactive or vice versa. The notification should include the contractor name, old status, new status, and timestamp. Admins should be able to view recent notifications in a dashboard."

## Expected Deliverables

### 1. Specification Document
The agent should produce a spec.md that includes:

- [ ] **Overview section** - Purpose and scope
- [ ] **Business requirements** - User stories, success criteria
- [ ] **Technical scope** - In scope vs. out of scope
- [ ] **Database schema** - Exact table structure with types
  - Table: `contractor_status_notifications`
  - Columns: id, contractor_id, contractor_name, old_status, new_status, timestamp, read_by, etc.
- [ ] **API endpoints** - At least 2 endpoints
  - GET /api/contractor-notifications (list)
  - POST /api/contractor-notifications-mark-read (mark as read)
- [ ] **Request/response formats** - Using apiResponse helper
- [ ] **UI components** - NotificationsDashboard, NotificationCard
- [ ] **Error handling** - Edge cases covered
- [ ] **Testing requirements** - Unit, integration, manual tests

### 2. Alignment with FibreFlow Standards
The spec should demonstrate:

- [ ] **Modular architecture** - References creating module in src/modules/notifications/
- [ ] **Flattened API routes** - Uses /api/contractor-notifications pattern (NOT nested)
- [ ] **Direct SQL** - No ORM, uses Neon serverless client
- [ ] **API standardization** - Uses apiResponse helper from lib/apiResponse.ts
- [ ] **File size awareness** - Mentions keeping components <200 lines
- [ ] **Database-first** - Defines schema before implementation
- [ ] **Deployment workflow** - Mentions testing on dev.fibreflow.app first

### 3. Quality Indicators
- [ ] Spec is detailed enough to implement without major decisions
- [ ] All database columns have exact types (UUID, VARCHAR, TIMESTAMP, etc.)
- [ ] Error cases are considered (empty states, API failures, validation)
- [ ] Success criteria are measurable
- [ ] No conflicts with existing FibreFlow patterns

## Test Constraints
- **DO NOT implement** - Spec writing only
- **DO NOT create actual database tables** - Schema definition only
- **DO NOT create API files** - Specification only
- **Output location**: .agent-os/testing/sandbox/notification-spec.md

## Evaluation Criteria

| Criterion | Weight | Pass/Fail |
|-----------|--------|-----------|
| Completeness (all sections) | 25% | |
| FibreFlow alignment | 25% | |
| Database schema detail | 20% | |
| API specifications | 15% | |
| Error handling coverage | 15% | |

**Pass threshold**: 80% overall score
