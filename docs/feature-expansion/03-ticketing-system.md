# Ticketing System Evaluation for FibreFlow

**Created:** December 17, 2025
**Status:** Research Phase
**Priority:** Urgent

## Requirements for Fiber Network Ticketing

### Ticket Sources

| Source | Description | Auto/Manual |
|--------|-------------|-------------|
| **Fibertime (FT)** | Client flags issues with their fiber service | Auto-import (API) |
| **VF Field Agents** | Technicians report issues (inactive homes, infrastructure) | Manual (app/form) |
| **Preventative** | Internal awareness of potential issues | Manual |
| **Ad-hoc** | Once-off issues from client or staff | Manual |

### Ticket Types

| Type | Example | Typical SLA |
|------|---------|-------------|
| **Build/Fibre** | Construction defects, installation issues | TBD |
| **Fault** | Service down, signal issues | High priority |
| **Infrastructure** | Poles falling, cable damage | Varies |
| **Preventative** | Scheduled maintenance, proactive fixes | Lower priority |
| **Ad-hoc** | Once-off requests | Case-by-case |

### SLA Configuration Requirements
- [ ] Configurable SLA times per ticket type
- [ ] SLA times per priority level
- [ ] SLA escalation rules
- [ ] SLA breach notifications
- [ ] SLA reporting/metrics

### Communication Matrix

**Internal Comms:**
| Event | Notify |
|-------|--------|
| Ticket created | Assigned team/admin |
| Ticket assigned | Assigned technician |
| SLA warning | Team lead + assignee |
| SLA breach | Management |
| Status change | Stakeholders |

**Client Feedback (FT):**
| Event | Action |
|-------|--------|
| Ticket received | Confirmation to FT |
| Work started | Update to FT |
| Resolved | Resolution summary to FT |
| Requires info | Request to FT |

### Delegation Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Admin     │ ──► │  Team Lead  │ ──► │ Technician  │
│  (Triage)   │     │  (Assign)   │     │  (Resolve)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                    Can reassign/escalate
```

### Required Tracking Fields

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `ticket_uid` | VARCHAR | Auto | Unique ID (TKT-2025-00001) |
| `source` | ENUM | Required | fibertime, vf_tech, preventative, adhoc |
| `source_reference` | VARCHAR | Optional | External ticket ID from FT |
| `drop_number` | VARCHAR | Auto-lookup | Links to `drops` table |
| `project_id` | UUID | Auto from DR | Which project |
| `pole_id` | UUID | Auto/Manual | Which pole |
| `pon` | VARCHAR | Manual | PON identifier |
| `zone` | VARCHAR | Auto from DR | Zone/area |
| `address` | TEXT | Auto from DR | Physical location |

### Auto-Linking Logic
```
When DR/Drop number entered:
  → Lookup in `drops` table
  → Auto-populate: project_id, zone, address
  → Lookup related pole_id from `poles` table
  → Link to existing QA data from `qa_photo_reviews`
