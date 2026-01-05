# CLAUDE.md - AI Assistant Context Guide

## Project Overview
**FibreFlow Next.js** - A fiber network project management application
- **Framework**: Next.js 14+ with App Router
- **Auth**: Clerk (fully integrated)
- **Database**: Neon PostgreSQL (direct SQL)
- **Storage**: Firebase Storage (files/images)

## Essential Directory Structure
```
src/
├── modules/        # Modular features (Lego blocks)
│   ├── wa-monitor/ # WhatsApp monitor (fully isolated)
│   └── rag/        # Contractor health monitoring
├── components/     # Shared UI (AppLayout is standard)
├── services/       # API services
└── lib/           # Utilities

scripts/           # Build scripts & database tools
SOW/              # Statement of Work import
neon/             # Database configuration
docs/             # Documentation & logs
```

## 🚨 CRITICAL: Database Configuration

**Single Database for ALL Environments:**
```
postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb
```
- ✅ Use: `ep-dry-night-a9qyh4sj`
- ❌ Never use: `ep-damp-credit-a857vku0` (old/incorrect)

### Two Drop Tables - DO NOT CONFUSE!

**1. `drops` Table** - SOW imports from Excel
- API: `/api/sow/drops`, `/api/sow/fibre`
- Import scripts: `/scripts/sow-import/`

**2. `qa_photo_reviews` Table** - WhatsApp QA data
- API: `/api/wa-monitor-drops`, `/api/wa-monitor-daily-drops`
- Source: WhatsApp groups via server monitor

**Query Examples:**
```sql
-- SOW drops
SELECT * FROM drops WHERE project_id = '...';

-- WhatsApp QA drops
SELECT * FROM qa_photo_reviews WHERE project = 'Lawley';
```

**Documentation:**
- `docs/DATABASE_TABLES.md` - Complete schema reference
- `src/modules/wa-monitor/README.md` - WA Monitor details

## 🚨 Starting the Server

**ALWAYS use production mode locally:**
```bash
npm run build
PORT=3005 npm start
# Access at http://localhost:3005
```

Dev mode now works after removing duplicate routes in src/app/ and src/pages/

## Key Commands
```bash
# Development
npm run build && PORT=3005 npm start  # Local development
npm run lint                          # ESLint
npm run type-check                    # TypeScript checking

# Database
npm run db:migrate                    # Run migrations
npm run db:seed                       # Seed data

# Testing
npm test                             # Vitest
npm run test:e2e                     # Playwright
npm run antihall                     # Validate code references
```

## Development Guidelines

### API Response Standards
Use `apiResponse` helper from `lib/apiResponse.ts`:
```typescript
import { apiResponse } from '@/lib/apiResponse';

return apiResponse.success(res, data);
return apiResponse.notFound(res, 'Resource', id);
return apiResponse.internalError(res, error);
```

### SOW Import Process
After creating a project, import data:
```bash
# Edit script with PROJECT_ID, then:
node scripts/sow-import/import-fibre-louissep15.cjs
node scripts/sow-import/verify-fibre-louissep15.cjs
```

### Coding Standards
- Files < 300 lines, components < 200 lines
- Extract business logic to hooks
- Type organization by module
- Domain-focused services

### API Route Naming
**Consistent dynamic parameters required:**
```bash
# ✅ CORRECT
pages/api/contractors/[contractorId].ts
pages/api/contractors/[contractorId]/documents.ts

# ❌ WRONG - Conflicts
pages/api/contractors/[id].ts
pages/api/contractors/[contractorId]/documents.ts
```

### Page Layouts
```tsx
// Standard layout with sidebar
import { AppLayout } from '@/components/layout';

export default function MyPage() {
  return <AppLayout>{/* content */}</AppLayout>;
}

// Fullscreen without sidebar
FotoReviewPage.getLayout = (page) => page;
```

### ⚠️ Vercel Nested Routes Issue
**Nested dynamic routes fail in production!** Use flattened routes:
```bash
# ❌ FAILS in production
pages/api/contractors/[contractorId]/onboarding/stages.ts

# ✅ WORKS everywhere
pages/api/contractors-onboarding-stages.ts?contractorId={id}
```

## Modular Architecture

Each module in `src/modules/` is self-contained:
```
module-name/
├── types/          # TypeScript interfaces
├── services/       # Business logic & API
├── utils/         # Helpers
├── components/    # UI components
└── hooks/         # Custom hooks
```

**WA Monitor** - Fully isolated module (zero dependencies)
- Can be extracted to microservice
- See: `src/modules/wa-monitor/ISOLATION_GUIDE.md`

## WhatsApp Monitor (WA Monitor)

**Status:** ✅ FULLY ISOLATED MODULE

