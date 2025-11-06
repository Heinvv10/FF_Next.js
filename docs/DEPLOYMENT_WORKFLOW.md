# FibreFlow Deployment Workflow

## 🎯 Golden Rule
**ALWAYS deploy to DEV first → Test → Then deploy to PRODUCTION**

## 📋 Quick Reference

### Environments

| Environment | URL | Branch | Use Case |
|------------|-----|--------|----------|
| **Dev** | https://dev.fibreflow.app | `develop` | Testing new features |
| **Production** | https://app.fibreflow.app | `master` | Live customer-facing site |

## 🔄 Standard Workflow

### 1️⃣ Start New Feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature-name
```

### 2️⃣ Develop & Test Locally
```bash
# Make your changes
npm run build
PORT=3005 npm start
# Test at http://localhost:3005
```

### 3️⃣ Deploy to DEV
```bash
# Commit changes
git add .
git commit -m "feat: description"

# Merge to develop
git checkout develop
git merge feature/my-feature-name
git push origin develop

# Deploy to DEV server
sshpass -p 'VeloF@2025@@' ssh -o StrictHostKeyChecking=no root@72.60.17.245 \
  "cd /var/www/fibreflow-dev && git pull && npm ci && npm run build && pm2 restart fibreflow-dev"
```

**Test at: https://dev.fibreflow.app** ✅

### 4️⃣ Test on DEV
- [ ] All features work correctly
- [ ] No console errors
- [ ] User flows tested
- [ ] API endpoints verified
- [ ] Responsive design checked
- [ ] Performance acceptable

### 5️⃣ Deploy to PRODUCTION
**Only after DEV testing passes!**

```bash
# Merge develop to master
git checkout master
git pull origin master
git merge develop
git push origin master

# Deploy to PRODUCTION server
sshpass -p 'VeloF@2025@@' ssh -o StrictHostKeyChecking=no root@72.60.17.245 \
  "cd /var/www/fibreflow && git pull && npm ci && npm run build && pm2 restart fibreflow-prod"
```

**Verify at: https://app.fibreflow.app** ✅

## 🚨 Hotfix Workflow

For critical production bugs:

```bash
# Create hotfix from master
git checkout master
git checkout -b hotfix/critical-fix

# Fix the issue
git add .
git commit -m "fix: critical bug description"

# Deploy directly to production
git checkout master
git merge hotfix/critical-fix
git push origin master

# Deploy to PROD
sshpass -p 'VeloF@2025@@' ssh -o StrictHostKeyChecking=no root@72.60.17.245 \
  "cd /var/www/fibreflow && git pull && npm ci && npm run build && pm2 restart fibreflow-prod"

# Merge back to develop
git checkout develop
git merge master
git push origin develop
```

## 📊 Monitoring

### Check PM2 Status
```bash
ssh root@72.60.17.245 "pm2 list"
```

### View Logs
```bash
# DEV logs
ssh root@72.60.17.245 "pm2 logs fibreflow-dev"

# PRODUCTION logs
ssh root@72.60.17.245 "pm2 logs fibreflow-prod"
```

### Restart Services
```bash
# Restart DEV
ssh root@72.60.17.245 "pm2 restart fibreflow-dev"

# Restart PRODUCTION
ssh root@72.60.17.245 "pm2 restart fibreflow-prod"
```

## 🔙 Rollback

If production deployment fails:

```bash
ssh root@72.60.17.245
cd /var/www/fibreflow

# View recent commits
git log --oneline -10

# Rollback to last working commit
git reset --hard <commit-hash>
npm ci
npm run build
pm2 restart fibreflow-prod
```

## 🤖 AI Assistant Protocol

When Claude Code implements features:

1. ✅ **Create feature branch** from `develop`
2. ✅ **Deploy to DEV** for testing
3. ⏸️ **Wait for user approval** before production
4. ✅ **Deploy to PRODUCTION** after confirmation
5. ✅ **Document changes** in logs

## 📝 Branch Naming Conventions

- `feature/description` - New features
- `fix/description` - Bug fixes
- `hotfix/description` - Critical production fixes
- `refactor/description` - Code improvements
- `docs/description` - Documentation updates

## ⚠️ Never Do This

- ❌ Push directly to `master` without testing on `develop`
- ❌ Skip DEV deployment for "small changes"
- ❌ Deploy to production during peak hours (unless critical)
- ❌ Deploy without testing
- ❌ Forget to document changes

## ✅ Always Do This

- ✅ Test locally first
- ✅ Deploy to DEV before production
- ✅ Wait for confirmation before going live
- ✅ Monitor logs after deployment
- ✅ Document changes in CHANGELOG.md
- ✅ Verify both environments after deployment
