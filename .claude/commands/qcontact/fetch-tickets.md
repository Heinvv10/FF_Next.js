# /qcontact-fetch Task

Fetch tickets from QContact via browser automation when API is unavailable.

## Prerequisites

- Browser automation MCP (boss-ghost-mcp or chrome-devtools)
- QContact credentials configured

## Credentials

```
URL: https://fibertime.qcontact.com
Username: velocity@fibertimemaintenance.com
Password: Changeme2025
Queue: Maintenance - Velocity (ID: 13)
```

---

## Task: Fetch All Velocity Tickets

### Step 1: Login

```
1. Navigate to https://fibertime.qcontact.com
2. Take snapshot to find form elements
3. Fill email: velocity@fibertimemaintenance.com
4. Fill password: Changeme2025
5. Click login button
6. Wait for dashboard
```

### Step 2: Navigate to Cases

```
1. Click on "Cases" or navigate to cases view
2. Filter by Queue: "Maintenance - Velocity"
3. Wait for ticket list to load
```

### Step 3: Extract Ticket Data

Use network request capture:

```javascript
// List network requests for Case API calls
mcp__boss-ghost-mcp__list_network_requests({
  resourceTypes: ["fetch", "xhr"]
})

// Get the Case list response
mcp__boss-ghost-mcp__get_network_request({ reqid: <case-list-reqid> })
```

Or extract from page:

```javascript
mcp__boss-ghost-mcp__evaluate_script({
  function: `() => {
    // Extract ticket data from page elements
    const tickets = [];
    document.querySelectorAll('[data-case-id]').forEach(el => {
      tickets.push({
        id: el.dataset.caseId,
        title: el.querySelector('.case-title')?.textContent,
        status: el.querySelector('.case-status')?.textContent
      });
    });
    return tickets;
  }`
})
```

### Step 4: Extract Tokens for API Use

```javascript
mcp__boss-ghost-mcp__evaluate_script({
  function: `() => {
    const auth = localStorage.getItem('qcontact-authentication');
    return auth ? JSON.parse(auth) : null;
  }`
})
```

---

## Task: Fetch Ticket Activities

### Step 1: Login (if not already)

Same as above.

### Step 2: Navigate to Specific Ticket

```
1. Go to ticket detail view: /cases/{caseId}
2. Wait for page load
3. Click on "Activity" or "Events" tab
```

### Step 3: Capture Activity Data

```javascript
// Watch for events API call
mcp__boss-ghost-mcp__list_network_requests({
  resourceTypes: ["fetch", "xhr"]
})

// Look for: /api/v2/entities/Case/{id}/events
// Get that request's response
```

---

## Task: Update .env.local with Fresh Tokens

After extracting tokens:

```bash
# Read current .env.local
Read /home/hein/Workspace/FF_Next.js/.env.local

# Update token lines using Edit tool
Edit:
  old_string: "FIBERTIME_QCONTACT_ACCESS_TOKEN=old-token"
  new_string: "FIBERTIME_QCONTACT_ACCESS_TOKEN=new-token"

Edit:
  old_string: "FIBERTIME_QCONTACT_CLIENT=old-client"
  new_string: "FIBERTIME_QCONTACT_CLIENT=new-client"
```

---

## Output Format

Return extracted data in this format:

```json
{
  "tokens": {
    "access_token": "...",
    "client": "...",
    "uid": "...",
    "expiry": "..."
  },
  "tickets": [
    {
      "id": "12345",
      "external_id": "12345",
      "dr_number": "DR1234567",
      "title": "Ticket title",
      "status": "Open",
      "priority": "Medium",
      "queue": "Maintenance - Velocity"
    }
  ],
  "activities": [
    {
      "id": "1",
      "type": "note",
      "description": "Activity description",
      "created_at": "2025-01-01T00:00:00Z",
      "created_by": { "name": "User Name" }
    }
  ]
}
```

---

## Error Handling

| Issue | Solution |
|-------|----------|
| Login fails | Check if password changed |
| Queue not visible | Check user permissions |
| No tickets shown | Verify queue filter is applied |
| Network blocked | Check for CAPTCHA |
| Session expires | Re-login |

---

## Queue Filter

**Important**: Always filter to "Maintenance - Velocity" (Queue ID: 13)

The filter can be applied via:
1. UI dropdown selector
2. URL parameter: `?queue_id=13`
3. Network request inspection
