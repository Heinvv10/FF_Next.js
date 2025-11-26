# WA Monitor Module - Isolation Guide

**Status:** ✅ **ISOLATED** - Module is self-contained and can operate independently

**Last Updated:** 2025-11-24

---

## 🎯 Overview

The WA Monitor module is designed as a **standalone, isolated module** that functions independently from the rest of the FibreFlow application. This allows you to:

- ✅ Develop/refactor main app without breaking WA Monitor
- ✅ Deploy WA Monitor independently if needed
- ✅ Test WA Monitor in isolation
- ✅ Extract to separate microservice in the future (if needed)

---

## 📦 Module Structure

```
src/modules/wa-monitor/
├── lib/                           # Internal utilities (self-contained)
│   └── apiResponse.ts             # ⚠️ FROZEN copy - do not modify
│
├── types/                         # TypeScript types
│   └── wa-monitor.types.ts
│
├── services/                      # Business logic
│   ├── waMonitorService.ts        # Backend service (database operations)
│   └── waMonitorApiService.ts     # Frontend API client
│
├── utils/                         # Helper functions
│   └── waMonitorHelpers.ts
│
├── components/                    # React components
│   ├── WaMonitorDashboard.tsx
│   ├── QaReviewCard.tsx
│   ├── DropStatusBadge.tsx
│   ├── WaMonitorGrid.tsx
│   ├── SystemHealthPanel.tsx
│   ├── WaMonitorFilters.tsx
│   └── index.ts
│
├── hooks/                         # Custom React hooks
│   └── useWaMonitorStats.ts
│
├── tests/                         # Integration tests
│   └── integration.test.ts
│
├── API_CONTRACT.md                # 🔒 Frozen API contracts
├── ISOLATION_GUIDE.md             # This file
└── README.md                      # Module documentation
```

**API Routes:** `pages/api/wa-monitor-*.ts` (flattened routes)
**Page Routes:** `app/(main)/wa-monitor/page.tsx`

---

## 🔒 Isolation Principles

### 1. **No External Dependencies**

The module does NOT depend on:
- ❌ `@/lib/*` - Main app utilities
- ❌ `@/services/*` - Main app services
- ❌ `@/components/*` - Main app components (except AppLayout)

### 2. **Internalized Dependencies**

Critical utilities are copied into the module:
- ✅ `lib/apiResponse.ts` - Frozen copy of API response helper

### 3. **Frozen API Contracts**

All API endpoints follow standardized contracts documented in `API_CONTRACT.md`
- ✅ Breaking changes require version bump
- ✅ Responses follow standard format
- ✅ Error codes are consistent

### 4. **Self-Contained Testing**

Integration tests verify module independence:
```bash
npm run test:wa-monitor
```

---

## 🚀 Development Workflow

### Working on WA Monitor

**1. Create Feature Branch**
```bash
# Always branch from master
git checkout master
git pull origin master
git checkout -b feature/wa-monitor-{feature-name}
```

**2. Make Changes**
- Edit files in `src/modules/wa-monitor/`
- Edit API routes in `pages/api/wa-monitor-*.ts`
- Do NOT modify files outside the module unless absolutely necessary

**3. Test Independence**
```bash
# Build and start server
npm run build
PORT=3005 npm start

# In another terminal, run integration tests
npm run test:wa-monitor
```

**4. Commit & Push**
```bash
git add .
git commit -m "feat(wa-monitor): description of changes"
git push origin feature/wa-monitor-{feature-name}
```

**5. Deploy to Dev First**
```bash
# SSH and deploy to dev environment
ssh root@72.60.17.245

cd /var/www/fibreflow-dev
git fetch
git checkout feature/wa-monitor-{feature-name}
npm ci
npm run build
pm2 restart fibreflow-dev

# Test at https://dev.fibreflow.app/wa-monitor
```

**6. After Testing, Merge to Master**
```bash
# Locally
git checkout master
git merge feature/wa-monitor-{feature-name}
git push origin master

# Deploy to production
ssh root@72.60.17.245
cd /var/www/fibreflow
git pull
npm ci
npm run build
pm2 restart fibreflow-prod
```

---

## 🧪 Testing WA Monitor

### Integration Tests

Run the full test suite:
```bash
npm run test:wa-monitor
```

Tests verify:
- ✅ All API endpoints return correct format
- ✅ Error responses follow standard
- ✅ Data validation works
- ✅ HTTP methods are enforced

### Manual Testing

