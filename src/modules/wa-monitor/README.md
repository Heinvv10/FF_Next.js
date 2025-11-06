# WA Monitor Module

WhatsApp QA Drop Monitoring System - Real-time tracking of drop numbers from Velo Test WhatsApp Monitor.

## Overview

This module provides a live dashboard for monitoring QA review drops synced from WhatsApp to the Neon PostgreSQL database. It displays drop status, feedback counts, and timestamps in an interactive data grid with auto-refresh functionality.

## Module Structure

```
src/modules/wa-monitor/
├── types/
│   └── wa-monitor.types.ts          # Type definitions
├── services/
│   ├── waMonitorService.ts          # Backend database operations
│   └── waMonitorApiService.ts       # Frontend API client
├── utils/
│   └── waMonitorHelpers.ts          # Helper functions (formatting, filtering, export)
├── components/
│   ├── DropStatusBadge.tsx          # Status badge component
│   ├── WaMonitorGrid.tsx            # MUI Data Grid component
│   ├── WaMonitorDashboard.tsx       # Main dashboard component
│   └── index.ts                     # Component exports
└── README.md                        # This file
```

## Database Schema

**Table:** `qa_reviews`

```sql
CREATE TABLE qa_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drop_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'incomplete',
    feedback_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);
```

## API Endpoints

### GET /api/wa-monitor-drops

**Get All Drops:**
```
GET /api/wa-monitor-drops
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "dropNumber": "DR12345678",
      "status": "incomplete",
      "feedbackCount": 3,
      "createdAt": "2025-01-06T10:00:00Z",
      "updatedAt": "2025-01-06T10:00:00Z",
      "completedAt": null,
      "notes": null
    }
  ],
  "summary": {
    "total": 100,
    "incomplete": 35,
    "complete": 65,
    "averageFeedbackCount": 2.5,
    "totalFeedback": 250
  }
}
```

**Get Single Drop:**
```
GET /api/wa-monitor-drops?id={uuid}
```

**Get Drops by Status:**
```
GET /api/wa-monitor-drops?status=incomplete
GET /api/wa-monitor-drops?status=complete
```

## Features

### Dashboard Features
- ✅ Real-time data grid with MUI Data Grid
- ✅ Auto-refresh every 30 seconds
- ✅ Summary cards (Total, Incomplete, Complete, Total Feedback)
- ✅ Status badges (Red=Incomplete, Green=Complete)
- ✅ Sorting and filtering
- ✅ Quick search by drop number
- ✅ Export to CSV
- ✅ Timezone-aware timestamps
- ✅ Responsive layout

### Grid Columns
1. **Drop Number** - Unique identifier (DR########)
2. **Status** - Visual badge (Incomplete/Complete)
3. **Feedback Count** - Number of feedback items
4. **Created At** - When drop was created (relative time)
5. **Updated At** - Last update timestamp (relative time)
6. **Completed At** - Completion timestamp (relative time, nullable)
7. **Notes** - Optional notes field

## Usage

### Access the Dashboard

Navigate to: **`/wa-monitor`**

Or click **WA Monitor** in the sidebar under **Field Operations**.

### Import Components

```tsx
import {
  WaMonitorDashboard,
  WaMonitorGrid,
  DropStatusBadge
} from '@/modules/wa-monitor/components';

// Use in your page
<WaMonitorDashboard />
```

### Use API Service

```tsx
import { fetchAllDrops, fetchDropById } from '@/modules/wa-monitor/services/waMonitorApiService';

// Fetch all drops
const { drops, summary } = await fetchAllDrops();

// Fetch single drop
const drop = await fetchDropById('uuid');
```

## Configuration

### Auto-Refresh Interval

Default: **30 seconds**

To change, edit `WaMonitorDashboard.tsx`:
```tsx
const AUTO_REFRESH_INTERVAL = 30000; // Change to desired ms
```

### Database Connection

Uses Neon PostgreSQL with environment variable:
```
DATABASE_URL=your_neon_connection_string
```

## Navigation

Menu added to **Field Operations** section:
- Icon: MessageSquare (💬)
- Label: "WA Monitor"
- Route: `/wa-monitor`

Location: `src/components/layout/sidebar/config/fieldOperationsSection.ts:32-37`

## Integration Points

### Velo Test WhatsApp Monitor
This module receives drop data from the Velo Test WhatsApp Monitor system, which syncs to:
1. Neon PostgreSQL (this integration)
2. Google Sheets
3. SharePoint

Drop numbers follow the format: `DR########` (e.g., DR12345678)

## Type Definitions

### Main Types

```typescript
// Drop status
type DropStatus = 'incomplete' | 'complete';

// QA Review Drop
interface QaReviewDrop {
  id: string;
  dropNumber: string;
  status: DropStatus;
  feedbackCount: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  notes: string | null;
}

// Summary statistics
interface WaMonitorSummary {
  total: number;
  incomplete: number;
  complete: number;
  averageFeedbackCount: number;
  totalFeedback: number;
}
```

## Helper Functions

### Formatting
- `formatDateTime(date)` - Format date to "Jan 6, 2025 2:30 PM"
- `formatRelativeTime(date)` - Format to "2 hours ago"
- `formatDate(date)` - Format to "Jan 6, 2025"

### Filtering
- `filterDropsBySearch(drops, searchTerm)`
- `filterDropsByStatus(drops, statuses)`
- `filterDropsByDateRange(drops, startDate, endDate)`

### Sorting
- `sortDrops(drops, field, order)`

### Export
- `convertDropsToCSV(drops)` - Convert to CSV format
- `downloadCSV(drops, filename)` - Download CSV file

## Testing

### Test the Build
```bash
npm run build
```

### Test the API
```bash
# Start the server
PORT=3005 npm start

# Test API endpoint
curl http://localhost:3005/api/wa-monitor-drops
```

### Test the Dashboard
1. Start the server: `PORT=3005 npm start`
2. Navigate to: `http://localhost:3005/wa-monitor`
3. Verify:
   - Data loads in grid
   - Summary cards show correct counts
   - Status badges display correctly
   - Auto-refresh works (check console every 30s)
   - Export CSV works
   - Search and filtering works

## Future Enhancements

Possible improvements:
- [ ] Real-time updates via WebSockets/SSE
- [ ] Edit drop status inline
- [ ] Add notes to drops
- [ ] Filter by date range in UI
- [ ] Export to Excel with formatting
- [ ] Drop detail view modal
- [ ] Bulk status updates
- [ ] Email notifications for incomplete drops
- [ ] Chart/graph visualizations

## Troubleshooting

### No data appears
- Check database connection: `DATABASE_URL` in `.env.production`
- Verify `qa_reviews` table exists
- Check API response: `/api/wa-monitor-drops`

### Auto-refresh not working
- Check console for errors
- Verify interval is set correctly
- Check network tab for API calls

### Export not working
- Check browser console for errors
- Verify drops data is loaded
- Check browser download settings

## Dependencies

- **@mui/x-data-grid** - Data grid component
- **@mui/material** - Material UI components
- **@neondatabase/serverless** - Neon database client
- **date-fns** - Date formatting
- **lucide-react** - Icons

## Created

**Date:** January 6, 2025
**Author:** Claude Code
**Architecture:** Modular "Lego Block" Pattern
