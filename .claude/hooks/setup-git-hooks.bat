@echo off
REM PAI Git Hooks Setup Script for FF_Next.js (Windows)
REM Version: 1.0
REM Created: 2025-12-18

setlocal enabledelayedexpansion

echo =========================================
echo PAI Git Hooks Setup - FF_Next.js
echo =========================================
echo.

REM Check if .git directory exists
if not exist ".git\" (
    echo Error: Not a git repository!
    echo    Run: git init
    exit /b 1
)

REM Create hooks directory if it doesn't exist
if not exist ".git\hooks\" mkdir ".git\hooks"

echo Installing git hooks...
echo.

REM ============================================
REM 1. Pre-Commit Hook
REM ============================================
echo 1. Installing pre-commit hook...

(
echo #!/bin/bash
echo # PAI Pre-Commit Hook - FF_Next.js
echo # Runs quality checks before commit
echo.
echo set -e
echo.
echo echo "Running pre-commit checks..."
echo.
echo # Check 1: TypeScript type check
echo echo "  Checking TypeScript..."
echo if ! npm run type-check ^> /dev/null 2^>^&1; then
echo     echo "TypeScript errors found!"
echo     echo "   Run: npm run type-check"
echo     exit 1
echo fi
echo.
echo # Check 2: ESLint
echo echo "  Checking ESLint..."
echo if ! npm run lint ^> /dev/null 2^>^&1; then
echo     echo "ESLint errors found!"
echo     echo "   Run: npm run lint"
echo     exit 1
echo fi
echo.
echo # Check 3: No console.log
echo echo "  Checking for console.log..."
echo if grep -r "console.log" src/ --exclude-dir=node_modules ^| grep -v "console.error" ^| grep -q .; then
echo     echo "console.log found in src/"
echo     echo "   Remove all console.log statements"
echo     exit 1
echo fi
echo.
echo # Check 4: Database endpoint validation
echo echo "  Checking database endpoint..."
echo if grep -r "ep-damp-credit-a857vku0" . --exclude-dir=node_modules --exclude-dir=.git ^| grep -q .; then
echo     echo "Wrong database endpoint found!"
echo     echo "   Must use: ep-dry-night-a9qyh4sj"
echo     exit 1
echo fi
echo.
echo # Check 5: WA Monitor isolation
echo echo "  Checking WA Monitor isolation..."
echo if git diff --cached --name-only ^| grep -q "src/modules/wa-monitor/"; then
echo     if grep -r "from '@/lib/" src/modules/wa-monitor/ ^| grep -v "node_modules" ^| grep -q .; then
echo         echo "WA Monitor imports from main app (breaks isolation)!"
echo         echo "   Use internal imports: '../lib/...'"
echo         exit 1
echo     fi
echo fi
echo.
echo echo "All pre-commit checks passed!"
echo exit 0
) > ".git\hooks\pre-commit"

echo    pre-commit hook installed
echo.

REM ============================================
REM 2. Commit-Msg Hook
REM ============================================
echo 2. Installing commit-msg hook...

(
echo #!/bin/bash
echo # PAI Commit-Msg Hook - FF_Next.js
echo # Validates commit message format
echo.
echo set -e
echo.
echo COMMIT_MSG_FILE="$1"
echo COMMIT_MSG=^$^(cat "$COMMIT_MSG_FILE"^)
echo.
echo if ! echo "$COMMIT_MSG" ^| grep -qE "ˆ(feat^|fix^|docs^|refactor^|test^|chore^|style^|perf^|ci^|build^|revert)(\\(.+\\))?: .+"; then
echo     echo "Invalid commit message format!"
echo     echo ""
echo     echo "Expected format:"
echo     echo "  type(scope): subject"
echo     echo ""
echo     echo "Examples:"
echo     echo "  feat: Add WA Monitor feedback feature"
echo     echo "  fix: Resolve database connection issue"
echo     echo "  docs: Update PAI setup guide"
echo     exit 1
echo fi
echo.
echo if [ ${#COMMIT_MSG} -lt 10 ]; then
echo     echo "Commit message too short (minimum 10 characters)"
echo     exit 1
echo fi
echo.
echo exit 0
) > ".git\hooks\commit-msg"

echo    commit-msg hook installed
echo.

REM ============================================
REM 3. Post-Commit Hook
REM ============================================
echo 3. Installing post-commit hook...

(
echo #!/bin/bash
echo # PAI Post-Commit Hook - FF_Next.js
echo # Logs commit for documentation tracking
echo.
echo set -e
echo.
echo COMMIT_HASH=^$^(git rev-parse --short HEAD^)
echo COMMIT_MSG=^$^(git log -1 --pretty=%%B^)
echo TIMESTAMP=^$^(date "+%%Y-%%m-%%d %%H:%%M:%%S"^)
echo.
echo LOGS_DIR=".claude/logs"
echo mkdir -p "$LOGS_DIR"
echo.
echo echo "[$TIMESTAMP] $COMMIT_HASH - $COMMIT_MSG" ^>^> "$LOGS_DIR/commits.log"
echo.
echo exit 0
) > ".git\hooks\post-commit"

echo    post-commit hook installed
echo.

REM ============================================
REM 4. Pre-Push Hook
REM ============================================
echo 4. Installing pre-push hook...

(
echo #!/bin/bash
echo # PAI Pre-Push Hook - FF_Next.js
echo # Reminds about deployment workflow
echo.
echo set -e
echo.
echo CURRENT_BRANCH=^$^(git rev-parse --abbrev-ref HEAD^)
echo.
echo if [ "$CURRENT_BRANCH" = "master" ]; then
echo     echo "Pushing to master branch!"
echo     echo ""
echo     echo "Deployment Reminder:"
echo     echo "  1. Deploy to dev first: dev.fibreflow.app"
echo     echo "  2. Test thoroughly"
echo     echo "  3. Then deploy to production: app.fibreflow.app"
echo     echo ""
echo     echo "Continue? (y/n)"
echo     read -r REPLY
echo     if [ "$REPLY" != "y" ]; then
echo         echo "Push cancelled"
echo         exit 1
echo     fi
echo fi
echo.
echo exit 0
) > ".git\hooks\pre-push"

echo    pre-push hook installed
echo.

REM ============================================
REM Summary
REM ============================================
echo =========================================
echo Git Hooks Installation Complete!
echo =========================================
echo.
echo Installed hooks:
echo   pre-commit   - Quality checks
echo   commit-msg   - Message format validation
echo   post-commit  - Commit logging
echo   pre-push     - Deployment reminder
echo.
echo Test hooks:
echo   git commit -m "test: Test commit message"
echo.
echo Disable hooks (if needed):
echo   git commit --no-verify
echo.

endlocal
