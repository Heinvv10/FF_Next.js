# FibreFlow Ticketing Module - Phase 1 Core Specification

## Overview

Build a comprehensive ticketing module for FibreFlow to manage fiber network issues, faults, and maintenance requests. This module will replace 6 parallel Excel spreadsheets and integrate with QContact, WhatsApp, and internal systems.

**Module Location:** `src/modules/ticketing/`
**Target:** Phase 1 Core Ticketing (10 weeks scope)
**Database:** Neon PostgreSQL (direct SQL, no ORM)

## Source Documents

- PRD-v4.0-ENTERPRISE.md (Primary specification)
- Maintenance Head Feedback (QA process enhancements - CRITICAL)

---

## Critical Maintenance Requirements

The maintenance head has identified critical gaps in the QA and handover process that MUST be addressed:

### 1. QA Readiness Check (NEW - Pre-QA Validation)

**Problem:** Current 12-step verification assumes "if steps are ticked, quality exists" - this is dangerous.

**Solution:** Before QA can start, system MUST validate:
- All required photos exist (count + type validation)
- DR number, pole, PON, zone are populated on ALL platforms
- ONT serial + RX power level recorded
- If validation fails → ticket remains "Not QA Ready"

**Benefits:**
- Stops QA teams wasting time
- Prevents premature QA rejection loops
- Creates discipline and accountability upstream

### 2. Evidence Quality Validation (NEW)

**Requirements:**
- Photo relevance checking (detect wrong/irrelevant photos)
- Photo sequence validation (correct order of installation steps)
- Photo reuse detection (prevent resubmitting old photos from previous jobs)
- Track rectification cycles (count of fix attempts per ticket)

### 3. QA Risk Acceptance Steps (NEW)

Allow conditional approvals:
- **Approve with conditions** - Pass with documented exceptions
- **Record risk note** - Document the risk being accepted
- **Risk expiry date** - When the condition must be resolved
- **Flag for post-acceptance review** - Schedule follow-up review

### 4. Fault Attribution Categories (NEW)

When logging faults, require classification into:
- **Workmanship** - Contractor quality issue
- **Material failure** - Equipment defect (Homedrop, Fibre, ONT, Gizzu)
- **Client damage** - Customer-caused issue
- **Third-party damage** - External party damage
- **Environmental** - Natural causes (wind, storm, water)
- **Vandalism** - Intentional damage
- **Unknown** - Cannot determine cause

**Benefits:**
- Prevents blanket blame on contractors
- Protects billing accuracy
- Enables trend analysis (e.g., specific DR failing, PONs failing in zone X)

### 5. Maintenance Handover Gate (NEW)

Before ticket can close into Maintenance queue:
- As-built confirmed in system
- Photos archived correctly (to SharePoint/Firebase)
- ONT + PON details verified
- Contractor assigned correctly in system

**Benefits:**
- Maintenance teams rely on this data
- Reduces truck rolls for missing information
- Improves MTTR (Mean Time To Repair)

### 6. Repeat Fault Escalation Logic (NEW)

If more than X faults occur on the same:
- **Pole** - Escalate to infrastructure-level ticket
- **PON** - Escalate to PON investigation ticket
- **Zone** - Trigger zone-wide inspection

**Benefits:**
- Prevents endless patch repairs
- Shifts focus from symptoms to root cause resolution

### 7. Handover Snapshot (NEW - Audit Trail)

System generates a final QA/Maintenance snapshot:
- All evidence links (photos, documents)
- All decisions made (approvals, rejections, conditions)
- Guarantee status
- **LOCKED and IMMUTABLE** after handover

**Explicit Ownership Change:**
- QA → Maintenance (or Build → QA)
- Timestamped
- Fully audited (who, when, what)

---

## Database Schema (8 Core Tables + 4 Maintenance Tables)

### Core Tables from PRD v3.0/v4.0

