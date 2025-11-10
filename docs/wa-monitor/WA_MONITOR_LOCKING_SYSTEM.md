# WA Monitor Multi-User Locking System

## Date Implemented
**November 10, 2025**

## Problem Statement
Auto-refresh (every 30 seconds) was wiping user's checkbox selections while they were still making changes, causing frustration and lost work.

**User Report:**
> "die WA Monitor sal elke nou en dan my selection van tickboxes wipe terwyl ek nog besig is met die selection"
> (Translation: "The WA Monitor will occasionally wipe my checkbox selections while I'm still busy with the selection")

## Solution Overview
Implemented a **multi-user locking system** that prevents concurrent edits and disables auto-refresh while editing.

---

## Features

### 1. Edit Mode Protection
- Checkboxes are **disabled by default** (read-only mode)
- Click **"Edit"** button to enable editing
- Acquires database lock to prevent concurrent modifications
- Auto-refresh **disabled** while editing (prevents checkbox wipes)
- Blue info alert: "✏️ Editing mode active - Auto-refresh disabled for this drop"

### 2. Multi-User Conflict Prevention
- If User A is editing a drop, User B sees:
  - 🔒 Yellow warning: "Currently being edited by User A"
  - Edit button is **disabled**
- Lock expires after **5 minutes** of inactivity (safety timeout)

### 3. Save/Cancel Workflow
**Save:**
- Saves all changes to database
- Releases lock
- Returns to read-only mode

**Cancel:**
- Reverts ALL changes to original state
- Releases lock
- Returns to read-only mode

### 4. Automatic Cleanup
- If user closes browser/navigates away while editing
- Component unmount automatically releases lock
- Prevents stuck locks

---

## Technical Implementation

### Database Schema

**Table:** `qa_photo_reviews`

**New Columns:**
```sql
ALTER TABLE qa_photo_reviews
ADD COLUMN locked_by VARCHAR(255),
ADD COLUMN locked_at TIMESTAMP;
```

**Purpose:**
- `locked_by`: Username of person currently editing (NULL if unlocked)
- `locked_at`: Timestamp when lock was acquired (used for 5-minute timeout)

### API Endpoints

#### 1. Lock Drop
**Endpoint:** `POST /api/wa-monitor-drops/[id]/lock`

**Request Body:**
```json
{
  "userName": "Louis Duplessis"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "locked": true,
    "lockedBy": "Louis Duplessis",
    "lockedAt": "2025-11-10T13:45:00.000Z"
  }
}
```

**Conflict Response (409):**
```json
{
  "success": false,
  "error": {
    "code": "LOCKED_BY_ANOTHER_USER",
    "message": "Drop is currently being edited by John Doe",
    "lockedBy": "John Doe",
    "lockedAt": "2025-11-10T13:40:00.000Z"
  }
}
```

**Features:**
- Checks if already locked (within 5-minute window)
- Allows lock refresh if same user
- Returns 409 if locked by different user
- Automatically expires locks older than 5 minutes

#### 2. Unlock Drop
**Endpoint:** `POST /api/wa-monitor-drops/[id]/unlock`

**Request Body:**
```json
{
  "userName": "Louis Duplessis"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "unlocked": true
  }
}
```

**Forbidden Response (403):**
```json
{
  "success": false,
  "error": {
    "code": "LOCKED_BY_ANOTHER_USER",
    "message": "Drop is locked by John Doe. Only they can unlock it.",
    "lockedBy": "John Doe"
  }
}
```

**Features:**
- Validates lock ownership
- Only the person who locked can unlock
- Clears `locked_by` and `locked_at` columns

---

## Frontend Implementation

### Component: QaReviewCard.tsx

**New State Variables:**
```typescript
const [isEditing, setIsEditing] = useState(false);
const [isLocked, setIsLocked] = useState(false);
const [lockError, setLockError] = useState<string | null>(null);
const [currentUser] = useState('Louis Duplessis'); // TODO: Get from Clerk auth
```

**Lock Check Effect:**
```typescript
useEffect(() => {
  if (drop.lockedBy && drop.lockedBy !== currentUser) {
    setIsLocked(true);
    setLockError(`Currently being edited by ${drop.lockedBy}`);
  } else if (drop.lockedBy === currentUser) {
    // We have the lock
    setIsLocked(true);
    setIsEditing(true);
  } else {
    setIsLocked(false);
    setLockError(null);
  }
}, [drop.lockedBy, currentUser]);
```

