# WA Agent - AI Expert Assistant for WhatsApp Monitor

**Created**: November 14, 2025
**Type**: Claude Code Specialized Agent
**Status**: ✅ Active
**Agent File**: `.agent-os/agents/wa-agent.md`

---

## Overview

WA Agent is a specialized AI assistant built into Claude Code with deep expertise in the entire WhatsApp Monitor (WA Monitor) system. It provides instant diagnostics, troubleshooting, data queries, and guidance without cluttering your main development context.

### What Problem Does It Solve?

**Before WA Agent:**
```
Developer: "Why is DR1234567 rejected?"
→ SSH to VPS
→ Check logs manually
→ Query database
→ Check validation tables
→ Compare with SharePoint
→ Debug configuration
→ 10-15 minutes of manual work
```

**With WA Agent:**
```
Developer: "Use WA agent to investigate why DR1234567 is rejected"
→ Agent does all the above autonomously
→ Returns diagnosis + solution
→ 30 seconds
```

---

## Key Benefits

### 🎯 Specialized Context
- **Focused Knowledge**: Only WA Monitor system expertise
- **No Distractions**: Won't try to help with unrelated features
- **Domain Expert**: Knows every component, service, and configuration

### ⚡ Fast Responses
- **Optimized Queries**: Pre-configured database queries
- **Direct Access**: Can SSH to VPS, query DB, read logs
- **Parallel Operations**: Checks multiple sources simultaneously

### 🔄 Reusable
- **Cross-Session**: Invoke anytime across development sessions
- **Consistent**: Same expert knowledge every time
- **Zero Setup**: Already configured and ready to use

### 💾 Saves Context
- **Separate Window**: Runs in its own context window
- **No Pollution**: Doesn't clutter main conversation
- **Efficient**: Returns only relevant findings

### 🛠️ Full Access
- **File System**: Can read any WA Monitor files
- **VPS Access**: SSH to check services and logs
- **Database**: Direct Neon PostgreSQL queries
- **Scripts**: Can run sync and diagnostic scripts

---

## Agent Capabilities

### 1. Diagnose Issues

**What it can do:**
- Check VPS service status (wa-monitor-prod, wa-monitor-dev, whatsapp-bridge)
- Analyze logs for errors and warnings
- Query database for data integrity issues
- Identify root causes of failures
- Verify configuration files

**Example:**
```
"Use WA agent to diagnose why Lawley drops stopped appearing"

Agent checks:
1. Service status → wa-monitor-prod is running ✅
2. Logs → No errors in last 1000 lines ✅
3. Database → Last Lawley drop: 2 hours ago ⚠️
4. WhatsApp Bridge → Group messages being captured ✅
5. Configuration → Lawley group_jid correct ✅

Diagnosis: Messages captured but not processed. Likely filter issue.
Solution: Check monitor.py line 245 - drop number regex pattern
```

### 2. Data Queries

**What it can do:**
- Daily drop counts by project
- Validation statistics (Mohadin)
- Rejection logs (invalid_drop_submissions)
- Historical trends and patterns
- LID resolution status

**Example:**
```
"Use WA agent to get drop counts for last 7 days"

Returns:
┌──────────┬────────┬────────┬──────────┬──────────┐
│   Date   │ Lawley │ Mohadin│ Velo Test│ Mamelodi │
├──────────┼────────┼────────┼──────────┼──────────┤
│ Nov 14   │   5    │   1    │    0     │    0     │
│ Nov 13   │   12   │   8    │    2     │    4     │
│ Nov 12   │   15   │   10   │    1     │    6     │
│ Nov 11   │   18   │   12   │    3     │    7     │
...
```

### 3. Troubleshooting

**What it can do:**
- Fix LID issues (resolve to phone numbers)
- Resolve validation problems (sync issues)
- Restart services safely (with Python cache clearing)
- Update YAML configurations
- Clear stale data

**Example:**
```
"Use WA agent to fix LID issues in last 24 hours"

Agent:
1. Queries database for LIDs (LENGTH(submitted_by) > 11)
2. Found 3 drops with LIDs:
   - DR1234567: LID_12345...
   - DR1234568: LID_67890...
   - DR1234569: LID_11111...
3. Looks up each LID in WhatsApp database
4. Updates qa_photo_reviews with phone numbers
5. Verifies updates

Fixed 3 drops. All now show phone numbers ✅
```

