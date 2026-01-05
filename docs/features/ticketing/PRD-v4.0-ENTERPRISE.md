# Product Requirements Document: FibreFlow Ticketing Module

**Document Version:** 4.0 ENTERPRISE (Enterprise Helpdesk Enhancement)
**Created:** December 18, 2025
**Last Updated:** December 19, 2025
**Status:** Ready for Implementation
**Author:** System Analysis & Planning Team
**Module Name:** `src/modules/ticketing/`

**Change Log:**
- v1.0: Initial draft (archived)
- v2.0: Comprehensive baseline (merged into v3.0)
- v3.0: Production-ready with operational analysis enhancements
- v4.0: **Enterprise Helpdesk Enhancement**
  - Added Omnichannel Support (FR-OC series) - Unified inbox, conversation threading
  - Added Knowledge Base (FR-KB series) - Internal KB with search and article linking
  - Added Advanced SLA & Escalation (FR-SLA series) - Multi-tier SLAs, breach prevention
  - Added Reporting & Analytics (FR-RPT series) - Performance dashboards, trend analysis
  - Added Automation Features (FR-AUTO series) - AI routing, canned responses, workflows, chatbot
  - Added 16 new database tables
  - Added 35+ new API endpoints
  - Added 12 new pages
  - Total: +68 FRs, +33 user stories

---

## Quick Navigation

