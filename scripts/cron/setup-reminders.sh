#!/bin/bash
# Daily Reminders System - Automated Setup Script
# Usage: bash scripts/cron/setup-reminders.sh

set -e  # Exit on error

echo "🚀 Setting up Daily Reminders System..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    echo "Please set DATABASE_URL in your environment"
    exit 1
fi

# Check if RESEND_API_KEY is set
if [ -z "$RESEND_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  RESEND_API_KEY not set${NC}"
    echo ""
    echo "Please get your API key from: https://resend.com"
    echo "Then add to your .env.production file:"
    echo "  RESEND_API_KEY=re_xxxxxxxxxxxxx"
    echo ""
    read -p "Press Enter once you've added the API key, or Ctrl+C to exit..."

    # Reload environment
    if [ -f ".env.production" ]; then
        source .env.production
    fi

    if [ -z "$RESEND_API_KEY" ]; then
        echo -e "${RED}❌ RESEND_API_KEY still not set${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Environment variables verified${NC}"
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install resend dotenv
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Run database migration
echo "🗄️  Running database migration..."
psql $DATABASE_URL -f scripts/migrations/create-reminders-tables.sql
echo -e "${GREEN}✅ Database tables created${NC}"
echo ""

# Step 3: Verify tables
echo "🔍 Verifying tables..."
TABLE_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('reminders', 'reminder_preferences');")
if [ "$TABLE_COUNT" -eq 2 ]; then
    echo -e "${GREEN}✅ Tables verified (reminders, reminder_preferences)${NC}"
else
    echo -e "${RED}❌ Table verification failed${NC}"
    exit 1
fi
echo ""

# Step 4: Test the cron script
echo "🧪 Testing email script..."
npx tsx scripts/cron/send-daily-reminders.ts
echo -e "${GREEN}✅ Email script tested${NC}"
echo ""

# Step 5: Setup cron job
echo "⏰ Setting up cron job..."
CRON_JOB="0 8 * * * cd $(pwd) && /usr/bin/npx tsx scripts/cron/send-daily-reminders.ts >> /var/log/reminders-cron.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "send-daily-reminders.ts"; then
    echo -e "${YELLOW}⚠️  Cron job already exists${NC}"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove old cron job
        crontab -l 2>/dev/null | grep -v "send-daily-reminders.ts" | crontab -
        # Add new cron job
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        echo -e "${GREEN}✅ Cron job updated${NC}"
    fi
else
    # Add new cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✅ Cron job added${NC}"
fi
echo ""

# Step 6: Create log file
echo "📝 Creating log file..."
sudo touch /var/log/reminders-cron.log
sudo chmod 666 /var/log/reminders-cron.log
echo -e "${GREEN}✅ Log file created${NC}"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "  1. Build and restart your app:"
echo "     npm run build && pm2 restart fibreflow"
echo ""
echo "  2. Test in browser:"
echo "     Go to: https://app.fibreflow.app/settings"
echo "     Click 'Reminders' tab"
echo ""
echo "  3. Monitor cron logs:"
echo "     tail -f /var/log/reminders-cron.log"
echo ""
echo "  4. View cron jobs:"
echo "     crontab -l"
echo ""
echo "📧 Cron Schedule: Daily at 8 AM"
echo "📝 Logs: /var/log/reminders-cron.log"
echo ""
echo "For troubleshooting, see: docs/REMINDERS_SETUP.md"
echo ""
