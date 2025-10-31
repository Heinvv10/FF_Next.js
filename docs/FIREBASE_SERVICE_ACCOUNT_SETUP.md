# Firebase Service Account Setup Guide

**Date:** October 30, 2025
**Purpose:** Enable server-side Firebase Storage uploads for contractor documents

---

## Why This is Needed

After migrating from Firebase Auth to Clerk, the contractor document upload API was failing with:
```
Firebase Storage: User does not have permission to access... (storage/unauthorized)
```

**Solution:** Use Firebase Admin SDK with service account credentials for server-side uploads (bypasses user authentication).

---

## Step-by-Step Setup

### 1. Go to Firebase Console
**URL:** https://console.firebase.google.com/

### 2. Select Your Project
- Click on **"fibreflow-app"** (or your project name)

### 3. Navigate to Project Settings
- Click the **gear icon ⚙️** in the top-left
- Select **"Project settings"**

### 4. Go to Service Accounts Tab
- Click the **"Service accounts"** tab at the top
- You'll see a section titled "Firebase Admin SDK"

### 5. Generate New Private Key
- Click the **"Generate new private key"** button
- A dialog will appear warning you to keep this key secure
- Click **"Generate key"**
- A JSON file will download to your computer (e.g., `fibreflow-app-firebase-adminsdk-xxxxx.json`)

### 6. Copy the Service Account JSON
Open the downloaded JSON file. It will look like this:
```json
{
  "type": "service_account",
  "project_id": "fibreflow-app",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@fibreflow-app.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 7. Add to .env.local

**Important:** The entire JSON must be on ONE LINE, wrapped in single quotes.

Open (or create) `/home/louisdup/VF/Apps/FF_React/.env.local` and add:

```bash
# Firebase Admin SDK Service Account
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"fibreflow-app","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@fibreflow-app.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}'
```

**Tips:**
- Use single quotes `'...'` to wrap the entire JSON
- Keep all newlines (`\n`) in the private key as-is
- Do NOT add line breaks in the JSON
- Do NOT commit this to Git (`.env.local` is already in `.gitignore`)

### 8. Rebuild and Restart Server

```bash
npm run build
PORT=3005 npm start
```

---

## Verify It's Working

### Test Upload
1. Go to http://localhost:3005/contractors
2. Click on any contractor
3. Go to the **Documents** tab
4. Try uploading a document
5. Should succeed without permission errors ✅

### Check Server Logs
You should see:
```
✅ Firebase Admin SDK initialized successfully
```

If you see errors about missing `FIREBASE_SERVICE_ACCOUNT_KEY`, check that:
- The environment variable is set in `.env.local`
- You've restarted the server after adding it
- The JSON is properly formatted (no syntax errors)

---

## Security Best Practices

### ✅ DO:
- Keep service account JSON secret (never commit to Git)
- Store in `.env.local` (already gitignored)
- Use environment variables in production (Vercel, etc.)
- Rotate keys periodically (generate new key, delete old)

### ❌ DON'T:
- Commit service account to Git
- Share service account JSON publicly
- Use same service account for multiple projects
- Include in client-side code

---

## Troubleshooting

### Error: "FIREBASE_SERVICE_ACCOUNT_KEY is not set"
**Solution:** Add the service account to `.env.local` and restart server

### Error: "Unexpected token" or JSON parse error
**Solution:** Check JSON formatting - must be valid JSON, wrapped in single quotes

### Error: "Permission denied" still occurs
**Solution:**
1. Verify service account email has Storage Admin role in Firebase Console
2. Go to Firebase Console → Storage → Rules
3. Ensure rules allow authenticated writes

### Error: "Storage bucket not found"
**Solution:**
1. Go to Firebase Console → Storage
2. Click "Get Started" if not already enabled
3. Verify `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` in `.env.local` matches bucket name

---

## What Changed?

### Before (Client SDK - Requires User Auth):
```typescript
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storageRef = ref(storage, storagePath);
await uploadBytes(storageRef, fileBuffer);
const fileUrl = await getDownloadURL(storageRef);
```
❌ **Failed** - No Firebase user authenticated (using Clerk instead)

### After (Admin SDK - Service Account):
```typescript
import { getAdminStorage } from '@/config/firebase-admin';

const bucket = getAdminStorage();
const fileRef = bucket.file(storagePath);
await fileRef.save(fileBuffer, { contentType: mimeType });
await fileRef.makePublic();
const fileUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
```
✅ **Works** - Admin SDK bypasses user auth with service account

---

## Files Modified

1. **Created:** `src/config/firebase-admin.ts` - Admin SDK initialization
2. **Modified:** `pages/api/contractors-documents-upload.ts` - Uses Admin SDK
3. **Modified:** `.env.local.example` - Documents service account setup
4. **Created:** `docs/FIREBASE_SERVICE_ACCOUNT_SETUP.md` - This guide

---

## Next Steps

After setting up:
1. ✅ Add service account to `.env.local`
2. ✅ Rebuild: `npm run build`
3. ✅ Restart: `PORT=3005 npm start`
4. ✅ Test document upload in Contractors module
5. ✅ Verify files appear in Firebase Console → Storage → Files

---

**Last Updated:** October 30, 2025
**Status:** Ready for testing
