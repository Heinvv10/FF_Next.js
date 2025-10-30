# Firebase Storage Setup Guide

**Date:** October 30, 2025
**Project:** FibreFlow (`fibreflow-292c7`)
**Task:** Enable Firebase Storage for contractor documents

---

## ✅ Option 1: Enable Storage on Existing Project (Recommended)

Your project already uses Firebase project `fibreflow-292c7`. Let's just enable Storage on it.

### Step-by-Step Instructions:

#### 1. Go to Firebase Console
**URL:** https://console.firebase.google.com/

#### 2. Select Your Project
- Click on **"fibreflow-292c7"** project
- (It should already be there since you're using Firebase)

#### 3. Navigate to Storage
- In the left sidebar, click **"Storage"**
- Or click **"Build"** → **"Storage"**

#### 4. Click "Get Started"
- You'll see a button that says **"Get started"**
- Click it

#### 5. Choose Security Rules
You'll see a dialog with options:

**Option A: Start in Production Mode (Recommended)**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
✅ Use this - Allows public read, authenticated write

**Option B: Start in Test Mode**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```
⚠️ Don't use - Allows anyone to write (insecure)

**→ Choose Production Mode, then click "Next"**

#### 6. Choose Storage Location
- Select a location close to you (e.g., `us-central1`, `europe-west1`)
- **Important:** This cannot be changed later!
- For South Africa: Choose `europe-west1` (closest)
- Click **"Done"**

#### 7. Wait for Setup
- Firebase will create your storage bucket
- Takes about 10-30 seconds
- You'll see: `gs://fibreflow-292c7.firebasestorage.app`

#### 8. Verify Storage is Enabled
You should now see:
- **Files** tab (empty for now)
- **Rules** tab
- **Usage** tab

✅ **Done! Storage is enabled!**

---

## 🔐 Recommended Security Rules

After setup, update your rules to be more specific:

### Navigate to Rules Tab
Storage → Rules

### Replace with:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read access (for document downloads)
    match /{allPaths=**} {
      allow read: if true;
    }

    // Contractor documents - authenticated users only
    match /contractors/{contractorId}/documents/{fileName} {
      allow write: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Other paths - authenticated only
    match /{allPaths=**} {
      allow write: if request.auth != null;
    }
  }
}
```

**Click "Publish"**

---

## ✅ Verify It's Working

### Method 1: Check in Firebase Console
1. Go to Storage
2. Click "Files" tab
3. You should see an empty bucket (no errors)

### Method 2: Test from Code
Run the test script again:
```bash
node scripts/test-documents-api.mjs
```

Should now pass upload test! ✅

---

## 🆕 Option 2: Create a Brand New Firebase Project (If Needed)

If you want a separate project for some reason:

### 1. Go to Firebase Console
https://console.firebase.google.com/

### 2. Click "Add Project"

### 3. Enter Project Name
- Name: `fibreflow-documents` (or anything)
- Click **Continue**

### 4. Google Analytics
- Turn OFF Google Analytics (not needed)
- Click **Create Project**

### 5. Wait for Creation
- Takes 30-60 seconds

### 6. Enable Storage
Follow steps 3-8 from Option 1 above

### 7. Get Config
- Go to Project Settings (gear icon)
- Scroll to "Your apps"
- Click Web app icon (</>)
- Copy the config:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "fibreflow-documents",
  storageBucket: "fibreflow-documents.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

### 8. Update Your Code
**File:** `src/config/firebase.ts`

Replace the config values with your new project's values

**OR** add to `.env.local`:
```bash
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fibreflow-documents.firebasestorage.app
NEXT_PUBLIC_FIREBASE_API_KEY=your_new_api_key
# ... etc
```

---

## 🔍 Troubleshooting

### Error: "Storage: Object 'contractors/xxx' does not exist"
**Cause:** File upload failed or path is wrong
**Solution:** Check file path in upload code

### Error: "Permission denied"
**Cause:** Security rules too restrictive
**Solution:** Update rules to allow authenticated writes (see above)

### Error: 404 when accessing file
**Cause:** File doesn't exist or wrong bucket
**Solution:**
- Check bucket name in config
- Verify file exists in Firebase Console → Storage → Files

### Error: "Firebase Storage: An unknown error occurred"
**Cause:** Storage not enabled or wrong project
**Solution:** Make sure you clicked "Get Started" in Storage tab

---

## 📝 What Happens After Setup

### 1. Upload API Will Work
`POST /api/contractors-documents-upload` will:
- Upload files to: `gs://fibreflow-292c7.firebasestorage.app/contractors/{id}/documents/`
- Return download URL
- Save metadata to Neon database

### 2. Files Stored in Firebase
```
Storage Root
└── contractors/
    ├── {contractor-id-1}/
    │   └── documents/
    │       ├── 1730291234567_insurance.pdf
    │       └── 1730291345678_certificate.pdf
    └── {contractor-id-2}/
        └── documents/
            └── 1730291456789_contract.pdf
```

### 3. Download URLs
Each file gets a public URL like:
```
https://firebasestorage.googleapis.com/v0/b/fibreflow-292c7.firebasestorage.app/o/contractors%2F{id}%2Fdocuments%2F1730291234567_insurance.pdf?alt=media&token=...
```

---

## 💰 Cost & Limits

### Free Tier (Spark Plan):
- **Storage:** 5 GB
- **Downloads:** 1 GB/day
- **Uploads:** 1 GB/day
- **Operations:** 50,000/day

### Blaze Plan (Pay as you go):
Only if you exceed free tier:
- **Storage:** $0.026/GB/month
- **Downloads:** $0.12/GB
- **Uploads:** $0.036/GB

**Example:** 10GB storage + 5GB downloads/month = ~$0.86/month

---

## ✅ Success Checklist

After setup, verify:
- [ ] Storage tab shows in Firebase Console
- [ ] No error messages in Storage tab
- [ ] Rules tab shows security rules
- [ ] Bucket name matches config: `fibreflow-292c7.firebasestorage.app`
- [ ] Test script passes upload test
- [ ] Can see uploaded files in Firebase Console → Storage → Files

---

**Once Storage is enabled, run:**
```bash
node scripts/test-documents-api.mjs
```

**Should see:**
```
✓ Returns 201 status
✓ Response has success: true
✓ Response contains document ID
✓ Response contains file URL
```

🎉 **Then we can build the UI!**

---

**Created:** October 30, 2025
**Status:** Ready to use
