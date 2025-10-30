# Contractor Documents Module - Implementation Plan

**Date:** October 30, 2025
**Status:** Planning
**Parent Module:** Contractors

---

## Overview

Add document management capabilities to the Contractors module, allowing upload, tracking, and verification of contractor documents (certifications, insurance, contracts, etc.).

---

## Database Schema (Already Exists)

**Table:** `contractor_documents`

```sql
- id (serial primary key)
- contractor_id (references contractors.id)
- document_type (varchar) - e.g., 'insurance', 'certification', 'contract'
- document_name (varchar)
- document_number (varchar) - cert number, policy number, etc.
- file_name (varchar)
- file_path (text) - Firebase Storage path
- file_url (text) - Public download URL
- file_size (bigint) - bytes
- mime_type (varchar) - application/pdf, image/jpeg, etc.
- issue_date (date)
- expiry_date (date)
- is_expired (boolean)
- days_until_expiry (integer)
- is_verified (boolean)
- verified_by (varchar)
- verified_at (timestamp)
- verification_notes (text)
- status (varchar) - pending, approved, rejected, expired, replaced
- rejection_reason (text)
- notes (text)
- tags (jsonb)
- uploaded_by (varchar)
- created_at (timestamp)
- updated_at (timestamp)
```

**Indexes:** Already created for contractor_id, document_type, expiry_date, status

---

## Document Types

Common contractor documents:
- `insurance_liability` - Public Liability Insurance
- `insurance_workers_comp` - Workers Compensation
- `cert_electrical` - Electrical Certification
- `cert_fiber_splicing` - Fiber Splicing Certification
- `cert_safety` - Safety Certification
- `tax_clearance` - Tax Clearance Certificate
- `contract_agreement` - Service Agreement
- `bbe_certificate` - B-BBEE Certificate
- `company_registration` - Company Registration
- `banking_details` - Banking Details Document
- `other` - Other documents

---

## Architecture

### 1. File Storage: Firebase Storage

**Storage Structure:**
```
contractors/
  {contractorId}/
    documents/
      {timestamp}_{sanitizedFileName}
```

**Why Firebase Storage?**
- Already configured in project
- Handles large files well
- Built-in security rules
- Direct URL access with tokens
- Good for PDFs and images

### 2. API Routes (Flat Endpoints - Vercel Compatible)

```
POST   /api/contractors-documents-upload      - Upload document
GET    /api/contractors-documents             - List documents (filter by contractorId)
PUT    /api/contractors-documents-update      - Update document metadata
DELETE /api/contractors-documents-delete      - Delete document (and file)
POST   /api/contractors-documents-verify      - Verify/approve document
```

**Why flat endpoints?** Same Vercel routing issue as main contractors module.

### 3. Components

**ContractorDocuments.tsx** (Client Component)
- List all documents for a contractor
- Upload new documents
- View/download documents
- Delete documents
- Verify/approve documents
- Show expiry warnings

**DocumentUploadForm.tsx** (Client Component)
- File picker (PDF, JPG, PNG)
- Document type selector
- Document number input
- Issue/Expiry date pickers
- Upload progress bar
- Validation

**DocumentCard.tsx** (Display Component)
- Document details
- Download button
- Verification status badge
- Expiry warning if < 30 days
- Actions: view, verify, delete

### 4. Services

**contractorDocumentService.ts**
- uploadDocument() - Upload to Firebase + save metadata to DB
- getDocuments() - Fetch contractor documents
- updateDocument() - Update metadata
- deleteDocument() - Delete from Firebase + DB
- verifyDocument() - Approve/reject

**firebaseStorageService.ts** (Reusable)
- uploadFile() - Upload to Firebase Storage
- deleteFile() - Delete from Firebase Storage
- getDownloadURL() - Get file URL

---

## Implementation Steps

### Phase 1: Backend (API + Storage)

1. **Create firebaseStorageService.ts**
   - Upload file to Firebase Storage
   - Delete file from Firebase Storage
   - Get download URL
   - Error handling

2. **Create API: POST /api/contractors-documents-upload**
   - Accept multipart form data
   - Validate file type and size
   - Upload to Firebase Storage
   - Save metadata to contractor_documents table
   - Return document record

3. **Create API: GET /api/contractors-documents**
   - Query params: contractorId (required)
   - Filter by document_type, status (optional)
   - Return list of documents
   - Include expiry warnings

4. **Create API: PUT /api/contractors-documents-update**
   - Update document metadata (not file)
   - Can update: document_type, document_number, issue_date, expiry_date, notes, status

