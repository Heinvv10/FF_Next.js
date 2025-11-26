# WA Monitor API Contract

**STATUS: FROZEN** 🔒
**Version:** 1.0.0
**Last Updated:** 2025-11-24

> **CRITICAL:** This API contract is FROZEN. Do NOT modify these endpoints without updating this document.
> The WA Monitor module depends on these exact response formats to function independently.

---

## Response Format Standard

All WA Monitor APIs use the following standardized response format:

### Success Response
```typescript
{
  success: true,
  data: T,                    // The actual data
  message?: string,           // Optional success message
  meta: {
    timestamp: string         // ISO timestamp
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,            // Error code enum
    message: string,         // Human-readable message
    details?: any            // Optional error details
  },
  meta: {
    timestamp: string
  }
}
```

---

## API Endpoints

### 1. GET /api/wa-monitor-drops

**Description:** Get all QA review drops with summary statistics

**Query Parameters:**
- `id` (optional): Get single drop by ID
- `status` (optional): Filter by status (`incomplete` | `complete`)

**Response:**
```typescript
{
  success: true,
  data: QaReviewDrop[],
  summary: {
    total: number,
    incomplete: number,
    complete: number,
    averageFeedbackCount: number,
    totalFeedback: number
  },
  meta: {
    timestamp: string
  }
}
```

**Data Types:**
```typescript
interface QaReviewDrop {
  id: string;
  dropNumber: string;
  status: 'incomplete' | 'complete';
  reviewDate: Date;
  userName: string;
  completedPhotos: number;
  outstandingPhotos: number;
  outstandingPhotosLoadedTo1map: boolean;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: string | null;
  assignedAgent: string | null;
  completed: boolean;
  incomplete: boolean;
  feedbackSent: Date | null;
  senderPhone: string | null;
  resubmitted: boolean;
  lockedBy: string | null;
  lockedAt: Date | null;
  incorrectSteps: string[];
  incorrectComments: Record<string, string>;
  step_01_house_photo: boolean;
  step_02_cable_from_pole: boolean;
  step_03_cable_entry_outside: boolean;
  step_04_cable_entry_inside: boolean;
  step_05_wall_for_installation: boolean;
  step_06_ont_back_after_install: boolean;
  step_07_power_meter_reading: boolean;
  step_08_ont_barcode: boolean;
  step_09_ups_serial: boolean;
  step_10_final_installation: boolean;
  step_11_green_lights: boolean;
  step_12_customer_signature: boolean;
}
```

---

### 2. GET /api/wa-monitor-daily-drops

**Description:** Get daily drops count per project for today

**Query Parameters:** None

**Response:**
```typescript
{
  success: true,
  data: {
    drops: Array<{
      date: string,           // YYYY-MM-DD
      project: string,
      count: number
    }>,
    total: number,
    date: string              // YYYY-MM-DD
  },
  meta: {
    timestamp: string
  }
}
```

**Example:**
```json
{
  "success": true,
  "data": {
    "drops": [
      { "date": "2025-11-24", "project": "Lawley", "count": 15 },
      { "date": "2025-11-24", "project": "Mohadin", "count": 8 },
      { "date": "2025-11-24", "project": "Velo Test", "count": 3 }
    ],
    "total": 26,
    "date": "2025-11-24"
  },
  "meta": {
    "timestamp": "2025-11-24T14:30:00.000Z"
  }
}
```

---

### 3. GET /api/wa-monitor-project-stats?project={projectName}

**Description:** Get real-time stats for a specific project

**Query Parameters:**
- `project` (required): Project name

**Response:**
```typescript
{
  success: true,
  data: {
    project: string,
    stats: {
      today: {
        total: number,
        complete: number,
        incomplete: number,
        completionRate: number
      },
      week: {
        total: number,
        complete: number,
        incomplete: number,
        completionRate: number
      },
      month: {
        total: number,
        complete: number,
        incomplete: number,
        completionRate: number
      },
      allTime: {
        total: number,
        complete: number,
        incomplete: number,
        completionRate: number
      }
    }
  },
  meta: {
    timestamp: string
  }
}
```

