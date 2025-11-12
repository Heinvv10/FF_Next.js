# CLAUDE.md - AI Assistant Context Guide

## Project Overview
**FibreFlow Next.js** - A modern Next.js application for fiber network project management, successfully migrated from React/Vite.

### ✅ Migration Complete!
**Successfully migrated to Next.js with Clerk Authentication**
- Next.js 14+ with App Router now in production
- Clerk authentication fully integrated
- Previous React/Vite app archived for reference

## Essential Directory Structure

### Core Application
- `src/` - Main React application code
  - `modules/` - **Modular features ("Lego blocks" - self-contained, plug-and-play)**
    - `rag/` - RAG (Red/Amber/Green) contractor health monitoring
    - Each module has: types/, services/, utils/, components/
  - `components/` - **Shared UI components (AppLayout is the standard layout)**
    - `layout/` - Layout components (AppLayout, Header, Sidebar, Footer)
    - `layout/index.ts` - Single source of truth for layout imports
  - `services/` - Shared API services
  - `lib/` - Shared utilities and helpers
- `api/` - Backend API endpoints and server logic
- `public/` - Static assets and public files
- `scripts/` - Build scripts, database utilities, and tools
- `SOW/` - Statement of Work import functionality (active feature)

### Database & Infrastructure
- `neon/` - **Neon PostgreSQL database**
  - **Project**: FF_React (Neon Project ID: sparkling-bar-47287977)
  - **Database**: ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech
  - **Connection**: postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb
  - Uses @neondatabase/serverless client for direct SQL queries
  - No ORM - direct SQL with template literals
  - **Single source of truth** for all environments (local, VPS prod/dev, WA Monitor)
  - Database configuration and connection setup
- `scripts/migrations/` - Custom database migration scripts
  - Migration runner and SQL files
  - Database setup and seeding utilities

### Development & Testing
- `tests/` - Test suites and e2e tests
- `docs/` - Documentation
  - `docs/CHANGELOG.md` - **Daily work log and deployment tracking**
  - `docs/TRACKING_SYSTEM.md` - **Complete guide to tracking system**
  - `docs/page-logs/` - **Page development logs tracking all changes with timestamps**
  - `docs/PROGRESS.md` - Project phase completion tracking

### Deployment & Production
- `vercel/` - **Vercel deployment management** (See `vercel/CLAUDE.md` for deployment protocol)
  - `vercel/docs/` - Deployment guides and checklists
  - `vercel/scripts/` - Automated deployment scripts
  - Complete environment variables reference
  - Troubleshooting guides
- `docs/VPS/` - **VPS deployment documentation** (Hostinger Lithuania server)
  - `DEPLOYMENT.md` - Complete deployment guide
  - `QUICK_REFERENCE.md` - One-liner commands
  - `DEPLOYMENT_HISTORY.md` - Deployment logs

### AI Assistant Helpers
- `.agent-os/` - AI agent configuration and project specs
- `.antihall/` - Anti-hallucination validation system (prevents AI from referencing non-existent code)

## Archived Content
Non-essential files have been moved to `../FF_React_Archive/` to keep the codebase clean:
- Migration scripts (one-time fixes)
- Temporary files and test outputs
- Legacy code (ForgeFlow-v2-FF2)
- `archive/old-layouts/` - Old layout components (MainLayout, simple Layout) replaced by AppLayout

## 🚨 CRITICAL: How to Start the Server

### ✅ ALWAYS USE THIS METHOD (Production Mode):
```bash
# Step 1: Build the application (REQUIRED FIRST)
npm run build

# Step 2: Start the server on port 3005
PORT=3005 npm start
```
**Access the app at: http://localhost:3005**

### ❌ DO NOT USE Development Mode:
```bash
npm run dev  # ⚠️ WILL FAIL - Has Watchpack bug
```

### Why This Works:
- **Known Bug**: The development server has a Watchpack bug due to nested package.json files in the `neon/` directory
- **Solution**: Production mode bypasses the file watcher entirely
- **Affects**: Both Next.js 14 and 15
- **Stability**: Production mode is 100% stable for local development

### If You Need to Make Code Changes:
1. Make your code changes
2. Stop the server (Ctrl+C)
3. Rebuild: `npm run build`
4. Restart: `PORT=3005 npm start`

## Key Commands

