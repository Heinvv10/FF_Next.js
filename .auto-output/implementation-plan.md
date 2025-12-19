# Ticketing Module - Implementation Plan
**Project:** FibreFlow Next.js
**Feature:** Comprehensive Ticketing System
**Created:** 2025-12-18
**Status:** Planning Complete

---

## Executive Summary

Implementing a production-ready ticketing system as an isolated module following FibreFlow's "Lego block" architecture. The system handles 7 independent ticket sources with unified aggregation, WhatsApp bidirectional communication, QContact integration, and comprehensive billing management.

### Key Features
- **Multi-source aggregation**: 7 independent ticket sources (QContact, WhatsApp, Email, Construction, etc.)
- **Immutable UIDs with mutable categories**: Permanent identifiers with flexible organization
- **Billing automation**: Automatic classification (guarantee/SLA/billable) with approval workflow
- **WhatsApp bridge**: Bidirectional chat integration via WAHA
- **QContact integration**: REST API v2 (READ + UPDATE)
- **SLA management**: Automated tracking with escalation
- **Invoicing integration**: Auto-generate line items

---

## Architecture Principles

### FibreFlow Patterns (from expertise.yaml)
1. **Modular Structure**: `src/modules/ticketing/` - fully isolated
2. **API Response Pattern**: `apiResponse` helper for all API routes
3. **Database**: Direct SQL with Neon serverless (NO ORM)
4. **Layout**: `AppLayout` component with sidebar
5. **No Nested Routes**: Flatten dynamic routes for Vercel compatibility
6. **Database Endpoint**: MUST use `ep-dry-night-a9qyh4sj`

### Quality Standards
- **File Size**: Max 300 lines (components max 200)
- **TypeScript**: Strict mode, full type safety
- **Testing**: >95% coverage (Vitest + Playwright)
- **Validation**: NLNH ≥80%, DGTS ≤30%, Zero Tolerance, No-Mock
- **Error Handling**: apiResponse pattern everywhere
- **No Console Logs**: CRITICAL - will block commits

---

## Implementation Phases

### Phase 1: Foundation (Database + Core Types)
**Duration**: Foundation setup
**Deliverables**:
- Database schema migration (12 tables)
- TypeScript types for all entities
- Database seed data (SLA configs, fee schedules)
- Database helper functions

**Files to Create**:
```
neon/migrations/TIMESTAMP_create_ticketing_tables.sql
src/modules/ticketing/types/index.ts
src/modules/ticketing/types/tickets.ts
src/modules/ticketing/types/billing.ts
src/modules/ticketing/types/sla.ts
scripts/seeds/ticketing-seed.sql
```

**Database Tables** (12 total):
1. `tickets` - Core ticket data
2. `ticket_notes` - Internal/external notes
3. `ticket_attachments` - File uploads
4. `ticket_history` - Audit log
5. `ticket_tags` - Tagging system
6. `sla_configs` - SLA rules
7. `client_contracts` - Client SLA contracts
8. `project_guarantees` - Guarantee periods
9. `billable_fee_schedule` - Fee lookup table
10. `ticket_billing` - Billing metadata
11. `ticket_assignment_history` - Assignment audit
12. `notification_log` - Notification tracking

### Phase 2: API Layer
**Duration**: API implementation
**Deliverables**:
- 25+ API endpoints with apiResponse pattern
- Clerk authentication on all routes
- Request/response validation
- Error handling

