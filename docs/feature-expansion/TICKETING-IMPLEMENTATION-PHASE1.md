# Ticketing System - Phase 1 Implementation Plan

**Phase**: MVP - Core Ticketing System
**Duration**: 4-6 weeks
**Priority**: HIGH
**Dependencies**: Existing FibreFlow infrastructure (Clerk Auth, Neon PostgreSQL, Next.js 14)

---

## 📋 Implementation Overview

Phase 1 delivers the essential ticketing functionality following FibreFlow's modular "Lego block" architecture pattern. This implementation follows the same isolation principles as the WA Monitor module.

### Core Features (MVP)
- ✅ Ticket CRUD operations
- ✅ Status management (new → in_progress → completed/closed)
- ✅ Priority assignment (low, medium, high, critical)
- ✅ Project/drop linking
- ✅ Basic assignment to contractors/teams
- ✅ Comment threads
- ✅ File attachments (via Firebase Storage)
- ✅ Activity logging
- ✅ Basic filtering and search

---

## 🗄️ Database Schema Implementation

### 1. Migration Strategy

**Location**: `drizzle/migrations/0001_add_ticketing_system.sql`

```sql
-- Phase 1: Core Ticketing Tables
-- Migration: 0001_add_ticketing_system
-- Created: 2025-12-18

-- =====================================================
-- TABLE: tickets
-- Purpose: Main ticket tracking for all ticket types
-- =====================================================
CREATE TABLE tickets (
    -- Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_uid VARCHAR(20) UNIQUE NOT NULL,  -- Format: TK-YYYYMMDD-XXXX

    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Classification
    source VARCHAR(20) NOT NULL CHECK (source IN (
        'fibertime',      -- From Fibertime system
        'vf_field',       -- VF field agents
        'vf_admin',       -- VF admin staff
        'preventative',   -- Scheduled preventative
        'adhoc'           -- Ad-hoc tickets
    )),
    type VARCHAR(20) NOT NULL CHECK (type IN (
        'build',          -- Construction issues
        'fault',          -- Network faults
        'infrastructure', -- Infrastructure issues
        'preventative',   -- Preventative maintenance
        'adhoc'           -- Ad-hoc tasks
    )),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN (
        'low', 'medium', 'high', 'critical'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN (
        'new',            -- Just created
        'assigned',       -- Assigned to contractor
        'in_progress',    -- Work started
        'pending_review', -- Awaiting review
        'completed',      -- Work done
        'closed',         -- Ticket closed
        'cancelled'       -- Ticket cancelled
    )),

    -- Relationships
    drop_number VARCHAR(50),              -- Linked drop (if applicable)
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    zone VARCHAR(100),                    -- Zone name
    pole_number VARCHAR(50),              -- Pole identifier

    -- Assignment
    assigned_to_contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
    assigned_to_team_id UUID,             -- Team assignment (Phase 2)
    assigned_by_user_id VARCHAR(255),     -- Clerk user ID who assigned
    assigned_at TIMESTAMPTZ,              -- Assignment timestamp

    -- Geolocation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_accuracy DECIMAL(6, 2),      -- meters

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id VARCHAR(255) NOT NULL,  -- Clerk user ID
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,                 -- Expected completion
    started_at TIMESTAMPTZ,               -- Work start time
    completed_at TIMESTAMPTZ,             -- Completion time
    closed_at TIMESTAMPTZ,                -- Closure time

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb    -- Flexible additional data
);

-- Indexes for performance
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assigned_contractor ON tickets(assigned_to_contractor_id);
CREATE INDEX idx_tickets_project ON tickets(project_id);
CREATE INDEX idx_tickets_drop ON tickets(drop_number);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_source_type ON tickets(source, type);

-- =====================================================
-- TABLE: ticket_comments
-- Purpose: Comment threads on tickets
-- =====================================================
CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

    -- Content
    comment TEXT NOT NULL,

    -- Metadata
    is_internal BOOLEAN DEFAULT false,    -- Internal VF notes vs external
    is_system BOOLEAN DEFAULT false,      -- System-generated comment

    -- Author
    created_by_user_id VARCHAR(255) NOT NULL,  -- Clerk user ID
    created_by_name VARCHAR(255),         -- Cached display name
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Soft delete
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id, created_at DESC);
CREATE INDEX idx_ticket_comments_user ON ticket_comments(created_by_user_id);

-- =====================================================
-- TABLE: ticket_attachments
-- Purpose: File attachments (photos, documents)
-- =====================================================
CREATE TABLE ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

    -- File details
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,      -- MIME type
    file_size_bytes INTEGER NOT NULL,
    storage_path TEXT NOT NULL,           -- Firebase Storage path
    storage_url TEXT NOT NULL,            -- Public URL

    -- Context
    description TEXT,
    uploaded_by_user_id VARCHAR(255) NOT NULL,  -- Clerk user ID
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Soft delete
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_ticket_attachments_ticket ON ticket_attachments(ticket_id, uploaded_at DESC);

-- =====================================================
-- TABLE: ticket_activity_log
-- Purpose: Audit trail of all ticket changes
-- =====================================================
CREATE TABLE ticket_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

    -- Activity details
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'created', 'updated', 'assigned', 'status_changed',
        'priority_changed', 'commented', 'attachment_added',
        'completed', 'closed', 'reopened', 'cancelled'
    )),

    -- Change tracking
    field_name VARCHAR(100),              -- Which field changed
    old_value TEXT,                       -- Previous value
    new_value TEXT,                       -- New value
    description TEXT,                     -- Human-readable description

    -- Actor
    performed_by_user_id VARCHAR(255) NOT NULL,  -- Clerk user ID
    performed_by_name VARCHAR(255),       -- Cached display name
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_ticket_activity_ticket ON ticket_activity_log(ticket_id, performed_at DESC);
CREATE INDEX idx_ticket_activity_type ON ticket_activity_log(activity_type);
CREATE INDEX idx_ticket_activity_user ON ticket_activity_log(performed_by_user_id);

-- =====================================================
-- FUNCTION: Auto-update ticket.updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_updated_at();

-- =====================================================
-- FUNCTION: Auto-log ticket changes
-- =====================================================
CREATE OR REPLACE FUNCTION log_ticket_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO ticket_activity_log (
            ticket_id, activity_type, field_name, old_value, new_value,
            performed_by_user_id, performed_by_name, description
        ) VALUES (
            NEW.id, 'status_changed', 'status', OLD.status, NEW.status,
            NEW.updated_by_user_id, NEW.updated_by_name,
            'Status changed from ' || OLD.status || ' to ' || NEW.status
        );
    END IF;

    -- Priority change
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        INSERT INTO ticket_activity_log (
            ticket_id, activity_type, field_name, old_value, new_value,
            performed_by_user_id, performed_by_name, description
        ) VALUES (
            NEW.id, 'priority_changed', 'priority', OLD.priority, NEW.priority,
            NEW.updated_by_user_id, NEW.updated_by_name,
            'Priority changed from ' || OLD.priority || ' to ' || NEW.priority
        );
    END IF;

    -- Assignment change
    IF OLD.assigned_to_contractor_id IS DISTINCT FROM NEW.assigned_to_contractor_id THEN
        INSERT INTO ticket_activity_log (
            ticket_id, activity_type, field_name,
            old_value, new_value,
            performed_by_user_id, performed_by_name, description
        ) VALUES (
            NEW.id, 'assigned', 'assigned_to_contractor_id',
            OLD.assigned_to_contractor_id::TEXT, NEW.assigned_to_contractor_id::TEXT,
            NEW.assigned_by_user_id, 'System',
            'Ticket reassigned'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Add updated_by_user_id and updated_by_name to tickets table
ALTER TABLE tickets
    ADD COLUMN updated_by_user_id VARCHAR(255),
    ADD COLUMN updated_by_name VARCHAR(255);

CREATE TRIGGER trigger_tickets_activity_log
    AFTER UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION log_ticket_activity();

-- =====================================================
-- FUNCTION: Generate ticket UID
-- =====================================================
CREATE OR REPLACE FUNCTION generate_ticket_uid()
RETURNS TEXT AS $$
DECLARE
    new_uid TEXT;
    uid_exists BOOLEAN;
BEGIN
    LOOP
        -- Format: TK-YYYYMMDD-XXXX
        new_uid := 'TK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                   LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

        -- Check if UID exists
        SELECT EXISTS(SELECT 1 FROM tickets WHERE ticket_uid = new_uid) INTO uid_exists;

        EXIT WHEN NOT uid_exists;
    END LOOP;

    RETURN new_uid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW: ticket_summary
-- Purpose: Optimized view for ticket lists
-- =====================================================
CREATE VIEW ticket_summary AS
SELECT
    t.id,
    t.ticket_uid,
    t.title,
    t.source,
    t.type,
    t.priority,
    t.status,
    t.drop_number,
    t.project_id,
    p.name as project_name,
    t.assigned_to_contractor_id,
    c.company_name as assigned_contractor_name,
    t.created_at,
    t.created_by_user_id,
    t.due_date,
    t.completed_at,
    -- Aggregations
    (SELECT COUNT(*) FROM ticket_comments WHERE ticket_id = t.id AND deleted_at IS NULL) as comment_count,
    (SELECT COUNT(*) FROM ticket_attachments WHERE ticket_id = t.id AND deleted_at IS NULL) as attachment_count
FROM tickets t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN contractors c ON t.assigned_to_contractor_id = c.id;

-- =====================================================
-- Seed data for development
-- =====================================================
-- Note: Run only in development environment
-- INSERT INTO tickets (ticket_uid, title, description, source, type, priority, created_by_user_id)
-- VALUES
--     (generate_ticket_uid(), 'Test Build Issue', 'Sample ticket for testing', 'vf_admin', 'build', 'medium', 'user_dev_001'),
--     (generate_ticket_uid(), 'Test Network Fault', 'Sample fault ticket', 'fibertime', 'fault', 'high', 'user_dev_001');
```