5. **Create API: DELETE /api/contractors-documents-delete**
   - Delete from Firebase Storage
   - Delete from database
   - Return success

6. **Create API: POST /api/contractors-documents-verify**
   - Set is_verified = true
   - Set verified_by, verified_at
   - Set status = approved/rejected
   - Add verification_notes

### Phase 2: Frontend (UI Components)

7. **Create DocumentUploadForm.tsx**
   - File input (accept: .pdf, .jpg, .png)
   - Document type dropdown
   - Document number field
   - Issue date picker
   - Expiry date picker
   - Notes textarea
   - Upload progress indicator
   - Error handling

8. **Create DocumentCard.tsx**
   - Display document info
   - Download button (opens file_url)
   - Verification badge (approved/pending/rejected)
   - Expiry warning (< 30 days)
   - Delete button (with confirmation)
   - Verify button (admin only)

9. **Create ContractorDocuments.tsx**
   - List of DocumentCard components
   - Upload button (opens DocumentUploadForm)
   - Filter by type/status
   - Empty state
   - Loading state

10. **Add to ContractorDetailPage**
    - New "Documents" tab/section
    - Render ContractorDocuments component
    - Pass contractorId

### Phase 3: Features

11. **Expiry Tracking**
    - Calculate days_until_expiry
    - Auto-set is_expired flag
    - Show warnings on dashboard
    - Email notifications (future)

12. **Document Verification Workflow**
    - Pending → Approved/Rejected flow
    - Admin-only verification
    - Verification notes
    - Audit trail

13. **File Validation**
    - Max file size: 10MB
    - Allowed types: PDF, JPG, PNG
    - Required fields validation

---

## File Size & Type Limits

```typescript
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

---

## Security Considerations

1. **Firebase Security Rules:**
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /contractors/{contractorId}/documents/{document} {
         // Only authenticated users can read
         allow read: if request.auth != null;
         // Only authenticated users can write to their contractor's folder
         allow write: if request.auth != null;
       }
     }
   }
   ```

2. **API Authentication:**
   - Use Clerk auth middleware
   - Verify user has permission to access contractor

3. **File Validation:**
   - Validate file type on both client and server
   - Scan for malware (future enhancement)
   - Sanitize filenames

---

## UI/UX Features

### Document List View
```
┌─────────────────────────────────────────────────────┐
│ Documents (5)                        [+ Upload]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📄 Public Liability Insurance                      │
│    Policy #: INS-2025-001                           │
│    ✅ Verified  ⚠️ Expires in 15 days              │
│    [Download] [Delete]                              │
│                                                     │
│ 📄 Electrical Certification                        │
│    Cert #: ELEC-12345                               │
│    ⏳ Pending Verification                         │
│    [Download] [Verify] [Delete]                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Upload Form
```
┌─────────────────────────────────────────────────────┐
│ Upload Document                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Document Type *                                     │
│ [Insurance - Public Liability ▼]                    │
│                                                     │
│ Document Number                                     │
│ [INS-2025-002          ]                            │
│                                                     │
│ Issue Date              Expiry Date                 │
│ [2025-01-01]            [2026-01-01]                │
│                                                     │
│ File * (PDF, JPG, PNG - Max 10MB)                   │
│ [Choose File]  insurance-policy.pdf                 │
│                                                     │
│ Notes                                               │
│ [                                                ]  │
│                                                     │
│ [Cancel]  [Upload Document]                         │
└─────────────────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Upload PDF document
- [ ] Upload image document (JPG, PNG)
- [ ] Reject invalid file types
- [ ] Reject files > 10MB
- [ ] List documents for contractor
- [ ] Download document
- [ ] Delete document (removes from Firebase + DB)
- [ ] Verify document (approve/reject)
- [ ] Expiry warnings show correctly
- [ ] Auto-expire documents past expiry date
- [ ] Update document metadata
- [ ] Error handling for all scenarios

---

## Future Enhancements (Not in Scope)

- Email notifications for expiring documents
- Automatic document reminders
- OCR for extracting info from PDFs
- Document version history
- Bulk document upload
- Document templates
- Digital signatures
- Document comparison (old vs new)

---

## Dependencies

- `firebase` - Already installed
- `react-dropzone` - For drag & drop upload (optional)
- No new packages required!

---

## Estimated Effort

- **Phase 1 (Backend):** 4-6 hours
- **Phase 2 (Frontend):** 4-6 hours
- **Phase 3 (Features):** 2-3 hours
- **Testing & Polish:** 2 hours

**Total:** 12-17 hours (~2 days)

---

**Created:** October 30, 2025
**Status:** Ready for implementation
