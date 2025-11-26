# Contractor Documents Report Module

## Overview

The Contractor Documents Report module provides comprehensive document status tracking and compliance reporting for contractors. It displays which documents are verified, pending, missing, expired, or expiring soon.

**Created**: November 26, 2025
**Status**: ✅ Production Ready

---

## Features

- ✅ **Single Contractor Report** - Detailed document status for individual contractors
- ✅ **All Contractors Summary** - Overview of document compliance across all contractors
- ✅ **Real-time Status Tracking** - Monitors document verification, expiry, and completeness
- ✅ **CSV Export** - Download reports for offline analysis
- ✅ **Alert System** - Highlights expired, expiring, and missing documents
- ✅ **Progress Visualization** - Visual progress bars and completion percentages
- 🔜 **PDF Export** - Coming soon
- 🔜 **Email Alerts** - Automated expiry notifications (coming soon)
- 🔜 **Dashboard Widget** - Quick view on main dashboard (coming soon)

---

## Document Types Tracked

### Company Documents (6 types)
1. **CIDB Certificate** (with expiry)
2. **B-BBEE Certificate** (with expiry)
3. **Tax Clearance** (with expiry)
4. **Company Registration** (no expiry)
5. **Bank Confirmation Letter** (no expiry)
6. **Proof of Address** (no expiry)

### Team Member Documents (1 type)
1. **ID Document** (one per team member, no expiry)

---

## Status Types

| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| ✅ Verified | CheckCircle | Green | Document uploaded and verified |
| ⏳ Pending | Clock | Yellow | Uploaded, awaiting verification |
| ⚠️ Expiring | AlertTriangle | Orange | Expires within 30 days |
| 🔴 Expired | XCircle | Red | Past expiry date |
| 🔄 Rejected | RefreshCw | Purple | Rejected, needs resubmission |
| ⬜ Missing | Square | Gray | Never uploaded |

---

## Routes

### 1. All Contractors Summary
**URL**: `/contractors/documents-report`
**Purpose**: View document status for all contractors
**Features**:
- Overall statistics (fully/partially/non-compliant)
- Searchable contractor list
- Completion progress bars
- Alert indicators
- Link to individual contractor reports

### 2. Single Contractor Report
**URL**: `/contractors/[id]/documents-report`
**Purpose**: Detailed document report for specific contractor
**Features**:
- Complete document checklist
- Alert notifications
- Completion summary
- CSV/PDF export (CSV working, PDF coming soon)
- Print-friendly view

---

## API Endpoints

### 1. Get Contractor Report
```
GET /api/contractors-documents-report?contractorId={id}
```

**Response**:
```typescript
{
  success: true,
  data: {
    contractor: { id, name, status },
    summary: {
      totalDocuments: 11,
      verified: 8,
      pending: 1,
      missing: 1,
      expired: 1,
      completionPercentage: 73
    },
    companyDocuments: [ ... ],
    teamDocuments: [ ... ],
    alerts: [ ... ],
    lastUpdated: "2025-11-26T10:30:00Z"
  }
}
```

### 2. Get All Contractors Summary
```
GET /api/contractors-documents-report-summary
```

**Response**:
```typescript
{
  success: true,
  data: {
    contractors: [
      {
        id: "uuid",
        name: "ABC Construction",
        completionPercentage: 73,
        totalDocuments: 11,
        verified: 8,
        missing: 1,
        expired: 1,
        pending: 1,
        hasAlerts: true
      }
    ],
    overallStats: {
      totalContractors: 25,
      fullyCompliant: 10,
      partiallyCompliant: 12,
      nonCompliant: 3
    }
  }
}
```

### 3. Export Report
```
GET /api/contractors-documents-export?contractorId={id}&format=csv
```

**Formats**:
- `format=csv` - CSV export ✅ Working
- `format=pdf` - PDF export 🔜 Coming soon

---

## Module Structure

```
src/modules/contractor-documents-report/
├── types/
│   ├── documentReport.types.ts       # TypeScript interfaces
│   └── documentCategories.ts         # Document type definitions
│
├── services/
│   ├── documentReportService.ts      # Backend report aggregation
│   ├── documentReportApiService.ts   # Frontend API client
│   └── documentExportService.ts      # CSV/PDF export logic
│
├── utils/
│   ├── documentStatusRules.ts        # Status calculation logic
│   ├── completenessCalculator.ts     # Percentage calculations
│   └── alertGenerator.ts             # Alert generation logic
│
├── components/
│   ├── DocumentStatusBadge.tsx       # Status indicator badge
│   ├── DocumentStatusTable.tsx       # Document table view
│   ├── CompletionProgressBar.tsx     # Progress visualization
│   ├── ExpiryAlert.tsx              # Alert notifications
│   ├── SingleContractorReport.tsx    # Single contractor view
│   ├── AllContractorsSummary.tsx     # All contractors view
│   └── index.ts                      # Component exports
│
├── hooks/
│   └── useDocumentReport.ts          # React hooks for data fetching
│
└── README.md                          # This file
```

---

## Usage Examples

### Using the React Component