```

### Must-Have Features
- [ ] Custom ticket types (configurable)
- [ ] Auto-link to DR/drop number → project, pole, zone
- [ ] Photo attachment support (field evidence)
- [ ] Mobile-friendly for field use
- [ ] SLA tracking with configurable times per type
- [ ] Internal delegation (admin ↔ technical)
- [ ] Client feedback loop (FT notifications)
- [ ] Status workflows (Open → Triaged → Assigned → In Progress → QA → Closed)
- [ ] Fibertime API integration for auto-import

### Nice-to-Have
- [ ] Integration with WhatsApp (existing WA Monitor)
- [ ] Map view of tickets by location
- [ ] Contractor performance metrics
- [ ] Automated ticket creation from QA failures
- [ ] Bulk ticket operations
- [ ] Ticket templates for common issues

---

## Open Source Options Evaluated

### Tier 1: Best Fit for FibreFlow Integration

#### 1. **Zammad** ⭐ RECOMMENDED
| Aspect | Details |
|--------|---------|
| **Tech Stack** | Ruby on Rails, PostgreSQL |
| **Stars** | 4.8k |
| **License** | AGPL-3.0 |
| **API** | Full REST API, "API First" design |
| **Integration** | Excellent - all UI operations available via API |

**Pros:**
- Modern, clean UI
- Omnichannel (email, phone, social media, web)
- Full REST API with expand options for related data
- Built-in analytics and reporting
- Flexible permissions and roles
- Active development (created by OTRS developer)

**Cons:**
- Ruby stack (different from FF's Node/TS)
- Would run as separate service
- AGPL license requires code sharing if modified

**Integration Approach:**
- Run Zammad as Docker container alongside FF
- Create FF API routes that proxy to Zammad
- Embed Zammad views in FF via iframe or rebuild UI with API
- Sync tickets with FF drops/locations via custom fields

---

#### 2. **UVdesk**
| Aspect | Details |
|--------|---------|
| **Tech Stack** | Symfony (PHP), Backbone.js |
| **Stars** | 11.6k |
| **License** | OSL-3.0 |
| **API** | Full REST API with token auth |
| **Integration** | Good - modular bundle architecture |

**Pros:**
- Very popular (11.6k stars)
- Unlimited agents, tickets, customers
- Extension framework for customization
- Multi-language support
- Email integration with no limits
- Actively maintained (updates June 2025)

**Cons:**
- PHP/Symfony stack (different from FF)
- More ecommerce-focused design
- Would run as separate service

**Integration Approach:**
- Self-host UVdesk instance
- Use API bundle for FF integration
- Custom extension for fiber-specific fields
- Token-based auth between systems

---

#### 3. **Trudesk**
| Aspect | Details |
|--------|---------|
| **Tech Stack** | Node.js, MongoDB |
| **Stars** | ~2k |
| **License** | Apache 2.0 |
| **API** | Well-documented REST API |
| **Integration** | Excellent - same stack as FF! |

**Pros:**
- **Same tech stack as FibreFlow (Node.js)**
- Real-time ticket updates
- Customizable permissions
- Email-to-ticket conversion
- API designed for third-party apps
- Apache license (permissive)

**Cons:**
- Uses MongoDB (FF uses PostgreSQL)
- Smaller community than others
- Less feature-rich than Zammad

**Integration Approach:**
- Could potentially merge codebase with FF
- Shared Node.js ecosystem
- API integration straightforward
- Might need to adapt to PostgreSQL

---

### Tier 2: Viable Alternatives

#### 4. **NocoBase**
| Aspect | Details |
|--------|---------|
| **Tech Stack** | Plugin-based, no-code platform |
| **Stars** | 15.5k |
| **License** | AGPL-3.0 |
| **API** | Data model driven |
| **Integration** | Very flexible |

**Unique Value:** Build exactly what you need with visual tools. Could create fiber-specific ticketing from scratch without code.

**Considerations:** Learning curve for no-code platform. May be overkill if you just need ticketing.

---

#### 5. **FreeScout**
| Aspect | Details |
|--------|---------|
| **Tech Stack** | Laravel (PHP) |
| **Stars** | 3.5k |
| **License** | AGPL-3.0 |
| **API** | Available via plugins |
| **Integration** | Plugin ecosystem |

**Unique Value:** Lightweight, Gmail-like interface. Good for simple helpdesk needs.

**Considerations:** Less suitable for field service workflows. Plugin-dependent API.

---

#### 6. **osTicket**
| Aspect | Details |
|--------|---------|
| **Tech Stack** | PHP |
| **Stars** | 3.4k |
| **License** | GPL-2.0 |
| **API** | Basic |
| **Integration** | Limited |

**Unique Value:** Battle-tested, widely deployed, simple.

**Considerations:** Dated UI, limited API, hard to customize deeply.

---

### Tier 3: Enterprise/Telecom-Specific

#### **Odoo**
| Aspect | Details |
|--------|---------|
| **Tech Stack** | Python (50%), JavaScript (45%) |
| **License** | LGPL |
| **Modules** | 50+ FSM modules via OCA |

**Analysis:**
- Odoo is a full ERP suite, not just ticketing
- Has Field Service Management modules
- OCA (Odoo Community Association) has telecom-specific modules
- **Overkill if you only need ticketing**
- **Perfect if you want Stock + Fleet + Tickets + Assets all-in-one**

**Integration with FF:**
- Would essentially replace FF for operations
- Could run alongside with API integration
- Significant learning curve
- Better suited as long-term ERP strategy

---

#### **Hydra OSS/BSS**
| Aspect | Details |
|--------|---------|
| **Industry** | Telecom-specific |
| **Users** | 320+ telecom companies |
| **Focus** | Billing, FSM, CRM |

**Analysis:**
- Purpose-built for telecom/fiber
- FSM mobile app for technicians
- Photo reports for remote QA
- Work order management
- **Most fiber-relevant but heavy solution**

---

## Integration Strategies

### Strategy A: Embed External System
```
┌─────────────────────────────────────┐
│           FibreFlow UI              │
│  ┌─────────────────────────────┐   │
│  │   Embedded Ticket View      │   │
│  │   (iframe or API-driven)    │   │
│  └─────────────────────────────┘   │
│         ↕ REST API                  │
│  ┌─────────────────────────────┐   │
│  │  Zammad / UVdesk / Trudesk  │   │
│  │    (Docker container)       │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Pros:** Fast to deploy, battle-tested features
**Cons:** Two systems to maintain, potential UX mismatch

