# Product Requirements Document: FibreFlow Ticketing Module

**Document Version:** 2.0 (Comprehensive)
**Created:** December 18, 2025
**Last Updated:** December 18, 2025
**Status:** Planning Complete - Ready for Implementation
**Author:** Planning Session
**Module Name:** `src/modules/ticketing/`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [User Personas](#4-user-personas)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Data Model](#8-data-model)
9. [API Specification](#9-api-specification)
10. [UI/UX Requirements](#10-uiux-requirements)
11. [Integration Points](#11-integration-points)
12. [Module Architecture](#12-module-architecture)
13. [Security & Permissions](#13-security--permissions)
14. [Implementation Phases](#14-implementation-phases)
15. [Success Metrics](#15-success-metrics)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Appendices](#17-appendices)

---

## 1. Executive Summary

### 1.1 Purpose
Build a comprehensive ticketing system as an isolated module within FibreFlow to manage fiber network issues, faults, and maintenance requests across **7 independent ticket sources** with unified aggregation, bidirectional WhatsApp communication, and QContact integration.

### 1.2 Scope
- **In Scope:**
  - Multi-source ticket aggregation (7 sources including QContact)
  - Bidirectional WhatsApp chat bridge for field communication
  - QContact API integration (READ and UPDATE)
  - Email parsing integration (tickets@fibreflow.app)
  - Ticket creation, assignment, tracking, SLA management
  - Notifications, reporting, analytics
  - **Billing type classification** (guarantee, SLA, billable)
  - **Billable ticket approval workflow**
  - **Invoicing system integration** (auto-generate line items)
- **Out of Scope:**
  - CREATE tickets in QContact (one-way import only)
  - Customer self-service portal (phase 2)
  - Inventory management (separate module)

### 1.3 Key Benefits
- **Unified Dashboard**: Single source of truth for tickets from 7 different sources
- **Smart Aggregation**: Immutable UIDs with mutable categories for flexible organization
- **Real-time Communication**: WhatsApp chat bridge with full ticket context
- **External Integration**: Bidirectional sync with QContact (Fibertime maintenance system)
- **Automated Workflows**: SLA tracking, email parsing, WhatsApp integration
- **Rich Context**: Auto-linking to drops, poles, projects, previous conversations
- **Reduced Manual Entry**: DR number lookups, API imports, email parsing

---

## 1.4 Multi-Source Ticket Architecture

### Seven Independent Ticket Sources

```
┌─────────────────────────────────────────────────────────────────┐
│                   FibreFlow Ticketing Dashboard                  │
│              (Unified view of all ticket sources)                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   QContact      │ │  WhatsApp       │ │    Email        │
│  (External)     │ │  (Inbound)      │ │   (Inbound)     │
│                 │ │                 │ │                 │
│ FT{number}      │ │ DR{num}-{seq}   │ │ EML-{num}       │
│ READ + UPDATE   │ │ Real-time       │ │ Parse inbox     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Construction   │ │  FibreFlow      │ │  WhatsApp       │
│   (Internal)    │ │   Internal      │ │   Outbound      │
│                 │ │   (Manual)      │ │  (Bridge)       │
│ DR{num}-{seq}   │ │ FF-{number}     │ │ Chat interface  │
│ From SOW drops  │ │ Staff created   │ │ Send messages   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                            ▼
               ┌─────────────────┐
               │  Ad-hoc Tasks   │
               │   (Internal)    │
               │                 │
               │  AH-{number}    │
               │  Quick tasks    │
               └─────────────────┘
```

### Ticket Source Definitions

| Source | UID Format | Origin | Integration Type | Create | Update |
|--------|-----------|--------|------------------|--------|--------|
| **QContact** | `FT{number}` | External (Fibertime) | REST API v2 | ❌ | ✅ |
| **WhatsApp (Inbound)** | `DR{num}-{seq}` | Field staff messages | WAHA webhook | ✅ | ✅ |
| **Email** | `EML-{number}` | tickets@fibreflow.app | Email parsing | ✅ | ✅ |
| **Construction** | `DR{num}-{seq}` | SOW drops table | Database query | ✅ | ✅ |
| **FibreFlow Internal** | `FF-{number}` | Manual creation | Web form | ✅ | ✅ |
| **WhatsApp (Outbound)** | N/A | Staff → Field | WAHA API | ✅ | ✅ |
| **Ad-hoc Tasks** | `AH-{number}` | Quick tasks | Web form | ✅ | ✅ |

### UID Strategy: Immutable IDs with Mutable Categories

**Core Principle**: UIDs are permanent identifiers that never change, but categories can be reassigned as tickets evolve.

**Example Workflow**:
```
1. Construction issue DR123-01 created (category: construction)
2. During work, fibre damage discovered
3. Category changed to: maintenance
4. UID remains: DR123-01 (never changes)
5. Now appears in "Maintenance" filter view
```

**Why This Works**:
- **Immutable UID**: Permanent reference for conversations, links, history
- **Mutable Category**: Flexible organization as understanding evolves
- **Best of Both**: Stability of fixed IDs + flexibility of dynamic categorization

---

## 2. Problem Statement

### 2.1 Current State
- No unified system for tracking fiber-related issues
- Tickets from Fibertime handled manually or via email
- No SLA tracking or escalation
- Field technicians have no standardized way to report issues
- No visibility into ticket status for clients or management

### 2.2 Pain Points
| Stakeholder | Pain Point |
|-------------|------------|
| VF Admin | Manual ticket logging, no prioritization system |
| VF Technicians | No mobile-friendly way to report field issues |
| VF Management | No visibility into SLA compliance, workload distribution |
| Fibertime (Client) | No feedback on ticket status, unclear resolution times |
| Contractors | No awareness of issues related to their work |

### 2.3 Desired State
- Single source of truth for all fiber network tickets
- Automated workflows with SLA tracking
- Real-time notifications for stakeholders
- Mobile-friendly interface for field use
- Client-facing status updates

---

## 3. Goals & Objectives

### 3.1 Primary Goals
| Goal | Metric | Target |
|------|--------|--------|
| Reduce ticket resolution time | Average time to close | -30% within 6 months |
| Improve SLA compliance | % tickets closed within SLA | >90% |
| Reduce manual data entry | Auto-populated fields | >70% of fields |
| Improve client satisfaction | FT feedback score | >4/5 |

### 3.2 Secondary Goals
- Enable data-driven decision making through reporting
- Identify recurring issues by location/contractor
- Build foundation for preventative maintenance program

---

## 4. User Personas

### 4.1 VF Admin (Sarah)
- **Role:** Office-based administrator
- **Tasks:** Triage incoming tickets, assign to teams, track SLAs, communicate with Fibertime
- **Needs:** Dashboard overview, bulk operations, notification management
- **Tech Comfort:** High

### 4.2 VF Team Lead (Marcus)
- **Role:** Supervises field technicians
- **Tasks:** Assign tickets to technicians, monitor team workload, escalate issues
- **Needs:** Team view, workload balancing, escalation tools
- **Tech Comfort:** Medium-High

### 4.3 VF Field Technician (Thabo)
- **Role:** On-site fiber technician
- **Tasks:** Resolve assigned tickets, report new issues, upload evidence photos
- **Needs:** Mobile-first interface, offline capability, quick ticket creation
- **Tech Comfort:** Medium

### 4.4 VF Management (Director)
- **Role:** Operations oversight
- **Tasks:** Monitor SLA compliance, review reports, strategic decisions
- **Needs:** Executive dashboard, SLA reports, trend analysis
- **Tech Comfort:** Low-Medium

### 4.5 Fibertime Representative (External)
- **Role:** Client contact
- **Tasks:** Submit tickets, track status, receive resolution updates
- **Needs:** Status visibility, communication channel (future: portal)
- **Tech Comfort:** Varies

---

## 5. User Stories

### 5.1 Ticket Creation

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-001 | VF Admin | receive tickets automatically from Fibertime API | I don't have to manually enter client issues | Must |
| US-002 | VF Technician | create a ticket from my mobile device | I can report field issues immediately | Must |
| US-003 | VF Admin | create a ticket manually with DR number auto-lookup | project/pole/zone are populated automatically | Must |
| US-004 | VF Admin | create a preventative ticket | we can track planned maintenance | Should |
| US-005 | System | auto-generate a unique ticket ID (TKT-YYYY-NNNNN) | every ticket is uniquely identifiable | Must |

### 5.2 Ticket Assignment & Workflow

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-010 | VF Admin | assign a ticket to a team or technician | work is distributed appropriately | Must |
| US-011 | VF Team Lead | reassign a ticket to another technician | workload can be balanced | Must |
| US-012 | VF Technician | update ticket status (In Progress, Blocked, Resolved) | everyone knows the current state | Must |
| US-013 | VF Admin | escalate a ticket to management | critical issues get attention | Should |
| US-014 | System | auto-assign tickets based on rules (zone, type) | tickets route to the right team automatically | Could |

### 5.3 SLA Management

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-020 | VF Admin | configure SLA times per ticket type and priority | different issues have appropriate deadlines | Must |
| US-021 | System | display SLA countdown on each ticket | urgency is visible at a glance | Must |
| US-022 | System | send notifications when SLA is at 75%, 90%, and breached | stakeholders can take action before breach | Must |
| US-023 | VF Management | view SLA compliance reports | I can monitor operational performance | Must |
| US-024 | VF Admin | pause SLA timer when waiting for client input | SLA is fair when blocked externally | Should |

### 5.4 Communication

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-030 | VF Admin | add internal notes to a ticket | team members can see context | Must |
| US-031 | VF Admin | send status updates to Fibertime | client is informed of progress | Must |
| US-032 | VF Technician | attach photos to a ticket | evidence is documented | Must |
| US-033 | System | notify assignee when ticket is assigned | they know they have new work | Must |
| US-034 | System | notify stakeholders on status changes | everyone stays informed | Must |

### 5.5 Search & Reporting

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-040 | VF Admin | search tickets by DR number, address, or keyword | I can find specific tickets quickly | Must |
| US-041 | VF Admin | filter tickets by status, type, priority, assignee | I can focus on relevant tickets | Must |
| US-042 | VF Management | see a dashboard with ticket metrics | I have operational visibility | Must |
| US-043 | VF Management | export ticket data to CSV/Excel | I can do further analysis | Should |
| US-044 | VF Admin | view ticket history/audit log | I can see what happened and when | Must |

### 5.6 Billing Management

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-BIL-001 | VF Management | configure guarantee periods per project | I can track guarantee work and ensure contractors honor their commitments | Must |
| US-BIL-002 | VF Management | create and manage client SLA contracts | I can apply custom response/resolution times based on client agreements | Must |
| US-BIL-003 | VF Management | approve billable tickets before work starts | I can prevent billing disputes and control costs | Must |
| US-BIL-004 | VF Admin | define fixed fees per ticket type and priority | I can automate cost estimation for billable work | Should |
| US-BIL-005 | VF Management | track billable vs guarantee work | I can identify quality issues and optimize contractor performance | Must |
| US-BIL-006 | VF Admin | manually override billing amounts | I can handle special cases that don't fit fixed fee schedules | Should |
| US-BIL-007 | VF Management | see which tickets are pending billing approval | I can prioritize approvals and avoid technician delays | Must |
| US-BIL-008 | VF Admin | auto-generate invoice line items from completed billable tickets | I can reduce manual invoicing work and errors | Should |

---

## 6. Functional Requirements

### 6.1 Ticket Management

#### FR-001: Ticket Creation
| Requirement | Description |
|-------------|-------------|
| FR-001.1 | System shall support manual ticket creation via web form |
| FR-001.2 | System shall support automatic ticket creation via Fibertime API webhook |
| FR-001.3 | System shall generate unique ticket ID in format TKT-YYYY-NNNNN |
| FR-001.4 | System shall auto-populate project, pole, zone, address when DR number is entered |
| FR-001.5 | System shall support file attachments (images, documents) up to 10MB each |
| FR-001.6 | System shall validate required fields before submission |

#### FR-002: Ticket Properties
| Field | Type | Required | Source |
|-------|------|----------|--------|
| ticket_uid | VARCHAR(20) | Yes | Auto-generated |
| title | VARCHAR(255) | Yes | User input |
| description | TEXT | Yes | User input |
| source | ENUM | Yes | User selection |
| source_reference | VARCHAR(100) | No | Fibertime ticket ID |
| type | ENUM | Yes | User selection |
| priority | ENUM | Yes | User selection / Auto from source |
| status | ENUM | Yes | Workflow |
| drop_number | VARCHAR(50) | No | User input / Auto-lookup |
| project_id | UUID | No | Auto from DR |
| pole_id | UUID | No | Auto from DR / Manual |
| pon | VARCHAR(50) | No | User input |
| zone | VARCHAR(100) | No | Auto from DR |
| address | TEXT | No | Auto from DR / User input |
| assigned_to | UUID | No | User selection |
| assigned_team | UUID | No | User selection |
| created_by | UUID | Yes | Auth context |
| created_at | TIMESTAMP | Yes | Auto |
| updated_at | TIMESTAMP | Yes | Auto |
| due_at | TIMESTAMP | No | SLA calculation |
| closed_at | TIMESTAMP | No | Workflow |

#### FR-003: Ticket Sources (Updated: 7 Sources)
| Source | Code | UID Format | Auto/Manual | Integration | Notes |
|--------|------|-----------|-------------|-------------|-------|
| QContact | `qcontact` | `FT{number}` | Automatic | REST API v2 | Read-only import + status updates |
| WhatsApp Inbound | `wa_inbound` | `DR{num}-{seq}` | Automatic | WAHA webhook | Field staff messages |
| Email | `email` | `EML-{number}` | Automatic | Email parsing | tickets@fibreflow.app |
| Construction | `construction` | `DR{num}-{seq}` | Semi-automatic | DB query | From SOW drops table |
| FibreFlow Internal | `ff_internal` | `FF-{number}` | Manual | Web form | Staff-created tickets |
| WhatsApp Outbound | `wa_outbound` | N/A | Manual | WAHA API | Comments/messages only |
| Ad-hoc | `adhoc` | `AH-{number}` | Manual | Web/Mobile | Quick tasks |

#### FR-004: Ticket Types
| Type | Code | Default SLA | Description |
|------|------|-------------|-------------|
| Build/Fibre | `build` | 48 hours | Construction defects, installation issues |
| Fault | `fault` | 4 hours | Service down, signal issues |
| Infrastructure | `infrastructure` | 24 hours | Poles, cables, physical damage |
| Preventative | `preventative` | 7 days | Scheduled maintenance |
| Ad-hoc | `adhoc` | 24 hours | Once-off requests |

#### FR-005: Ticket Statuses
| Status | Code | Description | Next Statuses |
|--------|------|-------------|---------------|
| New | `new` | Just created, not triaged | triaged, closed |
| Triaged | `triaged` | Reviewed, ready for assignment | assigned, closed |
| Assigned | `assigned` | Assigned to technician/team | in_progress, triaged |
| In Progress | `in_progress` | Work underway | blocked, resolved, assigned |
| Blocked | `blocked` | Waiting for external input | in_progress, closed |
| Resolved | `resolved` | Work complete, pending verification | closed, in_progress |
| Closed | `closed` | Ticket complete | (reopened → new) |

#### FR-006: Ticket Priority
| Priority | Code | SLA Multiplier | Color |
|----------|------|----------------|-------|
| Critical | `critical` | 0.25x | Red |
| High | `high` | 0.5x | Orange |
| Medium | `medium` | 1x | Yellow |
| Low | `low` | 2x | Green |

### 6.2 SLA Management

#### FR-010: SLA Configuration
| Requirement | Description |
|-------------|-------------|
| FR-010.1 | Admin shall configure base SLA time per ticket type |
| FR-010.2 | System shall apply priority multiplier to base SLA |
| FR-010.3 | Admin shall configure business hours (SLA only counts during work hours) |
| FR-010.4 | Admin shall configure SLA warning thresholds (default: 75%, 90%) |
| FR-010.5 | System shall support SLA pause when status is "Blocked" |

#### FR-011: SLA Calculation
```
due_at = created_at + (base_sla_hours * priority_multiplier)
         adjusted for business hours if configured

time_remaining = due_at - now()
sla_percentage = (elapsed_time / total_sla_time) * 100
```

#### FR-012: SLA Notifications
| Trigger | Recipients | Channel |
|---------|------------|---------|
| SLA at 75% | Assignee | In-app, Email |
| SLA at 90% | Assignee, Team Lead | In-app, Email |
| SLA Breached | Assignee, Team Lead, Management | In-app, Email, SMS (optional) |

### 6.3 Assignment & Delegation

#### FR-020: Assignment Rules
| Requirement | Description |
|-------------|-------------|
| FR-020.1 | Tickets can be assigned to individual users |
| FR-020.2 | Tickets can be assigned to teams (any team member can claim) |
| FR-020.3 | Assignment history shall be tracked in audit log |
| FR-020.4 | Reassignment requires a reason/note |

#### FR-021: Auto-Assignment (Optional)
| Rule Type | Criteria | Action |
|-----------|----------|--------|
| Zone-based | Ticket zone matches team zone | Assign to team |
| Type-based | Ticket type matches team specialty | Assign to team |
| Round-robin | Distribute evenly | Assign to next available technician |
| Load-balanced | Based on current workload | Assign to least-loaded technician |

### 6.4 Communication

#### FR-030: Internal Notes
| Requirement | Description |
|-------------|-------------|
| FR-030.1 | Users can add internal notes visible only to VF staff |
| FR-030.2 | Notes shall include author, timestamp, and content |
| FR-030.3 | Notes support @mentions to notify specific users |

#### FR-031: Client Communication
| Requirement | Description |
|-------------|-------------|
| FR-031.1 | System shall send email to Fibertime on ticket status changes |
| FR-031.2 | Admin can compose custom messages to client |
| FR-031.3 | Client communication history shall be logged |

#### FR-032: Attachments
| Requirement | Description |
|-------------|-------------|
| FR-032.1 | Tickets support multiple file attachments |
| FR-032.2 | Supported formats: JPG, PNG, PDF, DOCX, XLSX |
| FR-032.3 | Maximum file size: 10MB per file, 50MB per ticket |
| FR-032.4 | Attachments stored in Firebase Storage |

### 6.5 Search & Filtering

#### FR-040: Search
| Requirement | Description |
|-------------|-------------|
| FR-040.1 | Full-text search across title, description, notes |
| FR-040.2 | Search by ticket UID (exact match) |
| FR-040.3 | Search by DR number (exact or partial) |
| FR-040.4 | Search by address (partial match) |

#### FR-041: Filters
| Filter | Options |
|--------|---------|
| Status | Multi-select from status list |
| Type | Multi-select from type list |
| Priority | Multi-select from priority list |
| Assignee | User picker |
| Team | Team picker |
| Project | Project picker |
| Date Range | Created, Updated, Due |
| SLA Status | On track, Warning, Breached |

### 6.6 Reporting & Analytics

#### FR-050: Dashboard Metrics
| Metric | Description |
|--------|-------------|
| Open Tickets | Count by status |
| SLA Compliance | % tickets closed within SLA (this week/month) |
| Average Resolution Time | By type, by priority |
| Tickets by Source | Distribution pie chart |
| Tickets by Zone/Project | Bar chart |
| Overdue Tickets | Count with list |

#### FR-051: Reports
| Report | Description | Export |
|--------|-------------|--------|
| Ticket Summary | All tickets with filters | CSV, PDF |
| SLA Report | Compliance metrics over time | CSV, PDF |
| Technician Performance | Tickets resolved, avg time | CSV |
| Zone Analysis | Issues by geographic area | CSV |
| Trend Report | Ticket volume over time | CSV |

### 6.7 Billing Management

#### FR-BIL-001: Automatic Billing Type Calculation
**Description**: System automatically determines billing type when ticket is created based on:
- **Guarantee Work**: Check if DR number links to SOW install within configurable guarantee period
- **SLA Maintenance**: Check if client has active contract with SLA terms
- **Ad-hoc Billable**: Default when neither guarantee nor SLA applies

**Inputs**:
- Ticket type
- DR number (if construction ticket)
- Client ID
- Project ID
- Creation timestamp

**Outputs**:
- Billing type (guarantee | sla | billable | internal)
- Reason for classification
- Guarantee expiry date (if applicable)
- Contract ID (if applicable)
- SLA hours (if applicable)
- Estimated cost (if applicable)

**Business Rules**:
- Guarantee period is configurable per project (30/60/90 days)
- SLA contracts override type-based defaults (hybrid model)
- Billable tickets require approval before work starts
- Internal tickets (staff-only tasks) have no billing

#### FR-BIL-002: Guarantee Period Configuration
**Description**: Managers can configure guarantee periods per project.

**Features**:
- Set guarantee period in days (30, 60, 90, or custom)
- Specify which ticket types are covered (fault, construction, etc.)
- View guarantee expiry dates for active installations
- Track guarantee work for quality metrics

**UI Components**:
- Project settings page with guarantee configuration
- Guarantee period input field
- Ticket type multi-select
- Guarantee work report (contractor performance tracking)

#### FR-BIL-003: Client Contract Management
**Description**: Managers can create and manage client SLA contracts.

**CRUD Operations**:
- **Create**: New contract with SLA terms
- **Read**: View contract details and active tickets
- **Update**: Modify contract terms (effective date required)
- **Delete**: Soft delete (archive expired contracts)

**Contract Fields**:
- Client ID (reference)
- Contract number (unique identifier)
- Contract type (retainer | per_incident | mixed)
- Start date / End date
- Monthly fee (for retainer contracts)
- SLA response hours (custom override)
- SLA resolution hours (custom override)
- Status (active | expired | terminated)
- Notes

**UI Components**:
- Contract management page
- Contract form (create/edit)
- Contract list with filters
- Active contracts dashboard

#### FR-BIL-004: Billable Ticket Approval Workflow
**Description**: Billable tickets require manager approval before work begins.

**Workflow**:
1. Ticket created → Billing calculator determines type
2. If billable → Status = "Pending Approval"
3. Manager reviews estimated cost and approves/rejects
4. If approved → Technician can proceed (status = "Assigned")
5. If rejected → Ticket closed with reason

**Approval Interface**:
- Pending approval queue (manager dashboard)
- Ticket details with cost breakdown
- Approve/Reject buttons with reason field
- Email notification to requester on decision

**Business Rules**:
- Only managers/admins can approve billable tickets
- Approval required before status can change to "In Progress"
- Rejection auto-closes ticket with billing_status = "rejected"
- Approved tickets track actual cost vs estimated cost

#### FR-BIL-005: Fee Schedule Management
**Description**: Admins can define fixed fees per ticket type and priority.

**Features**:
- Fee schedule table (ticket type × priority = fee)
- Effective date ranges (supports multiple fee versions)
- Hourly rate option (time-based billing)
- Manual fee override (when fixed fee doesn't apply)

**Fee Schedule Table**:
| Ticket Type | Priority | Fixed Fee | Hourly Rate | Effective From | Effective Until |
|-------------|----------|-----------|-------------|----------------|-----------------|
| Fault | High | R500 | R150/hr | 2025-01-01 | NULL |
| Maintenance | Medium | R300 | R120/hr | 2025-01-01 | NULL |
| Construction | Low | R800 | R150/hr | 2025-01-01 | NULL |

**UI Components**:
- Fee schedule editor (table view)
- Add/edit fee form
- Fee history (effective date ranges)
- Preview cost calculator

#### FR-BIL-006: Invoicing System Integration
**Description**: Auto-generate invoice line items when billable tickets are completed.

**Integration Flow**:
1. Billable ticket marked "Resolved" → Calculate final cost
2. Create invoice line item via API
3. Send to external invoicing system
4. Update ticket with invoice ID and amount
5. Mark billing_status = "Invoiced"

**API Endpoint (External Invoicing System)**:
```
POST /api/invoices/line-items
{
  "ticket_uid": "DR1234-01",
  "client_id": "uuid",
  "description": "Fault repair - DR1234-01",
  "quantity": 1,
  "unit_price": 500.00,
  "total": 500.00,
  "billing_date": "2025-12-18"
}
```

**Response**:
```
{
  "invoice_id": "INV-2025-001",
  "line_item_id": "LI-12345",
  "status": "pending"
}
```

**Business Rules**:
- Only completed billable tickets generate invoices
- Invoice line items reference ticket UID
- Actual cost used (not estimated cost)
- Manual fee overrides supported
- Time-based billing includes hours worked

---

## 7. Non-Functional Requirements

### 7.1 Performance
| Requirement | Target |
|-------------|--------|
| Page load time | < 2 seconds |
| Search response time | < 500ms |
| API response time | < 300ms |
| Support concurrent users | 50+ |
| Ticket list pagination | 50 per page, virtual scroll |

### 7.2 Scalability
| Requirement | Target |
|-------------|--------|
| Tickets per year | 10,000+ |
| Attachments storage | 100GB+ |
| Historical data retention | 7 years |

### 7.3 Availability
| Requirement | Target |
|-------------|--------|
| Uptime | 99.5% |
| Planned maintenance window | Sundays 02:00-04:00 |
| Data backup frequency | Daily |

### 7.4 Compatibility
| Requirement | Target |
|-------------|--------|
| Desktop browsers | Chrome, Firefox, Edge, Safari (latest 2 versions) |
| Mobile browsers | Chrome Mobile, Safari iOS |
| Minimum screen width | 320px (mobile), 1024px (desktop) |

### 7.5 Accessibility
| Requirement | Target |
|-------------|--------|
| WCAG compliance | Level AA |
| Keyboard navigation | Full support |
| Screen reader | Compatible |

---

## 8. Data Model

### 8.1 Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     tickets     │────►│   ticket_notes  │     │ticket_attachments│
│                 │     │                 │     │                 │
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ ticket_uid      │     │ ticket_id (FK)  │     │ ticket_id (FK)  │
│ title           │     │ content         │     │ file_url        │
│ description     │     │ is_internal     │     │ file_name       │
│ source          │     │ created_by (FK) │     │ file_type       │
│ type            │     │ created_at      │     │ file_size       │
│ priority        │     └─────────────────┘     │ created_by (FK) │
│ status          │                             │ created_at      │
│ drop_number     │     ┌─────────────────┐     └─────────────────┘
│ project_id (FK) │────►│    projects     │
│ pole_id (FK)    │────►│     poles       │     ┌─────────────────┐
│ zone            │     └─────────────────┘     │  ticket_history │
│ address         │                             │                 │
│ pon             │     ┌─────────────────┐     │ id (PK)         │
│ assigned_to(FK) │────►│     users       │     │ ticket_id (FK)  │
│ assigned_team   │     └─────────────────┘     │ field_changed   │
│ created_by (FK) │                             │ old_value       │
│ created_at      │     ┌─────────────────┐     │ new_value       │
│ updated_at      │     │   sla_configs   │     │ changed_by (FK) │
│ due_at          │     │                 │     │ changed_at      │
│ sla_paused_at   │     │ id (PK)         │     └─────────────────┘
│ closed_at       │     │ ticket_type     │
└─────────────────┘     │ priority        │     ┌─────────────────┐
                        │ base_hours      │     │  ticket_tags    │
                        │ business_hours  │     │                 │
                        └─────────────────┘     │ ticket_id (FK)  │
                                                │ tag_id (FK)     │
┌─────────────────┐     ┌─────────────────┐     └─────────────────┘
│      tags       │     │     teams       │
│                 │     │                 │     ┌─────────────────┐
│ id (PK)         │     │ id (PK)         │     │notification_log │
│ name            │     │ name            │     │                 │
│ color           │     │ zone            │     │ id (PK)         │
└─────────────────┘     │ members[]       │     │ ticket_id (FK)  │
                        └─────────────────┘     │ type            │
                                                │ recipient       │
                                                │ sent_at         │
                                                │ status          │
                                                └─────────────────┘
```

### 8.2 Table Definitions

#### tickets
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_uid VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Source & Classification
    source VARCHAR(20) NOT NULL CHECK (source IN ('fibertime', 'vf_field', 'vf_admin', 'preventative', 'adhoc')),
    source_reference VARCHAR(100),
    type VARCHAR(20) NOT NULL CHECK (type IN ('build', 'fault', 'infrastructure', 'preventative', 'adhoc')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'assigned', 'in_progress', 'blocked', 'resolved', 'closed')),

    -- Location Linking
    drop_number VARCHAR(50),
    project_id UUID REFERENCES projects(id),
    pole_id UUID REFERENCES poles(id),
    pon VARCHAR(50),
    zone VARCHAR(100),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Assignment
    assigned_to UUID REFERENCES users(id),
    assigned_team UUID,

    -- SLA
    due_at TIMESTAMP WITH TIME ZONE,
    sla_paused_at TIMESTAMP WITH TIME ZONE,
    sla_breached BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_tickets_uid ON tickets(ticket_uid);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_type ON tickets(type);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_project_id ON tickets(project_id);
CREATE INDEX idx_tickets_drop_number ON tickets(drop_number);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_due_at ON tickets(due_at);
CREATE INDEX idx_tickets_source ON tickets(source);
```

#### ticket_notes
```sql
CREATE TABLE ticket_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ticket_notes_ticket_id ON ticket_notes(ticket_id);
```

#### ticket_attachments
```sql
CREATE TABLE ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
```

#### ticket_history
```sql
CREATE TABLE ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    field_changed VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_changed_at ON ticket_history(changed_at);
```

#### sla_configs
```sql
CREATE TABLE sla_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type VARCHAR(20) NOT NULL,
    priority VARCHAR(10) NOT NULL,
    base_hours INTEGER NOT NULL,
    business_hours_only BOOLEAN DEFAULT FALSE,
    warning_threshold_percent INTEGER DEFAULT 75,
    critical_threshold_percent INTEGER DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(ticket_type, priority)
);
```

#### ticket_tags
```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280'
);

CREATE TABLE ticket_tags (
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (ticket_id, tag_id)
);

-- Billing Management Tables

CREATE TABLE client_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    contract_number VARCHAR(50) UNIQUE NOT NULL,

    -- Contract terms
    start_date DATE NOT NULL,
    end_date DATE,
    contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('retainer', 'per_incident', 'mixed')),
    monthly_fee DECIMAL(10,2),

    -- SLA overrides (nullable = use default type-based SLA)
    sla_response_hours INTEGER,
    sla_resolution_hours INTEGER,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE project_guarantees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),

    -- Guarantee terms
    guarantee_period_days INTEGER NOT NULL,
    applies_to_ticket_types VARCHAR(50)[] DEFAULT ARRAY['fault', 'construction'],

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(project_id)
);

CREATE TABLE billable_fee_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type VARCHAR(20) NOT NULL,
    priority VARCHAR(10) NOT NULL,

    -- Fee structure
    fixed_fee DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),

    -- Metadata
    description TEXT,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(ticket_type, priority, effective_from)
);

CREATE TABLE ticket_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_uid VARCHAR(50) NOT NULL REFERENCES tickets(uid) ON DELETE CASCADE,

    -- Billing classification
    billing_type VARCHAR(20) NOT NULL CHECK (billing_type IN ('guarantee', 'sla', 'billable')),

    -- For guarantee tickets
    install_dr_number VARCHAR(20),
    install_date DATE,
    guarantee_expires_at DATE,

    -- For SLA tickets
    contract_id UUID REFERENCES client_contracts(id),
    sla_response_hours INTEGER,
    sla_resolution_hours INTEGER,

    -- For billable tickets
    billing_status VARCHAR(20) CHECK (billing_status IN ('pending_approval', 'approved', 'in_progress', 'completed', 'invoiced')),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    billing_notes TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,

    -- Fixed fee or manual entry
    fee_source VARCHAR(20) CHECK (fee_source IN ('fixed_fee', 'manual', 'hourly')),
    fee_schedule_id UUID REFERENCES billable_fee_schedule(id),
    manual_fee_amount DECIMAL(10,2),

    -- Time tracking (for hourly billing)
    hours_worked DECIMAL(5,2),

    -- Invoicing integration
    invoice_id VARCHAR(50),
    invoiced_at TIMESTAMP,
    invoice_amount DECIMAL(10,2),

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(ticket_uid)
);

CREATE TABLE ticket_assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_uid VARCHAR(50) NOT NULL REFERENCES tickets(uid) ON DELETE CASCADE,

    -- Assignment details
    assigned_from_user_id UUID REFERENCES users(id),
    assigned_to_user_id UUID REFERENCES users(id),
    assigned_from_team_id UUID REFERENCES teams(id),
    assigned_to_team_id UUID REFERENCES teams(id),

    -- Reassignment reason (required when from_user is not NULL)
    reason TEXT,
    reassigned_by UUID NOT NULL REFERENCES users(id),

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Billing Indexes
CREATE INDEX idx_client_contracts_client_id ON client_contracts(client_id);
CREATE INDEX idx_client_contracts_status ON client_contracts(status);
CREATE INDEX idx_project_guarantees_project_id ON project_guarantees(project_id);
CREATE INDEX idx_billable_fee_schedule_lookup ON billable_fee_schedule(ticket_type, priority, effective_from);
CREATE INDEX idx_ticket_billing_ticket_uid ON ticket_billing(ticket_uid);
CREATE INDEX idx_ticket_billing_billing_type ON ticket_billing(billing_type);
CREATE INDEX idx_ticket_billing_billing_status ON ticket_billing(billing_status);
CREATE INDEX idx_ticket_billing_contract_id ON ticket_billing(contract_id);
CREATE INDEX idx_ticket_assignment_history_ticket_uid ON ticket_assignment_history(ticket_uid);
CREATE INDEX idx_ticket_assignment_history_created_at ON ticket_assignment_history(created_at DESC);

-- Updates to existing tickets table
ALTER TABLE tickets ADD COLUMN billing_type VARCHAR(20) CHECK (billing_type IN ('guarantee', 'sla', 'billable', 'internal'));
ALTER TABLE tickets ADD COLUMN requires_billing_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE tickets ADD COLUMN last_assigned_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN assignment_count INTEGER DEFAULT 0;

CREATE INDEX idx_tickets_billing_type ON tickets(billing_type);
CREATE INDEX idx_tickets_requires_billing_approval ON tickets(requires_billing_approval) WHERE requires_billing_approval = TRUE;
```

### 8.3 Ticket UID Generation
```sql
-- Function to generate ticket UID
CREATE OR REPLACE FUNCTION generate_ticket_uid()
RETURNS TRIGGER AS $$
DECLARE
    year_str VARCHAR(4);
    seq_num INTEGER;
    new_uid VARCHAR(20);
BEGIN
    year_str := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(ticket_uid FROM 10 FOR 5) AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM tickets
    WHERE ticket_uid LIKE 'TKT-' || year_str || '-%';

    new_uid := 'TKT-' || year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
    NEW.ticket_uid := new_uid;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_uid
BEFORE INSERT ON tickets
FOR EACH ROW
WHEN (NEW.ticket_uid IS NULL)
EXECUTE FUNCTION generate_ticket_uid();
```

---

## 9. API Specification

### 9.1 Base URL
```
/api/tickets/
```

### 9.2 Authentication
All endpoints require Clerk authentication. User context determines permissions.

### 9.3 Endpoints

#### Tickets CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | List tickets with filters |
| GET | `/api/tickets/:id` | Get single ticket |
| POST | `/api/tickets` | Create ticket |
| PATCH | `/api/tickets/:id` | Update ticket |
| DELETE | `/api/tickets/:id` | Soft delete ticket |

#### Ticket Actions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets/:id/assign` | Assign ticket |
| POST | `/api/tickets/:id/status` | Change status |
| POST | `/api/tickets/:id/notes` | Add note |
| GET | `/api/tickets/:id/notes` | Get notes |
| POST | `/api/tickets/:id/attachments` | Upload attachment |
| GET | `/api/tickets/:id/history` | Get audit history |

#### Fibertime Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets/webhook/fibertime` | Receive FT tickets |
| POST | `/api/tickets/:id/notify-client` | Send update to FT |

#### Lookups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets/lookup/drop/:dropNumber` | Lookup drop details |
| GET | `/api/tickets/stats` | Dashboard statistics |
| GET | `/api/tickets/sla-configs` | Get SLA configurations |
| POST | `/api/tickets/sla-configs` | Update SLA configurations |

#### Billing Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ticketing/contracts` | List all client contracts |
| GET | `/api/ticketing/contracts/:contractId` | Get contract details |
| POST | `/api/ticketing/contracts` | Create new contract |
| PATCH | `/api/ticketing/contracts/:contractId` | Update contract |
| DELETE | `/api/ticketing/contracts/:contractId` | Soft delete contract |
| GET | `/api/ticketing/guarantees` | List all project guarantees |
| GET | `/api/ticketing/guarantees/:projectId` | Get project guarantee |
| POST | `/api/ticketing/guarantees` | Create/update project guarantee |
| GET | `/api/ticketing/fee-schedule` | Get fee schedules |
| POST | `/api/ticketing/fee-schedule` | Create/update fee schedule |
| GET | `/api/ticketing/billing/pending-approval` | List tickets pending billing approval |
| POST | `/api/ticketing/billing/approve/:ticketUid` | Approve billable ticket |
| POST | `/api/ticketing/billing/reject/:ticketUid` | Reject billable ticket |
| GET | `/api/ticketing/billing/calculate` | Calculate billing type for ticket |
| POST | `/api/ticketing/billing/invoice/:ticketUid` | Generate invoice line item |

### 9.4 Request/Response Examples

#### Create Ticket
```typescript
// POST /api/tickets
// Request
{
    "title": "No signal at customer premises",
    "description": "Customer reports no internet since yesterday morning...",
    "source": "fibertime",
    "source_reference": "FT-2025-12345",
    "type": "fault",
    "priority": "high",
    "drop_number": "DR001234"
}

// Response
{
    "success": true,
    "data": {
        "id": "uuid-here",
        "ticket_uid": "TKT-2025-00042",
        "title": "No signal at customer premises",
        "status": "new",
        "priority": "high",
        "due_at": "2025-12-18T14:00:00Z",
        "project": { "id": "...", "name": "Lawley Phase 2" },
        "zone": "Zone A",
        "address": "123 Main Street",
        // ... full ticket object
    }
}
```

#### List Tickets with Filters
```typescript
// GET /api/tickets?status=new,triaged&priority=high,critical&page=1&limit=50

// Response
{
    "success": true,
    "data": {
        "tickets": [...],
        "pagination": {
            "page": 1,
            "limit": 50,
            "total": 127,
            "totalPages": 3
        }
    }
}
```

---

## 10. UI/UX Requirements

### 10.1 Pages

| Page | Route | Description |
|------|-------|-------------|
| Ticket Dashboard | `/tickets` | Overview with metrics and ticket list |
| Ticket Detail | `/tickets/:id` | Full ticket view with notes, history |
| Create Ticket | `/tickets/new` | Ticket creation form |
| SLA Settings | `/tickets/settings/sla` | SLA configuration |
| Reports | `/tickets/reports` | Analytics and exports |

### 10.2 Dashboard Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ TICKETS DASHBOARD                           [+ New Ticket] [Filter]│
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │  Open    │ │ Assigned │ │ Overdue  │ │  SLA %   │ │  Avg     │  │
│ │   42     │ │    18    │ │    3     │ │   94%    │ │  4.2h    │  │
│ │ tickets  │ │ tickets  │ │ tickets  │ │ on-time  │ │ resolve  │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├────────────────────────────────────────────────────────────────────┤
│ [All] [New] [Assigned] [In Progress] [Blocked] [Resolved] [Closed]│
├────────────────────────────────────────────────────────────────────┤
│ ┌─────┬───────────────────┬────────┬──────────┬─────────┬───────┐ │
│ │ UID │ Title             │ Type   │ Priority │ SLA     │Assign │ │
│ ├─────┼───────────────────┼────────┼──────────┼─────────┼───────┤ │
│ │TKT..│ No signal at...   │ Fault  │ 🔴 High  │ 2h left │ Thabo │ │
│ │TKT..│ Pole leaning...   │ Infra  │ 🟡 Med   │ 18h left│ --    │ │
│ │TKT..│ New installation..│ Build  │ 🟢 Low   │ On time │ Sarah │ │
│ └─────┴───────────────────┴────────┴──────────┴─────────┴───────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### 10.3 Ticket Detail Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ ← Back    TKT-2025-00042                    [Edit] [Assign] [Close]│
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ No signal at customer premises                    Status: [In Prg]│
│ ─────────────────────────────────────────────────────────────────  │
│ Type: Fault    Priority: 🔴 High    SLA: ⏱️ 1h 45m remaining       │
│                                                                    │
├───────────────────────────────────┬────────────────────────────────┤
│ DETAILS                           │ LOCATION                       │
│ ───────                           │ ────────                       │
│ Source: Fibertime                 │ Project: Lawley Phase 2        │
│ Reference: FT-2025-12345          │ Zone: Zone A                   │
│ Created: 18 Dec 2025, 10:30       │ DR: DR001234                   │
│ Assigned: Thabo M.                │ Pole: P-4521                   │
│                                   │ Address: 123 Main Street       │
├───────────────────────────────────┴────────────────────────────────┤
│ DESCRIPTION                                                        │
│ ───────────                                                        │
│ Customer reports no internet since yesterday morning. Router shows │
│ no signal light. Neighbor also affected.                           │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ ATTACHMENTS (2)                                                    │
│ ───────────────                                                    │
│ 📎 router_photo.jpg (1.2MB)    📎 signal_test.pdf (340KB)         │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ ACTIVITY                                          [+ Add Note]     │
│ ────────                                                           │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ 🔒 Internal Note - Thabo M. - 11:45                            │ │
│ │ Checked splice point, found water damage. Ordering replacement. │ │
│ ├────────────────────────────────────────────────────────────────┤ │
│ │ ⚡ Status changed to "In Progress" - Thabo M. - 11:30          │ │
│ ├────────────────────────────────────────────────────────────────┤ │
│ │ 👤 Assigned to Thabo M. - Sarah K. - 10:45                     │ │
│ ├────────────────────────────────────────────────────────────────┤ │
│ │ 📥 Ticket created from Fibertime - System - 10:30              │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### 10.4 Mobile Considerations

| Feature | Mobile Adaptation |
|---------|-------------------|
| Ticket List | Card-based layout, swipe actions |
| Create Ticket | Simplified form, camera integration |
| Filters | Bottom sheet modal |
| Attachments | Direct camera/gallery access |

### 10.5 Component Library
Use existing FF components from `src/components/`:
- AppLayout (sidebar navigation)
- Tables with pagination
- Form inputs with validation
- Modal dialogs
- Toast notifications
- Loading states

### 10.6 Billing Management UI Components

#### Contract Management Page
**Location**: `/ticketing/billing/contracts`

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│  Contracts                                  [+ New]    │
├────────────────────────────────────────────────────────┤
│  Filters: [All Clients ▾] [Active ▾]  [Search...]     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Contract No.  Client       Type      SLA    Status    │
│  ────────────────────────────────────────────────────  │
│  CON-2025-001  ClientA      Retainer  4h/8h  Active    │
│  CON-2025-002  ClientB      Mixed     2h/4h  Active    │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Features**:
- Contract list with filters (client, status, type)
- Create/edit contract modal
- Contract details view with active tickets
- SLA override fields (custom response/resolution hours)
- Contract status badges (active, expired, terminated)

#### Guarantee Configuration Page
**Location**: `/ticketing/billing/guarantees`

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│  Project Guarantees                                    │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Project           Period    Ticket Types    Actions   │
│  ────────────────────────────────────────────────────  │
│  Lawley Expansion  60 days   Fault, Constr  [Edit]    │
│  Mohadin Install   30 days   Fault          [Edit]    │
│                                                         │
│  [+ Add Project Guarantee]                             │
└────────────────────────────────────────────────────────┘
```

**Features**:
- Project guarantee list
- Guarantee period input (days)
- Ticket type multi-select (which types are covered)
- Guarantee expiry calculator
- Guarantee work report (contractor performance)

#### Billable Ticket Approval Interface
**Location**: `/ticketing/billing/pending` or Manager Dashboard

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│  Pending Approval (3)                                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Ticket UID    Client      Type         Est. Cost     │
│  ────────────────────────────────────────────────────  │
│  DR1234-01     ClientA     Fault        R500          │
│  [View Details] [Approve] [Reject]                     │
│                                                         │
│  FF-2025-001   ClientB     Maintenance  R300          │
│  [View Details] [Approve] [Reject]                     │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Features**:
- Pending approval queue (manager dashboard widget)
- Ticket details modal with cost breakdown
- Approve/Reject buttons with reason field
- Email notification on decision
- Approval history log

#### Fee Schedule Editor
**Location**: `/ticketing/billing/fee-schedule`

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│  Fee Schedule                              [+ Add Fee] │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Type         Priority  Fixed Fee  Hourly  Effective   │
│  ────────────────────────────────────────────────────  │
│  Fault        High      R500       R150    2025-01-01  │
│  Maintenance  Medium    R300       R120    2025-01-01  │
│  Construction Low       R800       R150    2025-01-01  │
│                                                         │
│  [Fee History] [Preview Calculator]                    │
└────────────────────────────────────────────────────────┘
```

**Features**:
- Fee schedule table (ticket type × priority)
- Add/edit fee modal
- Effective date range selector
- Fee history view (previous versions)
- Preview cost calculator (test fee lookup)

#### Billing Status Badge Component
**Location**: Ticket cards and detail views

**Variants**:
- 🟢 **Guarantee** - Green badge "Free (Guarantee)"
- 🔵 **SLA** - Blue badge "Covered (SLA)"
- 🟡 **Pending Approval** - Yellow badge "Awaiting Approval"
- 🟠 **Billable** - Orange badge "Billable (R500)"
- ⚪ **Internal** - Gray badge "Internal"

**Display Rules**:
- Show billing type on ticket card
- Show estimated/actual cost for billable tickets
- Show guarantee expiry date for guarantee tickets
- Show contract number for SLA tickets
- Click badge to view billing details

#### Invoice Generation Interface
**Location**: Ticket detail page (completed billable tickets)

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│  Billing Summary                                       │
├────────────────────────────────────────────────────────┤
│  Billing Type:      Billable                           │
│  Estimated Cost:    R500                               │
│  Actual Cost:       R500                               │
│  Hours Worked:      3.5                                │
│  Fee Source:        Fixed Fee                          │
│                                                         │
│  [Generate Invoice]                                    │
│                                                         │
│  Invoice ID:        INV-2025-001                       │
│  Invoiced At:       2025-12-18 14:30                   │
│  Status:            Sent                               │
└────────────────────────────────────────────────────────┘
```

**Features**:
- Billing summary section on ticket detail
- Generate invoice button (completed tickets only)
- Invoice ID and status display
- Manual cost override field
- Time tracking input (hours worked)
- Integration status indicator

---

## 11. Integration Points

### 11.1 Fibertime API Integration

#### Webhook Receiver
```typescript
// POST /api/tickets/webhook/fibertime
// Headers: X-FT-Signature: <hmac signature>

{
    "event": "ticket.created",
    "ticket": {
        "id": "FT-2025-12345",
        "customer_name": "John Smith",
        "address": "123 Main Street",
        "issue_type": "no_service",
        "description": "...",
        "priority": "high",
        "created_at": "2025-12-18T10:30:00Z"
    }
}
```

#### Outbound Notifications
```typescript
// Send status updates to Fibertime
POST https://api.fibertime.co.za/webhooks/velocity
{
    "event": "ticket.updated",
    "reference": "FT-2025-12345",
    "status": "in_progress",
    "message": "Technician dispatched, ETA 2 hours",
    "updated_at": "2025-12-18T11:30:00Z"
}
```

### 11.2 Internal FF Integrations

| System | Integration |
|--------|-------------|
| `drops` table | Lookup drop details by DR number |
| `poles` table | Link tickets to pole infrastructure |
| `projects` table | Auto-associate project from drop |
| `qa_photo_reviews` | Link tickets to QA issues |
| Firebase Storage | Store ticket attachments |
| Clerk | User authentication and profiles |

### 11.3 Notification Channels

| Channel | Use Case | Implementation |
|---------|----------|----------------|
| In-app | All notifications | FF notification system |
| Email | SLA warnings, assignments | SendGrid / Resend |
| WhatsApp | Critical alerts (optional) | WA Monitor integration |

---

## 11.4 QContact Integration (Fibertime Maintenance System)

### Overview
QContact is an external ticketing system used by Fibertime for maintenance tickets. FibreFlow integrates with QContact to provide a unified view while maintaining QContact as the source of truth for Fibertime-originated tickets.

### API Discovery (December 18, 2025)
- ✅ **Full REST API available** at `https://fibertime.qcontact.com/api/v2/`
- ✅ **Session-based authentication** using cookies after login
- ✅ **User ID**: `21924332416` (velocity@fibertimemaintenance.com)
- ✅ **Active queue**: "Maintenance - Velocity" (27 active tickets discovered)

### Key API Endpoints

```typescript
// Authentication
POST /api/v2/user/login
Body: { username, password }
Response: Sets session cookies

// Current user
GET /api/v2/me
Response: { id, name, email, permissions, ... }

// List all tickets (basic)
GET /api/v2/entities/Case
Response: { items: Case[], total: number }

// Advanced filtering
POST /api/v2/entities/Case/filter
Body: {
  filters: [
    { field: "queue", operator: "=", value: "Maintenance - Velocity" },
    { field: "status", operator: "in", value: ["Open", "In Progress"] }
  ],
  sort: { field: "created_at", order: "desc" },
  limit: 50,
  offset: 0
}

// Get single ticket
GET /api/v2/entities/Case/{id}
Response: { id, subject, description, status, priority, ... }

// Update ticket
PATCH /api/v2/entities/Case/{id}
Body: { status: "In Progress", assigned_to: "...", ... }

// Get schema (field definitions)
GET /api/v2/entity_types/Case
Response: { fields: [...], relationships: [...] }
```

### Integration Requirements (User Confirmed)

| Operation | Supported | Notes |
|-----------|-----------|-------|
| **READ** tickets | ✅ Yes | Import from "Maintenance - Velocity" queue |
| **UPDATE** tickets | ✅ Yes | Sync status/fields from FibreFlow → QContact |
| **CREATE** tickets | ❌ No | QContact remains source of truth for FT tickets |

### Implementation Strategy: 3-Phase Approach

#### Phase 1: Read-Only Sync (Safe, No Risk)
**Goal**: Import QContact tickets into FibreFlow without modifying source

```typescript
// Service: qcontactSyncService.ts

async function syncQContactTickets() {
  // 1. Authenticate with session cookies
  const session = await qcontactAuth.login();

  // 2. Fetch tickets from "Maintenance - Velocity" queue
  const tickets = await qcontactApi.getTickets({
    queue: "Maintenance - Velocity",
    status: ["Open", "In Progress", "Pending"]
  });

  // 3. Map to FibreFlow ticket format
  const ffTickets = tickets.map(mapQContactToFF);

  // 4. Upsert into tickets table
  for (const ticket of ffTickets) {
    await db.query(`
      INSERT INTO tickets (uid, source, source_reference, ...)
      VALUES ($1, 'qcontact', $2, ...)
      ON CONFLICT (uid) DO UPDATE SET ...
    `, [ticket.uid, ticket.qcontact_id, ...]);
  }
}

// Mapping function
function mapQContactToFF(qcTicket: QContactCase): Ticket {
  return {
    uid: `FT${qcTicket.id}`,  // QContact ID becomes UID
    title: qcTicket.subject,
    description: qcTicket.description,
    source: 'qcontact',
    source_reference: qcTicket.id.toString(),
    status: mapQContactStatus(qcTicket.status),
    priority: mapQContactPriority(qcTicket.priority),
    created_at: qcTicket.created_at,
    updated_at: qcTicket.updated_at,
    // ... other fields
  };
}
```

**Sync Schedule**: Every 15 minutes (cron job)
**Data Flow**: QContact → FibreFlow (one-way, read-only)

#### Phase 2: Bidirectional Status Updates (After Testing)
**Goal**: Allow FibreFlow users to update QContact ticket statuses

```typescript
// Service: qcontactUpdateService.ts

async function updateQContactStatus(
  ticketUid: string,
  newStatus: string,
  userId: string
) {
  // 1. Get ticket from FibreFlow
  const ticket = await getTicketByUid(ticketUid);

  if (ticket.source !== 'qcontact') {
    throw new Error('Not a QContact ticket');
  }

  // 2. Map FibreFlow status to QContact status
  const qcStatus = mapFFStatusToQContact(newStatus);

  // 3. Update QContact via API
  const session = await qcontactAuth.getSession();
  await qcontactApi.updateTicket(ticket.source_reference, {
    status: qcStatus,
    updated_by: userId,
    updated_at: new Date()
  });

  // 4. Update FibreFlow ticket
  await updateTicket(ticket.id, { status: newStatus });

  // 5. Log sync activity
  await logSyncActivity({
    ticket_id: ticket.id,
    action: 'status_update',
    direction: 'ff_to_qcontact',
    old_value: ticket.status,
    new_value: newStatus
  });
}
```

**Update Fields** (Bidirectional):
- Status (Open, In Progress, Resolved, Closed)
- Assigned user (if mapped)
- Priority (if mapped)
- Internal notes/comments

#### Phase 3: Real-time Sync (Optional Webhooks)
**Goal**: Instant updates instead of 15-minute polling

**If QContact supports webhooks**:
```typescript
// Webhook receiver
POST /api/qcontact/webhook
Body: {
  event: "case.updated",
  case_id: "12345",
  changes: { status: "In Progress" }
}

// Handler
async function handleQContactWebhook(payload) {
  const ticket = await db.query(`
    SELECT * FROM tickets WHERE source_reference = $1 AND source = 'qcontact'
  `, [payload.case_id]);

  if (ticket) {
    await syncSingleTicket(payload.case_id);
  }
}
```

**If webhooks not available**: Continue 15-minute polling

### Session Management

```typescript
// qcontactAuth.ts

class QContactAuth {
  private sessionCookies: string | null = null;
  private sessionExpiry: Date | null = null;

  async login(): Promise<void> {
    const response = await fetch('https://fibertime.qcontact.com/api/v2/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.QCONTACT_USERNAME,
        password: process.env.QCONTACT_PASSWORD
      })
    });

    // Extract session cookies from Set-Cookie header
    this.sessionCookies = response.headers.get('set-cookie');
    this.sessionExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
  }

  async getSession(): Promise<string> {
    if (!this.sessionCookies || new Date() > this.sessionExpiry!) {
      await this.login();
    }
    return this.sessionCookies!;
  }
}
```

### Status Mapping

```typescript
// QContact → FibreFlow
const statusMap = {
  'Open': 'new',
  'In Progress': 'in_progress',
  'Pending': 'blocked',
  'Resolved': 'resolved',
  'Closed': 'closed'
};

// FibreFlow → QContact (reverse mapping)
const reverseStatusMap = Object.fromEntries(
  Object.entries(statusMap).map(([k, v]) => [v, k])
);
```

### Error Handling & Resilience

```typescript
// Retry logic for API failures
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(2 ** i * 1000); // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}

// Failed sync queue
async function handleSyncFailure(ticket: Ticket, error: Error) {
  await db.query(`
    INSERT INTO qcontact_sync_failures (
      ticket_id,
      error_message,
      retry_count,
      next_retry_at
    ) VALUES ($1, $2, 0, NOW() + INTERVAL '5 minutes')
  `, [ticket.id, error.message]);
}
```

### Monitoring & Alerts

```typescript
// Daily sync health check
SELECT
  COUNT(*) as total_qcontact_tickets,
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '1 hour') as recently_synced,
  COUNT(*) FILTER (WHERE sync_error IS NOT NULL) as failed_syncs
FROM tickets
WHERE source = 'qcontact';

// Alert if sync failing
if (failed_syncs > 5 || recently_synced = 0) {
  await sendSlackAlert('QContact sync health degraded!');
}
```

### Database Schema Additions

```sql
-- Track QContact sync metadata
ALTER TABLE tickets ADD COLUMN qcontact_sync_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN qcontact_sync_error TEXT;

-- Sync failure queue
CREATE TABLE qcontact_sync_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sync activity log
CREATE TABLE qcontact_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  action VARCHAR(50) NOT NULL,  -- 'import', 'update', 'status_sync'
  direction VARCHAR(20) NOT NULL, -- 'qc_to_ff', 'ff_to_qc'
  old_value JSONB,
  new_value JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qcontact_sync_log_ticket ON qcontact_sync_log(ticket_id);
CREATE INDEX idx_qcontact_sync_failures_retry ON qcontact_sync_failures(next_retry_at) WHERE resolved_at IS NULL;
```

---

## 11.5 WhatsApp Bridge Integration

### Overview
Bidirectional WhatsApp chat system integrated into ticketing for real-time communication with field staff, activations teams, and customers directly from ticket interface.

### Architecture: WAHA + FibreFlow Ticketing

```
┌─────────────────────────────────────────────────────────────────┐
│                    FibreFlow Application                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────┐        │
│  │   WA Monitor        │    │   Ticketing Module      │        │
│  │   (Existing)        │    │   (New)                 │        │
│  │                     │    │                         │        │
│  │  - QA Photo Reviews │    │  - Chat Interface       │        │
│  │  - 12-step tracking │    │  - Message History      │        │
│  │  - Feedback sending │    │  - Ticket Context       │        │
│  └──────────┬──────────┘    └──────────┬──────────────┘        │
│             │                          │                        │
│             │ Python Socket            │ HTTP REST API          │
│             ▼                          ▼                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────┐        │
│  │  whatsmeow Bridge   │    │   WAHA Docker           │        │
│  │  (Port 52001)       │    │   (Port 3100)           │        │
│  │                     │    │                         │        │
│  │  - Group monitoring │    │  - Send messages        │        │
│  │  - Photo extraction │    │  - Receive webhooks     │        │
│  └─────────────────────┘    │  - Session management   │        │
│                              │  - Media handling       │        │
│                              └─────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                    │                        │
                    ▼                        ▼
           ┌─────────────────────────────────────┐
           │       WhatsApp Groups/Chats         │
           │                                     │
           │  - Lawley QA (whatsmeow)           │
           │  - Mohadin QA (whatsmeow)          │
           │  - Ticket Support Group (WAHA)     │
           │  - 1-on-1 Field Staff (WAHA)       │
           └─────────────────────────────────────┘
```

**Key Architecture Decision**: WAHA and WA Monitor coexist independently
- Different ports (WAHA: 3100, whatsmeow: 52001)
- Different database tables (wa_* vs qa_photo_reviews)
- Different WhatsApp groups (ticketing vs QA photos)
- Zero interference between systems

### WAHA (WhatsApp HTTP API)
- **Docker Image**: `devlikeapro/waha:latest`
- **Engine**: WEBJS (browser-based, most stable)
- **Port**: 3100 (external), 3000 (internal container)
- **Location on VPS**: `/opt/waha/`

### Hybrid Chat Structure

**User Requirement**: Support both group discussions and ticket-specific chats

| Chat Type | Use Case | Example |
|-----------|----------|---------|
| **Project Groups** | General project discussion | "Lawley Maintenance Team" |
| **Individual 1-on-1** | Ticket-specific communication | Chat with John about ticket FF-0123 |

**Routing Logic**:
- Low/medium priority tickets → Post to project group
- High/critical priority → Create 1-on-1 chat with assigned technician
- User can manually switch between group/individual per ticket

### Chat Interface Design

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎫 Ticket FF-0123 | Cable Entry Issue | Open        [⚙️ Options] │
├──────────────────────────────────────┬──────────────────────────┤
│                                      │  📋 Ticket Context        │
│  💬 Conversation History             │                          │
│  ──────────────────────────────────  │  UID: FF-0123            │
│                                      │  Status: Open            │
│  📤 You (10:30 AM)                   │  Category: Maintenance   │
│  Please resend photo 5 - unclear     │  DR: DR789012            │
│  └─ ✓✓ Read                          │  Project: Mohadin        │
│                                      │                          │
│  📥 John Field (10:32 AM)            │  📞 Contact              │
│  Photo 5 resent                      │  Name: Jane Customer     │
│  [📷 Image attached]                 │  Phone: +27 123 456 789  │
│  └─ ✓ Delivered                      │  Address: 123 Main St    │
│                                      │                          │
│  📤 You (10:35 AM)                   │  🔗 Related              │
│  Perfect, thank you!                 │  • FF-0098 (Similar)     │
│  └─ ✓ Sent                           │  • DR789012-01 (Same DR) │
│                                      │                          │
│                                      │  📜 History              │
│  ──────────────────────────────────  │  • Opened 2 days ago     │
│                                      │  • Category changed      │
│  [Type message...          ] [Send]  │  • Assigned to Mohadin   │
│  [📎 Attach] [😊 Emoji]              │                          │
└──────────────────────────────────────┴──────────────────────────┘
```

### Key UI Features
- **Split Layout**: Chat (60%) + Context sidebar (40%)
- **Message Threading**: Reply indicators, quoted messages
- **Delivery Status**: ✓ sent, ✓✓ delivered, blue ✓✓ read
- **Media Support**: Images, videos, documents, audio
- **Real-time Updates**: Auto-scroll, typing indicators
- **Mobile Responsive**: Stack layout on mobile

### Database Schema: WhatsApp Bridge

```sql
-- WhatsApp sessions managed by WAHA
CREATE TABLE wa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name VARCHAR(100) UNIQUE NOT NULL,  -- WAHA session identifier
  phone_number VARCHAR(20),                   -- Connected WhatsApp number
  status VARCHAR(20) NOT NULL,                -- connected, disconnected, qr_pending
  qr_code TEXT,                               -- QR code for scanning (if pending)
  engine VARCHAR(20) NOT NULL DEFAULT 'WEBJS', -- WEBJS, NOWEB, GOWS

  -- Session metadata
  device_name VARCHAR(255),
  whatsapp_version VARCHAR(50),

  -- Health tracking
  last_seen TIMESTAMP,
  last_error TEXT,
  reconnect_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- WhatsApp chat threads (groups or 1-on-1)
CREATE TABLE wa_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id VARCHAR(100) UNIQUE NOT NULL,       -- WhatsApp chat ID (JID)
  session_id UUID NOT NULL REFERENCES wa_sessions(id) ON DELETE CASCADE,

  -- Chat type and info
  chat_type VARCHAR(20) NOT NULL,             -- group, individual
  chat_name VARCHAR(255),                     -- Group name or contact name
  phone_number VARCHAR(20),                   -- For individual chats

  -- Project/ticket linking
  project VARCHAR(100),                       -- Lawley, Mohadin, etc.
  ticket_uid VARCHAR(50) REFERENCES tickets(uid), -- For ticket-specific chats

  -- Group metadata (if applicable)
  group_participants JSONB,                   -- [{phone, name, role}]

  -- Timestamps
  last_message_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- WhatsApp messages (bidirectional)
CREATE TABLE wa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id VARCHAR(100) UNIQUE NOT NULL,    -- WhatsApp message ID
  chat_id UUID NOT NULL REFERENCES wa_chats(id) ON DELETE CASCADE,
  ticket_uid VARCHAR(50) REFERENCES tickets(uid), -- Link to ticket if applicable

  -- Message direction and sender
  direction VARCHAR(10) NOT NULL,             -- inbound, outbound
  from_phone VARCHAR(20),                     -- Sender phone number
  from_name VARCHAR(255),                     -- Sender display name
  to_phone VARCHAR(20),                       -- Recipient phone number

  -- Message content
  message_type VARCHAR(20) NOT NULL,          -- text, image, video, audio, document
  content TEXT,                               -- Message text or caption
  media_url TEXT,                             -- URL to media (if applicable)
  media_filename VARCHAR(255),
  media_mime_type VARCHAR(100),
  media_size_bytes INTEGER,

  -- Reply/thread context
  reply_to_message_id VARCHAR(100),           -- If replying to another message
  quoted_message_content TEXT,

  -- Metadata
  timestamp TIMESTAMP NOT NULL,               -- WhatsApp message timestamp
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,

  -- Staff tracking (for outbound messages)
  sent_by_user_id VARCHAR(100),               -- FibreFlow user who sent
  sent_by_user_name VARCHAR(255),

  -- Processing status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, delivered, read, failed
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_wa_sessions_status ON wa_sessions(status);
CREATE INDEX idx_wa_chats_session_id ON wa_chats(session_id);
CREATE INDEX idx_wa_chats_ticket_uid ON wa_chats(ticket_uid);
CREATE INDEX idx_wa_chats_project ON wa_chats(project);
CREATE INDEX idx_wa_messages_chat_id ON wa_messages(chat_id);
CREATE INDEX idx_wa_messages_ticket_uid ON wa_messages(ticket_uid);
CREATE INDEX idx_wa_messages_timestamp ON wa_messages(timestamp DESC);
CREATE INDEX idx_wa_messages_direction ON wa_messages(direction);

-- Link WhatsApp messages to ticket comments
ALTER TABLE ticket_comments ADD COLUMN wa_message_id UUID REFERENCES wa_messages(id);

-- Track primary WhatsApp chat for ticket
ALTER TABLE tickets ADD COLUMN primary_wa_chat_id UUID REFERENCES wa_chats(id);
```

### WAHA Docker Deployment

**Location on VPS**: `/opt/waha/` (separate from WA Monitor at `/opt/wa-monitor/`)

**docker-compose.yml**:
```yaml
version: '3'
services:
  waha:
    image: devlikeapro/waha:latest
    restart: unless-stopped
    ports:
      - "3100:3000"       # External 3100, internal 3000
    volumes:
      - ./sessions:/app/.sessions
      - ./logs:/app/logs
    environment:
      # API Configuration
      - WAHA_API_PORT=3000
      - WAHA_API_HOSTNAME=0.0.0.0

      # Security
      - WHATSAPP_API_KEY=${WAHA_API_KEY}  # Set in .env
      - WAHA_WEBHOOK_ALLOWED_IPS=127.0.0.1,100.96.203.105

      # Engine selection
      - WAHA_DEFAULT_ENGINE=WEBJS        # Browser-based (most stable)

      # Webhook configuration
      - WAHA_WEBHOOK_URL=http://100.96.203.105:3005/api/wa-bridge/webhook
      - WAHA_WEBHOOK_EVENTS=message,message.any,session.status

      # Session management
      - WAHA_SESSION_TIMEOUT=3600000     # 1 hour
      - WAHA_SESSION_MAX_RETRY=3

    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Message Flow: Outbound (Staff → Field)

```
1. User types message in ChatInterface.tsx
   ↓
2. POST /api/wa-bridge/send-message
   {
     ticketUid: "FF-0123",
     chatId: "1234567890@c.us",
     content: "Please resend photo 5",
     messageType: "text"
   }
   ↓
3. waBridgeService.ts:
   - Save to wa_messages (status: pending)
   - Save to ticket_comments (linked to ticket)
   ↓
4. wahaClient.ts:
   - POST http://localhost:3100/api/sendText
   - Headers: X-Api-Key: <WAHA_API_KEY>
   - Body: {chatId, text, session}
   ↓
5. WAHA sends via WhatsApp Web
   ↓
6. Update wa_messages (status: sent/delivered)
   ↓
7. Frontend polls GET /api/wa-bridge/messages?ticketUid=FF-0123
   - Updates MessageList with delivery status
```

### Message Flow: Inbound (Field → Staff)

```
1. Field staff sends WhatsApp message
   ↓
2. WAHA receives message
   ↓
3. WAHA webhook: POST /api/wa-bridge/webhook
   {
     event: "message",
     session: "fibreflow-ticketing",
     payload: {
       id: "msg_123",
       from: "1234567890@c.us",
       fromMe: false,
       body: "Photo 5 resent",
       timestamp: 1734567890,
       hasMedia: false
     }
   }
   ↓
4. waBridgeService.ts:
   - Parse message, identify ticket (if referenced)
   - Save to wa_messages (direction: inbound)
   - Save to ticket_comments (if ticket linked)
   - Create activity log entry on ticket
   ↓
5. Frontend polling detects new message
   ↓
6. ChatInterface.tsx displays message in real-time
```

### API Endpoints: WhatsApp Bridge

```typescript
// Session Management
POST /api/wa-bridge/sessions/start
Request: { sessionName: string, engine: 'WEBJS' | 'NOWEB' | 'GOWS' }
Response: { sessionId: string, qrCode: string, status: 'qr_pending' }

GET /api/wa-bridge/sessions/:sessionId
Response: { status: 'connected' | 'disconnected', phoneNumber: string, lastSeen: timestamp }

DELETE /api/wa-bridge/sessions/:sessionId
Response: { success: true }

// Chat Management
GET /api/wa-bridge/chats?ticketUid=FF-0123
Response: { chats: Chat[] }

POST /api/wa-bridge/chats
Request: { ticketUid: string, chatType: 'individual' | 'group', phoneNumber?: string }
Response: { chatId: string, created: boolean }

// Messaging
POST /api/wa-bridge/send-message
Request: {
  ticketUid: string,
  chatId: string,
  content: string,
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document',
  mediaUrl?: string,
  replyToMessageId?: string
}
Response: { messageId: string, status: 'pending' }

GET /api/wa-bridge/messages?ticketUid=FF-0123&limit=50&offset=0
Response: { messages: Message[], total: number }

// Webhook receiver (called by WAHA)
POST /api/wa-bridge/webhook
Request: { event: string, session: string, payload: any }
Response: { success: true }
```

### Module Structure: wa-bridge

Following FibreFlow's modular "Lego block" pattern:

```
src/modules/wa-bridge/
├── types/
│   └── wa-bridge.types.ts         # TypeScript interfaces
├── services/
│   ├── wahaClient.ts              # WAHA HTTP API client
│   ├── waBridgeService.ts         # Backend database operations
│   └── waBridgeApiService.ts      # Frontend API client
├── utils/
│   ├── chatHelpers.ts             # Message formatting, threading
│   └── sessionManager.ts          # Session health monitoring
├── components/
│   ├── ChatInterface.tsx          # Main chat UI (like Slack/Teams)
│   ├── ChatSidebar.tsx            # Ticket context panel
│   ├── MessageList.tsx            # Scrollable message history
│   ├── MessageInput.tsx           # Send message with media
│   ├── ChatHeader.tsx             # Ticket info, chat name
│   └── SessionStatus.tsx          # WAHA session health indicator
├── hooks/
│   ├── useWaMessages.ts           # Real-time message polling
│   ├── useWaSession.ts            # Session status tracking
│   └── useChatContext.ts          # Ticket context loading
├── README.md
└── ISOLATION_GUIDE.md             # Module isolation rules
```

### Security & Authentication

**API Key Management**:
```bash
# .env.local (development)
WAHA_API_KEY=dev-key-123
WAHA_BASE_URL=http://localhost:3100

# Production (VPS)
WAHA_API_KEY=<strong-random-key>
WAHA_BASE_URL=http://localhost:3100  # Internal Docker network
```

**Clerk Authentication**: All wa-bridge API routes protected with Clerk
```typescript
import { getAuth } from '@clerk/nextjs/server';
import { apiResponse } from '@/lib/apiResponse';

export default async function handler(req, res) {
  const { userId } = getAuth(req);

  if (!userId) {
    return apiResponse.unauthorized(res, 'Authentication required');
  }

  // Route handling...
}
```

**Webhook Verification**:
```typescript
function verifyWebhook(req: NextApiRequest): boolean {
  const apiKey = req.headers['x-api-key'];

  if (apiKey !== process.env.WAHA_API_KEY) {
    return false;
  }

  // Additional IP whitelist check
  const clientIp = req.socket.remoteAddress;
  const allowedIps = ['127.0.0.1', '100.96.203.105']; // VPS Tailscale IP

  return allowedIps.includes(clientIp);
}
```

---

## 11.6 Invoicing System Integration

### Overview
Automatic invoice line item generation for billable tickets integrated with external invoicing system. When billable tickets are completed, FibreFlow automatically creates invoice line items and sends them to the invoicing system for client billing.

### Integration Flow

```
┌──────────────────────────────────────────────────────────────┐
│                 Billable Ticket Lifecycle                     │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
      ┌─────────────┐
      │ Ticket      │
      │ Created     │──► billing_type = "billable"
      │             │──► billing_status = "pending_approval"
      └──────┬──────┘
             │
             ▼
   ┌─────────────────┐
   │ Manager         │
   │ Approves        │──► billing_status = "approved"
   │                 │──► estimated_cost set
   └──────┬──────────┘
          │
          ▼
   ┌─────────────────┐
   │ Work            │
   │ Completed       │──► status = "resolved"
   │                 │──► billing_status = "completed"
   └──────┬──────────┘
          │
          ▼
   ┌─────────────────────────────────────────────┐
   │ Calculate Final Cost                        │
   │                                              │
   │ IF fee_source = "fixed_fee":                │
   │   → Use billable_fee_schedule.fixed_fee     │
   │                                              │
   │ IF fee_source = "manual":                   │
   │   → Use manual_fee_amount                   │
   │                                              │
   │ IF fee_source = "hourly":                   │
   │   → hours_worked × hourly_rate              │
   └──────┬──────────────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────┐
   │ POST /api/invoices/line-items               │
   │ (External Invoicing System)                 │
   │                                              │
   │ {                                            │
   │   "ticket_uid": "DR1234-01",                │
   │   "client_id": "uuid",                      │
   │   "description": "Fault repair - DR1234",   │
   │   "quantity": 1,                            │
   │   "unit_price": 500.00,                     │
   │   "total": 500.00,                          │
   │   "billing_date": "2025-12-18"              │
   │ }                                            │
   └──────┬──────────────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────┐
   │ External Invoicing System Response          │
   │                                              │
   │ {                                            │
   │   "success": true,                          │
   │   "invoice_id": "INV-2025-001",             │
   │   "line_item_id": "LI-12345",               │
   │   "status": "pending"                       │
   │ }                                            │
   └──────┬──────────────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────┐
   │ Update ticket_billing Record                │
   │                                              │
   │ invoice_id = "INV-2025-001"                 │
   │ invoiced_at = NOW()                         │
   │ invoice_amount = 500.00                     │
   │ billing_status = "invoiced"                 │
   └─────────────────────────────────────────────┘
```

### API Specification

#### FibreFlow → Invoicing System

**Endpoint**: `POST /api/invoices/line-items`
**Authentication**: API Key in header (`X-API-Key`)

**Request**:
```json
{
  "ticket_uid": "DR1234-01",
  "client_id": "uuid-of-client",
  "description": "Fault repair - DR1234-01 - Cable from Pole damaged",
  "quantity": 1,
  "unit_price": 500.00,
  "total": 500.00,
  "billing_date": "2025-12-18",
  "metadata": {
    "ticket_type": "fault",
    "priority": "high",
    "technician": "John Doe",
    "project": "Lawley",
    "fee_source": "fixed_fee"
  }
}
```

**Response (Success)**:
```json
{
  "success": true,
  "invoice_id": "INV-2025-001",
  "line_item_id": "LI-12345",
  "status": "pending",
  "message": "Invoice line item created successfully"
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error_code": "DUPLICATE_LINE_ITEM",
  "message": "Line item for ticket DR1234-01 already exists",
  "invoice_id": "INV-2025-001"
}
```

#### Invoicing System → FibreFlow (Webhook)

**Endpoint**: `POST /api/ticketing/webhooks/invoice-status`
**Authentication**: API Key in header (`X-API-Key`)

**Request (Invoice Paid)**:
```json
{
  "event": "invoice.paid",
  "invoice_id": "INV-2025-001",
  "line_items": [
    {
      "line_item_id": "LI-12345",
      "ticket_uid": "DR1234-01",
      "amount_paid": 500.00,
      "paid_at": "2025-12-25T10:00:00Z"
    }
  ],
  "total_paid": 500.00
}
```

**Response**:
```json
{
  "success": true,
  "tickets_updated": ["DR1234-01"]
}
```

### Database Integration

When invoice is created, update `ticket_billing` table:

```sql
UPDATE ticket_billing
SET
  invoice_id = 'INV-2025-001',
  invoiced_at = NOW(),
  invoice_amount = 500.00,
  billing_status = 'invoiced',
  updated_at = NOW()
WHERE ticket_uid = 'DR1234-01';
```

### Error Handling

**Retry Logic**:
- Max 3 retry attempts with exponential backoff
- Retry delays: 5s, 15s, 45s
- Store failed attempts in `ticket_billing.billing_notes`

**Manual Override**:
- If automatic invoicing fails after 3 attempts, mark billing_status = "failed"
- Notify manager via in-app notification
- Manager can manually create invoice and update invoice_id

**Idempotency**:
- Check for existing invoice_id before creating new line item
- If invoice_id exists, skip creation and return success
- Prevents duplicate billing for same ticket

### Configuration

**Environment Variables**:
```bash
INVOICING_API_URL=https://invoicing.example.com/api
INVOICING_API_KEY=secret_key_here
INVOICING_WEBHOOK_SECRET=webhook_secret_here
INVOICING_RETRY_MAX_ATTEMPTS=3
INVOICING_RETRY_DELAY_MS=5000
```

### Security

**API Key Authentication**:
- FibreFlow → Invoicing: Use `INVOICING_API_KEY` in `X-API-Key` header
- Invoicing → FibreFlow: Validate `INVOICING_WEBHOOK_SECRET` in webhook requests

**IP Whitelisting**:
- Configure allowed IPs for webhook receiver
- Reject requests from unknown IPs

**HTTPS Only**:
- All API communication must use HTTPS
- Reject non-HTTPS requests

---

## 12. Module Architecture

### 12.1 Directory Structure

```
src/modules/ticketing/
├── README.md                    # Module documentation
├── ISOLATION_GUIDE.md          # Independence documentation
│
├── types/
│   ├── index.ts                # Re-exports
│   ├── ticket.ts               # Ticket interfaces
│   ├── sla.ts                  # SLA interfaces
│   └── api.ts                  # API request/response types
│
├── services/
│   ├── ticketService.ts        # Core ticket operations
│   ├── slaService.ts           # SLA calculations
│   ├── lookupService.ts        # DR/pole lookups
│   ├── notificationService.ts  # Notification dispatch
│   ├── fibertimeService.ts     # FT API integration
│   ├── qcontactService.ts      # QContact API integration
│   ├── qcontactAuth.ts         # QContact session management
│   └── emailParsingService.ts  # Email-to-ticket parsing
│
├── utils/
│   ├── ticketUid.ts            # UID generation
│   ├── slaCalculator.ts        # SLA time calculations
│   └── validators.ts           # Input validation
│
├── hooks/
│   ├── useTickets.ts           # Ticket list with filters
│   ├── useTicket.ts            # Single ticket
│   ├── useTicketMutations.ts   # Create/update/delete
│   └── useSlaConfig.ts         # SLA settings
│
├── components/
│   ├── TicketDashboard/
│   │   ├── index.tsx
│   │   ├── MetricsCards.tsx
│   │   ├── TicketTable.tsx
│   │   └── FilterBar.tsx
│   │
│   ├── TicketDetail/
│   │   ├── index.tsx
│   │   ├── TicketHeader.tsx
│   │   ├── TicketInfo.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── AttachmentList.tsx
│   │   └── NoteForm.tsx
│   │
│   ├── TicketForm/
│   │   ├── index.tsx
│   │   ├── DropLookup.tsx
│   │   └── AttachmentUpload.tsx
│   │
│   ├── SlaIndicator.tsx
│   ├── PriorityBadge.tsx
│   ├── StatusBadge.tsx
│   └── SourceBadge.tsx
│
└── constants/
    ├── statuses.ts
    ├── priorities.ts
    ├── types.ts
    └── sources.ts
```

### 12.2 API Routes

```
pages/api/
├── tickets/
│   ├── index.ts                # GET (list), POST (create)
│   ├── [id].ts                 # GET, PATCH, DELETE
│   ├── [id]/
│   │   ├── assign.ts           # POST
│   │   ├── status.ts           # POST
│   │   ├── notes.ts            # GET, POST
│   │   ├── attachments.ts      # POST
│   │   └── history.ts          # GET
│   │
│   ├── webhook/
│   │   └── fibertime.ts        # POST (webhook receiver)
│   │
│   ├── lookup/
│   │   └── drop/
│   │       └── [dropNumber].ts # GET
│   │
│   ├── stats.ts                # GET (dashboard stats)
│   └── sla-configs.ts          # GET, POST
```

### 12.3 Pages

```
pages/
├── tickets/
│   ├── index.tsx               # Dashboard
│   ├── new.tsx                 # Create ticket
│   ├── [id].tsx                # Ticket detail
│   ├── reports.tsx             # Reports page
│   └── settings/
│       └── sla.tsx             # SLA configuration
```

### 12.4 Related Modules

**WhatsApp Bridge Module** (`src/modules/wa-bridge/`)
- Separate isolated module for WhatsApp chat integration
- See section 11.5 for complete module structure
- Independent Docker service (WAHA) on port 3100
- Links to tickets via `ticket_uid` foreign keys
- Can be extracted to microservice alongside ticketing

**QContact Sync Integration**
- Embedded within ticketing module services
- No separate module needed (tight coupling with tickets)
- Session management in `qcontactAuth.ts`
- API client in `qcontactService.ts`

### 12.5 Module Independence

Following the WA Monitor pattern, this module should be:
- **Self-contained:** All ticket logic within module folder
- **Minimal dependencies:** Only core FF utilities (apiResponse, db)
- **Own types:** No importing types from other modules
- **Extractable:** Could become microservice if needed
- **Coordinated:** wa-bridge module runs independently but shares ticket UIDs

---

## 13. Security & Permissions

### 13.1 Role-Based Access

| Role | Permissions |
|------|-------------|
| `ticket:admin` | Full access, SLA config, delete tickets |
| `ticket:team_lead` | Assign, reassign, view all team tickets |
| `ticket:technician` | View assigned, update status, add notes |
| `ticket:viewer` | Read-only access to tickets |

### 13.2 Data Access Rules

| Rule | Implementation |
|------|----------------|
| Technicians see only assigned tickets | WHERE clause filter |
| Team leads see team tickets | Team membership check |
| Admins see all tickets | No filter |
| Soft delete preserves data | `deleted_at` instead of DELETE |

### 13.3 API Security

| Measure | Implementation |
|---------|----------------|
| Authentication | Clerk middleware on all routes |
| Authorization | Role check per endpoint |
| Rate limiting | Arcjet protection |
| Webhook validation | HMAC signature verification |
| Input validation | Zod schemas |

---

## 14. Implementation Phases

### Phase 1: Core Ticketing (MVP)
**Goal:** Basic ticket creation, assignment, and tracking

| Feature | Priority |
|---------|----------|
| Database schema & migrations | Must |
| Ticket CRUD API | Must |
| Ticket list with filters | Must |
| Ticket detail view | Must |
| Manual ticket creation | Must |
| Status workflow | Must |
| Basic assignment | Must |
| Notes & attachments | Must |

**Deliverables:**
- Working ticket dashboard
- Create/view/update tickets
- Assign to users
- Add notes and photos

---

### Phase 2: SLA & Notifications
**Goal:** SLA tracking and automated notifications

| Feature | Priority |
|---------|----------|
| SLA configuration UI | Must |
| SLA calculation engine | Must |
| SLA display on tickets | Must |
| Email notifications | Must |
| In-app notifications | Must |
| SLA breach alerts | Must |

**Deliverables:**
- Configurable SLA per type/priority
- Visual SLA countdown
- Automated warning emails
- Breach escalation

---

### Phase 3: QContact Integration (Read-Only)
**Goal:** Import existing tickets from QContact system

| Feature | Priority |
|---------|----------|
| QContact API client | Must |
| Session-based authentication | Must |
| Ticket mapping logic (QC → FF) | Must |
| Status mapping | Must |
| 15-minute polling scheduler | Must |
| Sync error handling | Must |
| Sync activity logging | Must |

**Deliverables:**
- Read-only QContact ticket import
- Tickets visible in dashboard with `FT{number}` UIDs
- Sync health monitoring
- Manual re-sync capability

**Implementation Notes:**
- Phase 3a: Read-only sync (safe, no QContact writes)
- Tickets imported as `source='qcontact'`
- Status mapped: Open → open, In Progress → in_progress, etc.
- 15-minute polling interval (configurable)
- Session cookie management with 8-hour expiry

---

### Phase 4: WhatsApp Bridge (Session Setup)
**Goal:** Enable WhatsApp messaging infrastructure

| Feature | Priority |
|---------|----------|
| WAHA Docker deployment | Must |
| Session management API | Must |
| QR code scan interface | Must |
| Session health monitoring | Must |
| Database schema (wa_sessions, wa_chats, wa_messages) | Must |

**Deliverables:**
- WAHA running on VPS port 3100
- QR code scan interface working
- Session status tracking
- Health check endpoint

**Implementation Notes:**
- Deploy to `/opt/waha/` on VPS
- Use WEBJS engine (browser-based, most stable)
- Separate from WA Monitor (different port)
- Session timeout: 1 hour (configurable)

---

### Phase 5: Billing & Financial Tracking
**Goal:** Billing type classification, approval workflow, and invoicing integration

| Feature | Priority |
|---------|----------|
| Automatic billing type calculation (guarantee/SLA/billable) | Must |
| Project guarantee configuration (30/60/90 days) | Must |
| Client contract management (SLA terms) | Must |
| Billable ticket approval workflow | Must |
| Fixed fee schedule management | Must |
| Manual billing amount entry | Must |
| Invoicing system integration | Must |
| Billing status tracking | Must |
| Invoice line item generation | Must |
| Billing reports and analytics | Should |

**Deliverables:**
- Billing calculator service (auto-determines ticket type)
- Contract management UI (CRUD operations)
- Guarantee configuration UI (per project)
- Fee schedule editor (fixed fees per ticket type)
- Approval interface (pending billable tickets)
- Invoicing API integration (external system)
- Billing status badges (UI components)

**Implementation Notes:**
- Database tables: `client_contracts`, `project_guarantees`, `billable_fee_schedule`, `ticket_billing`, `ticket_assignment_history`
- API endpoints: `/api/ticketing/contracts`, `/api/ticketing/guarantees`, `/api/ticketing/billing/*`
- Billing types independent of ticket source (DR, AH, TK, etc.)
- Approval required before billable work starts (prevent billing disputes)
- Integration with external invoicing system via REST API
- Retry logic: 3 attempts with exponential backoff
- Webhook receiver for invoice status updates

**Database Migration:**
```sql
-- Run migrations to create 4 new tables
-- Add billing_type, requires_billing_approval to tickets table
-- Add indexes for performance
```

**Dependencies:**
- Phase 1 (Core Ticketing) must be complete
- Phase 2 (SLA) must be complete (for SLA contract overrides)
- External invoicing system API must be available

---

### Phase 6: WhatsApp Bridge (Bidirectional Messaging)
**Goal:** Enable staff to send and receive WhatsApp messages linked to tickets

| Feature | Priority |
|---------|----------|
| Send text messages (outbound) | Must |
| Webhook receiver (inbound) | Must |
| Message-ticket linking | Must |
| Chat interface UI | Must |
| Message list component | Must |
| Message input component | Must |
| Delivery status tracking | Must |

**Deliverables:**
- Staff can send messages from FibreFlow to WhatsApp
- Receive WhatsApp messages in real-time
- Messages linked to tickets automatically
- Basic chat interface with delivery status

**Implementation Notes:**
- WAHA API client for sending
- Webhook at `/api/wa-bridge/webhook`
- 5-second polling for new messages
- Delivery status: sent, delivered, read

---

### Phase 7: WhatsApp Bridge (Rich Context & Media)
**Goal:** Complete chat experience with ticket context and media support

| Feature | Priority |
|---------|----------|
| Ticket context sidebar | Must |
| Related tickets display | Must |
| Customer/location info | Must |
| Image message support | Must |
| Video/audio support | Should |
| Document attachments | Should |
| Message threading (replies) | Should |

**Deliverables:**
- Split layout: Chat (60%) + Context (40%)
- Ticket details visible while chatting
- Send/receive images
- Media preview and download
- Reply to specific messages

**Implementation Notes:**
- Firebase Storage for media hosting
- 16MB media size limit (WhatsApp limit)
- Automatic thumbnail generation for images

---

### Phase 8: WhatsApp Bridge (Hybrid Chat Structure)
**Goal:** Support both project groups and 1-on-1 ticket chats

| Feature | Priority |
|---------|----------|
| Project-based group chats | Must |
| Individual 1-on-1 chats | Must |
| Chat switcher UI | Must |
| Participant management | Should |
| @ mentions in groups | Could |
| Chat history pagination | Should |

**Deliverables:**
- Support for both group and individual chats
- Easy switching between chat types
- Proper routing based on ticket urgency
- Group participant tracking

**Implementation Notes:**
- Project groups for general discussion
- Individual chats for specific ticket threads
- Chat type stored in `wa_chats.chat_type`
- Automatic chat creation on first message

---

### Phase 9: QContact Bidirectional Sync
**Goal:** Enable status updates back to QContact

| Feature | Priority |
|---------|----------|
| Status update API calls | Must |
| Conflict resolution logic | Must |
| Sync validation | Must |
| Rollback on failure | Must |
| Bi-directional sync monitoring | Must |

**Deliverables:**
- FibreFlow status updates reflected in QContact
- Conflict handling (QContact wins on conflict)
- Comprehensive error logging
- Manual override capability

**Implementation Notes:**
- Phase 8a: One-way (FF → QC) status updates only
- Phase 8b: Full bidirectional sync
- Use PATCH /api/v2/entities/Case/{id}
- Sync failures queued for retry (3 attempts)

---

### Phase 10: Email Parsing Integration
**Goal:** Auto-create tickets from email (tickets@fibreflow.app)

| Feature | Priority |
|---------|----------|
| Email receiver webhook | Must |
| Subject/body parsing | Must |
| Attachment extraction | Must |
| Spam filtering | Must |
| Email-to-ticket mapping | Must |

**Deliverables:**
- Tickets auto-created from emails
- Attachments saved to Firebase Storage
- Email thread tracking
- Reply-to-email updates ticket

**Implementation Notes:**
- Use SendGrid Inbound Parse or similar
- UID format: `EML-{sequential}`
- Extract DR numbers from subject/body
- Auto-link to drops if DR found

---

### Phase 11: Advanced Features & Reporting
**Goal:** Analytics, reporting, and optimizations

| Feature | Priority |
|---------|----------|
| Dashboard metrics | Must |
| Export to CSV/PDF | Should |
| Trend reports | Should |
| Auto-assignment rules | Could |
| Bulk operations | Could |
| Mobile PWA | Could |

**Deliverables:**
- Executive dashboard
- Exportable reports
- Performance analytics
- Automated workflows

---

## 15. Success Metrics

### 15.1 Launch Metrics (Phase 1)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tickets created per day | >10 | Database count |
| User adoption | 80% of staff | Active users |
| System uptime | 99.5% | Monitoring |
| Bug reports | <5 critical | Issue tracker |

### 15.2 Ongoing Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| SLA compliance | >90% | Tickets closed within SLA |
| Avg resolution time | <24 hours | Ticket timestamps |
| User satisfaction | >4/5 | Internal survey |
| Fibertime satisfaction | >4/5 | Client feedback |

### 15.3 QContact Integration Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| QContact sync success rate | >99% | Successful syncs / total syncs |
| QContact sync latency | <2 minutes | Time from QC update to FF display |
| Sync error resolution time | <1 hour | Time to resolve failed syncs |
| Status mapping accuracy | 100% | Correct status translations |
| Session uptime | >99.5% | Session connection time |

### 15.4 WhatsApp Bridge Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Message delivery success rate | >99% | Delivered messages / sent messages |
| Average message delivery time | <5 seconds | Timestamp difference |
| Webhook processing time | <2 seconds | Webhook handler execution time |
| WAHA session uptime | >99.5% | Session connection time |
| Media upload success rate | >95% | Successful media uploads / attempts |
| Chat response time (staff) | <15 minutes | Time from inbound to outbound reply |

---

## 16. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Fibertime API unavailable | High | Medium | Queue failed webhooks, manual fallback |
| **QContact API changes/unavailable** | High | Medium | API version locking, error queue with retry, manual override |
| **QContact session expiry** | Medium | High | Automatic re-authentication, session health monitoring, 8-hour refresh |
| **QContact sync conflicts** | Medium | Medium | QContact wins on conflict, comprehensive logging, manual resolution UI |
| SLA calculation errors | High | Low | Extensive testing, audit logs |
| User resistance to new system | Medium | Medium | Training, phased rollout |
| Performance with large dataset | Medium | Low | Pagination, indexing, caching |
| Scope creep | Medium | High | Strict phase boundaries, PRD sign-off |
| **WAHA session disconnection** | High | Medium | Auto-reconnect logic, health checks every 30s, QR re-scan notification |
| **WhatsApp QR code re-scan required** | Medium | High | Email notification to admin, session status dashboard, 30-day warning |
| **WhatsApp message delivery failure** | Medium | Low | Retry queue (3 attempts), fallback to email, error notification |
| **WhatsApp media size limits** | Low | Medium | Pre-upload validation, user warning, 16MB hard limit enforcement |
| **Webhook spam/abuse** | Medium | Low | IP whitelist, API key verification, rate limiting, signature validation |
| **Multi-source UID conflicts** | High | Low | Strict UID generation rules, database unique constraints, validation layer |
| **Email parsing errors** | Medium | Medium | Spam filtering, manual review queue, pattern matching fallback |

---

## 17. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| DR | Drop number - unique identifier for a fiber drop |
| PON | Passive Optical Network - network identifier |
| FT | Fibertime - the client/ISP |
| VF | Velocity Fibre - internal team |
| SLA | Service Level Agreement - response time commitment |
| OLT | Optical Line Terminal - network equipment |
| **QContact** | Cloud-based contact center platform used by Fibertime for ticket management |
| **WAHA** | WhatsApp HTTP API - Docker-based WhatsApp integration solution |
| **WEBJS** | Browser-based WhatsApp engine used by WAHA (most stable) |
| **JID** | Jabber ID - WhatsApp's internal chat identifier format (e.g., `1234567890@c.us`) |
| **UID** | Unique Identifier - Immutable ticket identifier in FibreFlow (e.g., `FF-0123`, `FT4567`) |
| **Session Cookie** | Authentication token used by QContact API (expires after ~8 hours) |
| **Webhook** | HTTP callback that delivers real-time events from external systems |
| **Hybrid Chat** | WhatsApp chat structure combining project groups and 1-on-1 ticket threads |
| **Multi-Source Aggregation** | Unified ticket dashboard pulling from 7 independent ticket sources |

### Appendix B: Related Documents

**FibreFlow Documentation:**
- `docs/DATABASE_TABLES.md` - Existing FF schema
- `src/modules/wa-monitor/README.md` - Module pattern reference
- `docs/planning/feature-expansion-2025/03-ticketing-system.md` - Research notes

**Planning Documents:**
- `C:\Users\HeinvanVuuren\.claude\plans\sparkling-cuddling-thunder.md` - Main ticketing plan with QContact API integration
- `C:\Users\HeinvanVuuren\.claude\plans\binary-leaping-kite.md` - WhatsApp bridge implementation plan

**External Documentation:**
- QContact REST API v2: `https://fibertime.qcontact.com/api/v2/`
- WAHA Documentation: `https://waha.devlike.pro/`
- WAHA GitHub: `https://github.com/devlikeapro/waha`

### Appendix C: QContact API Details

**Base URL:** `https://fibertime.qcontact.com/api/v2/`

**Authentication:**
- Session-based with cookies
- Username: `velocity@fibertimemaintenance.com`
- User ID: `21924332416`
- Session expiry: ~8 hours

**Key Endpoints:**
- `POST /user/login` - Authentication
- `GET /entities/Case` - List tickets
- `POST /entities/Case/filter` - Advanced filtering
- `PATCH /entities/Case/{id}` - Update ticket

**Discovered Data:**
- 27 active tickets in "Maintenance - Velocity" queue
- Status values: "Open", "In Progress", "Pending", "Resolved", "Closed"
- Priority values: "Low", "Medium", "High", "Urgent"

### Appendix D: WAHA Configuration

**Docker Image:** `devlikeapro/waha:latest`

**Recommended Engine:** `WEBJS` (browser-based, most stable)

**Deployment Location:** `/opt/waha/` on VPS (72.60.17.245)

**Ports:**
- External: 3100
- Internal (container): 3000

**Webhook Events:**
- `message` - New message received
- `message.any` - Any message event
- `session.status` - Session status changes

**Environment Variables:**
- `WAHA_API_KEY` - Strong random key for API security
- `WAHA_WEBHOOK_URL` - FibreFlow webhook endpoint
- `WAHA_DEFAULT_ENGINE` - WEBJS
- `WAHA_SESSION_TIMEOUT` - 3600000 (1 hour)

### Appendix E: Open Questions

| Question | Status | Decision |
|----------|--------|----------|
| Fibertime API format? | ✅ Resolved | Use QContact REST API v2 (discovered via Playwright) |
| SLA business hours? | Pending | Define work hours |
| Notification channels? | Pending | Email + in-app for MVP, WhatsApp for field staff |
| Mobile app or PWA? | Pending | PWA for Phase 10 |
| **QContact webhook support?** | Pending | Research if QContact supports outbound webhooks (Phase 3 uses polling) |
| **WhatsApp number for WAHA?** | Pending | Dedicated business number or personal? |
| **Email parsing service?** | Pending | SendGrid Inbound Parse vs custom IMAP solution |
| **Multi-source conflict resolution?** | ✅ Resolved | Immutable UIDs, source-specific reference IDs |

---

**Document Approval:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Stakeholder | | | |

---

*End of PRD*
