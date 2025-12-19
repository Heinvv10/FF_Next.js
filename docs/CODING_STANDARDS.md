# FibreFlow Coding Standards

**Version:** 1.0
**Created:** 2025-12-18
**Last Updated:** 2025-12-18

This document defines the coding standards, patterns, and best practices specific to the FibreFlow Next.js application. These standards are enforced by PAI specialized agents.

---

## Table of Contents

1. [General Principles](#general-principles)
2. [File Organization](#file-organization)
3. [TypeScript Standards](#typescript-standards)
4. [React Patterns](#react-patterns)
5. [Next.js Conventions](#nextjs-conventions)
6. [Database Operations](#database-operations)
7. [API Routes](#api-routes)
8. [Authentication](#authentication)
9. [Testing](#testing)
10. [WA Monitor Module](#wa-monitor-module)
11. [Deployment](#deployment)
12. [Documentation](#documentation)

---

## General Principles

### Truth-First Development
- Never guess or hallucinate code
- Use antihall validator before suggesting code
- Mark code with confidence levels
- Admit uncertainty when present

### Simplicity Over Complexity
- Files < 300 lines
- Components < 200 lines
- Extract business logic to hooks
- Avoid premature optimization

### Progressive Enhancement
- Start with server components (Next.js default)
- Add "use client" only when needed
- Prefer static generation over SSR when possible

---

## File Organization

### Project Structure

```
src/
├── components/           # Shared UI components
│   ├── layout/          # Layout components (AppLayout, etc.)
│   ├── ui/              # Reusable UI elements
│   └── [feature]/       # Feature-specific components
│
├── modules/             # Modular "Lego blocks"
│   ├── wa-monitor/      # WhatsApp monitor (isolated)
│   ├── rag/             # Contractor health monitoring
│   └── [module]/        # Other modules
│       ├── types/       # TypeScript interfaces
│       ├── services/    # Business logic & API
│       ├── utils/       # Helpers
│       ├── components/  # UI components
│       └── hooks/       # Custom hooks
│
├── lib/                 # Shared utilities
│   ├── apiResponse.ts   # API response helper
│   ├── arcjet.ts        # Security protection
│   └── [utility].ts
│
└── services/            # Domain services
    └── [domain]Service.ts
```

### File Naming

```bash
# Components - PascalCase
AppLayout.tsx
QaReviewCard.tsx
DropStatusBadge.tsx

# Utilities - camelCase
apiResponse.ts
dateHelpers.ts
validationUtils.ts

# Services - camelCase with "Service" suffix
waMonitorService.ts
contractorService.ts
projectService.ts

# Hooks - camelCase with "use" prefix
useWaMonitorStats.ts
useAuth.ts
useContractor.ts

# Types - PascalCase with .types suffix
wa-monitor.types.ts
contractor.types.ts
project.types.ts
```

---

## TypeScript Standards

### Type Safety (Enforced by typescript-strict-enforcer)

**✅ DO:**
```typescript
// Explicit types
const data: ProjectData = await fetchProject(id);

// Type inference is OK for obvious types
const count = 10;  // Inferred as number
const isActive = true;  // Inferred as boolean

// Interface for objects
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = await fetchUser();
```

**❌ DON'T:**
```typescript
// Using 'any' (CRITICAL violation)
const data: any = await fetchProject(id);

// Missing return types on functions
async function fetchData(id) {  // Bad
  return await fetch(`/api/data/${id}`);
}

// Should be:
async function fetchData(id: string): Promise<DataType> {
  return await fetch(`/api/data/${id}`);
}
```

### Type Organization

**Module-level types:**
```typescript
// src/modules/wa-monitor/types/wa-monitor.types.ts
export interface WaMonitorDrop {
  id: string;
  dropNumber: string;
  status: 'incomplete' | 'complete';
  // ...
}

export interface WaMonitorStats {
  total: number;
  incomplete: number;
  complete: number;
}
```

**Shared types:**
```typescript
// src/types/shared.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}
```

---

## React Patterns

### Component Structure (Enforced by react-best-practices-enforcer)

**✅ DO:**
```typescript
// 1. Imports
import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout';

// 2. Types/Interfaces
interface MyComponentProps {
  id: string;
  title: string;
  onUpdate: (data: Data) => void;
}

// 3. Component
export default function MyComponent({ id, title, onUpdate }: MyComponentProps) {
  // 4. Hooks
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);

  // 5. Callbacks (use useCallback for functions passed as props)
  const handleUpdate = useCallback((newData: Data) => {
    setData(newData);
    onUpdate(newData);
  }, [onUpdate]);

  // 6. Effects (if needed)
  useEffect(() => {
    fetchData();
  }, [id]);

  // 7. Render logic
  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  // 8. JSX
  return (
    <AppLayout>
      <div>
        <h1>{title}</h1>
        {/* Component content */}
      </div>
    </AppLayout>
  );
}
```

**❌ DON'T:**
```typescript
// Missing keys in mapped elements (MAJOR violation)
{items.map(item => (
  <div>{item.name}</div>  // Missing key!
))}

// Should be:
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}

// Inline functions in JSX (MINOR violation - consider useCallback)
<button onClick={() => handleClick(item.id)}>Click</button>

// Better:
const handleClickCallback = useCallback(
  () => handleClick(item.id),
  [item.id, handleClick]
);
<button onClick={handleClickCallback}>Click</button>
```

### Hooks Rules

1. Only call hooks at the top level
2. Only call hooks from React functions
3. Use `useCallback` for functions passed as props
4. Use `useMemo` for expensive computations
5. Custom hooks start with "use"

### Component Size Limits

- **Maximum 200 lines per component** (enforced by complexity-manager)
- If exceeding 200 lines:
  - Extract business logic to custom hooks
  - Split into smaller sub-components
  - Move utility functions to separate files

**Example refactoring:**
```typescript
// ❌ Before - 250 lines component
function LargeComponent() {
  // Complex state management (50 lines)
  // Data fetching logic (40 lines)
  // Form handling (60 lines)
  // Complex JSX (100 lines)
}

// ✅ After - Split into smaller pieces
function LargeComponent() {
  const { data, loading } = useDataFetching();  // Custom hook
  const { formState, handleSubmit } = useFormHandling();  // Custom hook

  return (
    <>
      <DataSection data={data} loading={loading} />  // Sub-component
      <FormSection state={formState} onSubmit={handleSubmit} />  // Sub-component
    </>
  );
}
```

---

## Next.js Conventions

### Image Optimization (Enforced by nextjs-optimization-enforcer)

**✅ DO:**
```typescript
import Image from 'next/image';

<Image
  src="/images/logo.png"
  alt="FibreFlow Logo"
  width={200}
  height={50}
  priority  // For above-the-fold images
/>
```

**❌ DON'T:**
```typescript
// Using <img> (MAJOR violation)
<img src="/images/logo.png" alt="FibreFlow Logo" />
```

### Link Navigation (Enforced by nextjs-optimization-enforcer)

**✅ DO:**
```typescript
import Link from 'next/link';

<Link href="/contractors">View Contractors</Link>
```

**❌ DON'T:**
```typescript
// Using <a> (MAJOR violation)
<a href="/contractors">View Contractors</a>
```

### Server vs Client Components

**Default: Server Components**
```typescript
// app/page.tsx - Server component (default)
async function HomePage() {
  const data = await fetchData();  // Can fetch data directly
  return <div>{data.title}</div>;
}
```

**Client Components (only when needed):**
```typescript
// app/interactive.tsx - Client component
'use client';  // Only add when you need:
// - useState, useEffect, useCallback, etc.
// - Event handlers (onClick, onChange, etc.)
// - Browser APIs (window, document, localStorage, etc.)

import { useState } from 'react';

export default function InteractiveComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

### Page Layouts

**Standard layout (with sidebar):**
```typescript
import { AppLayout } from '@/components/layout';

export default function MyPage() {
  return (
    <AppLayout>
      <div>Page content with sidebar</div>
    </AppLayout>
  );
}
```

**Fullscreen layout (no sidebar):**
```typescript
import { AppLayout } from '@/components/layout';

export default function FullscreenPage() {
  return <div>Fullscreen content</div>;
}

// Disable layout wrapper
FullscreenPage.getLayout = (page: React.ReactElement) => page;
```

---

## Database Operations

### Connection Pattern (Enforced by database-guardian)

**✅ DO:**
```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function fetchDrop(dropNumber: string) {
  try {
    const result = await sql`
      SELECT * FROM qa_photo_reviews
      WHERE drop_number = ${dropNumber}
    `;
    return result[0];
  } catch (error) {
    console.error('Database query failed:', error);
    throw error;
  }
}
```

**❌ DON'T:**
```typescript
// Wrong endpoint (CRITICAL violation)
const sql = neon('postgresql://...ep-damp-credit-a857vku0...');

// Missing error handling (MAJOR violation)
const result = await sql`SELECT * FROM table`;

// SQL injection (CRITICAL violation)
const result = await sql`SELECT * FROM table WHERE id = '${id}'`;
// Should use parameterized: WHERE id = ${id}

// Using an ORM (we use direct SQL)
const result = await prisma.table.findMany();
```

### Database Endpoint Validation

**Always use:** `ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech`

```bash
# Verify in .env
DATABASE_URL=postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require

# Check environment variable
echo $DATABASE_URL | grep "ep-dry-night-a9qyh4sj"

# Verify in code
cat neon/config/database.ts | grep "ep-dry-night-a9qyh4sj"
```

### Table Disambiguation

**Two separate drop tables:**

```typescript
// 1. SOW imports (from Excel)
await sql`SELECT * FROM drops WHERE project_id = ${projectId}`;

// 2. WhatsApp QA data
await sql`SELECT * FROM qa_photo_reviews WHERE project = 'Lawley'`;
```

**Always check schema first:**
```bash
cat docs/DATABASE_TABLES.md
```

---

## API Routes

### API Response Helper (Enforced by api-route-validator)

**✅ DO:**
```typescript
// pages/api/my-endpoint.ts
import { apiResponse } from '@/lib/apiResponse';

export default async function handler(req, res) {
  try {
    const data = await fetchData();

    // Success
    return apiResponse.success(res, data);
  } catch (error) {
    // Error
    return apiResponse.internalError(res, error);
  }
}

// Available methods:
apiResponse.success(res, data);
apiResponse.notFound(res, 'Resource', id);
apiResponse.badRequest(res, 'Invalid input');
apiResponse.unauthorized(res);
apiResponse.forbidden(res);
apiResponse.internalError(res, error);
```

**❌ DON'T:**
```typescript
// Direct response (MAJOR violation)
res.status(200).json(data);

// Should use apiResponse helper
return apiResponse.success(res, data);
```

### Route Naming (Enforced by api-route-validator)

**✅ DO - Flat routes:**
```bash
# Good
pages/api/contractors-onboarding-stages.ts?contractorId={id}
pages/api/wa-monitor-drops.ts
pages/api/foto-reviews.ts?jobId={id}
```

**❌ DON'T - Nested dynamic routes (Vercel limitation):**
```bash
# Bad - Fails on Vercel (CRITICAL violation)
pages/api/contractors/[contractorId]/onboarding/stages.ts
pages/api/wa-monitor/[dropId]/feedback.ts
```

### Consistent Parameter Names

**Use same parameter names across related routes:**

```typescript
// ✅ Consistent
pages/api/contractors/[contractorId].ts
pages/api/contractors/[contractorId]/documents.ts
pages/api/contractors/[contractorId]/teams.ts

// ❌ Inconsistent
pages/api/contractors/[id].ts
pages/api/contractors/[contractorId]/documents.ts
pages/api/contractors/[contractor_id]/teams.ts
```

### API Security (Arcjet)

```typescript
import { withArcjetProtection, aj, ajStrict, ajGenerous } from '@/lib/arcjet';

// Standard protection (100 req/min)
export default withArcjetProtection(handler, aj);

// Strict protection (30 req/min)
export default withArcjetProtection(handler, ajStrict);

// Generous protection (300 req/min)
export default withArcjetProtection(handler, ajGenerous);
```

---

## Authentication

### Clerk Patterns (Enforced by clerk-auth-specialist)

**✅ DO:**
```typescript
import { auth } from '@clerk/nextjs';

export default async function handler(req, res) {
  // Get authenticated user
  const { userId } = auth();

  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  // Continue with authenticated logic
  const data = await fetchUserData(userId);
  return apiResponse.success(res, data);
}
```

**❌ DON'T:**
```typescript
// Using Firebase Auth (CRITICAL violation - deprecated)
import { auth } from 'firebase/auth';

// Missing auth check (MAJOR violation)
export default async function handler(req, res) {
  // No auth check!
  const data = await fetchData();
  return apiResponse.success(res, data);
}
```

### Protected Routes

All API routes that access user data must have Clerk auth check:

```typescript
// pages/api/user-data.ts
import { auth } from '@clerk/nextjs';
import { apiResponse } from '@/lib/apiResponse';

export default async function handler(req, res) {
  const { userId } = auth();
  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  // Protected logic here
}
```

---

## Testing

### Test Standards (Enforced by testing-coverage-enforcer)

**✅ DO:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('WaMonitorService', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup (REQUIRED)
  });

  it('should fetch drops', async () => {
    const drops = await waMonitorService.fetchDrops();

    // Assertions (REQUIRED)
    expect(drops).toBeDefined();
    expect(drops.length).toBeGreaterThan(0);
  });
});
```

**❌ DON'T:**
```typescript
// Test without assertions (CRITICAL violation)
it('should fetch drops', async () => {
  const drops = await waMonitorService.fetchDrops();
  // No expect()!
});

// Missing cleanup (MAJOR violation)
describe('MyService', () => {
  beforeEach(() => {
    // Setup
  });

  // No afterEach cleanup!
});
```

### E2E Testing (Playwright)

**Critical paths require E2E tests:**
- WA Monitor dashboard
- Foto Reviews submission
- Contractor onboarding
- SOW import

```typescript
import { test, expect } from '@playwright/test';

test('WA Monitor feedback flow', async ({ page }) => {
  await page.goto('http://localhost:3005/wa-monitor');

  // Find drop
  await page.fill('[data-testid="search-input"]', 'DRTEST001');
  await page.click('[data-testid="search-button"]');

  // Click edit
  await page.click('[data-testid="edit-button"]');

  // Mark incorrect
  await page.fill('[data-testid="step-1-comment"]', 'Photo unclear');

  // Send feedback
  await page.click('[data-testid="send-feedback-button"]');

  // Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### Coverage Target

- **80% overall coverage** (testing-coverage-enforcer)
- **100% for critical paths** (payment, auth, data integrity)

---

## WA Monitor Module

### Isolation Rules (Enforced by wa-monitor-specialist)

**✅ DO - Internal imports only:**
```typescript
// src/modules/wa-monitor/components/QaReviewCard.tsx
import { apiResponse } from '../lib/apiResponse';  // ✅ Internal copy
import { waMonitorService } from '../services/waMonitorService';  // ✅ Internal
import { formatDate } from '../utils/waMonitorHelpers';  // ✅ Internal
```

**❌ DON'T - Main app imports (CRITICAL violation):**
```typescript
// src/modules/wa-monitor/components/QaReviewCard.tsx
import { apiResponse } from '@/lib/apiResponse';  // ❌ Main app dependency
import { someService } from '@/services/someService';  // ❌ Main app dependency
```

### Before WA Monitor Changes

**Always read these first:**
```bash
cat src/modules/wa-monitor/API_CONTRACT.md
cat src/modules/wa-monitor/ISOLATION_GUIDE.md
cat src/modules/wa-monitor/TROUBLESHOOTING.md
```

### VPS Restart (CRITICAL)

**✅ DO - Safe restart (clears Python cache):**
```bash
ssh root@72.60.17.245
/opt/wa-monitor/prod/restart-monitor.sh  # ✅ Use this!
```

**❌ DON'T - Direct systemctl (keeps stale cache):**
```bash
systemctl restart wa-monitor-prod  # ❌ Don't use this!
```

---

## Deployment

### Workflow (Enforced by deployment-validator)

**✅ DO - Always deploy to dev first:**
```bash
# 1. Merge to develop
git checkout develop
git merge feature/my-feature
git push

# 2. Deploy to dev (MANDATORY)
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow-dev && git pull && npm ci && npm run build && pm2 restart fibreflow-dev"

# 3. Test on https://dev.fibreflow.app
# - Manual testing
# - E2E tests
# - Verify no regressions

# 4. If OK, merge to master
git checkout master
git merge develop
git push

# 5. Deploy to production
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow && git pull && npm ci && npm run build && pm2 restart fibreflow-prod"

# 6. Clear browser cache (remind users!)
```

**❌ DON'T - Skip dev deployment (CRITICAL violation):**
```bash
# This is BLOCKED by deployment-validator
git push origin master  # Merging to master without dev testing!
```

### Branch Strategy

```
feature/my-feature  →  develop  →  master
                       (dev.ff)    (app.ff)
                         ↓            ↓
                       Test        Production
```

### Post-Deployment Checks

```bash
# Verify PM2 status
ssh louis@100.96.203.105
pm2 list

# Check logs
pm2 logs fibreflow-prod --lines 50

# Verify application is running
curl https://app.fibreflow.app
```

---

## Documentation

### Page Change Logs (Enforced by documentation-enforcer)

**After modifying a page, update its log:**

```bash
# Create/update: docs/page-logs/{page-name}.md
```

**Format:**
```markdown
# Page: Contractors Dashboard

## December 18, 2025 - 3:45 PM

**Problem:**
Contractor list not loading for users with > 100 contractors

**Solution:**
Added pagination to contractor list API (pages/api/contractors.ts:45)
- Limit: 50 contractors per page
- Added "Load More" button

**Files Changed:**
- pages/api/contractors.ts:45
- src/components/ContractorList.tsx:120

**Testing:**
- Tested with 150 contractors ✅
- Pagination works correctly ✅
- No performance issues ✅
```

### Module Documentation

Each module must have:
- `README.md` - Overview, usage, examples
- `API_CONTRACT.md` - API specifications (if applicable)
- `ISOLATION_GUIDE.md` - Development workflow (if isolated)
- `TROUBLESHOOTING.md` - Common issues and fixes

### CLAUDE.md Updates

Update `CLAUDE.md` after:
- Major architecture changes
- New modules added
- Critical dependencies changed
- Deployment configuration changes

---

## Pre-Commit Checklist

Before every commit, verify:

```bash
# 1. TypeScript check
npm run type-check

# 2. ESLint
npm run lint

# 3. No console.log
grep -r "console.log" src/ | grep -v "console.error"

# 4. Database endpoint correct
grep -r "ep-dry-night-a9qyh4sj" neon/config/

# 5. API routes use apiResponse helper
# (Manual check or use grep)

# 6. WA Monitor isolation maintained (if applicable)
grep -r "from '@/lib/" src/modules/wa-monitor/
grep -r "from '@/services/" src/modules/wa-monitor/

# 7. Documentation updated
# Check docs/page-logs/ if pages modified
```

---

## Summary

### Critical Standards

✅ **TypeScript:** No `any` types, explicit types required
✅ **Database:** Use ep-dry-night-a9qyh4sj endpoint, error handling required
✅ **API Routes:** Use apiResponse helper, flat routes only
✅ **Authentication:** Clerk only (no Firebase Auth)
✅ **WA Monitor:** Zero main app dependencies
✅ **Deployment:** Dev-first workflow mandatory
✅ **Testing:** 80% coverage, E2E for critical paths
✅ **Component Size:** Max 200 lines, extract to hooks
✅ **File Size:** Max 300 lines, split into modules

### Enforcement

All standards enforced by **10 PAI specialized agents**:
1. typescript-strict-enforcer
2. react-best-practices-enforcer
3. nextjs-optimization-enforcer
4. testing-coverage-enforcer
5. complexity-manager
6. database-guardian
7. wa-monitor-specialist
8. api-route-validator
9. deployment-validator
10. clerk-auth-specialist

### Resources

- **PAI Setup:** `docs/PAI_SETUP.md`
- **Project Expertise:** `.claude/expertise.yaml`
- **Agents Configuration:** `.claude/agents/project_agents.yaml`
- **Database Schema:** `docs/DATABASE_TABLES.md`
- **WA Monitor Docs:** `src/modules/wa-monitor/README.md`

---

**Last Updated:** 2025-12-18
**Version:** 1.0
**Maintained By:** PAI System
