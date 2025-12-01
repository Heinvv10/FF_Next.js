# SharePoint ID Extractor Guide

**Purpose**: Retrieve Site ID, Drive ID, and File ID from SharePoint for sync configuration

**Script**: `scripts/get-sharepoint-ids.js`

**Status**: ✅ Ready to use

---

## Quick Start

### Step 1: Get Client Secret from Azure

The Client Secret is required to authenticate with Microsoft Graph API.

**Option A: Use Existing Secret** (if you have it saved)
- Skip to Step 2 with the secret you have

**Option B: Generate New Secret** (if old one is lost)

1. Go to: https://portal.azure.com
2. Navigate to: **Azure Active Directory** → **App registrations**
3. Search for Client ID: `f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56`
4. Click on the app
5. Go to: **Certificates & secrets**
6. Click: **New client secret**
   - Description: "SharePoint Sync - Nov 2025"
   - Expires: 24 months (recommended)
7. Click: **Add**
8. **⚠️ CRITICAL**: Copy the **VALUE** immediately (shown only once!)
   - NOT the "Secret ID"
   - The VALUE looks like: `abc123~XYZ456...`

---

### Step 2: Run the Script

**From local machine:**

```bash
cd /home/louisdup/VF/Apps/FF_React

# Option 1: Run with secret as argument
node scripts/get-sharepoint-ids.js "YOUR_CLIENT_SECRET_HERE"

# Option 2: Run interactively (will prompt for secret)
node scripts/get-sharepoint-ids.js
```

**Expected output:**

```
╔════════════════════════════════════════════════════════════════╗
║         SharePoint ID Extractor - Microsoft Graph API          ║
╚════════════════════════════════════════════════════════════════╝

This script will retrieve Site ID, Drive ID, and File ID
needed for SharePoint sync configuration.

Configuration:
  Tenant ID:    f22e6344-a35d-43b0-ad8c-a247f513c1ee
  Client ID:    f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56
  SharePoint:   blitzfibre.sharepoint.com
  Site:         /sites/Velocity_Manco
  File:         VF_Project_Tracker_Mohadin.xlsx

────────────────────────────────────────────────────────────────

🔐 Authenticating with Microsoft Graph API...
   ✅ Authentication successful

📍 Step 1: Getting Site ID...
   Site: blitzfibre.sharepoint.com:/sites/Velocity_Manco
   ✅ Site ID: <site_id>

📂 Step 2: Getting Drive ID...
   ✅ Drive ID: <drive_id>
   Drive Name: Documents

📄 Step 3: Getting File ID...
   File: VF_Project_Tracker_Mohadin.xlsx
   ✅ File ID: <file_id>
   File Name: VF_Project_Tracker_Mohadin.xlsx

╔════════════════════════════════════════════════════════════════╗
║                    ✅ SUCCESS - IDs Retrieved                   ║
╚════════════════════════════════════════════════════════════════╝

Add these to /var/www/fibreflow/.env.production:

────────────────────────────────────────────────────────────────
SHAREPOINT_TENANT_ID=f22e6344-a35d-43b0-ad8c-a247f513c1ee
SHAREPOINT_CLIENT_ID=f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56
SHAREPOINT_CLIENT_SECRET=<your_secret>
SHAREPOINT_SITE_ID=<site_id>
SHAREPOINT_DRIVE_ID=<drive_id>
SHAREPOINT_FILE_ID=<file_id>
SHAREPOINT_WORKSHEET_NAME=NeonDbase
────────────────────────────────────────────────────────────────
```

---

### Step 3: Add to VPS Environment

Copy the output from the script and add to VPS:

```bash
# 1. SSH into VPS
ssh root@72.60.17.245

# 2. Edit production environment
nano /var/www/fibreflow/.env.production

# 3. Add the 7 SHAREPOINT variables (paste from script output)

# 4. Save and exit (Ctrl+X, Y, Enter)

# 5. Restart production app
pm2 restart fibreflow-prod
```

---

### Step 4: Test Sync

```bash
# Still on VPS, test the sync
curl -X POST http://localhost:3005/api/wa-monitor-sync-sharepoint

# Expected output:
# {
#   "success": true,
#   "data": {
#     "succeeded": 3,
#     "failed": 0,
#     "total": 3,
#     "message": "Successfully synced 3/3 project(s) to SharePoint"
#   }
# }
```