### Development
```bash
# PRODUCTION MODE (RECOMMENDED - Works reliably)
npm run build        # Build for production
PORT=3005 npm start  # Start production server

# DEVELOPMENT MODE (Currently has Watchpack bug)
npm run dev          # ⚠️ Has known issues - use production mode instead

# Other commands
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Database
```bash
npm run db:migrate   # Run custom migration scripts
npm run db:seed      # Seed database with initial data
npm run db:validate  # Validate database schema and connections
npm run db:setup     # Initial database setup
npm run db:test      # Run database tests
```

### Testing
```bash
npm test            # Run Vitest tests
npm run test:e2e    # Run Playwright e2e tests
```

### AI Validation
```bash
npm run antihall    # Run anti-hallucination validator
```

## Tech Stack

### Current Stack (Production) ✅
- **Framework**: Next.js 14+ with App Router
- **Frontend**: React 18, TypeScript, TailwindCSS
- **Authentication**: Clerk (complete integration)
- **Database**: Neon PostgreSQL (serverless client, direct SQL)
- **File Storage**: Firebase Storage (for PDFs, images - see `docs/ARCHITECTURE_STORAGE.md`)
- **API**: Next.js API Routes (App Router)
- **Testing**: Vitest, Playwright
- **Deployment**: Vercel (optimized SSR/ISR)

### Legacy Stack (Archived/Migrated)
- **Framework**: React 18 + Vite (archived for reference)
- **Backend**: Express server (replaced by Next.js API routes)
- **Authentication**: Firebase Auth (replaced by Clerk)
- **Database**: Firebase Firestore (migrated to Neon PostgreSQL)
- **Note**: Firebase Storage still used for file uploads (intentional hybrid architecture)

## Important Notes for AI Assistants

### Migration Context ✅
- **Migration Complete**: Next.js app is now the production application
- **Clerk Integration**: All authentication uses Clerk (Firebase Auth fully replaced)
- **Single Codebase**: Next.js app is the active codebase
- **Legacy Reference**: Previous React/Vite app archived for reference only

### Development Guidelines
1. Always check existing code patterns before implementing new features
2. Database uses Neon serverless client with direct SQL queries (no ORM)
3. SOW import functionality is an active feature - keep related files
4. Use the antihall validator to verify code references exist
5. Archive directory (`../FF_React_Archive/`) contains old/temporary files if needed for reference
6. **All new features**: Implement in Next.js app (current production)
7. **Authentication**: Use Clerk patterns exclusively (Firebase Auth removed)
8. **API Routes**: Use Next.js App Router API routes (Express server retired)

### API Response Standards

**CRITICAL**: All API endpoints MUST use standardized response formats for consistency.

#### Standard Response Format
Use the `apiResponse` helper from `lib/apiResponse.ts`:

```typescript
import { apiResponse } from '@/lib/apiResponse';

// Success response (200)
return apiResponse.success(res, data, 'Optional message');

// Created response (201)
return apiResponse.created(res, data, 'Resource created successfully');

// Error responses
return apiResponse.notFound(res, 'Resource', id);
return apiResponse.validationError(res, { field: 'Error message' });
return apiResponse.unauthorized(res);
return apiResponse.internalError(res, error);
```

#### Response Structure
All responses follow this format:
```typescript
// Success
{
  success: true,
  data: {...},           // The actual data
  message?: string,      // Optional success message
  meta: {
    timestamp: string    // ISO timestamp
  }
}

// Error
{
  success: false,
  error: {
    code: string,        // Error code enum
    message: string,     // Human-readable message
    details?: any        // Optional error details
  },
  meta: {
    timestamp: string
  }
}
```

#### Frontend API Service Pattern
Frontend services must handle the standard response format:

```typescript
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;  // Unwrap { success: true, data: {...} }
}
```

**Why This Matters**:
- Inconsistent response formats cause frontend parsing errors
- The `data.data || data` pattern handles both wrapped and unwrapped responses
- Standardization prevents 405 errors and mysterious failures
- See `src/services/contractor/contractorApiService.ts` for reference implementation

**Best Practice**: Always use `apiResponse` helper in new APIs. When modifying existing APIs that use manual `{ success: true, data: ... }`, consider migrating to the helper for maintainability.

### SOW Import Process (Step 1 after Project Creation)
**Important**: After creating a new project, import SOW data using the proven scripts in `/scripts/sow-import/`:

#### For Fibre Data Import:
```bash
# Edit the script to set your PROJECT_ID and file path, then run:
node /home/louisdup/VF/Apps/FF_React/scripts/sow-import/import-fibre-louissep15.cjs

