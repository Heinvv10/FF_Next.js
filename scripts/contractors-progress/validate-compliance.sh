#!/bin/bash
# File: scripts/contractors-progress/validate-compliance.sh
# Constitutional compliance checker for contractors module

echo "🔍 Contractors Module Constitutional Compliance Check"
echo "==================================================="
echo "Date: $(date)"
echo ""

VIOLATIONS=0
TOTAL_FILES=0

# Check file size limits
echo "📏 File Size Compliance Check:"
echo "==============================="

while IFS= read -r -d '' file; do
    ((TOTAL_FILES++))
    lines=$(wc -l < "$file")
    filename=$(basename "$file")
    if [ "$lines" -gt 300 ]; then
        echo "❌ $filename: $lines lines (exceeds 300-line limit)"
        ((VIOLATIONS++))
    else
        echo "✅ $filename: $lines lines"
    fi
done < <(find src/modules/contractors -name "*.tsx" -type f -print0 | sort -z)

echo ""
echo "📊 File Size Summary:"
COMPLIANT=$((TOTAL_FILES - VIOLATIONS))
COMPLIANCE_RATE=$(echo "scale=1; ($COMPLIANT * 100) / $TOTAL_FILES" | bc -l)
echo "  - Total Files: $TOTAL_FILES"
echo "  - Compliant: $COMPLIANT"  
echo "  - Violations: $VIOLATIONS"
echo "  - Compliance Rate: ${COMPLIANCE_RATE}%"

# Check TypeScript compliance
echo ""
echo "🔧 TypeScript Compliance Check:"
echo "==============================="
cd /home/louisdup/VF/Apps/FF_React
if npm run type-check --silent 2>/dev/null; then
    echo "✅ TypeScript: No errors found"
else
    echo "❌ TypeScript: Type errors detected"
    ((VIOLATIONS++))
fi

# Check basic build
echo ""
echo "🏗️ Build Compliance Check:"
echo "=========================="
if npm run build --silent 2>/dev/null; then
    echo "✅ Build: Successful"
else
    echo "❌ Build: Failed"
    ((VIOLATIONS++))
fi

# Summary
echo ""
echo "📊 Constitutional Compliance Summary:"
echo "===================================="
echo "Total Violations: $VIOLATIONS"

if [ "$VIOLATIONS" -eq 0 ]; then
    echo "🎉 FULL CONSTITUTIONAL COMPLIANCE ACHIEVED!"
    echo "   All files under 300 lines ✅"
    echo "   No TypeScript errors ✅"
    echo "   Build successful ✅"
    exit 0
else
    echo "⚠️  CONSTITUTIONAL VIOLATIONS DETECTED"
    if [ "$VIOLATIONS" -gt 5 ]; then
        echo "   🔴 CRITICAL: $VIOLATIONS violations require immediate action"
    elif [ "$VIOLATIONS" -gt 2 ]; then
        echo "   🟡 HIGH: $VIOLATIONS violations need attention"
    else
        echo "   🟡 MEDIUM: $VIOLATIONS violations to resolve"
    fi
    
    echo ""
    echo "📋 Recommended Actions:"
    if [ "$VIOLATIONS" -gt 0 ]; then
        echo "   1. Focus on largest file size violations first"
        echo "   2. Extract business logic to custom hooks"
        echo "   3. Split components into smaller, focused units"
        echo "   4. Run validation after each refactoring"
    fi
    
    exit 1
fi