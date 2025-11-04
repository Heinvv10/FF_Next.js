#!/bin/bash
# Check if fibreflow.app domain DNS records are properly configured
# Usage: bash scripts/cron/check-domain-verification.sh

echo "🔍 Checking DNS records for fibreflow.app domain..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check DKIM record (domain verification)
echo "1. Checking DKIM record (resend._domainkey.fibreflow.app)..."
DKIM_RECORD=$(nslookup -type=TXT resend._domainkey.fibreflow.app 8.8.8.8 2>/dev/null | grep "p=MIGfMA0GCSqGSIb3")

if [ -n "$DKIM_RECORD" ]; then
    echo -e "${GREEN}✅ DKIM record found${NC}"
else
    echo -e "${RED}❌ DKIM record NOT found${NC}"
    echo "   Add this TXT record:"
    echo "   Name: resend._domainkey"
    echo "   Content: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDswQxDo3bNH+ByhjlaOxZpQ5Vx8+r5tl47fgjqtDFnxBTObPpfHJDVtkfXcskfsVnWt23slahvx5QMS9QE4FscuZh9PSO1YXYYZT1JBhvp5eMQ+hXHi6KZ0mSJrr3Z81bmJ7aouYWOU/niZWj9TENPwd1syuKzJXdtsQrEDkxNQIDAQAB"
fi
echo ""

# Check SPF record
echo "2. Checking SPF record (send.fibreflow.app)..."
SPF_RECORD=$(nslookup -type=TXT send.fibreflow.app 8.8.8.8 2>/dev/null | grep "v=spf1")

if [ -n "$SPF_RECORD" ]; then
    echo -e "${GREEN}✅ SPF record found${NC}"
else
    echo -e "${RED}❌ SPF record NOT found${NC}"
    echo "   Add this TXT record:"
    echo "   Name: send"
    echo "   Content: v=spf1 include:amazonses.com ~all"
fi
echo ""

# Check MX record for sending
echo "3. Checking MX record for sending (send.fibreflow.app)..."
MX_RECORD=$(nslookup -type=MX send.fibreflow.app 8.8.8.8 2>/dev/null | grep "amazonses.com")

if [ -n "$MX_RECORD" ]; then
    echo -e "${GREEN}✅ Sending MX record found${NC}"
else
    echo -e "${RED}❌ Sending MX record NOT found${NC}"
    echo "   Add this MX record:"
    echo "   Name: send"
    echo "   Content: feedback-smtp.eu-west-1.amazonses.com"
    echo "   Priority: 10"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$DKIM_RECORD" ] && [ -n "$SPF_RECORD" ] && [ -n "$MX_RECORD" ]; then
    echo -e "${GREEN}✅ All DNS records are configured correctly!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://resend.com/domains"
    echo "2. Click 'Verify' next to fibreflow.app"
    echo "3. Test email: npx tsx scripts/cron/test-email.ts"
else
    echo -e "${YELLOW}⚠️  Some DNS records are missing${NC}"
    echo ""
    echo "Instructions:"
    echo "1. Add the missing DNS records shown above"
    echo "2. Wait 5-30 minutes for DNS propagation"
    echo "3. Run this script again to verify"
    echo ""
    echo "Full guide: docs/RESEND_DOMAIN_SETUP.md"
fi
echo ""