# Verify the import:
node /home/louisdup/VF/Apps/FF_React/scripts/sow-import/verify-fibre-louissep15.cjs
```

**Script Features**:
- Uses `pg` library (NOT @neondatabase/serverless) - proven to be more reliable for batch operations
- Batch processing (500 records per batch for fibre)
- Automatic deduplication by segment_id
- Multi-value INSERT with ON CONFLICT handling
- Performance: ~260 segments/second

**Data Visibility in UI**:
- `/sow` - SOW Dashboard
- `/fiber-stringing` - Fiber Stringing Dashboard
- `/sow/list` - SOW List page
- API: `/api/sow/fibre?projectId={PROJECT_ID}`

**Similar scripts available for**:
- Poles: `/scripts/sow-import/run-import.cjs`
- Drops: `/scripts/sow-import/run-import-drops.cjs`
- See `/SOW/docs/importlog.md` for detailed import history and results

### Coding Standards
1. **File Size Limit**: Keep files under 300 lines (enforces better organization)
2. **Component Structure**:
   - Components should be < 200 lines
   - Extract business logic to custom hooks
   - Keep only UI logic in components
3. **Type Organization**: Group types by module (e.g., `types/procurement/base.types.ts`)
4. **Service Pattern**: Domain-focused services, split large services into operations
5. **Custom Hooks**: Use for data fetching, business logic, and reusable UI state

### API Route Naming Conventions

**CRITICAL**: Next.js requires consistent dynamic parameter names throughout a route hierarchy.

#### The Rule
If you have both a file and directory with dynamic parameters at the same level, they MUST use the same parameter name:

```bash
# ❌ WRONG - Will cause build error
pages/api/contractors/[id].ts
pages/api/contractors/[id]/documents.ts     # OK - uses 'id'
pages/api/contractors/[contractorId]/       # ERROR - conflicts with [id].ts

# ✅ CORRECT - Consistent parameter names
pages/api/contractors/[contractorId].ts
pages/api/contractors/[contractorId]/documents.ts
pages/api/contractors/[contractorId]/teams.ts
```

#### Build Error Message
```
Error: You cannot use different slug names for the same dynamic path ('contractorId' !== 'id')
```

#### Current Standard Parameter Names
Maintain consistency across the codebase:
- **Contractors**: `[contractorId]` - `pages/api/contractors/[contractorId].ts`
- **Projects**: `[projectId]` - `pages/api/projects/[projectId].ts`
- **Suppliers**: `[supplierId]` - `pages/api/suppliers/[supplierId].ts`
- **Clients**: `[id]` - `pages/api/clients/[id].ts` (no subdirectories)
- **Staff**: No dynamic routes at this level

#### Accessing Parameters in Handlers
Use destructuring with rename to maintain backward compatibility:

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Destructure with rename - keeps internal code using 'id'
  const { contractorId: id } = req.query;

  // Rest of code can continue using 'id' variable
  const contractor = await service.getById(id);
}
```

**When creating new API routes**: Use descriptive parameter names (e.g., `[projectId]`, `[contractorId]`) instead of generic `[id]` to avoid future conflicts.

### ⚠️ CRITICAL: Vercel Deployment Issue with Nested Dynamic Routes

**PROBLEM**: Vercel's Pages Router does NOT properly deploy nested dynamic routes when both a file and directory exist at the same level.

#### The Issue
```bash
# This structure causes 404 errors in production (works locally):
pages/api/contractors/[contractorId].ts          # ✓ Deployed
pages/api/contractors/[contractorId]/            # ✗ NOT deployed
pages/api/contractors/[contractorId]/onboarding/stages.ts  # ✗ Returns 404

# Result: Routes build locally but return 404 in production
```

#### The Solution: Use Flattened Routes
```bash
# Instead of nested routes, use query parameters:
pages/api/contractors-onboarding-stages.ts
# Access: /api/contractors-onboarding-stages?contractorId={id}

pages/api/contractors-onboarding-stages-update.ts
# Access: /api/contractors-onboarding-stages-update?contractorId={id}&stageId={id}
```

#### Verified Pattern (Works in Production)
Follow the existing **documents pattern**:
- ✅ `/api/contractors-documents?contractorId={id}`
- ✅ `/api/contractors-documents-upload?contractorId={id}`
- ✅ `/api/contractors-documents-update?contractorId={id}&docId={id}`
- ✅ `/api/contractors-documents-verify?contractorId={id}&docId={id}`

