#!/bin/bash
# contractors-metrics.sh - Automated progress metrics for contractors module
# Usage: ./contractors-metrics.sh [--json] [--save]

set -e

# Configuration
OUTPUT_JSON=false
SAVE_OUTPUT=false
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
METRICS_DIR="docs/contractors-implementation/metrics"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      OUTPUT_JSON=true
      shift
      ;;
    --save)
      SAVE_OUTPUT=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--json] [--save]"
      exit 1
      ;;
  esac
done

# Colors for output (only if not JSON)
if [ "$OUTPUT_JSON" = false ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    BOLD='\033[1m'
    NC='\033[0m' # No Color
fi

# Ensure metrics directory exists
mkdir -p "$METRICS_DIR"

# Function to output metrics
output_metric() {
    local key=$1
    local value=$2
    local status=$3
    
    if [ "$OUTPUT_JSON" = true ]; then
        echo "\"$key\": {\"value\": \"$value\", \"status\": \"$status\"},"
    else
        case $status in
            "pass")
                echo -e "  ${GREEN}✅ $key: $value${NC}"
                ;;
            "fail")
                echo -e "  ${RED}❌ $key: $value${NC}"
                ;;
            "warning")
                echo -e "  ${YELLOW}⚠️ $key: $value${NC}"
                ;;
            *)
                echo -e "  📊 $key: $value"
                ;;
        esac
    fi
}

# Function to calculate constitutional compliance
calculate_compliance() {
    local violations=$1
    local total=$2
    
    if [ $total -eq 0 ]; then
        echo "0"
        return
    fi
    
    local compliance=$((100 * (total - violations) / total))
    echo "$compliance"
}

# Start JSON output if requested
if [ "$OUTPUT_JSON" = true ]; then
    echo "{"
    echo "\"timestamp\": \"$TIMESTAMP\","
    echo "\"metrics\": {"
fi

# Header for regular output
if [ "$OUTPUT_JSON" = false ]; then
    echo -e "${BLUE}${BOLD}🏗️ Contractors Module Implementation Metrics${NC}"
    echo -e "${BLUE}${BOLD}==============================================${NC}"
    echo "Generated: $TIMESTAMP"
    echo ""
fi

# ===== CONSTITUTIONAL COMPLIANCE METRICS =====
if [ "$OUTPUT_JSON" = false ]; then
    echo -e "${BLUE}${BOLD}📏 CONSTITUTIONAL COMPLIANCE${NC}"
    echo "----------------------------"
fi

