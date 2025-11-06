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
  - Uses @neondatabase/serverless client for direct SQL queries
  - No ORM - direct SQL with template literals
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