### Strategy B: Build Custom Module
```
┌─────────────────────────────────────┐
│           FibreFlow                 │
│  ┌─────────────────────────────┐   │
│  │   src/modules/ticketing/    │   │
│  │   - components/             │   │
│  │   - services/               │   │
│  │   - types/                  │   │
│  └─────────────────────────────┘   │
│         ↕                          │
│  ┌─────────────────────────────┐   │
│  │   Neon PostgreSQL           │   │
│  │   tickets table             │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Pros:** Perfect integration, fiber-specific from day one
**Cons:** More development time, reinventing the wheel

### Strategy C: Hybrid - Scaffold from OSS
```
Port Trudesk ticket logic to FF module
- Adapt schemas to PostgreSQL
- Reuse ticket workflows
- Build FF-native UI
- Keep API patterns
```

**Pros:** Best of both worlds
**Cons:** Requires understanding of source system

---

## Recommendation Matrix

| If you need... | Choose... |
|----------------|-----------|
| Fastest deployment | Zammad (Docker) |
| Same tech stack | Trudesk |
| Most customizable | NocoBase or Custom Build |
| Full ERP eventually | Odoo |
| Telecom-specific | Hydra |
| Simplest solution | Build custom FF module |

---

## Decision Pending

**Questions to Answer:**
1. Is ticketing standalone or tightly coupled to FF data (drops, poles)?
2. Will contractors use the ticketing system directly?
3. What's the timeline pressure?
4. Is this a stepping stone to full ERP?

---

---

## Odoo Schema Analysis (Patterns to Adapt)

### From OCA Helpdesk (`helpdesk.ticket`)

| Odoo Field | Type | FF Equivalent | Notes |
|------------|------|---------------|-------|
| `number` | Char | `ticket_number` | Auto-generated (TKT-001) |
| `name` | Char | `title` | Required |
| `description` | Html | `description` | Rich text |
| `user_id` | Many2one | `assigned_to` | FK to users |
| `stage_id` | Many2one | `status` | Or FK to stages table |
| `partner_id` | Many2one | `contractor_id` | FK to contractors |
| `partner_email` | Char | `contact_email` | - |
| `last_stage_update` | Datetime | `status_updated_at` | - |
| `assigned_date` | Datetime | `assigned_at` | - |
| `closed_date` | Datetime | `closed_at` | - |
| `tag_ids` | Many2many | `tags` | JSONB array or junction table |
| `category_id` | Many2one | `ticket_type` | Installation/Fault/etc |
| `team_id` | Many2one | `project_id` | FK to projects |
| `priority` | Selection | `priority` | low/medium/high/urgent |
| `attachment_ids` | One2many | `attachments` | FK to attachments table |
| `kanban_state` | Selection | `blocked` | Boolean or enum |

### From OCA Field Service (`fsm.order`)

| Odoo Field | FF Equivalent | Notes |
|------------|---------------|-------|
| `location_id` | `drop_id` / `pole_id` | Link to fiber assets |
| `scheduled_date_start` | `scheduled_start` | - |
| `scheduled_date_end` | `scheduled_end` | - |
| `worker_id` | `technician_id` | - |
| `vehicle_id` | `vehicle_id` | If fleet integrated |
| `equipment_ids` | `equipment_used` | JSONB or junction |
| `stage_id` | `status` | Workflow state |

### OCA Modules Worth Studying

| Module | What to Adapt |
|--------|---------------|
| `helpdesk_mgmt` | Core ticket schema |
| `helpdesk_mgmt_sla` | SLA tracking patterns |
| `helpdesk_mgmt_timesheet` | Time tracking on tickets |
| `helpdesk_mgmt_fieldservice` | Ticket → Work Order flow |
| `fieldservice` | FSM order patterns |
| `fieldservice_route` | Daily route organization |
| `fieldservice_vehicle` | Vehicle assignment |
| `fieldservice_stock` | Parts/materials tracking |

### Fiber-Specific Fields to Add (Not in Odoo)

| Field | Type | Purpose |
|-------|------|---------|
| `drop_number` | VARCHAR | Link to SOW drop |
| `pole_id` | UUID | Link to pole |
| `fiber_type` | ENUM | Aerial/Underground/etc |
| `splice_count` | INT | For splicing tickets |
| `olt_port` | VARCHAR | For activation tickets |
| `signal_level` | DECIMAL | For fault tickets |
| `wa_message_id` | VARCHAR | Link to WA Monitor |

---

---

## Additional Open Source Options (December 2025 Review)

### Peppermint ⭐ STRONG CANDIDATE
| Aspect | Details |
|--------|---------|
| **Tech Stack** | Node.js, React, PostgreSQL |
| **Stars** | ~5k |
| **License** | AGPL-3.0 |
| **API** | REST API with webhooks |
| **Docker Pulls** | 190k+ |

**Pros:**
- **Same tech stack as FibreFlow (Node.js + PostgreSQL)**
- Markdown editor for tickets (familiar for devs)
- File uploads on tickets (critical for field photos)
- OIDC authentication (could integrate with Clerk)
- Mailbox integration (SMTP/IMAP → tickets)
- Comprehensive client history tracking
- Responsive design (mobile to 4K)
- Can run via PM2 or Docker (matches FF deployment)
- Jira/Zendesk alternative positioning

**Cons:**
- Less mature than Zammad/UVdesk
- Smaller community
- Limited SLA features out of the box

**Integration Approach:**
- Most aligned with FF infrastructure
- Could potentially merge ticketing tables directly
- Shared authentication via OIDC/Clerk
- Easy to host alongside FF on Velocity Server

---

### Helpy
| Aspect | Details |
|--------|---------|
| **Tech Stack** | Ruby on Rails |
| **Stars** | ~2.5k |
| **License** | MIT (open-core) |
| **API** | Full REST API + Webhooks |
| **Unique** | Knowledgebase + Community Forums |

**Pros:**
- MIT license (very permissive)
- Integrated knowledgebase (contractor training docs)
- Community forums (could serve as contractor Q&A)
- Collision detection (prevents duplicate work on tickets)
- Canned responses for common issues
- Multi-lingual support
- Lightweight embed widget
- Webhook events: "Ticket Created", "Customer Reply", etc.

**Cons:**
- Ruby on Rails (different stack)
- Pro version needed for triggers and AI chatbot
- Less field-service focused

**Useful Patterns to Adopt:**
- Collision detection for concurrent ticket editing
- Canned response system for common fiber issues
- Knowledgebase integration for contractor self-service

---

### Papercups
| Aspect | Details |
|--------|---------|
| **Tech Stack** | Elixir, Phoenix, PostgreSQL |
| **Stars** | ~5.7k |
| **License** | MIT |
| **Status** | ⚠️ MAINTENANCE MODE |

**Pros:**
- Real-time chat (Phoenix Channels)
- Live session viewing (watch user interactions)
- Slack/Mattermost integration
- GitHub issue linking
- GDPR compliant
- SMS via Twilio integration

**Cons:**
- **In maintenance mode - no new features**
- Elixir stack (different from FF)
- Chat-focused, not ticketing-focused
- Not suitable for field service workflows

**Verdict:** Skip for primary ticketing. However, the **live session viewing** concept could be valuable for debugging client portal issues.

---

## Fiber Construction-Specific Enhancements

Based on industry research, the following features address common pain points in fiber network construction ticketing:

### Build Quality Tracking Fields

| Field | Type | Purpose |
|-------|------|---------|
| `build_phase` | ENUM | design/permit/construction/splicing/testing/activation |
| `defect_type` | ENUM | installation/material/workmanship/documentation |
| `rework_required` | BOOLEAN | Flags tickets requiring revisits |
| `rework_count` | INT | Number of rework attempts |
| `first_time_fix_rate` | BOOLEAN | Track contractor quality |
| `test_results_json` | JSONB | OTDR/power meter readings |
| `splice_loss_db` | DECIMAL | For splice quality tickets |
| `signal_level_dbm` | DECIMAL | For fault/activation tickets |

### Documentation Compliance

| Field | Type | Purpose |
|-------|------|---------|
| `as_built_required` | BOOLEAN | Requires updated documentation |
| `as_built_submitted` | BOOLEAN | Documentation received |
| `photo_count` | INT | Minimum photos required |
| `gps_coordinates` | POINT | Exact location of issue |
| `permit_reference` | VARCHAR | Related permit number |
| `closeout_package_id` | UUID | Link to closeout docs |

### Common Fiber Construction Ticket Types

| Type | Description | Typical Fields |
|------|-------------|----------------|
| **Splice Failure** | High loss at splice point | splice_loss_db, splice_tray_id, fiber_count |
| **Damage Report** | Third-party dig, storm damage | damage_type, photos, estimated_repair_cost |
| **Test Failure** | OTDR/power test failed | test_results_json, technician_id |
| **Installation Defect** | Poor workmanship found | defect_type, contractor_id, penalty_applicable |
| **Missing Documentation** | As-built/photos missing | as_built_required, photo_count |
| **Permit Issue** | Permit violation/expired | permit_reference, municipality |
| **Material Defect** | Faulty cable/hardware | manufacturer, batch_number, material_type |
| **Revisit Required** | Previous work incomplete | rework_count, original_ticket_id |

### Field Service Workflow Enhancements

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Ticket    │ ──► │  Scheduled  │ ──► │  In Field   │ ──► │   QA Check  │
│   Created   │     │  (Calendar) │     │  (Mobile)   │     │  (Photos)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │                   ▼                   ▼                   ▼
       │            ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
       │            │   Route     │     │   Test &    │     │   Close or  │
       │            │ Optimization│     │   Document  │     │   Rework    │
       │            └─────────────┘     └─────────────┘     └─────────────┘
```

