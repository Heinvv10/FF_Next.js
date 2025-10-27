# GitHub Configuration

## Workflows

### CI - Tests & Build (`workflows/ci.yml`)

Automated testing and quality assurance for every pull request.

**Runs on:**
- Pull requests to `main`, `master`, `develop`
- Direct pushes to `main`, `master`

**Jobs:**
1. Lint & Type Check (~1 min)
2. Unit Tests (~2 min)
3. Component Tests (~2 min)
4. E2E Tests (~5 min)
5. Build Verification (~3 min)

**Total Runtime:** ~8-12 minutes

**Artifacts:**
- Coverage reports (30 days)
- Playwright HTML reports (30 days)
- E2E test screenshots/videos (30 days)

## Setup Instructions

See [CI_CD_SETUP.md](./CI_CD_SETUP.md) for:
- Branch protection rules
- Viewing test results
- Local testing commands
- Troubleshooting guide

## Quick Commands

```bash
# Run what CI runs locally
npm run lint
npm run type-check
npm test -- --run
npm run test:component
npm run build
npm run test:e2e
```

## Status Badges

Add to README.md:

```markdown
![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)
```
