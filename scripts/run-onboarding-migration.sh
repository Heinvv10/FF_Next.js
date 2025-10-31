#!/bin/bash

# Run Contractor Onboarding Migration
# Usage: ./scripts/run-onboarding-migration.sh

echo "🚀 Running contractor onboarding migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "To run this migration:"
    echo "1. Set DATABASE_URL environment variable"
    echo "2. Run: ./scripts/run-onboarding-migration.sh"
    echo ""
    echo "Or run directly with psql:"
    echo "psql \$DATABASE_URL -f neon/migrations/create_contractor_onboarding_and_documents.sql"
    exit 1
fi

# Run the migration
psql "$DATABASE_URL" -f neon/migrations/create_contractor_onboarding_and_documents.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Tables created:"
    echo "  - contractor_documents"
    echo "  - contractor_onboarding_stages"
    echo ""
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
