# Velocity Fibre DROPS Quality Control Implementation Plan

## Module
**drops-quality-control**

## Overview
Implementation plan for Velocity Fibre DROPS Quality Control System with 14-step Home Install Capture Checklist.

## Project Details
- **Specification**: Velocity Fibre DROPS Quality Control System
- **Module**: drops-quality-control
- **Lead Developer**: Development Team
- **Estimated Hours**: 40h
- **Phases**: 4
- **Created**: 2025-09-23
- **Completed**: 2025-09-23
- **Status**: Completed

## Implementation Phases

### Phase 1: Database Schema & Setup (12h) ✅ **COMPLETED**
- **Timeline**: Day 1-2
- **Hours**: 12h
- **Requirements**: Database schema for 14-step checklist, types, basic setup
- **Deliverables**:
  - [x] Create database migration with 14-step checklist structure
  - [x] Set up TypeScript types for drops and checklist items
  - [x] Create basic module structure
  - [x] Set up environment variables
  - [x] Install required dependencies (twilio, pusher-js)
  - [x] Design checklist validation logic
- **Dependencies**: None

### Phase 2: API Routes & Services (10h)
- **Timeline**: Day 2-3
- **Hours**: 10h
- **Requirements**: CRUD operations, checklist validation, notification services
- **Deliverables**:
  - [ ] Create drops API routes (/api/drops)
  - [ ] Create reviews API routes (/api/reviews)
  - [ ] Create checklist API routes (/api/checklist)
  - [ ] Create contractors API routes (/api/contractors)
  - [ ] Implement 14-step checklist validation service
  - [ ] Implement notification service (WhatsApp + Pusher)
  - [ ] Add error handling and validation
  - [ ] Write API tests
- **Dependencies**: Phase 1 completion

### Phase 3: Agent Dashboard (10h)
- **Timeline**: Day 3-4
- **Hours**: 10h
- **Requirements**: Full CRUD interface with 14-step checklist validation
- **Deliverables**:
  - [ ] Create agent dashboard page (/dashboard/drops-reviews)
  - [ ] Build DropsTable component with filtering
  - [ ] Create ChecklistReviewModal for 14-step validation
  - [ ] Implement real-time updates with Pusher
  - [ ] Add toast notifications
  - [ ] Style with Tailwind CSS
  - [ ] Implement checklist compliance scoring
- **Dependencies**: Phase 2 completion

### Phase 4: Contractor Portal & Testing (8h)
- **Timeline**: Day 4-5
- **Hours**: 8h
- **Requirements**: Contractor view, integration testing
- **Deliverables**:
  - [ ] Create contractor drop view page (/contractor/drops/[dropId])
  - [ ] Build DropsDetail component with checklist feedback
  - [ ] Implement WhatsApp notification logic
  - [ ] Implement browser notification logic
  - [ ] End-to-end testing
  - [ ] Documentation and page logs
  - [ ] Quality control metrics dashboard
- **Dependencies**: Phase 3 completion

## Resource Allocation
- **Development**: 32h (80%)
- **Testing**: 6h (15%)
- **Documentation**: 2h (5%)

## Risk Assessment

### Technical Risk: High
- **Complexity**: 14-step checklist validation, multiple integrations
- **Mitigation**: Break checklist into manageable phases, test each step separately

### Timeline Risk: Medium
- **Complexity**: Comprehensive validation system
- **Mitigation**: Clear phases, modular approach, prioritize core functionality

### Resource Risk: Low
- **Complexity**: Single developer can handle with proper planning
- **Mitigation**: Focused implementation, prioritize essential features

## Success Criteria
- [ ] All 14 checklist steps implemented and validated
- [ ] All tests passing (unit, integration, e2e)
- [ ] Documentation updated in page logs
- [ ] Code review completed
- [ ] WhatsApp notifications working for missing checklist items
- [ ] Browser notifications working for online contractors
- [ ] Real-time updates functional
- [ ] Quality control metrics tracking implemented

## Milestone Dates
- **Project Start**: 2025-09-23
- **Phase 1 Complete**: 2025-09-24 (End of Day 2)
- **Phase 2 Complete**: 2025-09-25 (End of Day 3)
- **Phase 3 Complete**: 2025-09-26 (End of Day 4)
- **Phase 4 Complete**: 2025-09-27 (End of Day 5)
- **Project Complete**: 2025-09-27

## Technology Stack
- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Neon PostgreSQL
- **Notifications**: Twilio (WhatsApp), Pusher (Browser)
- **Authentication**: Clerk (bypassed in dev)
- **Testing**: Vitest, Playwright

## Key Files to Create
- `scripts/migrations/20250923_drops_quality_control.sql`
- `src/modules/drops-quality-control/types/`
- `src/modules/drops-quality-control/services/`
- `src/modules/drops-quality-control/components/`
- `app/dashboard/drops-reviews/page.tsx`
- `app/contractor/drops/[dropId]/page.tsx`
- `app/api/drops/`
- `app/api/reviews/`
- `app/api/checklist/`

## 14-Step Checklist Implementation

### Phase A – Pre-Install Context (Steps 1-5)
- Property frontage validation
- Location on wall verification
- Outside cable span documentation
- Home entry point validation (outside + inside)

### Phase B – Installation Execution (Steps 6-8)
- Fibre entry to ONT verification
- Patched & labelled drop validation
- Work area completion verification

### Phase C – Assets & IDs (Steps 9-10)
- ONT barcode scan validation
- Mini-UPS serial number validation

### Phase D – Verification (Steps 11-13)
- Powermeter reading validation (with acceptable range check)
- ONT powermeter validation
- Active broadband light verification

### Phase E – Customer Acceptance (Step 14)
- Customer signature validation

## Integration Points
- **Clerk Authentication**: Role-based access control
- **Twilio API**: WhatsApp message sending for missing checklist items
- **Pusher**: Real-time browser notifications
- **Existing Components**: Reuse Table, Modal, Button components
- **Existing Utils**: Error handling, toast notifications

## Quality Control Metrics
- Checklist completion rates by contractor
- Common missing items analysis
- Time to rectification tracking
- Contractor performance scoring

---
**Created**: 2025-09-23 | **Lead**: Development Team | **Hours**: 40h