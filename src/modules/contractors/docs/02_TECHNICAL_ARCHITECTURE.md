# Contractor Management - Technical Architecture

## 🏗️ Architecture Overview

The Contractor Management module is built on a modern, scalable architecture using Next.js 14+ with Neon PostgreSQL. This document provides the complete technical architecture and implementation details.

### **Technology Stack**
- **Frontend**: React 18, TypeScript, TailwindCSS
- **Backend**: Next.js 14+ API Routes
- **Database**: Neon PostgreSQL (confirmed)
- **Storage**: Neon PostgreSQL (dedicated file storage table) - MIGRATING FROM FIREBASE
- **Authentication**: Clerk Integration
- **Testing**: Vitest, React Testing Library

---

## 📁 Module Structure

### **Frontend Structure**
```
src/modules/contractors/
├── ContractorsDashboard.tsx          # Main dashboard component
├── components/
│   ├── applications/                 # Application workflow
│   │   ├── ContractorApplications.tsx
│   │   ├── ApplicationCard.tsx
│   │   └── ApplicationDetails.tsx
│   ├── compliance/                   # Compliance tracking
│   │   ├── ComplianceTracker.tsx
│   │   ├── ComplianceCard.tsx
│   │   └── ComplianceDetails.tsx
│   ├── documents/                    # Document management
│   │   ├── DocumentManager.tsx
│   │   ├── DocumentUpload.tsx
│   │   ├── DocumentApproval.tsx
│   │   └── DocumentViewer.tsx
│   ├── onboarding/                   # Enhanced onboarding
│   │   ├── EnhancedOnboarding.tsx
│   │   ├── OnboardingStage.tsx
│   │   └── ProgressTracker.tsx
│   ├── performance/                   # Performance analytics
│   │   ├── PerformanceAnalytics.tsx
│   │   ├── RAGScoreDisplay.tsx
│   │   └── PerformanceCharts.tsx
│   ├── teams/                        # Team management
│   │   ├── TeamManager.tsx
│   │   ├── TeamForm.tsx
│   │   └── TeamMembers.tsx
│   ├── view/                         # CRUD operations
│   │   ├── ContractorCreate.tsx
│   │   ├── ContractorView.tsx
│   │   ├── ContractorEdit.tsx
│   │   └── ContractorDelete.tsx
│   ├── forms/                        # Form components
│   │   ├── ContractorFormSections.tsx
│   │   ├── BasicInfoSection.tsx
│   │   ├── ContactInfoSection.tsx
│   │   ├── AddressSection.tsx
│   │   ├── FinancialSection.tsx
│   │   ├── ProfessionalInfoSection.tsx
│   │   └── StatusSection.tsx
│   ├── shared/                       # Shared components
│   │   ├── ContractorCard.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ActionButtons.tsx
│   └── layout/                       # Layout components
│       ├── ContractorsHeader.tsx
│       ├── ContractorsSidebar.tsx
│       └── ContractorsLayout.tsx
└── docs/                             # Documentation
    ├── 01_REQUIREMENTS_SPECIFICATIONS.md
    ├── 02_TECHNICAL_ARCHITECTURE.md
    ├── 03_API_DOCUMENTATION.md
    ├── 04_IMPLEMENTATION_GUIDE.md
    ├── 05_USER_GUIDES.md
    ├── 06_OPERATIONS_GUIDE.md
    ├── 07_TESTING_GUIDE.md
    ├── 08_DEVELOPMENT_HISTORY.md
    └── 09_INTEGRATION_GUIDE.md
```