Test each endpoint individually:
```bash
# 1. Daily drops
curl http://localhost:3005/api/wa-monitor-daily-drops | jq .

# 2. All drops with summary
curl http://localhost:3005/api/wa-monitor-drops | jq .

# 3. Project stats
curl "http://localhost:3005/api/wa-monitor-project-stats?project=Lawley" | jq .

# 4. Projects summary
curl http://localhost:3005/api/wa-monitor-projects-summary | jq .

# 5. Error handling (405 Method Not Allowed)
curl -X POST http://localhost:3005/api/wa-monitor-drops | jq .

# 6. Error handling (404 Not Found)
curl "http://localhost:3005/api/wa-monitor-drops?id=nonexistent" | jq .
```

---

## 🔧 Branch Strategy

### Main Branches

| Branch | Purpose | Deploy To |
|--------|---------|-----------|
| `master` | Production code | Production (app.fibreflow.app) |
| `develop` | Development code | Dev (dev.fibreflow.app) |

### Feature Branches

**Naming Convention:**
```
feature/wa-monitor-{feature-name}
```

**Examples:**
- `feature/wa-monitor-export-csv`
- `feature/wa-monitor-filter-by-project`
- `feature/wa-monitor-bulk-feedback`

**Workflow:**
1. Branch from `master`
2. Develop feature
3. Test with `npm run test:wa-monitor`
4. Deploy to dev for testing
5. Merge to `master` after approval
6. Deploy to production

---

## ⚠️ Critical Rules

### DO:
✅ Test in dev environment before production
✅ Run integration tests before merging
✅ Update API_CONTRACT.md if changing responses
✅ Keep module self-contained
✅ Use flattened API routes (`wa-monitor-*.ts`)

### DO NOT:
❌ Modify `lib/apiResponse.ts` (it's a frozen copy)
❌ Add dependencies on main app utilities
❌ Skip dev testing
❌ Change API response formats without updating contract
❌ Use nested dynamic routes (causes Vercel 404s)

---

## 🚨 Breaking Change Protocol

If you need to make a breaking change to the API:

1. **Update API_CONTRACT.md**
   - Bump version number
   - Document the change
   - List migration steps

2. **Update Frontend Service**
   - Edit `waMonitorApiService.ts`
   - Handle both old and new response formats (if needed)

3. **Test Thoroughly**
   - Run `npm run test:wa-monitor`
   - Test manually in dev
   - Verify all pages still work

4. **Communicate**
   - Notify team of breaking change
   - Document in CHANGELOG.md
   - Update this guide if needed

5. **Deploy Carefully**
   - Deploy to dev first
   - Test for at least 1 day
   - Deploy to production with monitoring

---

## 📊 Module Health Checklist

Before deploying, verify:

- [ ] Integration tests pass (`npm run test:wa-monitor`)
- [ ] No imports from `@/lib/*` or `@/services/*`
- [ ] API responses match contract in `API_CONTRACT.md`
- [ ] All API routes use `@/modules/wa-monitor/lib/apiResponse`
- [ ] Dev environment tested and working
- [ ] No TypeScript errors
- [ ] No ESLint warnings in module files

---

## 🔮 Future: Extract to Microservice

If needed, this module can be extracted to a standalone Next.js app:

**Steps:**
1. Copy `src/modules/wa-monitor/` to new repo
2. Copy `pages/api/wa-monitor-*.ts` to new repo
3. Copy database connection setup
4. Update imports (remove `@/` prefix)
5. Configure environment variables
6. Deploy as separate service

**Benefits:**
- Independent scaling
- Separate deployment pipeline
- Isolated failures
- Easier team ownership

---

## 📖 Related Documentation

- **API Contract:** See `API_CONTRACT.md`
- **Module README:** See `README.md`
- **Main App VPS Guide:** See `/docs/VPS/DEPLOYMENT.md`
- **CLAUDE.md:** See project root for full context

---

## 🎯 Quick Reference

### Common Commands

```bash
# Run integration tests
npm run test:wa-monitor

# Deploy to dev
ssh root@72.60.17.245 "cd /var/www/fibreflow-dev && git pull && npm ci && npm run build && pm2 restart fibreflow-dev"

# Deploy to production
ssh root@72.60.17.245 "cd /var/www/fibreflow && git pull && npm ci && npm run build && pm2 restart fibreflow-prod"

# Check module dependencies
grep -r "from '@/lib" src/modules/wa-monitor/
grep -r "from '@/services" src/modules/wa-monitor/
grep -r "from '@/components" src/modules/wa-monitor/

# Verify API routes use internalized apiResponse
grep -l "from '@/lib/apiResponse'" pages/api/wa-monitor-*.ts
```

---

**Remember:** This module is designed to work independently. Treat it like a separate microservice that happens to live in the same codebase!

**Questions?** Check the API_CONTRACT.md or reach out to the team.
