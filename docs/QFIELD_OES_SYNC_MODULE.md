# QField OES Sync Module

**Location**: `/admin/qfield-sync`
**Status**: Development
**Created**: 2025-11-24

## Overview

Simple web interface for Jaun to upload daily OES reports and trigger automated sync to QFieldCloud.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FF_React Web App (Local)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend: /admin/qfield-sync                                   │
│  - File upload (Excel/CSV)                                      │
│  - Trigger sync button                                          │
│  - Real-time log viewer                                         │
│  - Status summary                                               │
│                                                                  │
│  API Routes:                                                    │
│  - POST /api/qfield/oes-upload  → Upload file to VPS via SSH  │
│  - POST /api/qfield/oes-sync    → Execute sync on VPS via SSH │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ SSH
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              VPS: root@72.61.166.168                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /root/oes_sync/                                                │
│  ├── data/oes_reports/oes_report_latest.xlsx  ← Upload here    │
│  ├── scripts/run_oes_sync.sh                  ← Execute this   │
│  └── data/matched_connections/                ← Results here   │
│                                                                  │
│  Automation:                                                    │
│  1. Extract Home Connections (50k+)                            │
│  2. Match with OES report (3.3k matched)                       │
│  3. Upload to QFieldCloud (automated)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js + React + TypeScript
- **Backend**: Next.js API Routes
- **File Upload**: `formidable` (multipart/form-data)
- **SSH**: `ssh2` library for remote execution
- **VPS**: Ubuntu 22.04, Python 3, QFieldCloud API scripts

## File Structure

```
/home/louisdup/VF/Apps/FF_React/
├── pages/
│   └── admin/
│       └── qfield-sync.tsx               ← Main UI page
├── pages/api/
│   └── qfield/
│       ├── oes-upload.ts                 ← Upload OES file to VPS
│       └── oes-sync.ts                   ← Trigger sync on VPS
└── docs/
    └── QFIELD_OES_SYNC_MODULE.md         ← This file
```

## API Endpoints

### POST `/api/qfield/oes-upload`

Upload OES report file to VPS.

**Request**: multipart/form-data
- `file`: Excel (.xlsx) or CSV file

**Response**:
```json
{
  "success": true,
  "filename": "oes_report_latest.xlsx",
  "size": 387534,
  "uploadedAt": "2025-11-24T14:30:00Z"
}
```

**Process**:
1. Validate file (Excel/CSV, max 50MB)
2. SCP file to VPS: `/root/oes_sync/data/oes_reports/oes_report_latest.xlsx`
3. Return confirmation

---

### POST `/api/qfield/oes-sync`

Trigger OES sync automation on VPS.

**Request**: Empty body

**Response**: Server-Sent Events (SSE) stream
```
data: {"type":"log","message":"Step 1/3: Extracting Home Connections..."}
data: {"type":"log","message":"✅ Found 50,551 connections"}
data: {"type":"log","message":"Step 2/3: Matching with OES report..."}
data: {"type":"log","message":"✅ Matched 3,349 connections"}
data: {"type":"log","message":"Step 3/3: Uploading to QFieldCloud..."}
data: {"type":"log","message":"✅ Upload successful!"}
data: {"type":"complete","stats":{"extracted":50551,"matched":3349,"errors":0}}
```

**Process**:
1. SSH to VPS
2. Execute: `cd /root/oes_sync/scripts && ./run_oes_sync.sh`
3. Stream stdout/stderr back to frontend
4. Parse output for stats
5. Return completion status

## Frontend UI

### Page: `/admin/qfield-sync`

**Components**:

1. **File Upload Section**
   - Drag & drop or click to upload
   - Accepts: `.xlsx`, `.csv`
   - Max size: 50MB
   - Shows filename, size, upload progress

2. **Sync Control**
   - "Run OES Sync" button
   - Disabled during sync
   - Shows last sync timestamp

3. **Live Log Viewer**
   - Real-time log output
   - Auto-scroll to bottom
   - Syntax highlighting (✅, ⚠️, ❌)
   - Copy log button

4. **Status Summary**
   - Connections extracted: 50,551
   - Connections matched: 3,349
   - Match rate: 93%
   - Warnings: 0
   - Errors: 0
   - Duration: 2m 15s

## Workflow

### User Journey:

1. **Jaun receives daily OES report** from Fibertime
   - Format: Excel (.xlsx) or CSV
   - Contains: Drop Numbers + OES data