```sql
-- 1. tickets - Core ticket table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_uid VARCHAR(20) UNIQUE NOT NULL, -- e.g., FT406824

  -- Source tracking
  source VARCHAR(20) NOT NULL, -- 'qcontact', 'weekly_report', 'construction', 'ad_hoc', 'incident', 'revenue', 'ont_swap'
  external_id VARCHAR(100), -- QContact ticket ID, report line ID, etc.

  -- Core fields
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ticket_type VARCHAR(50) NOT NULL, -- 'maintenance', 'new_installation', 'modification', 'ont_swap', 'incident'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent', 'critical'
  status VARCHAR(30) DEFAULT 'open', -- see status enum below

  -- Location
  dr_number VARCHAR(50),
  project_id UUID REFERENCES projects(id),
  zone_id UUID,
  pole_number VARCHAR(50),
  pon_number VARCHAR(50),
  address TEXT,
  gps_coordinates POINT,

  -- Equipment
  ont_serial VARCHAR(100),
  ont_rx_level DECIMAL(5,2), -- Fiber power level in dBm
  ont_model VARCHAR(100),

  -- Assignment
  assigned_to UUID REFERENCES users(id),
  assigned_contractor_id UUID REFERENCES contractors(id),
  assigned_team VARCHAR(100),

  -- Guarantee
  guarantee_status VARCHAR(20), -- 'under_guarantee', 'out_of_guarantee', 'pending_classification'
  guarantee_expires_at TIMESTAMP,
  is_billable BOOLEAN,
  billing_classification VARCHAR(50),

  -- Verification (from maintenance requirements)
  qa_ready BOOLEAN DEFAULT false,
  qa_readiness_check_at TIMESTAMP,
  qa_readiness_failed_reasons JSONB, -- Array of failed checks

  -- Fault Attribution (from maintenance requirements)
  fault_cause VARCHAR(50), -- 'workmanship', 'material_failure', 'client_damage', 'third_party', 'environmental', 'vandalism', 'unknown'
  fault_cause_details TEXT,

  -- Rectification tracking
  rectification_count INTEGER DEFAULT 0, -- Number of fix attempts

  -- SLA
  sla_due_at TIMESTAMP,
  sla_first_response_at TIMESTAMP,
  sla_breached BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  closed_by UUID REFERENCES users(id),

  CHECK (source IN ('qcontact', 'weekly_report', 'construction', 'ad_hoc', 'incident', 'revenue', 'ont_swap')),
  CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'critical')),
  CHECK (fault_cause IN ('workmanship', 'material_failure', 'client_damage', 'third_party', 'environmental', 'vandalism', 'unknown', NULL))
);

CREATE INDEX idx_tickets_dr ON tickets(dr_number);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_project ON tickets(project_id);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_tickets_contractor ON tickets(assigned_contractor_id);
CREATE INDEX idx_tickets_sla ON tickets(sla_due_at) WHERE NOT sla_breached;

-- 2. verification_steps - 12-step verification tracking
CREATE TABLE verification_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL, -- 1-12
  step_name VARCHAR(100) NOT NULL,
  step_description TEXT,

  -- Completion
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES users(id),

  -- Evidence
  photo_required BOOLEAN DEFAULT false,
  photo_url TEXT,
  photo_verified BOOLEAN DEFAULT false, -- Photo passed quality check
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(ticket_id, step_number)
);

CREATE INDEX idx_verification_ticket ON verification_steps(ticket_id);

-- 3. weekly_reports - Import batch tracking
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_uid VARCHAR(20) UNIQUE NOT NULL, -- e.g., WR2024-W51

  -- Import details
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  report_date DATE NOT NULL,

  -- Source file
  original_filename VARCHAR(255),
  file_path TEXT,

  -- Import stats
  total_rows INTEGER,
  imported_count INTEGER,
  skipped_count INTEGER,
  error_count INTEGER,
  errors JSONB, -- Array of error details

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'

  imported_at TIMESTAMP,
  imported_by UUID REFERENCES users(id),

  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. qcontact_sync_log - Bidirectional sync audit
CREATE TABLE qcontact_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  qcontact_ticket_id VARCHAR(100),

  -- Sync details
  sync_direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'
  sync_type VARCHAR(30) NOT NULL, -- 'create', 'status_update', 'assignment', 'note_add', 'full_sync'

  -- Payload
  request_payload JSONB,
  response_payload JSONB,

  -- Result
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
  error_message TEXT,

  synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qcontact_sync_ticket ON qcontact_sync_log(ticket_id);

-- 5. guarantee_periods - Guarantee configuration by project
CREATE TABLE guarantee_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),

  -- Guarantee rules
  installation_guarantee_days INTEGER DEFAULT 90,
  material_guarantee_days INTEGER DEFAULT 365,

  -- Billing rules
  contractor_liable_during_guarantee BOOLEAN DEFAULT true,
  auto_classify_out_of_guarantee BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(project_id)
);

-- 6. whatsapp_notifications - Notification delivery tracking
CREATE TABLE whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),

  -- Recipient
  recipient_type VARCHAR(20) NOT NULL, -- 'contractor', 'technician', 'client', 'team'
  recipient_phone VARCHAR(20),
  recipient_name VARCHAR(255),

  -- Message
  message_template VARCHAR(100),
  message_content TEXT,

  -- Delivery
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  waha_message_id VARCHAR(100),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_ticket ON whatsapp_notifications(ticket_id);

-- 7. ticket_attachments - File metadata
CREATE TABLE ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  -- File info
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50), -- 'photo', 'document', 'excel', 'pdf'
  mime_type VARCHAR(100),
  file_size INTEGER,

  -- Storage
  storage_path TEXT NOT NULL, -- Firebase Storage path
  storage_url TEXT, -- Public URL

  -- Metadata
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),

  -- For photo evidence
  verification_step_id UUID REFERENCES verification_steps(id),
  is_evidence BOOLEAN DEFAULT false
);

CREATE INDEX idx_attachments_ticket ON ticket_attachments(ticket_id);

-- 8. ticket_notes - Internal/client notes
CREATE TABLE ticket_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  -- Note content
  note_type VARCHAR(20) DEFAULT 'internal', -- 'internal', 'client', 'system'
  content TEXT NOT NULL,

  -- Author
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),

  -- For system-generated notes
  system_event VARCHAR(50), -- 'status_change', 'assignment', 'sla_warning', etc.
  event_data JSONB
);

CREATE INDEX idx_notes_ticket ON ticket_notes(ticket_id);
```

