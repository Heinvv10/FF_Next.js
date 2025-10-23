#!/bin/bash
# Automated deployment script for Vercel
# Usage: ./vercel/scripts/deploy.sh "commit message"

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 FibreFlow Vercel Deployment Script${NC}"
echo "======================================"

# Check if commit message provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Commit message required${NC}"
    echo "Usage: ./vercel/scripts/deploy.sh \"your commit message\""
    exit 1
fi

COMMIT_MSG="$1"

echo -e "\n${YELLOW}Step 1: Type Check${NC}"
npm run type-check
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Type check failed. Fix errors before deploying.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Type check passed${NC}"

echo -e "\n${YELLOW}Step 2: Linting${NC}"
npm run lint
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Linting failed. Fix errors before deploying.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Linting passed${NC}"

echo -e "\n${YELLOW}Step 3: Build${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Fix errors before deploying.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

echo -e "\n${YELLOW}Step 4: Git Status${NC}"
git status --short

echo -e "\n${YELLOW}Step 5: Staging Changes${NC}"
read -p "Stage all changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    echo -e "${GREEN}✓ Changes staged${NC}"
else
    echo -e "${YELLOW}Please stage changes manually with: git add <files>${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 6: Commit${NC}"
git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Commit failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Committed successfully${NC}"

echo -e "\n${YELLOW}Step 7: Push to GitHub${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "Pushing to: origin/$CURRENT_BRANCH"

git push origin $CURRENT_BRANCH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Push failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Pushed to GitHub successfully${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment triggered!${NC}"
echo ""
echo "Next steps:"
echo "1. Check Vercel dashboard: https://vercel.com/velocityfibre/fibreflow-nextjs"
echo "2. Monitor build progress (usually 2-5 minutes)"
echo "3. Verify deployment at production URL"
echo "4. Test the changes you made"
echo ""
echo -e "${YELLOW}Commit hash: $(git rev-parse HEAD)${NC}"
