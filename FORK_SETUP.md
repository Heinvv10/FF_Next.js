# Fork Setup & Contribution Guide

**Fork**: https://github.com/VeloF2025/FF_Next.js
**Upstream**: https://github.com/VelocityFibre/FF_Next.js

## Quick Setup

### 1. Clone the Fork

```bash
git clone https://github.com/VeloF2025/FF_Next.js.git
cd FF_Next.js
```

### 2. Add Upstream Remote

```bash
git remote add upstream https://github.com/VelocityFibre/FF_Next.js.git
git remote -v
# Should show:
# origin    https://github.com/VeloF2025/FF_Next.js.git (fetch)
# origin    https://github.com/VeloF2025/FF_Next.js.git (push)
# fork      https://github.com/VeloF2025/FF_Next.js.git (fetch)
# fork      https://github.com/VeloF2025/FF_Next.js.git (push)
# upstream  https://github.com/VelocityFibre/FF_Next.js.git (fetch)
# upstream  https://github.com/VelocityFibre/FF_Next.js.git (push)
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Install PAI Git Hooks

```bash
# Windows
.claude\hooks\setup-git-hooks.bat

# Linux/Mac
bash .claude/hooks/setup-git-hooks.sh
```

## Development Workflow

### Creating a Feature Branch

```bash
# Update from upstream
git fetch upstream
git checkout master
git merge upstream/master

# Create feature branch
git checkout -b feature/your-feature-name
```

### Working on Features

1. **Make changes** following coding standards in `docs/CODING_STANDARDS.md`
2. **Test locally**:
   ```bash
   npm run build
   PORT=3005 npm start
   ```
3. **Run tests**:
   ```bash
   npm test                 # Unit tests
   npm run test:e2e        # E2E tests
   npm run type-check      # TypeScript
   npm run lint            # ESLint
   ```

### Committing Changes

Git hooks will automatically validate:
- ✅ TypeScript type check
- ✅ ESLint compliance
- ✅ No console.log statements
- ✅ Correct database endpoint (ep-dry-night-a9qyh4sj)
- ✅ WA Monitor isolation maintained
- ✅ Commit message format (conventional commits)

```bash
git add .
git commit -m "feat: Add stock control module"
# Hooks will run automatically
```

**Commit Message Format**:
```
type(scope): subject

Examples:
  feat: Add stock control inventory management
  fix: Resolve database connection timeout
  docs: Update feature expansion roadmap
  refactor: Extract stock service logic to hook
  test: Add E2E tests for fleet management
```

### Pushing to Fork

```bash
git push origin feature/your-feature-name
```

### Creating Pull Request

1. Go to https://github.com/VeloF2025/FF_Next.js
2. Click "Pull requests" → "New pull request"
3. Base: `VelocityFibre/FF_Next.js` `master`
4. Compare: `VeloF2025/FF_Next.js` `feature/your-feature-name`
5. Fill in PR template:
   ```markdown
   ## Summary
   - Brief description of changes
   
   ## Test Plan
   - [ ] Unit tests pass
   - [ ] E2E tests pass
   - [ ] Manual testing completed
   - [ ] PAI quality gates pass
   
   ## Related Issues
   - Closes #123
   ```

## CI/CD Pipeline

Every push triggers automated checks:

### Lint & Type Check
- ESLint validation
- TypeScript type checking

### Tests
- **Unit Tests** (Vitest with coverage)
- **Component Tests** (React Testing Library)
- **E2E Tests** (Playwright)

### Build Verification
- Next.js build succeeds
- No build errors

### PAI Quality Gates
- ✅ No console.log statements
- ✅ Correct database endpoint
- ✅ WA Monitor isolation
- ✅ API routes use apiResponse helper

## Syncing with Upstream

Keep your fork up-to-date:

```bash
# Fetch latest from upstream
git fetch upstream

# Update master
git checkout master
git merge upstream/master
git push origin master

# Update feature branch
git checkout feature/your-feature-name
git merge master
# Resolve conflicts if any
git push origin feature/your-feature-name
```

## Feature Expansion Branches

Current feature development branches:

| Branch | Feature | Status |
|--------|---------|--------|
| `feature/expansion-planning` | Planning & research | Active |
| `feature/stock-control` | Inventory management | Planned |
| `feature/fleet-management` | Vehicle tracking | Planned |
| `feature/ticketing-system` | Support tickets | Planned |
| `feature/asset-register` | Asset lifecycle | Planned |

## Best Practices

### Code Quality
1. **Follow coding standards**: `docs/CODING_STANDARDS.md`
2. **Use PAI validation**: Specialized agents will auto-check
3. **Write tests**: Aim for >80% coverage
4. **Document changes**: Update relevant docs

### Database Operations
- ✅ **ALWAYS** use endpoint: `ep-dry-night-a9qyh4sj`
- ❌ **NEVER** use: `ep-damp-credit-a857vku0` (old/wrong)
- Use `apiResponse` helper for all API routes
- Follow direct SQL patterns (no ORM)

### WA Monitor Module
- Maintain **zero dependencies** on main app
- Use internal copies of utilities
- Read `src/modules/wa-monitor/ISOLATION_GUIDE.md` before changes

### Deployment Workflow
1. Deploy to `dev.fibreflow.app` first
2. Test thoroughly
3. Then deploy to `app.fibreflow.app`

## Troubleshooting

### Hook Failures
```bash
# View hook output
git commit -m "test"

# Skip hooks (emergency only - NOT recommended)
git commit --no-verify -m "emergency fix"
```

### CI Failures
- Check GitHub Actions: https://github.com/VeloF2025/FF_Next.js/actions
- Review failed job logs
- Fix issues locally and push again

### Merge Conflicts
```bash
# Update from upstream
git fetch upstream
git merge upstream/master

# Resolve conflicts in your editor
# Then:
git add .
git commit -m "chore: Resolve merge conflicts"
git push origin feature/your-feature-name
```

## Resources

- **PAI Setup Guide**: `docs/PAI_SETUP.md`
- **Coding Standards**: `docs/CODING_STANDARDS.md`
- **Feature Planning**: `docs/feature-expansion/README.md`
- **Database Schema**: `docs/DATABASE_TABLES.md`
- **WA Monitor**: `src/modules/wa-monitor/README.md`

## Contact

For questions or issues:
- **Fork Owner**: VeloF2025
- **Upstream**: VelocityFibre
- **Issues**: https://github.com/VeloF2025/FF_Next.js/issues

---

*Last Updated: 2025-12-18*
