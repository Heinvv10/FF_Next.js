# Foto Reviews System - Human-in-the-Loop AI Review Dashboard

## Overview

The Foto Reviews system is a **Human-in-the-Loop (HITL)** approval workflow that allows Zander to review and approve AI-generated feedback before it's sent to WhatsApp groups. This ensures quality control and prevents incorrect AI assessments from being sent automatically.

**Created:** November 20, 2025
**Status:** Production Ready
**Architecture:** Modular ("Lego Block" Pattern)

## System Architecture

```
1Map DR Submission
    ↓
DR Queue Worker (Python)
    ↓ (AI Review)
Set approval_status = 'pending_review'
Store original_feedback
    ↓
FibreFlow Foto Reviews Dashboard
    ↓ (Human Review)
Zander approves/edits/rejects
    ↓
Send approved feedback to WhatsApp
Update approval_status = 'sent'
```

## Key Features

### 1. Pending Reviews Dashboard
- **Real-time list** of DR submissions awaiting review
- **Status filtering**: pending_review, approved, rejected, sent
- **Search** by DR number
- **Quick stats**: Pending count, approved count, etc.
- **Auto-refresh** capability

### 2. Review Detail Modal
- **Large image display** with zoom capability
- **AI Review Results**:
  - Overall score (0-10)
  - Confidence level (0-100%)
  - Pass/Fail status
  - Recommendation text
  - Issues detected list
- **Three action options**:
  - Approve & Send (as-is)
  - Edit & Approve (modify feedback)
  - Reject (don't send)

### 3. Feedback Editing
- **Text editor** for modifying AI-generated feedback
- **Original vs Edited** tracking
- **Preview** before sending
- **History** of all edits

### 4. Approval History
- **Complete audit trail** of all actions
- **User tracking** (who approved/rejected)
- **Timestamps** for all actions
- **Notes** for each action

## Database Schema

### New Columns (dr_jobs table)

```sql
ALTER TABLE dr_jobs ADD COLUMN approval_status TEXT DEFAULT 'pending_review';
ALTER TABLE dr_jobs ADD COLUMN reviewer_id TEXT;
ALTER TABLE dr_jobs ADD COLUMN reviewer_name TEXT;
ALTER TABLE dr_jobs ADD COLUMN reviewed_at TIMESTAMP;
ALTER TABLE dr_jobs ADD COLUMN original_feedback TEXT;
ALTER TABLE dr_jobs ADD COLUMN edited_feedback TEXT;
ALTER TABLE dr_jobs ADD COLUMN rejection_reason TEXT;
ALTER TABLE dr_jobs ADD COLUMN whatsapp_sent_at TIMESTAMP;
ALTER TABLE dr_jobs ADD COLUMN project TEXT;
```

### New Table (approval_history)

```sql
CREATE TABLE approval_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL,
    action TEXT NOT NULL,  -- approved, rejected, edited, sent
    user_id TEXT,
    user_name TEXT,
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES dr_jobs(id)
);
```

## File Structure

### Frontend (Modular Architecture)

```
/home/louisdup/VF/Apps/FF_React/

src/modules/foto-reviews/
  ├── types/
  │   └── fotoReviews.types.ts          # TypeScript interfaces
  ├── services/
  │   └── fotoReviewsApiService.ts      # API client
  ├── hooks/
  │   └── useFotoReviews.ts             # Data fetching hooks
  └── components/
      ├── FotoReviewsDashboard.tsx      # Main dashboard
      ├── PendingReviewsList.tsx        # Reviews list
      ├── ReviewDetailModal.tsx         # Detail modal
      ├── FeedbackEditor.tsx            # Edit component
      ├── ApprovalControls.tsx          # Action buttons
      ├── ReviewHistory.tsx             # History display
      └── index.ts                      # Exports

app/foto-reviews/page.tsx               # Page route
```

### Backend API

```
pages/api/foto-reviews/
  ├── pending.ts                        # GET pending reviews
  ├── [jobId].ts                        # GET job details
  ├── image.ts                          # GET image file
  └── [jobId]/
      ├── approve.ts                    # POST approve
      ├── reject.ts                     # POST reject
      ├── edit-feedback.ts              # PATCH edit
      ├── send-to-whatsapp.ts          # POST send
      └── history.ts                    # GET history
```

### Database & Worker

```
/home/louisdup/Agents/antigravity/
  ├── dr_queue_worker.py                # Updated worker
  ├── dr_queue_db.py                    # Database methods
  └── migrations/
      └── add_approval_workflow.sql     # Migration script
```

## API Endpoints

### GET /api/foto-reviews/pending
**Get pending reviews with filters**

Query Parameters:
- `status` - Filter by approval status (default: pending_review)
- `project` - Filter by project name
- `search` - Search by DR number
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

Response:
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "job_id": "uuid",
        "dr_number": "DR1734529",
        "project": "Lawley",
        "status": "pending_review",
        "ai_score": 8,
        "ai_confidence": 0.9,
        "queued_at": "2025-11-20T14:30:00Z",
        "image_url": "/api/foto-reviews/image?path=..."
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

### GET /api/foto-reviews/{jobId}
**Get detailed review data**

Response:
```json
{
  "success": true,
  "data": {
    "job_id": "uuid",
    "dr_number": "DR1734529",
    "project": "Lawley",
    "status": "pending_review",
    "result": {
      "passed": true,
      "score": 8,
      "confidence": 0.9,
      "recommendation": "Photo quality is good...",
      "issues": [],
      "image_path": "1map_images/DR1734529.jpg"
    },
    "original_feedback": "Photo quality is good...",
    "edited_feedback": null,
    "queued_at": "2025-11-20T14:30:00Z"
  }
}
```

### POST /api/foto-reviews/{jobId}/approve
**Approve a review**

Body:
```json
{
  "edited_feedback": "Optional edited text"
}
```

### POST /api/foto-reviews/{jobId}/reject
**Reject a review**

Body:
```json
{
  "rejection_reason": "Why this is being rejected"
}
```

### PATCH /api/foto-reviews/{jobId}/edit-feedback
**Edit feedback text**

Body:
```json
{
  "edited_feedback": "Modified feedback text"
}
```

### POST /api/foto-reviews/{jobId}/send-to-whatsapp
**Send approved feedback to WhatsApp**

Response:
```json
{
  "success": true,
  "data": {
    "success": true,
    "sent_at": "2025-11-20T15:00:00Z",
    "message": "Feedback sent to WhatsApp successfully"
  }
}
```

### GET /api/foto-reviews/{jobId}/history
**Get approval history**

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "job_id": "uuid",
      "action": "approved",
      "user_id": "clerk_user_id",
      "user_name": "Zander",
      "notes": "Approved with edited feedback",
      "timestamp": "2025-11-20T15:00:00Z"
    }
  ]
}
```

## Workflow

### 1. DR Queue Worker Processing

When a DR is submitted:

```python
# dr_queue_worker.py (lines 150-161)