### Mobile Field App Requirements

- [ ] Offline capability (rural areas with poor signal)
- [ ] GPS auto-capture on photo upload
- [ ] Barcode/QR scanning for equipment tracking
- [ ] Voice-to-text for notes in field
- [ ] Signature capture for sign-offs
- [ ] Time tracking with geofence verification
- [ ] Pre-loaded drop/pole data for offline lookup

### Construction SLA Tiers (Proposed)

| Priority | Response Time | Resolution Time | Example |
|----------|--------------|-----------------|---------|
| **P1 Critical** | 1 hour | 4 hours | Service outage affecting >10 customers |
| **P2 High** | 4 hours | 24 hours | Single customer outage, safety hazard |
| **P3 Medium** | 24 hours | 72 hours | Quality defect, documentation gap |
| **P4 Low** | 48 hours | 1 week | Cosmetic issue, minor rework |
| **P5 Scheduled** | N/A | Per schedule | Preventative maintenance |

### Contractor Accountability Features

| Feature | Purpose |
|---------|---------|
| **Defect Attribution** | Link defects to specific contractor/team |
| **Quality Score** | Rolling quality metric per contractor |
| **Penalty Tracking** | Track contractual penalties for defects |
| **Response Time Metrics** | Track contractor SLA adherence |
| **Rework Cost Tracking** | Calculate cost of revisits |
| **Training Gap Identification** | Flag repeated issue types for training |