#### When to Use Flattened Routes
**ALWAYS** use flattened routes when:
1. Creating new API endpoints under an entity that already has a top-level file (e.g., `[contractorId].ts`)
2. The route needs to work in Vercel production
3. You want to avoid mysterious 404 errors that only appear in production

#### Historical Context
- **Oct 29, 2025** (commit c110676): Fixed documents routes by flattening
- **Oct 31, 2025** (commit 4dafd63): Fixed onboarding routes by flattening
- Pattern confirmed working in production for both cases

**REMEMBER**: If it works locally but returns 404 in production, check for nested dynamic routes!

### 📝 Page Development Logging
**IMPORTANT**: After making changes to any page, create or update the corresponding log in `docs/page-logs/`

1. **When to Log**: Document all significant changes, bug fixes, or feature additions to pages
2. **Log Format**: Use timestamp format: `Month DD, YYYY - HH:MM AM/PM`
3. **What to Include**:
   - Problem description
   - Solution implemented with file:line references
   - Testing results
   - Related API endpoints
4. **Example**: See `docs/page-logs/dashboard.md` for reference
5. **Index**: Update `docs/page-logs/README.md` when creating new page logs

This practice ensures knowledge retention and helps debug similar issues quickly.

## Modular Architecture ("Lego Block" Pattern)

### Design Philosophy
FibreFlow uses a modular architecture where features are self-contained, plug-and-play modules. Each module is like a Lego block - independent, reusable, and easy to debug or remove.

### Module Structure
Modules live in `src/modules/` and follow this structure:

```
src/modules/{module-name}/
├── types/                    # TypeScript interfaces and types
│   └── {module}.types.ts
├── services/                 # Business logic and API services
│   ├── {module}Service.ts    # Core business logic
│   └── {module}ApiService.ts # Frontend API client
├── utils/                    # Helper functions and utilities
│   └── {module}Rules.ts      # Business rules/calculations
├── components/               # UI components (React)
│   ├── {Module}Dashboard.tsx
│   ├── {Module}Card.tsx
│   └── index.ts              # Component exports
└── hooks/                    # Custom React hooks (optional)
    └── use{Module}.ts
```

### Example: RAG Module
The RAG (Red/Amber/Green) contractor health monitoring system demonstrates this pattern:

```
src/modules/rag/
├── types/rag.types.ts        # Complete type system
├── services/
│   ├── ragCalculationService.ts  # Core calculation logic
│   └── ragApiService.ts          # Frontend API client
├── utils/ragRules.ts         # Business rules engine
└── components/
    ├── RagDashboard.tsx      # Main dashboard
    ├── RagStatusBadge.tsx    # Traffic light badges
    ├── RagSummaryCards.tsx   # Summary cards
    └── index.ts
```

**API Endpoint:** `pages/api/contractors-rag.ts` (flattened route)
**Page Route:** `app/contractors/rag-dashboard/page.tsx`

### Benefits of Modular Architecture
1. **Easy Debugging**: Issues are isolated to specific modules
2. **Maintainability**: Each module has clear boundaries and responsibilities
3. **Reusability**: Modules can be used across different parts of the app
4. **Team Collaboration**: Multiple developers can work on different modules
5. **Testing**: Modules can be tested independently
6. **Documentation**: Each module is self-documenting with clear structure

### When to Create a Module
Create a new module when building:
- Complex features with multiple components
- Features with business logic that might be reused
- Features that might be removed/disabled in the future
- Features that need independent testing
- Features with their own data model and API endpoints

### Module Integration
Modules integrate with the main app through:
1. **API Routes**: Flattened routes in `pages/api/`
2. **Page Routes**: Routes in `app/` that import module components
3. **Navigation**: Links added to sidebar config
4. **Shared Services**: Can use shared utilities from `src/lib/` and `src/utils/`

## WhatsApp Monitor (WA Monitor) Integration

### System Overview
The WA Monitor module displays real-time QA photo review submissions from WhatsApp groups. It's an external integration with data flowing from VPS → Database → Dashboard.

**Version:** 2.0 - Refactored (November 9, 2025)
**Architecture:** Modular, Config-Driven, Prod/Dev Separation

### Architecture v2.0

