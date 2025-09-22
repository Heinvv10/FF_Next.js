# 🔌 Contractors API Documentation

## Overview

The Contractors API provides comprehensive endpoints for managing contractor relationships, documents, teams, and performance metrics in the FibreFlow system.

**Base URL:** `/api/contractors`  
**Version:** 1.0  
**Authentication:** Required (JWT Bearer Token)

## 📋 Table of Contents

- [Authentication](#authentication)
- [Core CRUD Operations](#core-crud-operations)
- [Document Management](#document-management)
- [Team Management](#team-management)
- [Onboarding Workflow](#onboarding-workflow)
- [RAG Scoring System](#rag-scoring-system)
- [Analytics & Reporting](#analytics--reporting)
- [Import/Export Operations](#importexport-operations)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## 🔐 Authentication

All endpoints require authentication via JWT Bearer Token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

## 🏗️ Core CRUD Operations

### List Contractors

```http
GET /api/contractors
```

**Query Parameters:**
- `status` (string, optional): Filter by contractor status
- `complianceStatus` (string, optional): Filter by compliance status  
- `ragOverall` (string, optional): Filter by RAG score (red, amber, green)
- `isActive` (boolean, optional): Filter by active status
- `search` (string, optional): Search by company name, contact person, or email
- `limit` (number, optional): Maximum records to return (default: 50)
- `offset` (number, optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "contractor-123",
      "companyName": "ABC Construction Ltd",
      "registrationNumber": "REG2024/001",
      "businessType": "pty_ltd",
      "contactPerson": "John Smith",
      "email": "john@abcconstruction.co.za",
      "phone": "+27123456789",
      "status": "approved",
      "ragOverall": "green",
      "activeProjects": 3,
      "performanceScore": 94.5,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:22:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Contractor by ID

```http
GET /api/contractors/{id}
```

**Path Parameters:**
- `id` (string): Contractor unique identifier

**Response:**
```json
{
  "data": {
    "id": "contractor-123",
    "companyName": "ABC Construction Ltd",
    "registrationNumber": "REG2024/001",
    "businessType": "pty_ltd",
    "industryCategory": "Construction",
    "yearsInBusiness": 15,
    "employeeCount": 25,
    "contactPerson": "John Smith",
    "email": "john@abcconstruction.co.za",
    "phone": "+27123456789",
    "alternatePhone": "+27987654321",
    "physicalAddress": "123 Main Road, Johannesburg",
    "city": "Johannesburg",
    "province": "Gauteng",
    "postalCode": "2001",
    "annualTurnover": 5000000,
    "status": "approved",
    "isActive": true,
    "complianceStatus": "compliant",
    "ragOverall": "green",
    "ragFinancial": "green",
    "ragCompliance": "amber",
    "ragPerformance": "green",
    "ragSafety": "green",
    "performanceScore": 94.5,
    "safetyScore": 98.2,
    "qualityScore": 92.1,
    "timelinessScore": 96.8,
    "specializations": ["fiber_installation", "electrical_work"],
    "totalProjects": 45,
    "completedProjects": 42,
    "activeProjects": 3,
    "cancelledProjects": 0,
    "successRate": 93.33,
    "onTimeCompletion": 96.8,
    "certifications": ["Electrical Certificate", "Safety Certificate"],
    "onboardingProgress": 100,
    "onboardingCompletedAt": "2024-01-10T16:45:00Z",
    "documentsExpiring": 1,
    "notes": "Reliable contractor with excellent track record",
    "tags": ["preferred", "fiber", "electrical"],
    "createdAt": "2024-01-05T09:15:00Z",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

### Create Contractor

```http
POST /api/contractors
```

**Request Body:**
```json
{
  "companyName": "XYZ Engineering CC",
  "registrationNumber": "CC2024/002",
  "businessType": "cc",
  "industryCategory": "Engineering",
  "yearsInBusiness": 8,
  "employeeCount": 15,
  "contactPerson": "Jane Doe",
  "email": "jane@xyzengineering.co.za",
  "phone": "+27111222333",
  "alternatePhone": "+27444555666",
  "physicalAddress": "456 Industrial Ave, Cape Town",
  "city": "Cape Town",
  "province": "Western Cape",
  "postalCode": "8001",
  "annualTurnover": 3500000,
  "specializations": ["network_infrastructure", "fiber_splicing"],
  "certifications": ["Network Engineering Certificate"],
  "notes": "New contractor specializing in fiber optic networks"
}
```

**Response:**
```json
{
  "data": {
    "id": "contractor-124",
    "companyName": "XYZ Engineering CC",
    "registrationNumber": "CC2024/002",
    "status": "pending",
    "ragOverall": "amber",
    "onboardingProgress": 0,
    "createdAt": "2024-01-21T11:30:00Z",
    "updatedAt": "2024-01-21T11:30:00Z"
  },
  "message": "Contractor created successfully"
}
```

### Update Contractor

```http
PUT /api/contractors/{id}
```

**Path Parameters:**
- `id` (string): Contractor unique identifier

**Request Body:** (Partial contractor object with fields to update)

**Response:**
```json
{
  "data": {
    "id": "contractor-123",
    "updatedAt": "2024-01-21T12:15:00Z"
  },
  "message": "Contractor updated successfully"
}
```

### Delete Contractor

```http
DELETE /api/contractors/{id}
```

**Query Parameters:**
- `hard` (boolean, optional): Permanently delete (default: false - soft delete)

**Response:**
```json
{
  "message": "Contractor deleted successfully"
}
```

## 📁 Document Management

### Get Contractor Documents

```http
GET /api/contractors/{id}/documents
```

**Query Parameters:**
- `status` (string, optional): Filter by verification status
- `documentType` (string, optional): Filter by document type
- `expiring` (boolean, optional): Show only expiring documents

**Response:**
```json
{
  "data": [
    {
      "id": "doc-123",
      "contractorId": "contractor-123",
      "documentType": "tax_clearance",
      "documentName": "Tax Clearance Certificate 2024",
      "fileName": "tax-clearance-2024.pdf",
      "fileUrl": "https://storage.googleapis.com/...",
      "fileSize": 1024576,
      "mimeType": "application/pdf",
      "issueDate": "2024-01-01",
      "expiryDate": "2024-12-31",
      "isExpired": false,
      "daysUntilExpiry": 315,
      "verificationStatus": "verified",
      "verifiedBy": "admin@fibreflow.com",
      "verifiedAt": "2024-01-10T14:30:00Z",
      "createdAt": "2024-01-08T10:15:00Z"
    }
  ]
}
```

### Upload Document

```http
POST /api/contractors/{id}/documents
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `documentType` (string): Type of document
- `documentName` (string): Display name for document
- `file` (file): Document file (PDF, JPG, PNG, DOC, DOCX)
- `issueDate` (date, optional): Document issue date
- `expiryDate` (date, optional): Document expiry date

**Response:**
```json
{
  "data": {
    "id": "doc-124",
    "documentType": "insurance_certificate",
    "verificationStatus": "pending",
    "uploadedAt": "2024-01-21T13:45:00Z"
  },
  "message": "Document uploaded successfully"
}
```

### Verify/Reject Document

```http
PUT /api/contractors/{id}/documents/{documentId}/verify
```

**Request Body:**
```json
{
  "action": "approve", // or "reject"
  "notes": "Document verified and compliant",
  "rejectionReason": null // Required if action is "reject"
}
```

## 👥 Team Management

### Get Contractor Teams

```http
GET /api/contractors/{id}/teams
```

**Response:**
```json
{
  "data": [
    {
      "id": "team-123",
      "contractorId": "contractor-123",
      "teamName": "Installation Team A",
      "teamType": "installation",
      "teamSize": 5,
      "leadName": "Mike Johnson",
      "leadPhone": "+27555666777",
      "leadEmail": "mike@abcconstruction.co.za",
      "specializations": ["fiber_installation", "electrical"],
      "availability": "available",
      "currentWorkload": 2,
      "maxCapacity": 5,
      "teamRating": 4.8,
      "projectsCompleted": 25,
      "isActive": true
    }
  ]
}
```

### Create Team

```http
POST /api/contractors/{id}/teams
```

**Request Body:**
```json
{
  "teamName": "Maintenance Team B",
  "teamType": "maintenance",
  "teamSize": 3,
  "leadName": "Sarah Wilson",
  "leadPhone": "+27888999000",
  "leadEmail": "sarah@abcconstruction.co.za",
  "specializations": ["maintenance", "troubleshooting"],
  "maxCapacity": 4
}
```

## 🎯 Onboarding Workflow

### Get Onboarding Status

```http
GET /api/contractors/{id}/onboarding
```

**Response:**
```json
{
  "data": {
    "contractorId": "contractor-123",
    "overallProgress": 85,
    "stages": [
      {
        "id": "company-info",
        "name": "Company Information",
        "progress": 100,
        "isComplete": true,
        "documents": [
          {
            "type": "registration_certificate",
            "status": "approved",
            "required": true
          }
        ]
      },
      {
        "id": "financial-docs",
        "name": "Financial Documentation", 
        "progress": 75,
        "isComplete": false,
        "documents": [
          {
            "type": "tax_clearance",
            "status": "approved",
            "required": true
          },
          {
            "type": "bank_confirmation",
            "status": "pending",
            "required": true
          }
        ]
      }
    ],
    "nextActions": [
      "Upload bank confirmation letter",
      "Submit insurance certificate"
    ]
  }
}
```

### Submit for Approval

```http
POST /api/contractors/{id}/onboarding/submit
```

**Response:**
```json
{
  "message": "Onboarding submitted for approval",
  "submittedAt": "2024-01-21T15:30:00Z"
}
```

## ⚡ RAG Scoring System

### Get RAG Scores

```http
GET /api/contractors/{id}/rag
```

**Query Parameters:**
- `includeHistory` (boolean, optional): Include score history

**Response:**
```json
{
  "data": {
    "contractorId": "contractor-123",
    "overallScore": "green",
    "scores": {
      "financial": {
        "score": "green",
        "value": 85.2,
        "factors": {
          "turnover": "green",
          "creditRating": "amber",
          "paymentHistory": "green"
        }
      },
      "compliance": {
        "score": "amber", 
        "value": 72.1,
        "factors": {
          "documentsValid": "green",
          "certificationsCurrent": "amber",
          "regulatoryCompliance": "green"
        }
      },
      "performance": {
        "score": "green",
        "value": 94.5,
        "factors": {
          "projectSuccess": "green",
          "timelyCompletion": "green",
          "qualityScore": "green"
        }
      },
      "safety": {
        "score": "green",
        "value": 98.2,
        "factors": {
          "incidentRate": "green",
          "safetyCertification": "green",
          "complianceRecord": "green"
        }
      }
    },
    "lastUpdated": "2024-01-20T10:15:00Z",
    "nextReview": "2024-02-20"
  }
}
```

### Calculate RAG Score

```http
POST /api/contractors/{id}/rag/calculate
```

**Request Body:**
```json
{
  "scoreTypes": ["financial", "performance"], // or ["all"]
  "forceRecalculation": true
}
```

## 📊 Analytics & Reporting

### Get Contractor Analytics

```http
GET /api/contractors/analytics
```

**Query Parameters:**
- `contractorId` (string, optional): Specific contractor analytics
- `dateFrom` (date, optional): Start date for analytics
- `dateTo` (date, optional): End date for analytics
- `groupBy` (string, optional): Group results by (month, quarter, year)

**Response:**
```json
{
  "data": {
    "overview": {
      "totalContractors": 150,
      "activeContractors": 125,
      "pendingApproval": 15,
      "suspendedContractors": 10
    },
    "ragDistribution": {
      "green": 85,
      "amber": 50,
      "red": 15
    },
    "complianceStatus": {
      "compliant": 120,
      "nonCompliant": 20,
      "underReview": 10
    },
    "performanceMetrics": {
      "averagePerformanceScore": 87.3,
      "averageProjectSuccessRate": 92.1,
      "averageOnTimeCompletion": 89.7
    },
    "trends": {
      "newContractors": [
        { "period": "2024-01", "count": 8 },
        { "period": "2024-02", "count": 12 }
      ],
      "performanceTrend": [
        { "period": "2024-01", "score": 85.2 },
        { "period": "2024-02", "score": 87.3 }
      ]
    }
  }
}
```

## 📤 Import/Export Operations

### Import Contractors

```http
POST /api/contractors/import
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (file): CSV or Excel file
- `overwriteExisting` (boolean): Whether to update existing contractors

**Response:**
```json
{
  "data": {
    "total": 50,
    "imported": 45,
    "failed": 5,
    "duplicates": 3,
    "errors": [
      {
        "row": 12,
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "message": "Import completed"
}
```

### Export Contractors

```http
GET /api/contractors/export
```

**Query Parameters:**
- `format` (string): Export format (csv, excel)
- `filters` (string, optional): JSON-encoded filter criteria

**Response:** File download (CSV or Excel)

## ❌ Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden  
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request data is invalid",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "requestId": "req-123456789"
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `CONTRACTOR_NOT_FOUND` - Contractor does not exist
- `DUPLICATE_REGISTRATION` - Registration number already exists
- `DOCUMENT_TOO_LARGE` - Document file exceeds size limit
- `INVALID_FILE_TYPE` - Unsupported file type
- `ONBOARDING_INCOMPLETE` - Cannot perform action until onboarding complete
- `RAG_CALCULATION_FAILED` - Failed to calculate RAG score

## 🔄 Rate Limiting

- **General endpoints:** 100 requests per minute per IP
- **Import operations:** 5 requests per minute per user
- **File uploads:** 10 requests per minute per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1642780800
```

## 🔗 Webhooks

The system supports webhooks for real-time notifications:

### Available Events
- `contractor.created`
- `contractor.updated`
- `contractor.deleted`
- `document.uploaded`
- `document.verified`
- `document.rejected`
- `onboarding.completed`
- `rag.score.updated`

### Webhook Payload Example
```json
{
  "event": "contractor.created",
  "timestamp": "2024-01-21T16:45:00Z",
  "data": {
    "contractorId": "contractor-123",
    "companyName": "ABC Construction Ltd",
    "status": "pending"
  }
}
```

## 📝 Changelog

### v1.0.0 (Current)
- Initial API release
- Full CRUD operations for contractors
- Document management system
- Team management
- Onboarding workflow
- RAG scoring system
- Analytics and reporting
- Import/export functionality

---

**Last Updated:** September 17, 2025  
**Version:** 1.0.0  
**Contact:** api-support@fibreflow.com