**API Endpoints** (flattened for Vercel):
```
pages/api/ticketing/
├── tickets.ts                        # GET, POST (list, create)
├── tickets-[id].ts                   # GET, PATCH, DELETE (single ticket)
├── tickets-assign.ts                 # POST (assign ticket)
├── tickets-status.ts                 # POST (change status)
├── tickets-notes.ts                  # GET, POST (notes)
├── tickets-attachments.ts            # GET, POST (attachments)
├── tickets-history.ts                # GET (audit log)
├── tickets-lookup-drop.ts            # GET (DR number lookup)
├── tickets-stats.ts                  # GET (dashboard metrics)
├── tickets-webhook-qcontact.ts       # POST (QContact webhook)
├── tickets-webhook-whatsapp.ts       # POST (WAHA webhook)
├── tickets-webhook-email.ts          # POST (Email parsing)
├── sla-configs.ts                    # GET, POST (SLA management)
├── contracts.ts                      # GET, POST (list, create contracts)
├── contracts-[id].ts                 # GET, PATCH, DELETE (contract CRUD)
├── guarantees.ts                     # GET, POST (guarantees)
├── guarantees-[projectId].ts         # GET (project guarantee)
├── fee-schedule.ts                   # GET, POST (fee management)
├── billing-pending-approval.ts       # GET (approval queue)
├── billing-approve-[uid].ts          # POST (approve ticket)
├── billing-reject-[uid].ts           # POST (reject ticket)
├── billing-calculate.ts              # GET (calculate billing type)
├── billing-invoice-[uid].ts          # POST (generate invoice)
└── exports-tickets.ts                # GET (CSV/PDF export)
```

### Phase 3: Service Layer
**Duration**: Business logic
**Deliverables**:
- Billing calculator service
- SLA calculator service
- Ticket workflow service
- DR lookup service
- File upload service
- Notification service

**Files**:
```
src/modules/ticketing/services/
├── ticketService.ts          # CRUD operations
├── billingCalculator.ts      # Automatic billing type detection
├── slaCalculator.ts          # SLA due_at calculation
├── drLookupService.ts        # Auto-populate from DR number
├── fileUploadService.ts      # Firebase Storage integration
├── notificationService.ts    # Email/SMS notifications
├── qcontactService.ts        # QContact API client
├── whatsappService.ts        # WAHA API client
└── invoiceService.ts         # External invoicing API
```

### Phase 4: UI Components
**Duration**: Frontend development
**Deliverables**:
- 15+ React components
- Dashboard with metrics
- Ticket CRUD forms
- Billing management UI
- Mobile-responsive design

**Components**:
```
src/modules/ticketing/components/
├── TicketDashboard.tsx       # Main dashboard
├── TicketList.tsx            # Table with filters
├── TicketCard.tsx            # List item component
├── TicketDetail.tsx          # Full ticket view
├── TicketForm.tsx            # Create/edit form
├── TicketStatusBadge.tsx     # Status indicator
├── TicketPriorityBadge.tsx   # Priority indicator
├── TicketTimeline.tsx        # Activity log
├── TicketNotes.tsx           # Notes component
├── TicketAttachments.tsx     # File upload/display
├── SLAIndicator.tsx          # Countdown timer
├── BillingBadge.tsx          # Billing status
├── BillingApprovalQueue.tsx  # Manager approval UI
├── ContractManager.tsx       # Contract CRUD
├── GuaranteeManager.tsx      # Guarantee config
├── FeeScheduleEditor.tsx     # Fee management
└── DRLookupInput.tsx         # Auto-populate from DR
```

### Phase 5: Integration Layer
**Duration**: External integrations
**Deliverables**:
- QContact API integration (READ + UPDATE)
- WhatsApp bridge via WAHA
- Email parsing (tickets@fibreflow.app)
- Invoice generation API

**Files**:
```
src/modules/ticketing/integrations/
├── qcontact/
│   ├── client.ts             # REST API v2 client
│   ├── types.ts              # QContact data models
│   └── webhook.ts            # Incoming ticket handler
├── whatsapp/
│   ├── wahaClient.ts         # WAHA API client
│   ├── messageParser.ts      # Parse incoming messages
│   └── chatBridge.ts         # Bidirectional messaging
├── email/
│   ├── emailParser.ts        # Parse tickets@fibreflow.app
│   └── ticketExtractor.ts    # Extract ticket data
└── invoicing/
    ├── client.ts             # External invoicing API
    └── lineItemGenerator.ts  # Generate invoice items
```

### Phase 6: Testing Suite
**Duration**: Comprehensive testing
**Deliverables**:
- Unit tests (>95% coverage)
- Integration tests (API routes)
- E2E tests with Playwright MCP
- Browser automation tests