**Cleanup Effect (Auto-Unlock):**
```typescript
useEffect(() => {
  return () => {
    // Cleanup: unlock on unmount if editing
    if (isEditing) {
      unlockDrop(drop.id, currentUser).catch(console.error);
    }
  };
}, [isEditing, drop.id, currentUser]);
```

**Edit Handler:**
```typescript
const handleEdit = async () => {
  try {
    setSaving(true);
    const result = await lockDrop(drop.id, currentUser);

    if (!result.locked) {
      // Someone else has the lock
      setLockError(result.error || 'Drop is locked by another user');
      setIsLocked(true);
      return;
    }

    // Lock acquired - enable editing
    setIsEditing(true);
    setIsLocked(true);
    setLockError(null);
  } catch (error) {
    console.error('Error acquiring lock:', error);
    setLockError('Failed to acquire lock');
  } finally {
    setSaving(false);
  }
};
```

**Save Handler (Modified):**
```typescript
const handleSave = async () => {
  try {
    setSaving(true);

    // Save changes to database
    await onUpdate(drop.id, {
      ...steps,
      comment,
      incomplete: completedSteps < totalSteps,
      completed: completedSteps === totalSteps,
    });

    // Unlock the drop
    await unlockDrop(drop.id, currentUser);

    // Exit edit mode
    setIsEditing(false);
    setIsLocked(false);
    setLockError(null);
  } catch (error) {
    console.error('Error saving:', error);
  } finally {
    setSaving(false);
  }
};
```

**Cancel Handler:**
```typescript
const handleCancel = async () => {
  try {
    setSaving(true);

    // Revert all changes
    setSteps({ /* original values from drop prop */ });
    setComment(drop.comment || '');

    // Unlock the drop
    await unlockDrop(drop.id, currentUser);

    // Exit edit mode
    setIsEditing(false);
    setIsLocked(false);
    setLockError(null);
  } catch (error) {
    console.error('Error canceling:', error);
  } finally {
    setSaving(false);
  }
};
```

**Checkbox Disabled Logic:**
```typescript
<Checkbox
  checked={steps[stepKey]}
  onChange={() => handleStepChange(stepKey)}
  size="small"
  disabled={!isEditing}  // Only enabled when editing
/>
```

**UI Button Logic:**
```typescript
{!isEditing ? (
  // Read-only mode - show Edit button
  <Button
    variant="outlined"
    startIcon={<Edit size={16} />}
    onClick={handleEdit}
    disabled={isLocked && drop.lockedBy !== currentUser}
  >
    Edit
  </Button>
) : (
  // Edit mode - show Save and Cancel
  <>
    <Button startIcon={<X size={16} />} onClick={handleCancel}>
      Cancel
    </Button>
    <Button startIcon={<Save size={16} />} onClick={handleSave}>
      Save
    </Button>
  </>
)}
```

---

### Component: WaMonitorDashboard.tsx

**Skip Auto-Refresh for Locked Drops:**
```typescript
// Only update drops that aren't currently being edited
setDrops((prevDrops) => {
  if (prevDrops.length === 0) {
    // First load - use all fetched drops
    return fetchedDrops;
  }

  return fetchedDrops.map(newDrop => {
    const existingDrop = prevDrops.find(d => d.id === newDrop.id);

    // If drop is locked by current user, keep old data (don't overwrite edits)
    if (existingDrop?.lockedBy && existingDrop.lockedBy === 'Louis Duplessis') {
      return existingDrop;
    }

    // Otherwise use new data
    return newDrop;
  });
});
```

**Why This Works:**
- Auto-refresh still fetches latest data every 30 seconds
- But for drops locked by current user, old state is preserved
- Prevents checkbox selections from being wiped
- Other users still see real-time updates for unlocked drops

---

## User Experience Flow

### Scenario 1: Single User Editing

**1. Read-Only Mode (Default)**
```
┌─────────────────────────────────────┐
│ DR0000021          [Edit]           │
│ ☐ Step 1 (greyed out)               │
│ ☐ Step 2 (greyed out)               │
│ ...                                 │
└─────────────────────────────────────┘
```

**2. Click "Edit" Button**
```
┌─────────────────────────────────────┐
│ DR0000021    [Cancel] [Save]        │
│ ✏️ Editing mode active               │
│ ☑ Step 1 (enabled - can click)     │
│ ☐ Step 2 (enabled - can click)     │
│ ...                                 │
└─────────────────────────────────────┘
```
- Lock acquired from database
- Checkboxes enabled
- Blue info alert shows
- Auto-refresh skips this drop