### 2. Drizzle Schema Definition

**Location**: `drizzle/schema/ticketing.ts`

```typescript
import { pgTable, uuid, varchar, text, timestamp, decimal, integer, boolean, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from './projects';
import { contractors } from './contractors';

// =====================================================
// ENUMS
// =====================================================
export const ticketSourceEnum = pgEnum('ticket_source', [
  'fibertime',
  'vf_field',
  'vf_admin',
  'preventative',
  'adhoc',
]);

export const ticketTypeEnum = pgEnum('ticket_type', [
  'build',
  'fault',
  'infrastructure',
  'preventative',
  'adhoc',
]);

export const ticketPriorityEnum = pgEnum('ticket_priority', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const ticketStatusEnum = pgEnum('ticket_status', [
  'new',
  'assigned',
  'in_progress',
  'pending_review',
  'completed',
  'closed',
  'cancelled',
]);

export const activityTypeEnum = pgEnum('activity_type', [
  'created',
  'updated',
  'assigned',
  'status_changed',
  'priority_changed',
  'commented',
  'attachment_added',
  'completed',
  'closed',
  'reopened',
  'cancelled',
]);

// =====================================================
// TABLES
// =====================================================
export const tickets = pgTable('tickets', {
  // Identity
  id: uuid('id').primaryKey().defaultRandom(),
  ticketUid: varchar('ticket_uid', { length: 20 }).unique().notNull(),

  // Content
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),

  // Classification
  source: ticketSourceEnum('source').notNull(),
  type: ticketTypeEnum('type').notNull(),
  priority: ticketPriorityEnum('priority').notNull().default('medium'),
  status: ticketStatusEnum('status').notNull().default('new'),

  // Relationships
  dropNumber: varchar('drop_number', { length: 50 }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  zone: varchar('zone', { length: 100 }),
  poleNumber: varchar('pole_number', { length: 50 }),

  // Assignment
  assignedToContractorId: uuid('assigned_to_contractor_id').references(() => contractors.id, { onDelete: 'set null' }),
  assignedToTeamId: uuid('assigned_to_team_id'),
  assignedByUserId: varchar('assigned_by_user_id', { length: 255 }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),

  // Geolocation
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  locationAccuracy: decimal('location_accuracy', { precision: 6, scale: 2 }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByUserId: varchar('created_by_user_id', { length: 255 }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedByUserId: varchar('updated_by_user_id', { length: 255 }),
  updatedByName: varchar('updated_by_name', { length: 255 }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),

  // Metadata
  metadata: jsonb('metadata').default({}),
}, (table) => ({
  statusIdx: index('idx_tickets_status').on(table.status),
  priorityIdx: index('idx_tickets_priority').on(table.priority),
  contractorIdx: index('idx_tickets_assigned_contractor').on(table.assignedToContractorId),
  projectIdx: index('idx_tickets_project').on(table.projectId),
  dropIdx: index('idx_tickets_drop').on(table.dropNumber),
  createdAtIdx: index('idx_tickets_created_at').on(table.createdAt),
}));

export const ticketComments = pgTable('ticket_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),

  comment: text('comment').notNull(),
  isInternal: boolean('is_internal').default(false),
  isSystem: boolean('is_system').default(false),

  createdByUserId: varchar('created_by_user_id', { length: 255 }).notNull(),
  createdByName: varchar('created_by_name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  ticketIdx: index('idx_ticket_comments_ticket').on(table.ticketId, table.createdAt),
  userIdx: index('idx_ticket_comments_user').on(table.createdByUserId),
}));

export const ticketAttachments = pgTable('ticket_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),

  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  storagePath: text('storage_path').notNull(),
  storageUrl: text('storage_url').notNull(),

  description: text('description'),
  uploadedByUserId: varchar('uploaded_by_user_id', { length: 255 }).notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  ticketIdx: index('idx_ticket_attachments_ticket').on(table.ticketId, table.uploadedAt),
}));

export const ticketActivityLog = pgTable('ticket_activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),

  activityType: activityTypeEnum('activity_type').notNull(),
  fieldName: varchar('field_name', { length: 100 }),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  description: text('description'),

  performedByUserId: varchar('performed_by_user_id', { length: 255 }).notNull(),
  performedByName: varchar('performed_by_name', { length: 255 }),
  performedAt: timestamp('performed_at', { withTimezone: true }).notNull().defaultNow(),

  metadata: jsonb('metadata').default({}),
}, (table) => ({
  ticketIdx: index('idx_ticket_activity_ticket').on(table.ticketId, table.performedAt),
  typeIdx: index('idx_ticket_activity_type').on(table.activityType),
  userIdx: index('idx_ticket_activity_user').on(table.performedByUserId),
}));

// =====================================================
// RELATIONS
// =====================================================
export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  project: one(projects, {
    fields: [tickets.projectId],
    references: [projects.id],
  }),
  assignedContractor: one(contractors, {
    fields: [tickets.assignedToContractorId],
    references: [contractors.id],
  }),
  comments: many(ticketComments),
  attachments: many(ticketAttachments),
  activityLog: many(ticketActivityLog),
}));

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketComments.ticketId],
    references: [tickets.id],
  }),
}));

export const ticketAttachmentsRelations = relations(ticketAttachments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketAttachments.ticketId],
    references: [tickets.id],
  }),
}));

export const ticketActivityLogRelations = relations(ticketActivityLog, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketActivityLog.ticketId],
    references: [tickets.id],
  }),
}));

// =====================================================
// TYPES
// =====================================================
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type TicketComment = typeof ticketComments.$inferSelect;
export type NewTicketComment = typeof ticketComments.$inferInsert;
export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type NewTicketAttachment = typeof ticketAttachments.$inferInsert;
export type TicketActivity = typeof ticketActivityLog.$inferSelect;
export type NewTicketActivity = typeof ticketActivityLog.$inferInsert;
```

