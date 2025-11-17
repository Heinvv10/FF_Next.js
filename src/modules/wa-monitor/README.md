# WA Monitor Module

WhatsApp QA Drop Monitoring System - Real-time tracking and review of QA photo submissions from field agents.

## Overview

This module provides a live dashboard for monitoring QA photo review drops submitted via WhatsApp groups. Field agents submit installation photos, which are captured by the VPS monitor, stored in Neon PostgreSQL, and displayed in an interactive dashboard for QA review and feedback.

## Module Structure

```
src/modules/wa-monitor/
├── types/
│   └── wa-monitor.types.ts          # Type definitions
├── services/
│   ├── waMonitorService.ts          # Backend database operations
│   └── waMonitorApiService.ts       # Frontend API client
├── utils/
│   └── waMonitorHelpers.ts          # Helper functions (formatting, export)
├── components/
│   ├── QaReviewCard.tsx             # Main review card with incorrect marking
│   ├── WaMonitorDashboard.tsx       # Main dashboard component
│   ├── WaMonitorFilters.tsx         # Filter controls
│   ├── DropStatusBadge.tsx          # Status badge component
│   └── index.ts                     # Component exports
└── README.md                         # This file
```

## How It Works

### Data Flow
```
WhatsApp Groups → VPS Monitor → Database → Dashboard
                   (Python)      (Neon)     (React)
```

1. **Field agents** submit 12 QA photos to WhatsApp groups (one per installation step)
2. **VPS Monitor** (Python script at `/opt/wa-monitor/prod/`) captures messages via whatsmeow bridge
3. Data saved to **Neon PostgreSQL** table `qa_photo_reviews`
4. **Dashboard** displays drops for QA review, marking incorrect photos, and sending feedback

### 12 QA Steps (Photos Required)
1. Property Photo
2. Cable from Pole
3. Cable Entry Outside
4. Cable Entry Inside
5. Location on Wall
6. Fibre Entry to ONT
7. Overall Work area - final installation
8. ONT Barcode
9. UPS Serial number
10. Powermeter at ONT
11. Green Lights
12. Customer Signature

## Incorrect Photo Marking (Nov 17, 2025)

### UI Design
Each of the 12 QA steps has:
- **Checkbox**: Ticked = photo uploaded, Unticked = missing
- **Text input**: Below each step for explaining why a photo is incorrect

```
[✓] 1. Property Photo
    If incorrect, explain why: [Photo unclear, can't see house number___]

[✓] 2. Cable from Pole
    If incorrect, explain why: [Wrong angle - need full view________]

[ ] 3. Cable Entry Outside
    Not uploaded - no comment needed [_____________] (disabled)
```

### Logic - Three States

| Checkbox | Text Input | Result     | Database                               |
|----------|-----------|------------|----------------------------------------|
| ☑️ Ticked | Empty     | ✅ Correct | `step_01_house_photo = true`          |
| ☑️ Ticked | Filled    | ⚠️ Incorrect | `step_01_house_photo = true`<br>`incorrectSteps = ['step_01_house_photo']`<br>`incorrectComments = {"step_01_house_photo": "Photo unclear"}` |
| ☐ Unticked | N/A      | ❌ Missing | `step_01_house_photo = false`         |

### Feedback Generation

When user clicks **"Auto-Generate"**, the system creates a feedback message like:

```
DR1234567

Missing items:
• 3. Cable Entry Outside
• 7. Overall Work area

Incorrect items:
• 1. Property Photo - Photo unclear, can't see house number
• 5. Location on Wall - Wrong angle - need full wall view
```

### Code Implementation

**Component**: `src/modules/wa-monitor/components/QaReviewCard.tsx`

**Key Logic**:
```typescript
// Determine incorrect steps from comments
const getIncorrectSteps = () => {
  return ORDERED_STEP_KEYS.filter(
    key => steps[key] && // Photo uploaded
           incorrectComments[key] && // Comment exists
           incorrectComments[key].trim().length > 0 // Comment not empty
  );
};

// Save to database
await onUpdate(drop.id, {
  ...steps,
  incorrectSteps: getIncorrectSteps(),
  incorrectComments: incorrectComments
});
```

### Database Storage

**Table**: `qa_photo_reviews`

