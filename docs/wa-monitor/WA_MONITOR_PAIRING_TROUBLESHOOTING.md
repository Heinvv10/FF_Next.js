# WhatsApp Monitor - Phone Number Pairing Troubleshooting
**Date**: November 7, 2025
**Phone Number**: +27 72 766 5862
**Issue**: Pairing codes fail, but WhatsApp Web works

## Investigation Summary

### Current Problem
- New WhatsApp number (+27 72 766 5862) successfully added to monitoring groups
- WhatsApp Web browser linking works perfectly
- whatsmeow bridge pairing codes generate but fail to connect
- QR code pairing times out after ~60 seconds

### Root Cause Analysis

**Primary Issue**: `WHATSAPP_PHONE_NUMBER` environment variable is empty in `.env` file, causing the bridge to default to QR code pairing which times out.

**Secondary Issues**:
1. **WhatsApp Rate Limiting** - Native protocol has stricter limits than web
2. **Session Conflicts** - Old session data may interfere with new pairing
3. **Format Issues** - Phone number format must be exact
4. **Device Limits** - WhatsApp allows max 5 linked devices

## System Architecture

### WhatsApp Bridge Location
- **Local Development**: `/home/louisdup/VF/deployments/railway/WA_monitor _Velo_Test/services/whatsapp-bridge/`
- **VPS Production**: `/opt/velo-test-monitor/services/whatsapp-bridge/`
- **Technology**: Go + whatsmeow library
- **Session Storage**: SQLite (`store/whatsapp.db`, `store/messages.db`)

### Authentication Flow

```
Phone Number Set in .env
    ↓
Bridge Calls client.PairPhone()
    ↓
WhatsApp Server Generates 8-digit Code
    ↓
Code Displayed in Terminal + http://localhost:8080/pairing
    ↓
User Enters Code in WhatsApp App
    ↓
Session Stored in store/whatsapp.db
    ↓
Connection Established ✅
```

### Why WhatsApp Web Works But Bridge Doesn't

| Aspect | WhatsApp Web | whatsmeow Bridge |
|--------|--------------|------------------|
| Protocol | Web-based (browser) | Native protocol (Go) |
| Session | Browser cookies | SQLite database |
| Rate Limits | More lenient | Stricter (API-like) |
| Business Accounts | Always works | Sometimes restricted |
| Pairing Method | QR code primary | Phone code or QR |

## Solution: Phone Number Pairing

### Step 1: Clear Old Session
```bash
cd /home/louisdup/VF/deployments/railway/WA_monitor\ _Velo_Test/services/whatsapp-bridge

# Backup existing session
cp store/whatsapp.db store/whatsapp.db.backup_$(date +%Y%m%d) 2>/dev/null || true
cp store/messages.db store/messages.db.backup_$(date +%Y%m%d) 2>/dev/null || true

# Clear session files
rm -f store/whatsapp.db store/messages.db
```

### Step 2: Configure Phone Number
```bash
cd /home/louisdup/VF/deployments/railway/WA_monitor\ _Velo_Test

# Edit .env file
nano .env

# Set phone number (international format, no + sign):
WHATSAPP_PHONE_NUMBER=27727665862
```

**Phone Number Format Requirements**:
```
✅ CORRECT:
27727665862        # No + prefix (recommended)
+27727665862       # With + prefix (also works)

❌ WRONG:
072 766 5862       # Spaces
(072) 766-5862     # Special characters
72 766 5862        # Missing country code
```

### Step 3: Start WhatsApp Bridge
```bash
cd services/whatsapp-bridge

# Kill any running bridge processes
pkill -f "go run main.go" || pkill -f whatsapp-bridge

# Start fresh
go run main.go
```

**Expected Output**:
```
📱 Using phone number pairing for: 27727665862
🔑 PAIRING CODE: 1234-5678

📱 Enter this code in WhatsApp on your phone
🌐 Or view it at: http://localhost:8080/pairing
```

### Step 4: Link Device in WhatsApp
1. Open WhatsApp on **+27 72 766 5862** phone
2. Go to **Settings** (⋮ menu) → **Linked Devices**
3. Tap **"Link a Device"**
4. Tap **"Link with phone number instead"** (link at bottom of screen)
5. Enter the **8-digit pairing code** from terminal
6. Tap **"Link"** / **"Confirm"**
7. Wait for confirmation ✅

### Step 5: Verify Connection
```bash
# Check bridge logs
tail -f /home/louisdup/VF/deployments/railway/WA_monitor\ _Velo_Test/logs/whatsapp-bridge.log

# Expected successful connection message:
# "✅ WhatsApp connected successfully"
# "Connected to WhatsApp"
```

## Alternative: QR Code Pairing

If phone number pairing continues to fail after clearing session + waiting 2 hours:

