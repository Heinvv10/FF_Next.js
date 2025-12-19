#!/bin/bash
# PAI Git Hooks Setup Script for FF_Next.js
# Version: 1.0
# Created: 2025-12-18

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
CLAUDE_HOOKS_DIR="$PROJECT_ROOT/.claude/hooks"

echo "========================================="
echo "PAI Git Hooks Setup - FF_Next.js"
echo "========================================="
echo ""
echo "Project Root: $PROJECT_ROOT"
echo "Git Hooks Dir: $GIT_HOOKS_DIR"
echo "Claude Hooks Dir: $CLAUDE_HOOKS_DIR"
echo ""

# Check if .git directory exists
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ Error: Not a git repository!"
    echo "   Run: git init"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$GIT_HOOKS_DIR"

echo "📝 Installing git hooks..."
echo ""

# ============================================
# 1. Pre-Commit Hook
# ============================================
echo "1. Installing pre-commit hook..."

cat > "$GIT_HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
# PAI Pre-Commit Hook - FF_Next.js
# Runs quality checks before commit

set -e

echo "🔍 Running pre-commit checks..."

# Check 1: TypeScript type check
echo "  ✓ TypeScript type check..."
if ! npm run type-check > /dev/null 2>&1; then
    echo "❌ TypeScript errors found!"
    echo "   Run: npm run type-check"
    exit 1
fi

# Check 2: ESLint
echo "  ✓ ESLint check..."
if ! npm run lint > /dev/null 2>&1; then
    echo "❌ ESLint errors found!"
    echo "   Run: npm run lint"
    exit 1
fi

# Check 3: No console.log in production code
echo "  ✓ Checking for console.log..."
if grep -r "console.log" src/ --exclude-dir=node_modules | grep -v "console.error" | grep -q .; then
    echo "❌ console.log found in src/"
    echo "   Remove all console.log statements or use console.error for errors"
    grep -r "console.log" src/ --exclude-dir=node_modules | grep -v "console.error"
    exit 1
fi

# Check 4: Database endpoint validation
echo "  ✓ Checking database endpoint..."
if grep -r "ep-damp-credit-a857vku0" . --exclude-dir=node_modules --exclude-dir=.git | grep -q .; then
    echo "❌ Wrong database endpoint found!"
    echo "   Must use: ep-dry-night-a9qyh4sj"
    grep -r "ep-damp-credit-a857vku0" . --exclude-dir=node_modules --exclude-dir=.git
    exit 1
fi

# Check 5: WA Monitor isolation (if WA Monitor files changed)
echo "  ✓ Checking WA Monitor isolation..."
if git diff --cached --name-only | grep -q "src/modules/wa-monitor/"; then
    if grep -r "from '@/lib/" src/modules/wa-monitor/ | grep -v "node_modules" | grep -q .; then
        echo "❌ WA Monitor imports from main app (breaks isolation)!"
        echo "   Use internal imports: '../lib/...'"
        grep -r "from '@/lib/" src/modules/wa-monitor/ | grep -v "node_modules"
        exit 1
    fi
    if grep -r "from '@/services/" src/modules/wa-monitor/ | grep -v "node_modules" | grep -q .; then
        echo "❌ WA Monitor imports from main app (breaks isolation)!"
        echo "   Use internal imports: '../services/...'"
        grep -r "from '@/services/" src/modules/wa-monitor/ | grep -v "node_modules"
        exit 1
    fi
fi

echo "✅ All pre-commit checks passed!"
exit 0
EOF

chmod +x "$GIT_HOOKS_DIR/pre-commit"
echo "   ✅ pre-commit hook installed"

# ============================================
# 2. Commit-Msg Hook
# ============================================
echo "2. Installing commit-msg hook..."

cat > "$GIT_HOOKS_DIR/commit-msg" << 'EOF'
#!/bin/bash
# PAI Commit-Msg Hook - FF_Next.js
# Validates commit message format

set -e

COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Check for conventional commit format
# Format: type(scope): subject
# Examples:
#   feat: Add new feature
#   fix: Fix bug
#   docs: Update documentation
#   refactor: Refactor code
#   test: Add tests
#   chore: Update dependencies

if ! echo "$COMMIT_MSG" | grep -qE "^(feat|fix|docs|refactor|test|chore|style|perf|ci|build|revert)(\(.+\))?: .+"; then
    echo "❌ Invalid commit message format!"
    echo ""
    echo "Expected format:"
    echo "  type(scope): subject"
    echo ""
    echo "Examples:"
    echo "  feat: Add WA Monitor feedback feature"
    echo "  fix: Resolve database connection issue"
    echo "  docs: Update PAI setup guide"
    echo "  refactor: Extract logic to custom hook"
    echo ""
    echo "Types: feat, fix, docs, refactor, test, chore, style, perf, ci, build, revert"
    exit 1
fi

# Check for minimum message length
if [ ${#COMMIT_MSG} -lt 10 ]; then
    echo "❌ Commit message too short (minimum 10 characters)"
    exit 1
fi

exit 0
EOF

chmod +x "$GIT_HOOKS_DIR/commit-msg"
echo "   ✅ commit-msg hook installed"

# ============================================
# 3. Post-Commit Hook
# ============================================
echo "3. Installing post-commit hook..."

cat > "$GIT_HOOKS_DIR/post-commit" << 'EOF'
#!/bin/bash
# PAI Post-Commit Hook - FF_Next.js
# Logs commit for documentation tracking

set -e

COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Log to .claude/logs/commits.log
LOGS_DIR=".claude/logs"
mkdir -p "$LOGS_DIR"

echo "[$TIMESTAMP] $COMMIT_HASH - $COMMIT_MSG" >> "$LOGS_DIR/commits.log"

exit 0
EOF

chmod +x "$GIT_HOOKS_DIR/post-commit"
echo "   ✅ post-commit hook installed"

# ============================================
# 4. Pre-Push Hook
# ============================================
echo "4. Installing pre-push hook..."

cat > "$GIT_HOOKS_DIR/pre-push" << 'EOF'
#!/bin/bash
# PAI Pre-Push Hook - FF_Next.js
# Reminds about deployment workflow

set -e

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Check if pushing to master
if [ "$CURRENT_BRANCH" = "master" ]; then
    echo "⚠️  Pushing to master branch!"
    echo ""
    echo "Deployment Reminder:"
    echo "  1. Deploy to dev first: dev.fibreflow.app"
    echo "  2. Test thoroughly"
    echo "  3. Then deploy to production: app.fibreflow.app"
    echo ""
    echo "Deployment command (dev):"
    echo '  ssh louis@100.96.203.105 "cd /var/www/fibreflow-dev && git pull && npm ci && npm run build && pm2 restart fibreflow-dev"'
    echo ""
    echo "Continue? (y/n)"
    read -r REPLY
    if [ "$REPLY" != "y" ]; then
        echo "Push cancelled"
        exit 1
    fi
fi

exit 0
EOF

chmod +x "$GIT_HOOKS_DIR/pre-push"
echo "   ✅ pre-push hook installed"

# ============================================
# Summary
# ============================================
echo ""
echo "========================================="
echo "✅ Git Hooks Installation Complete!"
echo "========================================="
echo ""
echo "Installed hooks:"
echo "  ✓ pre-commit   - Quality checks (TypeScript, ESLint, console.log, DB endpoint, WA Monitor isolation)"
echo "  ✓ commit-msg   - Commit message format validation"
echo "  ✓ post-commit  - Commit logging for documentation"
echo "  ✓ pre-push     - Deployment workflow reminder"
echo ""
echo "Test hooks:"
echo "  git commit -m \"test: Test commit message\""
echo ""
echo "Disable hooks (if needed):"
echo "  git commit --no-verify"
echo ""
echo "Uninstall hooks:"
echo "  rm .git/hooks/pre-commit .git/hooks/commit-msg .git/hooks/post-commit .git/hooks/pre-push"
echo ""
