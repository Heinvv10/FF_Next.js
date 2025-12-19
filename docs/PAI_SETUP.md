# PAI Setup - FF_Next.js (FibreFlow)

**Version:** 1.0
**Created:** 2025-12-18
**Status:** ✅ Complete

Personal AI Infrastructure (PAI) integration guide for the FibreFlow Next.js project.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Specialized Agents](#specialized-agents)
5. [Validation Rules](#validation-rules)
6. [MCP Integration](#mcp-integration)
7. [Development Workflow](#development-workflow)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Overview

PAI provides project-specific AI assistance with:

- **10 Specialized Agents** - FibreFlow-specific coding experts
- **Automated Validation** - DGTS + NLNH quality gates
- **Context Management** - Project knowledge + cross-session memory
- **MCP Integration** - context7, memory, playwright, github, sequential-thinking
- **Documentation Automation** - Auto-tracking of changes and decisions

### What PAI Adds to FibreFlow

✅ **Database Safety** - Prevents wrong endpoint usage (ep-dry-night-a9qyh4sj enforced)
✅ **WA Monitor Isolation** - Maintains module independence
✅ **API Standards** - Enforces apiResponse helper + flat routes
✅ **Deployment Safety** - dev-first workflow validation
✅ **Auth Compliance** - Clerk-only (prevents Firebase Auth usage)
✅ **Quality Gates** - Zero console.log, proper error handling, type safety

---

## Quick Start

### Activate PAI for FibreFlow

```bash
# In any new session, activate PAI
@pai
```

This loads:
- Project expertise (`.claude/expertise.yaml`)
- Specialized agents (`.claude/agents/project_agents.yaml`)
- Validation rules (DGTS, NLNH, quality gates)
- MCP server integrations

### Verify PAI Status

You should see:

```
╔═══════════════════════════════════════════════════════════╗
║  🤖 PAI SYSTEM ACTIVATED                                 ║
╠═══════════════════════════════════════════════════════════╣
║  📦 Global Skills:        34                             ║
║  🔧 Global Hooks:         56                             ║
║  ⚡ Project Agents:       10                             ║
║  📊 Project Complexity:   8/10                           ║
║  🛡️  Validation System:   ✅ Enabled                       ║
╠═══════════════════════════════════════════════════════════╣
║  📁 Project: C:\Jarvis\AI Workspace\FF_Next.js          ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Architecture

### File Structure

```
FF_Next.js/
├── .claude/                           # PAI project configuration
│   ├── expertise.yaml                 # Project knowledge base
│   ├── agents/
│   │   └── project_agents.yaml        # Specialized agents
│   └── memories/
│       └── ff-next-js.md              # Session memory
│
├── docs/
│   ├── PAI_SETUP.md                   # This file
│   └── CODING_STANDARDS.md            # FF-specific practices
│
└── ~/.claude/                         # Global PAI (user-level)
    ├── protocols/                     # Quality protocols
    │   ├── dgts-validation.md
    │   ├── nlnh-protocol.md
    │   ├── doc-driven-tdd.md
    │   ├── playwright-testing.md
    │   ├── antihall-validator.md
    │   ├── zero-tolerance-quality.md
    │   └── forbidden-commands.md
    │
    ├── memories/                      # Cross-project learning
    │   └── cross-project/
    │
    └── skills/                        # Global skills (34 total)
```

### Tier System (Progressive Disclosure)

PAI uses a 3-tier context loading system to manage token usage:

**Tier 1 (Always On)** - System prompt essentials (~2k tokens)
- Core identity
- Essential contacts
- Stack preferences
- Critical security
- Response format

**Tier 2 (Auto-Loaded)** - Project-specific context (~5k tokens)
- `.claude/expertise.yaml` - Project patterns
- `.claude/agents/project_agents.yaml` - Specialized agents
- Session memory - Recent learnings

**Tier 3 (On-Demand)** - Protocol details (~10k tokens per protocol)
- Load from `~/.claude/protocols/` only when needed
- Example: Load `nlnh-protocol.md` when uncertain about code

---

## Specialized Agents

### 1. TypeScript Strict Enforcer
**Role:** Code quality reviewer
**Triggers:** TypeScript code changes

**Validates:**
- No `any` types (CRITICAL)
- Explicit type annotations
- Type safety compliance

**Quality Gates:**
- TYPE_CHECK_REQUIRED
- NO_ANY_TYPES
- EXPLICIT_TYPES_PREFERRED

---

### 2. React Best Practices Enforcer
**Role:** Code implementer
**Triggers:** React component changes

**Validates:**
- Keys in mapped elements
- Hook rules compliance
- Props validation

**Quality Gates:**
- HOOKS_RULES
- COMPONENT_STRUCTURE
- PROPS_VALIDATION

---

### 3. Next.js Optimization Enforcer
**Role:** Performance optimizer
**Triggers:** Next.js specific code

**Validates:**
- Using Next.js `Image` component (not `<img>`)
- Using Next.js `Link` component (not `<a>`)
- Appropriate use of "use client"

**Quality Gates:**
- SSR_VALIDATION
- IMAGE_OPTIMIZATION
- APP_ROUTER_PATTERNS

---

### 4. Testing Coverage Enforcer
**Role:** Test coverage validator
**Triggers:** Test file changes, feature additions

**Validates:**
- All tests have assertions
- Proper cleanup (beforeEach/afterEach)
- E2E tests for critical paths

**Quality Gates:**
- COVERAGE_80_PERCENT
- NO_FAKE_TESTS
- E2E_FOR_CRITICAL_PATHS

---

### 5. Complexity Manager
**Role:** Refactoring optimizer
**Triggers:** Large files/components

**Validates:**
- Files < 300 lines
- Components < 200 lines
- Extract logic to hooks/modules

**Quality Gates:**
- ARCHITECTURE_VALIDATION
- DOCUMENTATION_REQUIRED
- EXTRACT_TO_MODULES

---

### 6. Database Guardian (FibreFlow-Specific)
**Role:** Data validator
**Triggers:** Database operations

**Critical Validation:**
```typescript
// ❌ WRONG - Old endpoint
const connectionString = 'postgresql://...ep-damp-credit-a857vku0...'

// ✅ CORRECT - Current endpoint
const connectionString = 'postgresql://...ep-dry-night-a9qyh4sj...'
```

**Validates:**
- Correct database endpoint (ep-dry-night-a9qyh4sj)
- Distinguishes drops vs qa_photo_reviews tables
- Error handling on all queries
- No SQL injection

**Quality Gates:**
- CORRECT_DATABASE_ENDPOINT (CRITICAL)
- ERROR_HANDLING_REQUIRED
- NO_SQL_INJECTION
- VERIFY_TABLE_EXISTS

**Responsibilities:**
```bash
# Always check before querying
cat docs/DATABASE_TABLES.md

# Verify endpoint
echo $DATABASE_URL | grep "ep-dry-night-a9qyh4sj"
```

---

### 7. WA Monitor Specialist (FibreFlow-Specific)
**Role:** Module maintainer
**Triggers:** Changes to `src/modules/wa-monitor/`

**Critical Validation:**
```typescript
// ❌ WRONG - Breaks isolation
import { apiResponse } from '@/lib/apiResponse';
import { someService } from '@/services/someService';

// ✅ CORRECT - Uses internal copy
import { apiResponse } from '../lib/apiResponse';
import { waMonitorService } from '../services/waMonitorService';
```

**Validates:**
- Zero dependencies on main app (`@/lib/*`, `@/services/*`)
- API contract compliance
- Safe restart usage (restart-monitor.sh)

**Quality Gates:**
- ISOLATION_MAINTAINED (CRITICAL)
- API_CONTRACT_FOLLOWED
- SAFE_RESTART_USED

**Responsibilities:**
```bash
# Before WA Monitor changes:
cat src/modules/wa-monitor/API_CONTRACT.md
cat src/modules/wa-monitor/ISOLATION_GUIDE.md

# For VPS restart:
ssh root@72.60.17.245
/opt/wa-monitor/prod/restart-monitor.sh  # ✅ Safe restart
# NOT: systemctl restart wa-monitor-prod  # ❌ Keeps stale cache
```

---

### 8. API Route Validator (FibreFlow-Specific)
**Role:** API standards enforcer
**Triggers:** API route changes

**Critical Patterns:**
```typescript
// ✅ CORRECT - Using apiResponse helper
import { apiResponse } from '@/lib/apiResponse';

export default async function handler(req, res) {
  try {
    const data = await fetchData();
    return apiResponse.success(res, data);
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}

// ❌ WRONG - Direct response
export default async function handler(req, res) {
  const data = await fetchData();
  res.status(200).json(data);  // Don't do this!
}
```

**Validates:**
- apiResponse helper usage
- Flat routes only (no nested dynamic routes)
- Consistent parameter names

**Quality Gates:**
- API_RESPONSE_HELPER_USED (MAJOR)
- FLAT_ROUTES_ONLY (CRITICAL for Vercel)
- CONSISTENT_PARAM_NAMES

**Anti-Pattern:**
```bash
# ❌ WRONG - Fails on Vercel
pages/api/contractors/[contractorId]/onboarding/stages.ts

# ✅ CORRECT - Flat route
pages/api/contractors-onboarding-stages.ts?contractorId={id}
```

---

### 9. Deployment Validator (FibreFlow-Specific)
**Role:** Deployment safety checker
**Triggers:** Deployment commands, git operations

**Critical Workflow:**
```bash
# ✅ CORRECT - Always deploy to dev first
git checkout develop
git pull
git merge feature/my-feature

# Deploy to dev
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow-dev && git pull && npm ci && npm run build && pm2 restart fibreflow-dev"

# Test on https://dev.fibreflow.app
# If OK, then merge to master and deploy to prod

git checkout master
git merge develop
git push

# Deploy to prod
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow && git pull && npm ci && npm run build && pm2 restart fibreflow-prod"
```

**Validates:**
- Dev deployed and tested before prod
- Correct branch workflow (feature → develop → master)
- PM2 restart after deployment

**Quality Gates:**
- DEV_TESTED_FIRST (CRITICAL)
- CORRECT_BRANCH_WORKFLOW
- PM2_RESTART_VERIFIED

---

### 10. Clerk Auth Specialist (FibreFlow-Specific)
**Role:** Authentication enforcer
**Triggers:** Auth-related code

**Critical Validation:**
```typescript
// ❌ WRONG - Firebase Auth (deprecated)
import { auth } from 'firebase/auth';

// ✅ CORRECT - Clerk
import { auth } from '@clerk/nextjs';
```

**Validates:**
- Clerk-only usage (no Firebase Auth)
- Protected routes have auth checks
- Proper Clerk webhook handling

**Quality Gates:**
- CLERK_ONLY (CRITICAL)
- NO_FIREBASE_AUTH
- PROTECTED_ROUTES_VALIDATED

---

## Validation Rules

### DGTS (Don't Game The System)
**Threshold:** 0.35 (project default)

Detects shortcuts that compromise quality:
- Using `any` types to bypass TypeScript
- Empty catch blocks
- Fake test assertions
- Missing error handling

**Example Violations:**
```typescript
// ❌ DGTS Violation - CRITICAL
const data: any = await fetchData();

// ✅ Correct
const data: SomeType = await fetchData();

// ❌ DGTS Violation - MAJOR
try {
  await riskyOperation();
} catch (e) {
  // Empty - swallowing errors
}

// ✅ Correct
try {
  await riskyOperation();
} catch (error) {
  console.error('Failed to perform operation:', error);
  return apiResponse.internalError(res, error);
}
```

---

### NLNH (No Lies, No Hallucinations)
**Threshold:** 0.80 (project default)

Enforces truth-first development:
- Verify code exists before referencing
- Use antihall validator for code suggestions
- Mark code with confidence levels
- Admit uncertainty

**Code Markers:**
```typescript
// 🟢 WORKING: Tested and functional
// 🟡 PARTIAL: Basic functionality
// 🔴 BROKEN: Does not work
// 🔵 MOCK: Placeholder data
// ⚪ UNTESTED: Written not verified
```

**Confidence Scale:**
- **95-100%**: Will definitely work
- **70-94%**: Should work with adjustments
- **50-69%**: Might work, needs testing
- **25-49%**: Experimental, likely needs fixes
- **0-24%**: Unsure, need verification

**Load Full Protocol When:**
```bash
# If uncertain about code, read:
cat ~/.claude/protocols/nlnh-protocol.md
```

---

### Quality Gates (Pre-Commit)

**MANDATORY checks before commit:**

1. **NO_CONSOLE_LOG** - No console.log in production code
2. **PROPER_ERROR_HANDLING** - All async operations have error handling
3. **TYPE_SAFETY** - TypeScript type check passes
4. **DATABASE_ENDPOINT_VALIDATION** - Using ep-dry-night-a9qyh4sj
5. **API_RESPONSE_HELPER_USED** - API routes use apiResponse
6. **ISOLATION_MAINTAINED** - WA Monitor has zero main app dependencies
7. **DEPLOYMENT_WORKFLOW_FOLLOWED** - Deploy to dev first

**Run Validation:**
```bash
npm run type-check  # TypeScript
npm run lint        # ESLint
npm run antihall    # Code reference validation

# Manual checks:
# - grep -r "console.log" src/
# - grep -r "ep-damp-credit" .
# - Check WA Monitor imports (if applicable)
```

---

## MCP Integration

### Available MCP Servers

**1. context7** - Library documentation
```typescript
// Auto-invokes when:
// - Writing code with external libraries
// - Checking API patterns
// - Next.js specific features

// Example:
"Get me the latest Next.js 14 App Router docs for Image component"
```

**2. memory** - Cross-session knowledge
```typescript
// Auto-invokes when:
// - Session start (recall patterns)
// - Session end (store learnings)
// - After solving complex bugs

// Example:
"Remember: WA Monitor safe restart script is at /opt/wa-monitor/prod/restart-monitor.sh"
```

**3. playwright** - E2E testing
```typescript
// Auto-invokes when:
// - E2E testing required
// - UI validation
// - WA Monitor dashboard testing

// Example:
"Test the WA Monitor feedback sending flow"
```

**4. github** - Repository operations
```typescript
// Auto-invokes when:
// - PR operations
// - Issue management
// - Deployment verification

// Example:
"Create PR from develop to master"
```

**5. sequential-thinking** - Complex reasoning
```typescript
// Auto-invokes when:
// - Complex architectural decisions
// - Multi-step debugging
// - Database migration planning

// Example:
"Help me plan the migration of SOW import to use Neon directly"
```

---

## Development Workflow

### Standard Feature Development

```bash
# 1. Activate PAI
@pai

# 2. Create feature branch
git checkout develop
git pull
git checkout -b feature/my-feature

# 3. Develop locally (ALWAYS use production mode)
npm run build && PORT=3005 npm start

# 4. Make changes
# PAI agents automatically validate:
# - TypeScript types (typescript-strict-enforcer)
# - React patterns (react-best-practices-enforcer)
# - Next.js optimization (nextjs-optimization-enforcer)
# - Database queries (database-guardian)
# - API routes (api-route-validator)
# - WA Monitor isolation (wa-monitor-specialist)

# 5. Pre-commit validation
npm run type-check
npm run lint
npm run antihall

# Manual verification:
# - No console.log: grep -r "console.log" src/
# - Correct DB endpoint: grep -r "ep-dry-night-a9qyh4sj" neon/
# - API helper usage: grep -r "apiResponse" pages/api/

# 6. Commit with auto-tracked changes
git add .
git commit -m "feat: My feature description"

# 7. Merge to develop
git checkout develop
git merge feature/my-feature
git push

# 8. Deploy to dev (REQUIRED - deployment-validator enforces this)
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow-dev && git pull && npm ci && npm run build && pm2 restart fibreflow-dev"

# 9. Test on dev.fibreflow.app
# - Manual testing
# - E2E tests (playwright)
# - Verify no regressions

# 10. If OK, merge to master
git checkout master
git merge develop
git push

# 11. Deploy to production
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow && git pull && npm ci && npm run build && pm2 restart fibreflow-prod"

# 12. Update documentation (documentation-enforcer reminds)
# - docs/page-logs/{page-name}.md (if applicable)
# - Module README.md (if applicable)
# - CLAUDE.md (if major changes)
```

---

## Common Tasks

### Task 1: Add New Database Query

```typescript
// PAI Agents Active:
// - database-guardian (validates endpoint + error handling)
// - typescript-strict-enforcer (validates types)

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);  // Validated by database-guardian

try {
  // Check docs/DATABASE_TABLES.md first!
  const result = await sql`
    SELECT * FROM qa_photo_reviews
    WHERE drop_number = ${dropNumber}
  `;

  return result;
} catch (error) {
  // REQUIRED by database-guardian
  console.error('Database query failed:', error);
  throw error;
}
```

**PAI Validation:**
- ✅ Uses correct endpoint (ep-dry-night-a9qyh4sj)
- ✅ Has error handling
- ✅ Uses parameterized query (no SQL injection)
- ✅ TypeScript types inferred

---

### Task 2: Create New API Route

```typescript
// PAI Agents Active:
// - api-route-validator (enforces apiResponse helper)
// - typescript-strict-enforcer (validates types)
// - clerk-auth-specialist (validates auth)

import { apiResponse } from '@/lib/apiResponse';
import { auth } from '@clerk/nextjs';

export default async function handler(req, res) {
  // clerk-auth-specialist validates this
  const { userId } = auth();
  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  try {
    const data = await fetchData();
    // api-route-validator ensures you use this
    return apiResponse.success(res, data);
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
```

**PAI Validation:**
- ✅ Uses apiResponse helper (api-route-validator)
- ✅ Has Clerk auth check (clerk-auth-specialist)
- ✅ Proper error handling (database-guardian)
- ✅ TypeScript types (typescript-strict-enforcer)

**Anti-Pattern (PAI blocks this):**
```typescript
// ❌ WRONG - api-route-validator flags as MAJOR violation
res.status(200).json(data);  // Don't use direct response!
```

---

### Task 3: Modify WA Monitor Module

```typescript
// PAI Agents Active:
// - wa-monitor-specialist (enforces isolation)

// Step 1: Read the contracts
// wa-monitor-specialist reminds you to do this
cat src/modules/wa-monitor/API_CONTRACT.md
cat src/modules/wa-monitor/ISOLATION_GUIDE.md

// Step 2: Make changes (internal imports only!)
// ✅ CORRECT
import { apiResponse } from '../lib/apiResponse';  // Internal copy
import { waMonitorService } from '../services/waMonitorService';

// ❌ WRONG - wa-monitor-specialist flags as CRITICAL violation
import { apiResponse } from '@/lib/apiResponse';  // Main app dependency!

// Step 3: Deploy and restart safely
ssh root@72.60.17.245
/opt/wa-monitor/prod/restart-monitor.sh  # wa-monitor-specialist enforces this
# NOT: systemctl restart wa-monitor-prod  # Keeps stale cache!
```

**PAI Validation:**
- ✅ Zero main app dependencies (wa-monitor-specialist)
- ✅ API contract followed
- ✅ Safe restart script used

---

### Task 4: Deploy to Production

```bash
# PAI Agents Active:
# - deployment-validator (enforces dev-first workflow)

# deployment-validator REQUIRES this workflow:

# 1. Deploy to dev FIRST (MANDATORY)
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow-dev && git pull && npm ci && npm run build && pm2 restart fibreflow-dev"

# 2. Test on dev.fibreflow.app
# - Manual testing
# - E2E tests
# - Verify no regressions

# 3. If OK, then deploy to prod
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow && git pull && npm ci && npm run build && pm2 restart fibreflow-prod"

# ❌ WRONG - deployment-validator flags as CRITICAL violation
# Deploying to prod without dev testing!
```

**PAI Validation:**
- ✅ Dev deployed first (deployment-validator)
- ✅ Correct branch workflow (feature → develop → master)
- ✅ PM2 restart verified

---

## Troubleshooting

### Issue: Agent not triggering

**Symptom:** Expected agent validation not appearing

**Solution:**
```bash
# 1. Verify PAI is active
@pai

# 2. Check agent configuration
cat .claude/agents/project_agents.yaml

# 3. Re-activate PAI
# Exit Claude Code, restart, then @pai
```

---

### Issue: Database endpoint validation failing

**Symptom:** "Using wrong database endpoint" warning

**Solution:**
```bash
# 1. Check DATABASE_URL
echo $DATABASE_URL | grep "ep-dry-night-a9qyh4sj"

# 2. Update .env (if needed)
DATABASE_URL=postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require

# 3. Verify in neon/config/database.ts
cat neon/config/database.ts | grep "ep-dry-night-a9qyh4sj"
```

---

### Issue: WA Monitor isolation broken

**Symptom:** "WA Monitor importing from main app" error

**Solution:**
```bash
# 1. Check imports
grep -r "from '@/lib/" src/modules/wa-monitor/
grep -r "from '@/services/" src/modules/wa-monitor/

# 2. Replace with internal copies
# ❌ WRONG
import { apiResponse } from '@/lib/apiResponse';

# ✅ CORRECT
import { apiResponse } from '../lib/apiResponse';

# 3. Read isolation guide
cat src/modules/wa-monitor/ISOLATION_GUIDE.md
```

---

### Issue: API route validation failing

**Symptom:** "Not using apiResponse helper" warning

**Solution:**
```typescript
// 1. Import apiResponse
import { apiResponse } from '@/lib/apiResponse';

// 2. Replace direct responses
// ❌ BEFORE
res.status(200).json(data);

// ✅ AFTER
return apiResponse.success(res, data);

// 3. Check all API routes
grep -r "res.status" pages/api/
```

---

### Issue: Deployment to prod without dev testing

**Symptom:** "Deploying to production without dev testing" error

**Solution:**
```bash
# Always follow this workflow:
# 1. Deploy to dev
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow-dev && git pull && npm ci && npm run build && pm2 restart fibreflow-dev"

# 2. Test on dev.fibreflow.app

# 3. Then deploy to prod
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow && git pull && npm ci && npm run build && pm2 restart fibreflow-prod"
```

---

## Next Steps

### 1. Review Coding Standards
```bash
cat docs/CODING_STANDARDS.md
```

### 2. Explore Agents
```bash
cat .claude/agents/project_agents.yaml
```

### 3. Check Protocols (Load On-Demand)
```bash
ls ~/.claude/protocols/

# Load when needed:
cat ~/.claude/protocols/nlnh-protocol.md  # Uncertainty handling
cat ~/.claude/protocols/dgts-validation.md  # Quality shortcuts
cat ~/.claude/protocols/doc-driven-tdd.md  # Test-driven development
cat ~/.claude/protocols/playwright-testing.md  # E2E testing
cat ~/.claude/protocols/antihall-validator.md  # Code reference validation
cat ~/.claude/protocols/zero-tolerance-quality.md  # Pre-commit validation
cat ~/.claude/protocols/forbidden-commands.md  # Safety protocols
```

### 4. Set Up Git Hooks (Optional)
```bash
# See "Set up git hooks for automated tracking" section
# in docs/PAI_SETUP.md
```

---

## Summary

PAI provides FibreFlow-specific quality enforcement:

✅ **10 Specialized Agents** - TypeScript, React, Next.js, Database, WA Monitor, API, Deployment, Auth, Testing, Complexity
✅ **Automated Validation** - DGTS (0.35), NLNH (0.80), Quality Gates
✅ **Critical Safety** - Database endpoint, WA Monitor isolation, API standards, Deployment workflow
✅ **MCP Integration** - context7, memory, playwright, github, sequential-thinking
✅ **Progressive Disclosure** - Load protocols on-demand to save tokens

**Activate PAI:** `@pai`
**Full Documentation:** `docs/CODING_STANDARDS.md`
**Agent Details:** `.claude/agents/project_agents.yaml`

---

**Last Updated:** 2025-12-18
**Version:** 1.0
**Maintained By:** PAI System