### Maintenance Enhancement Tables (NEW)

```sql
-- 9. qa_readiness_checks - Pre-QA validation log
CREATE TABLE qa_readiness_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  -- Check results
  passed BOOLEAN NOT NULL,
  checked_at TIMESTAMP DEFAULT NOW(),
  checked_by UUID REFERENCES users(id), -- NULL for system checks

  -- Individual check results
  photos_exist BOOLEAN,
  photos_count INTEGER,
  photos_required_count INTEGER,
  dr_populated BOOLEAN,
  pole_populated BOOLEAN,
  pon_populated BOOLEAN,
  zone_populated BOOLEAN,
  ont_serial_recorded BOOLEAN,
  ont_rx_recorded BOOLEAN,
  platforms_aligned BOOLEAN, -- SP, SOW, tracker all match

  -- Failure details
  failed_checks JSONB, -- Array of failed check names with reasons

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qa_readiness_ticket ON qa_readiness_checks(ticket_id);

-- 10. qa_risk_acceptances - Conditional approval tracking
CREATE TABLE qa_risk_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  -- Risk details
  risk_type VARCHAR(50) NOT NULL, -- 'minor_defect', 'documentation_gap', 'pending_material', etc.
  risk_description TEXT NOT NULL,
  conditions TEXT, -- What must be resolved

  -- Expiry
  risk_expiry_date DATE, -- When condition must be resolved
  requires_followup BOOLEAN DEFAULT true,
  followup_date DATE,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'expired', 'escalated'
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,

  -- Approval
  accepted_by UUID NOT NULL REFERENCES users(id),
  accepted_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_risk_acceptance_ticket ON qa_risk_acceptances(ticket_id);
CREATE INDEX idx_risk_acceptance_expiry ON qa_risk_acceptances(risk_expiry_date) WHERE status = 'active';

-- 11. handover_snapshots - Immutable audit trail
CREATE TABLE handover_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

  -- Handover type
  handover_type VARCHAR(30) NOT NULL, -- 'build_to_qa', 'qa_to_maintenance', 'maintenance_complete'

  -- Snapshot data (immutable record of state at handover)
  snapshot_data JSONB NOT NULL, -- Full ticket state at handover
  evidence_links JSONB, -- All photo/document URLs
  decisions JSONB, -- All approval/rejection records
  guarantee_status VARCHAR(20),

  -- Ownership change
  from_owner_type VARCHAR(20), -- 'build', 'qa', 'maintenance'
  from_owner_id UUID,
  to_owner_type VARCHAR(20),
  to_owner_id UUID,

  -- Audit
  handover_at TIMESTAMP DEFAULT NOW(),
  handover_by UUID NOT NULL REFERENCES users(id),

  -- Lock status
  is_locked BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_handover_ticket ON handover_snapshots(ticket_id);

-- 12. repeat_fault_escalations - Infrastructure-level escalation
CREATE TABLE repeat_fault_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Escalation scope
  scope_type VARCHAR(20) NOT NULL, -- 'pole', 'pon', 'zone', 'dr'
  scope_value VARCHAR(100) NOT NULL, -- The pole number, PON, zone ID, or DR
  project_id UUID REFERENCES projects(id),

  -- Trigger info
  fault_count INTEGER NOT NULL, -- Number of faults that triggered escalation
  fault_threshold INTEGER NOT NULL, -- Threshold that was exceeded
  contributing_tickets JSONB, -- Array of ticket IDs that contributed

  -- Escalation
  escalation_ticket_id UUID REFERENCES tickets(id), -- The infrastructure ticket created
  escalation_type VARCHAR(30), -- 'investigation', 'inspection', 'replacement'

  -- Status
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'no_action'
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_escalation_scope ON repeat_fault_escalations(scope_type, scope_value);
```

