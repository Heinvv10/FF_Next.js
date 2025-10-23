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
- `api/` - Backend API endpoints and server logic
- `components/` - **Shared UI components (AppLayout is the standard layout)**
  - `layout/` - Layout components (AppLayout, Header, Sidebar, Footer)
  - `layout/index.ts` - Single source of truth for layout imports
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
- **API**: Next.js API Routes (App Router)
- **Testing**: Vitest, Playwright
- **Deployment**: Vercel (optimized SSR/ISR)

### Legacy Stack (Archived)
- **Framework**: React 18 + Vite (archived for reference)
- **Backend**: Express server (replaced by Next.js API routes)
- **Authentication**: Firebase Auth (replaced by Clerk)

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