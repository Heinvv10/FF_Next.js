# Contractor Documents API - Testing Guide

**Date:** October 30, 2025
**Status:** Backend Complete - Ready for Testing

---

## 🎯 API Endpoints (All Flat - Vercel Compatible)

1. **POST** `/api/contractors-documents-upload` - Upload document
2. **GET** `/api/contractors-documents` - List documents
3. **PUT** `/api/contractors-documents-update` - Update metadata
4. **POST** `/api/contractors-documents-delete` - Delete document
5. **POST** `/api/contractors-documents-verify` - Approve/reject document

---

## 🚀 Quick Start Testing

### Prerequisites

1. **Start the server:**
   ```bash
   npm run build
   PORT=3005 npm start
   ```

2. **Get a contractor ID:**
   ```bash
   # Open http://localhost:3005/contractors
   # Click on any contractor
   # Copy the ID from URL: /contractors/{ID}
   ```

3. **Prepare a test PDF:**
   ```bash
   # Create a small test PDF or use any existing one
   # Examples: insurance.pdf, certificate.pdf
   ```

---

## 📝 Test Scenarios

### Scenario 1: Upload a Document

**Endpoint:** `POST /api/contractors-documents-upload`

**Test with curl:**
```bash
curl -X POST http://localhost:3005/api/contractors-documents-upload \
  -F "contractorId=YOUR_CONTRACTOR_ID" \
  -F "documentType=insurance_liability" \
  -F "documentName=Public Liability Insurance" \
  -F "documentNumber=POL-2025-001" \
  -F "issueDate=2025-01-01" \
  -F "expiryDate=2026-01-01" \
  -F "notes=Annual insurance renewal" \
  -F "uploadedBy=admin@test.com" \
  -F "file=@/path/to/test.pdf"
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "contractorId": "...",
    "documentType": "insurance_liability",
    "documentName": "Public Liability Insurance",
    "fileName": "1730291234567_test.pdf",
    "fileUrl": "https://firebasestorage.googleapis.com/...",
    "status": "pending",
    "isVerified": false
  }
}
```

**What to check:**
- ✅ Returns 201 status
- ✅ File uploaded to Firebase Storage
- ✅ Record created in database
- ✅ `fileUrl` is accessible

---

### Scenario 2: List Documents

**Endpoint:** `GET /api/contractors-documents?contractorId={id}`

**Test with curl:**
```bash
curl -X GET "http://localhost:3005/api/contractors-documents?contractorId=YOUR_CONTRACTOR_ID"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "documentType": "insurance_liability",
      "documentName": "Public Liability Insurance",
      "status": "pending",
      "expiryDate": "2026-01-01T00:00:00.000Z",
      "daysUntilExpiry": 62,
      "isExpired": false
    }
  ]
}
```

**What to check:**
- ✅ Returns array of documents
- ✅ `daysUntilExpiry` calculated correctly
- ✅ `isExpired` = false for future dates

**Test filters:**
```bash
# Filter by document type
curl "http://localhost:3005/api/contractors-documents?contractorId=ID&documentType=insurance_liability"

# Filter by status
curl "http://localhost:3005/api/contractors-documents?contractorId=ID&status=pending"
```

---

### Scenario 3: Update Document Metadata

**Endpoint:** `PUT /api/contractors-documents-update`

**Test with curl:**
```bash
curl -X PUT http://localhost:3005/api/contractors-documents-update \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1",
    "documentName": "Updated Insurance Policy",
    "expiryDate": "2026-06-01",
    "notes": "Renewed for 6 more months"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "documentName": "Updated Insurance Policy",
    "expiryDate": "2026-06-01T00:00:00.000Z",
    "notes": "Renewed for 6 more months"
  }
}
```

**What to check:**
- ✅ Only specified fields updated
- ✅ Other fields unchanged
- ✅ `updated_at` timestamp changed

---

### Scenario 4: Verify (Approve) Document

**Endpoint:** `POST /api/contractors-documents-verify`

**Test with curl:**
```bash
curl -X POST http://localhost:3005/api/contractors-documents-verify \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1",
    "action": "approve",
    "verifiedBy": "admin@fibreflow.com",
    "verificationNotes": "Document verified and approved"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "status": "approved",
    "isVerified": true,
    "verifiedBy": "admin@fibreflow.com",
    "verifiedAt": "2025-10-30T12:00:00.000Z",
    "verificationNotes": "Document verified and approved"
  },
  "message": "Document approved successfully"
}
```

