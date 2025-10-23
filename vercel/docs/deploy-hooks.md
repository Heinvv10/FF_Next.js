# Deploy Hooks Guide

Deploy hooks are unique URLs that allow you to trigger a deployment without pushing to GitHub. Useful for manual triggers, CI/CD integration, or scheduled deployments.

## What Are Deploy Hooks?

Deploy hooks are secure URLs that:
- Trigger a deployment of a specific branch
- Work independently of git pushes
- Can be called from anywhere (CLI, scripts, external services)
- Are unique and regenerated if compromised

## When to Use Deploy Hooks

### Good Use Cases
- **Manual Production Deploy** - Deploy without committing
- **External CI/CD** - Trigger from Jenkins, CircleCI, etc.
- **Scheduled Deployments** - Use cron jobs to deploy at specific times
- **Emergency Hotfixes** - Quick deploy bypassing normal workflow
- **Content Updates** - Rebuild when CMS content changes

### Not Recommended For
- Regular development workflow (use git push instead)
- Automated triggers that duplicate Vercel's git integration

## Creating Deploy Hooks

### Via Vercel Dashboard

1. **Navigate to Project Settings**
   ```
   https://vercel.com/velocityfibre/fibreflow-nextjs/settings/git
   ```

2. **Scroll to "Deploy Hooks" Section**

3. **Click "Create Hook"**
   - **Name**: Descriptive name (e.g., "Production Manual Deploy", "Hotfix Deploy")
   - **Branch**: Select branch to deploy (usually `master` for production)
   - **Click "Create Hook"**

4. **Copy the URL**
   - Save it securely (treat like a password!)
   - Format: `https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy`

### Recommended Hooks to Create

#### 1. Production Manual Deploy
- **Name**: `production-manual`
- **Branch**: `master`
- **Use**: Emergency deploys, content updates

#### 2. Preview Deploy
- **Name**: `preview-deploy`
- **Branch**: `develop` (if you have one)
- **Use**: Testing before merging to master

#### 3. Rebuild Static Content
- **Name**: `rebuild-static`
- **Branch**: `master`
- **Use**: Refresh static generation without code changes

## Using Deploy Hooks

### Via cURL (Terminal)

```bash
# Simple trigger
curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy

# With output
curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy \
  && echo "✅ Deployment triggered!"
```

### Via Script

Create `vercel/scripts/trigger-deploy.sh`:

```bash
#!/bin/bash
# Trigger Vercel deployment via webhook

HOOK_URL="$1"

if [ -z "$HOOK_URL" ]; then
    echo "Usage: ./trigger-deploy.sh <hook-url>"
    echo "Example: ./trigger-deploy.sh \$VERCEL_DEPLOY_HOOK"
    exit 1
fi

echo "🚀 Triggering Vercel deployment..."
RESPONSE=$(curl -X POST "$HOOK_URL" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Deployment triggered successfully!"
    echo "Check: https://vercel.com/velocityfibre/fibreflow-nextjs"
else
    echo "❌ Failed to trigger deployment"
    exit 1
fi
```

Make executable:
```bash
chmod +x vercel/scripts/trigger-deploy.sh
```

Usage:
```bash
./vercel/scripts/trigger-deploy.sh "$VERCEL_DEPLOY_HOOK"
```

### Storing Hook URLs Securely

**Option 1: Environment Variables (Recommended)**

Add to your `.env.local` (never commit!):
```env
VERCEL_DEPLOY_HOOK_PRODUCTION=https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy
VERCEL_DEPLOY_HOOK_PREVIEW=https://api.vercel.com/v1/integrations/deploy/prj_xxx/zzz
```

**Option 2: Secure Storage File**

Create `vercel/.deploy-hooks` (add to .gitignore):
```json
{
  "production": "https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy",
  "preview": "https://api.vercel.com/v1/integrations/deploy/prj_xxx/zzz"
}
```

Add to `.gitignore`:
```
vercel/.deploy-hooks
```

## Integration Examples

### With GitHub Actions

Create `.github/workflows/manual-deploy.yml`:

```yaml
name: Manual Vercel Deploy
on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel Deployment
        run: |
          curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK }}
```