---

### 4. GET /api/wa-monitor-projects-summary

**Description:** Get comprehensive stats for all projects

**Query Parameters:**
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```typescript
{
  success: true,
  data: {
    total: number,
    complete: number,
    incomplete: number,
    completionRate: number,
    byProject: Array<{
      project: string,
      total: number,
      complete: number,
      completionRate: number,
      overallTotal: number,
      overallComplete: number,
      overallCompletionRate: number
    }>,
    overallStats: {
      totalInSystem: number,
      completedInSystem: number,
      systemCompletionRate: number
    },
    trends: {
      weekly: {
        total: number,
        complete: number,
        completionRate: number
      },
      monthly: {
        total: number,
        complete: number,
        completionRate: number
      }
    },
    outstanding: {
      totalIncomplete: number,
      needsAttention: number,
      recent: number
    },
    resubmissions: {
      total: number,
      rate: number,
      firstTimePassRate: number
    },
    commonFailures: Array<{
      step: string,
      count: number,
      percentage: number
    }>,
    feedbackStats: {
      sent: number,
      pending: number,
      sendRate: number
    },
    agentPerformance: Array<{
      agent: string,
      drops: number,
      completionRate: number
    }>
  },
  meta: {
    timestamp: string
  }
}
```

---

### 5. POST /api/wa-monitor-sync-sharepoint

**Description:** Sync daily drops to SharePoint

**Request Body:**
```typescript
{
  date?: string  // Optional: YYYY-MM-DD (defaults to today)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    succeeded: number,
    failed: number,
    total: number,
    message: string,
    date: string,
    projects: Array<{
      date: string,
      project: string,
      count: number
    }>
  },
  meta: {
    timestamp: string
  }
}
```

---

### 6. POST /api/wa-monitor-sync-sharepoint-test

**Description:** Test endpoint for syncing specific date's drops to SharePoint

**Request Body:**
```typescript
{
  testDate?: string  // Optional: YYYY-MM-DD (defaults to yesterday)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    testDate: string,
    succeeded: number,
    failed: number,
    total: number,
    message: string,
    drops: Array<{
      date: string,
      project: string,
      count: number
    }>
  },
  meta: {
    timestamp: string
  }
}
```

---

## Error Codes

All error responses use these standardized codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Invalid request format |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not allowed |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `DATABASE_ERROR` | 500 | Database operation failed |

---

## Breaking Changes Policy

**Any changes to these contracts are considered BREAKING CHANGES and require:**

1. Version bump in this document
2. Update WA Monitor frontend services (`waMonitorApiService.ts`)
3. Testing in dev environment
4. User notification before deployment
5. Documentation update in CHANGELOG.md

---

## Testing Endpoints

### Test WA Monitor Independence

```bash
# 1. Test daily drops
curl http://localhost:3005/api/wa-monitor-daily-drops | jq .

# 2. Test all drops
curl http://localhost:3005/api/wa-monitor-drops | jq .

# 3. Test project stats
curl "http://localhost:3005/api/wa-monitor-project-stats?project=Lawley" | jq .

# 4. Test projects summary
curl http://localhost:3005/api/wa-monitor-projects-summary | jq .
```

---

## Module Dependencies

**The WA Monitor module uses ONLY these internal dependencies:**

✅ **Internalized:**
- `@/modules/wa-monitor/lib/apiResponse` - API response helper (frozen copy)

✅ **External (npm packages - safe):**
- `@neondatabase/serverless` - Database client
- `next` - Next.js framework
- `react`, `react-query` - Frontend framework
- `@mui/material` - UI components
- `date-fns` - Date utilities

❌ **NO dependencies on:**
- `@/lib/*` - Main app utilities
- `@/services/*` - Main app services
- `@/components/*` - Main app components (except AppLayout for navigation)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-24 | Initial frozen API contract |

---

**Remember:** This module is designed to work independently. Treat it like a separate microservice!
