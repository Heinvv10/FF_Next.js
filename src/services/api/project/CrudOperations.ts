/**
 * Project CRUD Operations
 * Create, Update, Delete operations for projects
 */

import { ProjectFormData } from '@/types/project.types';
import { log } from '@/lib/logger';

const API_BASE = '/api';

export class ProjectCrudOperations {
  /**
   * Create a new project
   */
  static async createProject(data: ProjectFormData): Promise<string> {
    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_code: data.code,
          project_name: data.name,
          client_id: data.clientId,
          description: data.description,
          project_type: data.projectType,
          status: data.status || 'PLANNING',
          priority: data.priority || 'MEDIUM',
          start_date: data.startDate,
          end_date: data.endDate,
          budget: data.budget,
          project_manager: data.projectManagerId,
          location: data.location,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.status}`);
      }

      const result = await response.json();
      return result.data?.id || '';
    } catch (error) {
      log.error('Error creating project:', { error, data }, 'projectApi');
      throw error;
    }
  }

  /**
   * Update an existing project
   */
  static async updateProject(id: string, data: Partial<ProjectFormData>): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/projects?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: data.name,
          project_code: data.code,
          client_id: data.clientId,
          description: data.description,
          project_type: data.projectType,
          status: data.status,
          priority: data.priority,
          start_date: data.startDate,
          end_date: data.endDate,
          budget: data.budget,
          project_manager: data.projectManagerId,
          location: data.location,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.status}`);
      }
    } catch (error) {
      log.error('Error updating project:', { error, id, data }, 'projectApi');
      throw error;
    }
  }

  /**
   * Delete a project
   */
  static async deleteProject(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/projects?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.status}`);
      }
    } catch (error) {
      log.error('Error deleting project:', { error, id }, 'projectApi');
      throw error;
    }
  }
}