### **Service Layer Structure**
```
src/services/contractor/
├── contractorApiService.ts            # Main API service
├── contractorCrudService.ts          # CRUD operations
├── neonContractorService.ts          # Database operations
├── import/
│   ├── contractorImportService.ts    # Import operations
│   ├── validationService.ts          # Data validation
│   └── templateService.ts             # Template management
├── onboarding/
│   ├── onboardingService.ts          # Onboarding workflow
│   ├── stageService.ts               # Stage management
│   └── progressService.ts            # Progress tracking
├── rag/
│   ├── ragScoringService.ts          # RAG scoring system
│   ├── financial-calculator.ts       # Financial scoring
│   ├── performance-calculator.ts     # Performance scoring
│   ├── compliance-calculator.ts      # Compliance scoring
│   ├── safety-calculator.ts          # Safety scoring
│   └── historyService.ts             # Score history
├── compliance/
│   ├── complianceService.ts          # Compliance tracking
│   ├── documentService.ts            # Document management
│   └── auditService.ts               # Audit trails
└── teams/
    ├── teamService.ts                # Team management
    ├── memberService.ts              # Member operations
    └── capacityService.ts            # Capacity tracking
```

---

## 🗄️ Database Architecture

### **Database Schema**
```sql
-- Main contractor table
CREATE TABLE contractors (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL UNIQUE,
    business_type VARCHAR(50) DEFAULT 'pty_ltd',
    industry_category VARCHAR(100) DEFAULT 'Telecommunications',
    years_in_business INTEGER,
    employee_count INTEGER,

    -- Contact Information
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    alternate_phone VARCHAR(50),

    -- Address Information
    physical_address TEXT NOT NULL,
    postal_address TEXT,
    city VARCHAR(100) DEFAULT 'Johannesburg',
    province VARCHAR(100) DEFAULT 'Gauteng',
    postal_code VARCHAR(10),

    -- Financial Information
    annual_turnover DECIMAL(15,2),
    credit_rating VARCHAR(20) DEFAULT 'unrated',
    payment_terms VARCHAR(20) DEFAULT 'net_30',
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    branch_code VARCHAR(20),

    -- Professional Information (JSONB for flexibility)
    specializations JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',

    -- Status & Compliance
    status VARCHAR(20) DEFAULT 'pending',
    compliance_status VARCHAR(20) DEFAULT 'pending',
    rag_score DECIMAL(5,2),
    rag_status VARCHAR(20) DEFAULT 'amber',

    -- Metadata
    notes TEXT,
    created_by VARCHAR(100) DEFAULT 'web_form',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Indexes for performance
CREATE INDEX idx_contractors_status ON contractors(status);
CREATE INDEX idx_contractors_rag_status ON contractors(rag_status);
CREATE INDEX idx_contractors_company_name ON contractors(company_name);
CREATE INDEX idx_contractors_email ON contractors(email);
CREATE INDEX idx_contractors_registration ON contractors(registration_number);

-- Contractor teams table
CREATE TABLE contractor_teams (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
    team_name VARCHAR(255) NOT NULL,
    description TEXT,
    specialization VARCHAR(100),
    capacity_percentage INTEGER DEFAULT 100,
    availability_status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team members table
CREATE TABLE contractor_team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES contractor_teams(id) ON DELETE CASCADE,
    member_name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    certifications JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    availability_status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contractor documents table (metadata only)
CREATE TABLE contractor_documents (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT, -- Legacy Firebase URL (being phased out)
    file_size BIGINT,
    mime_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    approved_by INTEGER,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    expiry_date DATE,
    storage_type VARCHAR(20) DEFAULT 'neon', -- 'firebase', 'neon'
    storage_id UUID REFERENCES contractor_file_storage(id), -- Link to file storage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dedicated file storage table (Neon PostgreSQL - NEW)
CREATE TABLE contractor_file_storage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id INTEGER NOT NULL REFERENCES contractor_documents(id) ON DELETE CASCADE,
    file_data BYTEA NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for integrity
    compression_type VARCHAR(20) DEFAULT 'none', -- 'none', 'gzip'
    original_size BIGINT NOT NULL,
    compressed_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG scoring history table
CREATE TABLE contractor_rag_history (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
    financial_score DECIMAL(5,2),
    compliance_score DECIMAL(5,2),
    performance_score DECIMAL(5,2),
    safety_score DECIMAL(5,2),
    overall_score DECIMAL(5,2),
    rag_status VARCHAR(20),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculated_by VARCHAR(100)
);

-- Onboarding stages table
CREATE TABLE contractor_onboarding_stages (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'not_started',
    progress_percentage INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Database Design Principles**
- **No ORM**: Direct SQL queries with template literals
- **JSONB Fields**: Flexible data storage for specializations, certifications, tags
- **Comprehensive Indexing**: Optimized for common query patterns
- **Foreign Key Relationships**: Data integrity with cascading deletes
- **Audit Trails**: Complete history tracking for RAG scores and activities

---

## 🔌 API Architecture

### **API Design Principles**
- **RESTful Design**: Standard HTTP methods and status codes
- **Consistent Responses**: Unified response format
- **Error Handling**: Comprehensive error messages
- **Security**: Authentication and authorization middleware
- **Performance**: Efficient queries and caching

### **API Response Format**
```typescript
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
}

interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    timestamp: string;
}
```

### **Authentication & Authorization**
- **Clerk Integration**: JWT-based authentication
- **Role-Based Access**: Different permissions for different user roles
- **Project Isolation**: Data separated by project context
- **Audit Logging**: All API calls logged for security

---

## 🎨 UI Architecture

### **Component Architecture**
- **Modular Design**: Reusable components with clear responsibilities
- **Consistent Styling**: TailwindCSS with design system
- **Type Safety**: Full TypeScript integration
- **State Management**: React hooks with local state
- **Form Handling**: React Hook Form with Zod validation

### **Design System**
- **Colors**: Primary blue (#3B82F6), success green (#10B981), warning amber (#F59E0B), error red (#EF4444)
- **Typography**: Inter font with consistent size scale
- **Spacing**: Consistent margin/padding scale
- **Components**: Standardized buttons, cards, forms, modals

### **Responsive Design**
- **Mobile-First**: Optimized for mobile devices
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-Friendly**: Appropriate touch targets for mobile
- **Performance**: Optimized images and lazy loading

---

## 📊 Monitoring & Observability

### **Performance Monitoring**
- **API Response Times**: Track all endpoint performance
- **Database Query Performance**: Monitor slow queries
- **Error Rates**: Track API and application errors
- **User Experience**: Core Web Vitals monitoring

### **Health Checks**
- **Database Connectivity**: Verify database connections
- **External Services**: Monitor Firebase Storage availability
- **API Endpoints**: Check endpoint responsiveness
- **System Resources**: Monitor memory and CPU usage

### **Logging Strategy**
- **Structured Logging**: JSON format for easy parsing
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Correlation IDs**: Track requests across services
- **Sensitive Data**: Automatic filtering of sensitive information

---

## 🔒 Security Architecture

### **Authentication**
- **Clerk Integration**: Professional authentication service
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Secure session handling
- **Multi-factor**: Optional MFA support

### **Authorization**
- **Role-Based Access Control**: Different permissions for different roles
- **Project-Level Isolation**: Data separation by project
- **Resource-Based Access**: Granular permission control
- **Audit Trails**: Complete access logging

### **Data Security**
- **Encryption**: Data encryption at rest and in transit
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Security**: Secure file handling and validation

---

## 🚀 Deployment Architecture

### **Environment Configuration**
- **Development**: Local development with hot reload
- **Staging**: Production-like environment for testing
- **Production**: Optimized for performance and security

### **Build Process**
- **TypeScript Compilation**: Strict type checking
- **Asset Optimization**: Image and code optimization
- **Bundle Analysis**: Monitor bundle size
- **Performance Testing**: Automated performance checks

### **Infrastructure**
- **Vercel Deployment**: Serverless deployment platform
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Firebase Storage**: Scalable file storage
- **CDN**: Global content delivery network

---

## 🔄 Integration Architecture

### **Internal Integrations**
- **Authentication**: Clerk integration for user management
- **Database**: Neon PostgreSQL for primary data storage
- **Storage**: Firebase Storage for document management
- **Monitoring**: Application performance monitoring

### **External Integrations**
- **Email Services**: Notification and communication
- **File Processing**: Document OCR and validation
- **Payment Systems**: Financial transaction processing
- **GIS Systems**: Mapping and location services

---

*Document Version: 1.0*
*Last Updated: September 22, 2025*
*Architecture Status: Production Ready*