### 3. Migration Execution Plan

```bash
# Step 1: Generate migration from schema
npm run db:generate

# Step 2: Review generated migration
# Location: drizzle/migrations/0001_add_ticketing_system.sql

# Step 3: Apply migration to database
npm run db:migrate

# Step 4: Verify tables created
npm run db:studio
# Navigate to http://localhost:3000 and verify tables exist

# Step 5: (Optional) Seed test data for development
psql $DATABASE_URL -f drizzle/seeds/ticketing-dev-data.sql
```

---

## 🏗️ Module Architecture

Following FibreFlow's modular "Lego block" pattern and WA Monitor isolation principles.

### Directory Structure

```
src/modules/ticketing/
├── README.md                    # Module documentation
├── ISOLATION_GUIDE.md          # Isolation principles (like WA Monitor)
│
├── types/                      # TypeScript interfaces
│   ├── index.ts               # All type exports
│   ├── ticket.types.ts        # Ticket-related types
│   ├── comment.types.ts       # Comment types
│   └── attachment.types.ts    # Attachment types
│
├── services/                   # Business logic
│   ├── index.ts               # Service exports
│   ├── ticketService.ts       # Core ticket operations
│   ├── commentService.ts      # Comment operations
│   ├── attachmentService.ts   # File handling
│   └── activityService.ts     # Activity logging
│
├── utils/                      # Internal utilities
│   ├── index.ts
│   ├── ticketUidGenerator.ts  # UID generation
│   ├── validation.ts          # Input validation
│   └── formatters.ts          # Data formatting
│
├── components/                 # UI components
│   ├── TicketList/
│   │   ├── index.tsx
│   │   ├── TicketList.tsx
│   │   ├── TicketListItem.tsx
│   │   └── TicketList.test.tsx
│   │
│   ├── TicketDetail/
│   │   ├── index.tsx
│   │   ├── TicketDetail.tsx
│   │   ├── TicketHeader.tsx
│   │   ├── TicketInfo.tsx
│   │   └── TicketDetail.test.tsx
│   │
│   ├── TicketForm/
│   │   ├── index.tsx
│   │   ├── TicketForm.tsx
│   │   ├── useTicketForm.ts   # Form hook
│   │   └── TicketForm.test.tsx
│   │
│   ├── CommentThread/
│   │   ├── index.tsx
│   │   ├── CommentThread.tsx
│   │   ├── CommentInput.tsx
│   │   └── CommentItem.tsx
│   │
│   └── shared/
│       ├── StatusBadge.tsx
│       ├── PriorityBadge.tsx
│       └── TicketTypeIcon.tsx
│
└── hooks/                      # Custom React hooks
    ├── index.ts
    ├── useTickets.ts          # Ticket CRUD hook
    ├── useTicketDetail.ts     # Single ticket hook
    ├── useComments.ts         # Comments hook
    └── useAttachments.ts      # Attachments hook
```

