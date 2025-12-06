#!/bin/bash
# Batch protect API endpoints with Arcjet
# Usage: ./scripts/protect-endpoints.sh

echo "🛡️  Protecting contractor endpoints with Arcjet..."

# Array of contractor endpoints to protect (strict)
CONTRACTOR_ENDPOINTS=(
  "pages/api/contractors-documents-upload.ts"
  "pages/api/contractors-documents-update.ts"
  "pages/api/contractors-documents-delete.ts"
  "pages/api/contractors-documents-verify.ts"
  "pages/api/contractors-update.ts"
  "pages/api/contractors-projects.ts"
  "pages/api/contractors-projects-update.ts"
  "pages/api/contractors-projects-delete.ts"
  "pages/api/contractors-onboarding-stages.ts"
  "pages/api/contractors-onboarding-stages-update.ts"
  "pages/api/contractors-onboarding-complete.ts"
)

# Array of WA Monitor endpoints to protect (WA Monitor rate limit)
WA_MONITOR_ENDPOINTS=(
  "pages/api/wa-monitor-drops.ts"
  "pages/api/wa-monitor-send-feedback.ts"
  "pages/api/wa-monitor-sync-sharepoint.ts"
)

# Array of project endpoints to protect (standard)
PROJECT_ENDPOINTS=(
  "pages/api/projects/index.ts"
  "pages/api/projects/[projectId].ts"
)

echo "✅ Endpoint list created"
echo "Total to protect: $((${#CONTRACTOR_ENDPOINTS[@]} + ${#WA_MONITOR_ENDPOINTS[@]} + ${#PROJECT_ENDPOINTS[@]}))"