---

## API Endpoints

### Ticket CRUD

```
GET    /api/ticketing/tickets              # List tickets with filters
POST   /api/ticketing/tickets              # Create ticket
GET    /api/ticketing/tickets/{id}         # Get ticket detail
PUT    /api/ticketing/tickets/{id}         # Update ticket
DELETE /api/ticketing/tickets/{id}         # Delete ticket (soft delete)
```

### DR Number Lookup

```
GET    /api/ticketing/dr-lookup/{drNumber} # Lookup DR from SOW module
```

### Verification Workflow

```
GET    /api/ticketing/tickets/{id}/verification    # Get verification steps
PUT    /api/ticketing/tickets/{id}/verification/{step} # Update step
POST   /api/ticketing/tickets/{id}/verification/complete # Complete all steps
```

### QA Readiness (NEW)

```
POST   /api/ticketing/tickets/{id}/qa-readiness-check  # Run readiness check
GET    /api/ticketing/tickets/{id}/qa-readiness        # Get readiness status
```

### QA Risk Acceptance (NEW)

```
POST   /api/ticketing/tickets/{id}/risk-acceptance     # Create risk acceptance
GET    /api/ticketing/tickets/{id}/risk-acceptances    # List risk acceptances
PUT    /api/ticketing/risk-acceptances/{id}/resolve    # Resolve risk
```

### Handover (NEW)

```
POST   /api/ticketing/tickets/{id}/handover            # Create handover snapshot
GET    /api/ticketing/tickets/{id}/handover-history    # Get handover history
```

### Fault Escalation (NEW)

