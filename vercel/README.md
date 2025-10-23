# Vercel Deployment Management

This directory contains all resources for managing Vercel deployments with Claude Code assistance.

## 📁 Directory Structure

```
vercel/
├── CLAUDE.md                      # Guide for Claude Code deployment
├── README.md                      # This file
├── docs/
│   ├── deployment-checklist.md   # Pre-deployment checklist
│   ├── environment-variables.md  # Complete env vars reference
│   └── troubleshooting.md        # Common issues & solutions
└── scripts/
    ├── deploy.sh                 # Automated deployment
    └── verify-deployment.sh      # Post-deployment checks
```

## 🚀 Quick Start

### For Solo Developer (You)

**Standard workflow:**
```bash
# 1. Make changes and test locally
npm run build
PORT=3005 npm start

# 2. Deploy (automated script)
./vercel/scripts/deploy.sh "fix: description of changes"

# 3. Verify on production
# Check Vercel dashboard or production URL
```

### With Claude Code

Simply tell Claude:
- "Deploy this to Vercel"
- "Push these changes to production"
- "Check Vercel deployment status"

Claude will follow the deployment protocol in `CLAUDE.md`.

## 📋 Deployment Checklist

Before every deployment:
- ✅ Build succeeds locally
- ✅ Tests pass
- ✅ User-reported issues verified as fixed
- ✅ Documentation updated
- ✅ Environment variables set in Vercel

See `docs/deployment-checklist.md` for complete checklist.

## 🔄 Development Cycle

```
User Reports Issue
       ↓
Claude Fixes Locally
       ↓
User Verifies Fix (localhost:3005)
       ↓
Deploy to Vercel (git push)
       ↓
User Tests Production
       ↓
Document & Repeat
```

## 🛠️ Key Commands

```bash
# Build & Test
npm run build
PORT=3005 npm start

# Deploy (manual)
git add .
git commit -m "feat: description"
git push origin master

# Deploy (automated)
./vercel/scripts/deploy.sh "feat: description"

# Check Vercel CLI
vercel ls                    # List deployments
vercel logs [url]            # View logs
vercel env ls                # List env vars
```

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete guide for Claude Code
- **[deployment-checklist.md](./docs/deployment-checklist.md)** - Pre-deployment checklist
- **[environment-variables.md](./docs/environment-variables.md)** - All env vars
- **[troubleshooting.md](./docs/troubleshooting.md)** - Common issues

## 🔐 Security

- Never commit `.env*` files (except `.env.example`)
- All secrets go in Vercel dashboard
- Rotate credentials regularly
- Use environment-specific variables

## 📊 Monitoring

- **Vercel Dashboard**: https://vercel.com/velocityfibre/fibreflow-nextjs
- **Deployments**: Check build status and logs
- **Analytics**: Monitor performance
- **Logs**: Real-time error tracking

## 🆘 Troubleshooting

Common issues and solutions in `docs/troubleshooting.md`.

Quick fixes:
- Build fails → Check build logs, verify env vars
- Deploy slow → Normal, wait 2-5 minutes
- Error on production → Check Vercel logs, rollback if needed

## 🎯 Best Practices

1. **Test locally first** - Always in production mode
2. **Descriptive commits** - Clear, concise messages
3. **Document changes** - Update page logs
4. **Verify deploys** - Check production after deploy
5. **Monitor errors** - Watch Vercel logs

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Project Issues: Track in `docs/page-logs/`
- Claude Code: Ask in chat for deployment help

## 🔄 Update History

- **2025-10-21**: Initial Vercel management structure created
- Added comprehensive deployment documentation
- Created automated deployment scripts
- Established Claude Code integration protocol