```
WhatsApp Groups
    ↓
VPS Server (72.60.17.245)
    ├── WhatsApp Bridge (Go) - Captures messages via whatsmeow
    │   └── SQLite: /opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db
    │
    ├── Drop Monitor - PRODUCTION (/opt/wa-monitor/prod/)
    │   ├── Service: wa-monitor-prod
    │   ├── Config: config/projects.yaml (4 projects)
    │   └── Logs: logs/wa-monitor-prod.log
    │
    └── Drop Monitor - DEVELOPMENT (/opt/wa-monitor/dev/)
        ├── Service: wa-monitor-dev
        ├── Config: config/projects.yaml (1 project: Velo Test)
        └── Logs: logs/wa-monitor-dev.log
    ↓
Neon PostgreSQL (qa_photo_reviews table)
    ↓
FibreFlow Dashboard (/wa-monitor)
    ├── API: /api/wa-monitor-daily-drops
    ├── Auto-refresh: 30 seconds
    └── Displays: Daily submissions by project
    ↓
SharePoint Sync (Nightly at 8pm SAST)
```

**Key Features:**
- ✅ **Dual-Monitoring:** Velo Test monitored by BOTH prod and dev for comparison testing
- ✅ **Config-Driven:** Edit YAML file instead of Python code
- ✅ **5-Minute Project Addition:** Down from 4 hours
- ✅ **Modular Code:** Separate modules for config, database, monitoring

### Database Schema
**Table**: `qa_photo_reviews`

Key columns:
- `drop_number` - Drop ID (e.g., DR1751832)
- `project` - Project name (Lawley, Mohadin, Velo Test)
- `whatsapp_message_date` - **Actual WhatsApp message timestamp** (source of truth for daily counts)
- `created_at` - When database entry was created (may differ from message date)
- `review_date` - Date of QA review
- `step_01_house_photo` through `step_12_customer_signature` - QA checklist

### Dashboard Features
- Real-time display of today's submissions by project
- Accurate daily counts using `whatsapp_message_date` (not `created_at`)
- Avoids counting historical batch processing as "today's submissions"
- Auto-refresh every 30 seconds
- Export to CSV

### API Endpoints
- **GET** `/api/wa-monitor-drops` - Get all drops with summary
- **GET** `/api/wa-monitor-daily-drops` - Get today's submissions by project
- **POST** `/api/wa-monitor-sync-sharepoint` - Sync to SharePoint

### Important Notes
1. **Data Source**: VPS-hosted WhatsApp bridge (`/opt/velo-test-monitor/`)
2. **Accurate Counting**: Uses `whatsapp_message_date` to avoid historical batch processing inflation
3. **VPS Updates**: Changes to drop monitor require VPS SSH access and service restart
4. **Documentation**: See `docs/WA_MONITOR_DATA_FLOW_REPORT.md` for complete investigation

### Monitored Groups
- **Lawley**: 120363418298130331@g.us (Lawley Activation 3)
- **Mohadin**: 120363421532174586@g.us (Mohadin Activations)
- **Velo Test**: 120363421664266245@g.us (Velo Test group)
- **Mamelodi**: 120363408849234743@g.us (Mamelodi POP1 Activations)

### Adding a New WhatsApp Group (v2.0 - 5 Minutes!)

**Process Time:** 5 minutes (down from 4 hours in v1.0)

**Prerequisites:**
- WhatsApp bridge is in the group (number 064 041 2391)
- Group JID (find using: `tail -100 /opt/velo-test-monitor/logs/whatsapp-bridge.log | grep "Chat="`)

**Steps:**

**1. Test in Dev First (Recommended):**
```bash
ssh root@72.60.17.245
nano /opt/wa-monitor/dev/config/projects.yaml

# Add project in YAML format:
# - name: NewProject
#   enabled: true
#   group_jid: "XXXXXXXXXX@g.us"
#   description: "NewProject description"

systemctl restart wa-monitor-dev
tail -f /opt/wa-monitor/dev/logs/wa-monitor-dev.log
# Verify it's monitoring the new group
```

**2. Deploy to Production:**
```bash
nano /opt/wa-monitor/prod/config/projects.yaml
# Add same project

/opt/wa-monitor/prod/restart-monitor.sh  # ✅ Use safe restart (clears cache)
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log
# Verify production is monitoring
```

**3. Verify:**
- Post test drop to group
- Check dashboard: https://app.fibreflow.app/wa-monitor
- Update `CLAUDE.md` - "Monitored Groups" section

