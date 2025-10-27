# Storage Architecture Documentation

**Last Updated**: October 27, 2025
**Status**: Hybrid Architecture (Neon + Firebase Storage)

---

## 📊 Current Architecture Overview

FibreFlow uses a **hybrid storage architecture**:
- **Database**: Neon PostgreSQL (serverless)
- **File Storage**: Firebase Storage (cloud file storage)

---

## 🗄️ Database: Neon PostgreSQL

### What It Stores:
- **Structured data**: Contractor records, projects, staff, clients, suppliers
- **Document metadata**: File paths, URLs, expiry dates, verification status
- **All business logic data**: Teams, onboarding stages, RAG scores, etc.

### Why Neon:
- Serverless PostgreSQL (auto-scaling)
- Direct SQL queries (no ORM overhead)
- Works seamlessly with Vercel/Next.js
- Better than Firebase Firestore for relational data

### Service Files:
- `src/services/contractor/neonContractorService.ts` - Main Neon service
- All API routes in `pages/api/` use Neon

---

## 📁 File Storage: Firebase Storage

### What It Stores:
- **Contractor documents**: PDFs, certificates, licenses, registrations
- **Pole photos**: Project pole tracker images
- **File uploads**: Any user-uploaded files (not text data)

### Why Firebase Storage (For Now):
- Already configured and working
- Cost-effective for file storage
- Separate concern from database
- Simple upload/download API

### Service Files:
- `src/modules/contractors/components/onboarding/DocumentUploadCard/hooks/useDocumentUpload.ts`
- `src/modules/projects/pole-tracker/services/poleTrackerNeonService/services/photoManagementService.ts`
- `src/config/firebase.ts` - Firebase configuration

---

## 🔄 Migration History

### ✅ Completed: Firebase Firestore → Neon PostgreSQL
**Date**: September 2024
**Scope**: All database operations migrated from Firestore to Neon
- Contractor CRUD operations
- Document metadata
- Teams, onboarding stages
- All structured data

### ⏸️ Pending: Firebase Storage → Vercel Blob/S3
**Status**: Planned for future
**Reason**: File storage migration is a separate project
**Priority**: P2 (not blocking current work)

---

## 🎯 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   FibreFlow App                      │
└─────────────────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│  Neon PostgreSQL │          │ Firebase Storage │
│   (Database)     │          │  (File Storage)  │
├──────────────────┤          ├──────────────────┤
│ • Contractors    │          │ • PDFs           │
│ • Projects       │          │ • Images         │
│ • Staff          │          │ • Certificates   │
│ • Clients        │          │ • Photos         │
│ • Metadata       │          │                  │
└──────────────────┘          └──────────────────┘
```

---

## 🚀 Future Migration Plan (Optional)

### Option 1: Vercel Blob Storage
**Best for**: Vercel-hosted apps (current deployment)
- Pros: Native integration, simpler deployment
- Cons: Cost ($0.15/GB after free tier)
- Effort: 2-3 hours migration

### Option 2: AWS S3
**Best for**: Enterprise/multi-cloud
- Pros: Industry standard, full control
- Cons: AWS account needed, more setup
- Effort: 4-6 hours migration

### Option 3: Keep Firebase Storage
**Best for**: If it ain't broke, don't fix it
- Pros: Already working, no migration needed
- Cons: Extra dependency, Firebase SDK

---

## 📝 Key Takeaways

1. **Neon = Database** (stores records, metadata)
2. **Firebase Storage = File Storage** (stores PDFs, images)
3. **They serve different purposes** (not competing solutions)
4. **Migration is optional** (Firebase Storage works fine)
5. **File storage can be migrated later** (separate from database migration)

---

## 🔧 Environment Variables

### Neon PostgreSQL:
```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### Firebase Storage:
```bash
# Firebase config in src/config/firebase.ts
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
```

---

## 📚 Related Documentation

- [FIREBASE_TO_NEON_MIGRATION_COMPLETE.md](./FIREBASE_TO_NEON_MIGRATION_COMPLETE.md) - Database migration details
- [CLAUDE.md](../CLAUDE.md) - Project overview and tech stack
- [DATABASE_CHOICE.md](./database_choice.md) - Why Neon was chosen

---

**Note**: Firebase Storage is intentionally kept for file uploads. It does not indicate incomplete migration - file storage and database storage are separate concerns.
