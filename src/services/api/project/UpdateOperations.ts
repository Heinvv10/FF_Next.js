/**
 * Project Update Operations
 * Specific field update operations for projects
 */

import { log } from '@/lib/logger';

const API_BASE = '/api';

export class ProjectUpdateOperations {
  /**
   * Update project status
   */
  static async updateProjectStatus(id: string, status: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/projects?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project status: ${response.status}`);
      }
    } catch (error) {
      log.error('Error updating project status:', { error, id, status }, 'projectApi');
      throw error;
    }
  }

  /**
   * Update project progress
   */
  static async updateProjectProgress(id: string, progress: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/projects?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project progress: ${response.status}`);
      }
    } catch (error) {
      log.error('Error updating project progress:', { error, id, progress }, 'projectApi');
      throw error;
    }
  }

  /**
   * Update project budget
   */
  static async updateProjectBudget(id: string, budget: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/projects?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ budget }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project budget: ${response.status}`);
      }
    } catch (error) {
      log.error('Error updating project budget:', { error, id, budget }, 'projectApi');
      throw error;
    }
  }

  /**
   * Assign project to client
   */
  static async assignProjectToClient(projectId: string, clientId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/projects?id=${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ client_id: clientId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to assign project to client: ${response.status}`);
      }
    } catch (error) {
      log.error('Error assigning project to client:', { error, projectId, clientId }, 'projectApi');
      throw error;
    }
  }

  /**
   * Update project dates
   */
  static async updateProjectDates(
    id: string,
    startDate?: Date | null,
    endDate?: Date | null
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/projects?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project dates: ${response.status}`);
      }
    } catch (error) {
      log.error('Error updating project dates:', { error, id, startDate, endDate }, 'projectApi');
      throw error;
    }
  }
}