### 4. Guidance

**What it can do:**
- Provide step-by-step guides for adding groups
- Configure drop validation systems
- Sync SharePoint data with validation tables
- Navigate VPS infrastructure
- Explain architecture and data flow

**Example:**
```
"Use WA agent to guide me through adding Mamelodi Ext 2 group"

Agent provides:
1. Prerequisites checklist
2. Step-by-step DEV deployment
3. Testing verification steps
4. Production deployment commands
5. CLAUDE.md update instructions

Estimated time: 5 minutes
```

### 5. Code & Config Access

**What it can do:**
- Read Python monitor modules
- Check YAML project configurations
- Review database schema and tables
- Access all WA Monitor documentation
- Inspect log files

**Example:**
```
"Use WA agent to show me validation logic for Mohadin"

Agent reads:
1. /opt/wa-monitor/prod/modules/monitor.py (validation section)
2. config/projects.yaml (Mohadin config)
3. Database schema (valid_drop_numbers table)

Returns code snippets + explanation of validation flow
```

---

## How to Use WA Agent

### Basic Syntax

```
"Use WA agent to [task description]"
```

### Example Invocations

#### Quick Diagnostics
```bash
"Use WA agent to check today's drop counts"
"Use WA agent to verify all services are running"
"Use WA agent to check last 100 log lines for errors"
```

#### Investigation
```bash
"Use WA agent to investigate why DR1234567 is rejected"
"Use WA agent to find why Mohadin drops are not appearing"
"Use WA agent to check if validation is working correctly"
```

#### Service Management
```bash
"Use WA agent to restart production monitor safely"
"Use WA agent to compare prod and dev configs"
"Use WA agent to check WhatsApp bridge status"
```

#### Configuration Help
```bash
"Use WA agent to add a new WhatsApp group called Centurion"
"Use WA agent to enable validation for Lawley"
"Use WA agent to update Mohadin group JID"
```

#### Troubleshooting
```bash
"Use WA agent to fix LID issues in recent drops"
"Use WA agent to sync Mohadin validation data"
"Use WA agent to clear Python cache and restart"
```

#### Data Validation
```bash
"Use WA agent to check Mohadin validation data sync status"
"Use WA agent to verify drop DR1234567 is in valid list"
"Use WA agent to check rejection logs for last 24 hours"
```

---

## Agent Knowledge Base

### System Architecture

The agent understands:
- WhatsApp Bridge (Go service using whatsmeow)
- Drop Monitor services (Production + Development)
- Database schema (all tables and relationships)
- VPS infrastructure (72.60.17.245)
- Dashboard UI (/wa-monitor page)

### Services

**wa-monitor-prod**
- Location: /opt/wa-monitor/prod/
- Config: config/projects.yaml
- Logs: logs/wa-monitor-prod.log
- Restart: /opt/wa-monitor/prod/restart-monitor.sh (MUST use this!)

**wa-monitor-dev**
- Location: /opt/wa-monitor/dev/
- Config: config/projects.yaml
- Logs: logs/wa-monitor-dev.log
- Restart: systemctl restart wa-monitor-dev (regular restart OK)

**whatsapp-bridge**
- Location: /opt/velo-test-monitor/services/whatsapp-bridge/
- Database: store/messages.db (SQLite)
- Logs: /opt/velo-test-monitor/logs/whatsapp-bridge.log

### Database Tables

**qa_photo_reviews**
- Primary table for all drop submissions
- Uses `whatsapp_message_date` for daily counts (NOT `created_at`)
- Contains QA checklist fields (step_01 through step_12)

**valid_drop_numbers**
- Master list for validation (Mohadin only)
- Synced from SharePoint nightly
- 22,140 drops loaded (as of Nov 14, 2025)

**invalid_drop_submissions**
- Rejection log
- Tracks why drops were rejected
- Used for debugging validation issues

### Monitored Projects