**Test Files**:
```
tests/modules/ticketing/
├── unit/
│   ├── billingCalculator.test.ts     # Unit tests
│   ├── slaCalculator.test.ts
│   ├── drLookupService.test.ts
│   └── ticketService.test.ts
├── integration/
│   ├── api-tickets.test.ts           # API integration
│   ├── api-billing.test.ts
│   └── api-contracts.test.ts
└── e2e/
    ├── ticket-creation.spec.ts       # Playwright E2E
    ├── ticket-assignment.spec.ts
    ├── billing-approval.spec.ts
    └── whatsapp-bridge.spec.ts
```

---

## Data Flow Diagrams

### Billing Automation Flow
```
Ticket Created
    ↓
Check DR Number
    ↓
Has DR? → Query drops table for install_date
    ↓
Calculate guarantee_expires_at = install_date + guarantee_period_days
    ↓
current_date < guarantee_expires_at?
    ↓
YES → billing_type = 'guarantee'
NO  → Check client_contracts for active contract
    ↓
Active contract exists?
    ↓
YES → billing_type = 'sla' (apply custom SLA hours)
NO  → billing_type = 'billable'
    ↓
billing_type = 'billable'?
    ↓
YES → Calculate estimated_cost from fee_schedule
    ↓
YES → Set requires_billing_approval = TRUE
    ↓
YES → Set status = 'pending_approval'
```

### Ticket Workflow
```
New Ticket
    ↓
Source Detection
    ├─ QContact → FT{number}
    ├─ WhatsApp → DR{num}-{seq}
    ├─ Email → EML-{number}
    ├─ Construction → DR{num}-{seq}
    ├─ Internal → FF-{number}
    └─ Ad-hoc → AH-{number}
    ↓
Calculate billing_type
    ↓
billing_type = 'billable'?
    ↓
YES → status = 'pending_approval'
NO  → status = 'new'
    ↓
Triaged → Assigned → In Progress → Resolved → Closed
           ↓               ↓
      Reassign      Blocked (pause SLA)
```

### SLA Calculation
```
Ticket Created
    ↓
Look up sla_configs[type][priority]
    ↓
base_hours = sla_config.base_hours
    ↓
due_at = created_at + base_hours
    ↓
business_hours_only?
    ↓
YES → Adjust for business hours (skip weekends/nights)
NO  → Use calendar hours
    ↓
status = 'blocked'?
    ↓
YES → Pause SLA (set sla_paused_at)
NO  → Continue countdown
    ↓
SLA % = (elapsed / total) * 100
    ↓
SLA % > 75%? → Send warning notification
SLA % > 90%? → Escalate to management
SLA breached? → Mark sla_breached = TRUE
```

---

## Critical Integration Points

### 1. QContact API Integration
**Type**: REST API v2 (External)
**Direction**: Bidirectional (READ tickets, UPDATE status)
**Authentication**: API key
**Base URL**: (From Fibertime documentation)

**Implementation**:
```typescript
// src/modules/ticketing/integrations/qcontact/client.ts
export class QContactClient {
  async getTickets(params: QContactFilters): Promise<QContactTicket[]>
  async updateTicketStatus(ticketId: string, status: string): Promise<void>
}

// Webhook handler
// pages/api/ticketing/tickets-webhook-qcontact.ts
// Receives new tickets from QContact
```

### 2. WhatsApp Bridge (WAHA)
**Type**: REST API + Webhook
**Direction**: Bidirectional (send + receive messages)
**Authentication**: API key
**Base URL**: WAHA server

**Implementation**:
```typescript
// src/modules/ticketing/integrations/whatsapp/wahaClient.ts
export class WAHAClient {
  async sendMessage(chatId: string, text: string): Promise<void>
  async sendFile(chatId: string, file: Buffer): Promise<void>
}

// Webhook handler
// pages/api/ticketing/tickets-webhook-whatsapp.ts
// Parses incoming messages, creates tickets
```

### 3. Email Parsing
**Type**: IMAP/POP3 or Webhook (Gmail API)
**Direction**: Inbound only
**Email**: tickets@fibreflow.app

