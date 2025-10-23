# Deployment Checklist

Use this checklist before every deployment to ensure smooth releases.

## Pre-Deployment

### Code Quality
- [ ] All TypeScript errors resolved: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Local build succeeds: `npm run build`
- [ ] Local production server works: `PORT=3005 npm start`

### Testing
- [ ] Tested affected pages locally
- [ ] User-reported issues verified as fixed
- [ ] No console errors in browser
- [ ] API endpoints responding correctly

### Documentation
- [ ] Updated relevant page logs in `docs/page-logs/`
- [ ] Added "VERIFIED WORKING" to fixed issues
- [ ] Commit message is descriptive
- [ ] CLAUDE.md updated if deployment process changed

### Git
- [ ] All changes committed
- [ ] Commit follows format (feat/fix/docs: description)
- [ ] No sensitive data in commits (check .env files)
- [ ] On correct branch (master for production)

## Deployment

### Push to GitHub
```bash
git status                  # Verify changes
git log --oneline -3        # Check recent commits
git push origin master      # Deploy
```

### Verify Trigger
- [ ] Check GitHub shows push
- [ ] Vercel deployment triggered (check dashboard or email)
- [ ] Build started within 30 seconds

## Post-Deployment

### Verify Build
- [ ] Build completes successfully (2-5 minutes)
- [ ] No build errors in logs
- [ ] Deployment shows "Ready" status
- [ ] Production URL accessible

### Smoke Tests
- [ ] Homepage loads
- [ ] Login/authentication works
- [ ] Critical pages load (dashboard, contractors, etc.)
- [ ] API endpoints respond (check /api/health)
- [ ] Database connection working

### Specific Feature Testing
- [ ] Test the specific feature that was changed
- [ ] Verify user-reported issue is resolved
- [ ] Check related functionality still works
- [ ] Mobile responsiveness (if UI changes)

### Monitoring
- [ ] Check Vercel logs for errors
- [ ] Monitor for user feedback
- [ ] Check database for unexpected data
- [ ] Verify performance metrics acceptable

## Rollback Plan

If issues found after deployment:

### Option 1: Quick Fix
1. Fix issue locally
2. Test thoroughly
3. Deploy again following this checklist

### Option 2: Rollback
1. Go to Vercel dashboard
2. Find previous working deployment
3. Click "Promote to Production"
4. Fix issue offline
5. Re-deploy when ready

## Communication

### Internal
- [ ] Update team on deployment
- [ ] Document deployment in changelog
- [ ] Note any known issues

### Users (if major update)
- [ ] Notify of new features
- [ ] Document breaking changes
- [ ] Provide migration guide if needed

## Success Criteria

Deployment is successful when:
- ✅ Build completes without errors
- ✅ All smoke tests pass
- ✅ Specific features work as expected
- ✅ No critical errors in logs
- ✅ User can verify their reported issues are fixed

## Notes

Date: [Fill in]
Deployed By: [Your name]
Commit Hash: [git rev-parse HEAD]
Features/Fixes: [Brief description]
Known Issues: [Any known limitations]