| Project | Group JID | Validation | Status |
|---------|-----------|------------|--------|
| Lawley | 120363418298130331@g.us | Disabled | Active |
| Mohadin | 120363421532174586@g.us | ✅ Active | Active |
| Velo Test | 120363421664266245@g.us | Disabled | Active (Dual) |
| Mamelodi | 120363408849234743@g.us | Disabled | Active |

### Common Issues

**LID Resolution Bug**
- Problem: submitted_by shows LID instead of phone number
- Cause: Resubmission handler not resolving LIDs
- Fix: Manual database update + monitor restart with cache clear
- Prevention: Always use safe restart script

**Python Cache Issue**
- Problem: Code updates don't take effect
- Cause: Python caches .pyc bytecode files
- Fix: Use /opt/wa-monitor/prod/restart-monitor.sh (clears cache)
- Prevention: NEVER use `systemctl restart wa-monitor-prod` for production

**Validation Rejecting Valid Drops**
- Problem: Recently added drops rejected as invalid
- Cause: Stale validation data (sync not run)
- Fix: Run `node scripts/sync-mohadin-valid-drops.js`
- Prevention: Verify last sync time before investigating

### Documentation Access

The agent has full knowledge of:
- All files in `docs/wa-monitor/`
- CLAUDE.md (WA Monitor sections)
- Script files in `scripts/`
- VPS service configurations
- Database schema definitions

---

## What Makes WA Agent Different?

### vs. Manual Debugging

| Aspect | WA Agent | Manual Process |
|--------|----------|----------------|
| **Speed** | 30 seconds | 10-15 minutes |
| **Steps** | Single command | Multiple SSH sessions |
| **Context** | Complete system knowledge | Need to reference docs |
| **Accuracy** | Consistent checks | Depends on memory |
| **Logging** | Auto-documented | Manual notes |

### vs. Main Claude Code

| Aspect | WA Agent | Main Claude Code |
|--------|----------|------------------|
| **Scope** | WA Monitor only | Entire codebase |
| **Context** | Separate window | Shared conversation |
| **Optimization** | Domain-specific | General-purpose |
| **Invocation** | Explicit call | Always active |
| **Knowledge** | Pre-loaded expert | Learns as you go |

### vs. Documentation Search

| Aspect | WA Agent | Doc Search |
|--------|----------|------------|
| **Interactive** | Yes | No |
| **Executes Commands** | Yes | No |
| **Real-time Data** | Yes | No |
| **Contextual** | Understands your problem | Static information |
| **Actionable** | Provides solutions | Provides information |

---

## Example Sessions

### Session 1: Quick Health Check

**Developer:**
```
"Use WA agent to verify system health"
```

**Agent Response:**
```
✅ WA Monitor System Health Check - Nov 14, 2025 10:30 SAST

Services Status:
✅ wa-monitor-prod: Active (running 23h 45m)
✅ wa-monitor-dev: Active (running 23h 45m)
✅ whatsapp-bridge: Active (running 5d 12h)

Database Connectivity:
✅ Neon PostgreSQL: Connected
✅ Latest drop: 15 minutes ago (Lawley DR1734500)

Today's Activity:
- Lawley: 5 drops
- Mohadin: 1 drop
- Velo Test: 0 drops
- Mamelodi: 0 drops
Total: 6 drops

Validation System:
✅ Mohadin: 22,140 valid drops loaded
✅ Last sync: Nov 13, 8:00 PM SAST
✅ Rejections today: 0

Recent Errors:
✅ No errors in last 1000 log lines

System Status: HEALTHY ✅
```

### Session 2: Investigating Rejection

**Developer:**
```
"Use WA agent to investigate why DR1857500 was rejected"
```

**Agent Response:**
```
🔍 Investigation: DR1857500 Rejection

Rejection Record:
- Drop Number: DR1857500
- Project: Mohadin
- Submitted By: 27734107589
- Rejected At: 2025-11-14 08:45:23 UTC
- Reason: Drop number not in valid list

Validation Check:
❌ NOT FOUND in valid_drop_numbers table

Valid Drop Range (Mohadin):
- Minimum: DR1856517
- Maximum: DR1874110
- Count: 22,140 drops

Analysis:
DR1857500 is WITHIN the expected range (1856517-1874110) but:
- Not found in validation table
- Possible causes:
  1. Drop added to SharePoint after last sync (Nov 13, 8pm)
  2. Drop number typo in SharePoint
  3. Incomplete sync

Recommendation:
1. Check SharePoint for DR1857500 existence
2. If exists: Run sync script
   Command: node scripts/sync-mohadin-valid-drops.js
3. If not exists: Drop is genuinely invalid

Next Steps:
- Verify in SharePoint first
- If valid, re-sync will allow resubmission
- User will need to repost drop to WhatsApp group
```

