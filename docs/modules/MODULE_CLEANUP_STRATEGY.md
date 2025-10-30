# Module Cleanup Strategy - Ensuring Fresh Starts

**Date**: October 30, 2025
**Purpose**: Prevent old code pollution when building new modules

---

## The Problem

When rewriting modules, old code can:
1. **Conflict with new code** (Pages Router vs App Router)
2. **Get accidentally imported** (old services mixed with new)
3. **Confuse developers** (which version is current?)
4. **Bloat the codebase** (unused files)

---

## Strategy: Archive Before Building

### Step 1: Identify All Old Module Files

```bash
# Find all files related to the module
find . -path ./node_modules -prune -o -iname "*contractor*" -type f -print

# Common locations:
- pages/contractors/
- pages/api/contractors/
- src/modules/contractors/
- src/services/contractor/
- src/components/**/contractor*/
- src/types/contractor/
```

### Step 2: Archive (Don't Delete)

Create timestamped archive:
```bash
# Create archive directory
mkdir -p ../FF_React_Archive/contractors-pre-rewrite-2025-10-30/

# Move old code
mv src/modules/contractors ../FF_React_Archive/contractors-pre-rewrite-2025-10-30/modules/
mv src/services/contractor ../FF_React_Archive/contractors-pre-rewrite-2025-10-30/services/
mv src/types/contractor ../FF_React_Archive/contractors-pre-rewrite-2025-10-30/types/
mv pages/contractors ../FF_React_Archive/contractors-pre-rewrite-2025-10-30/pages/
mv pages/api/contractors ../FF_React_Archive/contractors-pre-rewrite-2025-10-30/pages-api/

# Keep git history
git add -A
git commit -m "archive: move old contractors module before rewrite"
```

### Step 3: Build Fresh

```bash
# Now build new module in clean slate
mkdir -p app/contractors
mkdir -p app/api/contractors
mkdir -p src/types
mkdir -p src/components/contractors

# Build from scratch following new architecture
```

---

## For Future Modules (RAG, Teams, Documents, Onboarding)

### Before Starting ANY New Module:

#### 1. **Check for Existing Code**
```bash
# Example: Before building RAG module
find . -path ./node_modules -prune -o -iname "*rag*" -type f -print
find . -path ./node_modules -prune -o -iname "*scoring*" -type f -print
```

#### 2. **Archive Existing Code**
```bash
# Create dated archive
mkdir -p ../FF_React_Archive/rag-pre-separation-$(date +%Y-%m-%d)/

# Move all related files
mv src/services/contractor/ragScoringService.ts ../FF_React_Archive/rag-pre-separation-$(date +%Y-%m-%d)/
mv src/modules/contractors/components/RAGDashboard.tsx ../FF_React_Archive/rag-pre-separation-$(date +%Y-%m-%d)/

# Commit archive
git commit -m "archive: preserve old RAG code before module separation"
```

#### 3. **Build Fresh Module**
```
src/modules/rag/
├── types/rag.types.ts          # Fresh types
├── services/ragService.ts      # Fresh service
├── components/                 # Fresh components
└── hooks/                      # Fresh hooks

app/api/rag/
└── route.ts                    # Fresh API
```

---

## Verification Checklist

Before considering a module "done", verify no old code remains:

###  1. Import Check
```bash
# Search for old imports in new code
grep -r "from.*contractor/old" app/
grep -r "import.*modules/contractors" app/

# Should return ZERO results
```

### ✅ 2. File Conflicts Check
```bash
# Build should succeed
npm run build

# Should have NO conflicts like:
# "Conflicting app and page files were found"
```

### ✅ 3. Unused Exports Check
```bash
# Use VS Code or grep to find unused exports
# Example: Old service still exported but not used
grep -r "contractorCrudService" src/
```

### ✅ 4. Type Pollution Check
```bash
# Make sure not importing old types
grep -r "@/types/contractor/" app/ | grep -v "core.types"

# Only contractor.core.types should be imported
```

---

## Git Strategy for Clean Rewrites

### Option A: Archive in Separate Repo (Recommended)
```bash
# Clone to archive repo
../FF_React_Archive/

# Move old code there
mv old-module ../FF_React_Archive/old-module-YYYY-MM-DD/

# Keep main repo clean
```