**That's it! ✅**

**Detailed Guide:** See `docs/WA_MONITOR_ADD_PROJECT_5MIN.md`

### Dual-Monitoring Setup (Velo Test)

**Velo Test group is monitored by BOTH prod and dev services:**

**Production Config:**
```yaml
# /opt/wa-monitor/prod/config/projects.yaml
- name: Velo Test
  enabled: true
  group_jid: "120363421664266245@g.us"
  description: "Velo Test group"
```

**Dev Config:**
```yaml
# /opt/wa-monitor/dev/config/projects.yaml
- name: Velo Test
  enabled: true
  group_jid: "120363421664266245@g.us"
  description: "Velo Test group (dev testing)"
```

**Use Cases:**
1. **Compare behavior:** Test dev changes against prod baseline
2. **Debug issues:** Reproduce in dev without affecting prod
3. **Validate:** Ensure dev behaves identically before promoting

**Compare Logs:**
```bash
# Terminal 1: Production
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep "Velo Test"

# Terminal 2: Development
tail -f /opt/wa-monitor/dev/logs/wa-monitor-dev.log | grep "Velo Test"
```

Both services process the same messages from the same group!

### VPS Management (v2.0)

### ⚠️ CRITICAL: ALWAYS Use Safe Restart Script for Production

**WHY:** Python caches .pyc bytecode. Plain `systemctl restart` uses stale cache, causing old buggy code to run even after updating source files.

**ALWAYS USE (Production):**
```bash
ssh root@72.60.17.245
/opt/wa-monitor/prod/restart-monitor.sh  # ✅ Clears cache automatically
```

**NEVER USE (Production):**
```bash
systemctl restart wa-monitor-prod  # ❌ Keeps stale .pyc cache - WRONG!
```

**Service Commands:**
```bash
# Check both services status
ssh root@72.60.17.245
systemctl status wa-monitor-prod wa-monitor-dev

# View production logs
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log

# View dev logs
tail -f /opt/wa-monitor/dev/logs/wa-monitor-dev.log

# Restart PRODUCTION (use safe script)
/opt/wa-monitor/prod/restart-monitor.sh  # ✅ ALWAYS use this

# Restart DEV (regular restart OK for dev)
systemctl restart wa-monitor-dev

# Check WhatsApp bridge
ps aux | grep whatsapp-bridge

# Compare prod/dev behavior (same group)
# Terminal 1:
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log | grep "Velo Test"
# Terminal 2:
tail -f /opt/wa-monitor/dev/logs/wa-monitor-dev.log | grep "Velo Test"
```

**Quick Verification:**
```bash
# Verify both services running
ssh root@72.60.17.245 "systemctl is-active wa-monitor-prod wa-monitor-dev"
# Should show: active, active

# Check configs
cat /opt/wa-monitor/prod/config/projects.yaml
cat /opt/wa-monitor/dev/config/projects.yaml
```

**📖 Read More:** See `docs/wa-monitor/PYTHON_CACHE_ISSUE.md` for full explanation of Python cache problem

### ⚠️ KNOWN ISSUE: Resubmission Handler LID Bug

**Status:** Database fixed ✅ | VPS code fix pending ⏳

**Problem:** When drops are **resubmitted** (posted again), the monitor resolves LIDs correctly but doesn't update `submitted_by` in the database. This causes @mentions to show LID numbers instead of contact names.

**Example:**
- Monitor logs: `🔗 Resolved LID 205106247139540 → 27837912771` ✅
- Database has: `submitted_by = '205106247139540'` ❌
- WhatsApp shows: `@+20 5106247139540` instead of `@Contractor_Name`

**Root Cause:**
- File: `/opt/wa-monitor/prod/modules/monitor.py` - Line ~115
- Bug: `handle_resubmission()` doesn't pass `resolved_phone` parameter
- File: `/opt/wa-monitor/prod/modules/database.py`
- Bug: `handle_resubmission()` doesn't update `submitted_by` and `user_name` fields