```
GET    /api/ticketing/escalations                      # List escalations
GET    /api/ticketing/escalations/{id}                 # Get escalation detail
POST   /api/ticketing/escalations/{id}/resolve         # Resolve escalation
GET    /api/ticketing/repeat-faults/check              # Check for repeat fault patterns
```

### Weekly Import

```
POST   /api/ticketing/import/weekly         # Upload weekly report Excel
GET    /api/ticketing/import/weekly/{id}    # Get import status
GET    /api/ticketing/import/weekly/history # Import history
```

### QContact Sync

```
POST   /api/ticketing/sync/qcontact         # Trigger full sync
GET    /api/ticketing/sync/qcontact/status  # Sync status
GET    /api/ticketing/sync/qcontact/log     # Sync audit log
```

### WhatsApp Notifications

```
POST   /api/ticketing/notifications/whatsapp # Send notification
GET    /api/ticketing/notifications/status   # Delivery status
```

### Dashboard

```
GET    /api/ticketing/dashboard/summary     # Dashboard summary stats
GET    /api/ticketing/dashboard/sla         # SLA compliance stats
GET    /api/ticketing/dashboard/workload    # Workload by assignee
```

---

## Module Structure

```
src/modules/ticketing/
├── types/
│   ├── ticket.ts           # Ticket, TicketStatus, TicketType, FaultCause
│   ├── verification.ts     # VerificationStep, QAReadinessCheck
│   ├── guarantee.ts        # GuaranteePeriod, GuaranteeStatus
│   ├── whatsapp.ts         # WhatsAppNotification
│   ├── qcontact.ts         # QContactSync, QContactTicket
│   ├── weeklyReport.ts     # WeeklyReport, ImportRow
│   ├── riskAcceptance.ts   # RiskAcceptance, RiskType (NEW)
│   ├── handover.ts         # HandoverSnapshot, HandoverType (NEW)
│   └── escalation.ts       # RepeatFaultEscalation (NEW)
├── services/
│   ├── ticketService.ts    # CRUD operations
│   ├── drLookupService.ts  # DR number lookup from SOW
│   ├── verificationService.ts # 12-step workflow
│   ├── guaranteeService.ts # Guarantee classification
│   ├── qcontactService.ts  # QContact API integration
│   ├── whatsappService.ts  # WAHA API integration
│   ├── weeklyReportService.ts # Excel parsing & import
│   ├── qaReadinessService.ts  # Pre-QA validation (NEW)
│   ├── riskAcceptanceService.ts # Conditional approval (NEW)
│   ├── handoverService.ts  # Snapshot & ownership transfer (NEW)
│   └── escalationService.ts # Repeat fault detection (NEW)
├── components/
│   ├── TicketList/
│   │   ├── TicketList.tsx
│   │   ├── TicketListItem.tsx
│   │   ├── TicketFilters.tsx
│   │   └── TicketStatusBadge.tsx
│   ├── TicketDetail/
│   │   ├── TicketDetail.tsx
│   │   ├── TicketHeader.tsx
│   │   ├── TicketTimeline.tsx
│   │   └── TicketActions.tsx
│   ├── Verification/
│   │   ├── VerificationChecklist.tsx
│   │   ├── VerificationStep.tsx
│   │   └── PhotoUpload.tsx
│   ├── QAReadiness/           # NEW
│   │   ├── QAReadinessCheck.tsx
│   │   ├── ReadinessResults.tsx
│   │   └── ReadinessBlocker.tsx
│   ├── RiskAcceptance/        # NEW
│   │   ├── RiskAcceptanceForm.tsx
│   │   ├── RiskAcceptanceList.tsx
│   │   └── RiskExpiryWarning.tsx
│   ├── FaultAttribution/      # NEW
│   │   ├── FaultCauseSelector.tsx
│   │   └── FaultTrendAnalysis.tsx
│   ├── Handover/              # NEW
│   │   ├── HandoverWizard.tsx
│   │   ├── HandoverSnapshot.tsx
│   │   └── HandoverHistory.tsx
│   ├── Escalation/            # NEW
│   │   ├── EscalationAlert.tsx
│   │   ├── EscalationList.tsx
│   │   └── RepeatFaultMap.tsx
│   ├── WeeklyImport/
│   │   ├── WeeklyImportWizard.tsx
│   │   ├── ImportPreview.tsx
│   │   └── ImportResults.tsx
│   ├── Dashboard/
│   │   ├── TicketingDashboard.tsx
│   │   ├── SLAComplianceCard.tsx
│   │   ├── WorkloadChart.tsx
│   │   └── RecentTickets.tsx
│   └── common/
│       ├── DRLookup.tsx
│       ├── GuaranteeIndicator.tsx
│       └── SLACountdown.tsx
├── hooks/
│   ├── useTickets.ts
│   ├── useTicket.ts
│   ├── useVerification.ts
│   ├── useGuarantee.ts
│   ├── useQAReadiness.ts      # NEW
│   ├── useRiskAcceptance.ts   # NEW
│   ├── useHandover.ts         # NEW
│   ├── useEscalation.ts       # NEW
│   └── useDashboard.ts
├── utils/
│   ├── drLookup.ts
│   ├── guaranteeCalculator.ts
│   ├── excelParser.ts
│   ├── slaCalculator.ts
│   ├── qaReadinessValidator.ts # NEW
│   ├── faultPatternDetector.ts # NEW
│   └── snapshotGenerator.ts    # NEW
├── constants/
│   ├── ticketStatus.ts
│   ├── verificationSteps.ts   # 12 standard steps
│   ├── faultCauses.ts         # 7 fault categories (NEW)
│   └── readinessChecks.ts     # QA readiness requirements (NEW)
├── client.ts                  # Client-safe exports
├── index.ts                   # Server exports
└── README.md
```