### Session 3: Adding New Group

**Developer:**
```
"Use WA agent to help me add Centurion POP1 group"
```

**Agent Response:**
```
📋 Adding New WhatsApp Group: Centurion POP1

Prerequisites:
✅ WhatsApp bridge is in group? (064 041 2391)
⏳ Get Group JID

Step 1: Find Group JID
ssh root@72.60.17.245
tail -100 /opt/velo-test-monitor/logs/whatsapp-bridge.log | grep "Chat="
# Look for "Centurion" in output

Step 2: Test in DEV First
ssh root@72.60.17.245
nano /opt/wa-monitor/dev/config/projects.yaml

Add:
- name: Centurion POP1
  enabled: true
  group_jid: "PASTE_JID_HERE@g.us"
  description: "Centurion POP1 Activations"

Save and restart:
systemctl restart wa-monitor-dev
tail -f /opt/wa-monitor/dev/logs/wa-monitor-dev.log

Wait for: "Monitoring 'Centurion POP1' group..."

Step 3: Test Drop Submission
- Post test drop to Centurion WhatsApp group
- Verify appears in dev logs
- Check dashboard (dev will write to prod database)

Step 4: Deploy to Production
nano /opt/wa-monitor/prod/config/projects.yaml
# Add same YAML entry

/opt/wa-monitor/prod/restart-monitor.sh  # ⚠️ Use safe restart!
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log

Step 5: Update Documentation
Update CLAUDE.md → "Monitored Groups" section:
- **Centurion POP1**: PASTE_JID@g.us (Centurion POP1 Activations)

Estimated Time: 5 minutes
Any questions? I can walk through each step!
```

---

## When to Use WA Agent

### ✅ Use WA Agent For:

**Diagnostics**
- Quick system health checks
- Service status verification
- Log analysis for errors
- Database connectivity tests

**Investigation**
- Drop rejection troubleshooting
- Missing data debugging
- Validation issue diagnosis
- LID resolution problems

**Monitoring**
- Daily drop count queries
- Validation statistics
- Service uptime checks
- Recent error summaries

**Configuration**
- Adding new WhatsApp groups
- Enabling/disabling validation
- Updating group JIDs
- Reviewing YAML configs

**Maintenance**
- Safe service restarts
- Python cache clearing
- Validation data syncing
- Database cleanup

### ❌ Don't Use WA Agent For:

**Code Changes**
- Writing new features → Use main Claude Code
- Refactoring monitor code → Use main Claude Code
- Adding new tables → Use main Claude Code

**General Questions**
- Non-WA Monitor features → Ask main Claude Code
- Project architecture → Use main Claude Code
- Unrelated debugging → Use main Claude Code

**User Interactions**
- Tasks requiring user input → Main conversation
- Decision-making → Main conversation
- Multi-step approval processes → Main conversation

---

## Tips & Best Practices

### 1. Be Specific in Your Requests

**Bad:**
```
"Use WA agent to check things"
```

**Good:**
```
"Use WA agent to check today's drop counts and service status"
```

### 2. Let Agent Work Autonomously

Don't micromanage. The agent will:
- SSH to VPS automatically
- Query database as needed
- Read relevant logs
- Check configurations
- Return comprehensive findings

### 3. Use for Time-Sensitive Queries

Perfect for:
- "Quick, how many drops today?"
- "Is the service running?"
- "Why is this drop rejected?"

Not ideal for:
- Deep architectural discussions
- Multi-hour investigations
- Complex code refactoring

### 4. Combine with Main Claude Code

**Workflow:**
```
1. Use WA agent to diagnose issue
2. Agent identifies root cause
3. Use main Claude Code to implement fix
4. Use WA agent to verify fix worked
```