### Isolation Principles

**Zero Dependencies on Main App** (following WA Monitor pattern):
- ✅ Self-contained database access
- ✅ Internal copies of shared utilities
- ✅ Own authentication context handling
- ✅ Can be extracted to microservice later

**Allowed Dependencies**:
- External packages (React, Next.js, Neon, Firebase Storage)
- Clerk authentication hooks (via context)
- Shared UI primitives (buttons, inputs) from `@/components/ui`

**Forbidden Dependencies**:
- ❌ NO imports from `@/lib/*` (except `apiResponse.ts`)
- ❌ NO imports from `@/services/*`
- ❌ NO direct coupling to other modules

---

## 🔌 API Implementation

### API Routes Structure

```
pages/api/ticketing/
├── tickets/
│   ├── index.ts                    # GET /api/ticketing/tickets (list)
│   │                               # POST /api/ticketing/tickets (create)
│   │
│   ├── [ticketId]/
│   │   ├── index.ts               # GET /api/ticketing/tickets/:id
│   │   │                          # PATCH /api/ticketing/tickets/:id
│   │   │                          # DELETE /api/ticketing/tickets/:id
│   │   │
│   │   ├── comments.ts            # GET/POST /api/ticketing/tickets/:id/comments
│   │   ├── attachments.ts         # GET/POST /api/ticketing/tickets/:id/attachments
│   │   ├── activity.ts            # GET /api/ticketing/tickets/:id/activity
│   │   └── assign.ts              # POST /api/ticketing/tickets/:id/assign
│   │
│   └── stats.ts                   # GET /api/ticketing/tickets/stats
│
├── comments/
│   └── [commentId].ts             # PATCH/DELETE /api/ticketing/comments/:id
│
└── attachments/
    └── [attachmentId].ts          # DELETE /api/ticketing/attachments/:id
```

### API Implementation Examples

#### 1. List Tickets (GET /api/ticketing/tickets)

**Location**: `pages/api/ticketing/tickets/index.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { ticketService } from '@/modules/ticketing/services';
import { getAuth } from '@clerk/nextjs/server';
import { withArcjetProtection, aj } from '@/lib/arcjet';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);

  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  if (req.method === 'GET') {
    return handleGetTickets(req, res, userId);
  }

  if (req.method === 'POST') {
    return handleCreateTicket(req, res, userId);
  }

  return apiResponse.methodNotAllowed(res, req.method);
}

async function handleGetTickets(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      status,
      priority,
      assignedTo,
      projectId,
      source,
      type,
      page = '1',
      limit = '20',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const filters = {
      status: status as string | undefined,
      priority: priority as string | undefined,
      assignedToContractorId: assignedTo as string | undefined,
      projectId: projectId as string | undefined,
      source: source as string | undefined,
      type: type as string | undefined,
    };

    const pagination = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await ticketService.listTickets(filters, pagination);

    return apiResponse.success(res, result);
  } catch (error) {
    console.error('[API] List tickets error:', error);
    return apiResponse.internalError(res, error);
  }
}

async function handleCreateTicket(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const ticketData = {
      ...req.body,
      createdByUserId: userId,
    };

    const ticket = await ticketService.createTicket(ticketData);

    return apiResponse.created(res, ticket);
  } catch (error) {
    console.error('[API] Create ticket error:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return apiResponse.badRequest(res, error.message);
    }

    return apiResponse.internalError(res, error);
  }
}

export default withArcjetProtection(handler, aj);
```

#### 2. Get/Update Ticket (GET/PATCH /api/ticketing/tickets/[ticketId])

**Location**: `pages/api/ticketing/tickets/[ticketId]/index.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { ticketService } from '@/modules/ticketing/services';
import { getAuth } from '@clerk/nextjs/server';
import { withArcjetProtection, aj } from '@/lib/arcjet';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);

  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  const { ticketId } = req.query;

  if (typeof ticketId !== 'string') {
    return apiResponse.badRequest(res, 'Invalid ticket ID');
  }

  if (req.method === 'GET') {
    return handleGetTicket(req, res, ticketId);
  }

  if (req.method === 'PATCH') {
    return handleUpdateTicket(req, res, ticketId, userId);
  }

  if (req.method === 'DELETE') {
    return handleDeleteTicket(req, res, ticketId, userId);
  }

  return apiResponse.methodNotAllowed(res, req.method);
}

async function handleGetTicket(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string
) {
  try {
    const ticket = await ticketService.getTicketById(ticketId);

    if (!ticket) {
      return apiResponse.notFound(res, 'Ticket', ticketId);
    }

    return apiResponse.success(res, ticket);
  } catch (error) {
    console.error('[API] Get ticket error:', error);
    return apiResponse.internalError(res, error);
  }
}

async function handleUpdateTicket(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string,
  userId: string
) {
  try {
    const updates = {
      ...req.body,
      updatedByUserId: userId,
    };

    const ticket = await ticketService.updateTicket(ticketId, updates);

    if (!ticket) {
      return apiResponse.notFound(res, 'Ticket', ticketId);
    }

    return apiResponse.success(res, ticket);
  } catch (error) {
    console.error('[API] Update ticket error:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return apiResponse.badRequest(res, error.message);
    }

    return apiResponse.internalError(res, error);
  }
}

async function handleDeleteTicket(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string,
  userId: string
) {
  try {
    // Soft delete - change status to 'cancelled'
    const ticket = await ticketService.updateTicket(ticketId, {
      status: 'cancelled',
      updatedByUserId: userId,
      closedAt: new Date().toISOString(),
    });

    if (!ticket) {
      return apiResponse.notFound(res, 'Ticket', ticketId);
    }

    return apiResponse.success(res, { message: 'Ticket cancelled successfully' });
  } catch (error) {
    console.error('[API] Delete ticket error:', error);
    return apiResponse.internalError(res, error);
  }
}

export default withArcjetProtection(handler, aj);
```