```typescript
import { SingleContractorReport } from '@/modules/contractor-documents-report/components';

function ContractorPage({ contractorId }: { contractorId: string }) {
  return <SingleContractorReport contractorId={contractorId} showBackButton={true} />;
}
```

### Using the Custom Hook

```typescript
import { useContractorDocumentReport } from '@/modules/contractor-documents-report/hooks/useDocumentReport';

function MyComponent({ contractorId }: { contractorId: string }) {
  const { data, loading, error } = useContractorDocumentReport(contractorId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>Completion: {data.summary.completionPercentage}%</div>;
}
```

### Calling the API Directly

```typescript
const response = await fetch(`/api/contractors-documents-report?contractorId=${id}`);
const { data } = await response.json();
console.log(data.summary.completionPercentage); // 73
```

---

## Business Logic

### Completion Percentage Calculation
- **Complete**: Verified + Expiring Soon documents
- **Total**: All expected documents (6 company + N team members)
- **Percentage**: (Complete / Total) × 100

### Compliance Levels
- **Fully Compliant**: 100% complete
- **Partially Compliant**: 50-99% complete
- **Non-Compliant**: <50% complete

### Expiry Warning Thresholds
- Documents with expiry dates trigger warnings **30 days** before expiry
- Expired documents are flagged immediately
- No expiry tracking for: Company Registration, Bank Confirmation, Proof of Address, ID Documents

---

## Database Schema

### Tables Used

**contractors** - Basic contractor info
**contractor_documents** - Company document storage
**contractor_teams** - Team member information
**contractor_team_documents** - Team member ID documents

### Expected Schema

```sql
-- Company documents
contractor_documents (
  id UUID PRIMARY KEY,
  contractor_id UUID REFERENCES contractors(id),
  document_type VARCHAR(100),        -- 'CIDB Certificate', 'B-BBEE Certificate', etc.
  file_name VARCHAR(255),
  file_url TEXT,
  verification_status VARCHAR(50),   -- 'verified', 'pending', 'rejected'
  expiry_date DATE,                  -- NULL for documents without expiry
  uploaded_at TIMESTAMP,
  verified_at TIMESTAMP,
  verified_by VARCHAR(255),
  rejection_reason TEXT
)

-- Team member ID documents
contractor_team_documents (
  id UUID PRIMARY KEY,
  team_member_id UUID REFERENCES contractor_teams(id),
  document_type VARCHAR(100),        -- 'ID Document'
  file_name VARCHAR(255),
  file_url TEXT,
  verification_status VARCHAR(50),
  uploaded_at TIMESTAMP,
  verified_at TIMESTAMP,
  verified_by VARCHAR(255),
  rejection_reason TEXT
)
```

---

## Future Enhancements

### Phase 2 (Planned)
- [ ] PDF Export functionality
- [ ] Print-optimized CSS
- [ ] Document upload integration from report page
- [ ] Bulk document actions

### Phase 3 (Planned)
- [ ] Email alerts for expiring documents (30/14/7 days before)
- [ ] Dashboard widget showing contractors with outstanding docs
- [ ] Automated reminders to contractors
- [ ] Document history tracking

### Phase 4 (Planned)
- [ ] Custom document types configuration
- [ ] Role-based access control
- [ ] Audit trail for document changes
- [ ] Integration with SharePoint/cloud storage

---

## Testing

### Manual Testing Checklist

**All Contractors Summary Page**:
- [ ] Page loads without errors
- [ ] Overall statistics display correctly
- [ ] Contractor list shows all active contractors
- [ ] Search functionality works
- [ ] Progress bars display correctly
- [ ] Alert indicators show for non-compliant contractors
- [ ] "View Report" links navigate correctly

**Single Contractor Report**:
- [ ] Report loads for valid contractor ID
- [ ] 404 error for invalid contractor ID
- [ ] All company documents listed (6 types)
- [ ] All team members listed with ID status
- [ ] Status badges display correctly
- [ ] Alerts section shows relevant warnings
- [ ] Completion percentage calculates correctly
- [ ] CSV export downloads successfully
- [ ] Print view works

**API Endpoints**:
- [ ] `/api/contractors-documents-report` returns valid data
- [ ] `/api/contractors-documents-report-summary` returns all contractors
- [ ] `/api/contractors-documents-export?format=csv` downloads CSV

---

## Troubleshooting

### Common Issues

**Issue**: Report shows 0% completion for all contractors
**Solution**: Check database schema - ensure `contractor_documents` and `contractor_team_documents` tables exist

**Issue**: Expiry dates not displaying
**Solution**: Verify `expiry_date` column exists and is populated for applicable documents

**Issue**: CSV export fails
**Solution**: Check API endpoint logs, ensure contractor ID is valid

**Issue**: Team members not showing
**Solution**: Verify `contractor_teams` table has data for the contractor

---

## Support

For issues or questions about this module:
1. Check this README
2. Review code comments in source files
3. Check API response errors
4. Review browser console for frontend errors

---

**Last Updated**: November 26, 2025
**Module Version**: 1.0.0
**Status**: Production Ready ✅
