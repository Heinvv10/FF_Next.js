# Environment Variables Reference

Complete list of environment variables required for Vercel deployment.

## How to Set in Vercel

1. Go to https://vercel.com/velocityfibre/fibreflow-nextjs/settings/environment-variables
2. Add each variable below
3. Set environment: Production, Preview, Development (select all usually)
4. Save
5. Redeploy for changes to take effect

## Required Variables

### Database (Critical)

```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
NEON_DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
```
**Note**: Both should have the same value. Get from Neon.tech dashboard.

### Authentication - Clerk (Critical)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```
**Get from**: https://dashboard.clerk.com

### Node Environment

```env
NODE_ENV=production
```
**Set to**: production (Vercel usually sets this automatically)

## Optional Variables

### Logging & Monitoring

```env
LOG_LEVEL=info
ENABLE_QUERY_LOGGING=false
```

### Feature Flags

```env
ENABLE_EXPERIMENTAL_FEATURES=false
```

## Checking Current Variables

### Via Vercel CLI
```bash
vercel env ls
vercel env pull .env.vercel  # Download to local file (don't commit!)
```

### Via Dashboard
Go to Project Settings > Environment Variables

## Security Best Practices

### Never Commit These Files
- `.env.local`
- `.env.production`
- `.env.vercel`
- Any file containing actual credentials

### Use .gitignore
Ensure `.gitignore` contains:
```
.env*
!.env.example
```

### Rotate Secrets Regularly
- Database passwords
- API keys
- Authentication secrets

## Troubleshooting

### Variable Not Working
1. Check spelling (case-sensitive!)
2. Verify it's set for correct environment
3. Redeploy after adding variable
4. Check variable is actually used in code

### Database Connection Fails
1. Verify `DATABASE_URL` format
2. Check Neon database is running
3. Ensure IP whitelist includes Vercel IPs
4. Test connection string locally

### Clerk Auth Not Working
1. Check publishable key starts with `pk_`
2. Verify secret key starts with `sk_`
3. Ensure URLs match your domain
4. Check Clerk dashboard for errors

## Template for New Variables

When adding new variables:

1. **Add to `.env.example`** (without actual values):
```env
NEW_VARIABLE_NAME=your_value_here
```

2. **Document here** with:
   - Purpose
   - Where to get the value
   - Whether it's required or optional
   - Default value if any

3. **Add to Vercel** via dashboard or CLI

4. **Update CLAUDE.md** if it affects deployment process

## Current Variables Checklist

Use this to verify all variables are set:

- [ ] DATABASE_URL
- [ ] NEON_DATABASE_URL
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- [ ] CLERK_SECRET_KEY
- [ ] NEXT_PUBLIC_CLERK_SIGN_IN_URL
- [ ] NEXT_PUBLIC_CLERK_SIGN_UP_URL
- [ ] NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
- [ ] NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
- [ ] NODE_ENV

## For Claude Code

When user reports environment variable issues:

1. Ask them to verify variable is set in Vercel dashboard
2. Check `.env.local` format matches expected format
3. Suggest redeployment after adding variables
4. Verify variable name matches exactly in code