**New Columns** (Added Nov 17, 2025):
```sql
-- Array of step keys marked as incorrect
incorrect_steps TEXT[] DEFAULT '{}',

-- JSONB object mapping step keys to comments
incorrect_comments JSONB DEFAULT '{}'
```

**Example Data**:
```json
{
  "drop_number": "DR1234567",
  "step_01_house_photo": true,
  "step_02_cable_from_pole": true,
  "step_03_cable_entry_outside": false,

  "incorrect_steps": ["step_01_house_photo"],
  "incorrect_comments": {
    "step_01_house_photo": "Photo unclear, can't see house number"
  }
}
```

## Database Schema

**Table:** `qa_photo_reviews`

```sql
CREATE TABLE qa_photo_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_number TEXT UNIQUE NOT NULL,
  project TEXT,
  user_name TEXT,
  submitted_by TEXT,

  -- 12 QA steps (boolean - true if photo uploaded)
  step_01_house_photo BOOLEAN DEFAULT false,
  step_02_cable_from_pole BOOLEAN DEFAULT false,
  step_03_cable_entry_outside BOOLEAN DEFAULT false,
  step_04_cable_entry_inside BOOLEAN DEFAULT false,
  step_05_wall_for_installation BOOLEAN DEFAULT false,
  step_06_ont_back_after_install BOOLEAN DEFAULT false,
  step_07_power_meter_reading BOOLEAN DEFAULT false,
  step_08_ont_barcode BOOLEAN DEFAULT false,
  step_09_ups_serial BOOLEAN DEFAULT false,
  step_10_final_installation BOOLEAN DEFAULT false,
  step_11_green_lights BOOLEAN DEFAULT false,
  step_12_customer_signature BOOLEAN DEFAULT false,

  -- Incorrect photo tracking (NEW - Nov 17, 2025)
  incorrect_steps TEXT[] DEFAULT '{}',
  incorrect_comments JSONB DEFAULT '{}',

  -- Metadata
  completed_photos INTEGER DEFAULT 0,
  outstanding_photos INTEGER DEFAULT 12,
  completed BOOLEAN DEFAULT false,
  incomplete BOOLEAN DEFAULT true,
  comment TEXT,
  feedback_sent TIMESTAMP,
  review_date TIMESTAMP DEFAULT NOW(),
  whatsapp_message_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Locking (prevents concurrent edits)
  locked_by TEXT,
  locked_at TIMESTAMP,

  -- Resubmission tracking
  resubmitted BOOLEAN DEFAULT false
);

CREATE INDEX idx_qa_photo_reviews_incorrect_steps ON qa_photo_reviews USING GIN (incorrect_steps);
```

## API Endpoints

### GET /api/wa-monitor-drops
Returns all drops with summary stats

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "dropNumber": "DR1234567",
      "status": "incomplete",
      "step_01_house_photo": true,
      "incorrectSteps": ["step_01_house_photo"],
      "incorrectComments": {"step_01_house_photo": "Photo unclear"}
    }
  ],
  "summary": {
    "total": 100,
    "incomplete": 35,
    "complete": 65
  }
}
```

### PATCH /api/wa-monitor-drops/[id]
Update drop review (including incorrect photo marking)

**Request**:
```json
{
  "step_01_house_photo": true,
  "step_02_cable_from_pole": true,
  "incorrectSteps": ["step_01_house_photo"],
  "incorrectComments": {
    "step_01_house_photo": "Photo unclear"
  }
}
```

### POST /api/wa-monitor-send-feedback
Send feedback to WhatsApp group

**Request**:
```json
{
  "dropId": "uuid",
  "dropNumber": "DR1234567",
  "message": "DR1234567\n\nMissing items:\n• 3. Cable Entry...",
  "project": "Velo Test"
}
```

## User Workflow

### Step-by-Step Usage

1. **View Dashboard**: Navigate to `/wa-monitor`
2. **Find Drop**: Search by drop number or browse list
3. **Click "Edit"**: Locks drop for editing (prevents conflicts)
4. **Review Photos**: Check boxes for completed photos
5. **Mark Incorrect**: Type reason in text box below any incorrect photo
   - Example: "Photo unclear, can't see number"
6. **Auto-Generate Feedback**: Click button to create feedback message
7. **Send to WhatsApp**: Click "Send Feedback" to notify field agent
8. **Save Review**: Saves to database and unlocks drop

### Locking System
- Prevents multiple users editing same drop
- Auto-refresh disabled while editing (prevents data loss)
- Shows warning if locked by another user
- Released on "Save" or "Cancel"

## WA Monitor Agent (VPS)

**Location**: `/opt/wa-monitor/prod/` on VPS (72.60.17.245)

### Does NOT Need Updating

The VPS Python agent **does NOT require changes** for the incorrect photo marking feature:

- Agent **only writes** basic QA step data (`step_01_house_photo`, etc.)
- New columns (`incorrect_steps`, `incorrect_comments`) are populated by **dashboard users**
- Agent continues to work as before - **no code changes needed**

### Agent Architecture (v2.0)
```
/opt/wa-monitor/
├── prod/                          # Production monitor
│   ├── modules/
│   │   ├── config.py             # Project config loader
│   │   ├── database.py           # Neon database handler
│   │   └── monitor.py            # Message processing
│   ├── config/
│   │   └── projects.yaml         # Project definitions (YAML)
│   ├── logs/
│   │   └── wa-monitor-prod.log
│   └── restart-monitor.sh        # Safe restart (clears Python cache)
└── dev/                           # Development monitor
    └── (same structure)