# After AI review completes:
self.db.save_job_result(job_id, result)

# Set approval status to pending_review
self.db.set_approval_pending(job_id, review_result.recommendation)
logger.info(f"📋 Job {job_id} awaiting human review approval")

# NOTE: Webhook is NOT sent immediately
# Only sent after human approval in Foto Reviews dashboard
```

### 2. Human Review in Dashboard

1. **Zander visits** `/foto-reviews`
2. **Sees pending reviews** in the dashboard
3. **Clicks** on a DR number to review
4. **Reviews** the AI assessment:
   - Views property photo
   - Checks AI score and confidence
   - Reads recommendation
5. **Takes action**:
   - **Approve & Send**: Sends as-is to WhatsApp
   - **Edit & Approve**: Modifies feedback, then sends
   - **Reject**: Marks as rejected, doesn't send

### 3. Sending to WhatsApp

When approved:

```typescript
// API flow:
1. approve.ts - Sets approval_status = 'approved'
2. send-to-whatsapp.ts - Triggers WhatsApp callback
3. Updates approval_status = 'sent'
4. Records in approval_history
```

## Integration with 1Map System

### Modified Worker Behavior

**Before (Automatic):**
```
AI Review → Send Callback → WhatsApp (immediate)
```

**After (Human-in-the-Loop):**
```
AI Review → Set pending_review → Wait for approval
                                      ↓
                              Human approves in dashboard
                                      ↓
                              Send Callback → WhatsApp
```

### Database Method Added

```python
# dr_queue_db.py