#### 3. Comments API (GET/POST /api/ticketing/tickets/[ticketId]/comments)

**Location**: `pages/api/ticketing/tickets/[ticketId]/comments.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { commentService } from '@/modules/ticketing/services';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { withArcjetProtection, aj } from '@/lib/arcjet';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);

  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  const { ticketId } = req.query;

  if (typeof ticketId !== 'string') {
    return apiResponse.badRequest(res, 'Invalid ticket ID');
  }

  if (req.method === 'GET') {
    return handleGetComments(req, res, ticketId);
  }

  if (req.method === 'POST') {
    return handleCreateComment(req, res, ticketId, userId);
  }

  return apiResponse.methodNotAllowed(res, req.method);
}

async function handleGetComments(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string
) {
  try {
    const comments = await commentService.getCommentsByTicketId(ticketId);
    return apiResponse.success(res, comments);
  } catch (error) {
    console.error('[API] Get comments error:', error);
    return apiResponse.internalError(res, error);
  }
}

async function handleCreateComment(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string,
  userId: string
) {
  try {
    // Get user's display name from Clerk
    const user = await clerkClient.users.getUser(userId);
    const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                       user.emailAddresses[0]?.emailAddress ||
                       'Unknown User';

    const commentData = {
      ticketId,
      comment: req.body.comment,
      isInternal: req.body.isInternal || false,
      createdByUserId: userId,
      createdByName: displayName,
    };

    const comment = await commentService.createComment(commentData);

    return apiResponse.created(res, comment);
  } catch (error) {
    console.error('[API] Create comment error:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return apiResponse.badRequest(res, error.message);
    }

    return apiResponse.internalError(res, error);
  }
}

export default withArcjetProtection(handler, aj);
```

---

## 🔧 Service Layer Implementation

### Ticket Service

**Location**: `src/modules/ticketing/services/ticketService.ts`

