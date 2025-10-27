# CI/CD Setup Guide

## Overview

This project uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD). Every pull request and push to main/master triggers automated testing and quality checks.

## What Gets Tested

### 1. Lint & Type Check
- **ESLint**: Code quality and style checks
- **TypeScript**: Type safety verification
- **Runtime**: ~30-60 seconds

### 2. Unit Tests
- **Framework**: Vitest
- **Coverage**: Service layer, utilities, hooks
- **Artifacts**: Coverage reports uploaded
- **Runtime**: ~1-2 minutes

### 3. Component Tests
- **Framework**: Vitest + React Testing Library
- **Coverage**: React components, user interactions
- **Runtime**: ~1-2 minutes

### 4. E2E Tests
- **Framework**: Playwright
- **Coverage**: Full user workflows (authentication, CRUD operations)
- **Browsers**: Chromium (headless)
- **Artifacts**: Screenshots, videos, HTML reports
- **Runtime**: ~3-5 minutes

### 5. Build Verification
- **Framework**: Next.js
- **Verification**: Production build succeeds
- **Runtime**: ~2-3 minutes

**Total CI Runtime**: ~8-12 minutes per run

## GitHub Actions Workflow

Located at: `.github/workflows/ci.yml`

### Jobs

1. **lint-and-typecheck** - Code quality gates
2. **unit-tests** - Service layer testing
3. **component-tests** - UI component testing
4. **e2e-tests** - End-to-end workflows
5. **build** - Production build verification
6. **all-tests-passed** - Summary job (requires all to pass)

### Triggers

- **Pull Requests** to `main`, `master`, or `develop`
- **Direct Pushes** to `main` or `master`

## Setting Up Branch Protection Rules

### Required Steps (GitHub Repository Settings)

1. Go to **Settings** → **Branches** → **Add rule**

2. **Branch name pattern**: `main` (or `master`)

3. **Enable the following:**

   ✅ **Require a pull request before merging**
   - Require approvals: 1 (optional, for team workflows)
   - Dismiss stale pull request approvals when new commits are pushed

   ✅ **Require status checks to pass before merging**
   - Require branches to be up to date before merging

   **Select these status checks:**
   - `Lint & Type Check`
   - `Unit Tests`
   - `Component Tests`
   - `E2E Tests (Playwright)`
   - `Build Verification`
   - `All Tests Passed ✓`

   ✅ **Require conversation resolution before merging**

   ✅ **Do not allow bypassing the above settings** (recommended)

4. Click **Create** or **Save changes**

### Result

- All PRs must pass all tests before merge button becomes available
- Failed tests block merging
- Test results visible directly in PR

## Viewing Test Results

### In Pull Requests

1. Scroll to **Checks** section at bottom of PR
2. Click individual jobs to see logs
3. Download artifacts (coverage, screenshots) from job summary

### In Actions Tab

1. Go to **Actions** tab in GitHub
2. Click on workflow run
3. View job logs and artifacts

### Artifacts Available

- **Coverage Reports** (30 day retention)
  - HTML coverage reports
  - Line/branch coverage metrics

- **Playwright Reports** (30 day retention)
  - HTML test report with screenshots
  - Videos of failed tests
  - Trace files for debugging

- **E2E Results** (30 day retention)
  - Screenshots on failure
  - Error context markdown

## Local Development

### Run All Tests Locally (Before Pushing)

```bash
# Quick check (what CI will run)
npm run lint
npm run type-check
npm test -- --run
npm run test:component
npm run build
npm run test:e2e
```

### Individual Test Suites

```bash
# Unit tests (watch mode)
npm test

# Component tests
npm run test:component

# E2E tests (headless)
npm run test:e2e

# E2E tests (UI mode - for debugging)
npm run test:e2e:ui

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Coverage Reports

```bash
# Generate coverage
npm run test:coverage

# Open coverage report
open coverage/index.html
```

## Troubleshooting

### CI Failing on E2E Tests

**Cause**: E2E tests require production build + server running

**Solution**:
- Playwright config auto-starts server with `PORT=3005 npm start`
- Ensure `npm run build` succeeds locally first
- Check Playwright artifacts for screenshots/videos

### CI Slower Than Expected

**Cause**: Installing Playwright browsers takes time

**Solution**: Already optimized with:
- Node module caching
- Only installing Chromium browser
- Parallel job execution

### Build Failures

**Cause**: Type errors, missing dependencies, or environment variables

**Solution**:
1. Run `npm run type-check` locally
2. Run `npm run build` locally
3. Check for missing `.env.local` variables (CI doesn't need secrets for tests)

## Environment Variables

The CI workflow does **not** require environment variables for tests because:

- **E2E tests use mock authentication** (no Clerk secrets needed)
- **Database tests use Neon connection string** (already in code)
- **Build tests don't require runtime secrets**

For deployment, Vercel handles environment variables separately.

## Best Practices

### Before Creating a PR

1. Run `npm run lint:fix` to auto-fix style issues
2. Run `npm run type-check` to catch TypeScript errors
3. Run `npm test -- --run` to verify unit tests
4. Run `npm run test:e2e` to check E2E workflows

### During PR Review

1. Check CI status - all green checks required
2. Review coverage changes in artifacts
3. Download Playwright report if E2E tests are relevant

### After PR Merge

- CI runs again on main branch
- Vercel auto-deploys if configured
- Check Actions tab for deployment status

## Maintenance

### Updating CI Workflow

File: `.github/workflows/ci.yml`

**Common changes:**
- Add new test types
- Adjust timeouts
- Change Node.js version
- Add new status checks

**After changing:**
1. Create PR with changes
2. Verify workflow runs successfully
3. Update branch protection rules if new jobs added

## Support

For CI/CD issues:
1. Check workflow logs in Actions tab
2. Download artifacts for detailed reports
3. Run tests locally to reproduce
4. Check this guide for troubleshooting tips

---

**Story 2.5: CI/CD Automation** ✅ Complete
- Automated testing on every PR
- Quality gates prevent broken code
- Test artifacts for debugging
- Fast feedback loop (8-12 min)