# File size violations
violations=$(find src/modules/contractors -name "*.tsx" -o -name "*.ts" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 300 {count++} END {print count+0}')
total_files=$(find src/modules/contractors -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
compliance_rate=$(calculate_compliance $violations $total_files)

if [ $violations -eq 0 ]; then
    status="pass"
else
    status="fail"
fi
output_metric "Files over 300 lines" "$violations" "$status"
output_metric "Total files" "$total_files" "info"
output_metric "File compliance rate" "${compliance_rate}%" "info"

# Component size violations
comp_violations=$(find src/modules/contractors/components -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 200 {count++} END {print count+0}')
total_components=$(find src/modules/contractors/components -name "*.tsx" 2>/dev/null | wc -l)
comp_compliance_rate=$(calculate_compliance $comp_violations $total_components)

if [ $comp_violations -eq 0 ]; then
    comp_status="pass"
else
    comp_status="fail"
fi
output_metric "Components over 200 lines" "$comp_violations" "$comp_status"
output_metric "Total components" "$total_components" "info"
output_metric "Component compliance rate" "${comp_compliance_rate}%" "info"

# Hook extraction progress
hook_files=$(find src/modules/contractors -name "use*.ts" -o -name "use*.tsx" 2>/dev/null | wc -l)
output_metric "Custom hooks created" "$hook_files" "info"

if [ "$OUTPUT_JSON" = false ]; then
    echo ""
fi

# ===== ARCHITECTURE METRICS =====
if [ "$OUTPUT_JSON" = false ]; then
    echo -e "${BLUE}${BOLD}🏗️ ARCHITECTURE METRICS${NC}"
    echo "----------------------"
fi

# Service organization
service_files=$(find src/modules/contractors/services -name "*.ts" 2>/dev/null | wc -l)
output_metric "Service files in module" "$service_files" "info"

# Type organization  
type_files=$(find src/modules/contractors/types -name "*.ts" 2>/dev/null | wc -l)
output_metric "Type files in module" "$type_files" "info"

# Utility files
util_files=$(find src/modules/contractors/utils -name "*.ts" 2>/dev/null | wc -l)
output_metric "Utility files" "$util_files" "info"

if [ "$OUTPUT_JSON" = false ]; then
    echo ""
fi

# ===== QUALITY METRICS =====
if [ "$OUTPUT_JSON" = false ]; then
    echo -e "${BLUE}${BOLD}🔧 QUALITY METRICS${NC}"
    echo "------------------"
fi

# TypeScript status
if npm run type-check > /dev/null 2>&1; then
    ts_status="pass"
    ts_result="PASS"
else
    ts_status="fail"
    ts_result="FAIL"
fi
output_metric "TypeScript" "$ts_result" "$ts_status"

# ESLint status
if npm run lint > /dev/null 2>&1; then
    lint_status="pass"
    lint_result="PASS"
else
    lint_status="fail" 
    lint_result="FAIL"
fi
output_metric "ESLint" "$lint_result" "$lint_status"

# Build status
if timeout 120s npm run build > /dev/null 2>&1; then
    build_status="pass"
    build_result="PASS"
else
    build_status="fail"
    build_result="FAIL"
fi
output_metric "Build" "$build_result" "$build_status"

# Test status (if test command is available)
if npm test -- --passWithNoTests > /dev/null 2>&1; then
    test_status="pass"
    test_result="PASS"
else
    test_status="warning"
    test_result="NEEDS SETUP"
fi
output_metric "Tests" "$test_result" "$test_status"

if [ "$OUTPUT_JSON" = false ]; then
    echo ""
fi

# ===== PROGRESS TRACKING =====
if [ "$OUTPUT_JSON" = false ]; then
    echo -e "${BLUE}${BOLD}📊 PROGRESS TRACKING${NC}"
    echo "-------------------"
fi

# Overall constitutional progress (weighted average)
overall_progress=$(( (compliance_rate * 60 + comp_compliance_rate * 40) / 100 ))
output_metric "Constitutional progress" "${overall_progress}%" "info"

# Git activity metrics
commits_this_week=$(git log --since="1 week ago" --oneline 2>/dev/null | wc -l)
output_metric "Commits this week" "$commits_this_week" "info"

files_modified=$(git diff --name-only HEAD~7 2>/dev/null | grep "src/modules/contractors" 2>/dev/null | wc -l)
output_metric "Contractor files modified" "$files_modified" "info"

# Week calculation (assuming start date of 2025-12-28)
start_date="2025-12-28"
current_date=$(date +%Y-%m-%d)
days_since_start=$(( ($(date -d "$current_date" +%s) - $(date -d "$start_date" +%s)) / 86400 ))
week_number=$(( days_since_start / 7 + 1 ))

if [ $days_since_start -lt 0 ]; then
    week_number=0
fi

output_metric "Implementation week" "$week_number of 8" "info"

if [ "$OUTPUT_JSON" = false ]; then
    echo ""
fi

# ===== RISK ASSESSMENT =====
if [ "$OUTPUT_JSON" = false ]; then
    echo -e "${BLUE}${BOLD}⚠️ RISK ASSESSMENT${NC}"
    echo "------------------"
    
    if [ $violations -gt 5 ]; then
        echo -e "${RED}🔴 HIGH RISK: $violations files still violate constitution${NC}"
        risk_level="HIGH"
    elif [ $violations -gt 2 ]; then
        echo -e "${YELLOW}🟡 MEDIUM RISK: $violations files still violate constitution${NC}"
        risk_level="MEDIUM"
    elif [ $violations -eq 0 ] && [ $comp_violations -eq 0 ]; then
        echo -e "${GREEN}✅ LOW RISK: Full constitutional compliance achieved${NC}"
        risk_level="LOW"
    else
        echo -e "🟢 ON TRACK: Only $violations files + $comp_violations components remaining"
        risk_level="ON_TRACK"
    fi
    
    echo ""
else
    # Add risk level to JSON
    if [ $violations -gt 5 ]; then
        risk_level="HIGH"
    elif [ $violations -gt 2 ]; then
        risk_level="MEDIUM"
    elif [ $violations -eq 0 ] && [ $comp_violations -eq 0 ]; then
        risk_level="LOW"
    else
        risk_level="ON_TRACK"
    fi
    output_metric "risk_level" "$risk_level" "info"
fi

# ===== DETAILED VIOLATIONS (only for non-JSON) =====
if [ "$OUTPUT_JSON" = false ] && [ $violations -gt 0 ]; then
    echo -e "${YELLOW}📋 FILES REQUIRING ATTENTION${NC}"
    echo "=============================="
    echo "Files over 300 lines:"
    find src/modules/contractors -name "*.tsx" -o -name "*.ts" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 300 {printf "  🔴 %-50s (%s lines)\n", $2, $1}' | sort -k3 -nr
    echo ""
fi

if [ "$OUTPUT_JSON" = false ] && [ $comp_violations -gt 0 ]; then
    echo "Components over 200 lines:"
    find src/modules/contractors/components -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 200 {printf "  🟡 %-50s (%s lines)\n", $2, $1}' | sort -k3 -nr
    echo ""
fi

# Close JSON output
if [ "$OUTPUT_JSON" = true ]; then
    # Remove trailing comma and close JSON
    echo "\"risk_level\": \"$risk_level\""
    echo "},"
    echo "\"summary\": {"
    echo "\"constitutional_compliance\": $compliance_rate,"
    echo "\"component_compliance\": $comp_compliance_rate,"
    echo "\"overall_progress\": $overall_progress,"
    echo "\"week\": $week_number,"
    echo "\"violations\": $violations,"
    echo "\"component_violations\": $comp_violations"
    echo "}"
    echo "}"
fi

# Save output if requested
if [ "$SAVE_OUTPUT" = true ]; then
    output_file="$METRICS_DIR/metrics-$(date +%Y%m%d-%H%M%S)"
    
    if [ "$OUTPUT_JSON" = true ]; then
        output_file="${output_file}.json"
    else
        output_file="${output_file}.txt"
    fi
    
    # Re-run this script and save to file
    if [ "$OUTPUT_JSON" = true ]; then
        $0 --json > "$output_file"
    else
        $0 > "$output_file"
    fi
    
    echo "Metrics saved to: $output_file"
fi

# Final summary for regular output
if [ "$OUTPUT_JSON" = false ]; then
    echo -e "${BLUE}${BOLD}=============================================${NC}"
    echo -e "${BOLD}Summary: Week $week_number - ${overall_progress}% Complete - Risk Level: $risk_level${NC}"
fi