**What to check:**
- ✅ `status` = "approved"
- ✅ `isVerified` = true
- ✅ `verifiedBy` and `verifiedAt` set

---

### Scenario 5: Reject Document

**Test with curl:**
```bash
curl -X POST http://localhost:3005/api/contractors-documents-verify \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1",
    "action": "reject",
    "verifiedBy": "admin@fibreflow.com",
    "rejectionReason": "Document expired"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "status": "rejected",
    "isVerified": false,
    "rejectionReason": "Document expired"
  },
  "message": "Document rejected successfully"
}
```

---

### Scenario 6: Delete Document

**Endpoint:** `POST /api/contractors-documents-delete`

**Test with curl:**
```bash
curl -X POST http://localhost:3005/api/contractors-documents-delete \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**What to check:**
- ✅ File removed from Firebase Storage
- ✅ Record deleted from database
- ✅ GET request returns 404 or empty array

---

## 🧪 Testing Checklist

### Upload API
- [ ] Upload PDF successfully
- [ ] Upload JPG successfully
- [ ] Upload PNG successfully
- [ ] Reject invalid file types (e.g., .txt, .doc)
- [ ] Reject files > 10MB
- [ ] Handle missing required fields (400 error)
- [ ] File appears in Firebase Storage console
- [ ] Download URL works

### List API
- [ ] List all documents for contractor
- [ ] Filter by documentType works
- [ ] Filter by status works
- [ ] Empty contractor returns empty array
- [ ] Calculate daysUntilExpiry correctly
- [ ] Mark expired documents (isExpired = true)

### Update API
- [ ] Update document name
- [ ] Update expiry date
- [ ] Update notes
- [ ] Partial updates work (only changed fields)
- [ ] Returns 404 for non-existent document

### Verify API
- [ ] Approve document sets status = approved
- [ ] Reject document sets status = rejected
- [ ] Verification timestamp recorded
- [ ] Rejection reason saved

### Delete API
- [ ] Document deleted from database
- [ ] File deleted from Firebase Storage
- [ ] Returns 404 for already deleted document
- [ ] Handles Firebase deletion errors gracefully

---

## 🐛 Common Issues & Solutions

### Issue: 405 Method Not Allowed
**Cause:** Using wrong HTTP method or Vercel routing issue
**Solution:** Use flat endpoints, check method (POST, GET, PUT)

### Issue: File upload fails with CORS error
**Cause:** Firebase Storage security rules
**Solution:** Update Firebase rules to allow authenticated uploads

### Issue: "formidable" error
**Cause:** Body parser enabled for multipart endpoint
**Solution:** Already disabled with `export const config = { api: { bodyParser: false } }`

### Issue: Firebase Storage 404
**Cause:** File path incorrect or storage rules blocking
**Solution:** Check file_path in database matches Firebase Storage path

### Issue: Document not appearing after upload
**Cause:** Contractor ID mismatch or database insert failed
**Solution:** Check logs, verify contractorId is valid UUID

---

## 📊 Firebase Storage Structure

After uploading documents, check Firebase Console:

```
Storage > fibreflow-292c7.firebasestorage.app
  └── contractors/
      └── {contractorId}/
          └── documents/
              ├── 1730291234567_insurance.pdf
              ├── 1730291345678_certificate.pdf
              └── ...
```

---

## 🔍 Database Verification

**Check uploaded documents in database:**
```bash
# Using Neon SQL editor or psql
SELECT
  id,
  document_type,
  document_name,
  status,
  is_verified,
  created_at
FROM contractor_documents
WHERE contractor_id = 'YOUR_CONTRACTOR_ID'
ORDER BY created_at DESC;
```

---

## ✅ Success Criteria

Backend is ready when:
- [ ] All 5 endpoints return correct status codes
- [ ] File uploads to Firebase Storage successfully
- [ ] Files can be downloaded from returned URLs
- [ ] Metadata saved correctly in Neon database
- [ ] Expiry calculations work
- [ ] Verification workflow functions
- [ ] Delete removes file AND database record

---

**Ready to proceed with frontend once all tests pass! ✅**
