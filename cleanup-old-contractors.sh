#!/bin/bash
# Cleanup old contractors code - Run AFTER verifying new code works
# Date: October 30, 2025

echo "🧹 Cleaning up old contractors code..."

# Create archive directory
ARCHIVE_DIR="../FF_React_Archive/contractors-old-2025-10-30"
mkdir -p "$ARCHIVE_DIR"

echo "📦 Archiving old code to: $ARCHIVE_DIR"

# Archive old modules (40+ component files)
if [ -d "src/modules/contractors" ]; then
    echo "  - Archiving src/modules/contractors/"
    cp -r src/modules/contractors "$ARCHIVE_DIR/"
    rm -rf src/modules/contractors
    echo "    ✅ Removed src/modules/contractors/"
fi

# Archive old services (10+ service files)
if [ -d "src/services/contractor" ]; then
    echo "  - Archiving src/services/contractor/"
    cp -r src/services/contractor "$ARCHIVE_DIR/"
    rm -rf src/services/contractor
    echo "    ✅ Removed src/services/contractor/"
fi

# Archive old types
if [ -d "src/types/contractor" ]; then
    echo "  - Archiving src/types/contractor/ (keeping contractor.core.types.ts)"
    cp -r src/types/contractor "$ARCHIVE_DIR/"
    rm -rf src/types/contractor
    echo "    ✅ Removed src/types/contractor/"
fi

# Archive old API workarounds
if [ -f "pages/api/contractors-delete.ts" ]; then
    echo "  - Archiving workaround API routes"
    mkdir -p "$ARCHIVE_DIR/pages-api"
    cp pages/api/contractors-delete.ts "$ARCHIVE_DIR/pages-api/"
    cp pages/api/migrate-contractors-columns.ts "$ARCHIVE_DIR/pages-api/" 2>/dev/null
    cp pages/api/test-contractors-migration.ts "$ARCHIVE_DIR/pages-api/" 2>/dev/null
    rm -f pages/api/contractors-delete.ts
    rm -f pages/api/migrate-contractors-columns.ts
    rm -f pages/api/test-contractors-migration.ts
    echo "    ✅ Removed old API workarounds"
fi

echo ""
echo "✅ Cleanup complete!"
echo "📁 Old code archived to: $ARCHIVE_DIR"
echo ""
echo "🔍 Verify new code still works:"
echo "   npm run build"
echo "   PORT=3005 npm start"
echo ""
echo "💡 To restore old code (if needed):"
echo "   cp -r $ARCHIVE_DIR/* ."