2. **Navigate to** `/admin/qfield-sync`

3. **Upload OES file**
   - Drag & drop or click to browse
   - File uploads to VPS automatically
   - Confirmation: "File uploaded successfully"

4. **Click "Run OES Sync"**
   - Button triggers automation
   - Live log output appears
   - Progress updates in real-time

5. **View results**
   - Success: "3,349 connections uploaded to QFieldCloud"
   - Link to QFieldCloud project
   - Summary statistics

6. **Done!** No manual steps, no QGIS, no new projects

## Configuration

### VPS Connection

**Environment Variables** (`.env.local`):
```bash
VPS_HOST=72.61.166.168
VPS_USER=root
VPS_SSH_KEY_PATH=/home/louisdup/.ssh/id_rsa
VPS_OES_PATH=/root/oes_sync
```

### QFieldCloud Project

Default project ID in VPS script:
```bash
# /root/oes_sync/scripts/import_to_qfield.py:20
DEFAULT_PROJECT_ID = 'baf29cb3-2483-4924-b7c0-47953ac2851e'
```

Change via environment variable on VPS:
```bash
export QFIELD_OES_PROJECT_ID="your-project-id"
```

## Error Handling

### Upload Errors

| Error | Cause | Solution |
|-------|-------|----------|
| File too large | > 50MB | Split file or compress |
| Invalid format | Not .xlsx or .csv | Convert to Excel/CSV |
| SSH connection failed | VPS unreachable | Check VPS status, SSH keys |
| Permission denied | Cannot write to VPS | Check SSH user permissions |

### Sync Errors

| Error | Cause | Solution |
|-------|-------|----------|
| No OES file found | Upload failed or wrong path | Re-upload file |
| No matches found | Drop number format mismatch | Check OES report format |
| QFieldCloud upload failed | API token invalid | Check token in VPS env |
| Script not found | Path incorrect | Verify VPS paths |

## Monitoring

### Logs

**VPS Logs**:
```bash
ssh root@72.61.166.168
tail -f /root/oes_sync/logs/sync.log
```

**Frontend Logs**:
- Browser DevTools Console
- Network tab for API responses

### Health Checks

**Test VPS Connection**:
```bash
ssh root@72.61.166.168 "echo 'Connection OK'"
```

**Test Script Exists**:
```bash
ssh root@72.61.166.168 "ls -la /root/oes_sync/scripts/run_oes_sync.sh"
```

## Future Enhancements (Optional)

**Phase 2 (Later)**:
- [ ] Sync history table (track all runs)
- [ ] Email notifications on completion
- [ ] Scheduled daily sync (cron)
- [ ] Multi-project support
- [ ] Export matched connections CSV from UI
- [ ] Compare reports (diff viewer)
- [ ] Retry failed syncs

**Phase 3 (Maybe)**:
- [ ] User permissions (admin only)
- [ ] Audit log
- [ ] Slack/Teams notifications
- [ ] API webhooks
- [ ] Mobile-responsive UI

## Testing

### Manual Test

1. Navigate to `/admin/qfield-sync`
2. Upload test file: `/home/louisdup/VF/vps/hostinger/qfield/Jaun/VELOCITY OES REPORT 20 NOV 2025.xlsx`
3. Click "Run OES Sync"
4. Verify:
   - ✅ Live logs appear
   - ✅ No errors
   - ✅ Stats correct
   - ✅ QFieldCloud updated

### Automated Test

```bash
cd /home/louisdup/VF/Apps/FF_React
npm run test -- qfield-sync
```

## Deployment

### Development (Current)

```bash
cd /home/louisdup/VF/Apps/FF_React
npm run dev
# Open: http://localhost:3000/admin/qfield-sync
```

### Production (Later)

```bash
# Build
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to VPS
pm2 start npm --name "ff-react" -- start
```

## Support

**Issues?** Contact:
- Developer: Louis
- User: Jaun

**Common Questions**:

Q: How often should I run this?
A: Daily, after receiving OES report from Fibertime.

Q: What if I upload the wrong file?
A: Just upload again, it overwrites the previous file.

Q: Can I see historical syncs?
A: Not yet, coming in Phase 2.

Q: How do I change the QFieldCloud project?
A: SSH to VPS, edit `/root/oes_sync/scripts/import_to_qfield.py:20`

## Version History

- **v1.0** (2025-11-24): Initial release
  - File upload to VPS
  - Trigger sync on VPS
  - Live log viewer
  - Status summary