**3. Make Changes**
- User ticks 5 checkboxes
- 30 seconds pass (auto-refresh happens)
- **Checkboxes stay ticked** ✅ (problem solved!)

**4. Save Changes**
```
┌─────────────────────────────────────┐
│ DR0000021          [Edit]           │
│ ☑ Step 1 (greyed out)               │
│ ☑ Step 2 (greyed out)               │
│ ...                                 │
└─────────────────────────────────────┘
```
- Changes saved to database
- Lock released
- Returns to read-only mode

### Scenario 2: Multi-User Conflict

**User A:**
```
┌─────────────────────────────────────┐
│ DR0000021    [Cancel] [Save]        │
│ ✏️ Editing mode active               │
│ ☑ Step 1 (enabled)                  │
└─────────────────────────────────────┘
```

**User B (Different Browser/Machine):**
```
┌─────────────────────────────────────┐
│ DR0000021          [Edit] (disabled)│
│ 🔒 Currently being edited by User A │
│ ☐ Step 1 (greyed out)               │
└─────────────────────────────────────┘
```
- Edit button is disabled
- Yellow warning shows who has the lock
- Cannot make changes until User A saves/cancels

---

## Code Statistics

| Metric | Value |
|--------|-------|
| **Total Lines Added** | 470 lines |
| **Files Changed** | 7 files |
| **Database Columns** | 2 columns |
| **API Endpoints** | 2 endpoints |
| **Components Updated** | 2 components |
| **Git Commits** | 3 commits |

### Files Modified

| File | Lines Changed | Description |
|------|--------------|-------------|
| `pages/api/wa-monitor-drops/[id]/lock.ts` | +110 | Lock acquisition endpoint |
| `pages/api/wa-monitor-drops/[id]/unlock.ts` | +86 | Lock release endpoint |
| `src/modules/wa-monitor/components/QaReviewCard.tsx` | +184, -15 | Edit mode UI and lock management |
| `src/modules/wa-monitor/components/WaMonitorDashboard.tsx` | +24, -1 | Skip auto-refresh for locked drops |
| `src/modules/wa-monitor/services/waMonitorApiService.ts` | +74 | lockDrop() and unlockDrop() helpers |
| `src/modules/wa-monitor/services/waMonitorService.ts` | +4 | Fetch lock status from DB |
| `src/modules/wa-monitor/types/wa-monitor.types.ts` | +2 | lockedBy and lockedAt fields |

---

## Configuration

### Lock Timeout
**Default:** 5 minutes

**Location:** `pages/api/wa-monitor-drops/[id]/lock.ts`
```typescript
const LOCK_TIMEOUT_MINUTES = 5;

// In SQL query:
AND locked_at > NOW() - INTERVAL '5 minutes'
```

**Why 5 minutes?**
- Long enough for normal QA review (typically 2-3 minutes)
- Short enough to auto-recover from crashed browsers
- Prevents indefinite stuck locks

**To Change:** Edit the constant and SQL query, then rebuild

### Current User
**Default:** Hardcoded as "Louis Duplessis"

**Location:** `src/modules/wa-monitor/components/QaReviewCard.tsx`
```typescript
const [currentUser] = useState('Louis Duplessis'); // TODO: Get from Clerk auth
```

**TODO:** Integrate with Clerk authentication to get actual logged-in user

---

## Testing

### Manual Test Cases

#### Test 1: Basic Edit Flow
1. Go to https://app.fibreflow.app/wa-monitor
2. Click **Edit** on any drop
3. Verify: Checkboxes become enabled
4. Tick 3 checkboxes
5. Wait 30 seconds (auto-refresh)
6. Verify: Checkboxes **still ticked** ✅
7. Click **Save**
8. Verify: Returns to read-only mode

**Expected Result:** ✅ Changes preserved during auto-refresh

#### Test 2: Cancel Reverts Changes
1. Click **Edit** on a drop
2. Tick 5 checkboxes
3. Add comment: "Test comment"
4. Click **Cancel**
5. Verify: All checkboxes reverted
6. Verify: Comment cleared

**Expected Result:** ✅ All changes reverted

#### Test 3: Multi-User Conflict
1. Open dashboard in **two browsers** (or incognito)
2. **Browser 1:** Click Edit on DR0000021
3. **Browser 2:** Try to click Edit on DR0000021
4. Verify: Browser 2 shows warning "🔒 Currently being edited by Louis Duplessis"
5. Verify: Edit button disabled in Browser 2
6. **Browser 1:** Click Save
7. Wait 30 seconds (for auto-refresh)
8. **Browser 2:** Verify Edit button becomes enabled