```typescript
import { neon } from '@neondatabase/serverless';
import type {
  Ticket,
  NewTicket,
  TicketFilters,
  PaginationParams,
  TicketListResult
} from '../types';
import { validateTicketData } from '../utils/validation';
import { generateTicketUid } from '../utils/ticketUidGenerator';
import { activityService } from './activityService';

const sql = neon(process.env.DATABASE_URL!);

export const ticketService = {
  /**
   * List tickets with filtering and pagination
   */
  async listTickets(
    filters: TicketFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20, sortBy: 'created_at', sortOrder: 'desc' }
  ): Promise<TicketListResult> {
    try {
      const { page, limit, sortBy, sortOrder } = pagination;
      const offset = (page - 1) * limit;

      // Build WHERE clause dynamically
      const whereClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.status) {
        whereClauses.push(`t.status = $${paramIndex++}`);
        params.push(filters.status);
      }

      if (filters.priority) {
        whereClauses.push(`t.priority = $${paramIndex++}`);
        params.push(filters.priority);
      }

      if (filters.assignedToContractorId) {
        whereClauses.push(`t.assigned_to_contractor_id = $${paramIndex++}`);
        params.push(filters.assignedToContractorId);
      }

      if (filters.projectId) {
        whereClauses.push(`t.project_id = $${paramIndex++}`);
        params.push(filters.projectId);
      }

      if (filters.source) {
        whereClauses.push(`t.source = $${paramIndex++}`);
        params.push(filters.source);
      }

      if (filters.type) {
        whereClauses.push(`t.type = $${paramIndex++}`);
        params.push(filters.type);
      }

      const whereClause = whereClauses.length > 0
        ? `WHERE ${whereClauses.join(' AND ')}`
        : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM tickets t
        ${whereClause}
      `;
      const countResult = await sql(countQuery, params);
      const total = parseInt(countResult[0]?.total || '0', 10);

      // Get paginated tickets with summary data
      const dataQuery = `
        SELECT
          t.*,
          p.name as project_name,
          c.company_name as assigned_contractor_name,
          (SELECT COUNT(*) FROM ticket_comments WHERE ticket_id = t.id AND deleted_at IS NULL) as comment_count,
          (SELECT COUNT(*) FROM ticket_attachments WHERE ticket_id = t.id AND deleted_at IS NULL) as attachment_count
        FROM tickets t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN contractors c ON t.assigned_to_contractor_id = c.id
        ${whereClause}
        ORDER BY t.${sortBy} ${sortOrder}
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      const tickets = await sql(dataQuery, [...params, limit, offset]);

      return {
        tickets: tickets as Ticket[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('[ticketService] List tickets error:', error);
      throw error;
    }
  },

  /**
   * Get ticket by ID with full details
   */
  async getTicketById(ticketId: string): Promise<Ticket | null> {
    try {
      const query = `
        SELECT
          t.*,
          p.name as project_name,
          c.company_name as assigned_contractor_name,
          c.id as contractor_id
        FROM tickets t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN contractors c ON t.assigned_to_contractor_id = c.id
        WHERE t.id = $1
      `;

      const result = await sql(query, [ticketId]);
      return result[0] as Ticket || null;
    } catch (error) {
      console.error('[ticketService] Get ticket error:', error);
      throw error;
    }
  },

  /**
   * Create new ticket
   */
  async createTicket(data: Omit<NewTicket, 'ticketUid'>): Promise<Ticket> {
    try {
      // Validate input data
      validateTicketData(data);

      // Generate unique ticket UID
      const ticketUid = await generateTicketUid();

      const query = `
        INSERT INTO tickets (
          ticket_uid, title, description, source, type, priority, status,
          drop_number, project_id, zone, pole_number,
          assigned_to_contractor_id, assigned_by_user_id, assigned_at,
          latitude, longitude, location_accuracy,
          created_by_user_id, due_date, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14,
          $15, $16, $17,
          $18, $19, $20
        )
        RETURNING *
      `;

      const result = await sql(query, [
        ticketUid,
        data.title,
        data.description,
        data.source,
        data.type,
        data.priority || 'medium',
        data.status || 'new',
        data.dropNumber || null,
        data.projectId || null,
        data.zone || null,
        data.poleNumber || null,
        data.assignedToContractorId || null,
        data.assignedByUserId || null,
        data.assignedAt || null,
        data.latitude || null,
        data.longitude || null,
        data.locationAccuracy || null,
        data.createdByUserId,
        data.dueDate || null,
        JSON.stringify(data.metadata || {}),
      ]);

      const ticket = result[0] as Ticket;

      // Log activity
      await activityService.logActivity({
        ticketId: ticket.id,
        activityType: 'created',
        description: `Ticket created: ${ticket.title}`,
        performedByUserId: data.createdByUserId,
        performedByName: 'System',
      });

      return ticket;
    } catch (error) {
      console.error('[ticketService] Create ticket error:', error);
      throw error;
    }
  },

  /**
   * Update ticket
   */
  async updateTicket(
    ticketId: string,
    updates: Partial<Ticket>
  ): Promise<Ticket | null> {
    try {
      // Build SET clause dynamically
      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Always update updated_at
      setClauses.push(`updated_at = NOW()`);

      if (updates.title !== undefined) {
        setClauses.push(`title = $${paramIndex++}`);
        params.push(updates.title);
      }

      if (updates.description !== undefined) {
        setClauses.push(`description = $${paramIndex++}`);
        params.push(updates.description);
      }

      if (updates.status !== undefined) {
        setClauses.push(`status = $${paramIndex++}`);
        params.push(updates.status);

        // Auto-set timestamps based on status
        if (updates.status === 'in_progress' && !updates.startedAt) {
          setClauses.push(`started_at = NOW()`);
        } else if (updates.status === 'completed' && !updates.completedAt) {
          setClauses.push(`completed_at = NOW()`);
        } else if (updates.status === 'closed' && !updates.closedAt) {
          setClauses.push(`closed_at = NOW()`);
        }
      }

      if (updates.priority !== undefined) {
        setClauses.push(`priority = $${paramIndex++}`);
        params.push(updates.priority);
      }

      if (updates.assignedToContractorId !== undefined) {
        setClauses.push(`assigned_to_contractor_id = $${paramIndex++}`);
        params.push(updates.assignedToContractorId);
        setClauses.push(`assigned_at = NOW()`);
      }

      if (updates.assignedByUserId !== undefined) {
        setClauses.push(`assigned_by_user_id = $${paramIndex++}`);
        params.push(updates.assignedByUserId);
      }

      if (updates.updatedByUserId !== undefined) {
        setClauses.push(`updated_by_user_id = $${paramIndex++}`);
        params.push(updates.updatedByUserId);
      }

      if (updates.dueDate !== undefined) {
        setClauses.push(`due_date = $${paramIndex++}`);
        params.push(updates.dueDate);
      }

      if (setClauses.length === 1) {
        // Only updated_at changed, no actual updates
        return this.getTicketById(ticketId);
      }

      const query = `
        UPDATE tickets
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await sql(query, [...params, ticketId]);
      return result[0] as Ticket || null;
    } catch (error) {
      console.error('[ticketService] Update ticket error:', error);
      throw error;
    }
  },

  /**
   * Assign ticket to contractor
   */
  async assignTicket(
    ticketId: string,
    contractorId: string,
    assignedBy: string
  ): Promise<Ticket | null> {
    try {
      return this.updateTicket(ticketId, {
        assignedToContractorId: contractorId,
        assignedByUserId: assignedBy,
        status: 'assigned',
      });
    } catch (error) {
      console.error('[ticketService] Assign ticket error:', error);
      throw error;
    }
  },

  /**
   * Get ticket statistics
   */
  async getTicketStats(filters: TicketFilters = {}): Promise<TicketStats> {
    try {
      // Build WHERE clause
      const whereClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.projectId) {
        whereClauses.push(`project_id = $${paramIndex++}`);
        params.push(filters.projectId);
      }

      if (filters.assignedToContractorId) {
        whereClauses.push(`assigned_to_contractor_id = $${paramIndex++}`);
        params.push(filters.assignedToContractorId);
      }

      const whereClause = whereClauses.length > 0
        ? `WHERE ${whereClauses.join(' AND ')}`
        : '';

      const query = `
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'new') as new_count,
          COUNT(*) FILTER (WHERE status = 'assigned') as assigned_count,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
          COUNT(*) FILTER (WHERE status = 'pending_review') as pending_review_count,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
          COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
          COUNT(*) FILTER (WHERE priority = 'critical') as critical_count,
          COUNT(*) FILTER (WHERE priority = 'high') as high_count,
          COUNT(*) FILTER (WHERE priority = 'medium') as medium_count,
          COUNT(*) FILTER (WHERE priority = 'low') as low_count,
          COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('completed', 'closed', 'cancelled')) as overdue_count
        FROM tickets
        ${whereClause}
      `;

      const result = await sql(query, params);
      return result[0] as TicketStats;
    } catch (error) {
      console.error('[ticketService] Get stats error:', error);
      throw error;
    }
  },
};