```

**Important**: Always use safe restart script:
```bash
ssh root@72.60.17.245
/opt/wa-monitor/prod/restart-monitor.sh  # Clears Python bytecode cache
```

## Projects Monitored

| Project  | WhatsApp Group JID          | Environment |
|----------|----------------------------|-------------|
| Lawley   | 120363418298130331@g.us    | Prod        |
| Mohadin  | 120363421532174586@g.us    | Prod        |
| Mamelodi | 120363408849234743@g.us    | Prod        |
| Velo Test| 120363421664266245@g.us    | Prod & Dev  |

## Development

### Test Drop
Use **`DRTEST001`** for testing (pre-created with 4 completed steps)

### Local Testing
```bash
npm run build
PORT=3005 npm start
# Visit: http://localhost:3005/wa-monitor
```

### Deploy to Dev
```bash
ssh root@72.60.17.245
cd /var/www/fibreflow-dev
git pull && rm -rf .next && npm run build && pm2 restart fibreflow-dev
# Visit: https://dev.fibreflow.app/wa-monitor
```

### Deploy to Production
```bash
ssh root@72.60.17.245
cd /var/www/fibreflow
git pull && npm ci && npm run build && pm2 restart fibreflow-prod
# Visit: https://app.fibreflow.app/wa-monitor
```

## Troubleshooting

### Changes not showing after deployment?
**Cause**: Browser cache holding old JavaScript files

**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5 or Cmd+Shift+R)
3. In DevTools: Right-click Refresh → "Empty Cache and Hard Reload"

### Text inputs not appearing?
**Cause**: Old JavaScript bundle cached

**Fix**:
```bash
# Force clean rebuild on server
cd /var/www/fibreflow[-dev]
rm -rf .next
npm run build
pm2 restart fibreflow-[prod|dev]
```

### WA Monitor agent not capturing messages?
```bash
ssh root@72.60.17.245
/opt/wa-monitor/prod/restart-monitor.sh  # Use safe restart!
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log
```

## Related Documentation

- `CLAUDE.md` - Complete WA Monitor system overview
- `/docs/wa-monitor/WA_MONITOR_ARCHITECTURE_V2.md` - Agent architecture
- `/docs/wa-monitor/PYTHON_CACHE_ISSUE.md` - VPS Python cache problems
- `/docs/wa-monitor/WA_MONITOR_ADD_PROJECT_5MIN.md` - Add new WhatsApp groups
- `/docs/wa-monitor/WA_MONITOR_DATA_FLOW_REPORT.md` - Data flow investigation
- `/docs/wa-monitor/WA_MONITOR_LOCKING_SYSTEM.md` - Edit locking system

## Version History

| Date | Version | Changes |
|------|---------|---------|
| Jan 6, 2025 | 1.0 | Initial WA Monitor dashboard |
| Nov 17, 2025 | 2.0 | **Incorrect photo marking** - Text input approach |

---

**Last Updated**: November 17, 2025
**Current Version**: 2.0 (Text Input Approach)
**Status**: ✅ Production Ready
**Architecture**: Modular "Lego Block" Pattern
