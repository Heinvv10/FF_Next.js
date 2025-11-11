# WhatsApp Architecture - Send Feedback Strategy

**Date Created:** November 11, 2025
**Last Updated:** November 11, 2025 (09:42 SAST)
**Status:** Production (@Mentions Fully Operational with Second Number)

---

## Current Architecture ✅ IMPLEMENTED

### Production Setup (As of Nov 11, 2025 - 09:42 SAST)

```
Phone Number 1: 064 041 2391
    ↓
whatsapp-bridge-prod (Port 8080)
    ├─→ LISTENS to groups (receives drop numbers)
    ├─→ Stores messages in SQLite
    └─→ SENDS simple group messages (fallback for manually added drops)

Phone Number 2: +27 71 155 8396 ⭐ NEW
    ↓
whatsapp-sender (Port 8081)
    └─→ SENDS feedback with @mentions (primary)

Monitor Services
    ├─→ wa-monitor-prod (scans 4 projects)
    └─→ wa-monitor-dev (scans 2 projects)

Next.js App (Port 3005)
    └─→ /api/wa-monitor-send-feedback (Smart Routing)
        ├─→ With sender info → http://localhost:8081/send-message (@mention)
        └─→ Without sender info → http://localhost:8080/api/send (group message)
```

**Services Running:**
- ✅ `whatsapp-bridge-prod` - Bridge with REST API (listens + fallback sending)
- ✅ `whatsapp-bridge-watchdog` - Auto-restart on crashes
- ✅ `wa-monitor-prod` - Drop number processing
- ✅ `whatsapp-sender` - **ACTIVE** - Sends @mentions from +27 71 155 8396

---

## Implementation Complete! ✅

### Dual WhatsApp Architecture (No Conflicts)
- **Two separate WhatsApp accounts** - no session conflicts
- **Bridge** (064 041 2391) - listens to groups only
- **Sender** (+27 71 155 8396) - sends feedback with @mentions
- **Each service** uses its own session database
- **No websocket conflicts** - stable operation

### What Works Now
- ✅ Drop number detection (all projects)
- ✅ **@Mentions to specific contractors** ⭐ NEW
- ✅ **Push notifications to individuals** ⭐ NEW
- ✅ Group messages (fallback for manually added drops)
- ✅ Database updates (feedback_sent timestamp)
- ✅ Smart routing based on sender info availability

### Implementation Date
**November 11, 2025 - 09:00-09:42 SAST**
- Linked +27 71 155 8396 using pairing code MKEB-ATW7
- Updated API with smart routing logic
- Fixed JID formatting for proper @mentions
- Tested and verified in Velo Test group

---

## The @Mention Problem (Technical Deep Dive)

### Why @Mentions Are Complex

**Simple Group Message (Works Now):**
```typescript
// API Call
{
  "recipient": "120363421664266245@g.us",
  "message": "DR1734150 - Upload complete!"
}

// WhatsApp Protobuf (Simple)
msg := &waProto.Message{
    Conversation: proto.String("DR1734150 - Upload complete!")
}
```

