# Arcjet Security Setup Guide

## Overview

Arcjet provides bot protection, rate limiting, and attack detection for FibreFlow API endpoints. It's an open-source SDK with a cloud service backend.

**Features:**
- ✅ AI-powered bot detection (local inference)
- ✅ Distributed rate limiting (no Redis needed)
- ✅ Attack protection (SQL injection, XSS, etc.)
- ✅ Native Next.js integration

## Setup Instructions

### 1. Sign Up for Arcjet (Free Tier)

1. Visit https://arcjet.com
2. Sign up for a free account (no credit card required)
3. Create a new site/project
4. Copy your API key (starts with `ajkey_`)

### 2. Add API Key to Environment

Add the API key to your environment files:

```bash
# .env.local (for local development)
ARCJET_KEY=ajkey_your_key_here

# .env.production (for VPS production)
ARCJET_KEY=ajkey_your_key_here
```

**Important:** The Arcjet configuration in `src/lib/arcjet.ts` will gracefully degrade if `ARCJET_KEY` is not set - requests will pass through with a warning logged.

### 3. Protected Endpoints

The following endpoints are already protected:

#### Strict Protection (30 req/min)
**Contractor Endpoints:**
- `/api/contractors/[contractorId]` - Contractor CRUD operations
- `/api/contractors-documents` - List contractor documents
- `/api/contractors-documents-upload` - Upload documents

#### WA Monitor Protection (60 req/min)
**WhatsApp Integration:**
- `/api/wa-monitor-daily-drops` - Dashboard data
- `/api/wa-monitor-send-feedback` - Send QA feedback to WhatsApp groups

#### Standard Protection (100 req/min)
**Project & SOW Endpoints:**
- `/api/sow/drops` - SOW drops data
- `/api/projects` - Projects CRUD (GET, POST, PUT, DELETE)

### 4. Protection Levels

Arcjet is configured with three protection levels:

```typescript
import { aj, ajStrict, ajGenerous } from '@/lib/arcjet';
```

**ajStrict** (30 req/min)
- For sensitive endpoints (auth, contractors, financial data)
- No bots allowed
- Attack shield enabled

**aj** (100 req/min) - Default
- For most API endpoints
- Search engine bots allowed
- Attack shield enabled

**ajGenerous** (300 req/min)
- For public endpoints (health checks)
- Bot detection in monitoring mode only

**ajWaMonitor** (60 req/min)
- For WhatsApp integration endpoints
- Moderate rate limiting

### 5. Protect Additional Endpoints

To protect a new endpoint:

```typescript
// Import Arcjet helpers
import { withArcjetProtection, aj } from '@/lib/arcjet';

// Change 'export default async function handler' to:
async function handler(req, res) {
  // Your API logic
}

// Export with protection
export default withArcjetProtection(handler, aj);
```

**Example with strict protection:**
```typescript
import { withArcjetProtection, ajStrict } from '@/lib/arcjet';

async function handler(req, res) {
  // Sensitive endpoint logic
}

export default withArcjetProtection(handler, ajStrict);
```

## Testing

### Test Rate Limiting

```bash
# Make 35 requests quickly to a strict endpoint
for i in {1..35}; do
  curl http://localhost:3005/api/contractors/some-id
done

# After 30 requests, you should see:
# {
#   "success": false,
#   "error": {
#     "code": "RATE_LIMIT",
#     "message": "Too many requests. Please try again later."
#   }
# }
```

### Test Bot Detection

Arcjet automatically detects bot patterns. Check logs for:

```
Arcjet decision: {
  id: '...',
  conclusion: 'DENY',
  reason: 'BOT_DETECTED',
  ip: '...'
}
```

## Monitoring

### Check Arcjet Dashboard
1. Login to https://arcjet.com
2. View your site dashboard
3. See real-time requests, blocks, and analytics

### Local Logs
Arcjet decisions are logged to console:

```javascript
console.log('Arcjet decision:', {
  id: decision.id,
  conclusion: decision.conclusion, // ALLOW or DENY
  reason: decision.reason,
  ip: decision.ip,
});
```

## Deployment

### Local Development (Optional)
```bash
# Add to .env.local
ARCJET_KEY=ajkey_your_dev_key

# App works fine without it (graceful degradation)
```

### VPS Production (Required)
```bash
# SSH into VPS
ssh root@72.60.17.245

# Add to production environment
nano /var/www/fibreflow/.env.production
# Add: ARCJET_KEY=ajkey_your_prod_key

# Add to dev environment
nano /var/www/fibreflow-dev/.env.production
# Add: ARCJET_KEY=ajkey_your_dev_key

# Rebuild and restart
cd /var/www/fibreflow
npm run build
pm2 restart fibreflow-prod

cd /var/www/fibreflow-dev
npm run build
pm2 restart fibreflow-dev
```

## Troubleshooting

### "Arcjet protection skipped - ARCJET_KEY not configured"
**Cause:** Environment variable not set
**Solution:** Add `ARCJET_KEY` to your .env file

### "Request blocked for security reasons"
**Cause:** Arcjet's shield detected suspicious patterns
**Solution:** Check request for SQL injection, XSS, or other attack patterns

### Rate limit too strict/lenient
**Solution:** Adjust rate limits in `src/lib/arcjet.ts`:

```typescript
fixedWindow({
  mode: "LIVE",
  window: "1m",
  max: 100, // Change this value
}),
```

## Cost

**Free Tier Includes:**
- Basic bot detection
- Rate limiting
- Attack protection
- Sufficient for side projects and prototyping

**Paid Plans Unlock:**
- Advanced bot detection (IP analysis, behavioral analysis)
- Higher request limits
- Priority support

See https://arcjet.com/pricing for current pricing.

## Architecture

**Arcjet Model:** Open Core
- ✅ SDK is open source (Apache 2.0)
- ❌ Backend service is proprietary

**Similar to:**
- Clerk (auth SDK open source, service closed)
- Vercel (framework open source, platform closed)

## Additional Resources

- **Official Docs:** https://docs.arcjet.com
- **GitHub:** https://github.com/arcjet/arcjet-js
- **Rate Limiting Guide:** https://docs.arcjet.com/rate-limiting/concepts/
- **Bot Protection:** https://docs.arcjet.com/bot-protection/concepts/

## Support

- Arcjet Documentation: https://docs.arcjet.com
- Arcjet Support: https://docs.arcjet.com/support/
- FibreFlow Config: `src/lib/arcjet.ts`