**Immediate Workaround:**
If you see LID numbers in feedback, fix manually in database:
```bash
# 1. Find drops with LIDs (should be 0 after Nov 12 cleanup)
psql $DATABASE_URL -c "
  SELECT drop_number, submitted_by, LENGTH(submitted_by) as len
  FROM qa_photo_reviews
  WHERE submitted_by IS NOT NULL AND LENGTH(submitted_by) > 11;
"

# 2. Look up LID in WhatsApp database on VPS
ssh root@72.60.17.245
sqlite3 /opt/velo-test-monitor/services/whatsapp-bridge/store/whatsapp.db \
  "SELECT lid, pn FROM whatsmeow_lid_map WHERE lid = 'PASTE_LID_HERE';"

# 3. Update database with phone number
psql $DATABASE_URL -c "
  UPDATE qa_photo_reviews
  SET user_name = 'PHONE_NUMBER', submitted_by = 'PHONE_NUMBER', updated_at = NOW()
  WHERE drop_number = 'DR_NUMBER';
"
```

**Permanent Fix:** See `docs/wa-monitor/RESUBMISSION_FIX_NOV12_2025.md` for:
- Detailed fix instructions for VPS code
- Testing checklist
- Prevention measures

**Affected Drops (Fixed Nov 12, 2025):**
- DR470114 (Mamelodi) - LID: 205106247139540 → Phone: 27837912771
- DR1857292 (Mohadin) - LID: 26959979507783 → Phone: 27633159281
- DR1734207 (Lawley) - LID: 160314653982720 → Phone: 27715844472
- DR1734242 (Lawley) - LID: 265167388586133 → Phone: 27728468714
- DR1857265 (Mohadin) - LID: 140858317902021 → Phone: 27651775287

### 🚨 CRITICAL: Database Configuration

**THE APP AND DROP MONITOR MUST USE THE SAME DATABASE**

**Correct Database (ALWAYS):**
```
postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb
```

**Configuration Files That MUST Match:**

1. **Drop Monitor Script** (Line 66):
   ```python
   # /opt/velo-test-monitor/services/realtime_drop_monitor.py
   NEON_DB_URL = os.getenv('NEON_DATABASE_URL', 'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require')
   ```

2. **Drop Monitor Systemd Service**:
   ```bash
   # /etc/systemd/system/drop-monitor.service
   Environment="NEON_DATABASE_URL=postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require"
   ```

3. **Production App Environment**:
   ```bash
   # /var/www/fibreflow/.env.production
   DATABASE_URL=postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

4. **WhatsApp Bridge SQLite Path** (Line 65):
   ```python
   # /opt/velo-test-monitor/services/realtime_drop_monitor.py
   MESSAGES_DB_PATH = os.getenv('WHATSAPP_DB_PATH', '/opt/velo-test-monitor/services/whatsapp-bridge/store/messages.db')
   ```

**Verification Commands:**
```bash
# 1. Check drop monitor database connection
ssh root@72.60.17.245 "grep 'NEON_DB_URL' /opt/velo-test-monitor/services/realtime_drop_monitor.py"

# 2. Check systemd environment
ssh root@72.60.17.245 "cat /etc/systemd/system/drop-monitor.service | grep Environment"

# 3. Check production app environment
ssh root@72.60.17.245 "grep 'DATABASE_URL' /var/www/fibreflow/.env.production"

# 4. Test dashboard shows drops
curl https://app.fibreflow.app/api/wa-monitor-daily-drops | jq .
```

**After ANY Database Configuration Change:**
```bash
# 1. Restart drop monitor
ssh root@72.60.17.245 "systemctl daemon-reload && systemctl restart drop-monitor"

# 2. Rebuild and restart production app
ssh root@72.60.17.245 "cd /var/www/fibreflow && npm run build && pm2 restart fibreflow-prod"

# 3. Verify both are using same database
ssh root@72.60.17.245 "psql 'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require' -c 'SELECT COUNT(*) FROM qa_photo_reviews;'"
```

**Common Issue:** If dashboard shows different data than drop monitor logs, they're using different databases. Check all 4 configuration files above.

## Deployment Architecture

### Two Deployment Environments

FibreFlow uses a **dual environment setup** on VPS for professional development workflow:

| Environment | URL | Branch | Port | PM2 Process | Purpose |
|-------------|-----|--------|------|-------------|---------|
| **Production** | https://app.fibreflow.app | `master` | 3005 | `fibreflow-prod` | Live production site |
| **Development** | https://dev.fibreflow.app | `develop` | 3006 | `fibreflow-dev` | Testing & QA before production |

**VPS Infrastructure:**
- **Server**: Hostinger VPS (Lithuania) - 72.60.17.245
- **OS**: Ubuntu 24.04 LTS
- **Node.js**: v20.19.5
- **Process Manager**: PM2 v6.0.13
- **Web Server**: Nginx v1.24.0 (reverse proxy)
- **SSL**: Let's Encrypt (auto-renewal enabled)

**Directory Structure:**
```
/var/www/
├── fibreflow/          → Production (master branch, port 3005)
├── fibreflow-dev/      → Development (develop branch, port 3006)
└── ecosystem.config.js → PM2 configuration for both processes
```

### 🚀 Professional Deployment Workflow

**CRITICAL: Always deploy to DEV first, test, then promote to PRODUCTION.**

#### Git Branch Strategy
```
feature/new-feature  →  develop  →  master
     (local)          (dev site)   (production)
