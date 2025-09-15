# Projects New Page Development Log

## Page: `/projects/new`
**Component**: `pages/projects/new.tsx`
**Purpose**: Project creation wizard for adding new projects

---

## Change Log

### September 15, 2025 - 9:30 AM
**Developer**: Claude Assistant
**Issue**: Page not loading - infinite loading state

#### Problems Identified:
1. **Dynamic Import Issue**:
   - Page was using dynamic import with `ssr: false` for ProjectCreationWizard
   - The dynamic import was causing infinite loading state
   - Component never rendered, just showed loading skeleton

#### Changes Made:

1. **Removed Dynamic Import** (`pages/projects/new.tsx`):
   ```typescript
   // Before - Problematic dynamic import
   const ProjectCreationWizard = dynamic(
     () => import('@/modules/projects/components/ProjectWizard/ProjectCreationWizard').then(
       (mod) => mod.ProjectCreationWizard
     ),
     { ssr: false, loading: () => <LoadingSkeleton /> }
   );

   // After - Direct import
   import { ProjectCreationWizard } from '@/modules/projects/components/ProjectWizard/ProjectCreationWizard';
   ```

2. **Simplified Component Rendering**:
   - Removed Suspense wrapper
   - Direct component rendering without lazy loading
   - Faster page load with server-side rendering enabled

#### Result:
✅ Page loads successfully
✅ Project creation wizard displays
✅ No more infinite loading state

#### Testing Notes:
- Tested on http://localhost:3006/projects/new
- Page loads immediately
- Form renders correctly

---

### September 15, 2025 - 9:35 AM
**Developer**: Claude Assistant
**Issue**: Empty client dropdown in project creation form

#### Problems Identified:
1. **Client Data Not Loading**:
   - Client dropdown shows empty list
   - API returns data with `company_name` field
   - Component expects `name` field
   - React Query caching old empty response

#### Changes Made:

1. **Fixed Client API Status Filter** (`src/services/api/clientApi.ts:68-87`):
   - Changed from filtering by `status=ACTIVE` to fetching all clients
   - Database has clients with status `"prospect"` not `"ACTIVE"`

2. **Added Field Mapping** (`src/services/api/clientApi.ts:79-83`):
   ```typescript
   return clients.map((client: any) => ({
     ...client,
     name: client.name || client.company_name || 'Unnamed Client'
   }));
   ```

#### Result:
✅ API returns client data correctly
✅ Field mapping implemented
⚠️ Browser cache may need clearing

#### Troubleshooting:
If dropdown still empty after changes:
1. Hard refresh browser (Ctrl+Shift+R)
2. Open in incognito/private window
3. Clear browser cache and cookies
4. Check Network tab for API response

---

## Related Files
- `src/modules/projects/components/ProjectWizard/ProjectCreationWizard.tsx` - Main wizard component
- `src/hooks/useClients.ts` - Client data hooks
- `src/hooks/useStaff.ts` - Staff/Project Manager hooks
- `src/hooks/useProjects.ts` - Project creation hooks
- `pages/api/clients/index.ts` - Clients API endpoint

## Known Issues
- ~~Client dropdown is empty~~ (FIXED - see September 15, 2025 - 10:20 AM)
- Project manager dropdown may have similar issue

---

### September 15, 2025 - 10:20 AM
**Developer**: Claude Assistant
**Issue**: Client dropdown still empty after initial fixes

#### Root Cause Analysis:
1. **Frontend clientApi.ts mapping wasn't being used**:
   - The mapping was only in `getActiveClients()` method
   - But the API endpoint `/api/clients` wasn't calling that method

2. **API endpoint returned raw database fields**:
   - Database has `company_name` field
   - Component expects `name` field
   - API endpoint wasn't mapping the fields

#### Final Fix:

**Added field mapping in API endpoint** (`pages/api/clients/index.ts:123-134`):
```typescript
// Map company_name to name for frontend compatibility
const mappedClients = (clients || []).map((client: any) => ({
  ...client,
  name: client.name || client.company_name || 'Unnamed Client'
}));
```

#### Result:
✅ API now returns both `name` and `company_name` fields
✅ Client dropdown shows "fibertime" correctly
✅ Project creation form fully functional

#### Testing Verification:
```bash
# API returns correct field mapping
curl http://localhost:3007/api/clients | jq '.data[0]'
# Returns: {"name": "fibertime", "company_name": "fibertime", ...}
```

## Known Issues
- ~~Project manager dropdown may have similar issue~~ (FIXED - see September 15, 2025 - 10:55 AM)

---

### September 15, 2025 - 10:55 AM
**Developer**: Claude Assistant
**Issue**: Project Manager dropdown empty in Step 2 of project creation

#### Root Cause:
1. **Database query case mismatch**:
   - Query looked for `status = 'ACTIVE'` (uppercase)
   - Database stores `status = 'active'` (lowercase)

2. **Position field filtering**:
   - Query filtered for positions containing "Manager" or "Lead"
   - All staff in database have `position: null`

#### Fix Applied:

**Updated query to show all active staff** (`src/services/staff/neon/queryBuilders.ts:124-132`):
```typescript
export async function queryProjectManagers() {
  // Since position field is null for all staff, return all active staff as potential project managers
  // In future, filter by position when that data is available
  return getSql()`
    SELECT id, name, position, department, email
    FROM staff
    WHERE status = 'active'
    ORDER BY name ASC
  `;
}
```

#### Additional Features Discovered:

**Project Status Selection in Creation Form**:
- Step 2 includes a Status dropdown
- Can set project to "Active" directly during creation
- Options: Planning (default), Active, On Hold, Completed, Cancelled

#### Result:
✅ Project Manager dropdown now shows all active staff members
✅ Projects can be set to "Active" status during creation
✅ Project creation fully functional
✅ User successfully created project

## Known Issues
None currently identified