**Implementation**:
```typescript
// src/modules/ticketing/integrations/email/emailParser.ts
export class EmailParser {
  parseTicketFromEmail(email: Email): Ticket
  extractAttachments(email: Email): Attachment[]
}

// Cron job or webhook
// pages/api/ticketing/tickets-webhook-email.ts
```

### 4. Invoicing System
**Type**: REST API (External)
**Direction**: Outbound (create line items)
**Authentication**: API key

**Implementation**:
```typescript
// src/modules/ticketing/integrations/invoicing/client.ts
export class InvoicingClient {
  async createLineItem(data: InvoiceLineItem): Promise<InvoiceResponse>
}
```

---

## File Structure Summary

```
C:\Jarvis\AI Workspace\FF_Next.js\
├── neon/
│   └── migrations/
│       └── TIMESTAMP_create_ticketing_tables.sql  (2,500 lines)
├── scripts/
│   └── seeds/
│       └── ticketing-seed.sql                     (500 lines)
├── pages/api/ticketing/                            (25 files, ~4,000 lines)
├── src/modules/ticketing/
│   ├── types/                                      (4 files, ~800 lines)
│   ├── services/                                   (9 files, ~2,400 lines)
│   ├── integrations/                               (12 files, ~1,800 lines)
│   ├── components/                                 (17 files, ~3,400 lines)
│   ├── hooks/                                      (5 files, ~600 lines)
│   ├── utils/                                      (3 files, ~400 lines)
│   ├── README.md                                   (Documentation)
│   ├── API_CONTRACT.md                             (API documentation)
│   └── ISOLATION_GUIDE.md                          (Module isolation guide)
└── tests/modules/ticketing/
    ├── unit/                                       (8 files, ~1,600 lines)
    ├── integration/                                (6 files, ~1,200 lines)
    └── e2e/                                        (8 files, ~1,600 lines)

TOTAL: ~100 files, ~20,000 lines of code
```

---

## Success Criteria

### Functional Requirements
- ✅ All 7 ticket sources functional
- ✅ Billing automation (guarantee/SLA/billable)
- ✅ SLA tracking with notifications
- ✅ WhatsApp bridge operational
- ✅ QContact integration (READ + UPDATE)
- ✅ Email parsing working
- ✅ Invoicing integration complete

### Quality Gates
- ✅ NLNH confidence ≥80% (no hallucinated code)
- ✅ DGTS gaming score ≤30% (proper implementation)
- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors
- ✅ Zero console.log statements
- ✅ Test coverage >95%
- ✅ No-Mock validator passes (real data only)
- ✅ AntiHall validator passes (all references exist)
- ✅ Playwright E2E tests pass

### Deployment Criteria
- ✅ Deploy to dev.fibreflow.app first
- ✅ Manual testing complete
- ✅ User acceptance sign-off
- ✅ Deploy to app.fibreflow.app

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| QContact API availability | Implement retry logic, queue failed updates |
| WhatsApp WAHA downtime | Fallback to manual ticket entry, queue messages |
| Email parsing failures | Manual review queue, regex fallback patterns |
| Database endpoint wrong | Validation check in CI/CD, expertise.yaml enforcement |
| Nested routes on Vercel | Use flattened routes with query params |
| Mock data in tests | No-Mock validator runs pre-commit, seed scripts required |

---

## Next Steps

1. **Phase 1**: Create database migrations ✅ Ready to start
2. **Phase 2**: Implement API layer (apiResponse pattern)
3. **Phase 3**: Build service layer (business logic)
4. **Phase 4**: Create UI components (React)
5. **Phase 5**: Integrate external systems (QContact, WAHA)
6. **Phase 6**: Comprehensive testing (unit, integration, E2E)
7. **Validation**: Run all quality gates
8. **Deployment**: Dev → Testing → Production

---

**Plan Approved**: Ready for autonomous implementation
**Total Estimated Effort**: ~100 files, ~20,000 lines
**Quality Standard**: Production-ready, fully tested, validated