// Type definitions
export interface TicketFilters {
  status?: string;
  priority?: string;
  assignedToContractorId?: string;
  projectId?: string;
  source?: string;
  type?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface TicketListResult {
  tickets: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TicketStats {
  total: number;
  new_count: number;
  assigned_count: number;
  in_progress_count: number;
  pending_review_count: number;
  completed_count: number;
  closed_count: number;
  cancelled_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  overdue_count: number;
}
```

---

## ⚛️ Frontend Components

### Ticket List Component

**Location**: `src/modules/ticketing/components/TicketList/TicketList.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useTickets } from '../../hooks/useTickets';
import TicketListItem from './TicketListItem';
import { StatusBadge, PriorityBadge } from '../shared';
import type { TicketFilters } from '../../types';

export default function TicketList() {
  const [filters, setFilters] = useState<TicketFilters>({});
  const [page, setPage] = useState(1);

  const { tickets, loading, error, pagination, refetch } = useTickets({
    filters,
    page,
    limit: 20,
  });

  const handleFilterChange = (newFilters: Partial<TicketFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page
  };

  if (loading && !tickets.length) {
    return <div className="p-8 text-center">Loading tickets...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Error loading tickets: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_review">Pending Review</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={filters.priority || ''}
              onChange={(e) => handleFilterChange({ priority: e.target.value || undefined })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Type filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Types</option>
              <option value="build">Build</option>
              <option value="fault">Fault</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="preventative">Preventative</option>
              <option value="adhoc">Ad-hoc</option>
            </select>
          </div>

          {/* Source filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <select
              value={filters.source || ''}
              onChange={(e) => handleFilterChange({ source: e.target.value || undefined })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Sources</option>
              <option value="fibertime">Fibertime</option>
              <option value="vf_field">VF Field</option>
              <option value="vf_admin">VF Admin</option>
              <option value="preventative">Preventative</option>
              <option value="adhoc">Ad-hoc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets list */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            No tickets found with current filters
          </div>
        ) : (
          tickets.map(ticket => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              onUpdate={refetch}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm">
            Page {page} of {pagination.totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

### Custom Hook - useTickets

**Location**: `src/modules/ticketing/hooks/useTickets.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { Ticket, TicketFilters } from '../types';

interface UseTicketsParams {
  filters?: TicketFilters;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseTicketsReturn {
  tickets: Ticket[];
  loading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
}

export function useTickets(params: UseTicketsParams = {}): UseTicketsReturn {
  const {
    filters = {},
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      // Add filters
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.assignedTo) queryParams.append('assignedTo', filters.assignedTo);
      if (filters.projectId) queryParams.append('projectId', filters.projectId);
      if (filters.source) queryParams.append('source', filters.source);
      if (filters.type) queryParams.append('type', filters.type);

      const response = await fetch(`/api/ticketing/tickets?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setTickets(data.tickets || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error('[useTickets] Fetch error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    error,
    pagination,
    refetch: fetchTickets,
  };
}
```

---

## 🧪 Testing Strategy

### Unit Tests

**Location**: `src/modules/ticketing/services/__tests__/ticketService.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ticketService } from '../ticketService';
import { neon } from '@neondatabase/serverless';

describe('ticketService', () => {
  const testTicketData = {
    title: 'Test Build Issue',
    description: 'Test description',
    source: 'vf_admin' as const,
    type: 'build' as const,
    priority: 'medium' as const,
    createdByUserId: 'user_test_001',
  };

  afterEach(async () => {
    // Clean up test data
    const sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM tickets WHERE title LIKE 'Test%'`;
  });

  describe('createTicket', () => {
    it('should create a ticket with generated UID', async () => {
      const ticket = await ticketService.createTicket(testTicketData);

      expect(ticket).toBeDefined();
      expect(ticket.ticketUid).toMatch(/^TK-\d{8}-\d{4}$/);
      expect(ticket.title).toBe(testTicketData.title);
      expect(ticket.status).toBe('new');
    });

    it('should reject invalid ticket data', async () => {
      const invalidData = {
        ...testTicketData,
        title: '', // Invalid: empty title
      };

      await expect(ticketService.createTicket(invalidData)).rejects.toThrow();
    });
  });

  describe('getTicketById', () => {
    it('should retrieve existing ticket', async () => {
      const created = await ticketService.createTicket(testTicketData);
      const retrieved = await ticketService.getTicketById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent ticket', async () => {
      const result = await ticketService.getTicketById('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('updateTicket', () => {
    it('should update ticket status and set timestamp', async () => {
      const created = await ticketService.createTicket(testTicketData);

      const updated = await ticketService.updateTicket(created.id, {
        status: 'in_progress',
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('in_progress');
      expect(updated?.startedAt).toBeDefined();
    });
  });

  describe('listTickets', () => {
    it('should filter tickets by status', async () => {
      // Create tickets with different statuses
      await ticketService.createTicket({ ...testTicketData, title: 'Test New' });
      const inProgress = await ticketService.createTicket({
        ...testTicketData,
        title: 'Test In Progress',
        status: 'in_progress'
      });

      const result = await ticketService.listTickets(
        { status: 'in_progress' },
        { page: 1, limit: 10, sortBy: 'created_at', sortOrder: 'desc' }
      );

      expect(result.tickets.length).toBeGreaterThan(0);
      expect(result.tickets.every(t => t.status === 'in_progress')).toBe(true);
    });
  });
});
```

### E2E Tests

**Location**: `tests/e2e/ticketing.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Ticketing System', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/sign-in');
    await page.fill('input[name="identifier"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should create a new ticket', async ({ page }) => {
    await page.goto('/ticketing');

    // Click new ticket button
    await page.click('button:has-text("New Ticket")');

    // Fill form
    await page.fill('input[name="title"]', 'E2E Test Ticket');
    await page.fill('textarea[name="description"]', 'Test description from E2E');
    await page.selectOption('select[name="type"]', 'build');
    await page.selectOption('select[name="priority"]', 'high');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=Ticket created successfully')).toBeVisible();
    await expect(page.locator('text=E2E Test Ticket')).toBeVisible();
  });

  test('should filter tickets by status', async ({ page }) => {
    await page.goto('/ticketing');

    // Apply status filter
    await page.selectOption('select[name="status-filter"]', 'new');

    // Verify all visible tickets have 'new' status
    const statusBadges = page.locator('[data-testid="status-badge"]');
    const count = await statusBadges.count();

    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toHaveText('New');
    }
  });

  test('should add comment to ticket', async ({ page }) => {
    await page.goto('/ticketing');

    // Click first ticket
    await page.click('[data-testid="ticket-item"]:first-of-type');

    // Add comment
    await page.fill('textarea[name="comment"]', 'E2E test comment');
    await page.click('button:has-text("Add Comment")');

    // Verify comment appears
    await expect(page.locator('text=E2E test comment')).toBeVisible();
  });
});
```

---

## 📝 Development Checklist

### Phase 1 Implementation Tasks

#### Week 1-2: Database & Backend Foundation
- [ ] Create database migration (`0001_add_ticketing_system.sql`)
- [ ] Create Drizzle schema (`drizzle/schema/ticketing.ts`)
- [ ] Run migration on development database
- [ ] Verify tables created via Drizzle Studio
- [ ] Create module directory structure
- [ ] Implement `ticketService.ts` with all CRUD operations
- [ ] Implement `commentService.ts`
- [ ] Implement `attachmentService.ts`
- [ ] Implement `activityService.ts`
- [ ] Write unit tests for all services (>80% coverage)

#### Week 3-4: API Layer
- [ ] Create API route: `GET/POST /api/ticketing/tickets`
- [ ] Create API route: `GET/PATCH/DELETE /api/ticketing/tickets/[ticketId]`
- [ ] Create API route: `GET/POST /api/ticketing/tickets/[ticketId]/comments`
- [ ] Create API route: `GET/POST /api/ticketing/tickets/[ticketId]/attachments`
- [ ] Create API route: `GET /api/ticketing/tickets/[ticketId]/activity`
- [ ] Create API route: `POST /api/ticketing/tickets/[ticketId]/assign`
- [ ] Create API route: `GET /api/ticketing/tickets/stats`
- [ ] Add Arcjet protection to all routes
- [ ] Test all API endpoints with Postman/Thunder Client

#### Week 5: Frontend Components
- [ ] Create `TicketList` component with filtering
- [ ] Create `TicketListItem` component
- [ ] Create `TicketDetail` component
- [ ] Create `TicketForm` component (create/edit)
- [ ] Create `CommentThread` component
- [ ] Create `StatusBadge` component
- [ ] Create `PriorityBadge` component
- [ ] Implement `useTickets` hook
- [ ] Implement `useTicketDetail` hook
- [ ] Implement `useComments` hook

#### Week 6: Integration & Testing
- [ ] Create `/ticketing` page with AppLayout
- [ ] Create `/ticketing/[ticketId]` detail page
- [ ] Implement file upload for attachments (Firebase Storage)
- [ ] Write component tests (React Testing Library)
- [ ] Write E2E tests (Playwright)
- [ ] Test on dev.fibreflow.app
- [ ] Fix bugs and refinements

### Quality Gates (MUST PASS)

Before considering Phase 1 complete:
- [ ] Zero TypeScript errors (`npm run type-check`)
- [ ] Zero ESLint warnings (`npm run lint`)
- [ ] No console.log statements in src/
- [ ] Database endpoint validation passes
- [ ] Module isolation maintained (no @/lib or @/services imports except apiResponse)
- [ ] Unit test coverage >80%
- [ ] All E2E tests pass
- [ ] Manual testing complete on dev environment
- [ ] Documentation updated (README.md in module)

---

## 🚀 Deployment Plan

### Development Deployment

```bash
# 1. Push to develop branch
git checkout develop
git pull origin develop
git merge feature/ticketing-mvp
git push origin develop

# 2. Deploy to dev.fibreflow.app
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow-dev && \
   git pull && \
   npm ci && \
   npm run build && \
   pm2 restart fibreflow-dev"

# 3. Test thoroughly on dev
# - Create tickets
# - Add comments
# - Upload attachments
# - Test filtering
# - Test assignment
# - Verify activity log

# 4. Monitor logs
ssh louis@100.96.203.105
pm2 logs fibreflow-dev --lines 100
```

### Production Deployment

```bash
# 1. Create PR: develop → master
gh pr create \
  --base master \
  --head develop \
  --title "feat: Ticketing System Phase 1 (MVP)" \
  --body "## Summary
- Core ticket CRUD operations
- Comment threads
- File attachments
- Activity logging
- Status/priority management

## Testing
- ✅ Unit tests (85% coverage)
- ✅ E2E tests pass
- ✅ Manual testing on dev complete
- ✅ All quality gates passed

## Deployment
Tested on dev.fibreflow.app for 1 week with no issues."

# 2. After PR approval and merge
git checkout master
git pull origin master

# 3. Deploy to app.fibreflow.app
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow && \
   git pull && \
   npm ci && \
   npm run build && \
   pm2 restart fibreflow-prod"

# 4. Monitor production
ssh louis@100.96.203.105
pm2 logs fibreflow-prod --lines 100

# 5. Verify in production
# Visit app.fibreflow.app/ticketing
# Create test ticket
# Verify all features working
```

---

## 📚 Documentation Requirements

### Module Documentation

Create `src/modules/ticketing/README.md`:
- Module purpose and features
- Architecture overview
- API endpoints
- Database schema
- Usage examples
- Testing guide

### Isolation Guide

Create `src/modules/ticketing/ISOLATION_GUIDE.md`:
- Why isolation matters
- Allowed dependencies
- Forbidden imports
- How to maintain isolation
- Extraction guide (future microservice)

### Page Logs

Create `docs/page-logs/ticketing.md`:
- Initial implementation (Phase 1)
- Timestamp each update
- Problems encountered
- Solutions applied
- Testing results

---

## ⏭️ Next Steps (After Phase 1)

**Phase 2: SLA & Notifications** (4 weeks)
- SLA configuration by ticket type
- SLA tracking and violations
- Email notifications (ticket created, assigned, overdue)
- In-app notification center
- Escalation rules

**Phase 3: Fibertime Integration** (3 weeks)
- Webhook receiver for Fibertime tickets
- Auto-linking (DR number → project/pole/zone)
- Bi-directional sync
- Status updates to Fibertime

**Phase 4: Advanced Features** (4 weeks)
- Team management and assignment
- Custom fields per ticket type
- Bulk operations
- Advanced reporting
- Mobile app API enhancements

---

**READY TO IMPLEMENT ✅**

This plan provides complete implementation details for Phase 1. Follow the checklist sequentially, validate at each step, and maintain all quality gates.
