#!/bin/bash
# Trigger Vercel deployment via webhook
# Usage: ./vercel/scripts/trigger-deploy.sh <hook-url>
# Or: ./vercel/scripts/trigger-deploy.sh (uses env var)

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get hook URL from argument or environment variable
HOOK_URL="${1:-$VERCEL_DEPLOY_HOOK_PRODUCTION}"

if [ -z "$HOOK_URL" ]; then
    echo -e "${RED}❌ Error: Deploy hook URL required${NC}"
    echo ""
    echo "Usage:"
    echo "  1. Pass URL as argument:"
    echo "     ./vercel/scripts/trigger-deploy.sh <hook-url>"
    echo ""
    echo "  2. Set environment variable:"
    echo "     export VERCEL_DEPLOY_HOOK_PRODUCTION=<hook-url>"
    echo "     ./vercel/scripts/trigger-deploy.sh"
    echo ""
    echo "  3. Add to .env.local:"
    echo "     VERCEL_DEPLOY_HOOK_PRODUCTION=<hook-url>"
    echo "     source .env.local && ./vercel/scripts/trigger-deploy.sh"
    echo ""
    exit 1
fi

echo -e "${YELLOW}🚀 Triggering Vercel Deployment${NC}"
echo "======================================"

# Trigger the deployment
echo -e "\n${YELLOW}Sending POST request to Vercel...${NC}"
RESPONSE=$(curl -s -X POST "$HOOK_URL" -w "\nHTTP_STATUS:%{http_code}")

# Extract HTTP status code
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    echo -e "${GREEN}✅ Deployment triggered successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Check Vercel dashboard:"
    echo "   https://vercel.com/velocityfibre/fibreflow-nextjs"
    echo ""
    echo "2. Monitor deployment:"
    echo "   vercel ls"
    echo ""
    echo "3. View logs (after deployment starts):"
    echo "   vercel logs [deployment-url]"
    echo ""
    echo -e "${YELLOW}⏱  Deployment typically takes 2-5 minutes${NC}"
else
    echo -e "${RED}❌ Failed to trigger deployment${NC}"
    echo "HTTP Status: $HTTP_STATUS"
    echo ""
    echo "Troubleshooting:"
    echo "- Verify the deploy hook URL is correct"
    echo "- Check if hook was deleted in Vercel dashboard"
    echo "- Ensure you have network connectivity"
    exit 1
fi
