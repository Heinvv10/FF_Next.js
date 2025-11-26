# WA Monitor Troubleshooting Guide

## 🔴 CRITICAL: "Failed to send WhatsApp message - Not connected to WhatsApp"

**Last Occurred:** November 26, 2025
**Time to Fix:** ~2 hours of debugging
**Severity:** HIGH - Completely breaks feedback sending feature

### Symptoms

**User sees:**
- Error when clicking "Send Feedback" button
- Message: "Failed to send feedback: Failed to send WhatsApp message"
- Browser console shows: `POST /api/wa-monitor-send-feedback 500 (Internal Server Error)`

**API Response:**
```json
{
  "success": false,
  "error": {
    "message": "Failed to send WhatsApp message",
    "details": "WhatsApp Bridge API error: HTTP 500 - {\"success\":false,\"message\":\"Not connected to WhatsApp\"}"
  }
}
```

**What Users Experience:**
- Can view drops and daily stats (these work fine)
- Can generate feedback text (frontend works)
- **Cannot send feedback to WhatsApp** (API fails)
- Error appears for ALL users, not just one

### Root Cause

The **WhatsApp Bridge service** (port 8080) has **disconnected from WhatsApp**.

**Why this happens:**
- Network interruption on VPS
- WhatsApp Bridge websocket timeout
- Service restart without reconnection
- Long idle periods (rare)

### Quick Fix (5 minutes)

**Step 1: Verify the issue**
```bash
ssh root@72.60.17.245
tail -50 /opt/velo-test-monitor/logs/whatsapp-bridge.log | grep -i "not connected"
```

**If you see:** `Message sent false Not connected to WhatsApp`

**Step 2: Restart WhatsApp Bridge**
```bash
systemctl restart whatsapp-bridge-prod
```

**Step 3: Verify reconnection (wait 10 seconds)**
```bash
tail -30 /opt/velo-test-monitor/logs/whatsapp-bridge.log
```

**Look for:**
```
✓ Connected to WhatsApp! Type 'help' for commands.
Starting REST API server on :8080...
```

**Step 4: Test it works**
```bash
curl -s -X POST http://localhost:8080/api/send \
  -H 'Content-Type: application/json' \
  -d '{"recipient":"120363421664266245@g.us","message":"Test - bridge reconnected"}'
```

**Expected response:**
```json
{"success":true,"message":"Message sent to 120363421664266245@g.us"}
```

### Diagnostic Commands

**Check if WhatsApp Bridge is running:**
```bash
systemctl status whatsapp-bridge-prod
```

**Check connection status in logs:**
```bash
tail -100 /opt/velo-test-monitor/logs/whatsapp-bridge.log | grep -E "Connect|Disconnect|Not connected"
```

**Check if service is responding:**
```bash
curl http://localhost:8080/api/status
```

**Check service memory/uptime:**
```bash
systemctl status whatsapp-bridge-prod --no-pager
```

### Prevention

**Watchdog service is active:**
The VPS has `whatsapp-bridge-watchdog.service` that auto-restarts on websocket failures.

**To check watchdog status:**
```bash
systemctl status whatsapp-bridge-watchdog
```

**However:** Sometimes the bridge disconnects without triggering the watchdog. Manual restart is needed.

### Common Mistakes During Debugging

❌ **Wrong diagnosis:** "It's a network timeout issue"
- **Why wrong:** Network was fine (ping worked, other APIs worked)
- **What it was:** WhatsApp Bridge disconnected from WhatsApp servers

❌ **Wrong diagnosis:** "It's a user cache issue"
- **Why wrong:** Incognito mode also failed
- **What it was:** Server-side WhatsApp Bridge disconnection

❌ **Wrong diagnosis:** "It's slow South African connection"
- **Why wrong:** Other users in SA worked fine
- **What it was:** WhatsApp Bridge was down for ALL users

### How to Tell If This Is Your Issue

**Quick checklist:**

1. ✅ **Other APIs work?** (wa-monitor-daily-drops, wa-monitor-drops)
   - If YES → Problem is specific to sending, not general network

2. ✅ **All users affected?** (not just one)
   - If YES → Server-side issue, not client-side cache

3. ✅ **Incognito mode also fails?**
   - If YES → Not a browser cache problem

4. ✅ **Error message mentions "Not connected to WhatsApp"?**
   - If YES → **This is your issue!** Restart WhatsApp Bridge.

### Related Issues

**Issue:** Feedback timeouts for South African users
- **Fix:** API timeout increased to 60 seconds
- **File:** `pages/api/wa-monitor-send-feedback.ts`
- **Commit:** `8ddb34e` (Nov 26, 2025)

**Issue:** WhatsApp Sender vs Bridge confusion
- **Bridge (8080):** Receives WhatsApp messages, stores in DB
- **Sender (8081):** Sends WhatsApp messages with @mentions
- **Both needed:** Sender uses Bridge's connection to WhatsApp

### Files Involved

- **WhatsApp Bridge Service:** `/etc/systemd/system/whatsapp-bridge-prod.service`
- **Bridge Binary:** `/opt/velo-test-monitor/services/whatsapp-bridge/whatsapp-bridge`
- **Bridge Logs:** `/opt/velo-test-monitor/logs/whatsapp-bridge.log`
- **API Endpoint:** `/pages/api/wa-monitor-send-feedback.ts`
- **Frontend:** `/src/modules/wa-monitor/components/QaReviewCard.tsx`

### VPS Connection

```bash
# Quick access
ssh root@72.60.17.245

# Or with password in command
sshpass -p 'VeloF@2025@@' ssh -o StrictHostKeyChecking=no root@72.60.17.245
```

### Monitoring

**Add to monitoring dashboard:**
- Check WhatsApp Bridge connection status every 5 minutes
- Alert if "Not connected to WhatsApp" appears in logs
- Auto-restart if disconnected for >2 minutes

### Keywords for Search

Search these terms to find this doc quickly:
- "Not connected to WhatsApp"
- "Failed to send WhatsApp message"
- "WhatsApp Bridge disconnected"
- "Feedback sending fails"
- "500 error send feedback"
- "wa-monitor-send-feedback 500"
