# Vercel Deployment Guide for Claude Code

This directory contains all Vercel-specific configuration, scripts, and documentation to enable seamless deployment management through Claude Code.

## Quick Start for Claude Code

When the user asks to deploy or push to Vercel, follow this workflow:

1. **Build locally first**: `npm run build`
2. **Test locally**: `PORT=3005 npm start`
3. **Commit changes**: Use git commit with descriptive message
4. **Push to GitHub**: `git push origin master`
5. **Verify deployment**: Check deployment status (see below)

## Project Information

- **Vercel Project**: fibreflow-nextjs
- **Organization**: Velocity (Pro)
- **GitHub Repo**: VelocityFibre/FF_Next.js
- **Production Branch**: master
- **Framework**: Next.js 14.2.18 (Pages Router)
- **Production URL**: [Check Vercel dashboard]

## Current Configuration

### Git Integration
- ✅ Auto-deploy enabled on push to master
- ✅ Pull Request comments enabled
- ✅ Commit comments enabled
- ✅ deployment_status events enabled
- ✅ repository_dispatch events enabled

### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: Auto-detected (22.x)

## Deployment Workflow

### Standard Deploy (Claude-Assisted)
```bash
# 1. Make code changes
# 2. Build locally
npm run build

# 3. Test locally
PORT=3005 npm start

# 4. Commit with descriptive message
git add [files]
git commit -m "feat: description of changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 5. Push to trigger Vercel deployment
git push origin master
```

### Emergency Rollback
```bash
# Use Vercel dashboard to rollback to previous deployment
# Or use CLI: vercel rollback [deployment-url]
```

## Checking Deployment Status

### Via CLI
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Check latest deployment
vercel ls

# Get deployment details
vercel inspect [deployment-url]
```

### Via Dashboard
1. Go to https://vercel.com/velocityfibre/fibreflow-nextjs
2. Check "Deployments" tab
3. Look for latest commit hash
4. Verify "Ready" status with green checkmark

## Environment Variables Required

**Critical**: These MUST be set in Vercel dashboard under Project Settings > Environment Variables

### Database
- `DATABASE_URL` - Neon PostgreSQL connection string
- `NEON_DATABASE_URL` - Same as DATABASE_URL

### Authentication (Clerk)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`

### Other Required Variables
- `NODE_ENV` - Set to "production"
- Any other variables from `.env.local`

## Common Issues & Solutions

### Build Fails
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Test build locally first: `npm run build`
4. Check for TypeScript errors: `npm run type-check`

### Deployment Takes Too Long
- Vercel builds typically take 2-5 minutes
- Large dependencies can increase build time
- Check build logs for slowdowns

### Environment Variables Not Working
- Ensure variables are set for "Production" environment
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check Neon database is accessible
- Ensure IP whitelist includes Vercel IPs (or use "Allow all")

## User Feedback Loop

### Workflow
1. **User Reports Issue** → Note in `docs/page-logs/[page].md`
2. **Claude Fixes** → Local testing at http://localhost:3005
3. **User Confirms Fix** → Update page log with "VERIFIED WORKING"
4. **Deploy to Vercel** → Push to master branch
5. **User Tests Production** → Verify on production URL
6. **Repeat** → Continuous improvement cycle

### Issue Tracking Template
See `docs/page-logs/contractors.md` for example of comprehensive issue tracking.

## Development vs Production

### Local Development (Production Mode)
```bash
npm run build
PORT=3005 npm start
```
**Why**: Avoids Watchpack bug in dev mode

### Vercel Production
- Auto-builds on push to master
- Serves optimized production build
- CDN-cached static assets
- Serverless API routes

## Commands Reference

### Build & Deploy
```bash
npm run build              # Build locally
PORT=3005 npm start        # Test production build
git push origin master     # Deploy to Vercel
```

### Vercel CLI
```bash
vercel                     # Interactive deploy
vercel --prod              # Deploy to production
vercel ls                  # List deployments
vercel logs [url]          # View deployment logs
vercel env ls              # List environment variables
vercel domains             # Manage domains
```

### Health Checks
```bash
# Local
curl http://localhost:3005/api/health

# Production (replace with your URL)
curl https://your-app.vercel.app/api/health
```

## Files in This Directory

- `CLAUDE.md` - This file, guide for Claude Code
- `docs/deployment-checklist.md` - Pre-deployment checklist
- `docs/environment-variables.md` - Complete list of env vars
- `docs/troubleshooting.md` - Common issues and fixes
- `scripts/deploy.sh` - Automated deployment script
- `scripts/verify-deployment.sh` - Post-deployment verification

## Best Practices

1. **Always test locally first** - Use production mode
2. **Commit messages** - Clear, descriptive, with co-authorship
3. **Document changes** - Update page logs for user-facing changes
4. **Verify after deploy** - Check production URL works
5. **Monitor errors** - Check Vercel logs for runtime errors

## For Claude Code: Deployment Protocol

When user says "deploy" or "push to vercel":

1. ✅ Verify local build succeeds
2. ✅ Check no uncommitted changes (except dev files)
3. ✅ Commit with proper message format
4. ✅ Push to master branch
5. ✅ Inform user deployment is triggered
6. ✅ Provide deployment URL to check
7. ✅ Suggest verification steps

## Monitoring

### What to Monitor
- Build success rate
- Deployment time
- Error logs
- Performance metrics
- User-reported issues

### Where to Monitor
- Vercel Dashboard: https://vercel.com/velocityfibre/fibreflow-nextjs
- GitHub Actions (if configured)
- Application logs via Vercel CLI

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Project Issues: Track in `docs/page-logs/`