### Integration with Existing FF Modules

| FF Module | Integration Point |
|-----------|------------------|
| **WA Monitor** | Auto-create ticket from QA photo failures |
| **Drops/SOW** | Link ticket to drop_number, auto-populate location |
| **Poles** | Link infrastructure tickets to pole_id |
| **Projects** | Aggregate ticket metrics per project |
| **Contractors** | Attribute tickets, track quality scores |

### Proposed Ticket Categories for FibreFlow

```
tickets/
├── build/
│   ├── splicing
│   ├── installation
│   ├── testing
│   └── documentation
├── fault/
│   ├── service_outage
│   ├── degraded_service
│   └── intermittent
├── infrastructure/
│   ├── pole_damage
│   ├── cable_damage
│   ├── enclosure_damage
│   └── third_party_damage
├── preventative/
│   ├── scheduled_maintenance
│   ├── proactive_replacement
│   └── audit_finding
└── administrative/
    ├── permit_issue
    ├── access_issue
    └── customer_complaint
```

---

## Updated Recommendation

Given the research into additional platforms and fiber construction needs:

### For Rapid Deployment: **Peppermint**
- Matches FF tech stack (Node.js, PostgreSQL)
- Can run alongside on Velocity Server via PM2
- Good enough API for initial integration
- Add custom fiber fields as needed