### Option B: Git Branches (If needed for comparison)
```bash
# Create archive branch
git checkout -b archive/contractors-old-2025-10-30
git add -A
git commit -m "archive: old contractors before rewrite"

# Return to main
git checkout main

# Delete old files
rm -rf pages/contractors src/modules/contractors

# Build fresh
git checkout -b feature/contractors-rewrite
```

### Option C: Just Rely on Git History (Simplest)
```bash
# Delete old files
rm -rf pages/contractors

# Commit deletion
git commit -m "remove: old contractors module (backed up in git history)"

# Build fresh
# If you need old code: git checkout <old-commit> -- path/to/file
```

---

## Current Contractors Rewrite Status

### ✅ Archived/Removed:
- `pages/contractors/` → Deleted (backed up in git)
- `pages/api/contractors/` → Deleted (backed up in git)
- Old types remain in `src/types/contractor/` but won't conflict

### ✅ New Clean Code:
- `app/contractors/` → Fresh App Router pages
- `app/api/contractors/` → Fresh API routes
- `src/types/contractor.core.types.ts` → Fresh minimal types
- `src/components/contractors/` → Fresh components

### ⚠️ To Clean Later:
```bash
# These old files can be archived when ready:
src/modules/contractors/     # Old complex components
src/services/contractor/     # Old service layers
src/types/contractor/        # Old bloated types (keep .core.types.ts)
```

---

## Commands for Clean Module Starts

### Template: Starting Fresh Module

```bash
#!/bin/bash
# fresh-module-start.sh

MODULE_NAME=$1  # e.g., "rag", "teams", "documents"
DATE=$(date +%Y-%m-%d)

echo "Starting fresh $MODULE_NAME module..."

# 1. Find existing code
echo "Searching for existing $MODULE_NAME files..."
find . -path ./node_modules -prune -o -iname "*$MODULE_NAME*" -type f -print > /tmp/${MODULE_NAME}-files.txt

# 2. Archive if found
if [ -s /tmp/${MODULE_NAME}-files.txt ]; then
    echo "Found existing files. Archiving..."
    mkdir -p ../FF_React_Archive/${MODULE_NAME}-pre-rewrite-${DATE}/

    while read file; do
        # Copy to archive
        mkdir -p "../FF_React_Archive/${MODULE_NAME}-pre-rewrite-${DATE}/$(dirname $file)"
        cp "$file" "../FF_React_Archive/${MODULE_NAME}-pre-rewrite-${DATE}/$file"
    done < /tmp/${MODULE_NAME}-files.txt

    echo "Archived $(wc -l < /tmp/${MODULE_NAME}-files.txt) files"
fi

# 3. Create fresh structure
mkdir -p app/$MODULE_NAME
mkdir -p app/api/$MODULE_NAME
mkdir -p src/modules/$MODULE_NAME
mkdir -p src/types
mkdir -p src/components/$MODULE_NAME

echo "✅ Fresh $MODULE_NAME module structure ready!"
echo "📁 Old files archived to: ../FF_React_Archive/${MODULE_NAME}-pre-rewrite-${DATE}/"
```

Usage:
```bash
./fresh-module-start.sh rag
./fresh-module-start.sh teams
./fresh-module-start.sh documents
```

---

## Best Practices

### ✅ DO:
1. Archive before deleting
2. Use dated archive directories
3. Commit archival as separate commit
4. Build fresh from documented plan
5. Verify no old imports in new code
6. Use new type files with clear names (.core.types.ts, .new.ts)

### ❌ DON'T:
1. Mix old and new code
2. Import from old services "temporarily"
3. Copy-paste old code into new files
4. Leave old files "just in case"
5. Forget to update imports
6. Skip the archive step

---

## Recovery Plan (If Needed)

### Scenario: New module has issues, need old code temporarily

```bash
# Option 1: From archive directory
cp -r ../FF_React_Archive/module-old/path/to/file .

# Option 2: From git history
git log --all --full-history -- path/to/old/file
git checkout <commit-hash> -- path/to/old/file

# Option 3: From archive branch
git checkout archive/module-old-2025-10-30 -- path/to/file
```

---

**Status**: ✅ Strategy documented
**Next Module**: RAG (follow this process)
**Estimated Archive Time**: 5-10 minutes per module
