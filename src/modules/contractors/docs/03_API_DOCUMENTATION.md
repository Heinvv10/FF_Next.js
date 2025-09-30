# Contractor Management - API Documentation

## 📋 API Overview

The Contractor Management API provides comprehensive REST endpoints for managing contractor data, documents, teams, and performance metrics. This document provides the complete API specification with implementation status.

**Base URL**: `/api/contractors`

---

## 🔍 API Status Summary

| Endpoint | Method | Status | Implementation | Testing Status |
|----------|--------|--------|----------------|----------------|
| `/contractors` | GET | ✅ Complete | ✅ Implemented | 🔄 To Test |
| `/contractors` | POST | ✅ Complete | ✅ Implemented | 🔄 To Test |
| `/contractors/{id}` | GET | ✅ Complete | ✅ Implemented | 🔄 To Test |
| `/contractors/{id}` | PUT | ✅ Complete | ✅ Implemented | 🔄 To Test |
| `/contractors/{id}` | DELETE | ✅ Complete | ✅ Implemented | 🔄 To Test |
| `/contractors/{id}/documents` | POST | ✅ Complete | ✅ Implemented | 🔄 To Test |
| `/contractors/{id}/rag` | GET | ✅ Complete | ✅ Implemented | 🔄 To Test |
| `/contractors/import` | POST | ✅ Complete | ✅ Implemented | 🔄 To Test |
| `/contractors/export` | GET | ✅ Complete | ✅ Implemented | 🔄 To Test |
| `/contractors/health` | GET | ✅ Complete | ✅ Implemented | ✅ Verified |

**Overall Implementation**: 90% Complete
**Testing Status**: Ready for User Testing

---

## 📊 Core Endpoints

### **GET /api/contractors**
**Description**: Retrieve a list of contractors with filtering and pagination

**Query Parameters**:
```typescript
interface GetContractorsQuery {
    page?: number;           // Page number (default: 1)
    limit?: number;          // Items per page (default: 10)
    status?: string;         // Filter by status (pending, active, inactive)
    search?: string;         // Search by company name or email
    rag_status?: string;     // Filter by RAG status (red, amber, green)
    business_type?: string;  // Filter by business type
    sort_by?: string;        // Sort field (created_at, company_name, rag_score)
    sort_order?: string;     // Sort direction (asc, desc)
}
```

**Response**:
```typescript
interface ContractorsResponse {
    success: boolean;
    data: Contractor[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    timestamp: string;
}
```

**Example Response**:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "company_name": "FiberTech Solutions",
            "registration_number": "2025/123456",
            "contact_person": "John Smith",
            "email": "john@fibertech.com",
            "status": "active",
            "rag_score": 85.5,
            "rag_status": "green",
            "created_at": "2025-09-01T10:00:00Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 25,
        "totalPages": 3
    },
    "timestamp": "2025-09-22T10:30:00Z"
}
```

---

### **POST /api/contractors**
**Description**: Create a new contractor

**Request Body**:
```typescript
interface CreateContractorRequest {
    // Basic Information
    company_name: string;
    registration_number: string;
    business_type: 'pty_ltd' | 'cc' | 'trust' | 'sole_proprietor';
    industry_category: string;
    years_in_business?: number;
    employee_count?: number;

    // Contact Information
    contact_person: string;
    email: string;
    phone: string;
    alternate_phone?: string;

    // Address Information
    physical_address: string;
    postal_address?: string;
    city: string;
    province: string;
    postal_code: string;

    // Financial Information
    annual_turnover?: number;
    credit_rating: 'unrated' | 'a' | 'b' | 'c' | 'd';
    payment_terms: 'net_30' | 'net_60' | 'net_90';
    bank_name?: string;
    account_number?: string;
    branch_code?: string;

    // Professional Information
    specializations?: string[];
    certifications?: string[];
    tags?: string[];

    // Status
    status?: 'pending' | 'active' | 'inactive';
    compliance_status?: 'pending' | 'compliant' | 'non_compliant';