### Quick Reference
- **Dashboard:** `/wa-monitor`
- **API:** `/api/wa-monitor-*`
- **Table:** `qa_photo_reviews`
- **Services:** `wa-monitor-prod`, `wa-monitor-dev`

### Common Issues & Fixes

**"Send Feedback" button not working:**
```bash
ssh louis@100.96.203.105
systemctl restart whatsapp-bridge-prod
```

**Add new WhatsApp group (5 minutes):**
```bash
ssh louis@100.96.203.105
nano /opt/wa-monitor/prod/config/projects.yaml
# Add group in YAML format
/opt/wa-monitor/prod/restart-monitor.sh  # ✅ Use safe restart
```

**⚠️ CRITICAL: Always use safe restart for production:**
```bash
/opt/wa-monitor/prod/restart-monitor.sh  # ✅ Clears Python cache
# NOT: systemctl restart wa-monitor-prod  # ❌ Keeps stale cache
```

### Monitored Groups
- **Lawley**: 120363418298130331@g.us
- **Mohadin**: 120363421532174586@g.us
- **Velo Test**: 120363421664266245@g.us
- **Mamelodi**: 120363408849234743@g.us

**Full Documentation:**
- `src/modules/wa-monitor/README.md`
- `src/modules/wa-monitor/TROUBLESHOOTING.md`

## Arcjet Security

API protection with rate limiting and bot detection:
- **Location:** `src/lib/arcjet.ts`
- **Levels:** ajStrict (30/min), aj (100/min), ajGenerous (300/min)

```typescript
import { withArcjetProtection, aj } from '@/lib/arcjet';
export default withArcjetProtection(handler, aj);
```

## Deployment Architecture

### 🚀 Velocity Server (New Infrastructure)
**Server Access:**
```bash
ssh louis@100.96.203.105    # via Tailscale (recommended)
ssh louis@192.168.1.150     # via LAN (same network)
# Password: VeloAdmin2025! (or use SSH key)
```

**Server Specs:**
- **GPU:** NVIDIA RTX 5090
- **RAM:** 128GB
- **Storage:** 500GB SSD
- **OS:** Ubuntu Server
- **Tailnet:** velof2025.github

### Dual Environment Setup
| Environment | URL | Branch | Port | PM2 Process |
|------------|-----|--------|------|-------------|
| **Production** | app.fibreflow.app | `master` | 3005 | `fibreflow-prod` |
| **Development** | dev.fibreflow.app | `develop` | 3006 | `fibreflow-dev` |

### Deployment Workflow
1. **Local:** Create feature branch from develop
2. **Dev:** Merge to develop → Deploy to dev.fibreflow.app
3. **Test:** Verify on dev environment
4. **Prod:** Merge to master → Deploy to app.fibreflow.app

### Deployment Commands
```bash
# Deploy to DEV (test first!)
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow-dev && git pull && npm ci && npm run build && pm2 restart fibreflow-dev"

# Deploy to PRODUCTION (after dev testing)
ssh louis@100.96.203.105 \
  "cd /var/www/fibreflow && git pull && npm ci && npm run build && pm2 restart fibreflow-prod"
```

### Server Quick Reference
```bash
ssh louis@100.96.203.105
pm2 list                          # View processes
pm2 logs fibreflow-prod          # View logs
pm2 restart fibreflow-prod       # Restart production
```

### Additional Services
| Service | Port | URL |
|---------|------|-----|
| **Portainer** | 9443 | https://100.96.203.105:9443 |
| **Grafana** | 3000 | http://100.96.203.105:3000 |
| **Ollama** | 11434 | http://100.96.203.105:11434 |
| **Qdrant** | 6333 | http://100.96.203.105:6333 |

### Rollback Process
```bash
ssh louis@100.96.203.105
cd /var/www/fibreflow
git log --oneline -5
git reset --hard <commit-hash>
npm ci && npm run build
pm2 restart fibreflow-prod
```

## Important Notes

- **Server**: Now hosted on Velocity Server (migrated from old VPS)
- **Migration Complete**: Next.js in production, React/Vite archived
- **Authentication**: Clerk only (Firebase Auth removed)
- **Database**: Direct SQL with Neon serverless client (no ORM)
- **Archive**: `../FF_React_Archive/` has old files for reference
- **Full Server Docs**: `~/VF/server/LOUIS_VELOCITY_SERVER_ACCESS.md`

### Page Development Logging
After changes, update `docs/page-logs/{page-name}.md` with:
- Timestamp (Month DD, YYYY - HH:MM AM/PM)
- Problem description
- Solution with file:line references
- Testing results

### AI Assistant Guidelines
1. Always work on feature branches
2. Deploy to dev.fibreflow.app first
3. Wait for user confirmation before production
4. Document changes in page logs
5. Use antihall validator for code verification
6. Prefer editing existing files over creating new ones