#!/bin/bash

# Contractors Implementation Progress Tracker
# Usage: ./contractors-progress.sh [command]

CONTRACTORS_DIR="src/modules/contractors"
LOG_DIR="docs/contractors-implementation"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M:%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
check_file_sizes() {
    echo -e "${BLUE}📊 Checking Constitutional Compliance${NC}"
    echo "=================================="
    
    # Find files over 300 lines
    VIOLATIONS=$(find $CONTRACTORS_DIR -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 300 {print $2 ": " $1 " lines"}')
    VIOLATION_COUNT=$(echo "$VIOLATIONS" | wc -l)
    
    if [ -z "$VIOLATIONS" ]; then
        echo -e "${GREEN}✅ All files comply with 300-line limit!${NC}"
        return 0
    else
        echo -e "${RED}❌ Files exceeding 300-line limit: $VIOLATION_COUNT${NC}"
        echo "$VIOLATIONS"
        return 1
    fi
}

check_component_sizes() {
    echo -e "${BLUE}🧩 Checking Component Sizes${NC}"
    echo "============================"
    
    # Find components over 200 lines
    COMPONENT_VIOLATIONS=$(find $CONTRACTORS_DIR/components -name "*.tsx" | xargs wc -l | awk '$1 > 200 {print $2 ": " $1 " lines"}')
    
    if [ -z "$COMPONENT_VIOLATIONS" ]; then
        echo -e "${GREEN}✅ All components under 200-line limit!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Components over 200 lines:${NC}"
        echo "$COMPONENT_VIOLATIONS"
        return 1
    fi
}

generate_metrics() {
    echo -e "${BLUE}📈 Generating Current Metrics${NC}"
    echo "============================="
    
    # File counts
    TOTAL_FILES=$(find $CONTRACTORS_DIR -name "*.ts" -o -name "*.tsx" | wc -l)
    COMPONENT_FILES=$(find $CONTRACTORS_DIR/components -name "*.tsx" | wc -l)
    SERVICE_FILES=$(find $CONTRACTORS_DIR -path "*/services/*" -name "*.ts" | wc -l)
    HOOK_FILES=$(find $CONTRACTORS_DIR -path "*/hooks/*" -name "*.ts" | wc -l)
    
    # Size violations
    FILES_OVER_300=$(find $CONTRACTORS_DIR -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 300' | wc -l)
    COMPONENTS_OVER_200=$(find $CONTRACTORS_DIR/components -name "*.tsx" | xargs wc -l | awk '$1 > 200' | wc -l)
    
    echo "📁 Total TypeScript Files: $TOTAL_FILES"
    echo "🧩 Component Files: $COMPONENT_FILES"
    echo "⚙️  Service Files: $SERVICE_FILES"  
    echo "🎣 Hook Files: $HOOK_FILES"
    echo "🔴 Files Over 300 Lines: $FILES_OVER_300"
    echo "🟡 Components Over 200 Lines: $COMPONENTS_OVER_200"
}

run_quality_checks() {
    echo -e "${BLUE}🔍 Running Quality Checks${NC}"
    echo "========================="
    
    # Type checking
    echo -n "TypeScript: "
    if npm run type-check > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Pass${NC}"
    else
        echo -e "${RED}❌ Fail${NC}"
    fi
    
    # Linting
    echo -n "ESLint: "
    if npm run lint $CONTRACTORS_DIR > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Pass${NC}"
    else
        echo -e "${RED}❌ Fail${NC}"
    fi
    
    # Build check
    echo -n "Build: "
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Pass${NC}"
    else
        echo -e "${RED}❌ Fail${NC}"
    fi
}

log_daily_progress() {
    local day_num=$1
    local log_file="$LOG_DIR/daily-logs/day-$day_num-$DATE.md"
    
    echo -e "${BLUE}📝 Creating Daily Log: $log_file${NC}"
    
    mkdir -p "$LOG_DIR/daily-logs"
    
    cat > "$log_file" << EOF
# Day $day_num Progress Log - $DATE

## 🎯 Daily Objectives
- [ ] [Add objectives here]

## ✅ Completed Tasks

### [Task Name]
- **Time Spent**: X hours
- **Status**: 🟡 In Progress
- **Files Modified**: 
- **Validation Results**:
  - Type Check: ⏳ Pending
  - Lint: ⏳ Pending
  - Build: ⏳ Pending
  - Manual Test: ⏳ Pending

## 📊 Daily Metrics (Auto-Generated)
**Timestamp**: $DATE $TIME

$(generate_metrics)

## 🚫 Blocked Items
*[None currently]*

## 🔄 Next Day Priorities
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

---
**Total Time Today**: X hours
**Cumulative Progress**: X% complete
EOF

    echo "Log created: $log_file"
}

show_dashboard() {
    echo -e "${BLUE}🎛️  Contractors Implementation Dashboard${NC}"
    echo "========================================"
    echo "Date: $DATE $TIME"
    echo ""
    
    generate_metrics
    echo ""
    check_file_sizes
    echo ""
    check_component_sizes
    echo ""
    run_quality_checks
}

# Main command handling
case "$1" in
    "check")
        check_file_sizes
        check_component_sizes
        ;;
    "metrics")
        generate_metrics
        ;;
    "quality")
        run_quality_checks
        ;;
    "log")
        if [ -z "$2" ]; then
            echo "Usage: $0 log [day_number]"
            exit 1
        fi
        log_daily_progress "$2"
        ;;
    "dashboard")
        show_dashboard
        ;;
    *)
        echo "Contractors Implementation Progress Tracker"
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  check      - Check constitutional compliance"
        echo "  metrics    - Generate current metrics"
        echo "  quality    - Run quality checks"
        echo "  log [day]  - Create daily progress log"
        echo "  dashboard  - Show complete dashboard"
        echo ""
        echo "Examples:"
        echo "  $0 dashboard"
        echo "  $0 log 1"
        echo "  $0 check"
        ;;
esac