### 5. Reference Agent's Findings

Agent returns detailed findings. Use them:
```
Developer: "Use WA agent to check validation data"
Agent: "Mohadin: 22,140 drops, last sync Nov 13"

Developer: "Based on agent findings, let's sync now"
[Run sync script]

Developer: "Use WA agent to verify sync completed"
Agent: "Mohadin: 22,145 drops, last sync Nov 14 ✅"
```

---

## Troubleshooting

### Agent Not Responding?

**Check:**
1. Is agent definition file present? `.agent-os/agents/wa-agent.md`
2. Is syntax correct? `"Use WA agent to [task]"`
3. Is task WA Monitor related? (Agent won't respond to unrelated tasks)

### Agent Returns Incomplete Info?

**Try:**
- Be more specific in request
- Break complex queries into smaller tasks
- Ask follow-up questions

### Agent Can't Access VPS?

**Possible Issues:**
- SSH authentication failure (check credentials)
- VPS connectivity issue
- Firewall blocking connection

**Workaround:**
- Agent will still query database
- Agent will read local documentation
- Manual SSH verification needed

---

## Advanced Usage

### Chaining Multiple Queries

```
"Use WA agent to:
1. Check today's drop counts
2. Verify validation data is current
3. Check for any errors in last hour
4. Confirm all services are running"
```

Agent will process all tasks and return comprehensive report.

### Comparative Analysis

```
"Use WA agent to compare prod and dev configurations for Velo Test"
```

Agent reads both YAML files and highlights differences.

### Historical Trends

```
"Use WA agent to analyze Mohadin drop patterns over last 7 days"
```

Agent queries database for weekly statistics.

---

## Related Documentation

### Core WA Monitor Docs
- `README.md` - Module overview and architecture
- `WA_MONITOR_ARCHITECTURE_V2.md` - Detailed v2.0 architecture
- `WA_MONITOR_ADD_PROJECT_5MIN.md` - Quick project addition guide

### System-Specific Docs
- `DROP_VALIDATION_SYSTEM.md` - Complete validation system guide
- `VALIDATION_QUICK_REFERENCE.md` - Quick command reference
- `PYTHON_CACHE_ISSUE.md` - Safe restart procedures

### Troubleshooting Docs
- `LID_RESOLUTION_FIX.md` - LID resolution bug fix
- `RESUBMISSION_LID_BUG.md` - Resubmission handler issues
- `WA_MONITOR_DATA_FLOW_REPORT.md` - Data flow investigation

### Configuration Docs
- `WA_MONITOR_DATABASE_SETUP.md` - Database configuration
- `DATABASE_SEPARATION.md` - Database architecture
- `WA_MONITOR_SHAREPOINT_SYNC.md` - SharePoint integration

---

## Feedback & Improvements

### Current Limitations

1. **SSH Dependency**: Requires VPS access (can fail with auth issues)
2. **Read-Only**: Can diagnose but not fix (use main Claude Code for fixes)
3. **Context Boundary**: Strictly WA Monitor domain (won't help with other features)

### Future Enhancements

**Potential Additions:**
- Automated fix capabilities (restart services, sync data)
- Predictive analysis (detect issues before they occur)
- Performance monitoring (track response times, throughput)
- Integration with alerting systems

**Want to Suggest Improvements?**
- Document in this file
- Add to CLAUDE.md
- Share with development team

---

## Summary

**WA Agent** is your WhatsApp Monitor expert assistant, ready to:
- ⚡ Diagnose issues in seconds
- 🔍 Investigate problems autonomously
- 📊 Query data from multiple sources
- 🛠️ Guide through configurations
- ✅ Verify system health

**Invoke with:**
```
"Use WA agent to [your task]"
```

**Best for:**
- Quick diagnostics and status checks
- Drop submission investigations
- Service health monitoring
- Configuration guidance
- Data validation queries

**Documentation:**
- Agent Definition: `.agent-os/agents/wa-agent.md`
- Usage Guide: This file
- Main Context: `CLAUDE.md` (WA Agent section)

---

**Last Updated**: November 14, 2025
**Version**: 1.0
**Maintainer**: Development Team
