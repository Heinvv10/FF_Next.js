#!/bin/bash
# Constitutional Compliance Checker for Contractors Module

echo "🔍 Checking Constitutional Compliance"
echo "===================================="

VIOLATIONS=0
DATE=$(date +%Y-%m-%d)

echo "Files exceeding 300-line limit:"
while IFS= read -r line; do
    LINES=$(echo $line | awk '{print $1}')
    FILE=$(echo $line | awk '{print $2}')
    if [ "$LINES" -gt 300 ] && [[ $FILE == *"contractor"* ]]; then
        PERCENTAGE=$(( (LINES * 100 / 300) - 100 ))
        echo "❌ $FILE: $LINES lines ($PERCENTAGE% over limit)"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
done < <(find src -name "*contractor*" -type f | xargs wc -l 2>/dev/null | grep -v "total")

echo ""
echo "Components exceeding 200-line limit:"
while IFS= read -r line; do
    LINES=$(echo $line | awk '{print $1}')
    FILE=$(echo $line | awk '{print $2}')
    if [ "$LINES" -gt 200 ] && [[ $FILE == *"component"* ]] && [[ $FILE == *"contractor"* ]]; then
        PERCENTAGE=$(( (LINES * 100 / 200) - 100 ))
        echo "⚠️  $FILE: $LINES lines ($PERCENTAGE% over limit)"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
done < <(find src -name "*contractor*" -type f | xargs wc -l 2>/dev/null | grep -v "total")

echo ""
if [ $VIOLATIONS -eq 0 ]; then
    echo "✅ All files comply with constitutional limits"
    echo "{\"compliant\": true, \"violations\": 0, \"date\": \"$DATE\"}" > docs/contractors-implementation/metrics/constitutional-compliance.json
else
    echo "🔴 $VIOLATIONS constitutional violations found"
    echo "{\"compliant\": false, \"violations\": $VIOLATIONS, \"date\": \"$DATE\"}" > docs/contractors-implementation/metrics/constitutional-compliance.json
fi