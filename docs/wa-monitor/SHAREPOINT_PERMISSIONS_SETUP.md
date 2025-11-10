# SharePoint Edit Permissions Setup Guide

**Date**: November 10, 2025
**Issue**: WA Monitor SharePoint sync fails with "EditModeAccessDenied" (HTTP 403)
**Solution**: Grant `Sites.ReadWrite.All` permission to Azure App Registration

---

## Prerequisites

- ✅ Microsoft 365 Global Administrator or Application Administrator role
- ✅ Access to Azure Portal
- ✅ App Client ID: `f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56`

---

## Step-by-Step Instructions

### Step 1: Access Azure Portal

1. **Open browser** and go to: https://portal.azure.com
2. **Sign in** with your Microsoft 365 admin account
3. **Wait** for the Azure Portal dashboard to load

**Screenshot hint**: You should see "Microsoft Azure" header at the top

---

### Step 2: Navigate to App Registrations

1. **Click** on the hamburger menu (≡) in the top-left corner
2. **Search** for "Azure Active Directory" or "Microsoft Entra ID" in the search bar
3. **Click** on "Azure Active Directory" (or "Microsoft Entra ID")
4. In the left sidebar, **click** "App registrations"

**Navigation path**:
```
Azure Portal → Azure Active Directory → App registrations
```

**Screenshot hint**: Left sidebar should show:
- Overview
- Manage
  - Users
  - Groups
  - **App registrations** ← Click here

---

### Step 3: Find the SharePoint App

1. **Make sure** "All applications" tab is selected (not "Owned applications")
2. **Search** for the app using Client ID: `f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56`
   - Paste the Client ID into the search box
   - **OR** search by application name if you know it

3. **Click** on the app when it appears in the results

**What you're looking for**:
- Application (client) ID: `f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56`
- Directory (tenant) ID: `f22e6344-a35d-43b0-ad8c-a247f513c1ee`

**Screenshot hint**: You should see app details with:
- Display name
- Application (client) ID
- Directory (tenant) ID
- Supported account types

---

### Step 4: View Current API Permissions

1. In the app's left sidebar, **click** "API permissions"
2. **Review** current permissions

**What you might see currently**:
```
Microsoft Graph
├── Sites.Read.All (Application)      ← Can read SharePoint
├── Files.Read.All (Application)      ← Can read files
└── User.Read (Delegated)             ← Basic user info
```

**Problem**: Missing `Sites.ReadWrite.All` permission (needed to write/edit)

---

### Step 5: Add Write Permission

1. **Click** the "Add a permission" button (top of the permissions list)
2. **Click** "Microsoft Graph" tile
3. **Click** "Application permissions" tab (NOT Delegated permissions)
4. **Search** for "Sites.ReadWrite" in the search box
5. **Check the box** next to `Sites.ReadWrite.All`
   - Description: "Read and write items in all site collections"
6. **Click** "Add permissions" button at the bottom

**Screenshot hints**:
- Look for the checkbox next to "Sites.ReadWrite.All"
- Admin consent required: Yes (this is expected)
- Permission type: Application

---

### Step 6: Grant Admin Consent (CRITICAL)

**⚠️ IMPORTANT**: Adding the permission is NOT enough - you MUST grant admin consent!

1. **Return** to the "API permissions" page
2. **Look** for the new permission in the list:
   ```
   Microsoft Graph
   └── Sites.ReadWrite.All (Application)
       Status: Not granted for [Your Organization]  ← This is the problem!
   ```

3. **Click** the "Grant admin consent for [Your Organization]" button
   - This button is at the top of the permissions list
   - It has a shield icon ⚡

4. **Confirm** by clicking "Yes" in the popup dialog

5. **Wait** for the success message: "Granted admin consent successfully"

6. **Verify** the status changed:
   ```
   Microsoft Graph
   └── Sites.ReadWrite.All (Application)
       Status: Granted for [Your Organization]  ✅ ← Success!
   ```

**Screenshot hint**:
- Green checkmark (✓) should appear next to the permission
- Status should show "Granted for [organization name]"

---

### Step 7: Verify All Permissions

After granting consent, your permissions should look like this:

```
API / Permissions name                    Type          Status
────────────────────────────────────────────────────────────────
Microsoft Graph
├── Sites.ReadWrite.All                   Application   ✅ Granted
├── Sites.Read.All                        Application   ✅ Granted (optional)
├── Files.ReadWrite.All                   Application   ✅ Granted (optional)
└── User.Read                             Delegated     ✅ Granted
```

**What matters**:
- ✅ `Sites.ReadWrite.All` = **Granted** (green checkmark)
- ✅ Status shows "Granted for [Your Organization]"

---

## Step 8: Test the Sync

After granting permissions, test the SharePoint sync on the VPS:

```bash
# SSH into VPS
ssh root@72.60.17.245

# Test sync manually
cd /var/www/fibreflow
node scripts/sync-wa-monitor-sharepoint.js
```

**Expected output** (SUCCESS):
```
[WA Monitor SharePoint Sync] Starting daily SharePoint sync...
✅ Wrote Lawley: 14 drops to row 8
✅ Wrote Mohadin: 5 drops to row 9
✅ Sync completed
{
  "succeeded": 2,
  "failed": 0,
  "total": 2,
  "message": "Successfully synced 2/2 project(s) to SharePoint"
}
```

**If it still fails**:
- Wait 5-10 minutes for Azure AD to propagate the permission changes
- Try again

---

## Common Issues & Solutions

### Issue 1: Can't Find "Grant admin consent" Button

**Cause**: You don't have admin rights

**Solution**:
- Ask your Global Administrator to do this
- Or ask them to grant you "Application Administrator" role

---

### Issue 2: Permission Already Exists

**Cause**: `Sites.ReadWrite.All` is already added but not granted

**Solution**:
- Skip to Step 6 (Grant Admin Consent)
- Click the "Grant admin consent" button
- Confirm the popup

---

### Issue 3: "Admin consent required" Warning

**Cause**: This is NORMAL for application permissions

**Solution**:
- Don't worry - this is expected
- Just click "Grant admin consent for [org]" button
- Confirm in the popup

---

### Issue 4: Still Getting 403 After Granting Permission

**Cause**: Azure AD cache hasn't updated yet

**Solution**:
- Wait 5-10 minutes
- Restart the production app: `pm2 restart fibreflow-prod`
- Test again

---

## Verification Checklist

Before closing Azure Portal, verify:

- [ ] App found: `f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56`
- [ ] API Permissions page shows `Sites.ReadWrite.All`
- [ ] Permission type is "Application" (not Delegated)
- [ ] Status shows "Granted for [Your Organization]"
- [ ] Green checkmark (✓) visible next to the permission
- [ ] Test sync on VPS shows "✅ Wrote [project]" messages

---

## What This Permission Does

**`Sites.ReadWrite.All`** allows the application to:

✅ **Read** all SharePoint sites and lists
✅ **Write** to SharePoint sites and lists
✅ **Edit** Excel files stored in SharePoint
✅ **Create** new items in SharePoint libraries

**Security**: This is a "high privilege" permission that requires admin consent. It allows the app to edit ANY SharePoint content in your organization.

**In our case**: The app only writes to the `NeonDbase` sheet in the VF_Project_Tracker_Mohadin.xlsx file.

---

## Alternative: Least Privilege Approach

If you want more restrictive permissions (not recommended unless required by policy):

1. Use `Sites.Selected` instead of `Sites.ReadWrite.All`
2. Then grant the app write access to ONLY the specific site
3. Requires PowerShell commands (more complex)

**For now**: Use `Sites.ReadWrite.All` - it's the standard approach for this type of integration.

---

## Next Steps After Success

Once the sync works:

1. ✅ Nightly sync will run automatically at 8pm SAST
2. ✅ Email notifications will show success
3. ✅ SharePoint NeonDbase sheet will update daily
4. ✅ Your CEO will see fresh data every morning

---

## Need Help?

If you get stuck at any step:

1. **Take a screenshot** of where you're stuck
2. **Note the exact error message** if any
3. **Share the screen** with me and I'll guide you through

**Common Azure Portal versions**:
- New portal: "Microsoft Entra ID" (2024+)
- Old portal: "Azure Active Directory" (pre-2024)
- Both work the same way!

---

**Last Updated**: November 10, 2025
**Status**: Waiting for admin to grant permissions
**Next Sync**: Tonight at 8pm SAST (will work after permissions granted)