**For Developers:**
- [Database Schema](#8-data-model) - Copy-paste ready SQL (24 tables)
- [API Specification](#9-api-specification) - Integration details (70+ endpoints)
- [Implementation Roadmap](#14-implementation-phases) - Phase 1, 2 & 3 plans

**For Product Managers:**
- [Executive Summary](#1-executive-summary) - Business case
- [User Stories](#5-user-stories) - Feature requirements (98 total)
- [Success Metrics](#15-success-metrics) - KPIs

**For Stakeholders:**
- [Problem Statement](#2-problem-statement) - What we're solving
- [Goals & Objectives](#3-goals--objectives) - Expected outcomes
- [Enterprise Features](#18-enterprise-helpdesk-features) - NEW v4.0 features

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
18. [Enterprise Helpdesk Features (v4.0)](#18-enterprise-helpdesk-features-v40)

---

## 1. Executive Summary

### 1.1 Purpose

Build a **comprehensive enterprise helpdesk platform** as an isolated module within FibreFlow to manage:
- Fiber network issues, faults, and maintenance requests
- **405+ concurrent work items** across 7 workflow types
- Automated weekly batch imports (4,836 items/year)
- Multi-step verification workflows (12-step quality gates)
- Guarantee period management (eliminate billing disputes)
- Real-time WhatsApp communication (achieve 100% notification compliance)
- **Enterprise helpdesk capabilities** (Zendesk/Freshdesk-class features)

**Key Insight:** This is not just a ticketing system - it's a **unified operational platform** with enterprise-grade helpdesk capabilities:
1. Maintenance tickets (QContact) - 316 active items
2. Weekly non-invoiceable reports - 93 items/week
3. Reconciliation verification - 16 items with 12-step checks
4. ONT swap tracking - Hardware lifecycle
5. Incident reports - 2026 requirement
6. Revenue tickets - Capacity-based
7. **Omnichannel communications** - Unified inbox across all channels

### 1.2 Scope

**Phase 1 - Core Ticketing (v3.0):**
- Multi-source ticket aggregation (7 sources)
- Weekly Excel import automation
- QContact bidirectional sync
- Verification workflow (12-step)
- Guarantee period management
- WhatsApp auto-notifications
- DR number auto-lookup
- SLA tracking and notifications
- Unified dashboard

**Phase 2 - Enterprise Helpdesk Core (v4.0 NEW):**
- Unified inbox (omnichannel)
- Internal knowledge base
- Advanced SLA & escalation engine
- Canned response templates
- Performance reporting
- Workflow automation

**Phase 3 - Enterprise Helpdesk Advanced (v4.0 NEW):**
- AI-powered routing
- WhatsApp chatbot triage
- Custom dashboard builder
- Trend forecasting

**Out of Scope:**
- CREATE tickets in QContact (read-only import, update status only)
- Customer self-service portal (future phase)
- Inventory management (separate module)
- Financial ERP integration (separate project)

### 1.3 Key Benefits

**Operational Efficiency:**
- 200+ hours/year saved - Weekly import automation
- 80+ hours/year saved - WhatsApp notification automation
- >95% billing accuracy - Guarantee classification automation
- Single dashboard - Replace 6 parallel spreadsheets

**Enterprise Helpdesk Value (v4.0):**
- Unified inbox - All channels in one view
- Knowledge management - Capture and reuse solutions
- SLA excellence - Multi-tier policies with breach prevention
- Data-driven decisions - Comprehensive analytics
- Automation - Reduce manual repetitive tasks

---

## 2. Problem Statement

### 2.1 Current State

**Operational Reality:**
- 6 parallel Excel spreadsheets tracking different workflow types
- 4-6 hours/week spent on manual weekly report imports
- Manual "7/12" verification tracking with no automation
- 44% WhatsApp notification compliance (should be 100%)
- 5% QContact sync failure rate causing client escalations
- 100% manual guarantee classification leading to billing disputes
- No unified view of all concurrent work items

**Enterprise Gap (v4.0 addresses):**
- No unified inbox - switching between multiple systems
- Knowledge not captured - solutions rediscovered repeatedly
- Basic SLA - no escalation automation
- No canned responses - typing same messages repeatedly
- Limited reporting - no trend analysis or forecasting

### 2.2 Pain Points by Stakeholder

| Stakeholder | Pain Point | Impact | v4.0 Solution |
|-------------|------------|--------|---------------|
| VF Admin | 4-6 hours/week manual Excel imports | 200+ hours/year wasted | Weekly import automation |
| VF Admin | Switching between 5 systems | Time waste, context loss | Unified inbox |
| VF Admin | Typing same responses repeatedly | 50+ hours/year wasted | Canned responses |
| VF Technician | No mobile-friendly verification | Quality inconsistency | Mobile checklist |
| VF Technician | Can't find previous solutions | Reinventing wheel | Knowledge base |
| QA Team | Manual "7/12" progress tracking | Cannot enforce quality gates | Verification workflow |
| VF Management | No unified dashboard | Poor operational visibility | Enterprise dashboard |
| VF Management | No performance metrics | Can't optimize operations | Analytics suite |
| Contractors | Late notification of QA rejections | Rework delays | Auto-escalation |

---

## 3. Goals & Objectives

### 3.1 Primary Goals (Phase 1 - Core)

| Goal | Metric | Baseline | Target |
|------|--------|----------|--------|
| Reduce weekly import time | Hours per import | 4-6 hours | <15 minutes |
| Improve QContact sync | % successful syncs | 95% | 100% |
| Improve WhatsApp compliance | % notifications sent | 44% | 100% |
| Automate billing classification | % auto-classified | 0% | >95% |
| Enforce verification workflow | % using checklist | 0% | 100% |

### 3.2 Enterprise Goals (Phase 2 & 3 - v4.0 NEW)

| Goal | Metric | Baseline | Target |
|------|--------|----------|--------|
| Unified communications | Systems to check | 5 | 1 |
| Knowledge reuse | Solutions from KB | 0% | >50% |
| SLA breach prevention | Breaches prevented | 0% | >80% |
| Response time (templates) | Avg response time | 15 min | 5 min |
| Agent performance visibility | Metrics tracked | 3 | 15+ |
| Workflow automation | Manual actions automated | 0% | >60% |

---

## 4. User Personas

### 4.1 VF Admin (Sarah) - PRIMARY USER

**Role:** Office-based administrator
**Daily Tasks:**
- Import weekly non-invoiceable reports (93 items)
- Triage incoming QContact tickets (5-10/day)
- Assign tickets to technicians/teams
- Track SLA compliance
- Send WhatsApp notifications
- Monitor guarantee periods
- Generate billing reports
- **v4.0:** Manage unified inbox, use canned responses, configure workflows

**Needs (v4.0 Enhanced):**
- Unified inbox for all channels
- Canned response templates
- One-click escalation
- Performance dashboards

### 4.2 VF Field Technician (Thabo) - KEY USER

**Role:** On-site fiber technician
**Daily Tasks:**
- Receive ticket assignments via WhatsApp
- Complete verification checklist (12 steps)
- Upload photos to SharePoint
- Record fiber power level measurements
- Mark tickets as resolved
- **v4.0:** Search knowledge base for solutions

**Needs (v4.0 Enhanced):**
- Searchable knowledge base
- Solution article suggestions
- Mobile-friendly KB access

### 4.3 QA Team Lead (Marcus) - APPROVER

**Role:** Quality assurance and verification
**Daily Tasks:**
- Review completed verifications (12/12)
- Approve or reject work
- Provide rejection feedback
- Track contractor performance
- **v4.0:** Monitor SLA compliance, review performance metrics

**Needs (v4.0 Enhanced):**
- Advanced SLA monitoring
- Contractor scorecards
- Trend analysis reports

### 4.4 VF Management (Director) - DECISION MAKER

**Role:** Operations oversight
**Daily Tasks:**
- Monitor SLA compliance
- Review operational dashboards
- Track contractor performance
- Make strategic decisions
- **v4.0:** Custom dashboards, forecasting, performance analytics

**Needs (v4.0 Enhanced):**
- Custom dashboard builder
- Trend forecasting
- Export reports for board meetings

---

## 5. User Stories

### 5.1 Core Ticketing (Phase 1) - 65 Stories

*(Preserved from PRD v3.0 - see original document for full list)*

**Categories:**
- Ticket Creation & Management (US-001 to US-010)
- Weekly Report Import (US-WR-001 to US-WR-006)
- Verification Workflow (US-VER-001 to US-VER-009)
- Guarantee Period Management (US-GUA-001 to US-GUA-006)
- QContact Integration (US-QC-001 to US-QC-005)
- WhatsApp Auto-Notification (US-WA-001 to US-WA-004)
- SLA Management (US-020 to US-024)
- Search & Reporting (US-040 to US-044)

### 5.2 Omnichannel Support (v4.0 NEW) - US-OC Series

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-OC-001 | VF Admin | view all incoming tickets in one unified inbox regardless of source | I don't switch between 5 different screens | Must |
| US-OC-002 | VF Admin | see the original channel badge on each ticket | I know where it came from at a glance | Must |
| US-OC-003 | VF Admin | click "Reply" and have it go to the originating channel | I don't manually copy-paste between systems | Should |
| US-OC-004 | VF Admin | see all communications for a DR number as a single conversation | I have full context when troubleshooting | Must |
| US-OC-005 | VF Admin | merge duplicate tickets from different channels | data is consolidated and not duplicated | Could |

### 5.3 Knowledge Base (v4.0 NEW) - US-KB Series

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-KB-001 | VF Admin | create KB articles documenting common issues and solutions | technicians have quick access to procedures | Must |
| US-KB-002 | VF Technician | search the KB while working on a ticket | I find solutions without calling support | Must |
| US-KB-003 | VF Technician | link a KB article when resolving a ticket | we track which solutions work | Must |
| US-KB-004 | VF Management | see which KB articles are most used | I know what issues are common | Should |
| US-KB-005 | System | suggest relevant articles when viewing ticket | technicians find solutions faster | Should |
| US-KB-006 | VF Admin | categorize articles by equipment type | articles are easy to find | Must |

### 5.4 SLA & Escalation (v4.0 NEW) - US-SLA Series

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-SLA-001 | VF Management | configure different SLAs for different ticket combinations | response times match business needs | Must |
| US-SLA-002 | VF Admin | pause SLA timer when waiting for client | SLA is fair when blocked externally | Must |
| US-SLA-003 | VF Team Lead | receive notification at 75% SLA | I can intervene before breach | Must |
| US-SLA-004 | VF Management | receive notification at 90% SLA | I can escalate critical tickets | Must |
| US-SLA-005 | System | auto-escalate ticket when tech is overloaded | breaches are prevented automatically | Should |
| US-SLA-006 | VF Management | view SLA breach history and trends | I identify systematic issues | Must |
| US-SLA-007 | VF Admin | configure business hours for SLA calculation | timer stops outside work hours | Should |

### 5.5 Reporting & Analytics (v4.0 NEW) - US-RPT Series

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-RPT-001 | VF Management | see contractor performance scorecards | I make informed decisions about contracts | Must |
| US-RPT-002 | VF Management | compare technician performance side-by-side | I identify top and struggling performers | Must |
| US-RPT-003 | VF Management | view resolution time trends over time | I track operational improvement | Should |
| US-RPT-004 | VF Team Lead | see my team's workload and SLA status | I balance assignments effectively | Must |
| US-RPT-005 | VF Admin | export monthly reports for client meetings | I provide data for contract reviews | Should |
| US-RPT-006 | VF Management | see forecasted ticket volume | I plan resource allocation | Could |
| US-RPT-007 | VF Management | create custom dashboard with my preferred metrics | I see what matters most to me | Should |

### 5.6 Automation (v4.0 NEW) - US-AUTO Series

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-AUTO-001 | VF Admin | use canned responses with one click | I respond faster to common issues | Must |
| US-AUTO-002 | System | auto-categorize tickets based on description | tickets are routed correctly without manual triage | Should |
| US-AUTO-003 | System | suggest best assignee based on skills and workload | assignments are optimized automatically | Should |
| US-AUTO-004 | VF Admin | configure workflow rules (IF event THEN action) | routine tasks happen automatically | Must |
| US-AUTO-005 | System | extract DR numbers from WhatsApp messages | tickets are created automatically from field reports | Should |
| US-AUTO-006 | VF Admin | manage a triage queue for ambiguous messages | nothing falls through the cracks | Must |
| US-AUTO-007 | System | auto-respond when DR number detected in WhatsApp | field staff get immediate acknowledgment | Could |
| US-AUTO-008 | VF Admin | see workflow execution logs | I troubleshoot automation issues | Must |

---

## 6. Functional Requirements

### 6.1 Core Ticketing (Phase 1)

*(Preserved from PRD v3.0 - FR-001 to FR-080, FR-BIL-010, FR-QC-010, FR-WA-010)*

### 6.2 Omnichannel Support (v4.0 NEW) - FR-OC Series

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-OC-001 | System SHALL provide a unified inbox view combining all 7 ticket sources in a single stream | Must |
| FR-OC-002 | System SHALL support channel-agnostic ticket handling (same actions regardless of source) | Must |
| FR-OC-003 | System SHALL maintain conversation threading across channels for same DR number | Must |
| FR-OC-004 | System SHALL display channel-specific icons/badges in unified view | Must |
| FR-OC-005 | System SHALL support quick-reply to originating channel from unified inbox | Should |
| FR-OC-006 | System SHALL aggregate DR-based conversations across all channels chronologically | Must |
| FR-OC-007 | System SHALL support "merge tickets" for duplicate reports across channels | Could |

### 6.3 Knowledge Base (v4.0 NEW) - FR-KB Series

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-KB-001 | Admin SHALL create/edit KB articles with rich text and images | Must |
| FR-KB-002 | System SHALL categorize articles by: Issue Type, Equipment, Zone, Project | Must |
| FR-KB-003 | System SHALL support full-text search across all KB articles | Must |
| FR-KB-004 | System SHALL allow linking KB articles to tickets as "solution applied" | Must |
| FR-KB-005 | System SHALL track article usage (views, linked tickets) for analytics | Should |
| FR-KB-006 | System SHALL suggest relevant KB articles based on ticket type/description | Should |
| FR-KB-007 | System SHALL support article versioning with change history | Could |
| FR-KB-008 | System SHALL support internal-only visibility (no customer access) | Must |

### 6.4 Advanced SLA & Escalation (v4.0 NEW) - FR-SLA Series

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SLA-001 | Admin SHALL configure SLA tiers by: Priority + Type + Source combination | Must |
| FR-SLA-002 | System SHALL support multiple response metrics: First Response, Update Interval, Resolution | Must |
| FR-SLA-003 | System SHALL calculate SLA countdown excluding non-business hours (configurable) | Should |
| FR-SLA-004 | System SHALL support "pause SLA" when ticket blocked externally | Must |
| FR-SLA-005 | System SHALL define escalation rules with configurable triggers | Must |
| FR-SLA-006 | System SHALL auto-escalate ticket assignment based on SLA risk | Should |
| FR-SLA-007 | System SHALL send breach prevention notifications at configurable thresholds | Must |
| FR-SLA-008 | System SHALL maintain SLA breach history for reporting | Must |
| FR-SLA-009 | System SHALL support "priority override" for VIP drops/projects | Could |

### 6.5 Reporting & Analytics (v4.0 NEW) - FR-RPT Series

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RPT-001 | System SHALL track tickets handled, resolved, breached per technician/contractor | Must |
| FR-RPT-002 | System SHALL calculate average resolution time per technician | Must |
| FR-RPT-003 | System SHALL track first response time per agent | Must |
| FR-RPT-004 | System SHALL track verification completion rate per contractor | Must |
| FR-RPT-005 | System SHALL track guarantee work percentage per contractor | Must |
| FR-RPT-006 | System SHALL provide trend analysis (week-over-week, month-over-month) | Should |
| FR-RPT-007 | System SHALL support custom date range filtering on all reports | Must |
| FR-RPT-008 | System SHALL export reports to PDF and Excel | Should |
| FR-RPT-009 | System SHALL provide customizable dashboards per role | Should |
| FR-RPT-010 | System SHALL forecast workload based on historical trends | Could |

### 6.6 Automation Features (v4.0 NEW) - FR-AUTO Series

#### AI-Powered Routing

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTO-001 | System SHALL auto-categorize ticket type based on description keywords | Must |
| FR-AUTO-002 | System SHALL suggest assignee based on: skill match, current workload, zone proximity | Must |
| FR-AUTO-003 | System SHALL learn from historical assignments to improve suggestions | Could |
| FR-AUTO-004 | System SHALL auto-populate zone/project from DR number lookup | Must |
| FR-AUTO-005 | Admin SHALL configure routing rules by keywords, ticket type, zone | Should |

#### Canned Responses

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTO-010 | System SHALL support canned response templates with variable substitution | Must |
| FR-AUTO-011 | Admin SHALL create/edit/delete canned responses | Must |
| FR-AUTO-012 | System SHALL categorize responses by: use case, channel, ticket type | Should |
| FR-AUTO-013 | System SHALL track canned response usage for optimization | Could |
| FR-AUTO-014 | User SHALL insert canned response with one click, then customize | Must |

#### Workflow Automation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTO-020 | Admin SHALL configure workflow rules: IF [event] THEN [action] | Must |
| FR-AUTO-021 | System SHALL support events: status_change, assignment, SLA_threshold, verification_complete | Must |
| FR-AUTO-022 | System SHALL support actions: send_notification, update_field, create_task, call_webhook | Must |
| FR-AUTO-023 | System SHALL execute workflows in order with dependency handling | Should |
| FR-AUTO-024 | System SHALL log all workflow executions for debugging | Must |

#### Chatbot/WhatsApp Triage

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTO-030 | System SHALL receive inbound WhatsApp messages via WAHA webhook | Must |
| FR-AUTO-031 | System SHALL extract DR number from WhatsApp message using regex | Must |
| FR-AUTO-032 | System SHALL auto-respond with acknowledgment when DR detected | Should |
| FR-AUTO-033 | System SHALL route ambiguous messages to human triage queue | Must |
| FR-AUTO-034 | System SHALL support basic status inquiry via WhatsApp | Could |

---

## 7. Non-Functional Requirements

### 7.1 Performance

- Page load time: <2 seconds for dashboard
- Unified inbox load: <1 second for 100 items
- Search results: <500ms for ticket search
- KB search: <300ms for article search
- Excel import: <15 minutes for 93 items
- QContact sync: <5 minutes for status updates
- WhatsApp notification: <1 minute delivery

### 7.2 Scalability

- Support 10,000+ tickets in database
- Support 1,000+ KB articles
- Handle 100 concurrent users
- Process 500 weekly report items (future growth)
- Store 100,000+ conversation messages

### 7.3 Availability

- 99.5% uptime (excluding planned maintenance)
- Graceful degradation if QContact API unavailable
- Offline-capable mobile app (Phase 3)

---

## 8. Data Model

### 8.1 Core Tables (Phase 1 - 8 Tables)

*(Preserved from PRD v3.0)*

1. `tickets` - Core ticket table with v3.0 enhancements
2. `verification_steps` - 12-step verification tracking
3. `weekly_reports` - Import batch tracking
4. `qcontact_sync_log` - Bidirectional sync audit
5. `guarantee_periods` - Guarantee configuration
6. `whatsapp_notifications` - Notification delivery tracking
7. `ticket_attachments` - File metadata
8. `ticket_notes` - Internal/client notes

### 8.2 Enterprise Tables (v4.0 NEW - 16 Tables)

#### Conversation Threading

```sql
-- conversation_threads: Unified threading by DR number
CREATE TABLE conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dr_number VARCHAR(50) NOT NULL,
  project_id UUID REFERENCES projects(id),
  primary_ticket_id UUID REFERENCES tickets(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  channel_count INTEGER DEFAULT 1,
  participants JSONB DEFAULT '[]'
);

CREATE INDEX idx_conversation_threads_dr ON conversation_threads(dr_number);

-- conversation_messages: Channel-agnostic message log
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES conversation_threads(id),
  ticket_id UUID REFERENCES tickets(id),
  channel VARCHAR(20) NOT NULL,
  channel_message_id VARCHAR(255),
  direction VARCHAR(10) NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  content TEXT,
  attachments JSONB DEFAULT '[]',
  sender_type VARCHAR(20),
  sender_id VARCHAR(255),
  sender_name VARCHAR(255),
  sent_at TIMESTAMP NOT NULL,
  received_at TIMESTAMP DEFAULT NOW(),

  CHECK (channel IN ('qcontact', 'whatsapp', 'email', 'internal', 'construction', 'adhoc')),
  CHECK (direction IN ('inbound', 'outbound'))
);

CREATE INDEX idx_conversation_messages_thread ON conversation_messages(thread_id, sent_at DESC);
```

#### Knowledge Base

```sql
-- kb_categories: Article categories
CREATE TABLE kb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  parent_id UUID REFERENCES kb_categories(id),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- kb_articles: Knowledge base articles
CREATE TABLE kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_uid VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  summary TEXT,
  content TEXT NOT NULL,
  category_id UUID REFERENCES kb_categories(id),
  tags TEXT[] DEFAULT '{}',
  applicable_ticket_types TEXT[] DEFAULT '{}',
  applicable_equipment TEXT[] DEFAULT '{}',
  applicable_projects UUID[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'draft',
  visibility VARCHAR(20) DEFAULT 'internal',
  version INTEGER DEFAULT 1,
  view_count INTEGER DEFAULT 0,
  linked_ticket_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  published_at TIMESTAMP,

  CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX idx_kb_articles_category ON kb_articles(category_id);
CREATE INDEX idx_kb_articles_status ON kb_articles(status);
CREATE INDEX idx_kb_articles_tags ON kb_articles USING GIN (tags);
CREATE INDEX idx_kb_articles_search ON kb_articles USING GIN (
  to_tsvector('english', title || ' ' || COALESCE(summary, '') || ' ' || content)
);

-- kb_article_versions: Version history
CREATE TABLE kb_article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES kb_articles(id),
  version INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  change_notes TEXT,
  UNIQUE(article_id, version)
);

-- ticket_kb_links: Article-ticket links
CREATE TABLE ticket_kb_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  article_id UUID NOT NULL REFERENCES kb_articles(id),
  linked_by UUID REFERENCES users(id),
  linked_at TIMESTAMP DEFAULT NOW(),
  link_type VARCHAR(20) DEFAULT 'solution_applied',
  effectiveness VARCHAR(20),
  notes TEXT,
  UNIQUE(ticket_id, article_id)
);
```

#### SLA & Escalation

```sql
-- sla_policies: Multi-tier SLA configuration
CREATE TABLE sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  applies_to_priority TEXT[],
  applies_to_type TEXT[],
  applies_to_source TEXT[],
  applies_to_project UUID[],
  first_response_target INTEGER,
  update_interval_target INTEGER,
  resolution_target INTEGER NOT NULL,
  business_hours_only BOOLEAN DEFAULT true,
  business_start TIME DEFAULT '08:00',
  business_end TIME DEFAULT '18:00',
  business_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  priority_order INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- escalation_rules: Escalation triggers and actions
CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sla_policy_id UUID NOT NULL REFERENCES sla_policies(id),
  trigger_type VARCHAR(30) NOT NULL,
  trigger_threshold INTEGER NOT NULL,
  action_type VARCHAR(30) NOT NULL,
  notify_roles TEXT[] DEFAULT '{}',
  notify_users UUID[] DEFAULT '{}',
  notify_channels TEXT[] DEFAULT '{}',
  reassign_to_team UUID,
  reassign_to_user UUID,
  escalate_to_priority VARCHAR(10),
  notification_template TEXT,
  is_active BOOLEAN DEFAULT true,
  execution_order INTEGER DEFAULT 100,

  CHECK (trigger_type IN ('sla_percent', 'time_elapsed', 'status_stale', 'breach')),
  CHECK (action_type IN ('notify', 'reassign', 'escalate_priority', 'notify_and_reassign'))
);

-- sla_breaches: Breach history for analysis
CREATE TABLE sla_breaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  sla_policy_id UUID REFERENCES sla_policies(id),
  breach_type VARCHAR(30) NOT NULL,
  target_minutes INTEGER NOT NULL,
  actual_minutes INTEGER NOT NULL,
  exceeded_by_minutes INTEGER NOT NULL,
  breach_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  assigned_to UUID REFERENCES users(id),
  assigned_contractor UUID REFERENCES contractors(id),
  root_cause VARCHAR(50),
  notes TEXT,

  CHECK (breach_type IN ('first_response', 'update_interval', 'resolution'))
);

CREATE INDEX idx_sla_breaches_ticket ON sla_breaches(ticket_id);
CREATE INDEX idx_sla_breaches_date ON sla_breaches(breach_timestamp DESC);
```

#### Reporting & Analytics

```sql
-- performance_snapshots: Daily aggregation for analytics
CREATE TABLE performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  subject_type VARCHAR(20) NOT NULL,
  subject_id VARCHAR(255),
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(snapshot_date, subject_type, subject_id)
);

CREATE INDEX idx_performance_snapshots_date ON performance_snapshots(snapshot_date DESC);
CREATE INDEX idx_performance_snapshots_subject ON performance_snapshots(subject_type, subject_id);

-- custom_dashboards: User dashboard configurations
CREATE TABLE custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  layout JSONB NOT NULL DEFAULT '[]',
  widgets JSONB NOT NULL DEFAULT '[]',
  filters JSONB DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  shared_with_roles TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- saved_reports: Report definitions with scheduling
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}',
  is_scheduled BOOLEAN DEFAULT false,
  schedule_cron VARCHAR(100),
  schedule_recipients TEXT[] DEFAULT '{}',
  schedule_format VARCHAR(10) DEFAULT 'pdf',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  last_run_at TIMESTAMP
);
```

#### Automation

```sql
-- canned_responses: Response templates
CREATE TABLE canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  shortcode VARCHAR(20) UNIQUE,
  subject_template VARCHAR(255),
  body_template TEXT NOT NULL,
  category VARCHAR(50),
  applicable_channels TEXT[] DEFAULT '{}',
  applicable_ticket_types TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  visibility VARCHAR(20) DEFAULT 'team',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- workflow_rules: Automation rule definitions
CREATE TABLE workflow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(50) NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  run_async BOOLEAN DEFAULT true,
  stop_on_error BOOLEAN DEFAULT false,
  priority_order INTEGER DEFAULT 100,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- workflow_executions: Automation audit log
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES workflow_rules(id),
  ticket_id UUID REFERENCES tickets(id),
  trigger_event VARCHAR(50) NOT NULL,
  trigger_data JSONB,
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  action_results JSONB DEFAULT '[]',
  error_message TEXT,

  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial'))
);

CREATE INDEX idx_workflow_executions_rule ON workflow_executions(rule_id);
CREATE INDEX idx_workflow_executions_ticket ON workflow_executions(ticket_id);

-- skill_profiles: For AI routing
CREATE TABLE skill_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  contractor_id UUID REFERENCES contractors(id),
  skills JSONB NOT NULL DEFAULT '{}',
  max_concurrent_tickets INTEGER DEFAULT 10,
  current_ticket_count INTEGER DEFAULT 0,
  avg_resolution_minutes INTEGER,
  satisfaction_score DECIMAL(3,2),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT one_subject CHECK (
    (user_id IS NOT NULL AND contractor_id IS NULL) OR
    (user_id IS NULL AND contractor_id IS NOT NULL)
  )
);
```

#### Tickets Table Additions (v4.0)

```sql
-- Add to existing tickets table
ALTER TABLE tickets ADD COLUMN sla_policy_id UUID REFERENCES sla_policies(id);
ALTER TABLE tickets ADD COLUMN sla_paused BOOLEAN DEFAULT false;
ALTER TABLE tickets ADD COLUMN sla_paused_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN sla_paused_reason TEXT;
ALTER TABLE tickets ADD COLUMN sla_elapsed_minutes INTEGER DEFAULT 0;
ALTER TABLE tickets ADD COLUMN first_response_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN last_update_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN thread_id UUID REFERENCES conversation_threads(id);
```

---

## 9. API Specification

### 9.1 Core APIs (Phase 1 - 35 Endpoints)

*(Preserved from PRD v3.0)*

### 9.2 Enterprise APIs (v4.0 NEW - 35+ Endpoints)

#### Omnichannel APIs

```
GET    /api/ticketing/inbox                    # Unified inbox (all channels)
GET    /api/ticketing/conversations            # List conversation threads
GET    /api/ticketing/conversations/{id}       # Get thread with messages
POST   /api/ticketing/conversations/{id}/reply # Reply to conversation
POST   /api/ticketing/tickets/merge            # Merge duplicate tickets
```

#### Knowledge Base APIs

```
GET    /api/ticketing/kb/articles              # List articles (with search)
GET    /api/ticketing/kb/articles/{id}         # Get article detail
POST   /api/ticketing/kb/articles              # Create article
PUT    /api/ticketing/kb/articles/{id}         # Update article
DELETE /api/ticketing/kb/articles/{id}         # Archive article
GET    /api/ticketing/kb/categories            # List categories
POST   /api/ticketing/kb/categories            # Create category
GET    /api/ticketing/kb/suggest               # Get suggested articles for ticket
POST   /api/ticketing/kb/link                  # Link article to ticket
GET    /api/ticketing/kb/stats                 # Article usage statistics
```

#### SLA & Escalation APIs

```
GET    /api/ticketing/sla/policies             # List SLA policies
POST   /api/ticketing/sla/policies             # Create policy
PUT    /api/ticketing/sla/policies/{id}        # Update policy
DELETE /api/ticketing/sla/policies/{id}        # Delete policy
GET    /api/ticketing/sla/escalation-rules     # List escalation rules
POST   /api/ticketing/sla/escalation-rules     # Create rule
PUT    /api/ticketing/sla/escalation-rules/{id} # Update rule
POST   /api/ticketing/tickets/{id}/pause-sla   # Pause SLA timer
POST   /api/ticketing/tickets/{id}/resume-sla  # Resume SLA timer
GET    /api/ticketing/sla/breaches             # List breaches (with filters)
GET    /api/ticketing/sla/compliance           # SLA compliance summary
```

#### Reporting APIs

```
GET    /api/ticketing/reports/performance      # Performance metrics
GET    /api/ticketing/reports/sla-compliance   # SLA compliance report
GET    /api/ticketing/reports/workload         # Workload distribution
GET    /api/ticketing/reports/guarantee        # Guarantee work analysis
GET    /api/ticketing/reports/trends           # Trend analysis
POST   /api/ticketing/reports/export           # Export report (PDF/Excel)
GET    /api/ticketing/dashboards               # List custom dashboards
POST   /api/ticketing/dashboards               # Create dashboard
PUT    /api/ticketing/dashboards/{id}          # Update dashboard
DELETE /api/ticketing/dashboards/{id}          # Delete dashboard
GET    /api/ticketing/reports/saved            # List saved reports
POST   /api/ticketing/reports/saved            # Save report definition
```

#### Automation APIs

```
GET    /api/ticketing/canned-responses         # List templates
POST   /api/ticketing/canned-responses         # Create template
PUT    /api/ticketing/canned-responses/{id}    # Update template
DELETE /api/ticketing/canned-responses/{id}    # Delete template
GET    /api/ticketing/workflow-rules           # List workflow rules
POST   /api/ticketing/workflow-rules           # Create rule
PUT    /api/ticketing/workflow-rules/{id}      # Update rule
DELETE /api/ticketing/workflow-rules/{id}      # Delete rule
GET    /api/ticketing/workflow-rules/{id}/logs # Get execution history
POST   /api/ticketing/ai/categorize            # Auto-categorize ticket
GET    /api/ticketing/ai/suggest-assignee      # Get assignment suggestions
```

#### Chatbot/WhatsApp APIs

```
POST   /api/ticketing/webhooks/whatsapp        # WAHA webhook receiver
GET    /api/ticketing/triage-queue             # Messages pending triage
POST   /api/ticketing/triage-queue/{id}/assign # Convert message to ticket
POST   /api/ticketing/triage-queue/{id}/dismiss # Dismiss message
```

---

## 10. UI/UX Requirements

### 10.1 Core Pages (Phase 1)

*(Preserved from PRD v3.0)*

- Dashboard: `/ticketing`
- Weekly Import: `/ticketing/import`

### 10.2 Enterprise Pages (v4.0 NEW - 12 Pages)

| Page | Path | Phase | Description |
|------|------|-------|-------------|
| Unified Inbox | `/ticketing/inbox` | 2 | Channel-agnostic ticket stream |
| Conversation View | `/ticketing/conversations/{id}` | 2 | Thread-based view for DR |
| Knowledge Base | `/ticketing/kb` | 2 | Article listing and search |
| Article Editor | `/ticketing/kb/editor/{id}` | 2 | Create/edit KB articles |
| SLA Configuration | `/ticketing/settings/sla` | 2 | Configure SLA policies |
| Escalation Rules | `/ticketing/settings/escalation` | 2 | Configure escalation rules |
| Performance Dashboard | `/ticketing/reports/performance` | 2 | Agent/contractor metrics |
| SLA Compliance | `/ticketing/reports/sla` | 2 | SLA tracking and breaches |
| Canned Responses | `/ticketing/settings/responses` | 2 | Manage response templates |
| Workflow Builder | `/ticketing/settings/workflows` | 3 | Configure automation rules |
| Triage Queue | `/ticketing/triage` | 3 | Messages pending conversion |
| Dashboard Builder | `/ticketing/dashboards/builder` | 3 | Create custom dashboards |

### 10.3 Component Specifications

```
src/modules/ticketing/components/
├── UnifiedInbox/
│   ├── InboxList.tsx           # Main inbox list
│   ├── InboxItem.tsx           # Individual ticket item
│   ├── ChannelBadge.tsx        # Channel indicator (QContact, WhatsApp, etc.)
│   └── InboxFilters.tsx        # Filter controls
│
├── Conversation/
│   ├── ConversationThread.tsx  # Full conversation view
│   ├── MessageItem.tsx         # Individual message
│   └── QuickReply.tsx          # Reply composer
│
├── KnowledgeBase/
│   ├── ArticleList.tsx         # KB listing
│   ├── ArticleSearch.tsx       # Search component
│   ├── ArticleDetail.tsx       # Full article view
│   ├── ArticleEditor.tsx       # Rich text editor
│   ├── ArticleSuggestions.tsx  # AI-suggested articles
│   └── CategoryTree.tsx        # Category navigation
│
├── SLA/
│   ├── SLACountdown.tsx        # Timer display
│   ├── SLAPolicyList.tsx       # Policy configuration
│   ├── EscalationRuleBuilder.tsx # Rule configuration
│   ├── SLABreachAlert.tsx      # Breach notification
│   └── SLAPauseControl.tsx     # Pause/resume controls
│
├── Reports/
│   ├── PerformanceScorecard.tsx # Individual performance
│   ├── TeamComparison.tsx      # Side-by-side comparison
│   ├── TrendChart.tsx          # Time-series chart
│   ├── SLAComplianceGauge.tsx  # Compliance percentage
│   └── WorkloadHeatmap.tsx     # Assignment distribution
│
├── Automation/
│   ├── CannedResponsePicker.tsx # Quick-insert templates
│   ├── WorkflowRuleBuilder.tsx # Visual rule builder
│   └── AssignmentSuggestion.tsx # AI suggestions
│
└── Triage/
    ├── TriageQueue.tsx         # Pending messages
    └── QuickTicketCreate.tsx   # Fast ticket creation
```

---

## 11. Integration Points

### 11.1 External Integrations

| System | Type | Direction | Purpose |
|--------|------|-----------|---------|
| QContact | REST API | Bidirectional | Fetch tickets, update status |
| WhatsApp (WAHA) | REST API | Bidirectional | Send notifications, receive messages |
| Email | SMTP | Inbound | Parse tickets@fibreflow.app |

### 11.2 Internal Integrations

| Module | Integration | Purpose |
|--------|-------------|---------|
| SOW Module | Database | DR number lookup |
| Contractors Module | Database | Contractor allocation, performance |
| Projects Module | Database | Project details, guarantee periods |
| Firebase Storage | File Storage | Photo/document attachments |
| User Management (Clerk) | Auth | Assignment, permissions |

---

## 12. Module Architecture

### 12.1 Directory Structure

```
src/modules/ticketing/
├── types/
│   ├── ticket.ts
│   ├── verification.ts
│   ├── guarantee.ts
│   ├── whatsapp.ts
│   ├── conversation.ts         # NEW v4.0
│   ├── knowledgeBase.ts        # NEW v4.0
│   ├── sla.ts                  # NEW v4.0
│   ├── automation.ts           # NEW v4.0
│   └── reports.ts              # NEW v4.0
├── services/
│   ├── ticketService.ts
│   ├── qcontactService.ts
│   ├── verificationService.ts
│   ├── guaranteeService.ts
│   ├── weeklyReportService.ts
│   ├── whatsappService.ts
│   ├── conversationService.ts  # NEW v4.0
│   ├── knowledgeBaseService.ts # NEW v4.0
│   ├── slaService.ts           # NEW v4.0
│   ├── escalationService.ts    # NEW v4.0
│   ├── automationService.ts    # NEW v4.0
│   ├── reportingService.ts     # NEW v4.0
│   └── triageService.ts        # NEW v4.0
├── components/
│   ├── TicketList.tsx
│   ├── TicketDetail.tsx
│   ├── VerificationChecklist.tsx
│   ├── WeeklyImportWizard.tsx
│   ├── QASyncDashboard.tsx
│   ├── UnifiedInbox/           # NEW v4.0
│   ├── Conversation/           # NEW v4.0
│   ├── KnowledgeBase/          # NEW v4.0
│   ├── SLA/                    # NEW v4.0
│   ├── Reports/                # NEW v4.0
│   ├── Automation/             # NEW v4.0
│   └── Triage/                 # NEW v4.0
├── hooks/
│   ├── useTickets.ts
│   ├── useVerification.ts
│   ├── useGuarantee.ts
│   ├── useConversations.ts     # NEW v4.0
│   ├── useKnowledgeBase.ts     # NEW v4.0
│   ├── useSLA.ts               # NEW v4.0
│   └── useReports.ts           # NEW v4.0
├── utils/
│   ├── drLookup.ts
│   ├── guaranteeCalculator.ts
│   ├── excelParser.ts
│   ├── slaCalculator.ts        # NEW v4.0
│   └── variableSubstitution.ts # NEW v4.0
├── client.ts                   # Client-safe exports
├── index.ts                    # Server exports
└── README.md
```

---

## 13. Security & Permissions

### 13.1 Role-Based Access Control (Enhanced)

| Role | Core | KB Edit | KB View | SLA Config | Reports | Workflows | Triage |
|------|------|---------|---------|------------|---------|-----------|--------|
| Admin | Full | Yes | Yes | Yes | Full | Yes | Yes |
| Manager | Full | Yes | Yes | Yes | Full | View | Yes |
| QA Team | Limited | No | Yes | View | Limited | View | No |
| Technician | Limited | No | Yes | View | Own | No | No |
| Contractor | Limited | No | Yes | No | Own | No | No |

---

## 14. Implementation Phases

### Phase 1: Core Ticketing (10 weeks) - PRD v3.0

**Already defined - see PRD v3.0 MASTER**

- Week 1-2: Foundation (DB, APIs, Auth)
- Week 3-4: QContact Integration
- Week 5-6: Weekly Report Automation
- Week 7-8: Verification Workflow
- Week 9-10: Guarantee + WhatsApp + Dashboard

### Phase 2: Enterprise Helpdesk Core (10 weeks) - v4.0 NEW

| Week | Deliverable | Key Components |
|------|-------------|----------------|
| 1-2 | Unified Inbox | `conversation_threads`, `conversation_messages`, channel badges |
| 3-4 | Knowledge Base | `kb_articles`, `kb_categories`, article editor, search |
| 5-6 | Advanced SLA | `sla_policies`, `escalation_rules`, `sla_breaches`, pause/resume |
| 7-8 | Canned Responses | `canned_responses`, variable substitution, quick-insert |
| 9-10 | Performance Reports | `performance_snapshots`, dashboards, PDF/Excel export |

**Phase 2 Success Criteria:**
- Unified inbox loads all channels in <1 second
- KB search returns results in <300ms
- SLA breach rate reduced by >50%
- Response time reduced by >50% with templates
- Performance reports available for all users

### Phase 3: Enterprise Helpdesk Advanced (10 weeks) - v4.0 NEW

| Week | Deliverable | Key Components |
|------|-------------|----------------|
| 1-2 | AI-Powered Routing | `skill_profiles`, auto-categorization, assignee suggestions |
| 3-4 | Workflow Automation | `workflow_rules`, `workflow_executions`, visual builder |
| 5-6 | WhatsApp Chatbot | WAHA webhook, DR extraction, triage queue |
| 7-8 | Advanced Reporting | Custom dashboard builder, trend forecasting |
| 9-10 | Polish & Optimization | Performance tuning, mobile responsiveness, documentation |

**Phase 3 Success Criteria:**
- >80% tickets auto-categorized correctly
- >60% assignments use AI suggestions
- >90% WhatsApp messages with DR auto-acknowledged
- Custom dashboards created by >50% of managers

---

## 15. Success Metrics

### 15.1 Core Metrics (Phase 1)

| Metric | Baseline | Target |
|--------|----------|--------|
| Weekly import time | 4-6 hours | <15 minutes |
| QContact sync rate | 95% | 100% |
| WhatsApp compliance | 44% | 100% |
| Guarantee auto-classification | 0% | >95% |
| Verification completion | Unknown | >95% |

### 15.2 Enterprise Metrics (v4.0 NEW)

| Metric | Baseline | Target |
|--------|----------|--------|
| Systems to check for tickets | 5 | 1 (unified inbox) |
| Avg response time | 15 min | 5 min (with templates) |
| Solutions from KB | 0% | >50% |
| SLA breaches prevented | 0% | >80% |
| Automated workflow actions | 0% | >60% |
| Agent performance visibility | 3 metrics | 15+ metrics |

---

## 16. Risks & Mitigations

### 16.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| KB search performance | High | Medium | Use PostgreSQL full-text search, add caching |
| SLA calculation complexity | Medium | High | Thorough testing, business hours edge cases |
| Workflow infinite loops | High | Low | Add execution limits, loop detection |
| AI routing accuracy | Medium | Medium | Start with rules, add ML gradually |

### 16.2 Adoption Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| User resistance to unified inbox | Medium | Training, gradual rollout, gather feedback |
| KB not maintained | High | Assign KB owners, track usage, gamification |
| Canned responses become stale | Medium | Usage tracking, periodic review process |

---

## 17. Appendices

### Appendix A: Variable Substitution for Templates

**Available variables for canned responses and notifications:**

```
{ticket_uid}        - Ticket unique ID (e.g., FT406824)
{ticket_title}      - Ticket title
{dr_number}         - DR number
{project_name}      - Project name
{zone}              - Zone name
{address}           - Full address
{technician_name}   - Assigned technician name
{contractor_name}   - Contractor company name
{status}            - Current ticket status
{priority}          - Ticket priority
{created_date}      - Ticket creation date
{due_date}          - SLA due date
{sla_remaining}     - Time remaining on SLA
{verification_progress} - "7/12" progress
{current_user}      - User inserting template
{current_date}      - Today's date
{current_time}      - Current time
```

### Appendix B: Workflow Event Types

```
status_changed      - Ticket status updated
assigned            - Ticket assigned to user/contractor
created             - New ticket created
sla_warning_50      - 50% of SLA elapsed
sla_warning_75      - 75% of SLA elapsed
sla_warning_90      - 90% of SLA elapsed
sla_breach          - SLA breached
verification_complete - All 12 steps completed
qa_approved         - QA approved the work
qa_rejected         - QA rejected the work
note_added          - New note added to ticket
attachment_added    - File attached to ticket
```

### Appendix C: Workflow Action Types

```
send_whatsapp       - Send WhatsApp message
send_email          - Send email notification
send_in_app         - Send in-app notification
update_field        - Update ticket field
update_status       - Change ticket status
update_priority     - Change ticket priority
assign_user         - Assign to specific user
assign_team         - Assign to team
create_task         - Create follow-up task
call_webhook        - Call external webhook
sync_qcontact       - Sync status to QContact
link_kb_article     - Suggest KB article
```

---

## 18. Enterprise Helpdesk Features (v4.0)

### Summary of v4.0 Additions

| Category | New FRs | New User Stories | New Tables | New APIs |
|----------|---------|------------------|------------|----------|
| Omnichannel | 7 | 5 | 2 | 5 |
| Knowledge Base | 8 | 6 | 4 | 10 |
| SLA & Escalation | 9 | 7 | 3 | 11 |
| Reporting | 10 | 7 | 3 | 12 |
| Automation | 34 | 8 | 4 | 12 |
| **Total** | **68** | **33** | **16** | **50+** |

### Comparison: v3.0 vs v4.0

| Aspect | v3.0 | v4.0 |
|--------|------|------|
| User Stories | 65 | 98 (+33) |
| Functional Requirements | ~50 | ~118 (+68) |
| Database Tables | 8 | 24 (+16) |
| API Endpoints | ~35 | ~85 (+50) |
| Pages | 2 | 14 (+12) |
| Implementation Time | 10 weeks | 30 weeks (Phase 1-3) |

---

**Document Status:** Ready for Implementation
**Next Step:** Begin Phase 1 (Core Ticketing) implementation
**Review Date:** After Phase 1 completion
