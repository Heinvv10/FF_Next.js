#!/bin/bash
# daily-progress.sh - Automated daily progress capture
# Usage: ./daily-progress.sh

set -e

# Configuration
DATE=$(date +%Y-%m-%d)
DAY_NUMBER=$(( ($(date +%s) - $(date -d "2025-12-28" +%s)) / 86400 + 1 ))
LOG_DIR="docs/contractors-implementation/daily-logs"
LOG_FILE="$LOG_DIR/day-$(printf "%02d" $DAY_NUMBER)-$DATE.md"
TEMPLATE_FILE="docs/contractors-implementation/templates/daily-log-template.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Daily Progress Log Generator${NC}"
echo -e "${BLUE}================================${NC}"
echo "Date: $DATE"
echo "Day: $DAY_NUMBER"
echo ""

# Ensure directories exist
mkdir -p "$LOG_DIR"
mkdir -p "docs/contractors-implementation/commit-metrics"

# Create daily log from template if it doesn't exist
if [ ! -f "$LOG_FILE" ]; then
    if [ -f "$TEMPLATE_FILE" ]; then
        cp "$TEMPLATE_FILE" "$LOG_FILE"
        # Replace placeholders with actual values
        sed -i "s/\[Date\]/$DATE/g" "$LOG_FILE"
        sed -i "s/\[X\]/$DAY_NUMBER/g" "$LOG_FILE"
        echo -e "${GREEN}✅ Created daily log: $LOG_FILE${NC}"
    else
        echo -e "${RED}❌ Template file not found: $TEMPLATE_FILE${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}📝 Daily log already exists: $LOG_FILE${NC}"
fi

echo ""
echo -e "${BLUE}📊 Capturing Automated Metrics...${NC}"

# Prepare metrics section
METRICS_FILE="docs/contractors-implementation/commit-metrics/metrics-$DATE.txt"

{
    echo "## 📊 Auto-Captured Metrics"
    echo "**Timestamp**: $(date)"
    echo ""
    
    # File count metrics
    echo "### File Structure Metrics"
    
    total_ts_files=$(find src/modules/contractors -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
    echo "**Total TypeScript Files**: $total_ts_files"
    
    large_files=$(find src/modules/contractors -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 300' | wc -l)
    echo "**Files Over 300 Lines**: $large_files"
    
    large_components=$(find src/modules/contractors/components -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 200' | wc -l)
    echo "**Components Over 200 Lines**: $large_components"
    
    hook_files=$(find src/modules/contractors -name "use*.ts" -o -name "use*.tsx" 2>/dev/null | wc -l)
    echo "**Custom Hooks**: $hook_files"
    
    service_files=$(find src/modules/contractors/services -name "*.ts" 2>/dev/null | wc -l)
    echo "**Service Files**: $service_files"
    
    echo ""
    
    # Git metrics
    echo "### Git Activity Metrics"
    
    commits_today=$(git log --since="1 day ago" --oneline 2>/dev/null | wc -l)
    echo "**Commits Today**: $commits_today"
    
    files_changed_today=$(git diff --name-only HEAD~1 2>/dev/null | wc -l)
    echo "**Files Changed Today**: $files_changed_today"
    
    contractor_files_changed=$(git diff --name-only HEAD~1 2>/dev/null | grep "src/modules/contractors" | wc -l)
    echo "**Contractor Files Modified**: $contractor_files_changed"
    
    echo ""
    
    # Quality metrics
    echo "### Quality Gate Status"
    
    # TypeScript check
    echo -n "**TypeScript Status**: "
    if npm run type-check > /dev/null 2>&1; then
        echo "✅ Pass"
    else
        echo "❌ Fail"
    fi
    
    # Lint check
    echo -n "**Lint Status**: "
    if npm run lint > /dev/null 2>&1; then
        echo "✅ Pass"
    else
        echo "❌ Fail"
    fi
    
    # Build check
    echo -n "**Build Status**: "
    if npm run build > /dev/null 2>&1; then
        echo "✅ Pass"
    else
        echo "❌ Fail"
    fi
    
    echo ""
    
    # Progress calculation
    echo "### Progress Metrics"
    
    # Constitutional compliance progress
    total_files=$(find src/modules/contractors -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
    if [ $total_files -gt 0 ]; then
        compliance_rate=$(( (total_files - large_files) * 100 / total_files ))
        echo "**Constitutional Compliance**: ${compliance_rate}%"
    else
        echo "**Constitutional Compliance**: N/A"
    fi
    
    # Component compliance progress
    total_components=$(find src/modules/contractors/components -name "*.tsx" 2>/dev/null | wc -l)
    if [ $total_components -gt 0 ]; then
        component_compliance=$(( (total_components - large_components) * 100 / total_components ))
        echo "**Component Compliance**: ${component_compliance}%"
    else
        echo "**Component Compliance**: N/A"
    fi
    
    # Estimated overall progress (rough calculation)
    overall_progress=$(( (compliance_rate + component_compliance) / 2 ))
    echo "**Estimated Overall Progress**: ${overall_progress}%"
    
} > "$METRICS_FILE"

# Append metrics to daily log
echo "" >> "$LOG_FILE"
cat "$METRICS_FILE" >> "$LOG_FILE"

echo -e "${GREEN}✅ Metrics captured and added to daily log${NC}"

# Constitutional compliance check
echo ""
echo -e "${BLUE}📏 Constitutional Compliance Check${NC}"
echo "================================="

if [ $large_files -eq 0 ] && [ $large_components -eq 0 ]; then
    echo -e "${GREEN}✅ COMPLIANT: All files and components within size limits${NC}"
elif [ $large_files -le 2 ] && [ $large_components -le 3 ]; then
    echo -e "${YELLOW}🟡 NEAR COMPLIANT: $large_files large files, $large_components large components remaining${NC}"
else
    echo -e "${RED}🔴 NON-COMPLIANT: $large_files large files, $large_components large components${NC}"
    
    # Show the violating files
    echo ""
    echo "Files over 300 lines:"
    find src/modules/contractors -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 300 {print "  " $2 " (" $1 " lines)"}' | sort -k3 -nr
    
    echo ""
    echo "Components over 200 lines:"
    find src/modules/contractors/components -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 200 {print "  " $2 " (" $1 " lines)"}' | sort -k3 -nr
fi

echo ""
echo -e "${BLUE}📝 Next Steps${NC}"
echo "============="
echo "1. Edit your daily log: $LOG_FILE"
echo "2. Add your completed tasks and time spent"
echo "3. Update blocked items and next day priorities"
echo "4. Run quality checks if needed:"
echo "   - npm run type-check"
echo "   - npm run lint" 
echo "   - npm run build"

# Open the daily log in the editor if available
if command -v code > /dev/null; then
    echo ""
    echo -e "${GREEN}Opening daily log in VS Code...${NC}"
    code "$LOG_FILE"
elif command -v nano > /dev/null; then
    echo ""
    echo -e "${GREEN}Opening daily log in nano...${NC}"
    nano "$LOG_FILE"
else
    echo ""
    echo "Daily log location: $LOG_FILE"
fi

echo ""
echo -e "${GREEN}🎉 Daily progress logging complete!${NC}"