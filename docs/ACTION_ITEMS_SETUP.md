# Action Items Setup Guide

## Quick Start

The Action Items system is now fully implemented but requires database migration before use.

### Step 1: Apply Database Migration

```bash
# Connect to your Neon database and run the migration
psql "$DATABASE_URL" -f neon/migrations/create_action_items_table.sql
```

Or use a Node.js script:

```javascript
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

(async () => {
  const migration = fs.readFileSync('neon/migrations/create_action_items_table.sql', 'utf8');
  await sql.unsafe(migration);
  console.log('✅ Migration complete');
})();
```

### Step 2: Extract Action Items from Existing Meetings

Extract action items from all meetings with action items in their summaries:

```bash
# Get list of meetings with action items
curl http://localhost:3005/api/meetings | jq '.meetings[] | select(.summary.action_items != null) | .id'

# Extract action items from each meeting (replace MEETING_ID)
curl -X POST http://localhost:3005/api/action-items/extract \
  -H "Content-Type: application/json" \
  -d '{"meeting_id": MEETING_ID}'
```

Or use this Node.js script to extract from all meetings:

```javascript
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

(async () => {
  // Fetch all meetings with action items
  const meetings = await sql`
    SELECT id, title
    FROM meetings
    WHERE summary->>'action_items' IS NOT NULL
  `;

  console.log(`Found ${meetings.length} meetings with action items`);

  for (const meeting of meetings) {
    try {
      // Call extract API
      const response = await fetch('http://localhost:3005/api/action-items/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: meeting.id })
      });

      const result = await response.json();
      console.log(`✅ ${meeting.title}: ${result.data?.length || 0} action items extracted`);
    } catch (error) {
      console.error(`❌ ${meeting.title}: ${error.message}`);
    }
  }
})();
```

### Step 3: Verify Installation

1. Start your development server:
   ```bash
   npm run build && PORT=3005 npm start
   ```

2. Visit the following URLs to verify everything works:
   - Dashboard: http://localhost:3005/action-items
   - Pending: http://localhost:3005/action-items/pending
   - Completed: http://localhost:3005/action-items/completed
   - Overdue: http://localhost:3005/action-items/overdue
   - By Meeting: http://localhost:3005/action-items/by-meeting
   - By Assignee: http://localhost:3005/action-items/by-assignee
   - Search: http://localhost:3005/action-items/search

3. Check API endpoints:
   ```bash
   # Get statistics
   curl http://localhost:3005/api/action-items/stats

   # List all action items
   curl http://localhost:3005/api/action-items

   # Filter pending items
   curl "http://localhost:3005/api/action-items?status=pending"

   # Search
   curl "http://localhost:3005/api/action-items?search=proposal"
   ```

## Features

### ✅ Implemented
- Extract action items from Fireflies meeting summaries
- Normalize assignee names and match to participants
- Track status (pending, in_progress, completed, cancelled)
- Set priorities (low, medium, high, urgent)
- Add due dates
- Toggle completion from UI
- Filter by status, assignee, meeting, priority
- Search in descriptions
- Group by meeting or assignee
- Statistics dashboard

### 🚧 Future Enhancements
- Email notifications for assignments
- Due date reminders
- Bulk operations (assign multiple, complete multiple)
- Recurring action items
- Action item templates
- File attachments
- Comments/discussion threads
- Integration with project tasks
- Calendar view
- Kanban board view

## API Reference

### List Action Items
```
GET /api/action-items?status=pending&assignee_name=Louis&search=proposal
```

**Query Parameters:**
- `status` - Filter by status (pending, in_progress, completed, cancelled)
- `assignee_name` - Filter by assignee (partial match)
- `meeting_id` - Filter by meeting ID
- `priority` - Filter by priority (low, medium, high, urgent)
- `search` - Search in descriptions
- `overdue` - Show overdue items (true/false)

### Create Action Item
```
POST /api/action-items
Content-Type: application/json

{
  "meeting_id": 2,
  "description": "Review the updated proposal",
  "assignee_name": "Louis",
  "status": "pending",
  "priority": "high",
  "due_date": "2025-11-05T00:00:00Z",
  "tags": ["proposal", "review"]
}
```

### Update Action Item
```
PATCH /api/action-items/{id}
Content-Type: application/json

{
  "status": "completed",
  "notes": "Completed during weekly review"
}
```

### Extract from Meeting
```
POST /api/action-items/extract
Content-Type: application/json

{
  "meeting_id": 2
}
```

## Database Schema

The `action_items` table includes:
- `id` (UUID) - Primary key
- `meeting_id` (INTEGER) - Reference to meetings table
- `description` (TEXT) - Action item description
- `assignee_name` (VARCHAR) - Person assigned
- `assignee_email` (VARCHAR) - Email if matched to participant
- `status` (ENUM) - pending, in_progress, completed, cancelled
- `priority` (ENUM) - low, medium, high, urgent
- `due_date` (TIMESTAMP) - When it's due
- `completed_date` (TIMESTAMP) - When it was completed
- `mentioned_at` (VARCHAR) - Timestamp in meeting (MM:SS)
- `tags` (TEXT[]) - Searchable tags
- `notes` (TEXT) - Additional context
- Timestamps: `created_at`, `updated_at`

## Troubleshooting

### 404 Errors on Sub-Routes
**Cause**: Migration not applied or build not recompiled after adding routes.
**Solution**:
```bash
npm run build && PORT=3005 npm start
```

### No Action Items Showing
**Cause**: Action items not yet extracted from meetings.
**Solution**: Run extraction script (Step 2 above)

### Parser Not Working
**Cause**: Fireflies format changed or unexpected text structure.
**Solution**: Check `src/services/action-items/actionItemsParser.ts` and adjust regex patterns.

### Assignee Email Not Matched
**Cause**: Assignee name doesn't match any participant name.
**Solution**: Manually update the action item with correct email, or improve matching algorithm in `findAssigneeEmail()`.

## Production Deployment

1. Apply migration to production database
2. Extract action items from all meetings
3. Set up automated extraction:
   - Option A: Cron job to poll for new meetings
   - Option B: Webhook from Fireflies (if available)
   - Option C: Manual trigger from meetings page

4. Configure monitoring:
   - Track extraction failures
   - Monitor overdue items
   - Set up email notifications (future enhancement)

## Development Notes

- Uses Fireflies text format: `**Assignee Name**` followed by action items
- Timestamps like `(16:17)` are extracted and stored in `mentioned_at`
- Parser is fault-tolerant - skips malformed lines
- API uses standardized response format from `lib/apiResponse.ts`
- Frontend service uses standard error handling pattern
- All routes protected by layout authentication (if enabled)
