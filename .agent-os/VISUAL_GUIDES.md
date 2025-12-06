# Agent OS Visual Guides

ASCII flowcharts and diagrams for FibreFlow Agent OS workflows.

## Table of Contents
1. [Feature Implementation Workflow](#feature-implementation-workflow)
2. [Specification Writing Workflow](#specification-writing-workflow)
3. [VPS Deployment Workflow](#vps-deployment-workflow)
4. [WA Monitor Troubleshooting Flow](#wa-monitor-troubleshooting-flow)
5. [Agent Selection Decision Tree](#agent-selection-decision-tree)
6. [Module Creation Flowchart](#module-creation-flowchart)
7. [API Route Decision Tree](#api-route-decision-tree)

---

## Feature Implementation Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FEATURE IMPLEMENTATION FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ 1. Read Specification
  │     └─→ spec.md / tasks.md / requirements.md
  │         └─→ Clarify ambiguities with user
  │
  ├─→ 2. Research Existing Patterns
  │     ├─→ grep -r "similar_pattern" src/
  │     ├─→ Review similar modules
  │     └─→ Check docs/DATABASE_TABLES.md
  │
  ├─→ 3. Plan Database Changes (if needed)
  │     ├─→ Write migration script
  │     ├─→ Define schema with exact types
  │     └─→ Document in DATABASE_TABLES.md
  │
  ├─→ 4. Implement Feature
  │     ├─→ Follow modular architecture?
  │     │   ├─ YES → Create src/modules/{module}/
  │     │   └─ NO  → Add to existing location
  │     │
  │     ├─→ Create API endpoints?
  │     │   ├─ YES → Use flattened routes (/api/resource-action)
  │     │   └─ NO  → Client-side only
  │     │
  │     ├─→ Keep files < 300 lines (components < 200)
  │     └─→ Use apiResponse helper for APIs
  │
  ├─→ 5. Test Locally
  │     ├─→ npm run build
  │     ├─→ PORT=3005 npm start
  │     ├─→ Test at http://localhost:3005
  │     └─→ Verify: Feature works, no console errors
  │
  ├─→ 6. Deploy to DEV
  │     ├─→ git checkout develop
  │     ├─→ git merge feature/branch-name
  │     ├─→ git push origin develop
  │     ├─→ Deploy to dev.fibreflow.app
  │     └─→ Test on dev site
  │
  ├─→ 7. Get User Approval
  │     └─→ Wait for confirmation ✓
  │
  ├─→ 8. Deploy to PROD
  │     ├─→ git checkout master
  │     ├─→ git merge develop
  │     ├─→ git push origin master
  │     ├─→ Deploy to app.fibreflow.app
  │     └─→ Verify production
  │
  ├─→ 9. Update Documentation
  │     ├─→ docs/CHANGELOG.md
  │     ├─→ docs/page-logs/ (if UI changed)
  │     └─→ docs/DATABASE_TABLES.md (if schema changed)
  │
  └─→ 10. Final Verification
        ├─→ Check PM2 logs (no errors)
        ├─→ Test production URL
        ├─→ Verify key features
        └─→ Confirm with user ✓

END (Feature deployed successfully ✓)
```

**Time**: 1.5-3 hours (depending on complexity)

---

## Specification Writing Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SPECIFICATION WRITING FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ 1. Gather Requirements
  │     ├─→ Clarify user needs
  │     ├─→ Define user stories
  │     └─→ Set success criteria
  │
  ├─→ 2. Research Existing Patterns
  │     ├─→ grep -r "similar_pattern" src/
  │     ├─→ ls -la src/modules/
  │     ├─→ cat docs/DATABASE_TABLES.md
  │     └─→ Find similar implementations
  │
  ├─→ 3. Define Scope
  │     ├─→ What's IN scope?
  │     └─→ What's OUT of scope?
  │
  ├─→ 4. Design Database Schema
  │     ├─→ Define tables with exact types
  │     │   └─→ UUID, VARCHAR(X), TIMESTAMP, etc.
  │     ├─→ Add indexes for performance
  │     └─→ Define constraints (NOT NULL, UNIQUE, FK)
  │
  ├─→ 5. Specify API Endpoints
  │     ├─→ Define all endpoints (GET, POST, PUT, DELETE)
  │     ├─→ Request parameters & body
  │     ├─→ Response format (success & error)
  │     └─→ Error codes & handling
  │
  ├─→ 6. Outline UI Components
  │     ├─→ Component structure
  │     ├─→ Props & state
  │     ├─→ User interactions
  │     └─→ Dependencies
  │
  ├─→ 7. Error Handling & Edge Cases
  │     ├─→ Validation errors
  │     ├─→ API failures
  │     ├─→ Empty states
  │     ├─→ Loading states
  │     └─→ Edge cases
  │
  ├─→ 8. Testing Requirements
  │     ├─→ Unit tests
  │     ├─→ Integration tests
  │     └─→ Manual test checklist
  │
  └─→ 9. Review & Refine
        ├─→ Check completeness (all sections?)
        ├─→ Check FibreFlow standards alignment
        └─→ Get user approval on spec ✓

END (Spec ready for implementation ✓)
```

**Time**: 2-3 hours for comprehensive spec

---

## VPS Deployment Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      VPS DEPLOYMENT FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │ Changes Ready?   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Tested Locally?  │
                    │ (npm run build)  │
                    └────────┬─────────┘
                             │ YES
                             │
    ┌────────────────────────▼────────────────────────┐
    │          DEPLOY TO DEVELOPMENT                  │
    ├─────────────────────────────────────────────────┤
    │ 1. Merge to develop branch                      │
    │ 2. Deploy to dev.fibreflow.app (port 3006)      │
    │ 3. Verify deployment:                           │
    │    ├─→ pm2 list (status = online?)              │
    │    ├─→ pm2 logs (no errors?)                    │
    │    └─→ curl -I https://dev.fibreflow.app (200?) │
    ├─────────────────────────────────────────────────┤
    │ 4. Test on DEV site                             │
    │    ├─→ Login works?                             │
    │    ├─→ Feature works?                           │
    │    ├─→ No console errors?                       │
    │    └─→ Mobile responsive?                       │
    └────────────────┬────────────────────────────────┘
                     │
                     ├─→ Issues found? ──→ Fix & redeploy to DEV
                     │
                     └─→ All tests pass? ──→ Get user approval
                                              │
                                              │ APPROVED ✓
                                              │
    ┌────────────────────────▼────────────────────────┐
    │         DEPLOY TO PRODUCTION                    │
    ├─────────────────────────────────────────────────┤
    │ 1. Merge to master branch                       │
    │ 2. Deploy to app.fibreflow.app (port 3005)      │
    │ 3. Verify deployment:                           │
    │    ├─→ pm2 list (status = online?)              │
    │    ├─→ pm2 logs (no errors?)                    │
    │    └─→ curl -I https://app.fibreflow.app (200?) │
    ├─────────────────────────────────────────────────┤
    │ 4. Test on PROD site                            │
    │    ├─→ Login works?                             │
    │    ├─→ Feature works?                           │
    │    ├─→ No console errors?                       │
    │    └─→ Database queries work?                   │
    └────────────────┬────────────────────────────────┘
                     │
                     ├─→ Issues found? ──→ ROLLBACK
                     │                      │
                     │                      ├─→ git reset --hard <prev-commit>
                     │                      ├─→ npm run build
                     │                      ├─→ pm2 restart fibreflow-prod
                     │                      └─→ Fix in DEV first
                     │
                     └─→ All tests pass? ──→ UPDATE DOCS
                                              │
                                              ├─→ docs/CHANGELOG.md
                                              ├─→ docs/page-logs/
                                              └─→ Confirm with user ✓

                                           SUCCESS ✓
```

**Time**: 15-20 minutes (full DEV → test → PROD cycle)

---

## WA Monitor Troubleshooting Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                  WA MONITOR TROUBLESHOOTING FLOW                     │
└─────────────────────────────────────────────────────────────────────┘

                       ┌──────────────┐
                       │ Issue Type?  │
                       └──────┬───────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼─────┐      ┌──────▼──────┐      ┌──────▼──────┐
    │ Drop     │      │ All Drops   │      │ Service     │
    │ Missing  │      │ Missing     │      │ Issues      │
    └────┬─────┘      └──────┬──────┘      └──────┬──────┘
         │                   │                     │
         │                   │                     │
┌────────▼────────┐  ┌───────▼────────┐   ┌───────▼────────┐
│ 1. Check DB     │  │ 1. Check       │   │ 1. Check Status│
│ qa_photo_reviews│  │    Services    │   │ systemctl      │
│                 │  │    Status      │   │ is-active      │
│ SELECT * WHERE  │  │                │   │                │
│ drop_number=... │  │ systemctl      │   │ wa-monitor-*   │
└────┬────────────┘  │ is-active      │   │ whatsapp-bridge│
     │               │ wa-monitor-*   │   └───────┬────────┘
     │               │ whatsapp-bridge│           │
     ├─→ Found?      └───────┬────────┘           │
     │   └─→ YES: Return data            ┌────────▼────────┐
     │                       │            │ All Active?     │
     │                       ├─→ Active?  └────┬───────┬────┘
     │                       │   └─→ YES       │       │
     │                       │       └─→ Check │       └─→ NO
     │                       │          Logs   │           │
     ├─→ Not Found?          │                 │           │
     │   └─→ Continue        │         ┌───────▼───────┐   │
     │                       │         │ Check Logs    │   │
┌────▼────────────┐          │         │               │   │
│ 2. Check        │          │         │ tail -50 ...  │   │
│ Rejection Log   │          │         │ /logs/        │   │
│                 │          │         │ wa-monitor-*  │   │
│ SELECT * FROM   │          │         └───────┬───────┘   │
│ invalid_drop_   │          │                 │           │
│ submissions     │          │         ┌───────▼───────┐   │
│ WHERE drop=...  │          │         │ Errors Found? │   │
└────┬────────────┘          │         └───┬───────┬───┘   │
     │                       │             │       │       │
     ├─→ Rejected?           │             │       └─→ YES │
     │   ├─→ YES: Show reason│             │           │   │
     │   │   (validation fail)│            │       ┌───▼───▼──────┐
     │   └─→ NO: Continue    │             │       │ Fix & Restart│
     │                       │             │       │              │
┌────▼────────────┐          │             │       │ 1. Fix code  │
│ 3. Check        │          │             │       │ 2. Use safe  │
│ WhatsApp Bridge │          │             │       │    restart:  │
│ Logs            │          │             │       │ /opt/wa-     │
│                 │          │             │       │ monitor/prod/│
│ grep 'DR...'    │          │             │       │ restart-     │
│ /opt/.../       │          │             │       │ monitor.sh   │
│ whatsapp-bridge │          │             │       └──────────────┘
│ /logs/...       │          │             │
└────┬────────────┘          │             └─→ NO: Continue
     │                       │                     investigation
     ├─→ Message captured?   │
     │   ├─→ YES: Continue   │
     │   └─→ NO: Bridge issue│
     │                       │
┌────▼────────────┐          │
│ 4. Check        │          │
│ Monitor Logs    │          │
│                 │          │
│ grep 'DR...'    │          │
│ /opt/wa-monitor/│          │
│ prod/logs/...   │          │
└────┬────────────┘          │
     │                       │
     ├─→ Drop processed?     │
     │   ├─→ YES: Check why not in DB
     │   └─→ NO: Monitor didn't process
     │
     └─→ Determine Root Cause:
         ├─→ Validation failure (Mohadin only)
         ├─→ Bridge didn't capture
         ├─→ Monitor crashed
         ├─→ LID resolution issue
         ├─→ Database connection issue
         └─→ Python cache issue (use safe restart)

                     ┌──────────────┐
                     │ Apply Fix    │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │ Verify Fix   │
                     │ (retest)     │
                     └──────┬───────┘
                            │
                         SUCCESS ✓
```

**Time**: 2-10 minutes (depending on issue complexity)

---

## Agent Selection Decision Tree

```
┌─────────────────────────────────────────────────────────────────────┐
│                   WHICH AGENT SHOULD I USE?                          │
└─────────────────────────────────────────────────────────────────────┘

                       ┌──────────────────┐
                       │ What do you need?│
                       └────────┬─────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
         ┌──────▼──────┐ ┌─────▼─────┐  ┌──────▼──────┐
         │ Write Spec  │ │ Implement │  │ Deploy or   │
         │ Document    │ │ Feature   │  │ Troubleshoot│
         └──────┬──────┘ └─────┬─────┘  └──────┬──────┘
                │              │                │
                │              │                │
     ┌──────────▼──────────┐   │       ┌────────▼────────┐
     │                     │   │       │                 │
     │ Use:                │   │       │ What kind?      │
     │ SPEC-WRITER AGENT   │   │       └────────┬────────┘
     │                     │   │                │
     │ Creates:            │   │    ┌───────────┼──────────┐
     │ ✓ Database schema   │   │    │           │          │
     │ ✓ API endpoints     │   │ ┌──▼──┐   ┌───▼───┐  ┌───▼────┐
     │ ✓ UI components     │   │ │ VPS │   │ WA    │  │ Other  │
     │ ✓ Error handling    │   │ │Deploy│  │Monitor│  │Service │
     │ ✓ Testing plan      │   │ └──┬──┘   └───┬───┘  └───┬────┘
     │                     │   │    │          │          │
     │ Time: 2-3 hours     │   │    │          │          │
     └─────────────────────┘   │    │          │          │
                               │ ┌──▼──────────▼──────────▼───┐
                               │ │                            │
                   ┌───────────▼─▼──────────┐  │ WA Monitor issues?    │
                   │                        │  │ ├─→ YES: WA AGENT     │
                   │ Use:                   │  │ └─→ NO: See below      │
                   │ IMPLEMENTER AGENT      │  │                        │
                   │                        │  │ VPS deployment?       │
                   │ What it does:          │  │ ├─→ YES: VPS AGENT    │
                   │ ✓ Reads spec           │  │ └─→ NO: GENERAL AGENT │
                   │ ✓ Plans database       │  │                        │
                   │ ✓ Implements code      │  └────────────────────────┘
                   │ ✓ Tests locally        │
                   │ ✓ Deploys to DEV       │
                   │ ✓ Gets approval        │        USE:
                   │ ✓ Deploys to PROD      │        ├─→ VPS-DEPLOYMENT
                   │ ✓ Updates docs         │        │   AGENT
                   │                        │        │
                   │ Time: 1.5-3 hours      │        │   For:
                   └────────────────────────┘        │   ✓ Deploy to dev
                                                     │   ✓ Deploy to prod
                                                     │   ✓ Check services
                                                     │   ✓ View logs
                                                     │   ✓ Troubleshoot
                                                     │
                                                     ├─→ WA AGENT
                                                     │
                                                     │   For:
                                                     │   ✓ Drop missing
                                                     │   ✓ Validation issues
                                                     │   ✓ Service health
                                                     │   ✓ Add new group
                                                     │   ✓ LID bugs
                                                     │
                                                     └─→ GENERAL-PURPOSE
                                                         AGENT

                                                         For:
                                                         ✓ Multi-step tasks
                                                         ✓ Code searches
                                                         ✓ Other issues

┌─────────────────────────────────────────────────────────────────────┐
│                         QUICK GUIDE                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Planning phase?           → spec-writer agent                       │
│ Writing code?             → implementer agent                       │
│ Deploying to VPS?         → vps-deployment agent                    │
│ WA Monitor issue?         → wa-agent                                │
│ Complex multi-step task?  → general-purpose agent                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Module Creation Flowchart

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MODULE CREATION DECISION                          │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │ New Feature?     │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Is it complex?   │
                    │ (multiple        │
                    │  components,     │
                    │  business logic) │
                    └────┬──────────┬──┘
                         │          │
                      NO │          │ YES
                         │          │
               ┌─────────▼──┐    ┌──▼────────────┐
               │ Simple     │    │ Create Module │
               │ Component  │    │ in src/       │
               │            │    │ modules/      │
               │ Add to     │    │ {name}/       │
               │ existing   │    └──┬────────────┘
               │ location   │       │
               └────────────┘       │
                                    │
                    ┌───────────────▼────────────────┐
                    │ Module Structure:              │
                    ├────────────────────────────────┤
                    │ ├── types/                     │
                    │ │   └── {module}.types.ts      │
                    │ ├── services/                  │
                    │ │   ├── {module}Service.ts     │
                    │ │   └── {module}ApiService.ts  │
                    │ ├── utils/                     │
                    │ │   └── {module}Helpers.ts     │
                    │ ├── components/                │
                    │ │   ├── {Module}Dashboard.tsx  │
                    │ │   └── index.ts               │
                    │ └── hooks/                     │
                    │     └── use{Module}.ts         │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │ Create API Endpoints?          │
                    └───────┬────────────────────┬───┘
                            │                    │
                         YES│                    │NO
                            │                    │
              ┌─────────────▼──────┐             │
              │ Create Flattened   │             │
              │ API Routes:        │             │
              │                    │             │
              │ pages/api/         │             │
              │ {module}-action.ts │             │
              │                    │             │
              │ NOT nested:        │             │
              │ ❌ /api/module/    │             │
              │    [id]/action     │             │
              └────────────────────┘             │
                                                 │
                    ┌────────────────────────────▼──┐
                    │ Add Page Route                │
                    │                               │
                    │ app/{module}/page.tsx         │
                    │                               │
                    │ Imports module components     │
                    └────────────────┬──────────────┘
                                     │
                    ┌────────────────▼──────────────┐
                    │ Update Navigation             │
                    │                               │
                    │ Add link to sidebar config    │
                    └────────────────┬──────────────┘
                                     │
                    ┌────────────────▼──────────────┐
                    │ Write Module README           │
                    │                               │
                    │ Document:                     │
                    │ ✓ Overview                    │
                    │ ✓ Architecture                │
                    │ ✓ API endpoints               │
                    │ ✓ Usage examples              │
                    └────────────────┬──────────────┘
                                     │
                                  SUCCESS ✓
                              (Module Created)
```

---

## API Route Decision Tree

```
┌─────────────────────────────────────────────────────────────────────┐
│                    API ROUTE DESIGN DECISION                         │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │ Need API         │
                    │ Endpoint?        │
                    └────────┬─────────┘
                             │ YES
                             │
                    ┌────────▼─────────┐
                    │ What HTTP        │
                    │ Method?          │
                    └────┬─────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐    ┌──────────┐
    │ GET     │    │ POST    │    │ PUT     │    │ DELETE   │
    │ (Read)  │    │ (Create)│    │ (Update)│    │ (Delete) │
    └────┬────┘    └────┬────┘    └────┬────┘    └────┬─────┘
         │              │              │              │
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                        │
           ┌────────────▼────────────┐
           │ Use FLATTENED Route     │
           │ Pattern                 │
           └────────────┬────────────┘
                        │
    ┌───────────────────▼───────────────────┐
    │ ✅ CORRECT Pattern:                   │
    │                                       │
    │ /api/resource-action                  │
    │ /api/resource-action-update           │
    │ /api/contractors-documents            │
    │ /api/contractors-documents-upload     │
    │                                       │
    │ Query params for IDs:                 │
    │ ?contractorId=uuid                    │
    │ ?docId=uuid                           │
    └───────────────────────────────────────┘
                        │
    ┌───────────────────▼───────────────────┐
    │ ❌ WRONG Pattern (404 in production): │
    │                                       │
    │ /api/contractors/[id]/documents       │
    │ /api/contractors/[contractorId]/      │
    │                    documents/upload   │
    │                                       │
    │ Why wrong? Nested dynamic routes      │
    │ don't deploy properly on Vercel       │
    └───────────────────────────────────────┘
                        │
           ┌────────────▼────────────┐
           │ Use apiResponse Helper  │
           │                         │
           │ import { apiResponse }  │
           │ from '@/lib/apiResponse'│
           └────────────┬────────────┘
                        │
    ┌───────────────────▼───────────────────┐
    │ Standard Response Format:             │
    │                                       │
    │ Success:                              │
    │ return apiResponse.success(res, data) │
    │                                       │
    │ Errors:                               │
    │ return apiResponse.notFound(...)      │
    │ return apiResponse.validationError()  │
    │ return apiResponse.internalError()    │
    └───────────────────────────────────────┘
                        │
                     SUCCESS ✓
                 (API Route Created)
```

---

## Legend

```
┌─────────┐
│ Box     │  = Process step / Decision
└─────────┘

   ───►     = Flow direction / Next step

   ├─►      = Branch / Multiple options

   └─►      = Alternative path

   ✓        = Success / Completion

   ❌       = Wrong way / Don't do this

   ✅       = Correct way / Do this
```

---

## How to Use These Flowcharts

1. **Follow the arrows** - Each flowchart starts at the top and flows downward
2. **Decision points** - Look for questions with branches (YES/NO)
3. **Time estimates** - Shown at the end of major workflows
4. **Anti-patterns** - Marked with ❌ to show what NOT to do
5. **Best practices** - Marked with ✅ to show recommended approaches

These visual guides complement the agent documentation and provide quick reference for common workflows and decision-making processes.