**@Mention in Group (Doesn't Work Yet):**
```typescript
// API Call (Needs Enhancement)
{
  "recipient": "120363421664266245@g.us",      // Group
  "mentioned_jid": "27715844472@s.whatsapp.net", // Who to tag
  "message": "DR1734150 - Upload complete!"
}

// WhatsApp Protobuf (Complex - Not Implemented in Bridge)
msg := &waProto.Message{
    ExtendedTextMessage: &waProto.ExtendedTextMessage{
        Text: proto.String("@27715844472 DR1734150 - Upload complete!"),
        ContextInfo: &waProto.ContextInfo{
            MentionedJID: []string{"27715844472@s.whatsapp.net"},
        },
    },
}
```

**Current Bridge API (main.go:274-280):**
```go
type SendMessageRequest struct {
    Recipient string `json:"recipient"`    // ✅ Supported
    Message   string `json:"message"`       // ✅ Supported
    MediaPath string `json:"media_path"`    // ✅ Supported
    // ❌ NO mention support
}
```

---

## Why We Stopped Using whatsapp-sender

### The Session Conflict Issue

**Problem (Nov 11, 8am-8:30am):**
```
Both services used SAME WhatsApp session database:
/opt/velo-test-monitor/services/whatsapp-bridge/store/whatsapp.db

whatsapp-bridge-prod (PID 1193263)
    └─→ Connected to 064 041 2391

whatsapp-sender (PID 1198013)
    └─→ ALSO connected to 064 041 2391  ← CONFLICT!

Result: Websocket crashed every 1-2 minutes
```

**Evidence from Logs:**
```
08:00:20 [Bridge] Websocket disconnect
08:00:25 [Sender] Websocket disconnect
08:01:15 [Bridge] Reconnect
08:01:18 [Sender] Failed to send: websocket not connected
08:02:30 [Bridge] Websocket disconnect  ← Constant cycle
```

**WhatsApp's Limitation:**
- Only **ONE active websocket** per account allowed
- Multiple connections = instant disconnections
- Messages lost during disconnect windows (DR9996543, DR1734150 missed)

**Solution Implemented:**
```bash
# Stopped conflicting services
systemctl stop whatsapp-sender
systemctl disable whatsapp-sender

# Updated API to use bridge instead
fetch('http://localhost:8080/api/send')  # Was: 8081
```

---

## Solution Options for @Mentions

### Option 1: Current State (Production) ✅

**Status:** Implemented
**Effort:** Done
**Cost:** Free

**What Works:**
- ✅ Group messages sent to all projects
- ✅ Stable (no session conflicts)
- ✅ Auto-recovery (watchdog)

**Limitations:**
- ❌ No @mentions
- ❌ No individual notifications

**Use Case:** Good enough for now, everyone in group sees messages

---

### Option 2: Enhance Bridge API (Code Solution)

**Status:** Not Started
**Effort:** 1-2 hours
**Cost:** Free

**Changes Needed:**

**1. Update Bridge API (main.go):**
```go
type SendMessageRequest struct {
    Recipient    string   `json:"recipient"`
    Message      string   `json:"message"`
    MediaPath    string   `json:"media_path"`
    MentionedJID []string `json:"mentioned_jid"`  // ← ADD THIS
}
```

**2. Update sendWhatsAppMessage function:**
```go
func sendWhatsAppMessage(client *whatsmeow.Client, recipient string, message string, mentions []string) {
    var msg *waProto.Message

    if len(mentions) > 0 {
        // Use ExtendedTextMessage with mentions
        msg = &waProto.Message{
            ExtendedTextMessage: &waProto.ExtendedTextMessage{
                Text: proto.String(message),
                ContextInfo: &waProto.ContextInfo{
                    MentionedJID: mentions,
                },
            },
        }
    } else {
        // Simple message
        msg = &waProto.Message{
            Conversation: proto.String(message),
        }
    }

    client.SendMessage(recipientJID, msg)
}
```

**3. Rebuild Bridge:**
```bash
cd /opt/velo-test-monitor/services/whatsapp-bridge
go build -o whatsapp-bridge main.go
systemctl restart whatsapp-bridge-prod
```

**4. Update Next.js API:**
```typescript
const requestBody = {
  recipient: groupJID,
  message: feedbackMessage,
  mentioned_jid: drop.submitted_by ? [drop.submitted_by] : []
};
```

**Pros:**
- ✅ No additional cost
- ✅ Single WhatsApp account
- ✅ Minimal complexity

**Cons:**
- ⏱️ Requires Go programming
- ⏱️ Testing needed
- ⏱️ Rebuild and redeploy

---

### Option 3: Second WhatsApp Number (RECOMMENDED) ⭐

**Status:** Ready to implement
**Effort:** 5 minutes
**Cost:** ~$5/month (prepaid SIM) or Free (virtual number)

**Architecture:**
```
Phone Number 1: 064 041 2391
    ↓
whatsapp-bridge-prod
    → ONLY listens to groups
    → Captures drop numbers
    → Stores in SQLite

Phone Number 2: [NEW NUMBER]
    ↓
whatsapp-sender
    → ONLY sends messages
    → Full @mention support
    → No conflicts with bridge
```

**Implementation Steps:**

**1. Get Second Number:**
- Cheap prepaid SIM (~R50/month)
- Virtual number (TextNow, Google Voice - check WhatsApp compatibility)
- WhatsApp Business API (official but expensive)

**2. Clear Sender Session (VPS):**
```bash
ssh root@72.60.17.245
rm /opt/whatsapp-sender/store/*.db
```

**3. Start Sender Service:**
```bash
systemctl start whatsapp-sender
# Service will generate pairing code
tail -20 /opt/whatsapp-sender/sender.log
# Look for: 🔑 PAIRING CODE: XXXX-XXXX
```

**4. Link WhatsApp:**
- Open WhatsApp on phone with new number
- Settings → Linked Devices → Link a Device
- Enter pairing code from logs

**5. Update Next.js API (revert to sender):**
```typescript
// Change back to:
fetch('http://localhost:8081/send-message', {
  body: JSON.stringify({
    group_jid: groupJID,
    recipient_jid: drop.submitted_by,
    message: feedbackMessage
  })
})
```

**6. Rebuild & Deploy:**
```bash
npm run build
# Deploy to VPS
```

**Pros:**
- ✅ **Simplest** - Use existing working code
- ✅ **Fastest** - 5 minutes vs 1-2 hours
- ✅ **Most Reliable** - Proven sender code
- ✅ **@Mentions work immediately**
- ✅ **No code changes** to sender
- ✅ **No session conflicts**

**Cons:**
- 💰 Small ongoing cost (~$5/month)
- 📱 Need to manage second number

---

## Comparison Matrix

| Feature | Current (Option 1) | Enhance Bridge (Option 2) | Second Number (Option 3) |
|---------|-------------------|---------------------------|--------------------------|
| **@Mentions** | ❌ No | ✅ Yes | ✅ Yes |
| **Session Conflicts** | ✅ None | ✅ None | ✅ None |
| **Code Changes** | ✅ None | ⚠️ Go + Next.js | ✅ Next.js only (revert) |
| **Setup Time** | ✅ Done | ⏱️ 1-2 hours | ✅ 5 minutes |
| **Cost** | ✅ Free | ✅ Free | 💰 ~$5/month |
| **Maintenance** | ✅ Low | ⚠️ Medium | ✅ Low |
| **Reliability** | ✅ High | ⚠️ Unknown | ✅ High (proven) |

---

## Production Endpoints

### Current API Endpoint
```
POST https://app.fibreflow.app/api/wa-monitor-send-feedback

Request Body:
{
  "dropId": "uuid",
  "message": "Custom feedback message"
}

Backend Call (Internal):
fetch('http://localhost:8080/api/send', {
  method: 'POST',
  body: JSON.stringify({
    recipient: "120363421664266245@g.us",
    message: "DR1234567 APPROVED\n\n[OK] House photo\n..."
  })
})
```

### Future with Second Number (Option 3)
```
POST https://app.fibreflow.app/api/wa-monitor-send-feedback

Backend Call:
fetch('http://localhost:8081/send-message', {
  method: 'POST',
  body: JSON.stringify({
    group_jid: "120363421664266245@g.us",
    recipient_jid: "27715844472@s.whatsapp.net",
    message: "DR1234567 - needs correction"
  })
})

WhatsApp Result:
"@27715844472 DR1234567 - needs correction"
```

---

## Service Management

### Check Status
```bash
ssh root@72.60.17.245

# Check all WA services
systemctl status whatsapp-bridge-prod wa-monitor-prod whatsapp-bridge-watchdog

# Check sender (currently stopped)
systemctl status whatsapp-sender
```

### View Logs
```bash
# Bridge logs
tail -f /opt/velo-test-monitor/logs/whatsapp-bridge.log

# Sender logs (when enabled)
tail -f /opt/whatsapp-sender/sender.log

# Monitor logs
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log

# Watchdog activity
tail -f /opt/velo-test-monitor/logs/bridge-watchdog.log
```

### Restart Services
```bash
# Restart bridge
systemctl restart whatsapp-bridge-prod

# Restart monitor
systemctl restart wa-monitor-prod

# Restart sender (when enabled)
systemctl restart whatsapp-sender
```

---

## Decision Log

### November 11, 2025 - Morning Issues

**Problem:**
- DR471349 (Mamelodi) missed at 16:48
- DR9996543 (Velo Test) missed at 08:05
- Send Feedback failing with 500 errors

**Investigation:**
- Bridge crashing every 5-10 minutes (WhatsApp server disconnects)
- Sender crashing every 1-2 minutes (session conflict with bridge)
- Both services fighting over same WhatsApp account

**Decision:**
- **Stopped** whatsapp-sender service (temporarily)
- **Updated** API to use bridge (port 8080)
- **Created** watchdogs for auto-recovery
- **Result**: Group messages work, @mentions disabled

**Trade-off Accepted (Temporary):**
- ✅ Stable message sending
- ❌ No @mentions (temporary)
- 🔄 Will implement Option 3 (second number) when SIM available

### November 11, 2025 - 09:42 SAST - @Mentions Restored! ✅

**Implementation Completed:**
- ✅ **Acquired second number** - +27 71 155 8396
- ✅ **Linked sender service** - Pairing code MKEB-ATW7
- ✅ **Updated API** - Smart routing (sender for @mentions, bridge for fallback)
- ✅ **Fixed JID formatting** - Proper @mention display
- ✅ **Tested and verified** - Working in Velo Test group

**Result:**
- ✅ @Mentions fully operational
- ✅ No session conflicts (separate phone numbers)
- ✅ Stable operation (both services running)
- ✅ Smart fallback for manually added drops

---

## Recommendations

### ⚠️ CRITICAL - Immediate Action Required
**Add +27 71 155 8396 to ALL WhatsApp groups:**
- ✅ Velo Test (Done - Nov 11, 2025)
- ⚠️ Lawley Activation 3 - **PENDING**
- ⚠️ Mohadin Activations - **PENDING**
- ⚠️ Mamelodi POP1 Activations - **PENDING**

**Why:** The sender number MUST be a member of each group to send messages. Without this, feedback will fail silently for those projects.

### Production Monitoring
- ✅ **Monitor sender service** - `systemctl status whatsapp-sender`
- ✅ **Check sender logs** - `tail -f /opt/whatsapp-sender/sender.log`
- ✅ **Monitor watchdog logs** - Ensure auto-recovery working
- ✅ **Verify both services running** - Bridge and Sender

### Long-term (Future Enhancement)
- 🔧 **Add sender redundancy** - Second sender for failover
- 🔧 **WhatsApp Business API** - Official enterprise solution
- 🔧 **Automated group membership check** - Alert if sender not in group

---

## Related Documentation

- [WA Monitor Data Flow Report](./WA_MONITOR_DATA_FLOW_REPORT.md)
- [Adding Projects (5 Min Guide)](./WA_MONITOR_ADD_PROJECT_5MIN.md)
- [WhatsApp Integration](./WA_MONITOR_WHATSAPP_INTEGRATION.md)
- [Feedback Deployment](./WA_MONITOR_FEEDBACK_DEPLOYMENT.md)

---

## Contact & Support

**For Issues:**

### Check Service Status
```bash
# Check all WA services
systemctl status whatsapp-bridge-prod whatsapp-sender wa-monitor-prod

# Individual services
systemctl status whatsapp-bridge-prod
systemctl status whatsapp-sender
```

### Check Logs
```bash
# Bridge logs
tail -100 /opt/velo-test-monitor/logs/whatsapp-bridge.log

# Sender logs (NEW)
tail -100 /opt/whatsapp-sender/sender.log

# Monitor logs
tail -100 /opt/wa-monitor/prod/logs/wa-monitor-prod.log
```

### Restart Services
```bash
# Restart bridge
systemctl restart whatsapp-bridge-prod

# Restart sender (NEW)
systemctl restart whatsapp-sender

# Restart monitor
systemctl restart wa-monitor-prod
```

### Test Endpoints
```bash
# Test bridge health
curl http://localhost:8080/health

# Test sender health (NEW)
curl http://localhost:8081/health
```

**For Adding Sender to New Groups:**
1. Open WhatsApp group
2. Add participant: **+27 71 155 8396**
3. Test Send Feedback from dashboard
4. Verify message appears with @mention

---

**End of Document**