---

## UI Pages

### Core Pages

1. **Dashboard** - `/ticketing`
   - Summary statistics
   - SLA compliance gauges
   - Workload distribution
   - Recent tickets
   - Escalation alerts (NEW)

2. **Ticket List** - `/ticketing/tickets`
   - Filterable list (status, type, assignee, project, date range)
   - QA Ready indicator (NEW)
   - Fault cause column (NEW)
   - Bulk actions

3. **Ticket Detail** - `/ticketing/tickets/[id]`
   - Full ticket information
   - Verification checklist
   - QA Readiness panel (NEW)
   - Risk acceptance section (NEW)
   - Fault attribution selector (NEW)
   - Handover history (NEW)
   - Timeline/activity log
   - Attachments
   - Notes

4. **Weekly Import** - `/ticketing/import`
   - Excel upload wizard
   - Preview & validation
   - Import results

5. **QContact Sync** - `/ticketing/sync`
   - Sync status dashboard
   - Manual sync trigger
   - Sync history log

### New Maintenance Pages

6. **Handover Center** - `/ticketing/handover` (NEW)
   - Tickets pending handover
   - Handover wizard
   - Handover history

7. **Escalation Management** - `/ticketing/escalations` (NEW)
   - Active escalations
   - Repeat fault patterns
   - Infrastructure tickets

8. **Risk Acceptance Review** - `/ticketing/risks` (NEW)
   - Active risk acceptances
   - Expiring risks
   - Resolution tracking

---

## Acceptance Criteria

### Ticket Management
- [ ] Create tickets from multiple sources (manual, import, QContact)
- [ ] Assign tickets to technicians/contractors
- [ ] Track ticket status through workflow
- [ ] Link tickets to DR numbers from SOW module
- [ ] Classify guarantee status automatically

### Verification Workflow
- [ ] 12-step verification checklist per ticket
- [ ] Photo upload per verification step
- [ ] Progress tracking (7/12 format)
- [ ] QA approval workflow

### QA Readiness (NEW - CRITICAL)
- [ ] Pre-QA validation before QA can start
- [ ] Block QA if required evidence missing
- [ ] Show clear "Not QA Ready" status
- [ ] List specific failed checks