    // Additional
    notes?: string;
}
```

**Response**:
```typescript
interface CreateContractorResponse {
    success: boolean;
    data: Contractor;
    message: string;
    timestamp: string;
}
```

**Example Request**:
```json
{
    "company_name": "FiberTech Solutions",
    "registration_number": "2025/123456",
    "business_type": "pty_ltd",
    "industry_category": "Telecommunications",
    "contact_person": "John Smith",
    "email": "john@fibertech.com",
    "phone": "+27111234567",
    "physical_address": "123 Main St, Johannesburg",
    "city": "Johannesburg",
    "province": "Gauteng",
    "postal_code": "2000",
    "credit_rating": "a",
    "payment_terms": "net_30",
    "specializations": ["Fiber Optic Installation", "Network Maintenance"],
    "certifications": ["ISO 9001", "Safety Certificate"]
}
```

**Validation Rules**:
- `company_name`: Required, max 255 characters
- `registration_number`: Required, max 100 characters, unique
- `contact_person`: Required, max 255 characters
- `email`: Required, valid email format, unique
- `phone`: Required, valid phone number format
- `physical_address`: Required, max 1000 characters
- `postal_code`: Required, max 10 characters

---

## 📋 Individual Contractor Operations

### **GET /api/contractors/{id}**
**Description**: Get detailed information about a specific contractor

**Parameters**:
- `id` (path): Contractor ID

**Response**:
```typescript
interface ContractorDetailResponse {
    success: boolean;
    data: ContractorDetail;
    timestamp: string;
}

interface ContractorDetail extends Contractor {
    teams: ContractorTeam[];
    documents: ContractorDocument[];
    rag_history: RAGHistoryEntry[];
    onboarding_stages: OnboardingStage[];
}
```

---

### **PUT /api/contractors/{id}**
**Description**: Update contractor information

**Parameters**:
- `id` (path): Contractor ID

**Request Body**: Same as CreateContractorRequest (all fields optional)

**Response**:
```typescript
interface UpdateContractorResponse {
    success: boolean;
    data: Contractor;
    message: string;
    timestamp: string;
}
```

---

### **DELETE /api/contractors/{id}**
**Description**: Delete a contractor (soft delete)

**Parameters**:
- `id` (path): Contractor ID

**Response**:
```typescript
interface DeleteContractorResponse {
    success: boolean;
    message: string;
    timestamp: string;
}
```

---

## 📁 Document Management

### **POST /api/contractors/{id}/documents**
**Description**: Upload documents for a contractor

**Parameters**:
- `id` (path): Contractor ID

**Request Body**: `FormData` with files
```typescript
interface DocumentUploadRequest {
    documents: File[];
    document_type: string;
    expiry_date?: string;
}
```

**Response**:
```typescript
interface DocumentUploadResponse {
    success: boolean;
    data: ContractorDocument[];
    message: string;
    timestamp: string;
}
```

**Supported File Types**:
- PDF: `.pdf`
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`
- Documents: `.doc`, `.docx`
- Spreadsheets: `.xls`, `.xlsx`

**File Size Limit**: 50MB per file

---

## 📊 Performance & Analytics

### **GET /api/contractors/{id}/rag**
**Description**: Get RAG scoring history and current scores

**Parameters**:
- `id` (path): Contractor ID

**Query Parameters**:
```typescript
interface RAGQuery {
    limit?: number;     // Number of history entries (default: 10)
    offset?: number;    // Offset for pagination (default: 0)
}
```

**Response**:
```typescript
interface RAGResponse {
    success: boolean;
    data: {
        current_scores: {
            financial: number;
            compliance: number;
            performance: number;
            safety: number;
            overall: number;
            status: 'red' | 'amber' | 'green';
        };
        history: RAGHistoryEntry[];
        breakdown: {
            financial_breakdown: FinancialBreakdown;
            compliance_breakdown: ComplianceBreakdown;
            performance_breakdown: PerformanceBreakdown;
            safety_breakdown: SafetyBreakdown;
        };
    };
    timestamp: string;
}
```

---

