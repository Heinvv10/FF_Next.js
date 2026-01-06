/**
 * Staff Project Assignment Types
 * Links staff members to projects with roles and dates
 */

export interface StaffProject {
  id: string;
  staffId: string;
  projectId: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  project?: {
    id: string;
    name: string;
    status: string;
    client?: string;
  };
  staff?: {
    id: string;
    name: string;
    email?: string;
    position?: string;
  };
  assignedByStaff?: {
    id: string;
    name: string;
  };
}

export interface StaffProjectAssignment {
  staffId: string;
  projectId: string;
  role?: string;
  startDate?: string;
  endDate?: string;
}

export interface StaffProjectUpdate {
  role?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface ProjectStaffSummary {
  projectId: string;
  projectName: string;
  totalStaff: number;
  activeStaff: number;
  staffByRole: Record<string, number>;
}

export interface StaffProjectSummary {
  staffId: string;
  staffName: string;
  totalProjects: number;
  activeProjects: number;
  projectNames: string[];
}

// Common roles for staff on projects
export const PROJECT_ROLES = [
  'Project Manager',
  'Site Manager',
  'Team Lead',
  'Supervisor',
  'Technician',
  'Quality Inspector',
  'Safety Officer',
  'Administrator',
  'Support'
] as const;

export type ProjectRole = typeof PROJECT_ROLES[number];

export const PROJECT_ROLE_DESCRIPTIONS: Record<ProjectRole, string> = {
  'Project Manager': 'Overall project responsibility and coordination',
  'Site Manager': 'On-site operations management',
  'Team Lead': 'Team coordination and task allocation',
  'Supervisor': 'Day-to-day supervision of work',
  'Technician': 'Technical installation and maintenance',
  'Quality Inspector': 'Quality assurance and compliance',
  'Safety Officer': 'Health and safety oversight',
  'Administrator': 'Administrative support',
  'Support': 'General support functions'
};
