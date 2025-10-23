# /status - Show Project Status

Display comprehensive project status across all tracking systems.

## Usage

```
/status
```

## What It Shows

1. **Recent Work** (from CHANGELOG.md)
   - Last 3 entries
   - Latest deployment info

2. **Active Issues** (from page-logs/)
   - Open issues across all pages
   - Recently resolved issues

3. **Project Progress** (from PROGRESS.md)
   - Phase completion status
   - Overall progress percentage

4. **Git Status**
   - Current branch
   - Uncommitted changes
   - Recent commits (last 5)

5. **Vercel Status**
   - Latest deployment status
   - Production URL
   - Build status

6. **Local Server**
   - Check if running on port 3005
   - Health check status

---

## Prompt

You are showing the user a comprehensive project status.

**Execute these checks in parallel:**

1. **Read `docs/CHANGELOG.md`**
   - Extract last 3 entries
   - Show date, type, title, and deployment status

2. **Read page logs**
   - List `docs/page-logs/*.md` files
   - Count total issues
   - Show recently updated pages

3. **Read `docs/PROGRESS.md`**
   - Show phase completion
   - Calculate overall percentage

4. **Run git commands**:
   ```bash
   git branch --show-current
   git status --short
   git log --oneline -5
   ```

5. **Check local server**:
   ```bash
   curl -s http://localhost:3005/api/health || echo "Not running"
   ```

6. **Show Vercel info**:
   - Link to dashboard
   - Remind about recent deployment

**Format the output** as a clean, organized status report:

```
📊 FibreFlow Project Status
=========================

📅 Recent Work (Last 3 Entries)
  1. 2025-10-22 [Fix]: Contractors Approval ✅ Deployed
  2. [Previous entries...]

🐛 Active Issues
  - contractors.md: 3 issues (all resolved)
  - dashboard.md: 1 issue (in progress)
  Total: 4 issues across 2 pages

📈 Project Progress
  Phase 1: Core Architecture     ✅ Complete
  Phase 2: Data Layer            ✅ Complete
  [...]
  Overall: 100% (6/6 phases)

🔧 Git Status
  Branch: master
  Uncommitted: 3 files modified
  Recent commits:
    - 2f70370 Fix Contractors Applications
    - b2b77ad SOW import functionality
    [...]

🚀 Vercel Status
  Dashboard: https://vercel.com/velocityfibre/fibreflow-nextjs
  Latest: Deployed 2 hours ago
  Status: Ready ✅

💻 Local Server
  Port 3005: Running ✅
  Health: OK

⏰ Last Updated: [current time]
```

**Be concise**: Show only the most relevant information. Use emojis for visual clarity.