### **GET /api/contractors/analytics**
**Description**: Get contractor analytics and statistics

**Query Parameters**:
```typescript
interface AnalyticsQuery {
    date_range?: '7d' | '30d' | '90d' | '1y';
    group_by?: 'status' | 'rag_status' | 'business_type';
}
```

**Response**:
```typescript
interface AnalyticsResponse {
    success: boolean;
    data: {
        total_contractors: number;
        active_contractors: number;
        average_rag_score: number;
        rag_distribution: {
            red: number;
            amber: number;
            green: number;
        };
        trends: {
            new_contractors: TrendData[];
            rag_score_changes: TrendData[];
        };
    };
    timestamp: string;
}
```

---

## 📥 Import/Export Operations

### **POST /api/contractors/import**
**Description**: Import contractors from CSV or Excel file

**Request Body**: `FormData` with file
```typescript
interface ImportRequest {
    file: File;
    mapping?: ImportMapping;
    options?: ImportOptions;
}
```

**Response**:
```typescript
interface ImportResponse {
    success: boolean;
    data: {
        total_records: number;
        successful_records: number;
        failed_records: number;
        errors: ImportError[];
        processing_time: number;
    };
    timestamp: string;
}
```

**Supported File Types**:
- CSV: `.csv`
- Excel: `.xls`, `.xlsx`

**Required Columns**:
- `company_name`
- `contact_person`
- `email`
- `registration_number`

---

### **GET /api/contractors/export**
**Description**: Export contractors data

**Query Parameters**:
```typescript
interface ExportQuery {
    format: 'csv' | 'excel';
    filters?: ContractorFilters;
    fields?: string[];
}
```

**Response**: File download

---

## 🏥 System Health

### **GET /api/contractors/health**
**Description**: Health check endpoint for monitoring

**Response**:
```typescript
interface HealthResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    checks: {
        database: {
            status: 'healthy' | 'degraded' | 'unhealthy';
            response_time: number;
            last_checked: string;
        };
        storage: {
            status: 'healthy' | 'degraded' | 'unhealthy';
            response_time: number;
            last_checked: string;
        };
        api: {
            status: 'healthy' | 'degraded' | 'unhealthy';
            response_time: number;
            last_checked: string;
        };
    };
    metrics: {
        memory_usage: number;
        cpu_usage: number;
        active_connections: number;
    };
}
```

**Current Status**: ✅ Verified - Returns health data

---

## 🛡️ Error Handling

### **Standard Error Response**
```typescript
interface ErrorResponse {
    success: false;
    error: string;
    message: string;
    code: string;
    details?: any;
    timestamp: string;
}
```

### **Common Error Codes**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Contractor not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate email) |
| `INTERNAL_ERROR` | 500 | Server internal error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## 🔐 Authentication & Authorization

### **Authentication**
- **Method**: JWT Bearer token
- **Header**: `Authorization: Bearer <token>`
- **Token Source**: Clerk authentication

### **Authorization**
- **Role-Based Access**: Different endpoints require different roles
- **Project Isolation**: Users can only access contractors within their projects
- **Permission Levels**:
  - `read`: View contractor data
  - `write`: Create and update contractors
  - `delete`: Delete contractors
  - `admin`: Full access including sensitive operations

---

## 📝 Testing Guide

### **Testing Endpoints**
1. **Health Check**: `GET /api/contractors/health`
2. **Create Contractor**: `POST /api/contractors`
3. **List Contractors**: `GET /api/contractors`
4. **Get Contractor**: `GET /api/contractors/{id}`
5. **Update Contractor**: `PUT /api/contractors/{id}`
6. **Upload Documents**: `POST /api/contractors/{id}/documents`
7. **Get RAG Scores**: `GET /api/contractors/{id}/rag`

### **Test Data**
Use the contractor import template: `/docs/contractor_import_template.csv`

### **Postman Collection**
Available at: `/docs/api/contractor-postman-collection.json`

---

*Document Version: 1.0*
*Last Updated: September 22, 2025*
*API Status: Ready for Testing*