# QContact Auto-Recovery Skill

Automatically detect QContact API issues and recover by re-authenticating via browser automation.

## Purpose

This skill makes Claude Code proactive about QContact integration issues by:
1. Detecting 401/403 errors from QContact API
2. Automatically logging in via browser to get fresh tokens
3. Updating credentials in .env.local
4. Retrying the failed operation

## Credentials

```
URL: https://fibertime.qcontact.com
Username: velocity@fibertimemaintenance.com
Password: Changeme2025
Queue: Maintenance - Velocity (ID: 13)
```

## When to Activate

### Trigger 1: API Authentication Failure

**Pattern**: 401 Unauthorized from QContact API

**Log indicators**:
- "401" in API response
- "Unauthorized" error
- "Invalid token"
- "Token expired"
- "Authentication required"

**Automatic Actions**:
1. Detect 401/authentication error
2. Open browser to QContact login page
3. Login with credentials
4. Extract tokens from localStorage
5. Update .env.local
6. Retry original request

**Response Template**:
```
QContact API returned 401 Unauthorized.

Refreshing credentials...
1. Logging into QContact...
2. Extracting fresh tokens...
3. Updating .env.local...
4. Retrying request...

Tokens refreshed successfully. Retrying original request.
```

### Trigger 2: Empty Activities Response

**Pattern**: Activities API returns empty when ticket should have data

**Indicators**:
- `activities.length === 0` for QContact tickets
- Ticket source is 'qcontact' but no activities

**Automatic Actions**:
1. Verify API credentials are valid
2. If invalid, trigger re-authentication
3. Test with direct browser fetch
4. Compare browser data vs API data

### Trigger 3: Sync Failure

**Pattern**: QContact ticket sync fails

**Indicators**:
- "Failed to sync" in logs
- "QContact sync error"
- Network timeout to qcontact.com

**Automatic Actions**:
1. Check QContact site accessibility
2. Test authentication
3. Re-authenticate if needed
4. Report sync status

### Trigger 4: Manual Token Refresh Request

**Keywords**:
- "refresh qcontact"
- "qcontact login"
- "renew qcontact tokens"
- "qcontact 401"
- "fix qcontact auth"

**Automatic Actions**:
1. Open browser to QContact
2. Login with credentials
3. Extract and update tokens
4. Confirm success

---

## Browser Automation Workflow

### Step 1: Navigate and Login

```javascript
// Open QContact
mcp__boss-ghost-mcp__new_page({ url: "https://fibertime.qcontact.com" })

// Wait for page load
mcp__boss-ghost-mcp__take_snapshot()

// Fill login form
mcp__boss-ghost-mcp__fill({ uid: "email-field-uid", value: "velocity@fibertimemaintenance.com" })
mcp__boss-ghost-mcp__fill({ uid: "password-field-uid", value: "Changeme2025" })

// Submit
mcp__boss-ghost-mcp__click({ uid: "login-button-uid" })
```

### Step 2: Wait for Dashboard

```javascript
// Wait for successful login
mcp__boss-ghost-mcp__wait_for({ text: "Dashboard" })
// OR wait for queue selector
mcp__boss-ghost-mcp__wait_for({ text: "Maintenance - Velocity" })
```

### Step 3: Extract Tokens

```javascript
mcp__boss-ghost-mcp__evaluate_script({
  function: `() => {
    const auth = localStorage.getItem('qcontact-authentication');
    return auth ? JSON.parse(auth) : null;
  }`
})
```

**Expected result**:
```json
{
  "access-token": "pCTWJ6kq15XaszOr3QQpLQ",
  "client": "s6fyQQjObwbTIOMm4ps27Q",
  "uid": "velocity@fibertimemaintenance.com",
  "expiry": "1735531637"
}
```

### Step 4: Update .env.local

```bash
# Update the token values in .env.local
FIBERTIME_QCONTACT_ACCESS_TOKEN=<new-access-token>
FIBERTIME_QCONTACT_CLIENT=<new-client>
```

### Step 5: Restart Server (if running)

```bash
# Kill and restart the Next.js server to pick up new env vars
pkill -f "next start" && npm run build && PORT=3005 npm start
```

---

## API Endpoints Reference

After authentication, use these endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v2/entities/Case?queue_id=13` | List Velocity tickets |
| `GET /api/v2/entities/Case/{id}` | Get ticket details |
| `GET /api/v2/entities/Case/{id}/events` | Get ticket activities |

**Required Headers**:
```
uid: velocity@fibertimemaintenance.com
access-token: <from localStorage>
client: <from localStorage>
```

---

## Auto-Activation Rules

### DO Automatically (No User Confirmation Needed):
- Detect 401/403 errors
- Open browser for re-authentication
- Extract and update tokens
- Retry failed requests

### ASK First:
- Restart production server
- Modify any code files
- Change API endpoints

### DON'T (Never Do Without Explicit Request):
- Share or log credentials
- Modify QContact data
- Access other queues without permission

---

## Error Recovery Matrix

| Error | Detection | Recovery |
|-------|-----------|----------|
| 401 Unauthorized | API response code | Re-login, refresh tokens |
| 403 Forbidden | API response code | Check queue permissions |
| Network Error | Timeout/connection | Check site accessibility |
| Empty Response | No activities returned | Verify caseId, check API |
| Login Failed | No dashboard after login | Password may have changed |
| CAPTCHA | CAPTCHA element detected | Alert user, manual intervention |

---

## Status Indicators

- Detecting auth error...
- Logging into QContact...
- Tokens extracted successfully
- Updating .env.local...
- Credentials refreshed
- Retrying request...
- Authentication failed - manual intervention needed
- CAPTCHA detected - cannot automate

---

## Success Criteria

Skill is successful when:
- API 401 errors are auto-recovered
- User doesn't need to manually refresh tokens
- Failed requests are retried automatically
- Minimal disruption to workflow
- Clear status updates during recovery

---

## Integration with fibertimeQContactClient.ts

The QContact client at `src/modules/ticketing/services/fibertimeQContactClient.ts` should be updated to:

1. Catch 401 errors
2. Emit an event/log that triggers this skill
3. Wait for token refresh
4. Retry the request

**Detection pattern in logs**:
```
"QContact API returned 401"
"Authentication failed"
"Token expired"
```

---

## Manual Invocation

User can explicitly trigger with:
- "Refresh QContact tokens"
- "Login to QContact"
- "Fix QContact authentication"
- "/qcontact *login"
- "/qcontact *refresh-tokens"
