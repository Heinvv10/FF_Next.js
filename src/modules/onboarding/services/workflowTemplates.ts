/**
 * Predefined Onboarding Workflow Templates
 * Defines standard workflows for different entity types
 */

import { WorkflowTemplate, EntityType } from '../types/onboarding.types';

/**
 * Contractor Onboarding Templates
 */
export const CONTRACTOR_BASIC_TEMPLATE: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
  name: 'Contractor Basic Onboarding',
  entityType: 'contractor',
  description: 'Standard onboarding workflow for new contractors',
  estimatedDuration: 14, // 2 weeks
  isActive: true,
  stages: [
    {
      stageName: 'Company Registration',
      stageOrder: 1,
      requiredDocuments: ['cipc_registration', 'company_profile', 'bbbee_certificate'],
      isRequired: true,
      estimatedDuration: 2,
      instructions: 'Upload company registration documents and B-BBEE certificate',
      assignedRole: 'admin',
    },
    {
      stageName: 'Financial Documentation',
      stageOrder: 2,
      requiredDocuments: ['tax_clearance', 'vat_certificate', 'bank_confirmation'],
      isRequired: true,
      estimatedDuration: 3,
      instructions: 'Provide tax clearance, VAT certificate, and bank confirmation letter',
      assignedRole: 'finance_officer',
    },
    {
      stageName: 'Insurance & Compliance',
      stageOrder: 3,
      requiredDocuments: ['liability_insurance', 'workers_compensation', 'safety_certificate'],
      isRequired: true,
      estimatedDuration: 3,
      instructions: 'Upload insurance policies and safety certificates',
      assignedRole: 'compliance_officer',
    },
    {
      stageName: 'Technical Qualifications',
      stageOrder: 4,
      requiredDocuments: ['technical_certifications', 'references'],
      isRequired: false,
      estimatedDuration: 2,
      instructions: 'Provide technical certifications and client references',
      assignedRole: 'technical_lead',
    },
    {
      stageName: 'Final Review',
      stageOrder: 5,
      requiredDocuments: [],
      isRequired: true,
      estimatedDuration: 4,
      instructions: 'Final review and approval by management',
      assignedRole: 'manager',
    },
  ],
};

export const CONTRACTOR_EXPRESS_TEMPLATE: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
  name: 'Contractor Express Onboarding',
  entityType: 'contractor',
  description: 'Fast-track onboarding for trusted contractors',
  estimatedDuration: 7, // 1 week
  isActive: true,
  stages: [
    {
      stageName: 'Essential Documents',
      stageOrder: 1,
      requiredDocuments: ['cipc_registration', 'tax_clearance', 'liability_insurance'],
      isRequired: true,
      estimatedDuration: 2,
      instructions: 'Upload essential documents only',
      assignedRole: 'admin',
    },
    {
      stageName: 'Quick Review',
      stageOrder: 2,
      requiredDocuments: [],
      isRequired: true,
      estimatedDuration: 5,
      instructions: 'Expedited review and approval',
      assignedRole: 'manager',
    },
  ],
};

/**
 * Supplier Onboarding Templates
 */
export const SUPPLIER_BASIC_TEMPLATE: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
  name: 'Supplier Basic Onboarding',
  entityType: 'supplier',
  description: 'Standard onboarding workflow for new suppliers',
  estimatedDuration: 10, // 10 days
  isActive: true,
  stages: [
    {
      stageName: 'Company Verification',
      stageOrder: 1,
      requiredDocuments: ['company_registration', 'tax_clearance'],
      isRequired: true,
      estimatedDuration: 2,
      instructions: 'Verify company registration and tax compliance',
      assignedRole: 'procurement_officer',
    },
    {
      stageName: 'Quality Certification',
      stageOrder: 2,
      requiredDocuments: ['quality_certificates', 'product_specifications'],
      isRequired: true,
      estimatedDuration: 3,
      instructions: 'Review quality certifications and product specs',
      assignedRole: 'quality_manager',
    },
    {
      stageName: 'Contract Negotiation',
      stageOrder: 3,
      requiredDocuments: ['supplier_agreement'],
      isRequired: true,
      estimatedDuration: 5,
      instructions: 'Negotiate and sign supplier agreement',
      assignedRole: 'procurement_manager',
    },
  ],
};

/**
 * Staff Onboarding Templates
 */
export const STAFF_BASIC_TEMPLATE: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
  name: 'Staff Basic Onboarding',
  entityType: 'staff',
  description: 'Standard onboarding workflow for new staff members',
  estimatedDuration: 7, // 1 week
  isActive: true,
  stages: [
    {
      stageName: 'Document Collection',
      stageOrder: 1,
      requiredDocuments: ['id_document', 'proof_of_address', 'qualifications'],
      isRequired: true,
      estimatedDuration: 1,
      instructions: 'Submit personal documents and qualifications',
      assignedRole: 'hr_officer',
    },
    {
      stageName: 'System Setup',
      stageOrder: 2,
      requiredDocuments: [],
      isRequired: true,
      estimatedDuration: 2,
      instructions: 'Create user accounts and system access',
      assignedRole: 'it_admin',
    },
    {
      stageName: 'Training',
      stageOrder: 3,
      requiredDocuments: ['training_completion'],
      isRequired: true,
      estimatedDuration: 4,
      instructions: 'Complete onboarding training modules',
      assignedRole: 'training_coordinator',
    },
  ],
};

/**
 * Get template by name
 */
export function getTemplateByName(templateName: string): Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> | null {
  const templates: Record<string, Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>> = {
    'contractor_basic': CONTRACTOR_BASIC_TEMPLATE,
    'contractor_express': CONTRACTOR_EXPRESS_TEMPLATE,
    'supplier_basic': SUPPLIER_BASIC_TEMPLATE,
    'staff_basic': STAFF_BASIC_TEMPLATE,
  };

  return templates[templateName] || null;
}

/**
 * Get all templates for an entity type
 */
export function getTemplatesByEntityType(entityType: EntityType): Array<Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>> {
  const allTemplates = [
    CONTRACTOR_BASIC_TEMPLATE,
    CONTRACTOR_EXPRESS_TEMPLATE,
    SUPPLIER_BASIC_TEMPLATE,
    STAFF_BASIC_TEMPLATE,
  ];

  return allTemplates.filter(t => t.entityType === entityType);
}

/**
 * Get all active templates
 */
export function getAllActiveTemplates(): Array<Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>> {
  return [
    CONTRACTOR_BASIC_TEMPLATE,
    CONTRACTOR_EXPRESS_TEMPLATE,
    SUPPLIER_BASIC_TEMPLATE,
    STAFF_BASIC_TEMPLATE,
  ].filter(t => t.isActive);
}
