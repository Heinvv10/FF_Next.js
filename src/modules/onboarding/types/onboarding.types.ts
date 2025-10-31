/**
 * Generic Onboarding Module Types
 * Reusable across contractors, suppliers, staff, partners
 */

export type EntityType = 'contractor' | 'supplier' | 'staff' | 'partner';

export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';

export type WorkflowStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Onboarding Workflow
 * Represents a complete onboarding process for an entity
 */
export interface OnboardingWorkflow {
  id: string;
  entityType: EntityType;
  entityId: string;
  workflowTemplate: string; // e.g., 'contractor_basic', 'supplier_preferred'
  overallStatus: WorkflowStatus;
  completionPercentage: number;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Onboarding Stage
 * Individual step in the onboarding workflow
 */
export interface OnboardingStage {
  id: string;
  workflowId: string;
  stageName: string;
  stageOrder: number;
  status: StageStatus;
  requiredDocuments: string[]; // Array of required document types
  completedDocuments: string[]; // Array of uploaded document IDs
  assignedTo?: string; // Who needs to review this stage
  completionPercentage: number;
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: string;
  dueDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workflow Template
 * Predefined workflow configurations
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  entityType: EntityType;
  description: string;
  stages: StageTemplate[];
  estimatedDuration?: number; // Days
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Stage Template
 * Predefined stage configuration
 */
export interface StageTemplate {
  stageName: string;
  stageOrder: number;
  requiredDocuments: string[];
  isRequired: boolean;
  estimatedDuration?: number; // Days
  instructions?: string;
  assignedRole?: string; // e.g., 'admin', 'compliance_officer'
}

/**
 * Onboarding Progress Summary
 * High-level overview of workflow progress
 */
export interface OnboardingProgress {
  workflowId: string;
  overallStatus: WorkflowStatus;
  completionPercentage: number;
  totalStages: number;
  completedStages: number;
  pendingStages: number;
  blockedStages: number;
  currentStage?: OnboardingStage;
  nextStage?: OnboardingStage;
  estimatedCompletion?: Date;
}

/**
 * Start Workflow Request
 */
export interface StartWorkflowRequest {
  entityType: EntityType;
  entityId: string;
  workflowTemplate: string;
  createdBy: string;
}

/**
 * Update Stage Request
 */
export interface UpdateStageRequest {
  status?: StageStatus;
  completedDocuments?: string[];
  assignedTo?: string;
  completedBy?: string;
  notes?: string;
}

/**
 * Complete Workflow Request
 */
export interface CompleteWorkflowRequest {
  completedBy: string;
  notes?: string;
}

/**
 * Workflow Filter Options
 */
export interface WorkflowFilterOptions {
  entityType?: EntityType;
  status?: WorkflowStatus;
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
}
