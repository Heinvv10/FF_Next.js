#!/bin/bash
# quick-status.sh - Quick progress status check
# Usage: ./quick-status.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}⚡ Quick Contractors Status Check${NC}"
echo "================================"

# Constitutional compliance
violations=$(find src/modules/contractors -name "*.tsx" -o -name "*.ts" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 300 {count++} END {print count+0}')
comp_violations=$(find src/modules/contractors/components -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 200 {count++} END {print count+0}')

if [ $violations -eq 0 ] && [ $comp_violations -eq 0 ]; then
    echo -e "${GREEN}✅ COMPLIANT${NC} - All files within constitution limits"
elif [ $violations -le 2 ] && [ $comp_violations -le 3 ]; then
    echo -e "${YELLOW}🟡 NEARLY COMPLIANT${NC} - $violations large files, $comp_violations large components"
else
    echo -e "${RED}🔴 NON-COMPLIANT${NC} - $violations large files, $comp_violations large components"
fi

# Quality gates
quality_status="✅"
if ! npm run type-check > /dev/null 2>&1; then
    quality_status="❌"
fi
if ! npm run lint > /dev/null 2>&1; then
    quality_status="❌"
fi

echo -e "Quality Gates: $quality_status"

# Progress estimate
total_files=$(find src/modules/contractors -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
if [ $total_files -gt 0 ]; then
    compliance_rate=$(( (total_files - violations) * 100 / total_files ))
    echo -e "Progress: ${compliance_rate}% constitutional compliance"
else
    echo -e "Progress: Unable to calculate"
fi

# Implementation week
start_date="2025-12-28"
current_date=$(date +%Y-%m-%d)
days_since_start=$(( ($(date -d "$current_date" +%s) - $(date -d "$start_date" +%s)) / 86400 ))
week_number=$(( days_since_start / 7 + 1 ))

if [ $days_since_start -lt 0 ]; then
    echo -e "Status: ${YELLOW}Pre-implementation${NC} (Start: $start_date)"
else
    echo -e "Status: Week $week_number of 8 implementation"
fi