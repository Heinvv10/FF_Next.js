/**
 * Contractor Project Assignment Types
 * Created: Nov 3, 2025
 *
 * Defines the data structure for managing contractor assignments to projects.
 * Tracks roles, timelines, workload, and performance metrics.
 */

// ==================== CORE INTERFACE ====================

export interface ContractorProject {
  id: number;
  contractorId: string; // UUID
  projectId: string;    // UUID

  // Assignment Details
  role: string; // e.g., "Fiber Splicing", "Installation Lead", "Survey Technician"
  assignmentStatus: AssignmentStatus;

  // Timeline
  startDate: Date;
  endDate?: Date;
  actualEndDate?: Date;

  // Workload & Capacity
  workloadPercentage: number; // 0-100
  estimatedHours?: number;
  actualHours?: number;

  // Performance Tracking
  performanceRating?: number; // 0-5 rating
  qualityScore?: number;
  safetyIncidents?: number;

  // Financial
  contractValue?: number;
  paymentTerms?: string;

  // Status
  isPrimaryContractor: boolean;
  isActive: boolean;

  // Metadata
  notes?: string;
  removalReason?: string;

  // Audit
  assignedBy?: string;
  removedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== EXTENDED WITH RELATIONS ====================

/**
 * Contractor Project Assignment with contractor and project details
 * Used for display in lists and detail views
 */
export interface ContractorProjectWithDetails extends ContractorProject {
  // Contractor info
  companyName: string;
  contactPerson: string;
  email: string;
  contractorStatus: string;

  // Project info
  projectName: string;
  projectCode: string;
  projectStatus: string;
}

// ==================== ENUMS & TYPES ====================

export type AssignmentStatus =
  | 'assigned'    // Assigned but not yet started
  | 'active'      // Currently working on project
  | 'completed'   // Successfully completed assignment
  | 'removed'     // Removed from project
  | 'suspended';  // Temporarily suspended

// ==================== FORM DATA ====================

export interface ContractorProjectFormData {
  contractorId: string;
  projectId: string;
  role: string;
  assignmentStatus?: AssignmentStatus;
  startDate: Date;
  endDate?: Date;
  workloadPercentage?: number;
  estimatedHours?: number;
  contractValue?: number;
  paymentTerms?: string;
  isPrimaryContractor?: boolean;
  notes?: string;
}

// ==================== UPDATE DATA ====================

export interface ContractorProjectUpdateData {
  role?: string;
  assignmentStatus?: AssignmentStatus;
  startDate?: Date;
  endDate?: Date;
  actualEndDate?: Date;
  workloadPercentage?: number;
  estimatedHours?: number;
  actualHours?: number;
  performanceRating?: number;
  qualityScore?: number;
  safetyIncidents?: number;
  contractValue?: number;
  paymentTerms?: string;
  isPrimaryContractor?: boolean;
  isActive?: boolean;
  notes?: string;
  removalReason?: string;
}

// ==================== FILTERS ====================

export interface ContractorProjectFilter {
  contractorId?: string;
  projectId?: string;
  assignmentStatus?: AssignmentStatus[];
  role?: string[];
  isActive?: boolean;
  isPrimaryContractor?: boolean;
  startDateFrom?: Date;
  startDateTo?: Date;
}

// ==================== ANALYTICS ====================

export interface ContractorProjectAnalytics {
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
  averageWorkloadPercentage: number;
  totalContractValue: number;
  byStatus: {
    assigned: number;
    active: number;
    completed: number;
    removed: number;
    suspended: number;
  };
}

// ==================== CONSTANTS ====================

export const ASSIGNMENT_STATUSES: { value: AssignmentStatus; label: string; color: string }[] = [
  { value: 'assigned', label: 'Assigned', color: 'blue' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'completed', label: 'Completed', color: 'gray' },
  { value: 'removed', label: 'Removed', color: 'red' },
  { value: 'suspended', label: 'Suspended', color: 'yellow' },
];

export const CONTRACTOR_ROLES = [
  'Fiber Splicing',
  'Installation Lead',
  'Survey Technician',
  'Excavation Crew',
  'Cable Pulling',
  'Testing & Commissioning',
  'Project Supervisor',
  'General Labor',
  'Equipment Operator',
  'Safety Officer',
];

// ==================== VALIDATION ====================

export const CONTRACTOR_PROJECT_VALIDATION = {
  role: {
    minLength: 2,
    maxLength: 100,
    required: true,
  },
  workloadPercentage: {
    min: 0,
    max: 100,
    required: true,
  },
  performanceRating: {
    min: 0,
    max: 5,
  },
};