**Expected Result:** ✅ Conflict detected and prevented

#### Test 4: Lock Timeout (5 Minutes)
1. Click **Edit** on a drop
2. Wait **6 minutes** without clicking Save/Cancel
3. Refresh the page
4. Click **Edit** again
5. Verify: Lock acquired successfully (expired lock was released)

**Expected Result:** ✅ Expired lock auto-released

#### Test 5: Browser Close Cleanup
1. Click **Edit** on a drop
2. **Close browser tab** without saving
3. Open dashboard in new tab
4. Click **Edit** on same drop
5. Verify: Lock acquired successfully

**Expected Result:** ✅ Lock released on unmount

---

## Troubleshooting

### Issue: "Failed to acquire lock" error

**Symptoms:**
- User clicks Edit
- Red error message: "🔒 Failed to acquire lock"
- Console shows 500 error

**Possible Causes:**
1. Database connection issue
2. SQL syntax error in lock endpoint
3. Invalid user name

**Solution:**
```bash
# Check PM2 logs
ssh root@72.60.17.245 "pm2 logs fibreflow-prod --lines 50 | grep lock"

# Check if columns exist
psql $DATABASE_URL -c "SELECT locked_by, locked_at FROM qa_photo_reviews LIMIT 1;"

# Verify API endpoint exists
ls /var/www/fibreflow/pages/api/wa-monitor-drops/[id]/lock.ts
```

### Issue: Lock stuck (cannot edit drop)

**Symptoms:**
- Edit button disabled
- Warning shows "Currently being edited by X"
- But no one is actually editing

**Cause:** Lock wasn't released (user closed browser, crashed, etc.)

**Solution 1: Wait 5 Minutes** (auto-expires)

**Solution 2: Manual Unlock**
```sql
-- Find stuck locks
SELECT drop_number, locked_by, locked_at
FROM qa_photo_reviews
WHERE locked_by IS NOT NULL
  AND locked_at < NOW() - INTERVAL '10 minutes';

-- Manually clear lock
UPDATE qa_photo_reviews
SET locked_by = NULL, locked_at = NULL
WHERE drop_number = 'DR0000021';
```

### Issue: Auto-refresh still wiping changes

**Symptoms:**
- User clicks Edit
- Ticks checkboxes
- After 30 seconds, checkboxes reset

**Possible Causes:**
1. Dashboard not skipping locked drops
2. User name mismatch

**Solution:**
```typescript
// Check WaMonitorDashboard.tsx line 60
if (existingDrop?.lockedBy && existingDrop.lockedBy === 'Louis Duplessis') {
  return existingDrop; // This should preserve old state
}

// Verify user name matches
console.log('Current User:', currentUser);
console.log('Locked By:', drop.lockedBy);
// These must match exactly (case-sensitive)
```

---

## Future Enhancements

### 1. Clerk Authentication Integration
**Current:** Hardcoded username
**Goal:** Get username from Clerk auth context

```typescript
import { useUser } from '@clerk/nextjs';

export const QaReviewCard = memo(function QaReviewCard({ drop, onUpdate, onSendFeedback }: QaReviewCardProps) {
  const { user } = useUser();
  const [currentUser] = useState(user?.fullName || 'Unknown User');
  // ... rest of component
});
```

### 2. Lock Status Indicator on Card Header
**Show lock icon on card title**

```typescript
<CardHeader
  title={
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="h6">{drop.dropNumber}</Typography>
      {drop.lockedBy && (
        <Tooltip title={`Editing: ${drop.lockedBy}`}>
          <Lock size={16} color="orange" />
        </Tooltip>
      )}
    </Box>
  }
/>
```

### 3. Force Unlock (Admin Only)
**Allow admins to forcefully unlock stuck locks**

```typescript
// Admin force unlock endpoint
POST /api/wa-monitor-drops/[id]/force-unlock
// Body: { adminUser: "Admin Name" }

// Bypasses ownership check
UPDATE qa_photo_reviews
SET locked_by = NULL, locked_at = NULL
WHERE id = $1;
```

### 4. Lock Activity Log
**Track who locked/unlocked when**