### For Full-Featured: **Zammad** (original recommendation stands)
- Most mature solution
- Excellent API
- Better SLA handling

### For Custom Build: **Hybrid Approach**
- Use Peppermint as reference architecture
- Build custom FF module with fiber-specific features
- Leverage existing PostgreSQL schema
- Integrate directly with drops, poles, qa_photo_reviews

---

## Sources

- [NocoBase Ticketing Systems](https://www.nocobase.com/en/blog/open-source-ticketing-systems)
- [Zammad REST API](https://docs.zammad.org/en/latest/api/intro.html)
- [Zammad Features](https://zammad.com/en/product/features/rest-api)
- [UVdesk API Documentation](https://www.uvdesk.com/en/api-doc/)
- [UVdesk GitHub](https://github.com/uvdesk/community-skeleton)
- [Open FSM (Odoo)](https://www.opensourceintegrators.com/solutions/field-service-management)
- [Hydra Billing](https://hydra-billing.com/)
- [osTicket](https://osticket.com/)
- [FreeScout](https://freescout.net/blog/open-source-helpdesk-system/)
- [Trudesk](https://trudesk.io/)
- [OCA Helpdesk GitHub](https://github.com/OCA/helpdesk) - Schema source
- [OCA Field Service GitHub](https://github.com/OCA/field-service) - 34 FSM modules
- [Odoo Helpdesk Docs](https://www.odoo.com/documentation/18.0/applications/services/helpdesk.html)
- [Peppermint GitHub](https://github.com/Peppermint-Lab/peppermint)
- [Peppermint Docs](https://docs.peppermint.sh/)
- [Helpy Open Source](https://helpy.io/open-source-helpdesk/)
- [Helpy GitHub](https://github.com/helpyio/helpy)
- [Helpy API](https://helpy.io/api/)
- [Papercups GitHub](https://github.com/papercups-io/papercups)
- [Sitetracker Fiber Networks](https://www.sitetracker.com/industries/fiber-networks/)
- [IQGeo Fiber Management Guide](https://www.iqgeo.com/guides-and-templates/fiber-optic-network-management)
- [Praxedo Fiber Field Service Tips](https://www.praxedo.com/our-blog/telecom-fiber-what-to-look-for-field-service-software/)
- [Phoenix Fiber Project Management](https://www.phoenix-fiber.com/posts/top-strategies-for-effective-fiber-optic-project-management)
- [Vitruvi Fiber Network Software](https://vitruvisoftware.com/blog/fiber-network-management-software)