Store hook URL in GitHub Secrets as `VERCEL_DEPLOY_HOOK`.

### With Cron (Scheduled Deploys)

Add to crontab:
```bash
# Deploy every day at 2 AM
0 2 * * * curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy
```

### With Node.js Script

```javascript
// scripts/trigger-deploy.js
const https = require('https');

const DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK_PRODUCTION;

function triggerDeploy() {
  return new Promise((resolve, reject) => {
    const url = new URL(DEPLOY_HOOK);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST'
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Deployment triggered!');
        resolve();
      } else {
        reject(new Error(`Failed: ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.end();
  });
}

triggerDeploy().catch(console.error);
```

Run with:
```bash
node scripts/trigger-deploy.js
```

## Security Best Practices

### DO
- ✅ Store hook URLs in environment variables
- ✅ Add `.env.local` to `.gitignore`
- ✅ Regenerate hooks if compromised
- ✅ Use descriptive names for hooks
- ✅ Limit who has access to hook URLs

### DON'T
- ❌ Commit hook URLs to git
- ❌ Share hooks publicly
- ❌ Use same hook for multiple purposes
- ❌ Store in client-side code
- ❌ Log hook URLs in application logs

### If Hook is Compromised

1. Go to Vercel Dashboard > Project Settings > Git
2. Find the compromised hook
3. Click "Delete"
4. Create a new hook with different name
5. Update all references to use new URL

## Monitoring Deployments

After triggering a deploy hook:

1. **Check Vercel Dashboard**
   ```
   https://vercel.com/velocityfibre/fibreflow-nextjs
   ```

2. **Via Vercel CLI**
   ```bash
   vercel ls
   vercel logs [deployment-url]
   ```

3. **Check Deployment Status**
   - Look for "Building" → "Ready" status
   - Verify commit/branch being deployed
   - Check build logs for errors

## Troubleshooting

### Hook Returns 404
- URL is incorrect or hook was deleted
- Verify URL in Vercel dashboard
- Regenerate if necessary

### Hook Returns 401/403
- Authentication issue
- Hook URL may be malformed
- Try regenerating the hook

### Deployment Not Triggering
- Check Vercel dashboard for errors
- Verify branch name is correct
- Ensure project isn't rate-limited

### Multiple Deployments Triggered
- Check for duplicate hook calls
- Review automated scripts/cron jobs
- Look for git push + hook both triggering

## Advanced: Deploy Hook with Parameters

You can add query parameters for more control:

```bash
# Skip build cache
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy?skipCache=1"

# Force rebuild
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy?forceNew=1"
```

## For Claude Code Integration

When user asks to trigger a manual deploy:

1. Ask if they want to use hook or git push
2. If hook: provide the trigger command
3. Remind them to check deployment status
4. Document the manual deploy in page logs if significant

### Example Claude Response

```
I'll help you trigger a manual Vercel deployment.

You have two options:

1. Using Deploy Hook:
   ./vercel/scripts/trigger-deploy.sh "$VERCEL_DEPLOY_HOOK_PRODUCTION"

2. Using Git Push (standard):
   git push origin master

Which would you prefer? The hook is faster but git push provides better tracking.
```

## Quick Reference

```bash
# Create hook
# Go to: vercel.com/velocityfibre/fibreflow-nextjs/settings/git

# Trigger deployment
curl -X POST $VERCEL_DEPLOY_HOOK

# With script
./vercel/scripts/trigger-deploy.sh "$VERCEL_DEPLOY_HOOK"

# Check status
vercel ls

# View logs
vercel logs [url]
```

## Checklist

When setting up deploy hooks:

- [ ] Create hook(s) in Vercel dashboard
- [ ] Copy hook URL(s) securely
- [ ] Add to `.env.local` (don't commit!)
- [ ] Add `.env.local` to `.gitignore`
- [ ] Test hook with curl
- [ ] Document which hooks exist
- [ ] Set up monitoring for triggered deploys
- [ ] Train team on when to use hooks vs git push

## Resources

- [Vercel Deploy Hooks Documentation](https://vercel.com/docs/concepts/git/deploy-hooks)
- [Vercel API Reference](https://vercel.com/docs/rest-api)
