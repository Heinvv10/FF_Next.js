/**
 * Staff Project Service
 * Handles staff-project assignment operations
 */

import { createLogger } from '@/lib/logger';
import type {
  StaffProject,
  StaffProjectAssignment,
  StaffProjectUpdate,
  ProjectStaffSummary,
  StaffProjectSummary,
} from '@/types/staff-project.types';

const logger = createLogger('StaffProjectService');

// API base URL
const API_BASE = '/api';

class StaffProjectServiceClass {
  /**
   * Get all projects assigned to a staff member
   */
  async getByStaffId(staffId: string, activeOnly: boolean = false): Promise<StaffProject[]> {
    try {
      const params = new URLSearchParams();
      if (activeOnly) params.set('activeOnly', 'true');

      const queryString = params.toString();
      const url = `${API_BASE}/staff/${staffId}/projects${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch staff projects');
      }

      const data = await response.json();
      return data.projects || [];
    } catch (error: unknown) {
      logger.error('Failed to fetch staff projects', { staffId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get all staff assigned to a project
   */
  async getByProjectId(projectId: string, activeOnly: boolean = false): Promise<StaffProject[]> {
    try {
      const params = new URLSearchParams();
      if (activeOnly) params.set('activeOnly', 'true');

      const queryString = params.toString();
      const url = `${API_BASE}/projects/${projectId}/staff${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch project staff');
      }

      const data = await response.json();
      return data.staff || [];
    } catch (error: unknown) {
      logger.error('Failed to fetch project staff', { projectId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Assign a staff member to a project
   */
  async assign(assignment: StaffProjectAssignment): Promise<StaffProject> {
    try {
      const response = await fetch(`${API_BASE}/staff/${assignment.staffId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign staff to project');
      }

      const data = await response.json();
      logger.info('Staff assigned to project', { staffId: assignment.staffId, projectId: assignment.projectId });
      return data.assignment;
    } catch (error: unknown) {
      logger.error('Failed to assign staff to project', { assignment, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Update a staff-project assignment
   */
  async update(assignmentId: string, updates: StaffProjectUpdate): Promise<StaffProject> {
    try {
      const response = await fetch(`${API_BASE}/staff-projects/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update assignment');
      }

      const data = await response.json();
      logger.info('Assignment updated', { assignmentId });
      return data.assignment;
    } catch (error: unknown) {
      logger.error('Failed to update assignment', { assignmentId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Remove a staff member from a project
   */
  async unassign(staffId: string, projectId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/staff/${staffId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unassign staff from project');
      }

      logger.info('Staff unassigned from project', { staffId, projectId });
    } catch (error: unknown) {
      logger.error('Failed to unassign staff from project', { staffId, projectId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Deactivate a staff-project assignment (soft delete)
   */
  async deactivate(assignmentId: string): Promise<StaffProject> {
    return this.update(assignmentId, { isActive: false });
  }

  /**
   * Reactivate a staff-project assignment
   */
  async reactivate(assignmentId: string): Promise<StaffProject> {
    return this.update(assignmentId, { isActive: true });
  }

  /**
   * Update the role for an assignment
   */
  async updateRole(assignmentId: string, role: string): Promise<StaffProject> {
    return this.update(assignmentId, { role });
  }

  /**
   * Get summary of staff assigned to a project
   */
  async getProjectStaffSummary(projectId: string): Promise<ProjectStaffSummary> {
    try {
      const staff = await this.getByProjectId(projectId);

      const activeStaff = staff.filter(s => s.isActive);
      const staffByRole: Record<string, number> = {};

      activeStaff.forEach(s => {
        const role = s.role || 'Unassigned';
        staffByRole[role] = (staffByRole[role] || 0) + 1;
      });

      return {
        projectId,
        projectName: staff[0]?.project?.name || '',
        totalStaff: staff.length,
        activeStaff: activeStaff.length,
        staffByRole,
      };
    } catch (error: unknown) {
      logger.error('Failed to get project staff summary', { projectId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get summary of projects assigned to a staff member
   */
  async getStaffProjectSummary(staffId: string): Promise<StaffProjectSummary> {
    try {
      const projects = await this.getByStaffId(staffId);

      const activeProjects = projects.filter(p => p.isActive);
      const projectNames = activeProjects.map(p => p.project?.name || 'Unknown').filter(Boolean);

      return {
        staffId,
        staffName: projects[0]?.staff?.name || '',
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        projectNames,
      };
    } catch (error: unknown) {
      logger.error('Failed to get staff project summary', { staffId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Bulk assign multiple staff to a project
   */
  async bulkAssign(
    projectId: string,
    assignments: Array<{ staffId: string; role?: string }>
  ): Promise<StaffProject[]> {
    try {
      const results: StaffProject[] = [];

      for (const assignment of assignments) {
        const result = await this.assign({
          staffId: assignment.staffId,
          projectId,
          role: assignment.role,
        });
        results.push(result);
      }

      logger.info('Bulk assignment complete', { projectId, count: assignments.length });
      return results;
    } catch (error: unknown) {
      logger.error('Failed bulk assignment', { projectId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }
}

// Export singleton instance
export const staffProjectService = new StaffProjectServiceClass();

// Export class for testing
export { StaffProjectServiceClass };