### Fault Attribution (NEW)
- [ ] Require fault cause on maintenance tickets
- [ ] 7 category selector
- [ ] Trend analysis by cause/location
- [ ] Prevent blanket contractor blame

### Risk Acceptance (NEW)
- [ ] Approve with conditions
- [ ] Record risk notes with expiry
- [ ] Track resolution
- [ ] Expiry warnings

### Handover (NEW)
- [ ] Validate maintenance handover gate
- [ ] Generate immutable snapshot
- [ ] Lock snapshot after creation
- [ ] Track ownership changes

### Repeat Fault Escalation (NEW)
- [ ] Detect repeat faults on pole/PON/zone
- [ ] Auto-create infrastructure tickets
- [ ] Track escalation resolution

### Weekly Import
- [ ] Parse Excel files (93+ items)
- [ ] Preview before import
- [ ] Handle duplicates gracefully
- [ ] Complete in <15 minutes

### QContact Integration
- [ ] Bidirectional sync
- [ ] Status updates propagate both ways
- [ ] 100% sync success rate target

### WhatsApp Notifications
- [ ] Auto-notify on assignment
- [ ] Auto-notify on QA rejection
- [ ] Track delivery status
- [ ] 100% compliance target

### Dashboard
- [ ] Unified view of all work items
- [ ] SLA compliance metrics
- [ ] Workload by assignee
- [ ] Escalation alerts (NEW)

---

## Priority Order

1. **Foundation** (Week 1-2)
   - Database schema deployment
   - Basic ticket CRUD APIs
   - DR number lookup service
   - Module structure setup

2. **Verification & QA Readiness** (Week 3-4)
   - 12-step verification workflow
   - QA readiness check system (NEW)
   - Photo upload integration
   - Risk acceptance workflow (NEW)

3. **Fault Attribution & Handover** (Week 5-6)
   - Fault cause classification (NEW)
   - Handover snapshot system (NEW)
   - Repeat fault detection (NEW)
   - Escalation management (NEW)

4. **QContact Integration** (Week 7-8)
   - QContact API client
   - Bidirectional sync
   - Sync monitoring

5. **Weekly Import & WhatsApp** (Week 9-10)
   - Excel parser
   - Import wizard
   - WhatsApp notification service
   - Dashboard deployment

---

## Development Methodology: TDD/BMAD (MANDATORY)

**This project MUST follow Test-Driven Development (TDD) methodology.**

### TDD Rules - STRICTLY ENFORCED

1. **Tests FIRST, Code SECOND** - For every feature/function:
   - Write failing tests first
   - Implement code to make tests pass
   - Refactor if needed
   - Never write implementation code without tests

2. **Test File Structure**
   ```
   src/modules/ticketing/
   ├── __tests__/                    # All tests in dedicated folder
   │   ├── services/
   │   │   ├── ticketService.test.ts
   │   │   ├── qaReadinessService.test.ts
   │   │   ├── verificationService.test.ts
   │   │   ├── guaranteeService.test.ts
   │   │   ├── handoverService.test.ts
   │   │   ├── escalationService.test.ts
   │   │   └── ...
   │   ├── utils/
   │   │   ├── guaranteeCalculator.test.ts
   │   │   ├── qaReadinessValidator.test.ts
   │   │   ├── faultPatternDetector.test.ts
   │   │   └── ...
   │   ├── api/
   │   │   ├── tickets.test.ts
   │   │   ├── verification.test.ts
   │   │   ├── qa-readiness.test.ts
   │   │   └── ...
   │   └── components/
   │       ├── TicketList.test.tsx
   │       ├── VerificationChecklist.test.tsx
   │       └── ...
   ```

3. **Test Coverage Requirements**
   - Services: 90%+ coverage
   - Utils: 95%+ coverage
   - API endpoints: 85%+ coverage
   - Components: 70%+ coverage (critical user flows)