### Method 1: Using Browser
```bash
# In .env, REMOVE phone number:
WHATSAPP_PHONE_NUMBER=

# Restart bridge
cd services/whatsapp-bridge
go run main.go

# Open QR page immediately (code expires in 60 seconds!)
firefox http://localhost:8080/qr &
```

### Method 2: Using Terminal QR
```bash
# QR code automatically displays in terminal
# Scan with WhatsApp camera within 60 seconds
```

**Important**: QR codes expire quickly. If timeout occurs, bridge generates new code automatically.

## Common Failure Scenarios

### Error: "Timeout waiting for QR code scan"
**Cause**: QR code expired before scanning (60 second timeout)
**Solution**: Restart bridge, scan QR faster

### Error: "Failed to request pairing code: phone already has too many devices"
**Cause**: Account has 5 linked devices (WhatsApp maximum)
**Solution**:
1. Open WhatsApp → Settings → Linked Devices
2. Unlink unused/old devices
3. Try pairing again

### Error: "Failed to request pairing code: rate limited"
**Cause**: Too many pairing attempts in short time
**Solution**: Wait 1-2 hours before retrying (WhatsApp anti-abuse measure)

### Pairing Code Appears But Link Fails Silently
**Cause 1**: Session conflict with old credentials
**Solution**: Clear session completely (Step 1), wait 5 minutes, try again

**Cause 2**: WhatsApp Business account restrictions
**Solution**: Use QR code pairing instead (Business accounts prefer QR)

**Cause 3**: Phone number format incorrect
**Solution**: Verify exact format: `27727665862` (no spaces, no +)

### Bridge Connects But Doesn't Receive Messages
**Cause**: Not actually member of monitored groups
**Solution**: Verify phone number is member of groups:
- Lawley Activation 3: `120363418298130331@g.us`
- Mohadin Activations: `120363421532174586@g.us`
- Velo Test: `120363421664266245@g.us`

## Troubleshooting Commands

```bash
# Check if bridge is running
ps aux | grep whatsapp-bridge

# View real-time logs
tail -f logs/whatsapp-bridge.log

# Check session files
ls -lh services/whatsapp-bridge/store/

# Test bridge API
curl http://localhost:8080/auth-status

# Kill stuck bridge process
pkill -9 -f whatsapp-bridge
```

## VPS Deployment (After Local Success)

Once local pairing works:

### Copy Session to VPS
```bash
# From local machine
cd /home/louisdup/VF/deployments/railway/WA_monitor\ _Velo_Test/services/whatsapp-bridge

# Compress session files
tar -czf whatsapp-session.tar.gz store/whatsapp.db store/messages.db

# Copy to VPS
scp whatsapp-session.tar.gz root@72.60.17.245:/tmp/

# On VPS
ssh root@72.60.17.245
cd /opt/velo-test-monitor/services/whatsapp-bridge
tar -xzf /tmp/whatsapp-session.tar.gz
rm /tmp/whatsapp-session.tar.gz

# Update .env on VPS
nano /opt/velo-test-monitor/.env
# Add: WHATSAPP_PHONE_NUMBER=27727665862

# Restart bridge on VPS
pkill -f whatsapp-bridge
cd /opt/velo-test-monitor/services/whatsapp-bridge
nohup go run main.go >> ../../logs/whatsapp-bridge.log 2>&1 &
```

## Success Indicators

✅ **Pairing Successful When You See**:
- Terminal shows: "✅ WhatsApp connected successfully"
- `/auth-status` returns: `{"authenticated": true}`
- WhatsApp app shows device as "Linked"
- Bridge starts receiving messages from groups

## Prevention: Avoiding Future Issues

1. **Keep Session Backed Up**:
   ```bash
   # Weekly backup
   cp store/whatsapp.db store/whatsapp.db.backup_$(date +%Y%m%d)
   ```

2. **Don't Unlink From Phone**: Once linked, keep device connected in WhatsApp

3. **Monitor Session Health**: Check `/auth-status` endpoint daily

4. **Rate Limit Awareness**: Max 3-5 pairing attempts per 2 hours

## Related Documentation

- **Main Integration Guide**: `docs/WA_MONITOR_WHATSAPP_INTEGRATION.md`
- **Data Flow Report**: `docs/WA_MONITOR_DATA_FLOW_REPORT.md`
- **VPS Deployment**: `docs/VPS/DEPLOYMENT.md`
- **General Troubleshooting**: `/home/louisdup/VF/deployments/railway/WA_monitor _Velo_Test/TROUBLESHOOTING.md`

---

**Document Version**: 1.0
**Last Updated**: November 7, 2025
**Status**: Active Investigation
**Next Action**: Execute Step-by-Step Recovery Plan