def set_approval_pending(self, job_id: str, original_feedback: str):
    """
    Set job approval status to pending_review and store original AI feedback
    Part of Human-in-the-Loop approval workflow
    """
    conn = sqlite3.connect(self.db_path)
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE dr_jobs
        SET approval_status = 'pending_review',
            original_feedback = ?
        WHERE id = ?
    """, (original_feedback, job_id))

    conn.commit()
    conn.close()
```

## Security & Permissions

### Authentication
- Uses **Clerk** for authentication
- All API endpoints verify `userId` from Clerk session
- User info tracked in approval history

### Authorization
- Currently: All authenticated users can view
- Admin users can approve/reject (configurable)

### Image Access
- Images served through authenticated endpoint
- Path validation prevents directory traversal
- Only serves files from `/home/louisdup/Agents/antigravity/`

## Running the Migration

To enable the approval workflow in the database:

```bash
# Connect to SQLite database
cd /home/louisdup/Agents/antigravity

# Run migration
sqlite3 1map_data.db < migrations/add_approval_workflow.sql

# Verify new columns
sqlite3 1map_data.db "PRAGMA table_info(dr_jobs);"
```

**Note:** If `sqlite3` is not installed, you can run the SQL commands manually using any SQLite client or through Python.

## Testing Checklist

### Backend Testing
- [ ] Migration script runs without errors
- [ ] New columns added to `dr_jobs` table
- [ ] `approval_history` table created
- [ ] DR Queue Worker sets `pending_review` status
- [ ] All API endpoints return correct data

### Frontend Testing
- [ ] Dashboard loads with pending reviews
- [ ] Status filtering works (pending, approved, rejected, sent)
- [ ] Search by DR number works
- [ ] Review detail modal opens correctly
- [ ] Image displays and zoom works
- [ ] AI review results show correctly
- [ ] Approve action works
- [ ] Edit & Approve saves and sends feedback
- [ ] Reject action stores reason
- [ ] History tab shows all actions
- [ ] User tracking works (Clerk integration)

### Integration Testing
- [ ] Submit new DR through 1Map
- [ ] Verify it appears in pending reviews
- [ ] Approve review in dashboard
- [ ] Verify WhatsApp callback is triggered
- [ ] Verify status updates to 'sent'
- [ ] Check approval history is recorded

## Troubleshooting

### No reviews showing in dashboard

**Check:**
1. Database migration completed?
2. DR Queue Worker running with updated code?
3. New DRs being submitted and processed?
4. Check browser console for API errors

### Images not loading

**Check:**
1. Image path in database is correct
2. File exists at `/home/louisdup/Agents/antigravity/{image_path}`
3. Image endpoint `/api/foto-reviews/image` is accessible
4. Clerk authentication is working

### Webhook not sending

**Check:**
1. Review is approved (status = 'approved')
2. Callback URL is set in `dr_jobs.callback_url`
3. Check browser network tab for send-to-whatsapp errors
4. Verify WhatsApp integration is working

## Future Enhancements

### Potential Improvements
1. **Batch approval** - Approve multiple reviews at once
2. **Email notifications** - Alert Zander when new reviews are pending
3. **Mobile app** - Review on mobile device
4. **Analytics** - Track approval rates, edit frequency
5. **AI confidence threshold** - Auto-approve high-confidence reviews
6. **Templates** - Pre-defined feedback templates for common scenarios
7. **Keyboard shortcuts** - Speed up review process
8. **Bulk actions** - Reject/approve multiple at once

### Known Limitations
1. **Single reviewer** - Only one person can review at a time (no concurrent review)
2. **No undo** - Once sent to WhatsApp, cannot be undone
3. **Image formats** - Only supports JPEG/PNG (as captured by 1Map)

## Related Documentation

- **1Map Integration**: `/home/louisdup/Agents/antigravity/README.md`
- **WA Monitor**: `/home/louisdup/VF/Apps/FF_React/docs/WA_MONITOR_DATA_FLOW_REPORT.md`
- **API Standards**: `/home/louisdup/VF/Apps/FF_React/CLAUDE.md` (API Response Standards)
- **Modular Architecture**: `/home/louisdup/VF/Apps/FF_React/CLAUDE.md` (Modular Architecture section)

## Support

For issues or questions:
1. Check this documentation
2. Review code comments in source files
3. Check approval_history table for audit trail
4. Review API response errors in browser console