4. **Test Types Required**

   **Unit Tests** (for services, utils, pure functions):
   ```typescript
   // Example: qaReadinessService.test.ts
   describe('QAReadinessService', () => {
     describe('checkReadiness', () => {
       it('should fail when photos are missing', async () => {
         // Arrange
         const ticket = createMockTicket({ photoCount: 0 });

         // Act
         const result = await qaReadinessService.checkReadiness(ticket.id);

         // Assert
         expect(result.passed).toBe(false);
         expect(result.failedChecks).toContain('photos_exist');
       });

       it('should fail when ONT serial is missing', async () => {
         // Test implementation...
       });

       it('should pass when all requirements met', async () => {
         // Test implementation...
       });
     });
   });
   ```

   **Integration Tests** (for API endpoints):
   ```typescript
   // Example: tickets.test.ts
   describe('POST /api/ticketing/tickets', () => {
     it('should create ticket with valid data', async () => {
       const response = await request(app)
         .post('/api/ticketing/tickets')
         .send(validTicketData);

       expect(response.status).toBe(201);
       expect(response.body.data.ticket_uid).toBeDefined();
     });

     it('should reject ticket without required fields', async () => {
       // Test implementation...
     });
   });
   ```

   **Component Tests** (for React components):
   ```typescript
   // Example: VerificationChecklist.test.tsx
   describe('VerificationChecklist', () => {
     it('should display 12 verification steps', () => {
       render(<VerificationChecklist ticketId={mockTicketId} />);
       expect(screen.getAllByRole('listitem')).toHaveLength(12);
     });

     it('should mark step as complete when checkbox clicked', async () => {
       // Test implementation...
     });
   });
   ```

5. **TDD Workflow Per Subtask**

   For each subtask in the implementation plan:

   **Step 1: Write Test File First**
   - Create test file with all expected behaviors
   - All tests should FAIL initially (red phase)

   **Step 2: Implement Minimum Code**
   - Write only enough code to pass tests
   - Run tests to verify (green phase)

   **Step 3: Refactor**
   - Clean up code while keeping tests passing
   - Add edge case tests if discovered

   **Step 4: Verify Coverage**
   - Run coverage report
   - Add tests if below threshold

6. **Testing Framework & Tools**
   - **Test Runner**: Vitest (already configured in project)
   - **API Testing**: supertest
   - **Component Testing**: @testing-library/react
   - **Mocking**: vitest mocks, msw for API mocking
   - **Coverage**: vitest --coverage

7. **Before Marking Subtask Complete**
   - [ ] All tests written for the feature
   - [ ] All tests passing
   - [ ] Coverage meets threshold
   - [ ] No skipped tests without documented reason

### Phase Implementation Order with TDD

Each phase must complete in this order:

**Phase 1: Foundation with Tests**
1. Write migration tests (validate schema structure)
2. Create database migrations
3. Write ticketService.test.ts (all CRUD operations)
4. Implement ticketService.ts
5. Write API endpoint tests
6. Implement API endpoints

**Phase 2: Verification & QA Readiness with Tests**
1. Write qaReadinessValidator.test.ts
2. Implement qaReadinessValidator.ts
3. Write qaReadinessService.test.ts
4. Implement qaReadinessService.ts
5. Write verificationService.test.ts
6. Implement verificationService.ts
7. Write component tests
8. Implement components

**Phase 3: Fault Attribution & Handover with Tests**
1. Write faultPatternDetector.test.ts
2. Implement faultPatternDetector.ts
3. Write handoverService.test.ts
4. Implement handoverService.ts
5. Write escalationService.test.ts
6. Implement escalationService.ts
7. Write API and component tests
8. Implement APIs and components

**Phase 4 & 5: Continue TDD pattern...**

---

## Technical Notes

- Use direct SQL with Neon serverless client (no ORM)
- Follow FibreFlow module architecture patterns
- Use Firebase Storage for attachments
- Integrate with existing Clerk auth
- Follow API response standards from lib/apiResponse.ts
- Use AppLayout for all pages
- **ALL code must have tests written BEFORE implementation**