---

### Step 5: Backfill Missing Data (7 Days)

After successful test, backfill the missing 7 days:

```bash
# Still on VPS
cd /var/www/fibreflow

for date in 2025-11-24 2025-11-25 2025-11-26 2025-11-27 2025-11-28 2025-11-29 2025-11-30; do
  echo "Syncing $date..."
  curl -X POST http://localhost:3005/api/wa-monitor-sync-sharepoint \
    -H "Content-Type: application/json" \
    -d "{\"date\":\"$date\"}"
  echo ""
  sleep 2
done
```

---

## What the Script Does

1. **Authenticates** with Microsoft Graph API using client credentials
2. **Gets Site ID** from SharePoint domain and site path
3. **Gets Drive ID** from the default document library
4. **Gets File ID** for the Excel file
5. **Outputs** all credentials in ready-to-paste format

---

## Troubleshooting

### ❌ Authentication Failed

**Error**: `Authentication failed: invalid_client` or `unauthorized_client`

**Causes & Solutions**:

1. **Wrong Client Secret**
   - Generate a new secret in Azure Portal
   - Use the VALUE (not Secret ID)
   - Secret may have expired

2. **App Not Found**
   - Verify Client ID is correct: `f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56`
   - Check you're in the right Azure tenant

3. **Insufficient Permissions**
   - App needs `Sites.ReadWrite.All` permission
   - Admin consent must be granted
   - See: `docs/wa-monitor/SHAREPOINT_PERMISSIONS_SETUP.md`

---

### ❌ Site/Drive/File Not Found

**Error**: `Graph API error (404): ...`

**Causes & Solutions**:

1. **Wrong Site Path**
   - Verify site path in script matches actual SharePoint URL
   - Current: `/sites/Velocity_Manco`

2. **Wrong File Name**
   - Verify file name matches exactly (case-sensitive)
   - Current: `VF_Project_Tracker_Mohadin.xlsx`

3. **App Lacks Permissions**
   - Check Sites.ReadWrite.All permission is granted
   - Try re-granting admin consent

---

### ⚠️ Script Runs But No Output

**Cause**: Node.js not installed or wrong version

**Solution**:
```bash
# Check Node.js version
node --version
# Should be v16+ (we have v20.19.5)

# If not installed:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## Script Configuration

The script has these hardcoded values (from documentation):

```javascript
// Known credentials
const TENANT_ID = 'f22e6344-a35d-43b0-ad8c-a247f513c1ee';
const CLIENT_ID = 'f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56';

// SharePoint details
const SHAREPOINT_DOMAIN = 'blitzfibre.sharepoint.com';
const SITE_PATH = '/sites/Velocity_Manco';
const FILE_NAME = 'VF_Project_Tracker_Mohadin.xlsx';
```

If any of these values are incorrect, edit the script before running.

---

## Security Notes

- ✅ Client Secret is **NOT saved** to disk
- ✅ Script runs locally on your machine
- ✅ Output contains secrets - **don't share screenshots**
- ✅ Add Client Secret to VPS .env.production only
- ⚠️ Client Secrets expire - consider setting 24-month expiry

---

## Alternative: Manual Lookup

If the script fails, you can manually look up IDs using Microsoft Graph Explorer:

1. Go to: https://developer.microsoft.com/en-us/graph/graph-explorer
2. Sign in with your Microsoft 365 account
3. Run these queries:

**Get Site ID:**
```
GET https://graph.microsoft.com/v1.0/sites/blitzfibre.sharepoint.com:/sites/Velocity_Manco
```

**Get Drive ID:**
```
GET https://graph.microsoft.com/v1.0/sites/{site-id}/drives
```

**Get File ID:**
```
GET https://graph.microsoft.com/v1.0/drives/{drive-id}/root:/VF_Project_Tracker_Mohadin.xlsx
```

Copy the `id` values from each response.

---

## Support

For issues:
1. Check Azure Portal → App registrations → Permissions
2. Verify Client Secret hasn't expired
3. Check SharePoint file is accessible in browser
4. Review script output for specific error messages

---

**Created**: December 1, 2025
**Status**: ✅ Ready to use
**Dependencies**: Node.js v16+ (built-in https module)
**Estimated Time**: 5 minutes
