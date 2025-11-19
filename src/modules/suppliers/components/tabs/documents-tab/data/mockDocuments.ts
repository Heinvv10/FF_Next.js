// ============= Mock Documents Data =============
// Sample document data for development/testing

import type { SupplierDocument } from '../types/documents.types';

export const mockDocuments: SupplierDocument[] = [
  {
    id: 'doc-001',
    name: 'Master Service Agreement',
    type: 'contract',
    supplierId: 'supplier-001',
    supplierName: 'TechFlow Solutions',
    status: 'current',
    uploadDate: '2023-01-15',
    expiryDate: '2024-12-31',
    fileSize: 2048576,
    fileType: 'PDF',
    version: 2,
    description: 'Primary service agreement covering all technology services',
    isRequired: true,
    reviewedBy: 'John Smith',
    reviewDate: '2023-01-20',
    tags: ['primary', 'technology', 'services']
  },
  {
    id: 'doc-002',
    name: 'ISO 27001 Certificate',
    type: 'certificate',
    supplierId: 'supplier-001',
    supplierName: 'TechFlow Solutions',
    status: 'expiring_soon',
    uploadDate: '2023-06-01',
    expiryDate: '2024-06-01',
    fileSize: 1024768,
    fileType: 'PDF',
    version: 1,
    description: 'Information Security Management System certification',
    isRequired: true,
    reviewedBy: 'Sarah Johnson',
    reviewDate: '2023-06-05',
    tags: ['security', 'iso', 'certification']
  },
  {
    id: 'doc-003',
    name: 'General Liability Insurance',
    type: 'insurance',
    supplierId: 'supplier-002',
    supplierName: 'Global Materials Inc',
    status: 'current',
    uploadDate: '2023-03-10',
    expiryDate: '2025-03-10',
    fileSize: 1536000,
    fileType: 'PDF',
    version: 1,
    description: 'General liability insurance coverage certificate',
    isRequired: true,
    reviewedBy: 'Mike Johnson',
    reviewDate: '2023-03-15',
    tags: ['insurance', 'liability', 'coverage']
  },
  {
    id: 'doc-004',
    name: 'ASTM Compliance Report',
    type: 'compliance',
    supplierId: 'supplier-002',
    supplierName: 'Global Materials Inc',
    status: 'pending_review',
    uploadDate: '2024-01-20',
    fileSize: 3072000,
    fileType: 'PDF',
    version: 1,
    description: 'Annual ASTM standards compliance assessment',
    isRequired: true,
    tags: ['astm', 'compliance', 'materials']
  },
  {
    id: 'doc-005',
    name: 'Financial Statements 2023',
    type: 'financial',
    supplierId: 'supplier-003',
    supplierName: 'Premium Services Ltd',
    status: 'current',
    uploadDate: '2024-01-05',
    fileSize: 2560000,
    fileType: 'PDF',
    version: 1,
    description: 'Audited financial statements for fiscal year 2023',
    isRequired: false,
    reviewedBy: 'Finance Team',
    reviewDate: '2024-01-10',
    tags: ['financial', 'statements', '2023']
  }
];