```sql
CREATE TABLE lock_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'lock' or 'unlock'
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Real-Time Lock Notifications
**Notify User B when User A finishes editing**

- Use WebSocket or Server-Sent Events
- Push notification: "DR0000021 is now available for editing"
- Auto-enable Edit button without refresh

---

## Performance Impact

### Database Queries Added

**On Page Load:**
```sql
-- Existing query already fetches locked_by and locked_at
SELECT *, locked_by, locked_at FROM qa_photo_reviews;
```
**Impact:** Negligible (2 extra columns in SELECT)

**On Edit Click:**
```sql
-- Lock acquisition
SELECT locked_by, locked_at FROM qa_photo_reviews
WHERE id = $1 AND locked_by IS NOT NULL
  AND locked_at > NOW() - INTERVAL '5 minutes';

UPDATE qa_photo_reviews
SET locked_by = $1, locked_at = NOW()
WHERE id = $2;
```
**Impact:** 2 queries per edit (very fast, indexed on id)

**On Save/Cancel:**
```sql
UPDATE qa_photo_reviews
SET locked_by = NULL, locked_at = NULL
WHERE id = $1;
```
**Impact:** 1 query (instant)

### Network Traffic
- Lock API call: ~500 bytes
- Unlock API call: ~300 bytes
- Total per edit session: ~800 bytes

**Impact:** Negligible (smaller than one image)

### Auto-Refresh Optimization
**Before:** Refreshed all drops every 30s
**After:** Skips locked drops (preserves local state)

**Impact:** Slightly reduced re-renders for locked cards

---

## Security Considerations

### 1. User Name Validation
**Current:** Client provides username
**Risk:** User could impersonate others

**Mitigation (Future):**
```typescript
// Get user from Clerk session (server-side)
const { userId } = getAuth(req);
const user = await clerkClient.users.getUser(userId);
const userName = user.fullName;
```

### 2. Lock Ownership Bypass
**Current:** Cannot unlock someone else's lock
**Risk:** None (working as intended)

**Note:** Admin force-unlock should be protected by role check

### 3. SQL Injection
**Current:** Using parameterized queries (Neon template literals)
**Risk:** None

```typescript
// ✅ Safe
await sql`SELECT * FROM qa_photo_reviews WHERE id = ${id}`;

// ❌ Unsafe (NOT used)
await sql`SELECT * FROM qa_photo_reviews WHERE id = '${id}'`;
```

### 4. Expired Lock Check
**Current:** 5-minute server-side timeout
**Risk:** None (prevents indefinite locks)

---

## Lessons Learned

### 1. Auto-Refresh Trade-Offs
**Challenge:** Real-time updates vs preserving user input

**Solution:** Conditional refresh based on edit state
- Locked drops: Preserve local state
- Unlocked drops: Use fresh data

### 2. Lock Timeout Balance
**Too Short (< 2 min):** Interrupts normal QA reviews
**Too Long (> 10 min):** Stuck locks frustrate other users
**Sweet Spot:** 5 minutes

### 3. Edit Mode as Explicit State
**Better UX:** Clear Edit → Save/Cancel workflow
- Users know when they're editing
- Prevents accidental changes
- Clear visual feedback

### 4. Neon Serverless SQL Limitations
**Issue:** Template literals inside INTERVAL don't work

```typescript
// ❌ Doesn't work
INTERVAL '${LOCK_TIMEOUT_MINUTES} minutes'

// ✅ Works
INTERVAL '5 minutes'
```

**Lesson:** Hardcode SQL constants, don't use template literals

---

## Related Documentation

- `WA_MONITOR_ARCHITECTURE_V2.md` - Overall system architecture
- `WA_MONITOR_LESSONS_LEARNED.md` - Historical issues and solutions
- `WA_MONITOR_TIMEZONE_FIX_NOV2025.md` - SAST timezone implementation
- `WA_MONITOR_BRIDGE_FIX_NOV2025.md` - Bridge INSERT statement fix

---

## Deployment History

| Date | Commit | Description |
|------|--------|-------------|
| Nov 10, 2025 | b4c1b34 | Phase 1: Database + API layer |
| Nov 10, 2025 | 79afc6b | Phase 2: Frontend UI implementation |
| Nov 10, 2025 | 4b89eb0 | Fix: SQL INTERVAL syntax error |

---

## Contact & Maintenance

**Last Updated:** November 10, 2025
**Implemented By:** Claude Code
**Verified By:** Louis Duplessis
**Status:** ✅ Production (Working)

**If Lock System Issues Occur:**
1. Check server logs: `pm2 logs fibreflow-prod | grep lock`
2. Verify database columns exist: See Troubleshooting section
3. Check for stuck locks: See SQL queries above
4. Verify API endpoints built: `ls .next/server/pages/api/wa-monitor-drops/[id]/`
5. Review this document for common issues