```

#### Step-by-Step Workflow

**1. Local Development**
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature

# Develop locally
npm run build
PORT=3005 npm start
# Test at http://localhost:3005
```

**2. Deploy to Development (Testing)**
```bash
# Commit and push to develop branch
git add .
git commit -m "feat: description of changes"
git checkout develop
git merge feature/my-new-feature
git push origin develop

# Deploy to DEV environment
sshpass -p 'VeloF@2025@@' ssh -o StrictHostKeyChecking=no root@72.60.17.245 \
  "cd /var/www/fibreflow-dev && git pull && npm ci && npm run build && pm2 restart fibreflow-dev"

# Test at https://dev.fibreflow.app
```

**3. Test on Development**
- ✅ Verify all features work
- ✅ Check for console errors
- ✅ Test user flows
- ✅ Verify API endpoints
- ✅ Check responsive design

**4. Promote to Production (Go Live)**
```bash
# Only after dev testing passes!
git checkout master
git merge develop
git push origin master

# Deploy to PRODUCTION
sshpass -p 'VeloF@2025@@' ssh -o StrictHostKeyChecking=no root@72.60.17.245 \
  "cd /var/www/fibreflow && git pull && npm ci && npm run build && pm2 restart fibreflow-prod"

# Verify at https://app.fibreflow.app
```

### 🤖 AI Assistant Guidelines

**When implementing features, Claude Code MUST:**

1. **Always work on feature branches** - Never commit directly to `master` or `develop`
2. **Deploy to dev.fibreflow.app first** - Test all changes on dev before production
3. **Wait for user confirmation** - Only deploy to production after user approves dev testing
4. **Document changes** - Update relevant logs in `docs/page-logs/` and `docs/CHANGELOG.md`

**Deployment Command Shortcuts:**

```bash
# Deploy to DEV (for testing)
sshpass -p 'VeloF@2025@@' ssh -o StrictHostKeyChecking=no root@72.60.17.245 \
  "cd /var/www/fibreflow-dev && git pull && npm ci && npm run build && pm2 restart fibreflow-dev"

# Deploy to PRODUCTION (after dev testing)
sshpass -p 'VeloF@2025@@' ssh -o StrictHostKeyChecking=no root@72.60.17.245 \
  "cd /var/www/fibreflow && git pull && npm ci && npm run build && pm2 restart fibreflow-prod"
```

### VPS Management Commands

```bash
# SSH into VPS
ssh root@72.60.17.245

# View PM2 processes
pm2 list
pm2 logs fibreflow-prod
pm2 logs fibreflow-dev

# Restart processes
pm2 restart fibreflow-prod
pm2 restart fibreflow-dev
pm2 restart all

# Monitor resources
pm2 monit

# View Nginx logs
tail -f /var/log/nginx/fibreflow-access.log
tail -f /var/log/nginx/fibreflow-dev-access.log
```

### Environment Variables

Both environments share the same backend services:
- **Database**: Neon PostgreSQL (cloud)
- **Authentication**: Clerk
- **File Storage**: Firebase Storage

Environment files:
- **Production**: `/var/www/fibreflow/.env.production`
- **Development**: `/var/www/fibreflow-dev/.env.production`

### VPS Documentation

Detailed documentation available in:
- Complete guide: `docs/VPS/DEPLOYMENT.md`
- Quick reference: `docs/VPS/QUICK_REFERENCE.md`
- Deployment history: `docs/VPS/DEPLOYMENT_HISTORY.md`

### Rollback Process

If production deployment fails:

```bash
# SSH into VPS
ssh root@72.60.17.245

# Rollback production to previous commit
cd /var/www/fibreflow
git log --oneline -5  # Find last working commit
git reset --hard <commit-hash>
npm ci
npm run build
pm2 restart fibreflow-prod
```